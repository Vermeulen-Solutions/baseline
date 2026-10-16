/**
 * Deliberately bounded to the observed EmDash 1.3.0 CMSAnnotation format.
 * @param {string|null} raw
 * @param {string} version
 * @returns {{kind:'unannotated'|'unsupported',message:string}|{kind:'field'|'entry',message:string,collection:string,id:string,field?:string,status?:string,hasDraft?:boolean,locale:string}}
 */
export function decodeOwnership(raw, version) {
  if (raw === null) return { kind: 'unannotated', message: 'Unannotated / unknown. UI dictionary, derived text or deliberate fallback may be intentional.' };
  if (version !== '1.3.0') return { kind: 'unsupported', message: `Unsupported EmDash version ${version || 'unknown'}; review the installed annotation format.` };
  if (raw.length > 4096) return { kind: 'unsupported', message: 'Unsupported oversized annotation.' };
  try {
    const value = JSON.parse(raw);
    const string = (v, limit = 256) => typeof v === 'string' && v.length > 0 && v.length <= limit;
    const allowed = ['collection','id','field','status','hasDraft'];
    if (!value || Array.isArray(value) || typeof value !== 'object' || Object.keys(value).some(key => !allowed.includes(key)) ||
      !string(value.collection) || !string(value.id) || ('field' in value && !string(value.field, 512)) ||
      ('status' in value && !string(value.status)) || ('hasDraft' in value && typeof value.hasDraft !== 'boolean')) throw Error();
    return { kind: value.field ? 'field' : 'entry', collection: value.collection, id: value.id,
      ...(value.field ? { field: value.field } : {}), ...(value.status ? { status: value.status } : {}),
      ...(typeof value.hasDraft === 'boolean' ? { hasDraft: value.hasDraft } : {}),
      message: value.field ? 'Field annotation observed. Registration, editing and saveability are unverified.' : 'Entry context observed. This does not bind every descendant text field.',
      locale: 'Not supplied by this annotation format.' };
  } catch { return { kind: 'unsupported', message: 'Unsupported annotation format. Raw values are not displayed.' }; }
}
