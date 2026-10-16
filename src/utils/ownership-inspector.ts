import { decodeOwnership } from './emdash-ownership.mjs';

export function createOwnershipInspector(drawer: HTMLElement, signal: AbortSignal, version: string) {
  const button = drawer.querySelector<HTMLButtonElement>('#tweaks-ownership-btn')!;
  const targets = drawer.querySelector<HTMLSelectElement>('#tweaks-ownership-target')!;
  const status = drawer.querySelector<HTMLElement>('#tweaks-ownership-status')!;
  const details = drawer.querySelector<HTMLElement>('#tweaks-ownership-details')!;
  const layer = document.createElement('div'); layer.id = 'tweaks-ownership-overlay'; layer.dataset.tweaksDiagnostic = '';
  layer.setAttribute('aria-hidden','true'); layer.inert = true;
  Object.assign(layer.style,{position:'fixed',inset:'0',overflow:'hidden',pointerEvents:'none',zIndex:'999997'});
  const excluded = '#tweaks-panel,[data-tweaks-diagnostic],#emdash-toolbar,dialog,[role="dialog"],[aria-modal="true"],[contenteditable="true"],.tiptap,.ProseMirror,script,style,noscript';
  let active = false, frame = 0, dirty = false, selected: Element | undefined;
  let entries: Element[] = [];
  function eligible(element: Element) { return element.isConnected && !element.closest(excluded); }
  function describe(element: Element) {
    const marker = element.closest('[data-emdash-ref]');
    const own = element.getAttribute('data-emdash-ref');
    const parsed = decodeOwnership(own ?? marker?.getAttribute('data-emdash-ref') ?? null, version);
    // An entry wrapper is context, never proof its descendant UI text is bound.
    const result = own === null && parsed.kind === 'entry' ? decodeOwnership(null,version) : parsed;
    const context = own === null && parsed.kind === 'entry' ? ` Entry context: ${parsed.collection} / ${parsed.id}.` : '';
    details.textContent = `${element.tagName.toLowerCase()}: ${result.message}${context}${result.kind === 'field' || result.kind === 'entry' ? ` Collection: ${result.collection}; entry: ${result.id}; field: ${result.kind === 'field' ? result.field : 'entry context only'}. Locale: ${result.locale}` : ''}`;
    return result.kind;
  }
  function box(element: Element, kind: string, selected = false) {
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth) return;
    const mark = document.createElement('div'); mark.dataset.ownershipKind = kind;
    Object.assign(mark.style, {position:'absolute',left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,boxSizing:'border-box',border:`${selected ? 3 : 2}px ${kind === 'unannotated' || kind === 'unsupported' ? 'dashed' : 'solid'} ${kind === 'field' ? '#16a34a' : kind === 'entry' ? '#0284c7' : kind === 'unsupported' ? '#d946ef' : '#d97706'}`});
    layer.append(mark);
  }
  function scan() {
    const all = [...document.querySelectorAll('[data-emdash-ref]')].filter(eligible);
    entries = all.slice(0,250); targets.replaceChildren(new Option('Hover or focus page content', ''));
    let fields = 0, contexts = 0, unsupported = 0;
    entries.forEach((element,index) => {
      const result = decodeOwnership(element.getAttribute('data-emdash-ref'),version);
      if (result.kind === 'field') fields++; else if (result.kind === 'entry') contexts++; else unsupported++;
      targets.add(new Option(result.kind === 'field' || result.kind === 'entry' ? `${result.collection} / ${result.id} / ${result.kind === 'field' ? result.field : 'entry context'}` : `Unsupported marker ${index + 1}`,String(index)));
    });
    if (selected && entries.includes(selected)) targets.value = String(entries.indexOf(selected));
    status.textContent = `EmDash ${version || 'unknown'} · ${fields} field annotations · ${contexts} entry contexts · ${unsupported} unsupported${all.length > 250 ? ' · first 250 markers only' : ''}. ${all.length ? 'Annotations observed; editing/saveability unverified.' : 'No markers observed; normal in public mode. Ownership is unknown.'}`;
  }
  function draw() {
    frame = 0; if (!active) return;
    if (dirty) { dirty = false; scan(); }
    if (selected && !eligible(selected)) { selected = undefined; details.textContent = 'Selected element is no longer available for inspection.'; }
    layer.replaceChildren();
    for (const element of entries) if (eligible(element)) box(element,decodeOwnership(element.getAttribute('data-emdash-ref'),version).kind);
    if (selected && eligible(selected)) box(selected,describe(selected),true);
  }
  function refresh(rescan = false) { if (!active) return; dirty ||= rescan; if (!frame) frame = requestAnimationFrame(draw); }
  const observer = new MutationObserver(records => {
    if (records.some(record => record.target instanceof Element && !record.target.closest(excluded) && (record.type === 'attributes' || [...record.addedNodes,...record.removedNodes].some(node => !(node instanceof Element) || !node.matches('[data-tweaks-diagnostic]'))))) refresh(true);
  });
  function setActive(value: boolean) {
    active = value; button.setAttribute('aria-pressed',String(active));
    if (active) {
      if (!layer.isConnected) document.body.append(layer);
      dirty = true; draw(); observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-emdash-ref']});
      details.textContent = 'Green solid: field annotation; blue solid: entry context; amber dashed: unannotated/unknown; magenta dashed: unsupported. Hover/focus page text or select a marker. No content values are displayed.';
      details.scrollIntoView({block:'nearest'});
    } else {
      observer.disconnect(); cancelAnimationFrame(frame); frame = 0; layer.remove(); layer.replaceChildren(); entries = []; selected = undefined; targets.replaceChildren();
      status.textContent = 'Ownership inspector off. Read-only diagnostics.'; details.textContent = '';
    }
  }
  const options = {signal};
  button.addEventListener('click',()=>setActive(!active),options);
  targets.addEventListener('change',()=>{selected = entries[Number(targets.value)]; if (targets.value === '') selected = undefined; selected?.scrollIntoView({block:'center'}); refresh();},options);
  const inspect = (event: Event) => {
    if (!active) return;
    const element = event.composedPath().find(target => target instanceof Element && eligible(target)) as Element | undefined;
    if (!element || event.composedPath().some(target => target instanceof Element && target.matches(excluded))) return;
    if (element !== selected) {selected = element; targets.value = ''; refresh();}
  };
  document.addEventListener('pointermove',inspect,{signal,passive:true}); document.addEventListener('focusin',inspect,options);
  window.addEventListener('scroll',()=>refresh(),{signal,passive:true,capture:true}); window.addEventListener('resize',()=>refresh(),options);
  window.visualViewport?.addEventListener('resize',()=>refresh(),options);
  signal.addEventListener('abort',()=>setActive(false),{once:true}); setActive(false);
  return {get active(){return active;},toggle:()=>setActive(!active),hide:()=>setActive(false)};
}
