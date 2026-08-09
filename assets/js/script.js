const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = [...document.querySelectorAll('.reveal')];

revealItems.forEach((element, index) => {
  element.style.setProperty('--delay', `${Math.min(index % 4, 3) * 55}ms`);
});

if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((element) => element.classList.add('visible'));
} else {
  revealItems.forEach((element) => element.classList.add('is-reveal-pending'));
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  revealItems.forEach((element) => revealObserver.observe(element));
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

if (!reducedMotion) {
  window.addEventListener('pointermove', (event) => {
    document.documentElement.style.setProperty('--mouse-x', `${(event.clientX / window.innerWidth) * 100}%`);
    document.documentElement.style.setProperty('--mouse-y', `${(event.clientY / window.innerHeight) * 100}%`);
  }, { passive: true });

  const spotlightTargets = document.querySelectorAll(
    '.hero-portrait, .studio-strip-inner, .gloss-card, .project-card, .connect-card, .destination-card'
  );

  spotlightTargets.forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      element.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
      element.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
    });

    element.addEventListener('pointerleave', () => {
      element.style.removeProperty('--spot-x');
      element.style.removeProperty('--spot-y');
    });
  });

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

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
