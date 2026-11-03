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
      if (options?.signal?.aborted || (err as Error)?.name === 'AbortError') {
        throw new DOMException('Copy operation aborted', 'AbortError');
      }
      // Fall through to legacy execCommand fallback on clipboard writeText failure
    }
  }

  // 2. Legacy execCommand('copy') fallback
  if (options?.signal?.aborted) {
    throw new DOMException('Copy operation aborted', 'AbortError');
  }

  if (typeof document !== 'undefined') {
    if (options?.signal?.aborted) {
      throw new DOMException('Copy operation aborted', 'AbortError');
    }

    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const selection = typeof document.getSelection === 'function' ? document.getSelection() : null;
    const previousRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

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
      if (options?.signal?.aborted) {
        throw new DOMException('Copy operation aborted', 'AbortError');
      }
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      if (options?.signal?.aborted) {
        throw new DOMException('Copy operation aborted', 'AbortError');
      }
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
      if (textarea.parentNode) {
        textarea.parentNode.removeChild(textarea);
      }
      // Conditionally restore focus and selection without overwriting user navigation
      if (!options?.signal?.aborted && previousActive && previousActive.isConnected) {
        if (document.activeElement === textarea || document.activeElement === document.body || document.activeElement === null) {
          try {
            previousActive.focus();
          } catch {}
        }
      }
      if (!options?.signal?.aborted && selection && previousRange) {
        try {
          selection.removeAllRanges();
          selection.addRange(previousRange);
        } catch {}
      }
    }
  }

  throw new Error('Clipboard access is not available in this environment');
}

export const DEFAULT_COPY_EXCLUDE_SELECTOR =
  '[data-copy-exclude], [data-prompt], .prompt, .line-number, .line-numbers, [data-line-number], [aria-hidden="true"]';

export interface ExtractCopyableTextOptions {
  source?: 'text' | 'value';
  excludeSelector?: string;
}

/**
 * Extracts plain text from a DOM element, stripping designated decorative markers and line numbers.
 * Uses an explicit removable-decoration contract rather than stripping legitimate code symbols.
 */
export function extractCopyableText(
  element: HTMLElement,
  optionsOrSource: 'text' | 'value' | ExtractCopyableTextOptions = 'text'
): string {
  const options: ExtractCopyableTextOptions =
    typeof optionsOrSource === 'string' ? { source: optionsOrSource } : optionsOrSource;
  const source = options.source || 'text';
  const excludeSelector = options.excludeSelector || DEFAULT_COPY_EXCLUDE_SELECTOR;

  if (source === 'value' && 'value' in element && typeof (element as HTMLInputElement).value === 'string') {
    return (element as HTMLInputElement).value;
  }

  // Clone element to strip designated decorations without mutating the live DOM
  const clone = element.cloneNode(true) as HTMLElement;
  const decorations = clone.querySelectorAll(excludeSelector);
  decorations.forEach((d) => d.remove());

  return clone.textContent || '';
}
