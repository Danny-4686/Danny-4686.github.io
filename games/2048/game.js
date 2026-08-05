(() => {
  const boardElement = document.getElementById('board');
  if (!boardElement) return;

  const scoreElement = document.getElementById('score');
  const bestElement = document.getElementById('bestScore');
  const scoreChip = scoreElement.closest('.score-chip');
  const message = document.getElementById('gameMessage');
  const messageTitle = document.getElementById('messageTitle');
  const messageText = document.getElementById('messageText');
  const continueButton = document.getElementById('continueButton');
  const newGameButton = document.getElementById('newGameButton');
  const overlayRestartButton = document.getElementById('overlayRestartButton');
  const undoButton = document.getElementById('undoButton');

  const size = 4;
  const bestKey = 'cloudlab-2048-best';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionDuration = 190;
  let board = [];
  let score = 0;
  let bestScore = loadBestScore();
  let previousState = null;
  let winShown = false;
  let touchStart = null;
  let inputLocked = false;
  let motionTimer = null;

  bestElement.textContent = formatNumber(bestScore);

  function loadBestScore() {
    try {
      return Number.parseInt(localStorage.getItem(bestKey) || '0', 10) || 0;
    } catch (_) {
      return 0;
    }
  }

  function formatNumber(value) {
    return Number(value).toLocaleString('en-US');
  }

  function emptyBoard() {
    return Array.from({ length: size }, () => Array(size).fill(0));
  }

  function cloneBoard(source = board) {
    return source.map((row) => [...row]);
  }

  function boardsMatch(first, second) {
    for (let row = 0; row < size; row += 1) {
      for (let column = 0; column < size; column += 1) {
        if (first[row][column] !== second[row][column]) return false;
      }
    }
    return true;
  }

  function cellKey(row, column) {
    return `${row}:${column}`;
  }

  function availableCells() {
    const cells = [];
    board.forEach((row, rowIndex) => {
      row.forEach((value, columnIndex) => {
        if (value === 0) cells.push({ row: rowIndex, column: columnIndex });
      });
    });
    return cells;
  }

  function addRandomTile() {
    const cells = availableCells();
    if (!cells.length) return null;
    const target = cells[Math.floor(Math.random() * cells.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    board[target.row][target.column] = value;
    return { ...target, value };
  }

  function startNewGame() {
    window.clearTimeout(motionTimer);
    inputLocked = false;
    boardElement.classList.remove('is-moving', 'is-blocked', 'is-undoing', 'move-left', 'move-right', 'move-up', 'move-down');
    board = emptyBoard();
    score = 0;
    previousState = null;
    winShown = false;
    const firstTile = addRandomTile();
    const secondTile = addRandomTile();
    hideMessage();
    render({ newCells: [firstTile, secondTile].filter(Boolean) });
  }

  function slideLine(line) {
    const values = line.filter((value) => value !== 0);
    const merged = [];
    const mergedIndexes = [];
    let gained = 0;

    for (let index = 0; index < values.length; index += 1) {
      if (values[index] === values[index + 1]) {
        const combined = values[index] * 2;
        mergedIndexes.push(merged.length);
        merged.push(combined);
        gained += combined;
        index += 1;
      } else {
        merged.push(values[index]);
      }
    }

    while (merged.length < size) merged.push(0);
    return { line: merged, gained, mergedIndexes };
  }

  function getColumn(columnIndex) {
    return board.map((row) => row[columnIndex]);
  }

  function setColumn(columnIndex, values) {
    values.forEach((value, rowIndex) => {
      board[rowIndex][columnIndex] = value;
    });
  }

  function move(direction) {
    if (inputLocked) return;

    const before = cloneBoard();
    const scoreBefore = score;
    const mergedCells = [];
    let gained = 0;

    if (direction === 'left' || direction === 'right') {
      board = board.map((row, rowIndex) => {
        const input = direction === 'right' ? [...row].reverse() : [...row];
        const result = slideLine(input);
        gained += result.gained;
        result.mergedIndexes.forEach((index) => {
          const column = direction === 'right' ? size - 1 - index : index;
          mergedCells.push(cellKey(rowIndex, column));
        });
        return direction === 'right' ? result.line.reverse() : result.line;
      });
    } else {
      for (let column = 0; column < size; column += 1) {
        const source = getColumn(column);
        const input = direction === 'down' ? [...source].reverse() : source;
        const result = slideLine(input);
        gained += result.gained;
        result.mergedIndexes.forEach((index) => {
          const row = direction === 'down' ? size - 1 - index : index;
          mergedCells.push(cellKey(row, column));
        });
        setColumn(column, direction === 'down' ? result.line.reverse() : result.line);
      }
    }

    if (boardsMatch(before, board)) {
      showBlockedMove(direction);
      return;
    }

    previousState = { board: before, score: scoreBefore };
    score += gained;
    const newTile = addRandomTile();
    const bestImproved = updateBest();
    inputLocked = true;
    render({ mergedCells, newCells: newTile ? [newTile] : [] });
    playMoveFeedback(direction, gained, bestImproved);
  }

  function playMoveFeedback(direction, gained, bestImproved) {
    window.clearTimeout(motionTimer);
    boardElement.classList.remove('is-moving', 'is-blocked', 'move-left', 'move-right', 'move-up', 'move-down');

    if (gained > 0) {
      showScoreGain(gained);
      bumpScore(scoreElement);
      if ('vibrate' in navigator) navigator.vibrate(gained >= 128 ? [10, 18, 10] : 9);
    }
    if (bestImproved) bumpScore(bestElement);

    if (reducedMotion) {
      inputLocked = false;
      undoButton.disabled = !previousState;
      checkGameState();
      return;
    }

    requestAnimationFrame(() => {
      boardElement.classList.add('is-moving', `move-${direction}`);
    });

    motionTimer = window.setTimeout(() => {
      boardElement.classList.remove('is-moving', `move-${direction}`);
      inputLocked = false;
      undoButton.disabled = !previousState;
      checkGameState();
    }, motionDuration);
  }

  function showBlockedMove(direction) {
    if (reducedMotion) return;
    inputLocked = true;
    undoButton.disabled = true;
    boardElement.classList.remove('is-moving', 'is-blocked', 'move-left', 'move-right', 'move-up', 'move-down');
    requestAnimationFrame(() => boardElement.classList.add('is-blocked', `move-${direction}`));
    window.setTimeout(() => {
      boardElement.classList.remove('is-blocked', `move-${direction}`);
      inputLocked = false;
      undoButton.disabled = !previousState;
    }, 235);
  }

  function bumpScore(element) {
    if (reducedMotion) return;
    element.classList.remove('score-bump');
    requestAnimationFrame(() => element.classList.add('score-bump'));
    window.setTimeout(() => element.classList.remove('score-bump'), 360);
  }

  function showScoreGain(gained) {
    if (!scoreChip || reducedMotion) return;
    const gain = document.createElement('span');
    gain.className = 'score-gain';
    gain.textContent = `+${formatNumber(gained)}`;
    scoreChip.append(gain);
    window.setTimeout(() => gain.remove(), 760);
  }

  function updateBest() {
    if (score <= bestScore) return false;
    bestScore = score;
    bestElement.textContent = formatNumber(bestScore);
    try {
      localStorage.setItem(bestKey, String(bestScore));
    } catch (_) {}
    return true;
  }

  function canMove() {
    if (availableCells().length) return true;

    for (let row = 0; row < size; row += 1) {
      for (let column = 0; column < size; column += 1) {
        const value = board[row][column];
        if (board[row]?.[column + 1] === value || board[row + 1]?.[column] === value) return true;
      }
    }
    return false;
  }

  function checkGameState() {
    const reached2048 = board.some((row) => row.some((value) => value >= 2048));
    if (reached2048 && !winShown) {
      winShown = true;
      showMessage('You reached 2048', 'Keep playing for a higher score or begin a new board.', true);
      return;
    }

    if (!canMove()) {
      showMessage('No moves left', `Final score: ${formatNumber(score)}. Start a new game to try again.`, false);
    }
  }

  function render({ mergedCells = [], newCells = [] } = {}) {
    const mergedSet = new Set(mergedCells);
    const newSet = new Set(newCells.map(({ row, column }) => cellKey(row, column)));
    const fragment = document.createDocumentFragment();

    board.forEach((row, rowIndex) => {
      row.forEach((value, columnIndex) => {
        const key = cellKey(rowIndex, columnIndex);
        const tile = document.createElement('div');
        tile.className = 'tile-2048';
        tile.setAttribute('role', 'gridcell');
        tile.dataset.value = value ? String(value) : '0';
        if (value > 2048) tile.dataset.large = 'true';
        if (mergedSet.has(key)) tile.classList.add('is-merged');
        else if (newSet.has(key)) tile.classList.add('is-new');
        tile.textContent = value ? String(value) : '';
        tile.setAttribute('aria-label', value ? String(value) : 'Empty tile');
        fragment.append(tile);
      });
    });

    boardElement.replaceChildren(fragment);
    scoreElement.textContent = formatNumber(score);
    bestElement.textContent = formatNumber(bestScore);
    undoButton.disabled = !previousState || inputLocked;
  }

  function showMessage(title, text, allowContinue) {
    messageTitle.textContent = title;
    messageText.textContent = text;
    continueButton.hidden = !allowContinue;
    message.classList.remove('hidden');
  }

  function hideMessage() {
    message.classList.add('hidden');
  }

  function undo() {
    if (!previousState || inputLocked) return;
    board = cloneBoard(previousState.board);
    score = previousState.score;
    previousState = null;
    hideMessage();
    render();

    if (reducedMotion) return;
    boardElement.classList.remove('is-undoing');
    requestAnimationFrame(() => boardElement.classList.add('is-undoing'));
    window.setTimeout(() => boardElement.classList.remove('is-undoing'), 300);
  }

  function directionFromKey(key) {
    const map = {
      ArrowUp: 'up', w: 'up', W: 'up',
      ArrowDown: 'down', s: 'down', S: 'down',
      ArrowLeft: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', d: 'right', D: 'right'
    };
    return map[key] || null;
  }

  window.addEventListener('keydown', (event) => {
    const direction = directionFromKey(event.key);
    if (!direction) return;
    event.preventDefault();
    move(direction);
  });

  document.querySelectorAll('[data-direction]').forEach((button) => {
    button.addEventListener('click', () => move(button.dataset.direction));
  });

  boardElement.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });

  boardElement.addEventListener('touchend', (event) => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    touchStart = null;

    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 28) return;
    move(Math.abs(deltaX) > Math.abs(deltaY)
      ? (deltaX > 0 ? 'right' : 'left')
      : (deltaY > 0 ? 'down' : 'up'));
  }, { passive: true });

  newGameButton.addEventListener('click', startNewGame);
  overlayRestartButton.addEventListener('click', startNewGame);
  continueButton.addEventListener('click', hideMessage);
  undoButton.addEventListener('click', undo);

  startNewGame();
})();
