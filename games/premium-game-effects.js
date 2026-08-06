(() => {
  const path = window.location.pathname.toLowerCase();
  if (!path.startsWith('/games/')) return;

  const legacyGames = [
    '/games/snake/',
    '/games/2048/',
    '/games/memory-match/',
    '/games/pong/',
    '/games/tic-tac-toe/',
    '/games/minesweeper/'
  ];
  const isLegacyGame = legacyGames.some((route) => path.startsWith(route));
  const systemReduced = document.documentElement.dataset.systemReducedMotion === 'true'
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionDisabled = document.documentElement.classList.contains('game-motion-off') || systemReduced;

  function replay(element, className, duration = 520) {
    if (!element || motionDisabled) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(() => element.classList.remove(className), duration);
  }

  if (isLegacyGame) {
    document.body.classList.add('premium-game');

    document.querySelectorAll('.game-button, .touch-button').forEach((button) => {
      button.addEventListener('pointerdown', () => replay(button, 'premium-press', 340));
    });

    if (path !== '/games/2048/') {
      document.querySelectorAll('.score-chip strong:not(#time)').forEach((score) => {
        let previous = score.textContent;
        const observer = new MutationObserver(() => {
          const next = score.textContent;
          if (next === previous) return;
          previous = next;
          replay(score, 'premium-score-pop', 460);
          const stage = document.querySelector('.game-stage, .pong-stage, .mine-board, .ttt-board, .memory-board');
          replay(stage, 'premium-stage-hit', 520);
        });
        observer.observe(score, { childList: true, characterData: true, subtree: true });
      });
    }

    const message = document.querySelector('.game-message');
    const messageCard = message?.firstElementChild;
    if (message && messageCard) {
      const observer = new MutationObserver(() => {
        if (!message.classList.contains('hidden')) replay(messageCard, 'premium-message-pop', 520);
      });
      observer.observe(message, { attributes: true, attributeFilter: ['class'] });
    }
  }

  if (path.startsWith('/games/tic-tac-toe/')) {
    document.querySelectorAll('[data-cell]').forEach((cell) => {
      const observer = new MutationObserver(() => {
        if (cell.textContent.trim() || cell.classList.contains('win')) replay(cell, 'premium-cell-pop', 430);
      });
      observer.observe(cell, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    });
  }

  if (path.startsWith('/games/minesweeper/')) {
    const board = document.getElementById('board');
    if (board) {
      const observer = new MutationObserver((mutations) => {
        const changed = new Set();
        mutations.forEach((mutation) => {
          const cell = mutation.target.nodeType === Node.ELEMENT_NODE
            ? mutation.target.closest?.('.mine-cell')
            : mutation.target.parentElement?.closest('.mine-cell');
          if (cell) changed.add(cell);
        });
        changed.forEach((cell) => {
          if (cell.classList.contains('revealed') || cell.classList.contains('flagged') || cell.classList.contains('mine')) {
            replay(cell, 'premium-cell-pop', 430);
          }
        });
      });
      observer.observe(board, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    }
  }

  if (path.startsWith('/games/2048/')) {
    const toolbar = document.querySelector('.game-toolbar');
    if (!toolbar || document.getElementById('motionToggleButton')) return;

    const key = 'cloudlab-2048-motion';
    const button = document.createElement('button');
    button.id = 'motionToggleButton';
    button.type = 'button';
    button.className = 'game-button motion-toggle-button';

    function readSetting() {
      try { return localStorage.getItem(key) || 'on'; } catch (_) { return 'on'; }
    }

    function updateButton() {
      const systemControlled = document.documentElement.dataset.systemReducedMotion === 'true';
      const off = document.documentElement.classList.contains('game-motion-off');
      button.textContent = systemControlled ? 'Motion Effects: Off (System)' : `Motion Effects: ${off ? 'Off' : 'On'}`;
      button.setAttribute('aria-pressed', String(!off));
      button.classList.toggle('is-system-controlled', systemControlled);
      button.title = systemControlled
        ? 'Your device Reduced Motion setting is currently disabling animations.'
        : 'Toggle tile, score, board, and background motion effects.';
    }

    button.addEventListener('click', () => {
      const systemControlled = document.documentElement.dataset.systemReducedMotion === 'true';
      if (systemControlled) {
        replay(button, 'premium-press', 340);
        return;
      }

      const next = readSetting() === 'off' ? 'on' : 'off';
      try { localStorage.setItem(key, next); } catch (_) {}
      button.textContent = next === 'off' ? 'Turning Motion Off…' : 'Turning Motion On…';
      button.disabled = true;
      window.setTimeout(() => window.location.reload(), 170);
    });

    toolbar.append(button);
    updateButton();
  }
})();
