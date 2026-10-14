// Homepage portrait: shows either the profile artwork or Danny4686's live Roblox
// avatar render, whichever is chosen in the admin panel (site-settings.json
// "profileView"). api.danny4686.com looks up the current render (Roblox's API
// doesn't allow browser requests) and re-checks Roblox every few minutes, so
// avatar changes show up on their own.
(() => {
  const portrait = document.querySelector('.hero-portrait');
  const artwork = portrait?.querySelector('.hero-profile');
  if (!portrait || !artwork) return;

  const API = 'https://api.danny4686.com/v1/roblox-avatar';
  const REFRESH_MS = 5 * 60 * 1000;

  const render = document.createElement('img');
  render.className = 'hero-profile hero-roblox-render';
  render.alt = 'Danny4686’s current Roblox avatar';
  render.width = 720;
  render.height = 720;
  render.decoding = 'async';
  render.hidden = true;
  artwork.after(render);

  let renderUrl = '';

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

  async function showRoblox() {
    try {
      await refresh();
      artwork.hidden = true;
      render.hidden = false;
      portrait.dataset.portraitView = 'roblox';
      window.setInterval(() => {
        if (!document.hidden) refresh().catch(() => {});
      }, REFRESH_MS);
    } catch (error) {
      // The artwork is already showing, so visitors never see a gap.
      console.warn('Roblox avatar unavailable; showing the profile image.', error);
    }
  }

  fetch('/site-settings.json', { cache: 'no-store' })
    .then((response) => (response.ok ? response.json() : {}))
    .then((settings) => {
      if (settings?.profileView === 'roblox') showRoblox();
    })
    .catch(() => {});
})();
