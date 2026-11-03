export interface AnnouncementOptions {
  priority?: 'polite' | 'assertive';
  signal?: AbortSignal;
}

/**
 * Announces a text message to a designated live region container.
 * Targets either polite or assertive sub-channels via textContent.
 *
 * @param announcerId Element ID of the Announcer container
 * @param message Plain-text message to announce (HTML is never evaluated)
 * @param options Announcement options including priority and cancellation signal
 * @returns boolean true if announced, false if container was unavailable
 */
export function announce(
  announcerId: string,
  message: string,
  options?: AnnouncementOptions
): boolean {
  if (options?.signal?.aborted) return false;
  if (!announcerId || !message) return false;

  const container = document.getElementById(announcerId);
  if (!container) return false;

  const priority = options?.priority || 'polite';
  const selector = priority === 'assertive' ? '[data-announcer-assertive]' : '[data-announcer-polite]';
  const region = container.querySelector(selector);
  if (!region) return false;

  // Clear and update textContent to ensure screen readers register the change
  region.textContent = '';
  // Use requestAnimationFrame / microtask to ensure DOM mutation triggers assistive tech
  queueMicrotask(() => {
    if (options?.signal?.aborted) return;
    region.textContent = message;
  });

  return true;
}
