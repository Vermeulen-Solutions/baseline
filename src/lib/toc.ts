/**
 * Pure-DOM Table of Contents Scroll Spy Controller
 *
 * Tracks headings and content scroll positions using IntersectionObserver
 * and requestAnimationFrame. Avoids scroll-polling dead zones across long
 * paragraphs by tracking the reading position relative to declared sticky elements.
 *
 * Strictly adheres to:
 * - Zero external runtime dependencies.
 * - Updates only `aria-current="location"` without mutating browser history or stealing focus.
 * - Dynamically calculates sticky offsets from `[data-sticky-header]` or custom selectors.
 * - Handles View Transitions (`astro:before-swap` / `astro:after-swap` / `astro:page-load`).
 * - Disconnects on DOM removal or editor surface detection.
 */

export interface TocSpyOptions {
  tocElement?: HTMLElement | null;
  contentId?: string;
  offsetIds?: readonly string[];
  signal?: AbortSignal;
}

export class TocSpyController {
  private tocEl: HTMLElement;
  private contentEl: HTMLElement | null = null;
  private headings: HTMLElement[] = [];
  private links: HTMLAnchorElement[] = [];
  private offsetIds: readonly string[] = [];
  private observer: IntersectionObserver | null = null;
  private disconnectObserver: MutationObserver | null = null;
  private rafId: number | null = null;
  private destroyed = false;
  private abortController = new AbortController();

  constructor(tocEl: HTMLElement, options?: TocSpyOptions) {
    this.tocEl = tocEl;
    this.offsetIds = options?.offsetIds ?? this.parseOffsetIds();

    if (options?.signal) {
      if (options.signal.aborted) {
        this.destroy();
        return;
      }
      options.signal.addEventListener('abort', () => this.destroy(), { once: true });
    }

    this.init(options?.contentId);
  }

  private parseOffsetIds(): string[] {
    const raw = this.tocEl.getAttribute('data-offset-ids');
    if (!raw) return [];
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private init(explicitContentId?: string): void {
    // Check if inside an active CMS inline-editor surface; if so, skip enhancement
    if (this.tocEl.closest('[data-emdash-editor], [data-emdash-inline-editor], .emdash-editor, [contenteditable="true"]')) {
      return;
    }

    const contentId = explicitContentId || this.tocEl.getAttribute('data-content-id');
    if (contentId) {
      this.contentEl = document.getElementById(contentId) || document.querySelector(contentId);
    }
    if (!this.contentEl) {
      this.contentEl = document.querySelector('main article') || document.querySelector('main') || document.body;
    }

    this.links = Array.from(this.tocEl.querySelectorAll<HTMLAnchorElement>('a[data-toc-link], a.toc__link'));
    if (this.links.length === 0) {
      return;
    }

    // Collect target headings matching TOC link fragments
    const targetIds = new Set<string>();
    for (const link of this.links) {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const id = decodeURIComponent(href.slice(1));
        if (id) targetIds.add(id);
      }
    }

    if (targetIds.size === 0) {
      return;
    }

    // Find heading elements in document order
    const candidateHeadings = Array.from(
      (this.contentEl || document).querySelectorAll<HTMLElement>(
        'h1, h2, h3, h4, h5, h6, .heading-target, [id]'
      )
    );

    this.headings = candidateHeadings.filter((el) => targetIds.has(el.id));

    if (this.headings.length === 0) {
      return;
    }

    this.setupObserver();
    this.setupListeners();
    this.setupDisconnectObserver();

    // Initial update
    this.scheduleUpdate();
  }

  private getStickyOffset(): number {
    let offset = 0;

    // Check declared offset element IDs
    if (this.offsetIds.length > 0) {
      for (const id of this.offsetIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          offset = Math.max(offset, rect.bottom);
        }
      }
    }

    // Check global sticky header
    const stickyHeader = document.querySelector('[data-sticky-header]');
    if (stickyHeader) {
      const rect = stickyHeader.getBoundingClientRect();
      offset = Math.max(offset, rect.bottom);
    }

    // Check CSS custom property --header-height
    if (offset === 0) {
      try {
        const val = getComputedStyle(document.documentElement).getPropertyValue('--header-height').trim();
        if (val && val.endsWith('px')) {
          const parsed = parseFloat(val);
          if (!isNaN(parsed) && parsed > 0) {
            offset = parsed;
          }
        }
      } catch {
        // Fallback to 0 if getComputedStyle fails
      }
    }

