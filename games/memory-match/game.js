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
    { key: 'blue', label: 'Blue globe', src: '../../assets/images/memory/optimized/blue-256.webp' },
    { key: 'diamond', label: 'Diamond CloudLab globe', src: '../../assets/images/memory/optimized/cldiamond-256.webp' },
    { key: 'gold', label: 'Gold CloudLab globe', src: '../../assets/images/memory/optimized/clgold-256.webp' },
    { key: 'green', label: 'Green globe', src: '../../assets/images/memory/optimized/green-256.webp' },
    { key: 'grey', label: 'Gray globe', src: '../../assets/images/memory/optimized/grey-256.webp' },
    { key: 'light-blue', label: 'Light blue globe', src: '../../assets/images/memory/optimized/light_blue-256.webp' },
    { key: 'mint-green', label: 'Mint green globe', src: '../../assets/images/memory/optimized/mint_gream-256.webp' },
    { key: 'purple', label: 'Purple globe', src: '../../assets/images/memory/optimized/purple-256.webp' },
    { key: 'red', label: 'Red globe', src: '../../assets/images/memory/optimized/red-256.webp' },
    { key: 'yellow', label: 'Yellow globe', src: '../../assets/images/memory/optimized/yellow-256.webp' }
  ];

  const bestKey = 'cloudlab-memory-image-best';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  function preloadImages() {
    images.forEach(({ src }) => {
      const image = new Image();
      image.decoding = 'async';
      image.src = src;
    });
  }

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  function formatTime(seconds) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function bumpStat(element) {
    if (reducedMotion) return;
    element.classList.remove('stat-bump');
    requestAnimationFrame(() => element.classList.add('stat-bump'));
    window.setTimeout(() => element.classList.remove('stat-bump'), 320);
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
    button.style.setProperty('--card-index', String(index));
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
    image.decoding = 'async';
    image.loading = 'eager';
    image.addEventListener('error', () => button.classList.add('image-error'), { once: true });
    back.append(image);

    inner.append(front, back);
    button.append(inner);
    button.addEventListener('click', () => chooseCard(button));
    return button;
  }

  function restartDealAnimation() {
    board.classList.remove('is-dealing', 'is-peeking');
    if (reducedMotion) return;
    requestAnimationFrame(() => {
      board.classList.add('is-dealing');
      window.setTimeout(() => board.classList.remove('is-dealing'), 980);
    });
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

    const pairs = shuffle(images.flatMap((image) => [{ ...image }, { ...image }]));
    const fragment = document.createDocumentFragment();
    pairs.forEach((image, index) => fragment.append(buildCard(image, index)));
    board.replaceChildren(fragment);
    updateStats();
    restartDealAnimation();
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
    bumpStat(movesEl);

    if (firstCard.dataset.key === secondCard.dataset.key) matchCards();
    else hideMismatch();
  }

  function matchCards() {
    const matched = [firstCard, secondCard];
    matched.forEach((card) => {
      card.classList.add('is-matched', 'just-matched');
      card.disabled = true;
      card.setAttribute('aria-label', `Matched card: ${card.dataset.label}`);
    });

    matchedPairs += 1;
    firstCard = null;
    secondCard = null;

    if ('vibrate' in navigator) navigator.vibrate(12);
    window.setTimeout(() => matched.forEach((card) => card.classList.remove('just-matched')), 620);

    if (matchedPairs === images.length) {
      locked = true;
      const activeRound = roundId;
      window.setTimeout(() => {
        if (activeRound === roundId) finishGame();
      }, reducedMotion ? 0 : 430);
    }
  }

  function hideMismatch() {
    locked = true;
    const activeRound = roundId;

    window.setTimeout(() => {
      if (activeRound !== roundId) return;
      firstCard?.classList.remove('is-flipped');
      secondCard?.classList.remove('is-flipped');
      firstCard?.setAttribute('aria-label', 'Hidden card');
      secondCard?.setAttribute('aria-label', 'Hidden card');
      firstCard = null;
      secondCard = null;
      locked = false;
    }, 700);
  }

  function finishGame() {
    stopTimer();
    locked = false;

    const isNewBest = !best || moves < best.moves || (moves === best.moves && elapsedSeconds < best.time);
    if (isNewBest) {
      best = { moves, time: elapsedSeconds };
      saveBest();
      bumpStat(bestEl);
    }

    updateStats();
    completionText.textContent = `${isNewBest ? 'New best! ' : ''}Matched all 10 designs in ${moves} moves and ${formatTime(elapsedSeconds)}.`;
    message.classList.remove('hidden');
  }

  function quickPeek() {
    if (locked || matchedPairs === images.length) return;

    const activeRound = roundId;
    locked = true;
    peekButton.disabled = true;
    board.classList.add('is-peeking');
    const unmatched = [...board.querySelectorAll('.memory-card:not(.is-matched)')];
    unmatched.forEach((card) => card.classList.add('is-flipped'));

    window.setTimeout(() => {
      if (activeRound !== roundId) return;
      unmatched.forEach((card) => {
        if (card !== firstCard && card !== secondCard) card.classList.remove('is-flipped');
      });
      board.classList.remove('is-peeking');
      locked = false;
    }, 1150);
  }

  preloadImages();
  newGameButton.addEventListener('click', newGame);
  playAgainButton.addEventListener('click', newGame);
  peekButton.addEventListener('click', quickPeek);
  newGame();
})();
