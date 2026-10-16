/** Dev-only read-only alignment guide. Imported behind TweaksBar's DEV guard. */
export function createGridGuide(drawer: HTMLElement, signal: AbortSignal) {
  const button = drawer.querySelector<HTMLButtonElement>('#tweaks-grid-btn')!;
  const targets = drawer.querySelector<HTMLSelectElement>('#tweaks-grid-target')!;
  const columns = drawer.querySelector<HTMLSelectElement>('#tweaks-grid-columns')!;
  const status = drawer.querySelector<HTMLElement>('#tweaks-grid-status')!;
  const containers = [...document.querySelectorAll<HTMLElement>('.container-shell, .site-main')];
  let active = false;
  let frame = 0;
  let selected: HTMLElement | undefined;
  const overlay = document.createElement('div');
  overlay.id = 'tweaks-grid-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, { position: 'fixed', top: '0', bottom: '0', pointerEvents: 'none', zIndex: '999998', display: 'none', boxSizing: 'border-box' });
  targets.replaceChildren();
  for (const [index, container] of containers.entries()) {
    const width = ['reading', 'content', 'wide'].find(value => container.classList.contains(`container-shell--${value}`));
    targets.add(new Option(width ? `${width} container ${index + 1}` : `main content ${index + 1}`, String(index)));
  }
  // Prefer the first actual Container over the surrounding padded site-main.
  targets.value = String(Math.max(0, containers.findIndex(container => container.classList.contains('container-shell'))));
  function draw() {
    frame = 0;
    if (!active || !selected?.isConnected) { overlay.style.display = 'none'; return; }
    const rect = selected.getBoundingClientRect();
    const style = getComputedStyle(selected);
    const insetLeft = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.borderLeftWidth) || 0);
    const insetRight = (parseFloat(style.paddingRight) || 0) + (parseFloat(style.borderRightWidth) || 0);
    const left = rect.left + insetLeft;
    const width = Math.max(0, rect.width - insetLeft - insetRight);
    Object.assign(overlay.style, { display: 'grid', left: `${left}px`, width: `${width}px`, gridTemplateColumns: `repeat(${columns.value === '10' ? 10 : 12}, minmax(0, 1fr))`, columnGap: style.getPropertyValue('--spacing-grid').trim() || '0px', direction: style.direction });
    status.textContent = `${Math.round(width)}px content · ${getComputedStyle(overlay).columnGap} gaps · ${style.direction}`;
  }
  function schedule() { if (active && !frame) frame = requestAnimationFrame(draw); }
  const observer = new ResizeObserver(schedule);
  function select() {
    observer.disconnect();
    selected = containers[Number(targets.value)];
    if (selected) observer.observe(selected);
    schedule();
  }
  function setActive(value: boolean) {
    active = value && Boolean(selected);
    button.setAttribute('aria-pressed', String(active));
    if (active) { if (!overlay.isConnected) document.body.append(overlay); draw(); }
    else { overlay.style.display = 'none'; status.textContent = 'Guide off. No source styles changed.'; }
  }
  function setColumns() {
    overlay.replaceChildren(...Array.from({ length: columns.value === '10' ? 10 : 12 }, () => {
      const track = document.createElement('span');
      Object.assign(track.style, { minWidth: '0', background: 'color-mix(in srgb, var(--color-action) 10%, transparent)', borderInline: '1px solid color-mix(in srgb, var(--color-action) 35%, transparent)' });
      return track;
    }));
    schedule();
  }
  button.disabled = !containers.length;
  button.addEventListener('click', () => setActive(!active), { signal });
  targets.addEventListener('change', select, { signal });
  columns.addEventListener('change', setColumns, { signal });
  window.addEventListener('resize', schedule, { signal });
  window.addEventListener('scroll', schedule, { signal, passive: true, capture: true });
  window.visualViewport?.addEventListener('resize', schedule, { signal });
  signal.addEventListener('abort', () => { observer.disconnect(); cancelAnimationFrame(frame); overlay.remove(); }, { once: true });
  select(); setColumns(); setActive(false);
  return { get active() { return active; }, toggle: () => setActive(!active), hide: () => setActive(false), refresh: schedule };
}
