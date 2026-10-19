interface ImportMetaEnv {
  readonly STARTER_TEST_FIXTURES: boolean;
  readonly STARTER_EMDASH_VERSION: string;
}

// Optional capabilities for trusted in-repo plugins. Node/SQLite provisions none
// of these. Cloudflare deployments must configure bindings and generate their
// concrete runtime Env with `wrangler types` (see src/plugins/README.md).
interface CloudflareBindings {
  readonly DB?: import('@cloudflare/workers-types').D1Database;
  readonly MEDIA?: import('@cloudflare/workers-types').R2Bucket;
  readonly AI?: import('@cloudflare/workers-types').Ai;
}

declare namespace Cloudflare {
  interface Env extends CloudflareBindings {}
}
