(() => {
  if (!document.querySelector('link[data-community-ui]')) {
    const styles = document.createElement('link');
    styles.rel = 'stylesheet';
    styles.href = '/community/community.css?v=20260808';
    styles.dataset.communityUi = 'true';
    document.head.append(styles);
  }
  if (!document.querySelector('script[data-community-ui]')) {
    const script = document.createElement('script');
    script.src = '/community/community-client.js?v=20260808';
    script.dataset.communityUi = 'true';
    document.head.append(script);
  }
})();

(() => {
  const path = window.location.pathname.toLowerCase();
  if (!path.startsWith('/games/')) return;

  if (!document.querySelector('style[data-cloud-hopper-coin-size]')) {
    const coinSizeStyles = document.createElement('style');
    coinSizeStyles.dataset.cloudHopperCoinSize = 'true';
    coinSizeStyles.textContent = '.hopper-preview .preview-coin{width:24px!important;height:24px!important}';
    document.head.append(coinSizeStyles);
  }

  const nativeMatchMedia = typeof window.matchMedia === 'function'
    ? window.matchMedia.bind(window)
    : null;
  const systemReducedMotion = nativeMatchMedia
    ? nativeMatchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  document.documentElement.dataset.systemReducedMotion = String(systemReducedMotion);

  if (path.startsWith('/games/2048/')) {
    let manualMotionOff = false;
    try { manualMotionOff = localStorage.getItem('cloudlab-2048-motion') === 'off'; } catch (_) {}
    const shouldReduceMotion = systemReducedMotion || manualMotionOff;
    document.documentElement.classList.toggle('game-motion-off', shouldReduceMotion);
    document.documentElement.dataset.gameMotion = shouldReduceMotion ? 'off' : 'on';

    if (manualMotionOff && nativeMatchMedia) {
      window.matchMedia = (query) => {
        const result = nativeMatchMedia(query);
        if (query !== '(prefers-reduced-motion: reduce)') return result;
        return {
          matches: true,
          media: result.media,
          onchange: result.onchange,
          addListener: result.addListener?.bind(result) || (() => {}),
          removeListener: result.removeListener?.bind(result) || (() => {}),
          addEventListener: result.addEventListener?.bind(result) || (() => {}),
          removeEventListener: result.removeEventListener?.bind(result) || (() => {}),
          dispatchEvent: result.dispatchEvent?.bind(result) || (() => false)
        };
      };
    }
  }

  if (path.startsWith('/games/cloud-hopper/') && window.CanvasRenderingContext2D) {
    const coinSprite = new Image();
    coinSprite.decoding = 'async';
    coinSprite.src = '/assets/images/memory/optimized/clgold-256.webp';
    const prototype = window.CanvasRenderingContext2D.prototype;
    const originalFillText = prototype.fillText;

    if (!prototype.__cloudLabGoldCoinPatch) {
      Object.defineProperty(prototype, '__cloudLabGoldCoinPatch', { value: true });
      prototype.fillText = function patchedCloudCoin(text, x, y, maxWidth) {
        if (text === 'C' && this.canvas?.id === 'hopperCanvas' && coinSprite.complete && coinSprite.naturalWidth > 0) {
          const size = 25;
          this.save();
          this.shadowColor = 'rgba(242, 199, 92, .58)';
          this.shadowBlur = 18;
          this.drawImage(coinSprite, x - size / 2, y - size / 2, size, size);
          this.restore();
          return;
        }
        if (maxWidth === undefined) return originalFillText.call(this, text, x, y);
        return originalFillText.call(this, text, x, y, maxWidth);
      };
    }
  }

  if (!document.querySelector('link[data-premium-game-effects]')) {
    const gameStyles = document.createElement('link');
    gameStyles.rel = 'stylesheet';
    gameStyles.href = '/games/premium-game-effects.css?v=20260808';
    gameStyles.dataset.premiumGameEffects = 'true';
    document.head.append(gameStyles);
  }

  if (!document.querySelector('script[data-premium-game-effects]')) {
    const gameScript = document.createElement('script');
    gameScript.src = '/games/premium-game-effects.js?v=20260808';
    gameScript.dataset.premiumGameEffects = 'true';
    document.head.append(gameScript);
  }
})();

(() => {
  const header = document.querySelector('.hub-header');
  if (!header) return;

  if (!document.querySelector('link[data-global-header]')) {
    const headerStyles = document.createElement('link');
    headerStyles.rel = 'stylesheet';
    headerStyles.href = '/assets/css/global-header.css?v=20260808';
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
  revealItems.forEach((element) => element.classList.add('is-reveal-pending'));
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
