(() => {
  const boardElement = document.getElementById('board');
  if (!boardElement) return;

  const mineCountElement = document.getElementById('mineCount');
  const timeElement = document.getElementById('time');
  const bestElement = document.getElementById('best');
  const statusElement = document.getElementById('status');
  const newGameButton = document.getElementById('newGameButton');
  const flagModeButton = document.getElementById('flagModeButton');

  const size = 9;
  const mineTotal = 10;
  const storageKey = 'cloudlab-minesweeper-best';
  const flagImageSource = '../../assets/images/memory/optimized/flag-160.webp';
  const bombImageSource = '../../assets/images/memory/optimized/bomb-160.webp';

  let cells = [];
  let started = false;
  let over = false;
  let lost = false;
  let flagMode = false;
  let seconds = 0;
  let timer = null;
  let longPress = null;
  let suppressClickUntil = 0;
  // null means "no record yet" so a genuine 0-second clear still counts and displays.
  let best = null;
  try {
    const saved = localStorage.getItem(storageKey);
    const savedBest = saved === null ? NaN : Number.parseInt(saved, 10);
    best = Number.isSafeInteger(savedBest) && savedBest >= 0 ? savedBest : null;
  } catch (_) {}

  bestElement.textContent = best === null ? '--' : `${best}s`;

  function createCell(index) {
    const row = Math.floor(index / size);
    const column = index % size;
    return {
      index,
      row,
      column,
      mine: false,
      revealed: false,
      flagged: false,
      number: 0,
      element: null
    };
  }

  function createCellImage(source, className) {
    const image = document.createElement('img');
    image.className = `mine-cell-icon ${className}`;
    image.src = source;
    image.alt = '';
    image.draggable = false;
    image.decoding = 'async';
    return image;
  }

  function neighbors(cell) {
    const output = [];
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
        if (!rowOffset && !columnOffset) continue;
        const row = cell.row + rowOffset;
        const column = cell.column + columnOffset;
        if (row < 0 || column < 0 || row >= size || column >= size) continue;
        output.push(cells[row * size + column]);
      }
    }
    return output;
  }

  function buildBoard() {
    window.clearInterval(timer);
    timer = null;
    seconds = 0;
    started = false;
    over = false;
    lost = false;
    flagMode = false;
    cells = Array.from({ length: size * size }, (_, index) => createCell(index));
    boardElement.replaceChildren();

    cells.forEach((cell) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mine-cell';
      button.dataset.index = String(cell.index);
      button.setAttribute('aria-label', `Hidden tile ${cell.row + 1}, ${cell.column + 1}`);
      cell.element = button;
      boardElement.append(button);
    });

    timeElement.textContent = '0';
    mineCountElement.textContent = String(mineTotal);
    statusElement.textContent = 'Choose a tile to begin.';
    flagModeButton.textContent = 'Flag Mode: Off';
    flagModeButton.setAttribute('aria-pressed', 'false');
  }

  function placeMines(firstCell) {
    const safe = new Set([firstCell.index, ...neighbors(firstCell).map((cell) => cell.index)]);
    const available = cells.map((cell) => cell.index).filter((index) => !safe.has(index));

    for (let index = available.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [available[index], available[randomIndex]] = [available[randomIndex], available[index]];
    }

    available.slice(0, mineTotal).forEach((index) => { cells[index].mine = true; });
    cells.forEach((cell) => {
      cell.number = neighbors(cell).filter((neighbor) => neighbor.mine).length;
    });
  }

  function startTimer() {
    if (timer) return;
    timer = window.setInterval(() => {
      seconds += 1;
      timeElement.textContent = String(seconds);
    }, 1000);
  }

  function countFlags() {
    return cells.filter((cell) => cell.flagged).length;
  }

  function updateMineCounter() {
    mineCountElement.textContent = String(Math.max(0, mineTotal - countFlags()));
  }

  function reveal(cell) {
    if (over || cell.flagged || cell.revealed) return;

    if (!started) {
      started = true;
      placeMines(cell);
      startTimer();
      statusElement.textContent = 'Clear every safe tile.';
    }

    if (cell.mine) {
      lose(cell);
      return;
    }

    revealSafeArea(cell);
    checkWin();
  }

  function revealSafeArea(startCell) {
    const queue = [startCell];
    const visited = new Set();

    while (queue.length) {
      const cell = queue.shift();
      if (!cell || visited.has(cell.index) || cell.flagged || cell.mine) continue;
      visited.add(cell.index);
      cell.revealed = true;
      renderCell(cell);

      if (cell.number === 0) {
        neighbors(cell).forEach((neighbor) => {
          if (!visited.has(neighbor.index) && !neighbor.mine) queue.push(neighbor);
        });
      }
    }
  }

  function toggleFlag(cell) {
    if (over || cell.revealed) return;
    cell.flagged = !cell.flagged;
    renderCell(cell);
    updateMineCounter();
  }

  function renderCell(cell) {
    const element = cell.element;
    element.classList.toggle('revealed', cell.revealed);
    element.classList.toggle('flagged', cell.flagged && !cell.revealed);
    element.classList.toggle('mine', cell.revealed && cell.mine);
    const wrongFlag = lost && cell.flagged && !cell.mine;
    element.classList.toggle('wrong-flag', wrongFlag);
    element.classList.toggle('chordable', cell.revealed && cell.number > 0 && !over);
    // Revealed numbers stay clickable so they can be chorded.
    element.disabled = over || (cell.revealed && !cell.number);
    element.removeAttribute('data-number');
    element.replaceChildren();

    if (cell.flagged && !cell.revealed) {
      element.append(createCellImage(flagImageSource, 'flag-icon'));
      element.setAttribute('aria-label', `${wrongFlag ? 'Wrong flag, no mine at' : 'Flagged tile'} ${cell.row + 1}, ${cell.column + 1}`);
    } else if (cell.revealed && cell.mine) {
      element.append(createCellImage(bombImageSource, 'bomb-icon'));
      element.setAttribute('aria-label', 'Mine');
    } else if (cell.revealed && cell.number > 0) {
      element.textContent = String(cell.number);
      element.dataset.number = String(cell.number);
      element.setAttribute('aria-label', `${cell.number} nearby mines`);
    } else if (cell.revealed) {
      element.setAttribute('aria-label', 'Empty safe tile');
    } else {
      element.setAttribute('aria-label', `Hidden tile ${cell.row + 1}, ${cell.column + 1}`);
    }
  }

  // Clicking a revealed number whose flag count matches opens the rest of its neighbours.
  function chord(cell) {
    if (over || !cell.revealed || !cell.number) return;
    const around = neighbors(cell);
    if (around.filter((neighbor) => neighbor.flagged).length !== cell.number) return;
    const hidden = around.filter((neighbor) => !neighbor.revealed && !neighbor.flagged);
    const mine = hidden.find((neighbor) => neighbor.mine);
    if (mine) {
      lose(mine);
      return;
    }
    hidden.forEach((neighbor) => revealSafeArea(neighbor));
    if (hidden.length) checkWin();
  }

  function lose(hitCell) {
    over = true;
    lost = true;
    window.clearInterval(timer);
    timer = null;
    cells.forEach((cell) => {
      if (cell.mine && !cell.flagged) cell.revealed = true;
      renderCell(cell);
    });
    hitCell.element.classList.add('triggered');
    const wrongFlags = cells.filter((cell) => cell.flagged && !cell.mine).length;
    statusElement.textContent = `A mine was triggered${wrongFlags ? ` and ${wrongFlags} flag${wrongFlags === 1 ? ' was' : 's were'} wrong (crossed out)` : ''}. Start a new board to try again.`;
  }

  function checkWin() {
    const safeCount = size * size - mineTotal;
    const revealedSafe = cells.filter((cell) => cell.revealed && !cell.mine).length;
    if (revealedSafe !== safeCount) return;

    over = true;
    window.clearInterval(timer);
    timer = null;
    cells.forEach((cell) => {
      if (cell.mine) cell.flagged = true;
      renderCell(cell);
    });
    updateMineCounter();
    statusElement.textContent = `Board cleared in ${seconds} seconds.`;

    if (best === null || seconds < best) {
      best = seconds;
      bestElement.textContent = `${best}s`;
      try { localStorage.setItem(storageKey, String(best)); } catch (_) {}
    }
  }

  boardElement.addEventListener('click', (event) => {
    const button = event.target.closest('.mine-cell');
    if (!button) return;
    if (Date.now() < suppressClickUntil) return;
    const cell = cells[Number(button.dataset.index)];
    if (cell.revealed) chord(cell);
    else if (flagMode) toggleFlag(cell);
    else reveal(cell);
  });

  boardElement.addEventListener('contextmenu', (event) => {
    const button = event.target.closest('.mine-cell');
    if (!button) return;
    event.preventDefault();
    // A touch long-press already flagged this tile; ignore the browser's own long-press menu event.
    if (Date.now() < suppressClickUntil) return;
    toggleFlag(cells[Number(button.dataset.index)]);
  });

  // Touch long-press (~400ms) flags a tile without needing Flag Mode.
  function cancelLongPress() {
    if (!longPress) return;
    window.clearTimeout(longPress.timer);
    longPress = null;
  }

  boardElement.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse') return;
    const button = event.target.closest('.mine-cell');
    if (!button || button.disabled) return;
    const cell = cells[Number(button.dataset.index)];
    if (cell.revealed) return;
    cancelLongPress();
    longPress = {
      x: event.clientX,
      y: event.clientY,
      timer: window.setTimeout(() => {
        longPress = null;
        suppressClickUntil = Date.now() + 700;
        toggleFlag(cell);
        if ('vibrate' in navigator) navigator.vibrate(18);
      }, 400)
    };
  });

  boardElement.addEventListener('pointermove', (event) => {
    if (longPress && Math.hypot(event.clientX - longPress.x, event.clientY - longPress.y) > 10) cancelLongPress();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => boardElement.addEventListener(type, cancelLongPress));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.clearInterval(timer);
      timer = null;
    } else if (started && !over) {
      startTimer();
    }
  });

  flagModeButton.addEventListener('click', () => {
    flagMode = !flagMode;
    flagModeButton.textContent = `Flag Mode: ${flagMode ? 'On' : 'Off'}`;
    flagModeButton.setAttribute('aria-pressed', String(flagMode));
  });

  newGameButton.addEventListener('click', buildBoard);
  buildBoard();
})();
