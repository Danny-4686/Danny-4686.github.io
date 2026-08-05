(() => {
  const header = document.querySelector('.hub-header');
  if (!header) return;

  if (!document.querySelector('link[data-global-header]')) {
    const headerStyles = document.createElement('link');
    headerStyles.rel = 'stylesheet';
    headerStyles.href = '/global-header.css?v=3';
    headerStyles.dataset.globalHeader = 'true';
    document.head.append(headerStyles);
  }

  const navigation = header.querySelector('.hub-nav');
  if (navigation) {
    const links = [
      { label: 'About', href: '/#about', key: 'about' },
      { label: 'Projects', href: '/#projects', key: 'projects' },
      { label: 'Games', href: '/games/', key: 'games' },
      { label: 'Journal', href: '/journal/', key: 'journal' },
      { label: 'Connect', href: '/#connect', key: 'connect' }
    ];

    const path = window.location.pathname.toLowerCase();
    const activeKey = path.startsWith('/games')
      ? 'games'
      : path.startsWith('/journal')
        ? 'journal'
        : '';

    navigation.replaceChildren(...links.map((item) => {
      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.label;
      link.dataset.section = item.key;
      if (item.key === activeKey) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
      return link;
    }));

    navigation.addEventListener('click', (event) => {
      const selected = event.target.closest('a[data-section]');
      if (!selected) return;
      navigation.querySelectorAll('a').forEach((link) => {
        const isSelected = link === selected;
        link.classList.toggle('active', isSelected);
        if (isSelected) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    });
  }

  const brand = header.querySelector('.hub-brand');
  if (brand) {
    brand.href = '/';
    brand.setAttribute('aria-label', 'Danny4686 home');
  }

  const action = header.querySelector('.header-action');
  if (action) {
    action.href = 'https://discord.com/invite/CloudLab';
    action.target = '_blank';
    action.rel = 'noopener noreferrer';
    action.textContent = 'Join CloudLab';
  }
})();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const header = document.querySelector('.hub-header');
const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 18);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const revealItems = [...document.querySelectorAll('.reveal')];
revealItems.forEach((element, index) => {
  element.style.setProperty('--delay', `${Math.min(index % 4, 3) * 55}ms`);
});

if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((element) => element.classList.add('visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });

  revealItems.forEach((element) => observer.observe(element));
}

if (!reducedMotion) {
  const spotlightTargets = document.querySelectorAll(
    '.game-card, .journal-card, .info-panel, .post-panel, .game-panel'
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
}

const autoplayVideos = [...document.querySelectorAll('video[data-autoplay]')];
if (autoplayVideos.length) {
  autoplayVideos.forEach((video) => {
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
  });

  if ('IntersectionObserver' in window && !reducedMotion) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: [0, 0.55, 1] });

    autoplayVideos.forEach((video) => videoObserver.observe(video));
  }
}

const zoomableImages = [...document.querySelectorAll('img[data-zoom]')];
if (zoomableImages.length && 'HTMLDialogElement' in window) {
  const dialog = document.createElement('dialog');
  dialog.className = 'media-dialog';
  dialog.innerHTML = '<button class="dialog-close" type="button" aria-label="Close image">×</button><img alt="Expanded journal media">';
  document.body.append(dialog);

  const dialogImage = dialog.querySelector('img');
  dialog.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  zoomableImages.forEach((image) => {
    image.closest('.media-item')?.addEventListener('click', () => {
      dialogImage.src = image.currentSrc || image.src;
      dialogImage.alt = image.alt;
      dialog.showModal();
    });
  });
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
