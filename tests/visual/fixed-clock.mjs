// Test-process-only clock: seed publication dates and server-rendered footer dates are fixed.
const NativeDate = Date;
const time = NativeDate.parse('2026-01-15T12:00:00.000Z');
globalThis.Date = class extends NativeDate {
  constructor(...args) { super(...(args.length ? args : [time])); }
  static now() { return time; }
};
