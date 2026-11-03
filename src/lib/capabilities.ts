import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type PlatformProfile = 'static' | 'static-sveltia' | 'emdash';

export interface SearchBuildOptions {
  readonly engine: 'pagefind';
  readonly bundlePath: string;
}

export interface BaselineFeaturesOptions {
  headingLinks?: boolean;
  callouts?: boolean;
  search?: false | SearchBuildOptions;
}

export interface PublicCapabilities {
  readonly profile: PlatformProfile;
  readonly base: string;
  readonly trailingSlash: 'always' | 'never' | 'ignore';
  readonly headingLinks: boolean;
  readonly callouts: boolean;
  readonly search: false | SearchBuildOptions;
}

/**
 * Pure resolver for baseline platform profile and public capabilities.
 * Derives the active platform profile authoritatively from baseline.config.json.
 * Exposes only browser-safe public facts, excluding filesystem paths, secrets, or server config.
 */
export function resolvePublicCapabilities(
  options?: BaselineFeaturesOptions,
  astroConfig?: { base?: string; trailingSlash?: 'always' | 'never' | 'ignore' },
  explicitProfile?: PlatformProfile
): PublicCapabilities {
  const profile = explicitProfile || getInstalledPlatformProfile();

  let baseRaw = (astroConfig?.base || '/').trim();
  if (!baseRaw.startsWith('/')) {
    baseRaw = '/' + baseRaw;
  }
  const normalizedBase = baseRaw === '/' ? '/' : baseRaw.replace(/\/+$/, '');
  const trailingSlash = astroConfig?.trailingSlash || 'ignore';

  const headingLinks = Boolean(options?.headingLinks);
  const callouts = Boolean(options?.callouts);

  let search: false | SearchBuildOptions = false;
  if (options?.search && options.search.engine === 'pagefind') {
    let bundlePath = (options.search.bundlePath || '_pagefind').replaceAll('\\', '/');
    bundlePath = bundlePath.replace(/^\/+/, '').replace(/\/+$/, '');
    if (/^[a-zA-Z]:|\.\./.test(bundlePath)) {
      throw new Error(`Invalid search bundlePath "${options.search.bundlePath}": must be a relative public URL path without drive letters or traversal`);
    }
    search = {
      engine: 'pagefind',
      bundlePath,
    };
  }

  return Object.freeze({
    profile,
    base: normalizedBase,
    trailingSlash,
    headingLinks,
    callouts,
    search,
  });
}

/**
 * Reads baseline.config.json safely from cwd or source directory.
 * Defaults to 'emdash' if absent.
 */
function getInstalledPlatformProfile(): PlatformProfile {
  try {
    const candidates = [path.resolve(process.cwd(), 'baseline.config.json')];
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      try {
        const fileDir = path.dirname(fileURLToPath(import.meta.url));
        candidates.push(path.resolve(fileDir, '../../baseline.config.json'));
      } catch {
        // Ignore URL conversion error
      }
    }

    for (const configPath of candidates) {
      if (fs.existsSync(configPath)) {
        const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (parsed && typeof parsed.platformProfile === 'string') {
          const p = parsed.platformProfile.toLowerCase();
          if (p === 'static' || p === 'static-sveltia') {
            return p;
          }
        }
        if (parsed && parsed.foundation === 'static') {
          return 'static';
        }
      }
    }
  } catch {
    // Ignore read errors
  }
  return 'emdash';
}
