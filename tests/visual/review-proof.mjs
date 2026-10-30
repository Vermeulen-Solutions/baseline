import {writeFile,copyFile} from 'node:fs/promises';
import path from 'node:path';

// Neutral, temporary acceptance fixture. Never added to public source or goldens.
export async function writeReviewProof(stage) {
  await copyFile(new URL('../../profiles/static/project/src/assets/pilot-grid.jpg',import.meta.url),path.join(stage,'src/assets/review-photo.jpg'));
  await writeFile(path.join(stage,'src/pages/review-proof.astro'),`---
import SiteShell from '../layouts/SiteShell.astro';
import {Image} from 'astro:assets';
import photo from '../assets/review-photo.jpg';
const english=Astro.url.searchParams.get('lang')==='en';
const title=english?'Find your next activity':'Choisis ta prochaine activité';
---
<SiteShell title="Responsive acceptance proof" lang={english?'en':'fr'} spacingPolicy="automatic-v2">
<section aria-label="Responsive composition proof">
<div class="proof-container" id="full"><div class="proof-grid">
<div class="proof-copy"><h1>{title}</h1><p>{english?'Explore local activities, meet a welcoming team and find a place to start.':'Découvre les activités près de chez toi, rencontre une équipe accueillante et trouve ta place.'}</p><a class="proof-action" href="#boxed">{english?'Explore activities':'Découvrir les activités'}</a></div>
<Image src={photo} alt={english?'Prepared image reference':'Image de référence préparée'} widths={[640,1280]} sizes="(min-width:64rem) 50vw, 100vw" />
</div></div>
<div class="boxed" id="boxed"><div class="proof-container"><div class="proof-grid">
<div class="proof-copy"><h2>{title}</h2><p>La même composition dans un conteneur de lecture plus étroit.</p><a class="proof-action" href="/gallery-fit-fixture">Voir la galerie</a></div>
<Image src={photo} alt="Image dans le conteneur étroit" width={640} />
</div></div></div>
</section>
</SiteShell>
<style>
@layer components {
  /* This custom full-width route owns its gutters; the boxed specimen stays constrained. */
  :global(main.site-main) { width:100%; padding-inline:0; }
  .proof-container { container-type:inline-size; max-inline-size:90rem; margin-inline:auto; }
  .proof-grid { display:grid; grid-template-columns:minmax(0,1fr); }
  .proof-copy { min-inline-size:0; padding:clamp(1rem,4cqi,3rem); background:var(--color-surface); }
  .proof-copy :is(h1,h2) { font-size:clamp(2rem,4cqi,4rem); line-height:1.1; text-wrap:balance; }
  .proof-copy p { margin-block:1.5rem; max-inline-size:55ch; }
  .proof-action { display:inline-flex; max-inline-size:100%; padding:1rem; border:1px solid currentColor; }
  .proof-grid :global(img) { inline-size:100%; block-size:auto; object-fit:cover; }
  .boxed { max-inline-size:40rem; margin:3rem auto; }
  @container (min-width:64rem) { .proof-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
}
</style>
`);
}
