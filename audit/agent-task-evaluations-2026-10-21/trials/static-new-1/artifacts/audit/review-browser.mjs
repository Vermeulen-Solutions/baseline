import { chromium } from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:4312';
const routes=['/','/services/','/about/','/contact/'];
const browser=await chromium.launch();
const page=await browser.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const evidence=[];
for (const width of [320,390,768,1440]) {
  await page.setViewportSize({width,height:1000});
  for(const route of routes){
    const response=await page.goto(origin+route,{waitUntil:'networkidle'});
    await page.evaluate(()=>document.fonts.ready);
    const data=await page.evaluate(()=>({
      title:document.title,h1:[...document.querySelectorAll('h1')].map(e=>e.textContent),
      overflow:document.documentElement.scrollWidth>innerWidth,
      action:[...document.querySelectorAll('.project-action')].map(e=>({label:e.textContent,href:e.getAttribute('href')})),
      navigation:[...document.querySelectorAll('.primary-nav a')].map(e=>({label:e.textContent,href:e.getAttribute('href'),current:e.getAttribute('aria-current')})),
      fonts:{heading:getComputedStyle(document.querySelector('h1')).fontFamily,body:getComputedStyle(document.body).fontFamily},
      forms:document.forms.length,scripts:[...document.scripts].filter(e=>e.type!=='application/ld+json').length,
      background:getComputedStyle(document.documentElement).backgroundColor,
    }));
    assert.equal(response.status(),200);assert.equal(data.overflow,false,route+' overflow '+width);assert.equal(data.h1.length,1);
    assert.equal(data.forms,0);assert.equal(data.scripts,0);assert.equal(data.action.length,1);
    assert.deepEqual(data.action[0],{label:'Discuss your project',href:'mailto:hello@northline.example.test'});
    assert.equal(data.navigation.filter(n=>n.current==='page').length,1);
    if(route==='/') assert.equal(data.h1[0],'Practical planning for small businesses.');
    if(route==='/contact/') assert.equal(data.h1[0],'Tell us about your space.');
    if([390,1440].includes(width)){
      const name=(route==='/'?'home':route.replaceAll('/',''))+'-'+width+'.png';
      await page.screenshot({path:'audit/screenshots/'+name,fullPage:true});
      if(route==='/') await page.screenshot({path:'.impeccable/review/'+(width===1440?'desktop':'mobile')+'.png',fullPage:true});
    }
    evidence.push({route,width,status:response.status(),...data});
  }
}
await page.setViewportSize({width:1440,height:1000});await page.goto(origin);
await page.keyboard.press('Tab'); assert.equal(await page.locator(':focus').textContent(),'Skip to content');
await page.keyboard.press('Enter');assert.equal(await page.locator(':focus').getAttribute('id'),'main-content');
await page.goto(origin);await page.keyboard.press('Tab');await page.keyboard.press('Tab');
assert.equal(await page.locator(':focus').textContent(),'Northline Planning');
const focus=await page.locator(':focus').evaluate(e=>({outline:getComputedStyle(e).outlineStyle,width:getComputedStyle(e).outlineWidth}));assert.equal(focus.outline,'solid');
await page.screenshot({path:'audit/screenshots/keyboard-focus.png'});
for(const route of routes){await page.locator(`.primary-nav a[href="${route}"]`).click();assert.equal(new URL(page.url()).pathname,route);}
const missing=await page.goto(origin+'/missing-page/');assert.equal(missing.status(),404);
const styleguide=await page.goto(origin+'/_styleguide/');assert.equal(styleguide.status(),404);
await page.setViewportSize({width:320,height:900});await page.goto(origin+'/contact/');
await page.addStyleTag({content:'html{font-size:200%} * {letter-spacing:0.12em !important;word-spacing:0.16em !important;line-height:1.5 !important} p{margin-bottom:2em !important}'});
const textReflow=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,email:document.querySelector('.contact-email').getBoundingClientRect().width}));
assert.equal(textReflow.overflow,false);
await page.screenshot({path:'audit/screenshots/contact-text-spacing-320.png',fullPage:true});
assert.deepEqual(errors,[]);
fs.writeFileSync('audit/browser-review.json',JSON.stringify({origin,evidence,keyboard:{skipLink:true,skipActivation:true,brandFocus:focus,navigationClicks:true},missingStatus:missing.status(),styleguideStatus:styleguide.status(),textReflow,pageErrors:errors},null,2));
console.log('PASS: 16 route/viewport combinations; navigation clicks; visible keyboard focus and skip link; primary email targets; 320px text-spacing/200% text stress; production styleguide 404; no page errors.');
await browser.close();
