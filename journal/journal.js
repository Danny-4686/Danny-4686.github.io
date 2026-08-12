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
  let lastModalTrigger = null;
  let resizeTimer = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function postMode(post) {
    if (post.mode) return post.mode;
    if (post.comingSoon) return 'coming-soon';
    if (post.cardOnly) return 'card';
    return 'article';
  }

  function readerText(post) {
    if (postMode(post) === 'card') return String(post.body || post.description || '').trim();
    return String(post.description || '').trim();
  }

  function hasExpandedReaderText(post) {
    if (postMode(post) !== 'card') return false;
    return readerText(post) !== String(post.description || '').trim();
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

  function failMedia(media) {
    media.classList.remove('is-media-loading');
    media.classList.add('is-media-error');
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
      video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'metadata';
      video.setAttribute('data-autoplay', '');
      video.setAttribute('aria-label', `${post.title} preview`);
      if (post.poster) video.poster = post.poster;
      video.addEventListener('loadedmetadata', () => finishMedia(media, loader), { once: true });
      video.addEventListener('error', () => failMedia(media), { once: true });
      video.src = post.thumbnail;
      media.append(video);
    } else {
      const image = document.createElement('img');
      image.alt = `${post.title} thumbnail`; image.loading = 'lazy'; image.decoding = 'async';
      if (post.fit === 'contain') image.classList.add('contain-media');
      image.addEventListener('load', () => finishMedia(media, loader), { once: true });
      image.addEventListener('error', () => failMedia(media), { once: true });
      image.src = post.thumbnail;
      media.append(image);
      if (image.complete && image.naturalWidth > 0) queueMicrotask(() => finishMedia(media, loader));
    }
    return media;
  }

  function ensureReaderModal() {
    let modal = document.getElementById('journalReaderModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'journalReaderModal'; modal.className = 'journal-reader-modal'; modal.hidden = true;
    modal.innerHTML = '<div class="journal-reader-backdrop" data-close-reader></div><section class="journal-reader-dialog" role="dialog" aria-modal="true" aria-labelledby="journalReaderTitle"><button class="journal-reader-close" type="button" data-close-reader aria-label="Close expanded post">×</button><div id="journalReaderMedia" class="journal-reader-media"></div><div class="journal-reader-content"><div id="journalReaderMeta" class="journal-reader-meta"></div><h2 id="journalReaderTitle" class="journal-reader-title"></h2><p id="journalReaderText" class="journal-reader-text"></p><a id="journalReaderOpen" class="journal-reader-open" href="#">Open full post →</a></div></section>';
    document.body.append(modal);
    modal.querySelectorAll('[data-close-reader]').forEach((element) => element.addEventListener('click', closeReaderModal));
    return modal;
  }

  function openReaderModal(post, trigger) {
    const modal = ensureReaderModal();
    lastModalTrigger = trigger || document.activeElement;
    const mode = postMode(post);
    const meta = modal.querySelector('#journalReaderMeta');
    const media = modal.querySelector('#journalReaderMedia');
    const open = modal.querySelector('#journalReaderOpen');
    meta.replaceChildren();
    const badge = document.createElement('span');
    badge.textContent = mode === 'coming-soon' ? 'COMING SOON' : mode === 'card' ? 'POST' : (post.tags?.[0] || 'JOURNAL').toUpperCase();
    const date = document.createElement('time'); date.dateTime = post.date || ''; date.textContent = post.displayDate || '';
    meta.append(badge, date);
    modal.querySelector('#journalReaderTitle').textContent = post.title || 'Journal post';
    modal.querySelector('#journalReaderText').textContent = readerText(post);
    media.replaceChildren();
    if (post.mediaType !== 'video' && post.thumbnail) {
      const image = document.createElement('img'); image.src = post.thumbnail; image.alt = `${post.title} thumbnail`;
      if (post.fit === 'contain') image.style.objectFit = 'contain';
      media.append(image);
    }
    if (mode === 'article') { open.hidden = false; open.href = `/journal/posts/${encodeURIComponent(post.slug)}/`; }
    else { open.hidden = true; open.removeAttribute('href'); }
    modal.hidden = false; document.body.classList.add('journal-modal-open');
    requestAnimationFrame(() => modal.querySelector('.journal-reader-close')?.focus());
  }

  function closeReaderModal() {
    const modal = document.getElementById('journalReaderModal');
    if (!modal || modal.hidden) return;
    modal.hidden = true; document.body.classList.remove('journal-modal-open');
    if (lastModalTrigger && typeof lastModalTrigger.focus === 'function') lastModalTrigger.focus();
    lastModalTrigger = null;
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeReaderModal();
    const modal = document.getElementById('journalReaderModal');
    if (event.key !== 'Tab' || !modal || modal.hidden) return;
    const focusable = [...modal.querySelectorAll('button:not([disabled]),a[href]')].filter((item) => !item.hidden);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  function updateOverflowForCard(card) {
    const description = card.querySelector('.journal-description');
    const button = card.querySelector('.journal-read-more');
    if (!description || !button) return;
    const overflow = description.scrollHeight > description.clientHeight + 2;
    const expanded = card._journalPost ? hasExpandedReaderText(card._journalPost) : false;
    const showReadMore = overflow || expanded;
    card.classList.toggle('has-overflow', showReadMore); button.hidden = !showReadMore;
  }

  function updateVisibleOverflows() { grid.querySelectorAll('.journal-card').forEach(updateOverflowForCard); }

  function createPostCard(post, index) {
    const mode = postMode(post), isArticle = mode === 'article', isComingSoon = mode === 'coming-soon', isCardOnly = mode === 'card';
    const card = document.createElement('article');
    card.className = `journal-card reveal${isArticle ? ' is-article' : ''}${isComingSoon ? ' coming-soon is-static' : ''}${isCardOnly ? ' post-only is-static' : ''}`;
    card._journalPost = post;
    card.style.setProperty('--delay', `${Math.min(index, 3) * 55}ms`);
    card.append(createMedia(post));
    const body = document.createElement('div'); body.className = 'card-body';
    const meta = document.createElement('div'); meta.className = 'card-meta';
    const badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = isComingSoon ? 'COMING SOON' : isCardOnly ? 'POST' : (post.tags?.[0] || 'JOURNAL');
    const date = document.createElement('time'); date.dateTime = post.date; date.textContent = post.displayDate; meta.append(badge, date);
    const title = document.createElement('h3'); title.textContent = post.title;
    const description = document.createElement('p'); description.className = 'journal-description'; description.textContent = post.description;
    const actions = document.createElement('div'); actions.className = 'journal-card-actions';
    let linkText;
    if (isArticle) {
      linkText = document.createElement('a'); linkText.href = `/journal/posts/${encodeURIComponent(post.slug)}/`; linkText.className = 'card-link'; linkText.append('Read post ');
      const arrow = document.createElement('span'); arrow.textContent = '→'; linkText.append(arrow);
    } else {
      linkText = document.createElement('span'); linkText.className = 'card-link'; linkText.textContent = isComingSoon ? 'Coming Soon' : 'Post';
    }
    const readMore = document.createElement('button'); readMore.type = 'button'; readMore.className = 'journal-read-more'; readMore.textContent = 'Read More'; readMore.hidden = true;
    readMore.addEventListener('click', () => openReaderModal(post, readMore));
    actions.append(linkText, readMore); body.append(meta, title, description, actions); card.append(body);
    if (!reducedMotion) {
      card.addEventListener('pointermove', (event) => { const rect = card.getBoundingClientRect(); card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`); card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`); });
      card.addEventListener('pointerleave', () => { card.style.removeProperty('--spot-x'); card.style.removeProperty('--spot-y'); });
    }
    return card;
  }

  function observeVideos() {
    videoObserver?.disconnect();
    const videos = [...grid.querySelectorAll('video[data-autoplay]')];
    if (!videos.length || reducedMotion || !('IntersectionObserver' in window)) return;
    videoObserver = new IntersectionObserver((entries) => entries.forEach((entry) => { const video = entry.target; if (entry.isIntersecting && entry.intersectionRatio >= 0.55) video.play().catch(() => {}); else video.pause(); }), { threshold: [0, .55, 1] });
    videos.forEach((video) => videoObserver.observe(video));
  }

  function removeBatchSentinel() { batchObserver?.disconnect(); batchObserver = null; grid.querySelector('.journal-load-sentinel')?.remove(); }
  function addBatchSentinel() {
    removeBatchSentinel(); if (renderedCount >= filteredPosts.length) return;
    const sentinel = document.createElement('div'); sentinel.className = 'journal-load-sentinel'; sentinel.setAttribute('aria-label', 'Loading more journal posts'); sentinel.append(createEarthLoader('Loading more posts')); grid.append(sentinel);
    if ('IntersectionObserver' in window) {
      batchObserver = new IntersectionObserver((entries) => { if (!entries.some((entry) => entry.isIntersecting)) return; removeBatchSentinel(); renderNextBatch(); }, { rootMargin: '650px 0px', threshold: .01 });
      batchObserver.observe(sentinel);
    } else {
      sentinel.replaceChildren(); const button = document.createElement('button'); button.className = 'journal-load-fallback'; button.type = 'button'; button.textContent = 'Load more posts'; button.addEventListener('click', () => { removeBatchSentinel(); renderNextBatch(); }); sentinel.append(button);
    }
  }

  function revealCards(cards) { requestAnimationFrame(() => cards.forEach((card) => { card.classList.add('visible'); updateOverflowForCard(card); })); }
  function renderNextBatch() {
    removeBatchSentinel(); const batch = filteredPosts.slice(renderedCount, renderedCount + BATCH_SIZE); if (!batch.length) return;
    const cards = batch.map((post, index) => createPostCard(post, index)); cards.forEach((card) => grid.append(card)); renderedCount += batch.length; revealCards(cards); observeVideos(); addBatchSentinel();
  }

  function renderPosts() {
    const query = search.value.trim().toLowerCase();
    filteredPosts = posts.filter((post) => { const matchesTag = activeTag === 'all' || post.tags?.includes(activeTag); const searchable = `${post.title} ${post.description} ${post.body || ''} ${(post.tags || []).join(' ')}`.toLowerCase(); return matchesTag && searchable.includes(query); });
    closeReaderModal(); videoObserver?.disconnect(); removeBatchSentinel(); renderedCount = 0; grid.replaceChildren();
    if (!filteredPosts.length) { const empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = 'No journal posts match that search.'; grid.append(empty); return; }
    renderNextBatch();
  }

  function buildFilters() {
    [...new Set(posts.flatMap((post) => post.tags || []))].sort().forEach((tag) => { const button = document.createElement('button'); button.className = 'filter-button'; button.type = 'button'; button.dataset.tag = tag; button.textContent = tag; button.setAttribute('aria-pressed', 'false'); filters.append(button); });
    filters.addEventListener('click', (event) => { const button = event.target.closest('[data-tag]'); if (!button) return; activeTag = button.dataset.tag; filters.querySelectorAll('[data-tag]').forEach((item) => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); }); renderPosts(); });
  }

  search.addEventListener('input', renderPosts);
  window.addEventListener('resize', () => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(updateVisibleOverflows, 120); }, { passive: true });

  fetch('posts.json', { cache: 'no-cache' }).then((response) => { if (!response.ok) throw new Error(`Journal data returned ${response.status}`); return response.json(); }).then((data) => { posts = [...data].sort((a, b) => new Date(b.date) - new Date(a.date)); buildFilters(); renderPosts(); }).catch((error) => { console.error(error); removeBatchSentinel(); grid.replaceChildren(); const empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = 'The journal could not be loaded right now.'; grid.append(empty); });
})();
