(() => {
  const grid = document.getElementById('journalGrid');
  const search = document.getElementById('journalSearch');
  const filters = document.getElementById('journalFilters');
  if (!grid || !search || !filters) return;

  const BATCH_SIZE = 9;
  const EARTH_LOGO = '/assets/images/optimized/cloudlab-logo-256.webp';
  let posts = [];
  let filteredPosts = [];
  let renderedCount = 0;
  let activeTag = 'all';
  let videoObserver = null;
  let batchObserver = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function postMode(post) {
    if (post.mode) return post.mode;
    if (post.comingSoon) return 'coming-soon';
    if (post.cardOnly) return 'card';
    return 'article';
  }

  function createEarthLoader(label = '', compact = false) {
    const loader = document.createElement('div');
    loader.className = `journal-earth-loader${compact ? ' compact' : ''}`;
    const image = document.createElement('img');
    image.src = EARTH_LOGO;
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    loader.append(image);
    if (label) {
      const text = document.createElement('span');
      text.textContent = label;
      loader.append(text);
    }
    return loader;
  }

  function finishMedia(media, loader) {
    if (media.classList.contains('is-media-ready')) return;
    media.classList.remove('is-media-loading', 'is-media-error');
    media.classList.add('is-media-ready');
    window.setTimeout(() => loader.remove(), 480);
  }

  function failMedia(media, loader) {
    media.classList.remove('is-media-loading');
    media.classList.add('is-media-error');
    const text = loader.querySelector('span') || document.createElement('span');
    text.textContent = 'Media unavailable';
    if (!text.parentNode) loader.querySelector('.journal-earth-loader')?.append(text);
  }

  function createMedia(post) {
    const media = document.createElement('div');
    media.className = 'card-media is-media-loading';

    const loader = document.createElement('div');
    loader.className = 'journal-media-loader';
    loader.append(createEarthLoader('', true));
    media.append(loader);

    if (post.mediaType === 'video') {
      const video = document.createElement('video');
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.setAttribute('data-autoplay', '');
      video.setAttribute('aria-label', `${post.title} preview`);
      if (post.poster) video.poster = post.poster;
      video.addEventListener('loadedmetadata', () => finishMedia(media, loader), { once: true });
      video.addEventListener('error', () => failMedia(media, loader), { once: true });
      video.src = post.thumbnail;
      media.append(video);
    } else {
      const image = document.createElement('img');
      image.alt = `${post.title} thumbnail`;
      image.loading = 'lazy';
      image.decoding = 'async';
      if (post.fit === 'contain') image.classList.add('contain-media');
      image.addEventListener('load', () => finishMedia(media, loader), { once: true });
      image.addEventListener('error', () => failMedia(media, loader), { once: true });
      image.src = post.thumbnail;
      media.append(image);
      if (image.complete && image.naturalWidth > 0) queueMicrotask(() => finishMedia(media, loader));
    }

    return media;
  }

  function createPostCard(post, index) {
    const mode = postMode(post);
    const isArticle = mode === 'article';
    const isComingSoon = mode === 'coming-soon';
    const isCardOnly = mode === 'card';
    const card = document.createElement(isArticle ? 'a' : 'article');
    card.className = `journal-card reveal${isComingSoon ? ' coming-soon is-static' : ''}${isCardOnly ? ' post-only is-static' : ''}`;
    card.style.setProperty('--delay', `${Math.min(index, 3) * 55}ms`);

    if (isArticle) {
      card.href = `/journal/posts/${encodeURIComponent(post.slug)}/`;
    } else {
      card.setAttribute('aria-label', `${post.title}, ${isComingSoon ? 'coming soon' : 'journal post'}`);
    }

    card.append(createMedia(post));

    const body = document.createElement('div');
    body.className = 'card-body';

    const meta = document.createElement('div');
    meta.className = 'card-meta';

    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = isComingSoon ? 'COMING SOON' : isCardOnly ? 'POST' : (post.tags?.[0] || 'JOURNAL');

    const date = document.createElement('time');
    date.dateTime = post.date;
    date.textContent = post.displayDate;
    meta.append(badge, date);

    const title = document.createElement('h3');
    title.textContent = post.title;

    const description = document.createElement('p');
    description.textContent = post.description;

    const linkText = document.createElement('span');
    linkText.className = 'card-link';
    if (isComingSoon) linkText.textContent = 'Coming Soon';
    else if (isCardOnly) linkText.textContent = 'Post';
    else {
      linkText.append('Read post ');
      const arrow = document.createElement('span');
      arrow.textContent = '→';
      linkText.append(arrow);
    }

    body.append(meta, title, description, linkText);
    card.append(body);

    if (isArticle) {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.removeProperty('--spot-x');
        card.style.removeProperty('--spot-y');
      });
    }

    return card;
  }

  function observeVideos() {
    videoObserver?.disconnect();
    const videos = [...grid.querySelectorAll('video[data-autoplay]')];
    if (!videos.length || reducedMotion || !('IntersectionObserver' in window)) return;

    videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: [0, 0.55, 1] });

    videos.forEach((video) => videoObserver.observe(video));
  }

  function removeBatchSentinel() {
    batchObserver?.disconnect();
    batchObserver = null;
    grid.querySelector('.journal-load-sentinel')?.remove();
  }

  function addBatchSentinel() {
    removeBatchSentinel();
    if (renderedCount >= filteredPosts.length) return;

    const sentinel = document.createElement('div');
    sentinel.className = 'journal-load-sentinel';
    sentinel.setAttribute('aria-label', 'Loading more journal posts');
    sentinel.append(createEarthLoader('Loading more posts'));
    grid.append(sentinel);

    if ('IntersectionObserver' in window) {
      batchObserver = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        removeBatchSentinel();
        renderNextBatch();
      }, { rootMargin: '650px 0px', threshold: 0.01 });
      batchObserver.observe(sentinel);
    } else {
      sentinel.replaceChildren();
      const button = document.createElement('button');
      button.className = 'journal-load-fallback';
      button.type = 'button';
      button.textContent = 'Load more posts';
      button.addEventListener('click', () => {
        removeBatchSentinel();
        renderNextBatch();
      });
      sentinel.append(button);
    }
  }

  function revealCards(cards) {
    requestAnimationFrame(() => cards.forEach((card) => card.classList.add('visible')));
  }

  function renderNextBatch() {
    removeBatchSentinel();
    const batch = filteredPosts.slice(renderedCount, renderedCount + BATCH_SIZE);
    if (!batch.length) return;

    const cards = batch.map((post, index) => createPostCard(post, index));
    cards.forEach((card) => grid.append(card));
    renderedCount += batch.length;
    revealCards(cards);
    observeVideos();
    addBatchSentinel();
  }

  function renderPosts() {
    const query = search.value.trim().toLowerCase();
    filteredPosts = posts.filter((post) => {
      const matchesTag = activeTag === 'all' || post.tags?.includes(activeTag);
      const searchable = `${post.title} ${post.description} ${(post.tags || []).join(' ')}`.toLowerCase();
      return matchesTag && searchable.includes(query);
    });

    videoObserver?.disconnect();
    removeBatchSentinel();
    renderedCount = 0;
    grid.replaceChildren();

    if (!filteredPosts.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No journal posts match that search.';
      grid.append(empty);
      return;
    }

    renderNextBatch();
  }

  function buildFilters() {
    const uniqueTags = [...new Set(posts.flatMap((post) => post.tags || []))].sort();
    uniqueTags.forEach((tag) => {
      const button = document.createElement('button');
      button.className = 'filter-button';
      button.type = 'button';
      button.dataset.tag = tag;
      button.textContent = tag;
      button.setAttribute('aria-pressed', 'false');
      filters.append(button);
    });

    filters.addEventListener('click', (event) => {
      const button = event.target.closest('[data-tag]');
      if (!button) return;
      activeTag = button.dataset.tag;
      filters.querySelectorAll('[data-tag]').forEach((item) => {
        item.classList.toggle('active', item === button);
        item.setAttribute('aria-pressed', String(item === button));
      });
      renderPosts();
    });
  }

  search.addEventListener('input', renderPosts);

  fetch('posts.json', { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) throw new Error(`Journal data returned ${response.status}`);
      return response.json();
    })
    .then((data) => {
      posts = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
      buildFilters();
      renderPosts();
    })
    .catch((error) => {
      console.error(error);
      removeBatchSentinel();
      grid.replaceChildren();
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'The journal could not be loaded right now.';
      grid.append(empty);
    });
})();
