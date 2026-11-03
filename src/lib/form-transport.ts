import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Profile-aware form transport resolver and bounds validator.
 * Provides progressive enhancement contracts for both static and server/EmDash profiles.
 */

export interface FormEndpointConfig {
  endpoint?: string;
  profile?: 'static' | 'static-sveltia' | 'emdash';
  actionName?: string;
  /** Action object or query string reference from astro:actions */
  action?: unknown;
}

export type FormActionConfig = FormEndpointConfig | string;

export interface FieldValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  fieldName: string;
}

export interface FormErrorItem {
  id: string;
  label: string;
}

export interface FormTransportResolution {
  /** Safe HTML action attribute for native browser submissions */
  action: string;
  /** RPC endpoint URL for enhanced JavaScript fetch submissions */
  rpcAction?: string;
}

/**
 * Derives the active platform profile by inspecting baseline.config.json.
 * Inspects both current working directory and relative source root.
 * Defaults to 'emdash' if baseline.config.json is absent (maintainer root / CMS).
 */
export function getInstalledProfile(): 'static' | 'static-sveltia' | 'emdash' {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'baseline.config.json'),
    ];
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

/**
 * Checks whether a candidate URL or action uses an executable or forbidden scheme.
 * Strips whitespace and control characters to prevent evasion (e.g. `java\0script:`).
 */
export function isExecutableScheme(candidate: string): boolean {
  const stripped = candidate.replace(/[\x00-\x20\s]/g, '').toLowerCase();
  return (
    stripped.startsWith('javascript:') ||
    stripped.startsWith('data:') ||
    stripped.startsWith('vbscript:') ||
    stripped.startsWith('file:') ||
    stripped.startsWith('blob:')
  );
}

/**
 * Checks whether a URL contains user credentials (user:password@).
 */
export function hasCredentials(candidate: string): boolean {
  try {
    const url = new URL(candidate, 'https://heuristic-check.test');
    if (url.username || url.password) return true;
  } catch {
    // Ignore invalid URL parse
  }
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^/?#]*@/.test(candidate);
}

/**
 * Parses and normalizes a candidate form action URL/path.
 * Detects protocol, credentials, path traversal, query params, and absolute destinations.
 */
function parseNormalizedAction(candidate: string): {
  isAbsolute: boolean;
  protocol: string;
  hasCredentials: boolean;
  raw: string;
  pathname: string;
  searchParams: URLSearchParams;
} | null {
  const trimmed = candidate.trim();
  if (!trimmed || isExecutableScheme(trimmed) || hasCredentials(trimmed)) {
    return null;
  }

  // Reject backslashes (Windows path artifacts or network share references like \\outside.test\form)
  if (trimmed.includes('\\')) {
    return null;
  }

  // Protocol-relative URLs (e.g. //outside.test/form)
  if (trimmed.startsWith('//')) {
    try {
      const parsed = new URL('https:' + trimmed);
      return {
        isAbsolute: true,
        protocol: '', // Scheme-relative; does not guarantee explicit https
        hasCredentials: Boolean(parsed.username || parsed.password),
        raw: trimmed,
        pathname: parsed.pathname,
        searchParams: parsed.searchParams,
      };
    } catch {
      return null;
    }
  }

  // Absolute URL with scheme
  try {
    const parsed = new URL(trimmed);
    return {
      isAbsolute: true,
      protocol: parsed.protocol.toLowerCase(),
      hasCredentials: Boolean(parsed.username || parsed.password),
      raw: trimmed,
      pathname: parsed.pathname,
      searchParams: parsed.searchParams,
    };
  } catch {
    // Scheme prefix without valid standard URL (e.g. http:outside.test/form, custom:foo)
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
      try {
        const parsedWithBase = new URL(trimmed, 'https://heuristic.test');
        return {
          isAbsolute: parsedWithBase.origin !== 'https://heuristic.test',
          protocol: parsedWithBase.protocol.toLowerCase(),
          hasCredentials: Boolean(parsedWithBase.username || parsedWithBase.password),
          raw: trimmed,
          pathname: parsedWithBase.pathname,
          searchParams: parsedWithBase.searchParams,
        };
      } catch {
        return null;
      }
    }

    // Relative path (e.g. /api/contact, ./_actions/contact, /x/../_actions/contact, ?lang=en&_action=contact)
    try {
      const parsedRelative = new URL(trimmed, 'https://heuristic-base.test');
      return {
        isAbsolute: false,
        protocol: '',
        hasCredentials: false,
        raw: trimmed,
        pathname: parsedRelative.pathname,
        searchParams: parsedRelative.searchParams,
      };
    } catch {
      return null;
    }
  }
}

