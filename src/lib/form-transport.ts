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
 * Resolves full transport configuration distinguishing native HTML fallback
 * from enhanced RPC endpoints.
 */
export function resolveFormTransport(
  config?: FormActionConfig,
  defaultProfile: 'static' | 'static-sveltia' | 'emdash' = 'emdash'
): FormTransportResolution {
  if (!config) {
    return { action: '' };
  }

  // Handle string input
  if (typeof config === 'string') {
    const trimmed = config.trim();
    if (!trimmed || isExecutableScheme(trimmed) || hasCredentials(trimmed)) {
      return { action: '' };
    }

    const isAbsolute = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(trimmed);

    if (defaultProfile === 'static' || defaultProfile === 'static-sveltia') {
      if (isAbsolute) {
        // Static profile strictly requires HTTPS external endpoints
        return /^https:\/\//i.test(trimmed) ? { action: trimmed } : { action: '' };
      }
      // Relative path: reject /_actions and query action triggers in static
      if (trimmed.startsWith('/_actions') || trimmed.startsWith('?_action=')) {
        return { action: '' };
      }
      return { action: trimmed };
    }

    // emdash profile
    if (isAbsolute) {
      return /^https?:\/\//i.test(trimmed) ? { action: trimmed } : { action: '' };
    }
    return { action: trimmed };
  }

  // Handle FormEndpointConfig object
  const profile = config.profile || defaultProfile;
  const endpoint = (config.endpoint || '').trim();

  // If endpoint is explicitly provided
  if (endpoint) {
    if (isExecutableScheme(endpoint) || hasCredentials(endpoint)) {
      return { action: '' };
    }

    const isAbsolute = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(endpoint);

    if (profile === 'static' || profile === 'static-sveltia') {
      if (isAbsolute) {
        return /^https:\/\//i.test(endpoint) ? { action: endpoint } : { action: '' };
      }
      if (endpoint.startsWith('/_actions') || endpoint.startsWith('?_action=')) {
        return { action: '' };
      }
      return { action: endpoint };
    }

    if (isAbsolute) {
      return /^https?:\/\//i.test(endpoint) ? { action: endpoint } : { action: '' };
    }
    return { action: endpoint };
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
    if (profile === 'static' || profile === 'static-sveltia') {
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
  defaultProfile: 'static' | 'static-sveltia' | 'emdash' = 'emdash'
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
 * Converts a map or array of field errors into the format expected by FormError.astro.
 */
export function formatFormErrors(errors: Record<string, string> | { id: string; label: string }[]): FormErrorItem[] {
  if (Array.isArray(errors)) {
    return errors.map(e => ({ id: e.id, label: e.label }));
  }
  return Object.entries(errors).map(([id, label]) => ({ id, label }));
}
