import { inspectReference, referenceLimits } from './reference-image.mjs';

export function createReferenceOverlay(drawer: HTMLElement, signal: AbortSignal, activated?: () => void) {
  const get = <T extends HTMLElement>(id: string) => drawer.querySelector<T>('#tweaks-reference-' + id)!;
  const button = get<HTMLButtonElement>('btn'), file = get<HTMLInputElement>('file'), drop = get<HTMLElement>('drop');
  const status = get<HTMLElement>('status'), pad = get<HTMLElement>('alignment');
  const opacity = get<HTMLInputElement>('opacity'), x = get<HTMLInputElement>('x'), y = get<HTMLInputElement>('y');
  const dpr = get<HTMLInputElement>('dpr'), scale = get<HTMLInputElement>('scale'), mode = get<HTMLSelectElement>('mode');
  const layer = document.createElement('div'); layer.id = 'tweaks-reference-overlay'; layer.dataset.tweaksDiagnostic = '';
  layer.setAttribute('aria-hidden', 'true'); layer.inert = true;
  Object.assign(layer.style, { position:'fixed', inset:'0', overflow:'hidden', pointerEvents:'none', zIndex:'999996' });
  let active = false, frame = 0, generation = 0;
  let image: HTMLImageElement | undefined, metadata: {width:number; height:number} | undefined;
  const urls = new Set<string>();
  const number = (input: HTMLInputElement, fallback: number, min: number, max: number) => {
    const value = Number(input.value); return input.value !== '' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  };
  function draw() {
    frame = 0; layer.hidden = !active || !image;
    if (!image || !metadata) return;
    const ratio = number(dpr,1,.25,8), zoom = number(scale,1,.1,4), width = metadata.width / ratio;
    const left = number(x,0,-100000,100000) - (mode.value === 'document' ? scrollX : 0);
    const top = number(y,0,-100000,100000) - (mode.value === 'document' ? scrollY : 0);
    Object.assign(image.style, { width: `${width * zoom}px`, opacity: String(number(opacity,.5,0,1)), transform: `translate(${left}px, ${top}px)` });
    const mismatch = Math.abs(width - innerWidth) > 1 || (mode.value === 'viewport' && Math.abs(metadata.height / ratio - innerHeight) > 1) || Math.abs(ratio - devicePixelRatio) > .01;
    const message = `${active ? 'Reference shown' : 'Reference hidden'} · ${metadata.width}×${metadata.height} bitmap · ${width}×${metadata.height / ratio} CSS px at reference DPR ${ratio} · ${mode.value} · scale ${zoom}. ${mismatch ? 'Viewport/DPR mismatch; image is not stretched.' : 'Capture dimensions match.'} Visual comparison only; no numerical diff.`;
    if (status.textContent !== message) status.textContent = message;
  }
  function refresh() { if (!frame) frame = requestAnimationFrame(draw); }
  function setActive(value: boolean) {
    active = value; button.setAttribute('aria-pressed', String(active));
    if (active) activated?.();
    if (active && !layer.isConnected) document.body.append(layer);
    draw(); if (!image) status.textContent = active ? 'Choose or drop a local PNG, JPEG or WebP reference.' : 'Reference off. No file retained.';
  }
  const revoke = (url: string) => { URL.revokeObjectURL(url); urls.delete(url); };
  function resetAlignment() { opacity.value = '.5'; x.value = y.value = '0'; dpr.value = scale.value = '1'; mode.value = 'document'; draw(); }
  function clear() {
    generation++; for (const url of urls) revoke(url);
    image?.removeAttribute('src'); image = undefined; metadata = undefined; file.value = ''; layer.replaceChildren();
    resetAlignment(); setActive(false);
  }
  async function load(files: FileList | File[] | null) {
    if (!files || files.length !== 1) { status.textContent = 'Choose exactly one local raster file.'; return; }
    const selected = files[0], request = ++generation;
    let url: string | undefined;
    try {
      if (!selected.size || selected.size > referenceLimits.bytes) throw Error('Choose a nonempty reference of at most 10 MiB.');
      const meta = inspectReference(new Uint8Array(await selected.arrayBuffer()), selected.type);
      if (request !== generation || signal.aborted) return;
      url = URL.createObjectURL(selected); urls.add(url);
      const candidate = new Image(); candidate.alt = ''; candidate.src = url;
      await candidate.decode();
      if (request !== generation || signal.aborted) { revoke(url); return; }
      if (candidate.naturalWidth !== meta.width || candidate.naturalHeight !== meta.height) throw Error('Decoded dimensions differ from the raster header. Re-export the reference with orientation applied.');
      for (const previous of [...urls]) if (previous !== url) revoke(previous);
      Object.assign(candidate.style, { position:'absolute', top:'0', left:'0', maxWidth:'none', maxHeight:'none', height:'auto', margin:'0', padding:'0', border:'0', display:'block', transition:'none' });
      image = candidate; metadata = meta; layer.replaceChildren(candidate); setActive(true);
    } catch (error) { if (url) revoke(url); if (request === generation && !signal.aborted) status.textContent = error instanceof Error ? error.message : 'Reference decode failed.'; }
  }
  const options = {signal};
  button.addEventListener('click', () => setActive(!active), options);
  file.addEventListener('change', () => { void load(file.files); }, options);
  drop.addEventListener('dragover', event => { event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'; }, options);
  drop.addEventListener('drop', event => { event.preventDefault(); void load(event.dataTransfer?.files ?? null); }, options);
  for (const input of [opacity,x,y,dpr,scale,mode]) input.addEventListener('input', refresh, options);
  get('reset').addEventListener('click', resetAlignment, options); get('clear').addEventListener('click', clear, options);
  pad.addEventListener('keydown', event => {
    if (!active || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
    event.preventDefault(); const step = event.shiftKey ? 10 : 1;
    x.value = String(number(x,0,-100000,100000) + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0));
    y.value = String(number(y,0,-100000,100000) + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0)); draw();
  }, options);
  window.addEventListener('scroll', refresh, {signal, passive:true, capture:true}); window.addEventListener('resize', refresh, options);
  window.visualViewport?.addEventListener('resize', refresh, options);
  signal.addEventListener('abort', () => { clear(); cancelAnimationFrame(frame); layer.remove(); }, {once:true});
  setActive(false);
  return {get active() {return active;}, toggle:()=>setActive(!active), hide:()=>setActive(false), clear};
}
