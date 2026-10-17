(() => {
  const SIZE = 4;
  const CELLS = SIZE * SIZE;
  const BEST_KEY = 'cloudlab-slide-puzzle-best';
  const ROW_TINTS = ['#68d0df', '#8bcf9b', '#f2c75c', '#9e8cff'];
  const SWIPE_MIN = 24;

  const board = document.getElementById('board');
  const tilesEl = document.getElementById('tiles');
  const slotsEl = board.querySelector('.slide-slots');
  const movesEl = document.getElementById('moves');
  const timeEl = document.getElementById('time');
  const bestEl = document.getElementById('best');
  const statusEl = document.getElementById('slideStatus');
  const message = document.getElementById('gameMessage');
  const messageKicker = document.getElementById('messageKicker');
  const messageTitle = document.getElementById('messageTitle');
  const messageText = document.getElementById('messageText');
  const shuffleButton = document.getElementById('shuffleButton');
  const restartButton = document.getElementById('restartButton');
  const againButton = document.getElementById('againButton');
  const controlNote = document.getElementById('controlNote');
  const touchUI = window.matchMedia?.('(pointer: coarse)').matches || false;
  const copy = touchUI ? {
    note: 'Tap a tile in the gap’s row or column, or swipe the board to slide a tile into the gap. The timer starts on your first move.',
    again: 'Tap Shuffle Again for a fresh puzzle.'
  } : {
    note: 'Click a tile in the gap’s row or column, or use the arrow keys or WASD (the tile moves in the arrow’s direction). The timer starts on your first move.',
    again: 'Press Shuffle Again or New Shuffle for a fresh puzzle.'
  };
  controlNote.textContent = copy.note;

  let tiles = [];          // tiles[cell] = value (0 = gap)
  let startTiles = [];     // the current shuffle, for Restart
  let tileEls = new Map(); // value -> button
  let moves = 0;
  let elapsed = 0;         // ms accumulated while running
  let runStart = 0;        // performance.now() when the current running stretch began
  let running = false;
  let solved = false;
  let timerId = 0;
  let best = 0;
  try {
    const saved = Number(localStorage.getItem(BEST_KEY) || 0);
    best = Number.isFinite(saved) && saved > 0 ? Math.round(saved) : 0;
  } catch (_) {}

  const solvedTiles = () => Array.from({ length: CELLS }, (_, i) => (i + 1) % CELLS);
  const rowOf = (cell) => Math.floor(cell / SIZE);
  const colOf = (cell) => cell % SIZE;
  const homeOf = (value) => value - 1;

  function formatTime(ms) {
    const total = Math.floor(ms / 1000);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }

  function currentMs() {
    return elapsed + (running && runStart ? performance.now() - runStart : 0);
  }

  function renderBest() { bestEl.textContent = best > 0 ? `${best}s` : '--'; }
  function renderTime() { timeEl.textContent = formatTime(currentMs()); }

  function neighbours(cell) {
    const out = [];
    const r = rowOf(cell);
    const c = colOf(cell);
    if (r > 0) out.push(cell - SIZE);
    if (r < SIZE - 1) out.push(cell + SIZE);
    if (c > 0) out.push(cell - 1);
    if (c < SIZE - 1) out.push(cell + 1);
    return out;
  }

  function scramble() {
    let state = solvedTiles();
    for (let attempt = 0; attempt < 60; attempt += 1) {
      state = solvedTiles();
      let gap = CELLS - 1;
      let previous = -1;
      const steps = 220 + Math.floor(Math.random() * 120);
      for (let i = 0; i < steps; i += 1) {
        const options = neighbours(gap).filter((cell) => cell !== previous);
        const pick = options[Math.floor(Math.random() * options.length)];
        state[gap] = state[pick];
        state[pick] = 0;
        previous = gap;
        gap = pick;
      }
      let inPlace = 0;
      let distance = 0;
      state.forEach((value, cell) => {
        if (!value) return;
        const home = homeOf(value);
        if (home === cell) inPlace += 1;
        distance += Math.abs(rowOf(home) - rowOf(cell)) + Math.abs(colOf(home) - colOf(cell));
      });
      // Reject boards that are already solved or only a few slides from it.
      if (inPlace <= 4 && distance >= 30) break;
    }
    return state;
  }

  function buildBoard() {
    slotsEl.replaceChildren(...Array.from({ length: CELLS }, () => document.createElement('span')));
    tileEls = new Map();
    const fragment = document.createDocumentFragment();
    for (let value = 1; value < CELLS; value += 1) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'slide-tile';
      tile.textContent = String(value);
      tile.dataset.value = String(value);
      tile.style.setProperty('--tint', ROW_TINTS[rowOf(homeOf(value))]);
      tile.style.setProperty('--i', String(value - 1));
      tileEls.set(value, tile);
      fragment.append(tile);
    }
    tilesEl.replaceChildren(fragment);
  }

  function render() {
    const gap = tiles.indexOf(0);
    let inPlace = 0;
    tiles.forEach((value, cell) => {
      if (!value) return;
      const tile = tileEls.get(value);
      const r = rowOf(cell);
      const c = colOf(cell);
      const home = homeOf(value) === cell;
      if (home) inPlace += 1;
      tile.style.setProperty('--r', String(r));
      tile.style.setProperty('--c', String(c));
      tile.classList.toggle('is-home', home);
      const movable = !solved && cell !== gap && (rowOf(gap) === r || colOf(gap) === c);
      tile.classList.toggle('is-movable', movable);
      tile.setAttribute('aria-label', `Tile ${value}, row ${r + 1} column ${c + 1}${home ? ', in place' : ''}`);
    });
    movesEl.textContent = String(moves);
    statusEl.textContent = solved ? 'All 15 tiles in place' : `${inPlace} of 15 tiles in place`;
  }

  function startTimer() {
    if (running) return;
    running = true;
    runStart = performance.now();
    clearInterval(timerId);
    timerId = setInterval(renderTime, 250);
  }

  function stopTimer() {
    if (running) elapsed += performance.now() - runStart;
    running = false;
    runStart = 0;
    clearInterval(timerId);
    renderTime();
  }

  function hideMessage() { message.classList.add('hidden'); }

  function load(state) {
    stopTimer();
    tiles = state.slice();
    moves = 0;
    elapsed = 0;
    solved = false;
    board.classList.remove('is-solved');
    hideMessage();
    // Jump into place without animating tiles across the board.
    tilesEl.querySelectorAll('.slide-tile').forEach((tile) => { tile.style.transition = 'none'; });
    render();
    renderTime();
    void tilesEl.offsetWidth;
    tilesEl.querySelectorAll('.slide-tile').forEach((tile) => { tile.style.transition = ''; });
  }

  function newShuffle() {
    startTiles = scramble();
    load(startTiles);
  }

  function restartShuffle() {
    load(startTiles);
  }

  function isSolved() {
    for (let i = 0; i < CELLS - 1; i += 1) if (tiles[i] !== i + 1) return false;
    return true;
  }

  function bump() {
    board.classList.remove('is-bumped');
    void board.offsetWidth;
    board.classList.add('is-bumped');
  }

  // Slide the tile at `cell` (and any tiles between it and the gap) toward the gap.
  function slideFrom(cell) {
    if (solved || cell < 0 || cell >= CELLS) return false;
    const gap = tiles.indexOf(0);
    if (cell === gap) return false;
    let step;
    if (rowOf(cell) === rowOf(gap)) step = cell > gap ? 1 : -1;
    else if (colOf(cell) === colOf(gap)) step = cell > gap ? SIZE : -SIZE;
    else { bump(); return false; }
    let hole = gap;
    while (hole !== cell) {
      tiles[hole] = tiles[hole + step];
      tiles[hole + step] = 0;
      hole += step;
    }
    if (!running) startTimer();
    moves += 1;
    if (isSolved()) finish();
    render();
    return true;
  }

  // dir is the direction the tile travels; the tile comes from the opposite side of the gap.
  function moveDirection(dir) {
    const gap = tiles.indexOf(0);
    const r = rowOf(gap);
    const c = colOf(gap);
    let source = -1;
    if (dir === 'left' && c < SIZE - 1) source = gap + 1;
    if (dir === 'right' && c > 0) source = gap - 1;
    if (dir === 'up' && r < SIZE - 1) source = gap + SIZE;
    if (dir === 'down' && r > 0) source = gap - SIZE;
    if (source < 0) { if (!solved) bump(); return false; }
    return slideFrom(source);
  }

  function finish() {
    solved = true;
    stopTimer();
    const seconds = Math.max(1, Math.floor(elapsed / 1000));
    const record = best === 0 || seconds < best;
    if (record) {
      best = seconds;
      try { localStorage.setItem(BEST_KEY, String(best)); } catch (_) {}
      renderBest();
    }
    board.classList.add('is-solved');
    messageKicker.textContent = record ? 'NEW BEST TIME' : 'PUZZLE SOLVED';
    messageTitle.textContent = 'Solved!';
    messageText.textContent = `${formatTime(elapsed)} in ${moves} ${moves === 1 ? 'move' : 'moves'}.${record ? '' : ` Best: ${best}s.`} ${copy.again}`;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => {
      if (!solved) return;
      message.classList.remove('hidden');
      if (document.activeElement && tilesEl.contains(document.activeElement)) againButton.focus({ preventScroll: true });
    }, reduce ? 0 : 750);
  }

  function isTypingTarget(target) {
    return target instanceof Element && Boolean(target.closest('input, select, textarea, [contenteditable="true"]'));
  }

  function isActivatableTarget(target) {
    return target instanceof Element && Boolean(target.closest('a[href], button, summary'));
  }

  const KEY_DIRS = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down'
  };

  window.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTypingTarget(event.target)) return;
    // Tile buttons live inside the board, so arrows still work while one has focus.
    if (isActivatableTarget(event.target) && !board.contains(event.target)) return;
    const dir = KEY_DIRS[event.key];
    if (!dir || solved) return;
    event.preventDefault();
    moveDirection(dir);
  });

  // Pointer: a short press on a tile slides it; a drag is a swipe in the tile-movement direction.
  let pointer = null;
  let lastPointerUp = -Infinity;
  board.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const tile = event.target instanceof Element ? event.target.closest('.slide-tile') : null;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, value: tile ? Number(tile.dataset.value) : 0 };
    if (event.pointerType !== 'mouse') event.preventDefault();
    try { board.setPointerCapture(event.pointerId); } catch (_) {}
  });

  board.addEventListener('pointerup', (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    const value = pointer.value;
    pointer = null;
    lastPointerUp = performance.now();
    if (Math.max(Math.abs(dx), Math.abs(dy)) >= SWIPE_MIN) {
      if (Math.abs(dx) > Math.abs(dy)) moveDirection(dx > 0 ? 'right' : 'left');
      else moveDirection(dy > 0 ? 'down' : 'up');
      return;
    }
    if (value) slideFrom(tiles.indexOf(value));
  });

  // Keep mouse clicks from leaving a focus ring on the tile they moved.
  board.addEventListener('mousedown', (event) => { event.preventDefault(); });

  board.addEventListener('pointercancel', () => { pointer = null; });

  // Keyboard activation (Enter/Space) of a focused tile arrives as a click with detail 0;
  // clicks that follow a pointer press were already handled in pointerup.
  tilesEl.addEventListener('click', (event) => {
    if (event.detail || event.pointerType || performance.now() - lastPointerUp < 600) return;
    const tile = event.target instanceof Element ? event.target.closest('.slide-tile') : null;
    if (tile) slideFrom(tiles.indexOf(Number(tile.dataset.value)));
  });

  board.addEventListener('animationend', (event) => {
    if (event.animationName === 'slideBump') board.classList.remove('is-bumped');
  });

  shuffleButton.addEventListener('click', (event) => { if (event.detail) shuffleButton.blur(); newShuffle(); });
  restartButton.addEventListener('click', (event) => { if (event.detail) restartButton.blur(); restartShuffle(); });
  againButton.addEventListener('click', (event) => { if (event.detail) againButton.blur(); newShuffle(); });

  let pausedByVisibility = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (running) { stopTimer(); pausedByVisibility = true; }
    } else if (pausedByVisibility) {
      pausedByVisibility = false;
      if (!solved && moves > 0) startTimer();
    }
  });

  buildBoard();
  renderBest();
  newShuffle();
})();
