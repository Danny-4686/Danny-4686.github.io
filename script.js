const body = document.body;
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle?.querySelector('.theme-icon');
const savedTheme = localStorage.getItem('theme');
const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

function applyTheme(theme) {
  const isLight = theme === 'light';
  body.classList.toggle('light', isLight);

  if (themeToggle && themeIcon) {
    themeToggle.setAttribute('aria-pressed', String(isLight));
    themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
    themeIcon.textContent = isLight ? '☾' : '☀';
  }
}

applyTheme(savedTheme || (prefersLight ? 'light' : 'dark'));

themeToggle?.addEventListener('click', () => {
  const nextTheme = body.classList.contains('light') ? 'dark' : 'light';
  localStorage.setItem('theme', nextTheme);
  applyTheme(nextTheme);
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reducedMotion || !('IntersectionObserver' in window)) {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}

if (!reducedMotion) {
  window.addEventListener('pointermove', (event) => {
    const x = `${(event.clientX / window.innerWidth) * 100}%`;
    const y = `${(event.clientY / window.innerHeight) * 100}%`;
    document.documentElement.style.setProperty('--mouse-x', x);
    document.documentElement.style.setProperty('--mouse-y', y);
  });
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();