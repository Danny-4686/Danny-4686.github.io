(() => {
  const canvas = document.getElementById('snakeCanvas');
  if (!canvas) return;

  const context = canvas.getContext('2d');
  const scoreElement = document.getElementById('score');
  const bestElement = document.getElementById('bestScore');
  const message = document.getElementById('gameMessage');
  const messageTitle = document.getElementById('messageTitle');
  const messageText = document.getElementById('messageText');
  const startButton = document.getElementById('startButton');
  const pauseButton = document.getElementById('pauseButton');
  const restartButton = document.getElementById('restartButton');
  const difficulty = document.getElementById('difficulty');

  const gridSize = 24;
  // Logical board size; the backing store is scaled to the display size and devicePixelRatio in fitCanvas.
  const boardSize = canvas.width;
  const tileSize = boardSize / gridSize;
  const storageKey = 'cloudlab-snake-best';
  const appleImage = new Image();
  appleImage.decoding = 'async';
  appleImage.src = '../../assets/images/memory/optimized/apple-160.webp';
  // The static backdrop (gradient + grid) is drawn once per canvas size instead of every frame.
  const boardLayer = document.createElement('canvas');
  let raf = 0;

  let snake = [];
  let food = { x: 17, y: 10 };
  let direction = { x: 1, y: 0 };
  let inputQueue = [];
  let score = 0;
  let bestScore = 0;
  try {
    const savedBest = Number.parseInt(localStorage.getItem(storageKey) || '0', 10);
    bestScore = Number.isSafeInteger(savedBest) && savedBest >= 0 ? savedBest : 0;
  } catch (_) {}
  let state = 'idle';
  let lastMoveAt = 0;
  let particles = [];
  let touchStart = null;

  bestElement.textContent = String(bestScore);

  function resetGame() {
    snake = [
      { x: 10, y: 12 },
      { x: 9, y: 12 },
      { x: 8, y: 12 },
      { x: 7, y: 12 }
    ];
    direction = { x: 1, y: 0 };
    inputQueue = [];
    score = 0;
    particles = [];
    scoreElement.textContent = '0';
    placeFood();
    lastMoveAt = performance.now();
  }

  function startGame() {
    if (state === 'idle' || state === 'over') resetGame();
    state = 'running';
    hideMessage();
    startButton.textContent = 'Playing';
    pauseButton.textContent = 'Pause';
    lastMoveAt = performance.now();
    wake();
  }

  function togglePause() {
    if (state === 'running') {
      state = 'paused';
      showMessage('Paused', 'Press Space or the Pause button to continue.');
      pauseButton.textContent = 'Resume';
      startButton.textContent = 'Start Game';
    } else if (state === 'paused') {
      state = 'running';
      hideMessage();
      pauseButton.textContent = 'Pause';
      startButton.textContent = 'Playing';
      lastMoveAt = performance.now();
      wake();
    }
  }

  function endGame(won = false) {
    state = 'over';
    if (score > bestScore) {
      bestScore = score;
      bestElement.textContent = String(bestScore);
      try { localStorage.setItem(storageKey, String(bestScore)); } catch (_) {}
    }
    if (won) showMessage('Board Filled!', `Perfect run: you filled every tile and scored ${score}. Press Restart to play again.`);
    else showMessage('Game Over', `You scored ${score}. Press Restart or choose a direction to play again.`);
    startButton.textContent = 'Start Game';
    pauseButton.textContent = 'Pause';
  }

  // Picks from the free tiles directly so a nearly full board never spins; returns false when none are left.
  function placeFood() {
    const occupied = new Set(snake.map((segment) => segment.y * gridSize + segment.x));
    const free = [];
    for (let cell = 0; cell < gridSize * gridSize; cell += 1) if (!occupied.has(cell)) free.push(cell);
    if (!free.length) {
      food = null;
      return false;
    }
    const cell = free[Math.floor(Math.random() * free.length)];
    food = { x: cell % gridSize, y: Math.floor(cell / gridSize) };
    return true;
  }

  function moveSnake() {
    if (inputQueue.length) direction = inputQueue.shift();
    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y
    };

    const hitWall = head.x < 0 || head.y < 0 || head.x >= gridSize || head.y >= gridSize;
    const eating = Boolean(food) && head.x === food.x && head.y === food.y;
    const collisionBody = eating ? snake : snake.slice(0, -1);
    const hitSelf = collisionBody.some((segment) => segment.x === head.x && segment.y === head.y);
    if (hitWall || hitSelf) {
      endGame();
      return;
    }

    snake.unshift(head);

    if (eating) {
      score += 1;
      scoreElement.textContent = String(score);
      createFoodParticles(food.x, food.y);
      if (!placeFood()) endGame(true);
    } else {
      snake.pop();
    }
  }

  // Reset before reading the key so the first press from idle/game over steers the fresh snake, then
  // queue up to two turns per tick, each checked against the turn before it so it can never reverse.
  function setDirection(nextDirection) {
    if (state === 'idle' || state === 'over') startGame();
    const last = inputQueue[inputQueue.length - 1] || direction;
    const same = nextDirection.x === last.x && nextDirection.y === last.y;
    const opposite = nextDirection.x === -last.x && nextDirection.y === -last.y;
    if (same || opposite || inputQueue.length >= 2) return;
    inputQueue.push(nextDirection);
  }

  function createFoodParticles(x, y) {
    const centerX = x * tileSize + tileSize / 2;
    const centerY = y * tileSize + tileSize / 2;
    for (let index = 0; index < 12; index += 1) {
      const angle = (Math.PI * 2 * index) / 12;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * (1.5 + Math.random() * 1.7),
        vy: Math.sin(angle) * (1.5 + Math.random() * 1.7),
        life: 1,
        size: 2 + Math.random() * 3,
        color: index % 3 === 0 ? '#8bcf9b' : '#ef6d68'
      });
    }
  }

  function updateParticles() {
    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.97;
      particle.vy *= 0.97;
      particle.life -= 0.035;
    });
    particles = particles.filter((particle) => particle.life > 0);
  }

  function roundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function paintBoardLayer() {
    boardLayer.width = canvas.width;
    boardLayer.height = canvas.height;
    const layer = boardLayer.getContext('2d');
    layer.setTransform(canvas.width / boardSize, 0, 0, canvas.height / boardSize, 0, 0);
    const background = layer.createLinearGradient(0, 0, boardSize, boardSize);
    background.addColorStop(0, '#09212a');
    background.addColorStop(1, '#061217');
    layer.fillStyle = background;
    layer.fillRect(0, 0, boardSize, boardSize);

    layer.strokeStyle = 'rgba(104, 208, 223, 0.065)';
    layer.lineWidth = 1;
    layer.beginPath();
    for (let index = 1; index < gridSize; index += 1) {
      const position = index * tileSize;
      layer.moveTo(position, 0);
      layer.lineTo(position, boardSize);
      layer.moveTo(0, position);
      layer.lineTo(boardSize, position);
    }
    layer.stroke();
  }

  function drawBoard() {
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.drawImage(boardLayer, 0, 0);
    context.restore();
  }

  function drawFood(time) {
    if (!food) return;
    const pulse = 1 + Math.sin(time / 180) * 0.055;
    const centerX = food.x * tileSize + tileSize / 2;
    const centerY = food.y * tileSize + tileSize / 2;
    const size = tileSize * 0.92 * pulse;
    const x = centerX - size / 2;
    const y = centerY - size / 2;

    context.save();
    context.shadowColor = 'rgba(239, 109, 104, 0.55)';
    context.shadowBlur = 16;

    if (appleImage.complete && appleImage.naturalWidth > 0) {
      context.drawImage(appleImage, x, y, size, size);
    } else {
      const radius = tileSize * 0.31 * pulse;
      const fallback = context.createRadialGradient(centerX - 4, centerY - 5, 2, centerX, centerY, radius);
      fallback.addColorStop(0, '#ffd3d0');
      fallback.addColorStop(0.45, '#ef6d68');
      fallback.addColorStop(1, '#b63f3d');
      context.fillStyle = fallback;
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.fill();
    }

    context.restore();
  }

  function drawSnake() {
    snake.forEach((segment, index) => {
      const gap = 2.8;
      const x = segment.x * tileSize + gap;
      const y = segment.y * tileSize + gap;
      const size = tileSize - gap * 2;
      const gradient = context.createLinearGradient(x, y, x + size, y + size);
      gradient.addColorStop(0, index === 0 ? '#a5eff4' : '#7edce6');
      gradient.addColorStop(1, index === 0 ? '#4fc0d3' : '#45adbf');

      context.save();
      context.shadowColor = 'rgba(72, 186, 208, 0.28)';
      context.shadowBlur = index === 0 ? 14 : 8;
      context.fillStyle = gradient;
      roundedRect(x, y, size, size, 7);
      context.fill();
      context.fillStyle = 'rgba(255,255,255,.25)';
      roundedRect(x + 4, y + 3, size - 8, 4, 3);
      context.fill();
      context.restore();
    });

    if (snake.length) {
      const head = snake[0];
      const baseX = head.x * tileSize;
      const baseY = head.y * tileSize;
      const eyeOffsetX = direction.x === -1 ? 7 : direction.x === 1 ? tileSize - 7 : 8;
      const eyeOffsetY = direction.y === -1 ? 7 : direction.y === 1 ? tileSize - 7 : 8;
      context.fillStyle = '#061117';

      if (direction.x !== 0) {
        context.beginPath();
        context.arc(baseX + eyeOffsetX, baseY + 8, 2.2, 0, Math.PI * 2);
        context.arc(baseX + eyeOffsetX, baseY + tileSize - 8, 2.2, 0, Math.PI * 2);
        context.fill();
      } else {
        context.beginPath();
        context.arc(baseX + 8, baseY + eyeOffsetY, 2.2, 0, Math.PI * 2);
        context.arc(baseX + tileSize - 8, baseY + eyeOffsetY, 2.2, 0, Math.PI * 2);
        context.fill();
      }
    }
  }

  function drawParticles() {
    particles.forEach((particle) => {
      context.save();
      context.globalAlpha = Math.max(0, particle.life);
      context.fillStyle = particle.color;
      context.shadowColor = particle.color;
      context.shadowBlur = 8;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });
  }

  function draw(time) {
    drawBoard();
    drawFood(time);
    drawSnake();
    drawParticles();
  }

  // The loop only runs while the snake moves or food particles are still fading; idle, paused,
  // and game-over boards are drawn once and left alone.
  function render(time) {
    raf = 0;
    const speed = Number.parseInt(difficulty.value, 10) || 105;
    if (state === 'running' && time - lastMoveAt >= speed) {
      moveSnake();
      lastMoveAt = time;
    }

    updateParticles();
    draw(time);
    if (state === 'running' || particles.length) raf = requestAnimationFrame(render);
  }

  function wake() {
    if (!raf) raf = requestAnimationFrame(render);
  }

  function fitCanvas() {
    const cssWidth = canvas.clientWidth || boardSize;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const backing = Math.max(150, Math.round(cssWidth * dpr));
    if (canvas.width !== backing || canvas.height !== backing || boardLayer.width !== backing) {
      canvas.width = backing;
      canvas.height = backing;
      paintBoardLayer();
    }
    context.setTransform(backing / boardSize, 0, 0, backing / boardSize, 0, 0);
    draw(performance.now());
  }

  function showMessage(title, text) {
    messageTitle.textContent = title;
    messageText.textContent = text;
    message.classList.remove('hidden');
  }

  function hideMessage() {
    message.classList.add('hidden');
  }

  const keyDirections = {
    ArrowUp: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    W: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    S: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    A: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    d: { x: 1, y: 0 },
    D: { x: 1, y: 0 }
  };

  // Leave typing, menus, and browser shortcuts alone; Space/Enter still activate a focused button.
  function ignoreKey(event) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return true;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('input, select, textarea, [contenteditable="true"]')) return true;
    return Boolean(target?.closest('a, button')) && (event.key === ' ' || event.key === 'Enter');
  }

  window.addEventListener('keydown', (event) => {
    if (ignoreKey(event)) return;
    if (keyDirections[event.key]) {
      event.preventDefault();
      setDirection(keyDirections[event.key]);
    } else if (event.code === 'Space') {
      event.preventDefault();
      togglePause();
    }
  });

  document.querySelectorAll('[data-direction]').forEach((button) => {
    button.addEventListener('click', () => {
      const directions = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 }
      };
      setDirection(directions[button.dataset.direction]);
    });
  });

  canvas.addEventListener('pointerdown', (event) => {
    touchStart = { x: event.clientX, y: event.clientY };
  });

  canvas.addEventListener('pointerup', (event) => {
    if (!touchStart) return;
    const deltaX = event.clientX - touchStart.x;
    const deltaY = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 18) return;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setDirection(deltaX > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
    } else {
      setDirection(deltaY > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
    }
  });

  startButton.addEventListener('click', startGame);
  pauseButton.addEventListener('click', togglePause);
  restartButton.addEventListener('click', () => {
    resetGame();
    state = 'running';
    hideMessage();
    startButton.textContent = 'Playing';
    pauseButton.textContent = 'Pause';
    wake();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'running') togglePause();
  });

  difficulty.addEventListener('change', () => {
    if (state === 'running') lastMoveAt = performance.now();
  });

  let fitFrame = 0;
  const scheduleFit = () => {
    cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(fitCanvas);
  };
  if (window.ResizeObserver) new ResizeObserver(scheduleFit).observe(canvas);
  window.addEventListener('resize', scheduleFit);
  appleImage.addEventListener('load', () => { if (!raf) draw(performance.now()); });

  resetGame();
  fitCanvas();
})();