/**
 * Checks whether normalized path or query parameters target an Astro Action.
 * Catches path traversal (e.g. /x/../_actions/contact) and non-leading action queries (?lang=en&_action=contact).
 */
function isActionRestricted(parsed: { pathname: string; searchParams: URLSearchParams }): boolean {
  const normPath = parsed.pathname.replace(/\/+$/, '');
  const isActionPath = normPath === '/_actions' || normPath.startsWith('/_actions/');
  const isActionQuery = parsed.searchParams.has('_action') || parsed.searchParams.has('_astroAction');
  return isActionPath || isActionQuery;
}

/**
 * Resolves full transport configuration distinguishing native HTML fallback
 * from enhanced RPC endpoints, enforcing authoritative profile boundaries and normalized URL safety.
 */
export function resolveFormTransport(
  config?: FormActionConfig,
  defaultProfile?: 'static' | 'static-sveltia' | 'emdash'
): FormTransportResolution {
  if (!config) {
    return { action: '' };
  }

  const installed = getInstalledProfile();
  // Determine effective profile: the installed static profile is authoritative and cannot be
  // overridden by caller configuration or component options.
  let effectiveProfile: 'static' | 'static-sveltia' | 'emdash' = defaultProfile || installed;
  if (installed === 'static' || installed === 'static-sveltia') {
    effectiveProfile = installed;
  } else if (defaultProfile === 'static' || defaultProfile === 'static-sveltia') {
    effectiveProfile = defaultProfile;
  } else if (typeof config === 'object' && config !== null && config.profile) {
    effectiveProfile = config.profile;
  }

  // Reject conflicting caller overrides attempting to widen static profile to emdash
  if (
    typeof config === 'object' &&
    config !== null &&
    config.profile === 'emdash' &&
    (effectiveProfile === 'static' || effectiveProfile === 'static-sveltia')
  ) {
    return { action: '' };
  }

  // Handle string input
  if (typeof config === 'string') {
    const parsed = parseNormalizedAction(config);
    if (!parsed) {
      return { action: '' };
    }

    if (effectiveProfile === 'static' || effectiveProfile === 'static-sveltia') {
      if (parsed.isAbsolute) {
        // Static profile strictly requires explicit HTTPS external endpoints
        return parsed.protocol === 'https:' ? { action: parsed.raw } : { action: '' };
      }
      // Relative path: reject /_actions path traversal and query action triggers in static
      if (isActionRestricted(parsed)) {
        return { action: '' };
      }
      return { action: parsed.raw };
    }

    // emdash profile
    if (parsed.isAbsolute) {
      return parsed.protocol === 'https:' || parsed.protocol === 'http:'
        ? { action: parsed.raw }
        : { action: '' };
    }
    return { action: parsed.raw };
  }

  // Handle FormEndpointConfig object
  const endpoint = (config.endpoint || '').trim();

  // If endpoint is explicitly provided
  if (endpoint) {
    const parsed = parseNormalizedAction(endpoint);
    if (!parsed) {
      return { action: '' };
    }

    if (effectiveProfile === 'static' || effectiveProfile === 'static-sveltia') {
      if (parsed.isAbsolute) {
        return parsed.protocol === 'https:' ? { action: parsed.raw } : { action: '' };
      }
      if (isActionRestricted(parsed)) {
        return { action: '' };
      }
      return { action: parsed.raw };
    }

    if (parsed.isAbsolute) {
      return parsed.protocol === 'https:' || parsed.protocol === 'http:'
        ? { action: parsed.raw }
        : { action: '' };
    }
    return { action: parsed.raw };
  }

  // Action resolution for astro:actions
  const actionObj = config.action as { queryString?: string; toString?: () => string } | undefined;
  let resolvedActionName = config.actionName;

  if (!resolvedActionName && actionObj) {
    const qs = actionObj.queryString || (typeof actionObj.toString === 'function' ? actionObj.toString() : '');
    const match = qs.match(/[?&]_action=([^&]+)/);
    if (match) {
      resolvedActionName = decodeURIComponent(match[1]);
    }
  }

  if (resolvedActionName) {
    // Static profiles cannot resolve or execute server actions
    if (effectiveProfile === 'static' || effectiveProfile === 'static-sveltia') {
      return { action: '' };
    }

    const encoded = encodeURIComponent(resolvedActionName);
    return {
      action: `?_action=${encoded}`,
      rpcAction: `/_actions/${encoded}`,
    };
  }

  return { action: '' };
}

