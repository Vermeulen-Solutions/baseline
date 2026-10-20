import path from 'node:path';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { startVisualSite } from './site.mjs';
import { visualContract } from './contract.mjs';
import sharp from 'sharp';
import { localEmdashAdapter } from '../../scripts/media-ingest.mjs';
import { chromium, expect } from '@playwright/test';

export default async function setup() {
  const browsers = JSON.parse(await readFile('node_modules/playwright-core/browsers.json', 'utf8'));
  if (browsers.browsers.find(browser => browser.name === 'chromium').revision !== visualContract.chromiumRevision) throw new Error('Unexpected Chromium revision');
  const reportDir = path.resolve('.emdash/visual');
  await mkdir(reportDir, { recursive: true });
  let fixtureStage, fixtureOrigin;
  const site = await startVisualSite(process.cwd(), reportDir, { devOnly:process.env.VISUAL_DEV_ONLY === '1', prepareStage: async ({ stage, origin }) => {
    fixtureStage = stage; fixtureOrigin = origin;
    await copyFile('profiles/static/project/src/components/RichText.astro',path.join(stage,'src/components/StaticRichText.astro'));
    await writeFile(path.join(stage,'src/pages/editorial-spacing-fixture.astro'), `---
import SiteShell from '../layouts/SiteShell.astro';
import RichText from '../components/RichText.astro';
import StaticRichText from '../components/StaticRichText.astro';
import Card from '../components/Card.astro';
import Disclosure from '../components/Disclosure.astro';
import LogoTicker from '../components/LogoTicker.astro';
import Container from '../components/Container.astro';
import PhotoGallery from '../components/PhotoGallery.astro';
import media from '../dev/spacing-media.json';
const block=(text,rest={})=>({_type:'block',_key:text,style:'normal',markDefs:[],children:[{_type:'span',text,marks:[]}],...rest});
const values=[block('Opening'),block('Heading',{style:'h2'}),block('Paragraph'),block('Item one',{listItem:'bullet',level:1}),block('Nested',{listItem:'bullet',level:2}),block('Item two',{listItem:'bullet',level:1}),{_type:'image',_key:'media',asset:{url:media.url},width:400,height:300,alt:'Editorial control'},block('Quote',{style:'blockquote'}),block('Closing')];
---
<SiteShell title="Editorial geometry" spacingPolicy="automatic-v2">
<RichText id="controls" value={values} />
<div id="hidden-first" class="flow" data-editorial-content><p hidden>Hidden</p><p>First visible</p><p>Second visible</p></div>
<div id="only-media" class="flow" data-editorial-content><figure><img src={media.url} width="400" height="300" alt="Only media" /></figure></div>
<div id="composites" class="flow" data-editorial-content>
<Card title="Card in prose" href="#controls"><img slot="media" src={media.url} width="400" height="300" alt="Card media" /><p>Card body</p></Card>
<LogoTicker id="editorial-ticker" label="Editorial ticker"><li><img src={media.url} width="96" height="72" alt="" /><span>Logo</span></li></LogoTicker>
<Disclosure id="editorial-disclosure" open><span slot="summary">Body</span><RichText value={[block('Nested paragraph'),block('Second paragraph')]} /></Disclosure>
<PhotoGallery value={[{_type:'image',asset:{url:media.url},width:400,height:300,alt:'Gallery in prose'}]} />
<blockquote><div id="nested-flow" class="flow"><p>Nested one</p><p>Nested two</p></div></blockquote>
</div>
<Container id="empty-layout"><p>Before</p><RichText value={[]} /><RichText value={[block(' ')]} /><StaticRichText>   <!-- empty native slot --></StaticRichText><p>After</p></Container>
<div id="cms-optout"><RichText flow={false} value={[block('Wrapperless CMS')]} /></div>
<RichText id="cms-attributed" flow={false} class="custom" value={[block('Attributed CMS')]} />
<div id="static-optout"><StaticRichText flow={false}><p>Wrapperless native</p></StaticRichText></div>
<StaticRichText id="static-attributed" flow={false} class="custom"><p>Attributed native</p></StaticRichText>
</SiteShell>`);
    await writeFile(path.join(stage,'src/pages/structural-spacing-fixture.astro'), `---
import SiteShell from '../layouts/SiteShell.astro';
import Section from '../components/Section.astro';
import Container from '../components/Container.astro';
import Grid from '../components/Grid.astro';
import Cluster from '../components/Cluster.astro';
import Sidebar from '../components/Sidebar.astro';
const modes=['section','content','none'];
---
<SiteShell title="Structural geometry" spacingPolicy="automatic-v2">
<div id="reference" style="padding-top:var(--layout-section-padding);padding-bottom:var(--spacing-content);gap:var(--layout-grid-gap)"></div>
{modes.map(parent=><Section labelledBy="fixture-title" spacing={parent}>{modes.map(child=><Section id={parent+'-'+child} labelledBy="fixture-title" spacing={child}><div>A</div><div>B</div></Section>)}</Section>)}
<Section id="adjacent-one" labelledBy="fixture-title"><Container id="stack"><h1 id="fixture-title">Title</h1><p>Text</p><Cluster><a href="#fixture-title">Action</a><button>Button</button></Cluster></Container><Container><p>Second container</p></Container></Section>
<Section id="adjacent-two" labelledBy="fixture-title" spacing="none"><p>Next band</p></Section>
<Section id="scoped" labelledBy="fixture-title" style="--layout-section-padding:17px;--layout-container-gap:19px"><Section id="scoped-child" labelledBy="fixture-title"><p>Scoped</p></Section></Section>
<Section id="local" labelledBy="fixture-title" gap="0" style="--section-padding:0px;--container-gap:90px"><Section id="local-child" labelledBy="fixture-title"><p>Independent</p></Section></Section>
<Container id="custom" layout="custom"><p>A</p><p>B</p></Container>
<Container id="breakout" breakout layout="stack"><p id="track-reading">Reading track</p><div id="track-feature" class="content--feature">Feature</div><div id="track-wide" class="content--wide">Wide</div><div id="track-safe" class="content--full-safe"><a href="#fixture-title">Full safe focus</a></div></Container>
<Grid id="grid-prop" gap="13px" style={{'--grid-gap':'99px',color:'rgb(1, 2, 3)'}} aria-label="grid attributes"><p>A</p><p>B</p></Grid>
<Grid id="grid-utility" gap="13px" class="gap-0"><p>A</p><p>B</p></Grid>
<Container id="container-prop" gap="11px" style="--content-gap:99px;color:rgb(1, 2, 3)" class="kept"><p>A</p><p>B</p></Container>
<div id="raw-grid" class="grid md:grid-cols-2"><div>A</div><div>B</div></div>
<Sidebar id="sidebar"><div>Main</div><aside>Side</aside></Sidebar>
</SiteShell>`);
    await writeFile(path.join(stage, 'src/dev/spacing-media.json'), JSON.stringify({ id: '', url: '' }));
    await writeFile(path.join(stage, 'src/pages/media-spacing-fixture.astro'), `---
import '../styles/global.css';
import EditorialImage from '../components/EditorialImage.astro';
import PhotoGallery from '../components/PhotoGallery.astro';
import EmDashImage from '../components/EmDashImage.astro';
import media from '../dev/spacing-media.json';
---
<html lang="en" data-spacing-policy="automatic-v2"><head><title>Media geometry</title></head><body>
<div id="id-only-media" style="width:min(400px,100%)"><EditorialImage node={{ asset:{_ref:media.id}, alt:'ID-only local image', link:'#media-target' }} /></div>
<div id="media-target">Link target</div>
<PhotoGallery value={[{_type:'image',asset:{url:media.url},width:400,height:300,alt:'Gallery geometry'}]} />
<div class="site-main"><div id="responsive-frame" style="width:min(800px,100%)"><EmDashImage src={media.largeUrl || ''} width={1600} height={1200} alt="Responsive resource geometry" /></div></div>
<span hidden class="mt-0 mb-0 p-4 max-w-full gap-0"></span>
</body></html>`);
    await writeFile(path.join(stage, 'src/pages/primitive-edge.astro'), `---
import EditorialImage from '../components/EditorialImage.astro';
import PhotoGallery from '../components/PhotoGallery.astro';
import Disclosure from '../components/Disclosure.astro';
const bad = { toString: null };
---
<html lang="en"><head><title>Primitive resilience</title></head><body>
<EditorialImage node={null} />
<EditorialImage node={{ asset: { url: '/missing.jpg' }, caption: bad, link: bad, alignment: bad }} />
<EditorialImage node={{ asset: { _ref: 'missing' }, caption: bad }} />
<PhotoGallery value={null} node={bad} layout={null} breakout={bad} title={bad} />
<PhotoGallery node={{ _type:'gallery', columns:bad, images:[null,bad] }} />
    <Disclosure id="edge-panel"><span slot="summary">Panel</span>Body</Disclosure>
</body></html>`);
    await writeFile(path.join(stage, 'src/pages/spacing-fixture.astro'), `---
import '../styles/global.css';
---
<html lang="en"><head><title>Spacing fixture</title></head><body>
<main class="site-main">
  <section class="section" id="default-section">
    <div>One</div>
    <div>Two</div>
    <div class="flow" id="flow"><p>One</p><p id="flow-default">Two</p><p class="mt-0">Three</p></div>
    <div class="grid" id="default-grid"><div>A</div><div>B</div></div>
    <div class="grid gap-0" id="override-grid"><div>A</div><div>B</div></div>
  </section>
  <section class="section py-0" id="override-section">Override</section>
  <section class="section" data-spacing="none" id="none-section">
    <div>One</div>
    <div>Two</div>
  </section>
</main>
</body></html>`);
  }, onDevReady: async () => {
    const bytes = await sharp({ create: { width:400, height:300, channels:3, background:'#486b83' } }).png().toBuffer();
    const adapter = localEmdashAdapter({ url:fixtureOrigin, devBypass:true });
    const media = await adapter.upload(bytes, { entryId:'spacing-media', output:{mimeType:'image/png',width:400,height:300},probe:{extension:'png'},metadata:{alt:'ID-only local image',caption:''} });
    const largeBytes=await sharp({create:{width:1600,height:1200,channels:3,background:'#486b83'}}).png().toBuffer();
    const large=await adapter.upload(largeBytes,{entryId:'spacing-responsive',output:{mimeType:'image/png',width:1600,height:1200},probe:{extension:'png'},metadata:{alt:'Responsive resource geometry',caption:''}});
    await writeFile(path.join(fixtureStage,'src/dev/spacing-media.json'),JSON.stringify({id:media.id,url:'/_emdash/api/media/file/'+encodeURIComponent(media.storageKey),largeUrl:'/_emdash/api/media/file/'+encodeURIComponent(large.storageKey)}));
    const browser = await chromium.launch({channel:'chromium'});
    try {
      const page = await browser.newPage({viewport:{width:390,height:844}});
      await page.goto(fixtureOrigin+'/media-spacing-fixture');
      const image = page.locator('#id-only-media img');
      await expect(image).toHaveJSProperty('naturalWidth',400);
      await expect(page.locator('#id-only-media figure figure')).toHaveCount(0);
      await writeFile(path.join(reportDir,'media-dev.json'),JSON.stringify({idOnlyLoaded:true,naturalWidth:400,nestedVendorFigures:0})+'\n');
    } finally { await browser.close(); }
  } });
  try {
    process.env.VISUAL_ORIGIN = site.origin;
    const hash = async file => createHash('sha256').update(await readFile(file)).digest('hex');
    await writeFile(path.join(reportDir, 'environment.json'), JSON.stringify({ ...visualContract, observedNode: process.versions.node, platform: process.platform, arch: process.arch, seedSHA256: await hash('seed/seed.json'), sourceCSS_SHA256: await hash('src/styles/global.css') }, null, 2) + '\n');
    return site.cleanup;
  } catch (error) { await site.cleanup(); throw error; }
}
