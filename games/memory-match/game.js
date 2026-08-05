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

  const images = [
    { key: 'blue', label: 'Blue globe', src: '../../assets/images/memory/blue.png' },
    { key: 'diamond', label: 'Diamond CloudLab globe', src: '../../assets/images/memory/cldiamond.png' },
    { key: 'gold', label: 'Gold CloudLab globe', src: '../../assets/images/memory/clgold.png' },
    { key: 'green', label: 'Green globe', src: '../../assets/images/memory/green.png' },
    { key: 'grey', label: 'Gray globe', src: '../../assets/images/memory/grey.png' },
    { key: 'light-blue', label: 'Light blue globe', src: '../../assets/images/memory/light_blue.png' },
    { key: 'mint-green', label: 'Mint green globe', src: '../../assets/images/memory/mint_gream.png' },
    { key: 'purple', label: 'Purple globe', src: '../../assets/images/memory/purple.png' },
    { key: 'red', label: 'Red globe', src: '../../assets/images/memory/red.png' },
    { key: 'yellow', label: 'Yellow globe', src: '../../assets/images/memory/yellow.png' }
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
    try {
      localStorage.setItem(bestKey, JSON.stringify(best));
    } catch (_) {}
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

    const image = document.createElement('img');
    image.className = 'memory-card-image';
    image.src = data.src;
    image.alt = '';
    image.draggable = false;
    back.append(image);

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

  newGameButton.addEventListener('click', newGame);
  playAgainButton.addEventListener('click', newGame);
  peekButton.addEventListener('click', quickPeek);
  newGame();
})();