/**
 * Resolves the appropriate HTML form action URL for native browser submission.
 * Preserves Astro's native form-action contract (?_action=...) for zero-JS fallback.
 */
export function resolveFormAction(
  config?: FormActionConfig,
  defaultProfile?: 'static' | 'static-sveltia' | 'emdash'
): string {
  return resolveFormTransport(config, defaultProfile).action;
}

/**
 * Sanitizes form string values with bounded length to prevent memory/payload exhaustion.
 */
export function sanitizeFormValue(value: unknown, maxLength = 2000): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

/**
 * Validates a single form field according to specified bounds and regex rules.
 * Validates actual length before destructive truncation and resets stateful regex patterns.
 */
export function validateFormField(value: unknown, rule: FieldValidationRule): string | null {
  const rawStr = typeof value === 'string' ? value.trim() : '';

  if (rule.required && !rawStr) {
    return `${rule.fieldName} is required.`;
  }
  if (rule.minLength && rawStr.length < rule.minLength) {
    return `${rule.fieldName} must be at least ${rule.minLength} characters.`;
  }
  if (rule.maxLength && rawStr.length > rule.maxLength) {
    return `${rule.fieldName} cannot exceed ${rule.maxLength} characters.`;
  }
  if (rule.pattern && rawStr) {
    // Reset lastIndex for stateful regular expressions (with /g or /y flags)
    rule.pattern.lastIndex = 0;
    if (!rule.pattern.test(rawStr)) {
      return `Enter a valid format for ${rule.fieldName.toLowerCase()}.`;
    }
  }
  return null;
}

/**
 * Normalizes string line breaks (CR, LF, CRLF) to CRLF (\r\n) per WHATWG form submission algorithm.
 */
export function normalizeToCRLF(str: string): string {
  return str.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\r\n');
}

/**
 * Serializes form data entries into text/plain encoding per WHATWG HTML specification:
 * - File values serialize as their filename (file.name)
 * - Field names and values normalize CR/LF line breaks to CRLF (\r\n)
 * - Entries format as name=value\r\n
 */
export function encodePlainTextFormData(entries: Iterable<[string, unknown]>): string {
  let body = '';
  for (const [key, val] of entries) {
    let stringVal = '';
    if (typeof val === 'string') {
      stringVal = val;
    } else if (val && typeof val === 'object' && 'name' in val) {
      stringVal = String((val as { name: unknown }).name || '');
    }
    const normKey = normalizeToCRLF(key);
    const normVal = normalizeToCRLF(stringVal);
    body += `${normKey}=${normVal}\r\n`;
  }
  return body;
}

/**
 * Converts a map or array of field errors into the format expected by FormError.astro.
 */
export function formatFormErrors(errors: Record<string, string> | { id: string; label: string }[]): FormErrorItem[] {
  if (Array.isArray(errors)) {
    return errors.map(e => ({ id: e.id, label: e.label }));
  }
  return Object.entries(errors).map(([id, label]) => ({ id, label }));
}
