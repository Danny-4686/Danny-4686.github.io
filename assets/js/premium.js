// CloudLab finishing layer: faster page changes and gentler image loading.
(() => {
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const connection = navigator.connection;
  const saveData = Boolean(connection?.saveData) || /(^|-)2g$/.test(connection?.effectiveType || '');

  // Internal pages are fetched as soon as a link is hovered or touched, so the click
  // feels instant. Chrome also gets speculation rules, which do the same natively.
  const prefetched = new Set([location.pathname]);
  function internalUrl(link) {
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return null;
    let url;
    try { url = new URL(link.href, location.href); } catch (_) { return null; }
    if (url.origin !== location.origin || url.pathname === location.pathname) return null;
    if (/\.(png|jpe?g|webp|gif|mp4|webm|pdf|zip|json)$/i.test(url.pathname)) return null;
    return url;
  }
  function prefetch(link) {
    const url = internalUrl(link);
    if (!url || saveData || prefetched.has(url.pathname)) return;
    prefetched.add(url.pathname);
    const hint = document.createElement('link');
    hint.rel = 'prefetch';
    hint.href = url.pathname;
    document.head.appendChild(hint);
  }
  const supportsRules = HTMLScriptElement.supports?.('speculationrules');
  if (supportsRules && !saveData) {
    const rules = document.createElement('script');
    rules.type = 'speculationrules';
    rules.textContent = JSON.stringify({
      prefetch: [{ where: { and: [{ href_matches: '/*' }, { not: { href_matches: '/account/*' } }, { not: { selector_matches: '[target=_blank]' } }] }, eagerness: 'moderate' }]
    });
    document.head.appendChild(rules);
  } else {
    const onIntent = (event) => prefetch(event.target.closest?.('a[href]'));
    document.addEventListener('pointerover', onIntent, { passive: true });
    document.addEventListener('touchstart', onIntent, { passive: true });
    document.addEventListener('focusin', onIntent);
  }

  // A slim progress bar shows the next page is on its way.
  let bar = null;
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    const url = internalUrl(link);
    if (!url || reducedMotion) return;
    if (!bar) { bar = document.createElement('div'); bar.className = 'cl-nav-progress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar); }
    requestAnimationFrame(() => bar.classList.add('is-active'));
  });
  window.addEventListener('pageshow', () => bar?.classList.remove('is-active'));

  // Images that are still downloading fade in instead of drawing in line by line.
  if (reducedMotion) return;
  function soften(image) {
    if (!(image instanceof HTMLImageElement) || image.dataset.clFade || image.closest('.is-media-loading, .cloudlab-site-intro')) return;
    image.dataset.clFade = '1';
    if (image.complete && image.naturalWidth) return;
    image.classList.add('cl-fade');
    const done = () => image.classList.add('is-loaded');
    image.addEventListener('load', done, { once: true });
    image.addEventListener('error', done, { once: true });
  }
  // Images already on screen are left alone so nothing above the fold blinks out.
  document.querySelectorAll('img').forEach((image) => {
    if (image.loading !== 'lazy' && image.getBoundingClientRect().top < window.innerHeight) { image.dataset.clFade = '1'; return; }
    soften(image);
  });
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.tagName === 'IMG') soften(node);
        else node.querySelectorAll?.('img').forEach(soften);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
