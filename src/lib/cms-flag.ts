/** Explicitly set: loader booleans and SQLite/D1 integer flags only. */
export function isCmsFlagSet(value: unknown): boolean {
  return value === true || value === 1;
}

/** Optional opt-out flag: absent means enabled; malformed values fail closed. */
export function isCmsFlagEnabled(value: unknown): boolean {
  return value == null || isCmsFlagSet(value);
}
