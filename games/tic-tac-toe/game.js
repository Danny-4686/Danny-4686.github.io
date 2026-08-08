(() => {
  const cells = [...document.querySelectorAll('[data-cell]')];
  if (!cells.length) return;

  const status = document.getElementById('status');
  const mode = document.getElementById('mode');
  const newRoundButton = document.getElementById('newRoundButton');
  const resetStatsButton = document.getElementById('resetStatsButton');
  const xWinsEl = document.getElementById('xWins');
  const oWinsEl = document.getElementById('oWins');
  const drawsEl = document.getElementById('draws');
  const storageKey = 'cloudlab-tic-tac-toe-stats';
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  let board = Array(9).fill('');
  let current = 'X';
  let over = false;
  let cpuThinking = false;
  let cpuTimer = null;
  let roundId = 0;
  let stats = loadStats();

  function loadStats() {
    try {
      return { x: 0, o: 0, draws: 0, ...JSON.parse(localStorage.getItem(storageKey) || '{}') };
    } catch (_) {
      return { x: 0, o: 0, draws: 0 };
    }
  }

  function saveStats() {
    try { localStorage.setItem(storageKey, JSON.stringify(stats)); } catch (_) {}
  }

  function renderStats() {
    xWinsEl.textContent = String(stats.x);
    oWinsEl.textContent = String(stats.o);
    drawsEl.textContent = String(stats.draws);
  }

  function evaluate(state) {
    for (const combo of wins) {
      const [a,b,c] = combo;
      if (state[a] && state[a] === state[b] && state[a] === state[c]) {
        return { winner: state[a], combo };
      }
    }
    if (state.every(Boolean)) return { winner: 'draw', combo: [] };
    return null;
  }

  function finish(result) {
    over = true;
    cpuThinking = false;
    if (result.winner === 'draw') {
      stats.draws += 1;
      status.textContent = 'Draw. Nobody takes the round.';
    } else {
      stats[result.winner.toLowerCase()] += 1;
      status.textContent = `${result.winner} wins the round.`;
      result.combo.forEach((index) => cells[index].classList.add('win'));
    }
    saveStats();
    renderStats();
    cells.forEach((cell) => { cell.disabled = true; });
  }

  function updateStatus() {
    if (over) return;
    if (mode.value === 'computer') {
      status.textContent = current === 'X' ? 'Your turn as X' : 'Computer is thinking...';
    } else {
      status.textContent = `${current}'s turn`;
    }
  }

  function place(index, mark) {
    if (board[index] || over) return false;
    board[index] = mark;
    const cell = cells[index];
    cell.textContent = mark;
    cell.classList.add(mark.toLowerCase());
    cell.disabled = true;

    const result = evaluate(board);
    if (result) {
      finish(result);
      return true;
    }

    current = mark === 'X' ? 'O' : 'X';
    updateStatus();
    return true;
  }

  function minimax(state, maximizing, depth = 0) {
    const result = evaluate(state);
    if (result?.winner === 'O') return 10 - depth;
    if (result?.winner === 'X') return depth - 10;
    if (result?.winner === 'draw') return 0;

    if (maximizing) {
      let best = -Infinity;
      state.forEach((value, index) => {
        if (value) return;
        state[index] = 'O';
        best = Math.max(best, minimax(state, false, depth + 1));
        state[index] = '';
      });
      return best;
    }

    let best = Infinity;
    state.forEach((value, index) => {
      if (value) return;
      state[index] = 'X';
      best = Math.min(best, minimax(state, true, depth + 1));
      state[index] = '';
    });
    return best;
  }

  function chooseCpuMove() {
    const available = board.map((value, index) => value ? null : index).filter((value) => value !== null);
    let bestScore = -Infinity;
    let bestMoves = [];

    available.forEach((index) => {
      board[index] = 'O';
      const score = minimax(board, false);
      board[index] = '';
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [index];
      } else if (score === bestScore) {
        bestMoves.push(index);
      }
    });

    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  function cpuTurn() {
    if (mode.value !== 'computer' || current !== 'O' || over) return;
    cpuThinking = true;
    cells.forEach((cell, index) => { cell.disabled = Boolean(board[index]) || cpuThinking; });
    updateStatus();

    const scheduledRound = roundId;
    window.clearTimeout(cpuTimer);
    cpuTimer = window.setTimeout(() => {
      if (scheduledRound !== roundId || mode.value !== 'computer' || current !== 'O' || over) return;
      const move = chooseCpuMove();
      cpuThinking = false;
      if (move !== undefined) place(move, 'O');
      cells.forEach((cell, index) => { cell.disabled = Boolean(board[index]) || over; });
    }, 360);
  }

  function newRound() {
    window.clearTimeout(cpuTimer);
    cpuTimer = null;
    roundId += 1;
    board = Array(9).fill('');
    current = 'X';
    over = false;
    cpuThinking = false;
    cells.forEach((cell) => {
      cell.textContent = '';
      cell.disabled = false;
      cell.className = '';
    });
    updateStatus();
  }

  cells.forEach((cell) => {
    cell.addEventListener('click', () => {
      if (cpuThinking || over) return;
      const index = Number(cell.dataset.cell);
      const mark = mode.value === 'computer' ? 'X' : current;
      if (place(index, mark) && mode.value === 'computer' && !over) cpuTurn();
    });
  });

  mode.addEventListener('change', newRound);
  newRoundButton.addEventListener('click', newRound);
  resetStatsButton.addEventListener('click', () => {
    stats = { x: 0, o: 0, draws: 0 };
    saveStats();
    renderStats();
    newRound();
  });

  renderStats();
  newRound();
})();
