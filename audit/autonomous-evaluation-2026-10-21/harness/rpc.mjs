import fs from 'node:fs';
const privateFile=new URL('./cms-private.json',import.meta.url);
export const state=()=>JSON.parse(fs.readFileSync(privateFile));
let sequence=0;
export async function rpc(role,name,args={}){
 const config=state(),account=config.accounts[role];
 const response=await fetch(config.origin+'/_emdash/api/mcp',{method:'POST',headers:{authorization:'Bearer '+account.token,'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:++sequence,method:name==='tools/list'?'tools/list':'tools/call',params:name==='tools/list'?{}:{name,arguments:args}}),signal:AbortSignal.timeout(30000)});
 const text=await response.text();let envelope;try{envelope=JSON.parse(text.startsWith('event:')?text.split('\n').find(line=>line.startsWith('data: ')).slice(6):text);}catch{envelope={error:{message:'Non-JSON MCP response'}};}
 let data=envelope.result?.structuredContent; if(data===undefined){const text=envelope.result?.content?.filter(c=>c.type==='text').map(c=>c.text).join('\n');try{data=JSON.parse(text);}catch{data={message:text};}}
 return {http:response.status,ok:response.ok&&!envelope.error&&!envelope.result?.isError,data,error:envelope.error??(envelope.result?.isError?data:null)};
}
