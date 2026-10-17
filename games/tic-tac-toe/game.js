(() => {
  const cells = [...document.querySelectorAll('[data-cell]')];
  if (!cells.length) return;

  const status = document.getElementById('status');
  const mode = document.getElementById('mode');
  const difficulty = document.getElementById('difficulty');
  const xLabel = document.getElementById('xLabel');
  const oLabel = document.getElementById('oLabel');
  const newRoundButton = document.getElementById('newRoundButton');
  const resetStatsButton = document.getElementById('resetStatsButton');
  const xWinsEl = document.getElementById('xWins');
  const oWinsEl = document.getElementById('oWins');
  const drawsEl = document.getElementById('draws');
  const legacyStorageKey = 'cloudlab-tic-tac-toe-stats';
  const storageKey = 'cloudlab-tic-tac-toe-stats-v2';
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
  // Mode/difficulty are locked in per round; select changes made mid-round wait for the next one.
  let activeMode = mode.value;
  let activeDifficulty = difficulty.value;
  let cpuStarts = false;
  let stats = loadStats();

  function cleanStats(value) {
    const output = { x: 0, o: 0, draws: 0 };
    Object.keys(output).forEach((key) => {
      const number = Number(value?.[key]);
      output[key] = Number.isSafeInteger(number) && number >= 0 ? number : 0;
    });
    return output;
  }

  // Separate tallies per mode; the old single tally (default mode was vs computer) seeds the computer one.
  function loadStats() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved) return { computer: cleanStats(saved.computer), local: cleanStats(saved.local) };
      const legacy = JSON.parse(localStorage.getItem(legacyStorageKey) || 'null');
      return { computer: cleanStats(legacy), local: cleanStats(null) };
    } catch (_) {
      return { computer: cleanStats(null), local: cleanStats(null) };
    }
  }

  function saveStats() {
    try { localStorage.setItem(storageKey, JSON.stringify(stats)); } catch (_) {}
  }

  function renderStats() {
    const tally = stats[activeMode];
    xLabel.textContent = activeMode === 'computer' ? 'YOU' : 'X WINS';
    oLabel.textContent = activeMode === 'computer' ? 'CPU' : 'O WINS';
    xWinsEl.dataset.mode = activeMode;
    xWinsEl.textContent = String(tally.x);
    oWinsEl.textContent = String(tally.o);
    drawsEl.textContent = String(tally.draws);
  }

  // Only the human's own moves make a round worth protecting; a lone CPU opener can be replayed.
  function roundInProgress() {
    return !over && board.includes('X');
  }

  function pendingNote() {
    const changed = mode.value !== activeMode || (mode.value === 'computer' && difficulty.value !== activeDifficulty);
    if (!changed) return '';
    const label = mode.value === 'computer' ? `${difficulty.selectedOptions[0].textContent} vs Computer` : 'Two Players';
    return ` · ${label} starts next round`;
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
    const tally = stats[activeMode];
    const vsComputer = activeMode === 'computer';
    if (result.winner === 'draw') {
      tally.draws += 1;
      status.textContent = 'Draw. Nobody takes the round.';
    } else {
      tally[result.winner.toLowerCase()] += 1;
      status.textContent = vsComputer
        ? (result.winner === 'X' ? 'You win the round!' : 'The computer wins the round.')
        : `${result.winner} wins the round.`;
      result.combo.forEach((index) => cells[index].classList.add('win'));
    }
    if (vsComputer) {
      cpuStarts = !cpuStarts;
      if (mode.value === 'computer') status.textContent += cpuStarts ? ' Computer starts next.' : ' You start next.';
    }
    status.textContent += pendingNote();
    saveStats();
    renderStats();
    cells.forEach((cell) => { cell.disabled = true; });
  }

  function updateStatus() {
    if (over) return;
    let text;
    if (activeMode === 'computer') {
      text = current === 'X' ? 'Your turn as X' : board.some(Boolean) ? 'Computer is thinking...' : 'Computer starts this round...';
    } else {
      text = `${current}'s turn`;
    }
    status.textContent = text + pendingNote();
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

  function openCells() {
    return board.map((value, index) => value ? null : index).filter((value) => value !== null);
  }

  function findCompletingMove(mark) {
    return openCells().find((index) => {
      board[index] = mark;
      const won = evaluate(board)?.winner === mark;
      board[index] = '';
      return won;
    });
  }

  // Easy: mostly random. Normal: wins and usually blocks, but sometimes misplays. Hard: perfect minimax.
  function chooseCpuMove() {
    const available = openCells();
    const randomMove = () => available[Math.floor(Math.random() * available.length)];
    if (activeDifficulty === 'easy') {
      const win = findCompletingMove('O');
      if (win !== undefined && Math.random() < .5) return win;
      return Math.random() < .85 ? randomMove() : bestCpuMove();
    }
    if (activeDifficulty === 'normal') {
      const win = findCompletingMove('O');
      if (win !== undefined) return win;
      const block = findCompletingMove('X');
      if (block !== undefined && Math.random() < .85) return block;
      return Math.random() < .3 ? randomMove() : bestCpuMove();
    }
    return bestCpuMove();
  }

  function bestCpuMove() {
    const available = openCells();
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
    if (activeMode !== 'computer' || current !== 'O' || over) return;
    cpuThinking = true;
    cells.forEach((cell, index) => { cell.disabled = Boolean(board[index]) || cpuThinking; });
    updateStatus();

    const scheduledRound = roundId;
    window.clearTimeout(cpuTimer);
    cpuTimer = window.setTimeout(() => {
      if (scheduledRound !== roundId || activeMode !== 'computer' || current !== 'O' || over) return;
      const move = chooseCpuMove();
      cpuThinking = false;
      if (move !== undefined) place(move, 'O');
      cells.forEach((cell, index) => { cell.disabled = Boolean(board[index]) || over; });
    }, board.some(Boolean) ? 360 : 520);
  }

  function newRound() {
    window.clearTimeout(cpuTimer);
    cpuTimer = null;
    roundId += 1;
    activeMode = mode.value;
    activeDifficulty = difficulty.value;
    difficulty.disabled = activeMode !== 'computer';
    board = Array(9).fill('');
    current = activeMode === 'computer' && cpuStarts ? 'O' : 'X';
    over = false;
    cpuThinking = false;
    cells.forEach((cell) => {
      cell.textContent = '';
      cell.disabled = false;
      cell.className = '';
    });
    renderStats();
    updateStatus();
    if (current === 'O') cpuTurn();
  }

  cells.forEach((cell) => {
    cell.addEventListener('click', () => {
      if (cpuThinking || over) return;
      const index = Number(cell.dataset.cell);
      const mark = activeMode === 'computer' ? 'X' : current;
      if (place(index, mark) && activeMode === 'computer' && !over) cpuTurn();
    });
  });

  // Apply straight away between rounds; a round in progress finishes under its original settings.
  function settingsChanged() {
    difficulty.disabled = mode.value !== 'computer';
    if (roundInProgress()) updateStatus();
    else newRound();
  }

  mode.addEventListener('change', settingsChanged);
  difficulty.addEventListener('change', settingsChanged);
  newRoundButton.addEventListener('click', newRound);
  resetStatsButton.addEventListener('click', () => {
    stats[activeMode] = cleanStats(null);
    saveStats();
    renderStats();
    newRound();
  });

  renderStats();
  newRound();
})();
