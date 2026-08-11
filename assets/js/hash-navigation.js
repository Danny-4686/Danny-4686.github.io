(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const nav = header.querySelector('.nav-links');
  let resizeFrame = 0;

  function headerOffset() {
    const rect = header.getBoundingClientRect();
    const top = Number.parseFloat(getComputedStyle(header).top) || 0;
    return Math.max(0, Math.ceil(rect.height + Math.max(0, top) + 18));
  }

  function syncHeaderOffset() {
    document.documentElement.style.setProperty('--site-header-offset', `${headerOffset()}px`);
  }

  function decodeHash(hash) {
    if (!hash || hash === '#') return '';
    try { return decodeURIComponent(hash.slice(1)); } catch { return hash.slice(1); }
  }

  function targetForHash(hash) {
    const id = decodeHash(hash);
    if (!id) return null;
    return document.getElementById(id);
  }

  function keepNavLinkVisible(link) {
    if (!nav || !link || nav.scrollWidth <= nav.clientWidth) return;
    const left = link.offsetLeft - ((nav.clientWidth - link.offsetWidth) / 2);
    nav.scrollTo({ left: Math.max(0, left), behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  function scrollToHash(hash, behavior = reducedMotion ? 'auto' : 'smooth') {
    const target = targetForHash(hash);
    if (!target) return false;
    syncHeaderOffset();
    const offset = headerOffset();
    const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset);
    window.scrollTo({ top, left: 0, behavior });
    return true;
  }

  function writeHash(hash) {
    if (!hash) return;
    const next = `${window.location.pathname}${window.location.search}${hash}`;
    if (window.location.hash === hash) window.history.replaceState(null, '', next);
    else window.history.pushState(null, '', next);
  }

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href');
    if (!targetForHash(hash)) return;

    event.preventDefault();
    writeHash(hash);
    scrollToHash(hash);
    keepNavLinkVisible(link.closest('.nav-links') ? link : nav?.querySelector(`a[href="${hash}"]`));
  }, true);

  window.addEventListener('hashchange', () => {
    if (window.location.hash) scrollToHash(window.location.hash);
  });

  function correctInitialHash() {
    syncHeaderOffset();
    if (!window.location.hash) return;
    scrollToHash(window.location.hash, 'auto');
    const active = nav?.querySelector(`a[href="${window.location.hash}"]`);
    keepNavLinkVisible(active);
  }

  syncHeaderOffset();
  requestAnimationFrame(() => requestAnimationFrame(correctInitialHash));
  window.addEventListener('load', () => {
    correctInitialHash();
    window.setTimeout(correctInitialHash, 180);
  }, { once: true });

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      syncHeaderOffset();
      if (window.location.hash) correctInitialHash();
    }).catch(() => {});
  }

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => syncHeaderOffset());
    observer.observe(header);
  }

  window.addEventListener('resize', () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      syncHeaderOffset();
    });
  }, { passive: true });
})();
