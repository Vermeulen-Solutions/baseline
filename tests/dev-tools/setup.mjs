import path from 'node:path';
import {startVisualSite} from '../visual/site.mjs';
export default async function setup(){
  const site = await startVisualSite(process.cwd(),path.resolve('.emdash/checks/dev-hud'),{devOnly:true});
  process.env.VISUAL_ORIGIN=site.origin;
  return site.cleanup;
}