    // Small breathing room below sticky header
    return Math.max(0, offset) + 16;
  }

  private setupObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      () => {
        this.scheduleUpdate();
      },
      {
        // Generous root margin detecting headings entering near top reading zone
        rootMargin: '0px 0px -40% 0px',
        threshold: [0, 1],
      }
    );

    for (const heading of this.headings) {
      this.observer.observe(heading);
    }
  }

  private onScroll = (): void => {
    this.scheduleUpdate();
  };

  private onResize = (): void => {
    this.scheduleUpdate();
  };

  private setupListeners(): void {
    window.addEventListener('scroll', this.onScroll, { passive: true, signal: this.abortController.signal });
    window.addEventListener('resize', this.onResize, { passive: true, signal: this.abortController.signal });
  }

  private setupDisconnectObserver(): void {
    if (typeof MutationObserver === 'undefined') return;

    // Observe documentElement for node removal
    this.disconnectObserver = new MutationObserver(() => {
      if (!this.tocEl.isConnected || (this.contentEl && !this.contentEl.isConnected)) {
        this.destroy();
      }
    });

    this.disconnectObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  private scheduleUpdate(): void {
    if (this.destroyed) return;
    if (this.rafId !== null) return;

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.updateActiveHeading();
    });
  }

  private updateActiveHeading(): void {
    if (this.destroyed || this.headings.length === 0) return;

    const stickyOffset = this.getStickyOffset();
    // Allow reading line threshold to encompass scroll-margin-top and active top reading zone
    const readingThreshold = Math.max(stickyOffset + 48, window.innerHeight * 0.25);
    const docElem = document.documentElement;
    const isAtBottom = Math.ceil(window.innerHeight + window.scrollY) >= docElem.scrollHeight - 2;

    let activeId: string | null = null;

    if (isAtBottom) {
      // At the very bottom of the page, activate the final heading
      activeId = this.headings[this.headings.length - 1].id;
    } else {
      // Find the last heading whose top has reached or passed the reading threshold
      for (let i = this.headings.length - 1; i >= 0; i--) {
        const heading = this.headings[i];
        const rect = heading.getBoundingClientRect();
        if (rect.top <= readingThreshold) {
          activeId = heading.id;
          break;
        }
      }

      // If scrolled to top and no heading has passed the sticky threshold yet,
      // activate the first heading if it's within viewport view
      if (!activeId && this.headings.length > 0) {
        const firstRect = this.headings[0].getBoundingClientRect();
        if (firstRect.top < window.innerHeight && firstRect.bottom > 0) {
          activeId = this.headings[0].id;
        }
      }
    }

    this.setActiveLink(activeId);
  }

  private setActiveLink(activeId: string | null): void {
    for (const link of this.links) {
      const href = link.getAttribute('href');
      const targetId = href && href.startsWith('#') ? decodeURIComponent(href.slice(1)) : null;

      if (activeId && targetId === activeId) {
        if (link.getAttribute('aria-current') !== 'location') {
          link.setAttribute('aria-current', 'location');
        }
        link.classList.add('is-active');
      } else {
        if (link.hasAttribute('aria-current')) {
          link.removeAttribute('aria-current');
        }
        link.classList.remove('is-active');
      }
    }
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.disconnectObserver) {
      this.disconnectObserver.disconnect();
      this.disconnectObserver = null;
    }

    this.abortController.abort();
    this.headings = [];
    this.links = [];
    this.contentEl = null;
  }
}

const activeControllers = new WeakMap<HTMLElement, TocSpyController>();

/**
 * Initializes TOC scroll spy on all eligible `[data-toc-spy]` elements inside root.
 */
export function initToc(root: Document | HTMLElement = document): () => void {
  const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-toc-spy]'));

  for (const el of elements) {
    if (activeControllers.has(el)) {
      activeControllers.get(el)?.destroy();
      activeControllers.delete(el);
    }
    const controller = new TocSpyController(el);
    activeControllers.set(el, controller);
  }

  return () => {
    for (const el of elements) {
      activeControllers.get(el)?.destroy();
      activeControllers.delete(el);
    }
  };
}

// Global lifecycle binding for Astro View Transitions and standard page loads
if (typeof document !== 'undefined') {
  document.addEventListener('astro:page-load', () => {
    initToc(document);
  });

  document.addEventListener('astro:before-swap', () => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-toc-spy]'));
    for (const el of elements) {
      activeControllers.get(el)?.destroy();
      activeControllers.delete(el);
    }
  });
}
