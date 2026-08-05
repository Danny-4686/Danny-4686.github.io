(() => {
  const canvas = document.getElementById('pongCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const playerScoreEl = document.getElementById('playerScore');
  const cpuScoreEl = document.getElementById('cpuScore');
  const bestRallyEl = document.getElementById('bestRally');
  const message = document.getElementById('gameMessage');
  const messageTitle = document.getElementById('messageTitle');
  const messageText = document.getElementById('messageText');
  const startButton = document.getElementById('startButton');
  const pauseButton = document.getElementById('pauseButton');
  const restartButton = document.getElementById('restartButton');
  const difficulty = document.getElementById('difficulty');

  const storageKey = 'cloudlab-pong-best-rally';
  let bestRally = Number.parseInt(localStorage.getItem(storageKey) || '0', 10);
  let state = 'idle';
  let lastTime = performance.now();
  let keys = new Set();
  let pointerActive = false;

  const player = { x: 30, y: 170, width: 16, height: 120, speed: 430 };
  const cpu = { x: canvas.width - 46, y: 170, width: 16, height: 120 };
  const ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 11, vx: 350, vy: 145 };
  let playerScore = 0;
  let cpuScore = 0;
  let rally = 0;

  bestRallyEl.textContent = String(bestRally);

  function resetBall(direction = Math.random() > 0.5 ? 1 : -1) {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    const angle = (Math.random() * 0.7 - 0.35);
    const speed = 360;
    ball.vx = Math.cos(angle) * speed * direction;
    ball.vy = Math.sin(angle) * speed;
    rally = 0;
  }

  function resetMatch() {
    playerScore = 0;
    cpuScore = 0;
    player.y = (canvas.height - player.height) / 2;
    cpu.y = (canvas.height - cpu.height) / 2;
    playerScoreEl.textContent = '0';
    cpuScoreEl.textContent = '0';
    resetBall(1);
  }

  function startMatch() {
    if (state === 'idle' || state === 'over') resetMatch();
    state = 'running';
    hideMessage();
    startButton.textContent = 'Playing';
    pauseButton.textContent = 'Pause';
    lastTime = performance.now();
  }

  function togglePause() {
    if (state === 'running') {
      state = 'paused';
      showMessage('Paused', 'Press Space or the Pause button to continue.');
      pauseButton.textContent = 'Resume';
      startButton.textContent = 'Start Match';
    } else if (state === 'paused') {
      state = 'running';
      hideMessage();
      pauseButton.textContent = 'Pause';
      startButton.textContent = 'Playing';
      lastTime = performance.now();
    }
  }

  function showMessage(title, text) {
    messageTitle.textContent = title;
    messageText.textContent = text;
    message.classList.remove('hidden');
  }

  function hideMessage() {
    message.classList.add('hidden');
  }

  function endMatch(winner) {
    state = 'over';
    showMessage(winner === 'player' ? 'You win!' : 'CPU wins', `Final score: ${playerScore}–${cpuScore}. Start a new match whenever you are ready.`);
    startButton.textContent = 'Start Match';
    pauseButton.textContent = 'Pause';
  }

  function scorePoint(side) {
    if (side === 'player') {
      playerScore += 1;
      playerScoreEl.textContent = String(playerScore);
    } else {
      cpuScore += 1;
      cpuScoreEl.textContent = String(cpuScore);
    }

    if (playerScore >= 7 || cpuScore >= 7) {
      endMatch(playerScore >= 7 ? 'player' : 'cpu');
      return;
    }

    resetBall(side === 'player' ? -1 : 1);
  }

  function clampPaddle(paddle) {
    paddle.y = Math.max(12, Math.min(canvas.height - paddle.height - 12, paddle.y));
  }

  function update(dt) {
    const up = keys.has('arrowup') || keys.has('w');
    const down = keys.has('arrowdown') || keys.has('s');
    if (up) player.y -= player.speed * dt;
    if (down) player.y += player.speed * dt;
    clampPaddle(player);

    const aiStrength = Number.parseFloat(difficulty.value);
    const targetY = ball.y - cpu.height / 2;
    cpu.y += (targetY - cpu.y) * Math.min(1, aiStrength * dt * 60);
    clampPaddle(cpu);

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.y - ball.radius <= 0 && ball.vy < 0) {
      ball.y = ball.radius;
      ball.vy *= -1;
    }
    if (ball.y + ball.radius >= canvas.height && ball.vy > 0) {
      ball.y = canvas.height - ball.radius;
      ball.vy *= -1;
    }

    collideWithPaddle(player, 1);
    collideWithPaddle(cpu, -1);

    if (ball.x + ball.radius < 0) scorePoint('cpu');
    if (ball.x - ball.radius > canvas.width) scorePoint('player');
  }

  function collideWithPaddle(paddle, direction) {
    const touchingX = direction === 1
      ? ball.x - ball.radius <= paddle.x + paddle.width && ball.x > paddle.x
      : ball.x + ball.radius >= paddle.x && ball.x < paddle.x + paddle.width;
    const touchingY = ball.y + ball.radius >= paddle.y && ball.y - ball.radius <= paddle.y + paddle.height;
    const movingToward = direction === 1 ? ball.vx < 0 : ball.vx > 0;

    if (!touchingX || !touchingY || !movingToward) return;

    const offset = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
    const speed = Math.min(760, Math.hypot(ball.vx, ball.vy) * 1.045);
    const angle = offset * 0.9;
    ball.vx = Math.cos(angle) * speed * direction;
    ball.vy = Math.sin(angle) * speed;
    ball.x = direction === 1 ? paddle.x + paddle.width + ball.radius : paddle.x - ball.radius;

    rally += 1;
    if (rally > bestRally) {
      bestRally = rally;
      bestRallyEl.textContent = String(bestRally);
      try { localStorage.setItem(storageKey, String(bestRally)); } catch (_) {}
    }
  }

  function drawRoundedRect(x, y, width, height, radius, fill) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function draw() {
    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, '#0a2430');
    bg.addColorStop(1, '#061117');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(104,208,223,.16)';
    ctx.lineWidth = 4;
    ctx.setLineDash([13, 18]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 20);
    ctx.lineTo(canvas.width / 2, canvas.height - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.shadowColor = 'rgba(104,208,223,.5)';
    ctx.shadowBlur = 18;
    drawRoundedRect(player.x, player.y, player.width, player.height, 8, '#68d0df');
    drawRoundedRect(cpu.x, cpu.y, cpu.width, cpu.height, 8, '#8bcf9b');

    ctx.shadowColor = 'rgba(242,199,92,.8)';
    ctx.shadowBlur = 22;
    const ballGradient = ctx.createRadialGradient(ball.x - 4, ball.y - 5, 2, ball.x, ball.y, ball.radius);
    ballGradient.addColorStop(0, '#fff5bd');
    ballGradient.addColorStop(0.45, '#f2c75c');
    ballGradient.addColorStop(1, '#d59b2b');
    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function frame(time) {
    const dt = Math.min(0.034, (time - lastTime) / 1000 || 0);
    lastTime = time;
    if (state === 'running') update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function movePlayerToPointer(event) {
    const rect = canvas.getBoundingClientRect();
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    player.y = y - player.height / 2;
    clampPaddle(player);
    if (state === 'idle' || state === 'over') startMatch();
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'w', 's', ' '].includes(key)) event.preventDefault();
    if (key === ' ') {
      togglePause();
      return;
    }
    keys.add(key);
    if (state === 'idle' || state === 'over') startMatch();
  });

  window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));

  canvas.addEventListener('pointerdown', (event) => {
    pointerActive = true;
    canvas.setPointerCapture(event.pointerId);
    movePlayerToPointer(event);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (pointerActive) movePlayerToPointer(event);
  });
  canvas.addEventListener('pointerup', () => { pointerActive = false; });
  canvas.addEventListener('pointercancel', () => { pointerActive = false; });

  document.querySelectorAll('[data-move]').forEach((button) => {
    let interval = null;
    const amount = button.dataset.move === 'up' ? -34 : 34;
    const move = () => {
      player.y += amount;
      clampPaddle(player);
      if (state === 'idle' || state === 'over') startMatch();
    };
    button.addEventListener('pointerdown', () => {
      move();
      interval = window.setInterval(move, 70);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((name) => {
      button.addEventListener(name, () => {
        window.clearInterval(interval);
        interval = null;
      });
    });
  });

  startButton.addEventListener('click', startMatch);
  pauseButton.addEventListener('click', togglePause);
  restartButton.addEventListener('click', () => {
    resetMatch();
    state = 'running';
    hideMessage();
    startButton.textContent = 'Playing';
    lastTime = performance.now();
  });

  resetMatch();
  draw();
  requestAnimationFrame(frame);
})();
