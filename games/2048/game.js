(() => {
  const boardElement = document.getElementById('board');
  if (!boardElement) return;

  const scoreElement = document.getElementById('score');
  const bestElement = document.getElementById('bestScore');
  const message = document.getElementById('gameMessage');
  const messageTitle = document.getElementById('messageTitle');
  const messageText = document.getElementById('messageText');
  const continueButton = document.getElementById('continueButton');
  const newGameButton = document.getElementById('newGameButton');
  const overlayRestartButton = document.getElementById('overlayRestartButton');
  const undoButton = document.getElementById('undoButton');

  const size = 4;
  const bestKey = 'cloudlab-2048-best';
  let board = [];
  let score = 0;
  let bestScore = Number.parseInt(localStorage.getItem(bestKey) || '0', 10);
  let previousState = null;
  let winShown = false;
  let touchStart = null;

  bestElement.textContent = String(bestScore);

  function emptyBoard() {
    return Array.from({ length: size }, () => Array(size).fill(0));
  }

  function cloneBoard(source = board) {
    return source.map((row) => [...row]);
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
    if (!cells.length) return;
    const target = cells[Math.floor(Math.random() * cells.length)];
    board[target.row][target.column] = Math.random() < 0.9 ? 2 : 4;
  }

  function startNewGame() {
    board = emptyBoard();
    score = 0;
    previousState = null;
    winShown = false;
    addRandomTile();
    addRandomTile();
    hideMessage();
    render();
  }

  function slideLine(line) {
    const values = line.filter((value) => value !== 0);
    const merged = [];
    let gained = 0;

    for (let index = 0; index < values.length; index += 1) {
      if (values[index] === values[index + 1]) {
        const combined = values[index] * 2;
        merged.push(combined);
        gained += combined;
        index += 1;
      } else {
        merged.push(values[index]);
      }
    }

    while (merged.length < size) merged.push(0);
    return { line: merged, gained };
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
    const before = cloneBoard();
    const scoreBefore = score;
    let gained = 0;

    if (direction === 'left' || direction === 'right') {
      board = board.map((row) => {
        const input = direction === 'right' ? [...row].reverse() : [...row];
        const result = slideLine(input);
        gained += result.gained;
        return direction === 'right' ? result.line.reverse() : result.line;
      });
    } else {
      for (let column = 0; column < size; column += 1) {
        const source = getColumn(column);
        const input = direction === 'down' ? source.reverse() : source;
        const result = slideLine(input);
        gained += result.gained;
        setColumn(column, direction === 'down' ? result.line.reverse() : result.line);
      }
    }

    const changed = JSON.stringify(before) !== JSON.stringify(board);
    if (!changed) return;

    previousState = { board: before, score: scoreBefore };
    score += gained;
    addRandomTile();
    updateBest();
    render();
    checkGameState();
  }

  function updateBest() {
    if (score <= bestScore) return;
    bestScore = score;
    bestElement.textContent = String(bestScore);
    try { localStorage.setItem(bestKey, String(bestScore)); } catch (_) {}
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
      showMessage('No moves left', `Final score: ${score}. Start a new game to try again.`, false);
    }
  }

  function render() {
    boardElement.replaceChildren();
    board.flat().forEach((value) => {
      const tile = document.createElement('div');
      tile.className = 'tile-2048';
      tile.setAttribute('role', 'gridcell');
      tile.dataset.value = value ? String(value) : '0';
      if (value > 2048) tile.dataset.large = 'true';
      tile.textContent = value ? String(value) : '';
      tile.setAttribute('aria-label', value ? String(value) : 'Empty tile');
      boardElement.append(tile);
    });

    scoreElement.textContent = String(score);
    bestElement.textContent = String(bestScore);
    undoButton.disabled = !previousState;
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
    if (!previousState) return;
    board = cloneBoard(previousState.board);
    score = previousState.score;
    previousState = null;
    hideMessage();
    render();
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
