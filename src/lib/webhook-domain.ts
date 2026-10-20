/** Domain isolation AFTER provider signature verification and payload validation.
 * Pass the verified event's sending domain, never a newsletter recipient domain.
 * Canonical sites often send from a subdomain/provider domain: configure it explicitly.
 */
export function isWebhookDomainAllowed(sendingDomain: unknown, allowedDomains: readonly string[]): boolean {
  const normalize = (value: unknown): string | undefined => {
    if (typeof value !== 'string' || value !== value.trim()) return undefined;
    const domain = value.toLowerCase();
    return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain) ? domain : undefined;
  };
  const domain = normalize(sendingDomain);
  return domain !== undefined && allowedDomains.some(allowed => normalize(allowed) === domain);
}
