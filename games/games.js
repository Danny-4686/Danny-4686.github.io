(() => {
  if (!document.querySelector('link[data-global-header]')) {
    const headerStyles = document.createElement('link');
    headerStyles.rel = 'stylesheet';
    headerStyles.href = '/assets/css/global-header.css?v=20260808';
    headerStyles.dataset.globalHeader = 'true';
    document.head.append(headerStyles);
  }

  if (!document.querySelector('link[data-arcade-polish]')) {
    const polishStyles = document.createElement('link');
    polishStyles.rel = 'stylesheet';
    polishStyles.href = 'games-polish.css?v=3';
    polishStyles.dataset.arcadePolish = 'true';
    document.head.append(polishStyles);
  }

  if (!document.querySelector('link[data-arcade-scale]')) {
    const scaleStyles = document.createElement('link');
    scaleStyles.rel = 'stylesheet';
    scaleStyles.href = 'games-banner-scale.css?v=2';
    scaleStyles.dataset.arcadeScale = 'true';
    document.head.append(scaleStyles);
  }

  if (!document.querySelector('link[data-classic-banner-polish]')) {
    const classicStyles = document.createElement('link');
    classicStyles.rel = 'stylesheet';
    classicStyles.href = 'classic-banner-polish.css?v=1';
    classicStyles.dataset.classicBannerPolish = 'true';
    document.head.append(classicStyles);
  }

  const grid = document.getElementById('gameGrid');
  const featuredGrid = document.getElementById('featuredGameGrid');
  const featuredStatus = document.getElementById('featuredGameStatus');
  const search = document.getElementById('gameSearch');
  const filters = document.getElementById('gameFilters');
  const cards = grid ? [...grid.querySelectorAll('.game-card[data-genre][data-game-id]')] : [];
  const empty = document.getElementById('gameEmpty');
  const defaultFeatured = ['cloud-hopper', 'cloudlab-clicker', 'launcher'];
  const sourceCards = new Map(cards.map((card) => [card.dataset.gameId, card]));

  function normalizedFeatured(value) {
    if (!Array.isArray(value)) return [...defaultFeatured];
    const seen = new Set();
    const valid = value.filter((id) => {
      if (typeof id !== 'string' || seen.has(id) || !sourceCards.has(id)) return false;
      seen.add(id);
      return true;
    }).slice(0, 6);
    return valid.length ? valid : [...defaultFeatured];
  }

  function renderFeatured(value, isLive = false) {
    if (!featuredGrid) return;
    const featured = normalizedFeatured(value);
    const fragment = document.createDocumentFragment();
    featured.forEach((id, index) => {
      const clone = sourceCards.get(id)?.cloneNode(true);
      if (!clone) return;
      clone.hidden = false;
      clone.removeAttribute('style');
      clone.classList.remove('reveal', 'visible', 'is-reveal-pending');
      clone.classList.add('featured-game-card');
      clone.dataset.featureOrder = String(index + 1);
      fragment.appendChild(clone);
    });
    featuredGrid.replaceChildren(fragment);
    if (featuredStatus) {
      featuredStatus.textContent = isLive
        ? `${featured.length} ADMIN PICKS`
        : `${featured.length} CLOUDLAB PICKS`;
    }
  }

  async function loadFeatured() {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 1800);
    try {
      const response = await fetch('https://api.danny4686.com/v1/site-settings', {
        cache: 'no-store',
        credentials: 'omit',
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Settings request failed');
      const data = await response.json();
      if (!data?.ok) throw new Error('Settings unavailable');
      renderFeatured(data.featuredGames, true);
    } catch (_) {
      renderFeatured(defaultFeatured, false);
    } finally {
      window.clearTimeout(timer);
    }
  }

  renderFeatured(defaultFeatured, false);
  loadFeatured();

  if (!search || !filters || !cards.length || !empty) return;

  let activeGenre = 'all';

  function render() {
    const query = search.value.trim().toLowerCase();
    let visible = 0;

    cards.forEach((card) => {
      const genreMatch = activeGenre === 'all' || card.dataset.genre === activeGenre;
      const text = `${card.dataset.title} ${card.dataset.genre} ${card.dataset.keywords || ''}`.toLowerCase();
      const searchMatch = text.includes(query);
      const show = genreMatch && searchMatch;
      card.hidden = !show;
      if (show) visible += 1;
    });

    empty.hidden = visible !== 0;
  }

  filters.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    activeGenre = button.dataset.filter;
    filters.querySelectorAll('[data-filter]').forEach((item) => {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    render();
  });

  search.addEventListener('input', render);
  render();
})();
