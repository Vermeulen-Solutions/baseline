// The legacy organizer guessed internal CMS table/JSON shapes and renamed originals.
// Refuse all old flags; migrate through reviewed manifests and supported APIs instead.
console.error(JSON.stringify({ status: 'unverified', error: 'Legacy raw-SQL media organizer retired. Use npm run media:migrate-wp with explicit source/metadata and review its plan. No database or file was changed.' }));
process.exitCode = 2;
