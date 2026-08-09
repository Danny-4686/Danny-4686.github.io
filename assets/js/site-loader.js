(() => {
  const STORAGE_KEY = 'cloudlab-site-intro-last-seen';
  const INTRO_WINDOW_MS = 60 * 60 * 1000;
  const MIN_VISIBLE_MS = 1350;
  const EXIT_MS = 560;
  const SETTINGS_URL = 'https://api.danny4686.com/v1/site-settings';
  const startedAt = performance.now();
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion) return;

  let lastSeen = 0;
  try { lastSeen = Number(localStorage.getItem(STORAGE_KEY) || 0); } catch (_) {}
  const hourlyIntroDue = Date.now() - lastSeen >= INTRO_WINDOW_MS;

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
          <img class="cloudlab-intro-earth" src="/assets/images/optimized/cloudlab-logo-256.webp" width="256" height="256" alt="">
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

  function playIntro() {
    document.documentElement.classList.add('cloudlab-intro-pending');
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch (_) {}
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountIntro, { once: true });
    } else {
      mountIntro();
    }
  }

  async function readForceSetting() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 900);
    try {
      const response = await fetch(`${SETTINGS_URL}?t=${Date.now()}`, {
        cache: 'no-store',
        credentials: 'omit',
        signal: controller.signal
      });
      if (!response.ok) return false;
      const data = await response.json().catch(() => ({}));
      return data.forceSiteIntro === true;
    } catch (_) {
      return false;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  if (hourlyIntroDue) {
    playIntro();
  } else {
    readForceSetting().then((forced) => {
      if (forced) playIntro();
    }).catch(() => {});
  }

  // Never allow a loader failure to keep the page hidden.
  window.setTimeout(() => {
    if (!mounted && document.documentElement.classList.contains('cloudlab-intro-pending')) {
      released = true;
      document.documentElement.classList.remove('cloudlab-intro-pending', 'cloudlab-intro-active');
    }
  }, 3500);
})();
