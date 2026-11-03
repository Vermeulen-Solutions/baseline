export interface CopyTextOptions {
  signal?: AbortSignal;
}

/**
 * Copies plain text to the clipboard using native navigator.clipboard with execCommand fallback.
 * Does not depend on the Permissions API.
 */
export async function copyText(text: string, options?: CopyTextOptions): Promise<void> {
  if (options?.signal?.aborted) {
    throw new DOMException('Copy operation aborted', 'AbortError');
  }

  // 1. Try modern asynchronous Clipboard API if supported and in secure context
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      if (options?.signal?.aborted) {
        throw new DOMException('Copy operation aborted', 'AbortError');
      }
      return;
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') throw err;
      // Fall through to legacy execCommand fallback on clipboard writeText failure
    }
  }

  // 2. Legacy execCommand('copy') fallback
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    // Position off-screen without causing page layout shifts or focus scrolling
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';

    document.body.appendChild(textarea);
    try {
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      // Fallback for non-secure contexts or legacy browsers
      const doc = document as Document & { execCommand?: (cmd: string) => boolean };
      const successful = typeof doc.execCommand === 'function' ? doc.execCommand('copy') : false;
      if (!successful) {
        throw new Error('execCommand copy returned false');
      }
      if (options?.signal?.aborted) {
        throw new DOMException('Copy operation aborted', 'AbortError');
      }
      return;
    } finally {
      document.body.removeChild(textarea);
    }
  }

  throw new Error('Clipboard access is not available in this environment');
}

/**
 * Extracts plain text from a DOM element, stripping line numbers or decorative prompt markers.
 */
export function extractCopyableText(element: HTMLElement, source: 'text' | 'value' = 'text'): string {
  if (source === 'value' && 'value' in element && typeof (element as HTMLInputElement).value === 'string') {
    return (element as HTMLInputElement).value;
  }

  // Clone element to strip line numbers or decorations without mutating the live DOM
  const clone = element.cloneNode(true) as HTMLElement;
  const decorations = clone.querySelectorAll('.line-number, .line-numbers, [data-line-number], [aria-hidden="true"]');
  decorations.forEach((d) => d.remove());

  return clone.textContent || '';
}
