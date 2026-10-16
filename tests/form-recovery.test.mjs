import test from 'node:test';import assert from 'node:assert/strict';
import {birthDate,saveFormRecovery,readFormRecovery} from '../src/lib/form-recovery.ts';
test('native/legacy dates agree and impossible or future birthdays are rejected',()=>{
 for(const value of ['2000-02-29','29-02-2000','29/02/2000'])assert.equal(birthDate(value,'2026-10-05'),'2000-02-29');
 for(const value of ['2001-02-29','2027-01-01','31/04/2000','garbage'])assert.equal(birthDate(value,'2026-10-05'),null);
});
test('recovery is bounded, allowlisted, expires and is consumed once per form',async()=>{
 let now=0;const values=new Map();const session={set(k,v,{ttl}){assert.equal(ttl,600);values.set(k,{v,expires:now+ttl});},async get(k){const item=values.get(k);return item&&item.expires>now?item.v:undefined;},delete(k){values.delete(k);}};
 const state={values:{name:'a'.repeat(4000),email:'test@example.invalid',password:'secret',unexpected:'no'},fields:['email','unexpected'],reason:'required'};
 await saveFormRecovery(session,'contact',state,['name','email','password']);
 assert.equal(await readFormRecovery(session,'other'),undefined);
 const result=await readFormRecovery(session,'contact');assert.equal(result.values.name.length,2000);assert.equal(result.values.password,undefined);assert.equal(result.values.unexpected,undefined);assert.deepEqual(result.fields,['email']);
 assert.equal(await readFormRecovery(session,'contact'),undefined);
 await saveFormRecovery(session,'contact',state,['email']);now=601;assert.equal(await readFormRecovery(session,'contact'),undefined);
 assert.equal(await saveFormRecovery(undefined,'contact',state,['email']),false);
});
