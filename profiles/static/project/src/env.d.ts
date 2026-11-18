interface ImportMetaEnv {
  readonly STARTER_TEST_FIXTURES: boolean;
  /** Analytics (src/components/Analytics.astro): measurement ids, production hostnames and consent. */
  readonly PUBLIC_GA_ID?: string;
  readonly PUBLIC_GTM_ID?: string;
  readonly PUBLIC_CF_BEACON_TOKEN?: string;
  readonly PUBLIC_ANALYTICS_HOSTS?: string;
  readonly PUBLIC_CONSENT_MODE?: string;
  readonly PUBLIC_CONSENT_VERSION?: string;
}

declare module 'virtual:baseline/capabilities' {
  import type { PublicCapabilities } from './lib/capabilities';
  export const capabilities: PublicCapabilities;
  const defaultExport: PublicCapabilities;
  export default defaultExport;
}
