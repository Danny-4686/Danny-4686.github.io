// Homepage portrait: switch between the profile artwork and Danny4686's live
// Roblox avatar render. api.danny4686.com looks up the current render (Roblox's
// API doesn't allow browser requests) and re-checks Roblox every few minutes,
// so avatar changes show up on their own.
(() => {
  const portrait = document.querySelector('.hero-portrait');
  const artwork = portrait?.querySelector('.hero-profile');
  if (!portrait || !artwork) return;

  const API = 'https://api.danny4686.com/v1/roblox-avatar';
  const STORAGE_KEY = 'cloudlab-portrait-view';
  const REFRESH_MS = 5 * 60 * 1000;

  const render = document.createElement('img');
  render.className = 'hero-profile hero-roblox-render';
  render.alt = 'Danny4686’s current Roblox avatar';
  render.width = 720;
  render.height = 720;
  render.decoding = 'async';
  render.hidden = true;

  const status = document.createElement('p');
  status.className = 'hero-avatar-status';
  status.setAttribute('role', 'status');
  status.hidden = true;

  const toggle = document.createElement('div');
  toggle.className = 'portrait-view-toggle';
  toggle.setAttribute('role', 'group');
  toggle.setAttribute('aria-label', 'Profile view');
  const buttons = {
    image: Object.assign(document.createElement('button'), { type: 'button', textContent: 'Image' }),
    roblox: Object.assign(document.createElement('button'), { type: 'button', textContent: 'Roblox' })
  };
  Object.entries(buttons).forEach(([view, button]) => { button.dataset.view = view; });
  toggle.append(buttons.image, buttons.roblox);
  artwork.after(render, status);
  portrait.append(toggle);

  let currentView = 'image';
  let renderUrl = '';
  let refreshTimer = 0;

  function readPreference() {
    try { return localStorage.getItem(STORAGE_KEY) === 'image' ? 'image' : 'roblox'; } catch { return 'roblox'; }
  }

  function savePreference(view) {
    try { localStorage.setItem(STORAGE_KEY, view); } catch {}
  }

  function showStatus(text) {
    status.textContent = text;
    status.hidden = !text;
  }

  function renderToggle() {
    Object.entries(buttons).forEach(([view, button]) => button.setAttribute('aria-pressed', String(view === currentView)));
    portrait.dataset.portraitView = currentView;
  }

  function showArtwork() {
    render.hidden = true;
    artwork.hidden = false;
  }

  async function latestRenderUrl() {
    const response = await fetch(API, { credentials: 'omit' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.available || !data.imageUrl) throw new Error(data.error || `Avatar ${data.state || 'unavailable'}`);
    return data.imageUrl;
  }

  // Swap only once the new image has loaded, so the portrait never flashes empty.
  function preload(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(url);
      image.onerror = () => reject(new Error('Avatar image failed to load'));
      image.src = url;
    });
  }

  async function refresh() {
    const url = await latestRenderUrl();
    if (url !== renderUrl) {
      await preload(url);
      renderUrl = url;
      render.src = url;
    }
  }

  async function showRoblox({ announce = false } = {}) {
    if (announce && !renderUrl) showStatus('Loading Roblox avatar…');
    try {
      await refresh();
      if (currentView !== 'roblox') return;
      showStatus('');
      artwork.hidden = true;
      render.hidden = false;
      window.clearInterval(refreshTimer);
      refreshTimer = window.setInterval(() => {
        if (!document.hidden && currentView === 'roblox') refresh().catch(() => {});
      }, REFRESH_MS);
    } catch (error) {
      console.warn('Roblox avatar unavailable; showing the profile image.', error);
      if (currentView !== 'roblox') return;
      currentView = 'image';
      buttons.roblox.disabled = true;
      buttons.roblox.title = 'The Roblox avatar is unavailable right now.';
      renderToggle();
      showArtwork();
      // Only explain the fallback to someone who just asked for the Roblox view.
      if (announce) {
        showStatus('Roblox avatar is unavailable right now.');
        window.setTimeout(() => showStatus(''), 4000);
      } else {
        showStatus('');
      }
    }
  }

  function setView(view, { remember = false } = {}) {
    currentView = view;
    if (remember) savePreference(view);
    renderToggle();
    if (view === 'roblox') {
      showRoblox({ announce: remember });
    } else {
      window.clearInterval(refreshTimer);
      showStatus('');
      showArtwork();
    }
  }

  toggle.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-view]');
    if (button && button.dataset.view !== currentView) setView(button.dataset.view, { remember: true });
  });

  setView(readPreference());
})();
