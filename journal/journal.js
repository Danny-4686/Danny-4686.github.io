(() => {
  const grid = document.getElementById('journalGrid');
  const search = document.getElementById('journalSearch');
  const filters = document.getElementById('journalFilters');
  if (!grid || !search || !filters) return;

  let posts = [];
  let activeTag = 'all';
  let videoObserver = null;

  function postMode(post) {
    if (post.mode) return post.mode;
    if (post.comingSoon) return 'coming-soon';
    if (post.cardOnly) return 'card';
    return 'article';
  }

  function createMedia(post) {
    const media = document.createElement('div');
    media.className = 'card-media';

    if (post.mediaType === 'video') {
      const video = document.createElement('video');
      video.src = post.thumbnail;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.setAttribute('data-autoplay', '');
      video.setAttribute('aria-label', `${post.title} preview`);
      if (post.poster) video.poster = post.poster;
      media.append(video);
    } else {
      const image = document.createElement('img');
      image.src = post.thumbnail;
      image.alt = `${post.title} thumbnail`;
      image.loading = 'lazy';
      if (post.fit === 'contain') image.classList.add('contain-media');
      media.append(image);
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
      card.setAttribute('aria-disabled', 'true');
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
    if (!videos.length || !('IntersectionObserver' in window)) return;

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

  function renderPosts() {
    const query = search.value.trim().toLowerCase();
    const filtered = posts.filter((post) => {
      const matchesTag = activeTag === 'all' || post.tags?.includes(activeTag);
      const searchable = `${post.title} ${post.description} ${(post.tags || []).join(' ')}`.toLowerCase();
      return matchesTag && searchable.includes(query);
    });

    grid.replaceChildren();

    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No journal posts match that search.';
      grid.append(empty);
      return;
    }

    filtered.forEach((post, index) => grid.append(createPostCard(post, index)));
    requestAnimationFrame(() => {
      grid.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
    });
    observeVideos();
  }

  function buildFilters() {
    const uniqueTags = [...new Set(posts.flatMap((post) => post.tags || []))].sort();
    uniqueTags.forEach((tag) => {
      const button = document.createElement('button');
      button.className = 'filter-button';
      button.type = 'button';
      button.dataset.tag = tag;
      button.textContent = tag;
      filters.append(button);
    });

    filters.addEventListener('click', (event) => {
      const button = event.target.closest('[data-tag]');
      if (!button) return;
      activeTag = button.dataset.tag;
      filters.querySelectorAll('[data-tag]').forEach((item) => {
        item.classList.toggle('active', item === button);
      });
      renderPosts();
    });
  }

  search.addEventListener('input', renderPosts);

  fetch('posts.json', { cache: 'no-store' })
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
      grid.replaceChildren();
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'The journal could not be loaded right now.';
      grid.append(empty);
    });
})();
