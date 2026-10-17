(() => {
  const ROUND = 30;
  const BEST_KEY = 'cloudlab-whack-a-cloud-best';
  const stage = document.getElementById('whackStage');
  const grid = document.getElementById('whackGrid');
  const scoreEl = document.getElementById('score');
  const timeEl = document.getElementById('time');
  const comboEl = document.getElementById('combo');
  const bestEl = document.getElementById('best');
  const timeBar = document.getElementById('timeBar');
  const timeFill = document.getElementById('timeFill');
  const comboHud = document.getElementById('comboHud');
  const comboPips = document.getElementById('comboPips');
  const comboBadge = document.getElementById('comboBadge');
  const message = document.getElementById('gameMessage');
  const messageTitle = document.getElementById('messageTitle');
  const messageText = document.getElementById('messageText');
  const startButton = document.getElementById('startButton');
  const restartButton = document.getElementById('restartButton');
  const controlNote = document.getElementById('controlNote');
  const touchUI = window.matchMedia?.('(pointer: coarse)').matches || false;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  const copy = touchUI ? {
    ready: 'Tap Start Round, then tap clouds as they pop up. Avoid the storms!',
    paused: 'Tap Resume to keep whacking.',
    again: 'Tap Play Again for another round.',
    note: 'Tap clouds the moment they appear. Golden clouds add +2 seconds; storm clouds cost 25 points and reset your combo.'
  } : {
    ready: 'Press Start or Space, then click clouds or use keys 1–9 (numpad layout) or Q W E / A S D / Z X C.',
    paused: 'Press Space or Resume to keep whacking.',
    again: 'Press Space or Play Again for another round.',
    note: 'Click clouds or use 7 8 9 / 4 5 6 / 1 2 3 (numpad layout) or Q W E / A S D / Z X C. Space or Enter starts and pauses. Golden clouds add time; storms cost points and your combo.'
  };
  if (touchUI) stage.classList.add('touch-ui');
  controlNote.textContent = copy.note;

  // Grid index 0..8 is top-left to bottom-right. Numpad layout: 7 8 9 on top.
  const KEY_LABELS = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];
  const KEY_MAP = {};
  ['7', '8', '9', '4', '5', '6', '1', '2', '3'].forEach((digit, index) => {
    KEY_MAP[`Digit${digit}`] = index;
    KEY_MAP[`Numpad${digit}`] = index;
  });
  ['KeyQ', 'KeyW', 'KeyE', 'KeyA', 'KeyS', 'KeyD', 'KeyZ', 'KeyX', 'KeyC'].forEach((code, index) => { KEY_MAP[code] = index; });

  const cloudSvg = '<svg viewBox="0 0 120 100" aria-hidden="true" focusable="false">'
    + '<polygon class="wc-bolt" points="64,62 50,86 60,86 53,100 76,74 65,74 72,62"/>'
    + '<g class="wc-body"><circle cx="36" cy="50" r="20"/><circle cx="61" cy="37" r="26"/><circle cx="87" cy="49" r="19"/><rect x="14" y="46" width="92" height="25" rx="12.5"/></g>'
    + '<ellipse class="wc-shine" cx="52" cy="24" rx="13" ry="5" transform="rotate(-14 52 24)"/>'
    + '<circle class="wc-eye" cx="50" cy="51" r="3.6"/><circle class="wc-eye" cx="71" cy="51" r="3.6"/>'
    + '<path class="wc-face wc-smile" d="M54 59 Q60.5 65 67 59"/>'
    + '<path class="wc-face wc-frown" d="M54 63 Q60.5 57 67 63"/>'
    + '<path class="wc-brow" d="M44 43 L55 47 M77 43 L66 47"/>'
    + '<path class="wc-sparkle" d="M100 14 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z"/>'
    + '<path class="wc-sparkle" d="M16 22 l2 4.5 4.5 2 -4.5 2 -2 4.5 -2 -4.5 -4.5 -2 4.5 -2z"/>'
    + '</svg>';

  const holes = [];
  for (let index = 0; index < 9; index += 1) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'wc-hole kind-cloud';
    el.setAttribute('aria-label', `Portal ${KEY_LABELS[index]}: empty`);
    el.innerHTML = `<span class="wc-key" aria-hidden="true">${KEY_LABELS[index]}</span><span class="wc-portal" aria-hidden="true"></span><span class="wc-cloud" aria-hidden="true">${cloudSvg}</span><span class="wc-burst" aria-hidden="true"></span>`;
    grid.appendChild(el);
    const hole = { el, burst: el.querySelector('.wc-burst'), index, kind: 'cloud', state: 'empty', until: 0, freeAt: 0 };
    holes.push(hole);
    // pointerdown keeps taps responsive; preventDefault stops focus stealing so number keys keep working.
    el.addEventListener('pointerdown', (event) => {
      if (event.button > 0) return;
      event.preventDefault();
      whack(index);
    });
    el.addEventListener('mousedown', (event) => event.preventDefault());
    // Keyboard activation of a focused portal (Enter/Space) arrives as a click with detail 0.
    el.addEventListener('click', (event) => { if (!event.detail) whack(index); });
  }
  for (let i = 0; i < 5; i += 1) comboPips.appendChild(document.createElement('i'));

  let best = 0;
  try {
    const saved = Number(localStorage.getItem(BEST_KEY) || 0);
    best = Number.isFinite(saved) && saved >= 0 ? Math.floor(saved) : 0;
  } catch (_) {}

  let running = false;
  let paused = false;
  let gameOver = false;
  let score = 0;
  let streak = 0;
  let bestStreak = 0;
  let hits = 0;
  let goldHits = 0;
  let stormHits = 0;
  let elapsed = 0;
  let limit = ROUND;
  let nextSpawn = 0;
  let lastHole = -1;
  let endedAt = 0;
  let last = 0;
  let raf = 0;
  let flashTimer = 0;
  const timeouts = new Set();

  function later(fn, ms) {
    const id = setTimeout(() => { timeouts.delete(id); fn(); }, ms);
    timeouts.add(id);
  }

  function multiplierFor(count) {
    if (count >= 20) return 4;
    if (count >= 10) return 3;
    if (count >= 5) return 2;
    return 1;
  }

  function isTypingTarget(target) {
    return target instanceof Element && Boolean(target.closest('input, select, textarea, [contenteditable="true"], [contenteditable=""]'));
  }

  function isActivatableTarget(target) {
    return target instanceof Element && Boolean(target.closest('a[href], button, summary'));
  }

  function showMessage(title, text) { messageTitle.textContent = title; messageText.textContent = text; message.classList.remove('hidden'); }
  function hideMessage() { message.classList.add('hidden'); }

  function timeLeft() { return Math.max(0, limit - elapsed); }

  function updateHud() {
    const mult = multiplierFor(streak);
    scoreEl.textContent = score;
    timeEl.textContent = Math.ceil(timeLeft() - 1e-6);
    comboEl.textContent = `x${mult}`;
    comboBadge.textContent = `x${mult}`;
    comboHud.dataset.tier = String(mult);
    const bounds = [[0, 5], [5, 10], [10, 20], [20, 20]][mult - 1];
    const filled = mult === 4 ? 5 : Math.floor(((streak - bounds[0]) / (bounds[1] - bounds[0])) * 5);
    [...comboPips.children].forEach((pip, i) => pip.classList.toggle('on', i < filled));
    const frac = Math.min(1, timeLeft() / ROUND);
    timeFill.style.transform = `scaleX(${frac})`;
    timeBar.classList.toggle('low', running && timeLeft() <= 5);
  }

  function setHole(hole, state) {
    hole.state = state;
    hole.el.classList.toggle('is-up', state === 'up');
    hole.el.classList.toggle('is-hit', state === 'hit');
    const label = state === 'up' ? (hole.kind === 'storm' ? 'storm cloud, do not tap' : hole.kind === 'gold' ? 'golden cloud' : 'cloud') : 'empty';
    hole.el.setAttribute('aria-label', `Portal ${KEY_LABELS[hole.index]}: ${label}`);
  }

  function setKind(hole, kind) {
    hole.kind = kind;
    hole.el.classList.remove('kind-cloud', 'kind-gold', 'kind-storm');
    hole.el.classList.add(`kind-${kind}`);
  }

  function clearHoles() {
    holes.forEach((hole) => { setHole(hole, 'empty'); hole.freeAt = 0; });
  }

  function floatText(hole, text, cls) {
    const stageRect = stage.getBoundingClientRect();
    const rect = hole.el.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = `wc-float ${cls || ''}`;
    el.textContent = text;
    el.style.left = `${rect.left - stageRect.left + rect.width / 2}px`;
    el.style.top = `${rect.top - stageRect.top + rect.height * .38}px`;
    stage.appendChild(el);
    later(() => el.remove(), 900);
  }

  function burst(hole, color) {
    hole.burst.style.setProperty('--burst', color);
    hole.burst.classList.remove('go');
    void hole.burst.offsetWidth;
    hole.burst.classList.add('go');
  }

  function flashStage(cls) {
    stage.classList.remove('is-storm-hit', 'is-gold-hit', 'shake');
    void stage.offsetWidth;
    stage.classList.add(cls);
    if (cls === 'is-storm-hit' && !reducedMotion) stage.classList.add('shake');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => stage.classList.remove('is-storm-hit', 'is-gold-hit', 'shake'), 340);
  }

  function pressFeedback(hole) {
    hole.el.classList.add('pressed');
    later(() => hole.el.classList.remove('pressed'), 110);
  }

  function whack(index) {
    const hole = holes[index];
    if (!hole) return;
    if (paused) { resumeGame(); return; }
    if (!running) {
      // Let a tap on the board start a round, but not right after one ends.
      if (performance.now() - endedAt > 700) start();
      return;
    }
    pressFeedback(hole);
    if (hole.state !== 'up') {
      floatText(hole, 'miss', 'miss');
      return;
    }
    setHole(hole, 'hit');
    hole.freeAt = elapsed + .3;
    hole.until = elapsed + .24;
    if (hole.kind === 'storm') {
      stormHits += 1;
      const lost = Math.min(25, score);
      score = Math.max(0, score - 25);
      streak = 0;
      burst(hole, '#ef6d68');
      floatText(hole, lost ? `−${lost}` : 'ZAP!', 'bad');
      flashStage('is-storm-hit');
    } else {
      const prevMult = multiplierFor(streak);
      streak += 1;
      hits += 1;
      bestStreak = Math.max(bestStreak, streak);
      const mult = multiplierFor(streak);
      if (hole.kind === 'gold') {
        goldHits += 1;
        const gained = 50 * mult;
        score += gained;
        limit += 2;
        burst(hole, '#f2c75c');
        floatText(hole, `+${gained}  +2s`, 'gold');
        flashStage('is-gold-hit');
      } else {
        const gained = 10 * mult;
        score += gained;
        burst(hole, mult >= 3 ? '#f2c75c' : mult === 2 ? '#8bcf9b' : '#68d0df');
        floatText(hole, `+${gained}`);
      }
      if (mult > prevMult) later(() => { if (running) floatText(holes[4], `COMBO x${mult}!`, 'tier'); }, 120);
    }
    updateHud();
  }

  function pickKind(progress) {
    const r = Math.random();
    if (elapsed > 2 && r < .065) return 'gold';
    const storm = elapsed < 2.5 ? 0 : .1 + .16 * progress;
    if (r < .065 + storm) return 'storm';
    return 'cloud';
  }

  function spawnOne(progress) {
    const free = holes.filter((hole) => hole.state === 'empty' && hole.freeAt <= elapsed && hole.index !== lastHole);
    if (!free.length) return;
    const hole = free[Math.floor(Math.random() * free.length)];
    const kind = pickKind(progress);
    const base = 1.2 - .62 * progress;
    const show = kind === 'gold' ? base * .82 : kind === 'storm' ? base * 1.35 : base;
    setKind(hole, kind);
    setHole(hole, 'up');
    hole.until = elapsed + show;
    lastHole = hole.index;
  }

  function update(dt) {
    elapsed += dt;
    const progress = Math.min(1, elapsed / ROUND);
    holes.forEach((hole) => {
      if (hole.state === 'up' && elapsed >= hole.until) {
        // Escaped clouds do not break the combo.
        setHole(hole, 'empty');
        hole.freeAt = elapsed + .22;
      } else if (hole.state === 'hit' && elapsed >= hole.until) {
        setHole(hole, 'empty');
      }
    });
    if (elapsed >= nextSpawn) {
      const active = holes.filter((hole) => hole.state === 'up').length;
      if (active < 3) {
        spawnOne(progress);
        if (progress > .5 && Math.random() < .25 + .4 * (progress - .5)) spawnOne(progress);
      }
      const gap = .82 - .44 * progress;
      nextSpawn = elapsed + gap * (.85 + Math.random() * .3);
    }
    if (timeLeft() <= 0) endGame();
    else updateHud();
  }

  function loop(now) {
    const dt = Math.min(.05, Math.max(0, (now - last) / 1000) || 0);
    last = now;
    if (running && !paused) update(dt);
    if (running && !paused) raf = requestAnimationFrame(loop);
  }

  function ensureLoop() {
    cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function resetGame() {
    cancelAnimationFrame(raf);
    timeouts.forEach((id) => clearTimeout(id));
    timeouts.clear();
    stage.querySelectorAll('.wc-float').forEach((el) => el.remove());
    running = false;
    paused = false;
    gameOver = false;
    score = 0;
    streak = 0;
    bestStreak = 0;
    hits = 0;
    goldHits = 0;
    stormHits = 0;
    elapsed = 0;
    limit = ROUND;
    nextSpawn = .45;
    lastHole = -1;
    clearHoles();
    startButton.textContent = 'Start Round';
    updateHud();
    showMessage('Clear the sky.', copy.ready);
  }

  function start() {
    if (running) return;
    if (gameOver || elapsed > 0) resetGame();
    running = true;
    paused = false;
    hideMessage();
    startButton.textContent = 'Pause';
    updateHud();
    ensureLoop();
  }

  function pauseGame() {
    if (!running || paused) return;
    paused = true;
    cancelAnimationFrame(raf);
    startButton.textContent = 'Resume';
    showMessage('Paused', copy.paused);
  }

  function resumeGame() {
    if (!paused) return;
    paused = false;
    startButton.textContent = 'Pause';
    hideMessage();
    ensureLoop();
  }

  function endGame() {
    running = false;
    gameOver = true;
    endedAt = performance.now();
    cancelAnimationFrame(raf);
    elapsed = limit;
    clearHoles();
    const newBest = score > best;
    best = Math.max(best, score);
    try { localStorage.setItem(BEST_KEY, String(best)); } catch (_) {}
    bestEl.textContent = best;
    updateHud();
    startButton.textContent = 'Play Again';
    const details = `${hits} ${hits === 1 ? 'cloud' : 'clouds'} whacked, best streak ${bestStreak}${goldHits ? `, ${goldHits} golden` : ''}${stormHits ? `, ${stormHits} ${stormHits === 1 ? 'storm' : 'storms'} touched` : ''}.`;
    showMessage(newBest && score > 0 ? 'New best!' : 'Time!', `You scored ${score}. ${details} ${copy.again}`);
  }

  function primaryAction() {
    if (paused) resumeGame();
    else if (running) pauseGame();
    else start();
  }

  startButton.addEventListener('click', (event) => { if (event.detail) startButton.blur(); primaryAction(); });
  restartButton.addEventListener('click', (event) => {
    if (event.detail) restartButton.blur();
    resetGame();
    start();
  });
  message.addEventListener('pointerdown', (event) => event.preventDefault());

  window.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    if (isTypingTarget(event.target)) return;
    const isStartKey = event.code === 'Space' || event.key === 'Enter';
    if (isStartKey) {
      // Let a focused button or link handle its own activation so nothing double-fires.
      if (isActivatableTarget(event.target)) return;
      event.preventDefault();
      primaryAction();
      return;
    }
    if (event.code === 'Escape' || event.code === 'KeyP') {
      if (running && !paused) { event.preventDefault(); pauseGame(); }
      return;
    }
    if (isActivatableTarget(event.target) && !event.target.closest('.wc-hole, .game-button')) return;
    const index = KEY_MAP[event.code];
    if (index === undefined) return;
    event.preventDefault();
    if (!running && !paused) return;
    whack(index);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
  window.addEventListener('blur', () => pauseGame());

  bestEl.textContent = best;
  resetGame();
})();
