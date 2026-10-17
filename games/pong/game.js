(() => {
  const canvas = document.getElementById('pongCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const stage = canvas.parentElement;
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

  // Logical board size. Width is fixed; the board gets taller on narrow portrait screens.
  const W = 760;
  const WIDE_H = 460;
  const TALL_H = 640;
  const MAX_BALL_SPEED = 760;
  const SERVE_DELAY = 0.7;
  let H = WIDE_H;

  const touchUI = window.matchMedia?.('(pointer: coarse)').matches || false;
  const copy = touchUI ? {
    ready: 'Tap Start Match or drag on the board to move your paddle. First to seven wins.',
    paused: 'Tap Resume to continue the match.',
    away: 'The match paused while this tab was away. Tap Resume to continue.'
  } : {
    ready: 'Press Start, move with W/S or the arrow keys, or drag on the board.',
    paused: 'Press Space or the Pause button to continue.',
    away: 'The match paused while this tab was away. Press Space to continue.'
  };

  const storageKey = 'cloudlab-pong-best-rally';
  let bestRally = 0;
  try {
    const savedBest = Number.parseInt(localStorage.getItem(storageKey) || '0', 10);
    bestRally = Number.isSafeInteger(savedBest) && savedBest >= 0 ? savedBest : 0;
  } catch (_) {}
  let state = 'idle';
  let lastTime = performance.now();
  const keys = new Set();
  let pointerActive = false;
  let serveTimer = 0;
  let serveDirection = 1;

  const player = { x: 30, y: (H - 120) / 2, width: 16, height: 120, speed: 430 };
  const cpu = { x: W - 46, y: (H - 120) / 2, width: 16, height: 120 };
  const ball = { x: W / 2, y: H / 2, radius: 11, vx: 350, vy: 145 };
  let playerScore = 0;
  let cpuScore = 0;
  let rally = 0;

  bestRallyEl.textContent = String(bestRally);

  function isTypingTarget(target) {
    return target instanceof Element && Boolean(target.closest('input, select, textarea, [contenteditable="true"]'));
  }

  function isActivatableTarget(target) {
    return target instanceof Element && Boolean(target.closest('a[href], button, summary'));
  }

  function resetBall(direction = Math.random() > 0.5 ? 1 : -1) {
    ball.x = W / 2;
    ball.y = H / 2;
    const angle = (Math.random() * 0.7 - 0.35);
    const speed = 360;
    ball.vx = Math.cos(angle) * speed * direction;
    ball.vy = Math.sin(angle) * speed;
    serveDirection = direction;
    serveTimer = SERVE_DELAY;
    rally = 0;
  }

  function resetMatch() {
    playerScore = 0;
    cpuScore = 0;
    player.y = (H - player.height) / 2;
    cpu.y = (H - cpu.height) / 2;
    playerScoreEl.textContent = '0';
    cpuScoreEl.textContent = '0';
    resetBall(1);
  }

  function startMatch() {
    if (state === 'running') return;
    if (state === 'paused') { togglePause(); return; }
    resetMatch();
    state = 'running';
    hideMessage();
    startButton.textContent = 'Playing';
    pauseButton.textContent = 'Pause';
    lastTime = performance.now();
  }

  function pauseMatch(text = copy.paused) {
    if (state !== 'running') return;
    state = 'paused';
    keys.clear();
    showMessage('Paused', text);
    pauseButton.textContent = 'Resume';
    startButton.textContent = 'Start Match';
  }

  function togglePause() {
    if (state === 'running') {
      pauseMatch();
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
    keys.clear();
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
    paddle.y = Math.max(12, Math.min(H - paddle.height - 12, paddle.y));
  }

  function update(dt) {
    const up = keys.has('arrowup') || keys.has('w');
    const down = keys.has('arrowdown') || keys.has('s');
    if (up) player.y -= player.speed * dt;
    if (down) player.y += player.speed * dt;
    clampPaddle(player);

    const aiStrength = Number.parseFloat(difficulty.value);
    const targetY = (serveTimer > 0 ? H / 2 : ball.y) - cpu.height / 2;
    cpu.y += (targetY - cpu.y) * Math.min(1, aiStrength * dt * 60);
    clampPaddle(cpu);

    if (serveTimer > 0) {
      serveTimer = Math.max(0, serveTimer - dt);
      return;
    }

    // Move in small sub-steps so a fast ball can never skip past a paddle or wall.
    const distance = Math.hypot(ball.vx, ball.vy) * dt;
    const steps = Math.max(1, Math.ceil(distance / (ball.radius * 0.5)));
    const stepDt = dt / steps;
    for (let i = 0; i < steps; i += 1) {
      const previousX = ball.x;
      const previousY = ball.y;
      ball.x += ball.vx * stepDt;
      ball.y += ball.vy * stepDt;

      if (ball.y - ball.radius <= 0 && ball.vy < 0) {
        ball.y = ball.radius;
        ball.vy *= -1;
      }
      if (ball.y + ball.radius >= H && ball.vy > 0) {
        ball.y = H - ball.radius;
        ball.vy *= -1;
      }

      if (collideWithPaddle(player, 1, previousX, previousY) || collideWithPaddle(cpu, -1, previousX, previousY)) continue;

      if (ball.x + ball.radius < 0) { scorePoint('cpu'); return; }
      if (ball.x - ball.radius > W) { scorePoint('player'); return; }
    }
  }

  function collideWithPaddle(paddle, direction, previousX, previousY) {
    const movingToward = direction === 1 ? ball.vx < 0 : ball.vx > 0;
    if (!movingToward) return false;

    // Swept test against the paddle's front face.
    const faceX = direction === 1 ? paddle.x + paddle.width : paddle.x;
    const edgeBefore = direction === 1 ? previousX - ball.radius : previousX + ball.radius;
    const edgeAfter = direction === 1 ? ball.x - ball.radius : ball.x + ball.radius;
    const crossed = direction === 1 ? edgeBefore >= faceX && edgeAfter <= faceX : edgeBefore <= faceX && edgeAfter >= faceX;
    let hitY = null;
    if (crossed) {
      const t = edgeBefore === edgeAfter ? 0 : (edgeBefore - faceX) / (edgeBefore - edgeAfter);
      hitY = previousY + (ball.y - previousY) * t;
    } else {
      // Fallback overlap test (e.g. the paddle moved into the ball).
      const overlapX = direction === 1
        ? ball.x - ball.radius <= paddle.x + paddle.width && ball.x + ball.radius >= paddle.x
        : ball.x + ball.radius >= paddle.x && ball.x - ball.radius <= paddle.x + paddle.width;
      if (overlapX) hitY = ball.y;
    }
    if (hitY === null) return false;
    if (hitY + ball.radius < paddle.y || hitY - ball.radius > paddle.y + paddle.height) return false;

    const offset = Math.max(-1, Math.min(1, (hitY - (paddle.y + paddle.height / 2)) / (paddle.height / 2)));
    const speed = Math.min(MAX_BALL_SPEED, Math.hypot(ball.vx, ball.vy) * 1.045);
    const angle = offset * 0.9;
    ball.vx = Math.cos(angle) * speed * direction;
    ball.vy = Math.sin(angle) * speed;
    ball.x = direction === 1 ? paddle.x + paddle.width + ball.radius : paddle.x - ball.radius;
    ball.y = hitY;

    rally += 1;
    if (rally > bestRally) {
      bestRally = rally;
      bestRallyEl.textContent = String(bestRally);
      try { localStorage.setItem(storageKey, String(bestRally)); } catch (_) {}
    }
    return true;
  }

  function drawRoundedRect(x, y, width, height, radius, fill) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function drawServeCue() {
    if (serveTimer <= 0 || state !== 'running') return;
    const progress = 1 - serveTimer / SERVE_DELAY;
    ctx.save();
    ctx.strokeStyle = 'rgba(242,199,92,.85)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius + 11, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(242,199,92,.75)';
    const tipX = ball.x + serveDirection * (ball.radius + 34);
    ctx.beginPath();
    ctx.moveTo(tipX, ball.y);
    ctx.lineTo(tipX - serveDirection * 12, ball.y - 8);
    ctx.lineTo(tipX - serveDirection * 12, ball.y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.font = '800 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(214,246,250,.85)';
    ctx.fillText('SERVE', ball.x, ball.y - ball.radius - 22);
    ctx.restore();
  }

  function draw() {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0a2430');
    bg.addColorStop(1, '#061117');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(104,208,223,.16)';
    ctx.lineWidth = 4;
    ctx.setLineDash([13, 18]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 20);
    ctx.lineTo(W / 2, H - 20);
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
    drawServeCue();
  }

  function fitCanvas() {
    const cssWidth = canvas.getBoundingClientRect().width || W;
    const nextH = cssWidth < 560 && window.innerHeight > window.innerWidth ? TALL_H : WIDE_H;
    if (nextH !== H) {
      const ratio = nextH / H;
      H = nextH;
      player.y *= ratio;
      cpu.y *= ratio;
      ball.y = Math.max(ball.radius, Math.min(H - ball.radius, ball.y * ratio));
      clampPaddle(player);
      clampPaddle(cpu);
      canvas.style.aspectRatio = `${W} / ${H}`;
    }
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const scale = Math.max(0.25, (cssWidth * dpr) / W);
    const backingWidth = Math.round(W * scale);
    const backingHeight = Math.round(H * scale);
    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
      canvas.width = backingWidth;
      canvas.height = backingHeight;
    }
    ctx.setTransform(backingWidth / W, 0, 0, backingHeight / H, 0, 0);
    draw();
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
    const y = (event.clientY - rect.top) * (H / rect.height);
    player.y = y - player.height / 2;
    clampPaddle(player);
    if (state === 'idle' || state === 'over') startMatch();
  }

  window.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target)) return;
    const key = event.key.toLowerCase();
    if (key === ' ' || key === 'enter') {
      // Let focused links and buttons keep their native keyboard activation.
      if (isActivatableTarget(event.target) || key === 'enter') return;
      event.preventDefault();
      if (!event.repeat) {
        if (state === 'idle' || state === 'over') startMatch();
        else togglePause();
      }
      return;
    }
    if (!['arrowup', 'arrowdown', 'w', 's'].includes(key)) return;
    event.preventDefault();
    keys.add(key);
    if (state === 'idle' || state === 'over') startMatch();
  });

  window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
  window.addEventListener('blur', () => { keys.clear(); pointerActive = false; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseMatch(copy.away);
    keys.clear();
    lastTime = performance.now();
  });

  canvas.addEventListener('pointerdown', (event) => {
    pointerActive = true;
    canvas.setPointerCapture?.(event.pointerId);
    if (state === 'paused') togglePause();
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
    const stop = () => {
      window.clearInterval(interval);
      interval = null;
    };
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      stop();
      move();
      interval = window.setInterval(move, 70);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((name) => button.addEventListener(name, stop));
    window.addEventListener('blur', stop);
  });

  // Mouse clicks should not leave focus on toolbar buttons, so Space keeps controlling the match.
  [startButton, pauseButton, restartButton].forEach((button) => {
    button.addEventListener('click', (event) => { if (event.detail) button.blur(); });
  });
  startButton.addEventListener('click', startMatch);
  pauseButton.addEventListener('click', togglePause);
  restartButton.addEventListener('click', () => {
    resetMatch();
    state = 'running';
    hideMessage();
    startButton.textContent = 'Playing';
    pauseButton.textContent = 'Pause';
    lastTime = performance.now();
  });

  let fitFrame = 0;
  const scheduleFit = () => {
    cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(fitCanvas);
  };
  if (window.ResizeObserver) new ResizeObserver(scheduleFit).observe(stage);
  window.addEventListener('resize', scheduleFit);
  window.addEventListener('orientationchange', scheduleFit);

  messageText.textContent = copy.ready;
  resetMatch();
  serveTimer = 0;
  fitCanvas();
  requestAnimationFrame(frame);
})();
