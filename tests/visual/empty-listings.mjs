import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
import { startVisualSite } from './site.mjs';

if(process.platform!=='win32' || process.env.CI || process.env.GITHUB_ACTIONS==='true')throw new Error('Local Windows browser rehearsal only');
const report=path.resolve('.emdash/visual/empty-listings');
const site=await startVisualSite(process.cwd(),report,{devOnly:true,expectWelcome:false,prepareStage:async({stage})=>{
  const target=path.join(stage,'seed/seed.json');const seed=JSON.parse(await fs.readFile(target,'utf8'));seed.content.posts=[];await fs.writeFile(target,JSON.stringify(seed));
}});
const browser=await chromium.launch({channel:'chromium'});
try {
  const page=await browser.newPage({viewport:{width:320,height:900}});const rows=[];
  for(const route of ['/','/posts','/category/general','/tag/starter']) {
    const response=await page.goto(site.origin+route);expect(response.status()).toBe(200);
    await expect(page.locator('main')).toContainText(/No posts/);await expect(page.locator('main .collection-list')).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
    rows.push({route,status:response.status(),emptyState:true,emptyListOmitted:true});
  }
  await fs.writeFile(path.join(report,'receipt.json'),JSON.stringify({freshSeed:true,workingContentTouched:false,rows},null,2)+'\n');
  console.log('V07 empty listing rehearsal: four actual public routes passed.');
}finally{await browser.close();await site.cleanup();}
