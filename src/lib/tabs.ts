export interface TabDefinition {
  value: string;
  label: string;
  panelTabIndex?: 0 | -1;
}

export interface TabsProps {
  id: string;
  label: string;
  items: readonly TabDefinition[];
  defaultValue?: string;
  orientation?: 'horizontal' | 'vertical';
  activation?: 'automatic' | 'manual';
  syncKey?: string;
  persist?: boolean;
}

const syncRegistries = new Map<string, Set<TabsController>>();
const liveControllers = new Set<TabsController>();

export class TabsController {
  readonly root: HTMLElement;
  readonly id: string;
  readonly syncKey?: string;
  readonly persist?: boolean;
  readonly orientation: 'horizontal' | 'vertical';
  readonly activation: 'automatic' | 'manual';

  private tabs: HTMLButtonElement[] = [];
  private panels: HTMLElement[] = [];
  private selectedValue: string = '';
  private abortController: AbortController = new AbortController();

  constructor(root: HTMLElement) {
    this.root = root;
    this.id = root.getAttribute('data-tabs-id') || '';
    this.syncKey = root.getAttribute('data-sync-key') || undefined;
    this.persist = root.getAttribute('data-persist') === 'true';
    this.orientation = (root.getAttribute('data-orientation') as 'vertical' | 'horizontal') || 'horizontal';
    this.activation = (root.getAttribute('data-activation') as 'manual' | 'automatic') || 'automatic';

    liveControllers.add(this);
    this.init();
  }

  get isDestroyed(): boolean {
    return this.abortController.signal.aborted;
  }

  private init() {
    // Find direct tablist tabs and panels (avoid capturing nested tabs)
    const tablist = Array.from(this.root.children).find((child) =>
      child.getAttribute('data-tabs-list') !== null || child.classList.contains('tabs__list')
    ) || this.root.querySelector(`[data-tabs-list="${this.id}"]`);

    if (!tablist) return;

    this.tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>(`:scope > [role="tab"], :scope > button[data-tab-value]`));

    const panelsContainer = Array.from(this.root.children).find((child) =>
      child.getAttribute('data-tabs-panels') !== null || child.classList.contains('tabs__panels')
    ) || this.root;

    this.panels = Array.from(panelsContainer.querySelectorAll<HTMLElement>(`:scope > [data-tab-panel="${this.id}"], :scope > .tabs__panel[data-tab-value]`));

    if (this.tabs.length === 0) return;

    // Determine initial selection
    let initialValue = this.root.getAttribute('data-default-value') || this.tabs[0].getAttribute('data-tab-value') || '';

    // Check persistence if syncKey is set
    if (this.persist && this.syncKey) {
      try {
        const saved = localStorage.getItem(`baseline:tabs:${this.syncKey}`);
        if (saved && this.tabs.some((t) => t.getAttribute('data-tab-value') === saved)) {
          initialValue = saved;
        }
      } catch {
        // Ignore localStorage error
      }
    }

    // Register in sync registry
    if (this.syncKey) {
      if (!syncRegistries.has(this.syncKey)) {
        syncRegistries.set(this.syncKey, new Set());
      }
      syncRegistries.get(this.syncKey)!.add(this);
    }

    // Progressive enhancement: mark root as enhanced
    this.root.setAttribute('data-tabs-enhanced', 'true');

    // Attach listeners
    const signal = this.abortController.signal;

    this.tabs.forEach((tab, index) => {
      tab.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
          const val = tab.getAttribute('data-tab-value');
          if (val) this.select(val, { sync: true, focus: true });
        },
        { signal }
      );

