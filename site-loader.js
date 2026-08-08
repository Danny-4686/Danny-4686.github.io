(() => {
  const STORAGE_KEY = 'cloudlab-site-intro-last-seen';
  const INTRO_WINDOW_MS = 60 * 60 * 1000;
  const MIN_VISIBLE_MS = 1350;
  const EXIT_MS = 560;
  const startedAt = performance.now();
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion) return;

  let lastSeen = 0;
  try { lastSeen = Number(localStorage.getItem(STORAGE_KEY) || 0); } catch (_) {}
  if (Date.now() - lastSeen < INTRO_WINDOW_MS) return;

  try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch (_) {}
  document.documentElement.classList.add('cloudlab-intro-pending');

  let mounted = false;
  let released = false;

  function releasePage(overlay) {
    if (released) return;
    released = true;
    document.documentElement.classList.remove('cloudlab-intro-pending');
    overlay?.classList.add('is-leaving');
    window.setTimeout(() => {
      overlay?.remove();
      document.documentElement.classList.remove('cloudlab-intro-active');
    }, EXIT_MS);
  }

  function mountIntro() {
    if (mounted || !document.body) return;
    mounted = true;

    const overlay = document.createElement('div');
    overlay.className = 'cloudlab-site-intro';
    overlay.setAttribute('role', 'presentation');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="cloudlab-intro-stage">
        <div class="cloudlab-intro-earth-shell">
          <span class="cloudlab-intro-orbit"></span>
          <span class="cloudlab-intro-orbit secondary"></span>
          <img class="cloudlab-intro-earth" src="/assets/images/cloudlab-logo.png" alt="">
        </div>
        <p class="cloudlab-intro-kicker">CLOUDLAB</p>
        <h1 class="cloudlab-intro-title">Danny4686</h1>
        <p class="cloudlab-intro-subtitle">Loading the studio</p>
        <div class="cloudlab-intro-line"><span></span></div>
      </div>`;

    document.body.prepend(overlay);
    document.documentElement.classList.add('cloudlab-intro-active');
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('is-entering')));

    const elapsed = performance.now() - startedAt;
    const remaining = Math.max(450, MIN_VISIBLE_MS - elapsed);
    window.setTimeout(() => releasePage(overlay), remaining);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountIntro, { once: true });
  } else {
    mountIntro();
  }

  // Never allow a loader failure to keep the page hidden.
  window.setTimeout(() => {
    if (!mounted) {
      released = true;
      document.documentElement.classList.remove('cloudlab-intro-pending', 'cloudlab-intro-active');
    }
  }, 3000);
})();
