interface ImportMetaEnv {
  readonly STARTER_TEST_FIXTURES: boolean;
}

declare module 'virtual:baseline/capabilities' {
  import type { PublicCapabilities } from './lib/capabilities';
  export const capabilities: PublicCapabilities;
  const defaultExport: PublicCapabilities;
  export default defaultExport;
}
