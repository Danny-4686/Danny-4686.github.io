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
  const tileSize = canvas.width / gridSize;
  const storageKey = 'cloudlab-snake-best';
  const appleImage = new Image();
  appleImage.decoding = 'async';
  appleImage.src = '../../assets/images/memory/apple.png';

  let snake = [];
  let food = { x: 17, y: 10 };
  let direction = { x: 1, y: 0 };
  let queuedDirection = { x: 1, y: 0 };
  let score = 0;
  let bestScore = Number.parseInt(localStorage.getItem(storageKey) || '0', 10);
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
    queuedDirection = { x: 1, y: 0 };
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
    }
  }

  function endGame() {
    state = 'over';
    if (score > bestScore) {
      bestScore = score;
      bestElement.textContent = String(bestScore);
      try { localStorage.setItem(storageKey, String(bestScore)); } catch (_) {}
    }
    showMessage('Game Over', `You scored ${score}. Press Restart or choose a direction to play again.`);
    startButton.textContent = 'Start Game';
    pauseButton.textContent = 'Pause';
  }

  function placeFood() {
    let candidate;
    do {
      candidate = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize)
      };
    } while (snake.some((segment) => segment.x === candidate.x && segment.y === candidate.y));
    food = candidate;
  }

  function moveSnake() {
    direction = queuedDirection;
    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y
    };

    const hitWall = head.x < 0 || head.y < 0 || head.x >= gridSize || head.y >= gridSize;
    const hitSelf = snake.some((segment) => segment.x === head.x && segment.y === head.y);
    if (hitWall || hitSelf) {
      endGame();
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 1;
      scoreElement.textContent = String(score);
      createFoodParticles(food.x, food.y);
      placeFood();
    } else {
      snake.pop();
    }
  }

  function setDirection(nextDirection) {
    const opposite = nextDirection.x === -direction.x && nextDirection.y === -direction.y;
    if (opposite) return;

    queuedDirection = nextDirection;
    if (state === 'idle' || state === 'over') startGame();
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

  function drawBoard() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    const background = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    background.addColorStop(0, '#09212a');
    background.addColorStop(1, '#061217');
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = 'rgba(104, 208, 223, 0.065)';
    context.lineWidth = 1;
    for (let index = 1; index < gridSize; index += 1) {
      const position = index * tileSize;
      context.beginPath();
      context.moveTo(position, 0);
      context.lineTo(position, canvas.height);
      context.stroke();
      context.beginPath();
      context.moveTo(0, position);
      context.lineTo(canvas.width, position);
      context.stroke();
    }
  }

  function drawFood(time) {
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

  function render(time) {
    const speed = Number.parseInt(difficulty.value, 10) || 105;
    if (state === 'running' && time - lastMoveAt >= speed) {
      moveSnake();
      lastMoveAt = time;
    }

    updateParticles();
    drawBoard();
    drawFood(time);
    drawSnake();
    drawParticles();
    requestAnimationFrame(render);
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

  window.addEventListener('keydown', (event) => {
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
  });

  difficulty.addEventListener('change', () => {
    if (state === 'running') lastMoveAt = performance.now();
  });

  resetGame();
  requestAnimationFrame(render);
})();