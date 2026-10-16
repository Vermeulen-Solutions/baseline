/** Restrict CMS-supplied link destinations to public navigation protocols. */
export function publicLink(value:unknown):string|undefined {
  if(typeof value!=='string'||/[\\\u0000-\u0020]/.test(value)) return undefined;
  return /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(value)?value:undefined;
}
