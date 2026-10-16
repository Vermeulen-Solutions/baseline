import type { APIContext } from 'astro';
export type FormRecovery = { values: Record<string,string>; fields: string[]; reason: string };
type Session = APIContext['session'];
const keyFor = (form:string) => `form-recovery:${form}`;
/** Preserve only explicitly allowed non-secret strings, with a bounded session payload. */
export async function saveFormRecovery(session:Session, form:string, state:FormRecovery, allowedFields:readonly string[]):Promise<boolean> {
  if (!session) return false;
  const values:Record<string,string>={}; let remaining=16000;
  for(const key of allowedFields.slice(0,80)) {
    if(/password|token|secret|credit.?card|cvv/i.test(key)) continue;
    const value=state.values[key]; if(typeof value!=='string') continue;
    const bounded=value.slice(0,Math.min(2000,remaining)); values[key]=bounded; remaining-=bounded.length;
    if(remaining<=0) break;
  }
  session.set(keyFor(form),{values,fields:state.fields.filter(f=>allowedFields.includes(f)).slice(0,80),reason:state.reason.slice(0,120)},{ttl:600});
  return true;
}
export async function readFormRecovery(session:Session,form:string):Promise<FormRecovery|undefined> {
  if(!session) return undefined;
  const state=await session.get(keyFor(form)) as FormRecovery|undefined;
  session.delete(keyFor(form)); return state;
}
/** Native ISO date input, plus optional imported DD-MM-YYYY/DD/MM/YYYY compatibility. */
export function birthDate(value:string,today=new Date().toISOString().slice(0,10)):string|null {
  const native=/^(\d{4})-(\d{2})-(\d{2})$/.test(value);
  const legacy=/^(\d{2})[-/](\d{2})[-/](\d{4})$/.exec(value);
  const iso=native?value:legacy?`${legacy[3]}-${legacy[2]}-${legacy[1]}`:'';
  if(!iso||iso>today) return null;
  const parsed=new Date(`${iso}T12:00:00Z`);
  return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===iso?iso:null;
}
