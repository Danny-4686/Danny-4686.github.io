(() => {
  const boardElement = document.getElementById('memoryBoard');
  if (!boardElement) return;

  const movesElement = document.getElementById('moves');
  const timeElement = document.getElementById('time');
  const bestElement = document.getElementById('best');
  const message = document.getElementById('gameMessage');
  const completionText = document.getElementById('completionText');
  const newGameButton = document.getElementById('newGameButton');
  const playAgainButton = document.getElementById('playAgainButton');
  const peekButton = document.getElementById('peekButton');

  const images = [
    { key: 'cyan', label: 'Cyan globe', src: '../../assets/images/memory/cyan.svg' },
    { key: 'gray', label: 'Gray globe', src: '../../assets/images/memory/gray.svg' },
    { key: 'lime', label: 'Lime globe', src: '../../assets/images/memory/lime.svg' },
    { key: 'blue', label: 'Blue globe', src: '../../assets/images/memory/blue.svg' },
    { key: 'red', label: 'Red globe', src: '../../assets/images/memory/red.svg' },
    { key: 'purple', label: 'Purple globe', src: '../../assets/images/memory/purple.svg' },
    { key: 'earth', label: 'Multicolor globe', src: '../../assets/images/memory/earth.svg' },
    { key: 'mint', label: 'Mint globe', src: '../../assets/images/memory/mint.svg' },
    { key: 'gloss-cyan', label: 'Glossy cyan globe', src: '../../assets/images/memory/gloss-cyan.svg' },
    { key: 'gloss-gold', label: 'Glossy gold globe', src: '../../assets/images/memory/gloss-gold.svg' }
  ];

  const bestKey = 'cloudlab-memory-image-best';
  let cards = [];
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
      if (saved && Number.isFinite(saved.moves) && Number.isFinite(saved.time)) return saved;
    } catch (_) {}
    return null;
  }

  function saveBest() {
    try { localStorage.setItem(bestKey, JSON.stringify(best)); } catch (_) {}
  }

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  function updateStats() {
    movesElement.textContent = String(moves);
    timeElement.textContent = formatTime(elapsedSeconds);
    bestElement.textContent = best ? `${best.moves} / ${formatTime(best.time)}` : '--';
  }

  function startTimer() {
    if (startedAt !== null) return;
    startedAt = Date.now() - elapsedSeconds * 1000;
    timer = window.setInterval(() => {
      elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      timeElement.textContent = formatTime(elapsedSeconds);
    }, 250);
  }

  function stopTimer() {
    window.clearInterval(timer);
    timer = null;
  }

  function buildCard(cardData, index) {
    const button = document.createElement('button');
    button.className = 'memory-card';
    button.type = 'button';
    button.dataset.id = cardData.id;
    button.dataset.key = cardData.key;
    button.dataset.label = cardData.label;
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
    image.src = cardData.src;
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

    const pairs = images.flatMap((image) => [
      { ...image, id: `${image.key}-a` },
      { ...image, id: `${image.key}-b` }
    ]);

    cards = shuffle(pairs);
    boardElement.replaceChildren(...cards.map(buildCard));
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
    movesElement.textContent = String(moves);

    if (firstCard.dataset.key === secondCard.dataset.key) {
      matchCards();
    } else {
      hideMismatchedCards();
    }
  }

  function matchCards() {
    firstCard.classList.add('is-matched');
    secondCard.classList.add('is-matched');
    firstCard.disabled = true;
    secondCard.disabled = true;
    firstCard.setAttribute('aria-label', `Matched card: ${firstCard.dataset.label}`);
    secondCard.setAttribute('aria-label', `Matched card: ${secondCard.dataset.label}`);
    matchedPairs += 1;
    clearSelection();

    if (matchedPairs === images.length) finishGame();
  }

  function hideMismatchedCards() {
    locked = true;
    const activeRound = roundId;
    window.setTimeout(() => {
      if (activeRound !== roundId) return;
      firstCard?.classList.remove('is-flipped');
      secondCard?.classList.remove('is-flipped');
      if (firstCard) firstCard.setAttribute('aria-label', 'Hidden card');
      if (secondCard) secondCard.setAttribute('aria-label', 'Hidden card');
      clearSelection();
      locked = false;
    }, 760);
  }

  function clearSelection() {
    firstCard = null;
    secondCard = null;
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
    const unmatched = [...boardElement.querySelectorAll('.memory-card:not(.is-matched)')];
    unmatched.forEach((card) => card.classList.add('is-flipped'));

    window.setTimeout(() => {
      if (activeRound !== roundId) return;
      unmatched.forEach((card) => {
        if (card !== firstCard && card !== secondCard) card.classList.remove('is-flipped');
      });
      locked = false;
    }, 1100);
  }

  images.forEach((imageData) => {
    const image = new Image();
    image.src = imageData.src;
  });

  newGameButton.addEventListener('click', newGame);
  playAgainButton.addEventListener('click', newGame);
  peekButton.addEventListener('click', quickPeek);

  newGame();
})();
