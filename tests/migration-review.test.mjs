import test from 'node:test';
import assert from 'node:assert/strict';
import {checkMigrationLibrary} from '../scripts/check-migration-library.mjs';
import {checkEditorialContent} from '../scripts/check-editorial-content.mjs';

const library=()=>({reviewVersion:1,folders:[{expected:{id:'photos',name:'Training'},actual:{id:'photos',name:'Training'}}],media:[...['team-photo.webp','portrait.jpg','conditions.pdf'].map((filename,index)=>({expected:{id:String(index),filename,folderId:'photos',alt:index===2?'':'Training',caption:''},actual:{id:String(index),filename,folderId:'photos',alt:index===2?'':'Training',caption:'',key:'unchanged-key'}}))],links:[{expected:{id:'partner',url:'https://support.example.test/'},actual:{id:'partner',data:{url:'https://support.example.test/'},locale:'fr'}}]});
const block=(text,extra={})=>({_type:'block',style:'normal',children:[{_type:'span',text,marks:[]}],...extra});

test('native library/link pairs cover photos and PDF without changing IDs, keys or input',()=>{
  const input=library(), before=JSON.stringify(input); assert.equal(checkMigrationLibrary(input).status,'passed'); assert.equal(JSON.stringify(input),before);
  input.media[0].actual.filename='opaque-id.webp'; input.media[1].actual.folderId=null; input.links[0].actual.data.url='';
  const result=checkMigrationLibrary(input); assert.equal(result.status,'failed'); assert.equal(result.failures.filename,1); assert.equal(result.failures.folder,1); assert.equal(result.failures.link,1);
  assert.doesNotMatch(JSON.stringify(result),/opaque|support\.example|unchanged-key/);
});
test('missing library records, duplicate expectations and unreviewed unfiled media cannot pass',()=>{
  const missing=library(); missing.folders[0].actual=null; assert.equal(checkMigrationLibrary(missing).failures.missing,1);
  const duplicate=library(); duplicate.media.push(duplicate.media[0]); assert.throws(()=>checkMigrationLibrary(duplicate),/duplicate/);
  const unfiled=library(); unfiled.media[0].expected.folderId=null; assert.throws(()=>checkMigrationLibrary(unfiled),/reviewed folder/);
  unfiled.media[0].expected.organizationReason='Deliberately retained in main library'; unfiled.media[0].actual.folderId=null; assert.equal(checkMigrationLibrary(unfiled).status,'passed');
  const changed=library(); changed.media[0].actual.alt='changed'; changed.media[1].actual.caption='lost caption'; assert.equal(checkMigrationLibrary(changed).failures.alt,1); assert.equal(checkMigrationLibrary(changed).failures.caption,1);
});
test('malformed library input and credential-bearing URLs are refused',()=>{
  for(const input of [{}, {...library(),reviewVersion:2}, {...library(),media:Array(1001).fill({})}]) assert.throws(()=>checkMigrationLibrary(input));
  const input=library(); input.links[0].expected.url='https://user:secret@example.test'; assert.throws(()=>checkMigrationLibrary(input));
});
test('editorial review flags flattened imported paragraphs while preserving raw words and blocks',()=>{
  const value=[block('Title\nBody\n\nMore\nText',{children:[{_type:'span',text:'Title\nBody\n\nMore\nText',marks:['strong']}]}),block(''),{_type:'image',asset:{_ref:'kept'}}];
  const before=JSON.stringify(value),result=checkEditorialContent({reviewVersion:1,format:'portable-text',value});
  assert.equal(result.status,'review-required'); assert.ok(result.findings.some(f=>f.code==='possible-flattened-heading')); assert.ok(result.findings.some(f=>f.code==='empty-text-block')); assert.equal(JSON.stringify(value),before);
  assert.doesNotMatch(JSON.stringify(result),/Title|Body|kept/);
});
test('intentional poetry breaks stay intact; normalized comparison catches lost wording',()=>{
  const value=[block('One\nTwo\nThree\nFour')];
  assert.equal(checkEditorialContent({reviewVersion:1,format:'portable-text',intentionalLineBreaks:true,value}).status,'no-mechanical-findings');
  const baseline=[block('One\nTwo')],after=[block('One',{style:'h2'}),block('Two')];
  assert.equal(checkEditorialContent({reviewVersion:1,format:'portable-text',baseline,value:after}).textPreserved,true);
  assert.equal(checkEditorialContent({reviewVersion:1,format:'portable-text',baseline,value:[block('One')]}).textPreserved,false);
});
test('HTML review preserves intentional media and catches merged heading/body breaks without auto-rewriting',()=>{
  const result=checkEditorialContent({reviewVersion:1,format:'html',value:'<p><strong>Heading</strong><br>Body<br><br>Closing</p><p> </p><p><img src="photo.jpg" alt="Photo"></p>'});
  assert.equal(result.blocks,3); assert.equal(result.findings.filter(f=>f.code==='empty-text-block').length,1); assert.ok(result.findings.some(f=>f.code==='possible-flattened-heading'));
  assert.throws(()=>checkEditorialContent({reviewVersion:1,format:'portable-text',value:[{_type:'block'}]}));
});
