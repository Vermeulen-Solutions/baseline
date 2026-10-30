import { argumentsOf, bytesOf, isMain, requireFact } from './infrastructure-io.mjs';

const string = (value, max = 8000) => typeof value === 'string' && value.length <= max;
const id = value => string(value,200) && value.length > 0;
const url = value => { try { const parsed=new URL(value); return string(value,4096) && ['https:','http:'].includes(parsed.protocol) && !parsed.username && !parsed.password && !/[\x00-\x20]/.test(value); } catch { return false; } };

/** Native MediaItem/MediaFolder and ContentItem readbacks, not rendered images. */
export function checkMigrationLibrary(input) {
  requireFact(input?.reviewVersion === 1, 'Unsupported library review version');
  const failures={missing:0,identity:0,filename:0,folder:0,alt:0,caption:0,folderName:0,link:0};
  const groups=['media','folders','links'];
  for(const group of groups) {
    const rows=input[group];
    requireFact(Array.isArray(rows) && rows.length<=1000,'Provide bounded explicit media, folder and link expectation/readback pairs');
    requireFact(rows.every(row=>row && id(row.expected?.id)) && new Set(rows.map(row=>row.expected.id)).size===rows.length,'Missing or duplicate expected identity');
  }
  requireFact(groups.some(group=>input[group].length),'At least one expectation is required');
  const folderIds=new Set(input.folders.map(row=>row.expected.id));
  for(const group of groups) for(const {expected,actual} of input[group]) {
    if(group==='media') {
      requireFact(string(expected.filename,512) && expected.filename.length>0 && string(expected.alt) && string(expected.caption),'Review the intended filename, alt and caption explicitly');
      requireFact(expected.folderId===null ? string(expected.organizationReason,1000) && expected.organizationReason.trim().length>0 : id(expected.folderId) && folderIds.has(expected.folderId),'Provide a reviewed folder pair or an explicit reason for an unfiled item');
    } else if(group==='folders') requireFact(string(expected.name,512) && expected.name.trim().length>0,'Expected folder name required');
    else requireFact(url(expected.url),'Expected link must be a credential-free HTTP(S) URL');
    if(!actual || typeof actual!=='object' || Array.isArray(actual)) { failures.missing++; continue; }
    if(actual.id!==expected.id) failures.identity++;
    if(group==='media') {
      if(actual.filename!==expected.filename) failures.filename++;
      if((actual.folderId??null)!==expected.folderId) failures.folder++;
      for(const key of ['alt','caption']) if((actual[key]??'')!==expected[key]) failures[key]++;
    } else if(group==='folders') { if(actual.name!==expected.name) failures.folderName++; }
    else if(actual.data?.url!==expected.url) failures.link++;
  }
  return {status:Object.values(failures).some(Boolean)?'failed':'passed',checked:Object.fromEntries(groups.map(group=>[group,input[group].length])),failures,scope:'Supplied native metadata/link readbacks only; not byte verification, complete inventory, cached per-use captions or editor/browser acceptance'};
}

if(isMain(import.meta.url)) {
  try {
    if(process.argv.length===3 && process.argv[2]==='--help') console.log('Read-only: --input <private JSON>. reviewVersion:1; media/folders/links arrays of {expected,actual} pairs. Missing actual may be null. Native link records use actual.data.url. Outputs counts only; no network or writes. See docs/migration-review.md.');
    else {
      const args=argumentsOf(process.argv.slice(2),['--input']); requireFact(args.input,'Input required');
      const result=checkMigrationLibrary(JSON.parse(bytesOf(args.input,4*1024*1024).toString('utf8')));
      console.log(JSON.stringify(result,null,2)); process.exitCode=result.status==='passed'?0:1;
    }
  } catch { console.error('Library review is unverified. Use --help and bounded native expectation/readback JSON; private values withheld.'); process.exitCode=2; }
}
