(() => {
  if (!document.querySelector('link[data-arcade-polish]')) {
    const polishStyles = document.createElement('link');
    polishStyles.rel = 'stylesheet';
    polishStyles.href = 'games-polish.css?v=3';
    polishStyles.dataset.arcadePolish = 'true';
    document.head.append(polishStyles);
  }

  const search = document.getElementById('gameSearch');
  const filters = document.getElementById('gameFilters');
  const cards = [...document.querySelectorAll('.game-card[data-genre]')];
  const empty = document.getElementById('gameEmpty');
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
