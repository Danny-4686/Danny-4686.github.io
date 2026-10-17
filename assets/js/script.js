const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = [...document.querySelectorAll('.reveal')];

revealItems.forEach((element, index) => {
  element.style.setProperty('--delay', `${Math.min(index % 4, 3) * 55}ms`);
});

let revealObserver = null;
if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((element) => element.classList.add('visible'));
} else {
  revealItems.forEach((element) => element.classList.add('is-reveal-pending'));
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });

  revealItems.forEach((element) => revealObserver.observe(element));
}

function revealManaged(element, index = 0) {
  if (!element) return;
  element.classList.add('reveal');
  element.style.setProperty('--delay', `${Math.min(index % 4, 3) * 55}ms`);
  if (reducedMotion || !revealObserver) {
    element.classList.add('visible');
    return;
  }
  element.classList.add('is-reveal-pending');
  revealObserver.observe(element);
}

const header = document.querySelector('.site-header');
const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 18);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const sectionLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const sections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

let lockedSectionId = null;
let unlockTimer = null;
let navFrameRequested = false;

function setActiveSection(sectionId) {
  sectionLinks.forEach((link) => {
    const active = sectionId && link.getAttribute('href') === `#${sectionId}`;
    link.classList.toggle('is-active', Boolean(active));

    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function getCurrentSectionId() {
  if (!sections.length) return null;

  const headerHeight = header?.offsetHeight || 0;
  const readingLine = window.scrollY + headerHeight + 150;
  let currentSection = null;

  sections.forEach((section) => {
    if (section.offsetTop <= readingLine) currentSection = section;
  });

  const nearPageBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
  if (nearPageBottom) currentSection = sections[sections.length - 1];

  return currentSection?.id || null;
}

function updateActiveNavigation() {
  navFrameRequested = false;

  if (lockedSectionId) {
    setActiveSection(lockedSectionId);
    return;
  }

  setActiveSection(getCurrentSectionId());
}

function requestNavigationUpdate() {
  if (navFrameRequested) return;
  navFrameRequested = true;
  window.requestAnimationFrame(updateActiveNavigation);
}

sectionLinks.forEach((link) => {
  link.addEventListener('click', () => {
    lockedSectionId = link.getAttribute('href').slice(1);
    setActiveSection(lockedSectionId);

    window.clearTimeout(unlockTimer);
    unlockTimer = window.setTimeout(() => {
      lockedSectionId = null;
      updateActiveNavigation();
    }, 1800);
  });
});

const brandLink = document.querySelector('.brand');
brandLink?.addEventListener('click', (event) => {
  event.preventDefault();
  lockedSectionId = null;
  window.clearTimeout(unlockTimer);
  setActiveSection(null);

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: reducedMotion ? 'auto' : 'smooth'
  });

  if (window.location.hash) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }
});

window.addEventListener('scroll', requestNavigationUpdate, { passive: true });
window.addEventListener('resize', requestNavigationUpdate, { passive: true });
window.addEventListener('scrollend', () => {
  lockedSectionId = null;
  window.clearTimeout(unlockTimer);
  updateActiveNavigation();
});

requestNavigationUpdate();

function attachSpotlight(element) {
  if (!element || reducedMotion || element.dataset.spotlightBound === 'true') return;
  element.dataset.spotlightBound = 'true';
  element.addEventListener('pointermove', (event) => {
    const rect = element.getBoundingClientRect();
    element.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    element.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  });
  element.addEventListener('pointerleave', () => {
    element.style.removeProperty('--spot-x');
    element.style.removeProperty('--spot-y');
  });
}

if (!reducedMotion) {
  document.querySelectorAll(
    '.hero-portrait, .studio-strip-inner, .gloss-card, .project-card, .connect-card, .destination-card'
  ).forEach(attachSpotlight);

  const portrait = document.querySelector('.hero-portrait');
  if (portrait && window.matchMedia('(min-width: 981px)').matches) {
    portrait.addEventListener('pointermove', (event) => {
      const rect = portrait.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      portrait.style.setProperty('--tilt-x', `${(-y * 2.3).toFixed(2)}deg`);
      portrait.style.setProperty('--tilt-y', `${(x * 2.3).toFixed(2)}deg`);
    });

    portrait.addEventListener('pointerleave', () => {
      portrait.style.setProperty('--tilt-x', '0deg');
      portrait.style.setProperty('--tilt-y', '0deg');
    });
  }
}

