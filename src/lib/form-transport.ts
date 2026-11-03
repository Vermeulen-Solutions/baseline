/**
 * Profile-aware form transport resolver and bounds validator.
 * Provides progressive enhancement contracts for both static and server/EmDash profiles.
 */

export interface FormEndpointConfig {
  endpoint?: string;
  profile?: 'static' | 'static-sveltia' | 'emdash';
  actionName?: string;
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

/**
 * Resolves the appropriate form transport action URL.
 * Preserves profile boundaries: static profiles must use external endpoints (or empty fallback)
 * and must never silently invoke server action routes.
 */
export function resolveFormAction(config?: FormActionConfig): string {
  if (!config) return '';
  if (typeof config === 'string') {
    return config.trim();
  }

  const profile = config.profile || 'emdash';
  const endpoint = (config.endpoint || '').trim();

  if (profile === 'static' || profile === 'static-sveltia') {
    if (/^https?:\/\//i.test(endpoint)) {
      return endpoint;
    }
    // Static profile cannot use relative /_actions without a server runtime
    return endpoint && !endpoint.startsWith('/_actions') ? endpoint : '';
  }

  // Server / EmDash profile: supports local server routes and Astro Actions
  if (endpoint) return endpoint;
  if (config.actionName) return `/_actions/${config.actionName}`;
  return '';
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
 */
export function validateFormField(value: unknown, rule: FieldValidationRule): string | null {
  const str = sanitizeFormValue(value, rule.maxLength || 2000);

  if (rule.required && !str) {
    return `${rule.fieldName} is required.`;
  }
  if (rule.minLength && str.length < rule.minLength) {
    return `${rule.fieldName} must be at least ${rule.minLength} characters.`;
  }
  if (rule.maxLength && str.length > rule.maxLength) {
    return `${rule.fieldName} cannot exceed ${rule.maxLength} characters.`;
  }
  if (rule.pattern && str && !rule.pattern.test(str)) {
    return `Enter a valid format for ${rule.fieldName.toLowerCase()}.`;
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