      tab.addEventListener(
        'keydown',
        (e) => this.handleKeyDown(e, index),
        { signal }
      );
    });

    // Apply initial selection
    this.select(initialValue, { sync: false, focus: false });
  }

  private handleKeyDown(e: KeyboardEvent, index: number) {
    const isHorizontal = this.orientation === 'horizontal';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

    let targetIndex: number | null = null;

    if (e.key === nextKey) {
      targetIndex = (index + 1) % this.tabs.length;
    } else if (e.key === prevKey) {
      targetIndex = (index - 1 + this.tabs.length) % this.tabs.length;
    } else if (e.key === 'Home') {
      targetIndex = 0;
    } else if (e.key === 'End') {
      targetIndex = this.tabs.length - 1;
    } else if (this.activation === 'manual' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      const val = this.tabs[index].getAttribute('data-tab-value');
      if (val) this.select(val, { sync: true, focus: true });
      return;
    }

    if (targetIndex !== null) {
      e.preventDefault();
      const targetTab = this.tabs[targetIndex];
      const val = targetTab.getAttribute('data-tab-value');
      if (val) {
        if (this.activation === 'automatic') {
          this.select(val, { sync: true, focus: true });
        } else {
          // In manual activation, arrow keys move focus without selecting
          this.tabs.forEach((t) => t.setAttribute('tabindex', '-1'));
          targetTab.setAttribute('tabindex', '0');
          targetTab.focus();
        }
      }
    }
  }

  select(value: string, options: { sync?: boolean; focus?: boolean } = {}) {
    const { sync = true, focus = false } = options;
    const matchedTab = this.tabs.find((t) => t.getAttribute('data-tab-value') === value);
    if (!matchedTab) return;

    this.selectedValue = value;

    // Update tabs
    this.tabs.forEach((tab) => {
      const isSelected = tab === matchedTab;
      tab.setAttribute('aria-selected', String(isSelected));
      tab.setAttribute('tabindex', isSelected ? '0' : '-1');
      if (isSelected && focus) {
        tab.focus();
      }
    });

    // Update panels
    this.panels.forEach((panel) => {
      const isMatch = panel.getAttribute('data-tab-value') === value;
      if (isMatch) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });

    // Handle persistence
    if (this.persist && this.syncKey) {
      try {
        localStorage.setItem(`baseline:tabs:${this.syncKey}`, value);
      } catch {
        // Ignore storage error
      }
    }

    // Synchronize peer tabs with the same syncKey without stealing focus
    if (sync && this.syncKey) {
      const peers = syncRegistries.get(this.syncKey);
      if (peers) {
        for (const peer of Array.from(peers)) {
          if (!peer.root.isConnected || peer.isDestroyed) {
            peer.destroy();
          } else if (peer !== this && peer.selectedValue !== value) {
            peer.select(value, { sync: false, focus: false });
          }
        }
      }
    }
  }

  destroy() {
    this.abortController.abort();
    liveControllers.delete(this);
    activeControllers.delete(this.root);
    if (this.syncKey && syncRegistries.has(this.syncKey)) {
      const set = syncRegistries.get(this.syncKey)!;
      set.delete(this);
      if (set.size === 0) {
        syncRegistries.delete(this.syncKey);
      }
    }
  }
}

const activeControllers = new WeakMap<HTMLElement, TabsController>();

/**
 * Teardown all registered tabs controllers, optionally preserving persisted elements across View Transitions.
 */
export function teardownTabs(preservePersisted = true) {
  for (const controller of Array.from(liveControllers)) {
    const isPersisted = preservePersisted && Boolean(controller.root.closest('[data-astro-transition-persist]'));
    if (!isPersisted) {
      controller.destroy();
    }
  }
}

/**
 * Returns number of active controllers registered for a given syncKey.
 */
export function getActiveSyncCount(syncKey: string): number {
  return syncRegistries.get(syncKey)?.size ?? 0;
}

/**
 * Scans and initializes all tabs within a given container.
 */
export function initTabs(container: Document | HTMLElement = document) {
  const elements = container.querySelectorAll<HTMLElement>('[data-tabs-id]');
  elements.forEach((el) => {
    const existing = activeControllers.get(el);
    if (existing) {
      if (existing.isDestroyed || !el.isConnected) {
        existing.destroy();
        const controller = new TabsController(el);
        activeControllers.set(el, controller);
      }
    } else {
      const controller = new TabsController(el);
      activeControllers.set(el, controller);
    }
  });
}

// Lifecycle hook for Astro ClientRouter navigation
if (typeof document !== 'undefined') {
  document.addEventListener('astro:before-swap', () => teardownTabs(true));
}
