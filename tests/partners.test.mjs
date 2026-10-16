import test from 'node:test';import assert from 'node:assert/strict';import {partnersFromEntries} from '../src/lib/partners.ts';
test('partner records honor CMS order/activity and actual storage keys without record caps',()=>{
 const entries=Array.from({length:30},(_,i)=>({data:{title:`Partner ${i}`,sort_order:30-i,logo:{id:`id-${i}`,meta:{storageKey:`file-${i}.png`}}}}));entries[0].data.active=false;entries[1].data.active=0;
 const items=partnersFromEntries(entries,k=>`https://media.example.invalid/${k}`);
 assert.equal(items.length,28);assert.equal(items[0].name,'Partner 29');assert.equal(items[0].image,'https://media.example.invalid/file-29.png');assert.equal(items[0].alt,'Partner 29');
});

import {publicLink} from '../src/lib/public-link.ts';
test('public links reject executable protocols, protocol-relative hosts and obfuscated URLs',()=>{
 for(const value of ['javascript:alert(1)','//outside.invalid','/\\outside.invalid','https:\n//outside.invalid'])assert.equal(publicLink(value),undefined);
 for(const value of ['/article/','#email','https://example.invalid/','mailto:test@example.invalid'])assert.equal(publicLink(value),value);
});
