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
  let flagMode = false;
  let seconds = 0;
  let timer = null;
  let best = 0;
  try {
    const savedBest = Number.parseInt(localStorage.getItem(storageKey) || '0', 10);
    best = Number.isSafeInteger(savedBest) && savedBest > 0 ? savedBest : 0;
  } catch (_) {}

  bestElement.textContent = best ? `${best}s` : '--';

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
    flagMode = false;
    cells = Array.from({ length: size * size }, (_, index) => createCell(index));
    boardElement.replaceChildren();

    cells.forEach((cell) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mine-cell';
      button.dataset.index = String(cell.index);
      button.setAttribute('role', 'gridcell');
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
    element.disabled = cell.revealed || over;
    element.removeAttribute('data-number');
    element.replaceChildren();

    if (cell.flagged && !cell.revealed) {
      element.append(createCellImage(flagImageSource, 'flag-icon'));
      element.setAttribute('aria-label', `Flagged tile ${cell.row + 1}, ${cell.column + 1}`);
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

  function lose(hitCell) {
    over = true;
    window.clearInterval(timer);
    cells.forEach((cell) => {
      if (cell.mine) cell.revealed = true;
      renderCell(cell);
    });
    hitCell.element.classList.add('triggered');
    statusElement.textContent = 'A mine was triggered. Start a new board to try again.';
  }

  function checkWin() {
    const safeCount = size * size - mineTotal;
    const revealedSafe = cells.filter((cell) => cell.revealed && !cell.mine).length;
    if (revealedSafe !== safeCount) return;

    over = true;
    window.clearInterval(timer);
    cells.forEach((cell) => {
      if (cell.mine) cell.flagged = true;
      renderCell(cell);
    });
    updateMineCounter();
    statusElement.textContent = `Board cleared in ${seconds} seconds.`;

    if (!best || seconds < best) {
      best = seconds;
      bestElement.textContent = `${best}s`;
      try { localStorage.setItem(storageKey, String(best)); } catch (_) {}
    }
  }

  boardElement.addEventListener('click', (event) => {
    const button = event.target.closest('.mine-cell');
    if (!button) return;
    const cell = cells[Number(button.dataset.index)];
    if (flagMode) toggleFlag(cell);
    else reveal(cell);
  });

  boardElement.addEventListener('contextmenu', (event) => {
    const button = event.target.closest('.mine-cell');
    if (!button) return;
    event.preventDefault();
    toggleFlag(cells[Number(button.dataset.index)]);
  });

  flagModeButton.addEventListener('click', () => {
    flagMode = !flagMode;
    flagModeButton.textContent = `Flag Mode: ${flagMode ? 'On' : 'Off'}`;
    flagModeButton.setAttribute('aria-pressed', String(flagMode));
  });

  newGameButton.addEventListener('click', buildBoard);
  buildBoard();
})();
