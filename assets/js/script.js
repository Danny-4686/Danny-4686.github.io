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
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

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
  window.addEventListener('pointermove', (event) => {
    document.documentElement.style.setProperty('--mouse-x', `${(event.clientX / window.innerWidth) * 100}%`);
    document.documentElement.style.setProperty('--mouse-y', `${(event.clientY / window.innerHeight) * 100}%`);
  }, { passive: true });

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
  link.href = '/assets/css/project-managed.css?v=20260811.3';
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
  document.querySelectorAll('.hero-profile, .connect-identity img').forEach((image) => {
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
    card.tabIndex = 0;
    card.setAttribute('role', 'link');
    card.setAttribute('aria-label', `Open ${project.title}`);
    const open = () => {
      if (newTab) window.open(url, '_blank', 'noopener,noreferrer');
      else window.location.href = url;
    };
    card.addEventListener('click', (event) => {
      if (event.target.closest('a,button,input,select,textarea')) return;
      open();
    });
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      open();
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
  title.textContent = project.title;
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
  } catch (error) {
    grid.replaceChildren();
    grid.hidden = true;
    section.dataset.projectsState = 'unavailable';
    console.warn('Managed projects unavailable; project cards remain hidden.', error);
  } finally {
    section.removeAttribute('aria-busy');
    requestNavigationUpdate();
  }
}

fetch('/site-settings.json', { cache: 'no-store' })
  .then((response) => response.ok ? response.json() : Promise.reject(new Error(`Settings returned ${response.status}`)))
  .then(applyManagedProfileImage)
  .catch(() => {});
loadManagedProjects();

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
