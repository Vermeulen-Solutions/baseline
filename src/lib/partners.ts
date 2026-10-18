import { publicLink } from './public-link.ts';
import { photo, photoUrl } from './photo-gallery.ts';
import type { Partner } from './partner';
export type { Partner } from './partner';
/** Caller owns the published collection query and cache hints. No arbitrary cap. */
export function partnersFromEntries(entries: {data: Record<string, any>}[], resolve?: (key:string)=>string): Partner[] {
  return entries.filter(e=>e.data.active!==false && e.data.active!==0)
    .slice().sort((a,b)=>Number(a.data.sort_order||0)-Number(b.data.sort_order||0))
    .flatMap(({data})=>{const p=photo(data.logo);const image=p ? photoUrl(p,resolve) : '';
      return image ? [{name:String(data.title||''),href:publicLink(data.url), image,alt:String(data.alt_text||p?.alt||data.title||''),ground:data.logo_ground==='dark'?'dark' as const:'light' as const}] : [];
    });
}
