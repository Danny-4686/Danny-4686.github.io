const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = [...document.querySelectorAll('.reveal')];

revealItems.forEach((element, index) => {
  element.style.setProperty('--delay', `${Math.min(index % 4, 3) * 55}ms`);
});

if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((element) => element.classList.add('visible'));
} else {
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

const sectionLinks = [...document.querySelectorAll('.nav-links a')];
const sections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window && sections.length) {
  const navObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    sectionLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${visible.target.id}`;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-24% 0px -58% 0px', threshold: [0, 0.2, 0.5] });

  sections.forEach((section) => navObserver.observe(section));
}

if (!reducedMotion) {
  window.addEventListener('pointermove', (event) => {
    document.documentElement.style.setProperty('--mouse-x', `${(event.clientX / window.innerWidth) * 100}%`);
    document.documentElement.style.setProperty('--mouse-y', `${(event.clientY / window.innerHeight) * 100}%`);
  }, { passive: true });

  const spotlightTargets = document.querySelectorAll(
    '.hero-portrait, .studio-strip-inner, .gloss-card, .project-card, .connect-card'
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
