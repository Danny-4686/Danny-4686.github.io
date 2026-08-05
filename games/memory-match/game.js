(() => {
  const board = document.getElementById('memoryBoard');
  if (!board) return;

  const movesEl = document.getElementById('moves');
  const timeEl = document.getElementById('time');
  const bestEl = document.getElementById('best');
  const message = document.getElementById('gameMessage');
  const completionText = document.getElementById('completionText');
  const newGameButton = document.getElementById('newGameButton');
  const playAgainButton = document.getElementById('playAgainButton');
  const peekButton = document.getElementById('peekButton');

  const spriteUrl = '../../assets/images/memory/memory-sprites.png?v=6';
  const images = [
    { key: 'cyan', label: 'Cyan globe', column: 0, row: 0 },
    { key: 'gray', label: 'Gray globe', column: 1, row: 0 },
    { key: 'lime', label: 'Lime globe', column: 2, row: 0 },
    { key: 'blue', label: 'Blue globe', column: 3, row: 0 },
    { key: 'red', label: 'Red globe', column: 4, row: 0 },
    { key: 'purple', label: 'Purple globe', column: 0, row: 1 },
    { key: 'earth', label: 'Multicolor globe', column: 1, row: 1 },
    { key: 'mint', label: 'Mint globe', column: 2, row: 1 },
    { key: 'gloss-cyan', label: 'Glossy cyan globe', column: 3, row: 1 },
    { key: 'gloss-gold', label: 'Glossy gold globe', column: 4, row: 1 }
  ];

  const bestKey = 'cloudlab-memory-image-best';
  let firstCard = null;
  let secondCard = null;
  let moves = 0;
  let matchedPairs = 0;
  let locked = false;
  let startedAt = null;
  let elapsedSeconds = 0;
  let timer = null;
  let roundId = 0;
  let best = loadBest();

  function loadBest() {
    try {
      const saved = JSON.parse(localStorage.getItem(bestKey) || 'null');
      return saved && Number.isFinite(saved.moves) && Number.isFinite(saved.time) ? saved : null;
    } catch (_) {
      return null;
    }
  }

  function saveBest() {
    try { localStorage.setItem(bestKey, JSON.stringify(best)); } catch (_) {}
  }

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function formatTime(seconds) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function updateStats() {
    movesEl.textContent = String(moves);
    timeEl.textContent = formatTime(elapsedSeconds);
    bestEl.textContent = best ? `${best.moves} / ${formatTime(best.time)}` : '--';
  }

  function startTimer() {
    if (startedAt !== null) return;
    startedAt = Date.now() - elapsedSeconds * 1000;
    timer = window.setInterval(() => {
      elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      timeEl.textContent = formatTime(elapsedSeconds);
    }, 250);
  }

  function stopTimer() {
    window.clearInterval(timer);
    timer = null;
  }

  function createArtwork(data) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('memory-card-image');
    svg.setAttribute('viewBox', `${data.column * 96} ${data.row * 96} 96 96`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');

    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    image.setAttribute('href', spriteUrl);
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', spriteUrl);
    image.setAttribute('x', '0');
    image.setAttribute('y', '0');
    image.setAttribute('width', '480');
    image.setAttribute('height', '192');
    svg.append(image);
    return svg;
  }

  function buildCard(data, index) {
    const button = document.createElement('button');
    button.className = 'memory-card';
    button.type = 'button';
    button.dataset.key = data.key;
    button.dataset.label = data.label;
    button.setAttribute('aria-label', `Hidden card ${index + 1}`);

    const inner = document.createElement('span');
    inner.className = 'memory-card-inner';

    const front = document.createElement('span');
    front.className = 'memory-card-face memory-card-front';
    front.setAttribute('aria-hidden', 'true');

    const back = document.createElement('span');
    back.className = 'memory-card-face memory-card-back';
    back.setAttribute('aria-hidden', 'true');
    back.append(createArtwork(data));

    inner.append(front, back);
    button.append(inner);
    button.addEventListener('click', () => chooseCard(button));
    return button;
  }

  function newGame() {
    roundId += 1;
    stopTimer();
    firstCard = null;
    secondCard = null;
    moves = 0;
    matchedPairs = 0;
    locked = false;
    startedAt = null;
    elapsedSeconds = 0;
    message.classList.add('hidden');
    peekButton.disabled = false;

    const pairs = images.flatMap((image) => [{ ...image }, { ...image }]);
    board.replaceChildren(...shuffle(pairs).map(buildCard));
    updateStats();
  }

  function chooseCard(card) {
    if (locked || card === firstCard || card.classList.contains('is-matched')) return;
    startTimer();
    card.classList.add('is-flipped');
    card.setAttribute('aria-label', `Revealed card: ${card.dataset.label}`);

    if (!firstCard) {
      firstCard = card;
      return;
    }

    secondCard = card;
    moves += 1;
    movesEl.textContent = String(moves);

    if (firstCard.dataset.key === secondCard.dataset.key) matchCards();
    else hideMismatch();
  }

  function matchCards() {
    firstCard.classList.add('is-matched');
    secondCard.classList.add('is-matched');
    firstCard.disabled = true;
    secondCard.disabled = true;
    matchedPairs += 1;
    firstCard = null;
    secondCard = null;
    if (matchedPairs === images.length) finishGame();
  }

  function hideMismatch() {
    locked = true;
    const activeRound = roundId;
    window.setTimeout(() => {
      if (activeRound !== roundId) return;
      firstCard?.classList.remove('is-flipped');
      secondCard?.classList.remove('is-flipped');
      firstCard = null;
      secondCard = null;
      locked = false;
    }, 760);
  }

  function finishGame() {
    stopTimer();
    if (!best || moves < best.moves || (moves === best.moves && elapsedSeconds < best.time)) {
      best = { moves, time: elapsedSeconds };
      saveBest();
    }
    updateStats();
    completionText.textContent = `Matched all 10 designs in ${moves} moves and ${formatTime(elapsedSeconds)}.`;
    message.classList.remove('hidden');
  }

  function quickPeek() {
    if (locked || matchedPairs === images.length) return;
    const activeRound = roundId;
    locked = true;
    peekButton.disabled = true;
    const unmatched = [...board.querySelectorAll('.memory-card:not(.is-matched)')];
    unmatched.forEach((card) => card.classList.add('is-flipped'));

    window.setTimeout(() => {
      if (activeRound !== roundId) return;
      unmatched.forEach((card) => {
        if (card !== firstCard && card !== secondCard) card.classList.remove('is-flipped');
      });
      locked = false;
    }, 1100);
  }

  const preload = new Image();
  preload.src = spriteUrl;
  newGameButton.addEventListener('click', newGame);
  playAgainButton.addEventListener('click', newGame);
  peekButton.addEventListener('click', quickPeek);
  newGame();
})();