function ensureManagedProjectStyles() {
  if (document.querySelector('link[data-managed-projects]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/assets/css/project-managed.css?v=20261017.1';
  link.dataset.managedProjects = 'true';
  document.head.append(link);
}

function safeProjectUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (/^\/(?!\/)/.test(url)) return url;
  return '';
}

function safeImagePath(value) {
  const path = String(value || '').trim();
  if (!path) return '';
  if (/^\/assets\/[A-Za-z0-9_./-]+$/.test(path) && !path.includes('..')) return path;
  return '';
}

function applyManagedProfileImage(settings) {
  const path = safeImagePath(settings?.profileImage);
  if (!path) return;
  const stamp = typeof settings?.updatedAt === 'string' && settings.updatedAt ? `?v=${encodeURIComponent(settings.updatedAt)}` : '';
  document.querySelectorAll('.hero-profile:not(.hero-roblox-render), .connect-identity img').forEach((image) => {
    // Uploaded artwork always gets a new file name, so an image already showing this
    // file is current. Re-pointing it would download the hero (LCP) image twice.
    if (new URL(image.getAttribute('src'), document.baseURI).pathname === path) return;
    image.src = `${path}${stamp}`;
  });
}

function createProjectMedia(project) {
  const media = document.createElement('div');
  media.className = 'managed-project-media';
  media.dataset.fit = project.fit === 'contain' ? 'contain' : 'cover';
  const imagePath = safeImagePath(project.image);
  if (imagePath) {
    const image = document.createElement('img');
    image.src = imagePath;
    image.alt = project.imageAlt || `${project.title} project artwork`;
    // The Projects section sits well below the fold, so artwork waits until it is
    // near the viewport (setupProjectSlider then loads the first slides together).
    image.loading = 'lazy';
    image.decoding = 'async';
    image.className = project.fit === 'contain' ? 'is-contain' : '';
    media.append(image);
  } else {
    const monogram = document.createElement('span');
    monogram.className = 'managed-project-media-placeholder';
    monogram.textContent = String(project.title || 'P').trim().charAt(0).toUpperCase() || 'P';
    media.append(monogram);
  }
  return media;
}

function makeProjectCard(project, index) {
  const card = document.createElement('article');
  const accent = ['cyan', 'gold', 'mint', 'orange'].includes(project.accent) ? project.accent : 'cyan';
  const layout = ['media-left', 'media-top', 'compact'].includes(project.layout) ? project.layout : 'media-left';
  card.className = 'project-card managed-project';
  card.dataset.projectId = project.id || '';
  card.dataset.accent = accent;
  card.dataset.layout = layout;

  const url = safeProjectUrl(project.url);
  const clickable = Boolean(project.clickable && url);
  const newTab = Boolean(project.newTab && /^https?:\/\//i.test(url));
  if (clickable) {
    card.classList.add('is-clickable');
    card.addEventListener('click', (event) => {
      if (event.target.closest('a,button,input,select,textarea')) return;
      if (newTab) window.open(url, '_blank', 'noopener,noreferrer');
      else window.location.href = url;
    });
  }

  card.append(createProjectMedia(project));

  const content = document.createElement('div');
  content.className = 'project-content managed-project-content';
  const meta = document.createElement('div');
  meta.className = 'managed-project-meta';

  const kicker = document.createElement('p');
  kicker.className = 'project-kicker managed-project-kicker';
  kicker.textContent = project.kicker || 'PROJECT';
  meta.append(kicker);
  if (project.badge) {
    const badge = document.createElement('span');
    badge.className = 'managed-project-badge';
    badge.textContent = project.badge;
    meta.append(badge);
  }

  const title = document.createElement('h3');
  if (clickable) {
    const titleLink = document.createElement('a');
    titleLink.className = 'managed-project-title-link';
    titleLink.href = url;
    titleLink.textContent = project.title;
    if (newTab) {
      titleLink.target = '_blank';
      titleLink.rel = 'noopener noreferrer';
    }
    title.append(titleLink);
  } else {
    title.textContent = project.title;
  }
  const description = document.createElement('p');
  description.className = 'managed-project-description';
  description.textContent = project.description;
  content.append(meta, title, description);

  if (url && project.showButton !== false) {
    const actions = document.createElement('div');
    actions.className = 'managed-project-actions';
    const button = document.createElement('a');
    button.className = 'project-button managed-project-button';
    button.href = url;
    button.textContent = project.buttonLabel || 'Open project';
    if (newTab) {
      button.target = '_blank';
      button.rel = 'noopener noreferrer';
    }
    actions.append(button);
    content.append(actions);
  }
  card.append(content);
  revealManaged(card, index);
  attachSpotlight(card);
  return card;
}

// Projects scroll left to right. Native scrolling handles touch and trackpads;
// the arrows, dots, arrow keys, and mouse dragging are layered on top.
function setupProjectSlider(track) {
  // Cards scrolled out of view sideways would never trigger their own reveal,
  // so the whole row fades in together once the slider is on screen.
  if (revealObserver) {
    const items = [...track.children];
    items.forEach((card) => revealObserver.unobserve(card));
    const rowObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      items.forEach((card) => card.classList.add('visible'));
      rowObserver.disconnect();
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    rowObserver.observe(track);
  }
  // Native lazy loading only sees slides inside the row's visible width, so once the
  // row nears the screen the first slides (visible or peeking) all load together.
  if ('IntersectionObserver' in window) {
    const nearObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      nearObserver.disconnect();
      track.querySelectorAll('.managed-project-media img').forEach((image, index) => {
        if (index < 3) image.loading = 'eager';
      });
    }, { rootMargin: '600px 0px' });
    nearObserver.observe(track);
  }
  if (track.dataset.slider === 'true') {
    track.dispatchEvent(new Event('scroll'));
    return;
  }
  track.dataset.slider = 'true';
  track.classList.add('project-track');
  track.tabIndex = 0;
  track.setAttribute('role', 'region');
  track.setAttribute('aria-roledescription', 'carousel');
  track.setAttribute('aria-label', 'Projects');

  const controls = document.createElement('div');
  controls.className = 'project-slider-controls';
  const makeArrow = (direction, label, path) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `project-slider-arrow is-${direction}`;
    button.setAttribute('aria-label', label);
    button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
    return button;
  };
  const prev = makeArrow('prev', 'Previous project', 'M15 5l-7 7 7 7');
  const next = makeArrow('next', 'Next project', 'M9 5l7 7-7 7');
  const dots = document.createElement('div');
  dots.className = 'project-slider-dots';
  controls.append(prev, dots, next);
  track.after(controls);

  const cards = () => [...track.children];
  const behavior = () => (reducedMotion ? 'auto' : 'smooth');
  const cardOffset = (card) => card.offsetLeft - track.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft || 0);
  const currentIndex = () => {
    const items = cards();
    let best = 0;
    items.forEach((card, index) => {
      if (Math.abs(cardOffset(card) - track.scrollLeft) < Math.abs(cardOffset(items[best]) - track.scrollLeft)) best = index;
    });
    return best;
  };
  const goTo = (index) => {
    const items = cards();
    const target = items[Math.max(0, Math.min(items.length - 1, index))];
    if (target) track.scrollTo({ left: cardOffset(target), behavior: behavior() });
  };

  function update() {
    const items = cards();
    const maxScroll = track.scrollWidth - track.clientWidth;
    const scrollable = maxScroll > 2;
    controls.hidden = !scrollable;
    track.classList.toggle('is-scrollable', scrollable);
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= maxScroll - 2;
    if (dots.childElementCount !== items.length) {
      dots.replaceChildren(...items.map((card, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'project-slider-dot';
        const title = card.querySelector('h3')?.textContent?.trim();
        dot.setAttribute('aria-label', title ? `Show ${title}` : `Show project ${index + 1}`);
        dot.addEventListener('click', () => goTo(index));
        return dot;
      }));
    }
    // At the far right the last card can't snap to the start, so treat "at the end" as the last card.
    const active = next.disabled && scrollable ? items.length - 1 : currentIndex();
    [...dots.children].forEach((dot, index) => dot.setAttribute('aria-current', String(index === active)));
  }

  let frame = 0;
  const requestUpdate = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; update(); });
  };
  track.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  prev.addEventListener('click', () => goTo(currentIndex() - 1));
  next.addEventListener('click', () => goTo(currentIndex() + 1));
  track.addEventListener('keydown', (event) => {
    if (event.target !== track) return;
    const moves = { ArrowLeft: -1, ArrowRight: 1 };
    if (event.key in moves) {
      event.preventDefault();
      goTo(currentIndex() + moves[event.key]);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      goTo(event.key === 'Home' ? 0 : cards().length - 1);
    }
  });

  // Mouse drag to slide. A drag must not also count as a click on the card.
  let drag = null;
  let suppressClick = false;
  track.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !track.classList.contains('is-scrollable')) return;
    drag = { x: event.clientX, left: track.scrollLeft, moved: false, id: event.pointerId };
  });
  track.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    if (!(event.buttons & 1)) {
      drag = null;
      track.classList.remove('is-dragging');
      return;
    }
    const dx = event.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      track.setPointerCapture(event.pointerId);
      track.classList.add('is-dragging');
    }
    track.scrollLeft = drag.left - dx;
  });
  const endDrag = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const moved = drag.moved;
    drag = null;
    if (!moved) return;
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    track.classList.remove('is-dragging');
    goTo(currentIndex());
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  track.addEventListener('click', (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
  track.addEventListener('dragstart', (event) => event.preventDefault());

  update();
  window.addEventListener('load', requestUpdate, { once: true });
}

function isPublishedProject(project) {
  return Boolean(
    project &&
    project.draft === false &&
    typeof project.title === 'string' && project.title.trim() &&
    typeof project.description === 'string' && project.description.trim()
  );
}

async function loadManagedProjects() {
  const section = document.getElementById('projects');
  const grid = document.getElementById('managedProjectGrid') || section?.querySelector('.project-grid');
  if (!section || !grid) return;

  ensureManagedProjectStyles();
  section.dataset.projectsState = 'loading';
  section.setAttribute('aria-busy', 'true');
  grid.hidden = true;
  grid.replaceChildren();

  try {
    const response = await fetch('/projects/projects.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Projects returned ${response.status}`);
    const data = await response.json();
    const published = (Array.isArray(data) ? data : [])
      .filter(isPublishedProject)
      .slice(0, 50);

    const fragment = document.createDocumentFragment();
    published.forEach((project, index) => fragment.append(makeProjectCard(project, index)));
    grid.replaceChildren(fragment);
    grid.classList.add('is-managed');
    grid.hidden = published.length === 0;
    section.dataset.projectsState = published.length ? 'ready' : 'empty';
    if (published.length) setupProjectSlider(grid);
  } catch (error) {
    grid.replaceChildren();
    grid.hidden = true;
    section.dataset.projectsState = 'unavailable';
    console.warn('Managed projects unavailable; project cards remain hidden.', error);
  } finally {
    section.removeAttribute('aria-busy');
    requestNavigationUpdate();
    // Cards render after the initial #hash scroll, so let it re-align to its target.
    document.dispatchEvent(new Event('cloudlab:layoutchange'));
  }
}

// One request serves both the managed profile image and the portrait view below.
const siteSettings = fetch('/site-settings.json', { cache: 'no-store' })
  .then((response) => response.ok ? response.json() : Promise.reject(new Error(`Settings returned ${response.status}`)));
siteSettings.then(applyManagedProfileImage).catch(() => {});
loadManagedProjects();

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// Section links: offset hash scrolling for the sticky header (formerly hash-navigation.js).
(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const nav = header.querySelector('.nav-links');
  let resizeFrame = 0;
  let allowInitialCorrection = true;

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

  function targetContentTop(target) {
    const rect = target.getBoundingClientRect();
    let top = window.scrollY + rect.top;
    if (target.matches('section.section-shell')) {
      top += Number.parseFloat(getComputedStyle(target).paddingTop) || 0;
    }
    return top;
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
    const top = Math.max(0, targetContentTop(target) - offset);
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

    allowInitialCorrection = false;
    event.preventDefault();
    writeHash(hash);
    scrollToHash(hash);
    keepNavLinkVisible(link.closest('.nav-links') ? link : nav?.querySelector(`a[href="${hash}"]`));
  }, true);

  window.addEventListener('hashchange', () => {
    allowInitialCorrection = false;
    if (window.location.hash) scrollToHash(window.location.hash);
  });

  function correctInitialHash() {
    syncHeaderOffset();
    if (!allowInitialCorrection || !window.location.hash) return;
    scrollToHash(window.location.hash, 'auto');
    const active = nav?.querySelector(`a[href="${window.location.hash}"]`);
    keepNavLinkVisible(active);
  }

  ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach((type) => {
    window.addEventListener(type, () => { allowInitialCorrection = false; }, { passive: true, once: true });
  });

  syncHeaderOffset();
  requestAnimationFrame(() => requestAnimationFrame(correctInitialHash));
  window.addEventListener('load', () => {
    correctInitialHash();
    window.setTimeout(correctInitialHash, 180);
  }, { once: true });
  document.addEventListener('cloudlab:layoutchange', () => requestAnimationFrame(correctInitialHash));

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      syncHeaderOffset();
      correctInitialHash();
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

  siteSettings
    .then((settings) => {
      if (settings?.profileView === 'roblox') showRoblox();
    })
    .catch(() => {});
})();
