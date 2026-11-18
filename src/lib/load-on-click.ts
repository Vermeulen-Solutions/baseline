/**
 * Third-party frames that load only when the visitor asks (VideoEmbed, MapEmbed): until then no
 * request reaches the provider, so it sets no cookies and sees no visit. A click on the
 * [data-load-trigger] inside a [data-load-iframe] figure replaces the stand-in with the frame and
 * moves focus to it. The trigger is a real link, so without JavaScript it opens the provider.
 */
export function setupLoadOnClick(root: ParentNode = document) {
  for (const figure of root.querySelectorAll<HTMLElement>('[data-load-iframe]')) {
    if (figure.dataset.loadBound) continue;
    figure.dataset.loadBound = 'true';
    const trigger = figure.querySelector<HTMLAnchorElement>('[data-load-trigger]');
    trigger?.addEventListener('click', event => {
      const src = figure.dataset.loadIframe;
      if (!src || !/^https:\/\//.test(src)) return;
      event.preventDefault();
      const frame = document.createElement('iframe');
      frame.src = src;
      frame.title = figure.dataset.loadTitle || '';
      frame.allow = 'autoplay; fullscreen; picture-in-picture';
      frame.setAttribute('allowfullscreen', '');
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.loading = 'eager';
      (trigger.closest('.map-embed__placeholder') ?? trigger).replaceWith(frame);
      figure.querySelector('.video-embed__poster')?.remove();
      frame.focus();
    });
  }
}
