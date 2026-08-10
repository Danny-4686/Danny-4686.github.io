(() => {
  const canvas = document.getElementById('flappyCanvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const streakEl = document.getElementById('streak');
  const speedLabel = document.getElementById('speedLabel');
  const shieldLabel = document.getElementById('shieldLabel');
  const message = document.getElementById('gameMessage');
  const messageTitle = document.getElementById('messageTitle');
  const messageText = document.getElementById('messageText');
  const announcement = document.getElementById('gameAnnouncement');
  const startButton = document.getElementById('startButton');
  const pauseButton = document.getElementById('pauseButton');
  const restartButton = document.getElementById('restartButton');
  const stage = document.getElementById('flappyStage');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const STORAGE_KEY = 'cloudlab-flappy-cloud-best-v1';

  let best = 0;
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY) || 0);
    best = Number.isFinite(saved) && saved >= 0 ? Math.floor(saved) : 0;
  } catch (_) {}

  let player;
  let gates = [];
  let particles = [];
  let score = 0;
  let streak = 0;
  let maxStreak = 0;
  let shield = false;
  let invincible = 0;
  let running = false;
  let paused = false;
  let started = false;
  let gameOver = false;
  let last = 0;
  let raf = 0;
  let skyOffset = 0;
  let flash = 0;

  function showMessage(title, text) {
    messageTitle.textContent = title;
    messageText.textContent = text;
    message.classList.remove('hidden');
  }

  function hideMessage() { message.classList.add('hidden'); }

  function announce(text) {
    announcement.textContent = '';
    window.setTimeout(() => { announcement.textContent = text; }, 20);
  }

  function currentSpeed() { return 245 + Math.min(155, score * 4.2); }
  function currentGap() { return Math.max(184, 244 - score * 1.55); }

  function updateHud() {
    scoreEl.textContent = String(score);
    bestEl.textContent = String(Math.max(best, score));
    streakEl.textContent = String(streak);
    const speed = currentSpeed();
    speedLabel.textContent = speed < 285 ? 'CALM SKIES' : speed < 345 ? 'RISING WIND' : 'JET STREAM';
    shieldLabel.textContent = shield ? 'SHIELD READY' : 'NO SHIELD';
    shieldLabel.classList.toggle('is-active', shield);
  }

  function createGate(x, index = 0) {
    const gap = currentGap();
    const margin = 125 + gap / 2;
    const gapY = margin + Math.random() * (H - margin * 2);
    const star = score >= 2 && index % 5 === 4;
    return { x, width: 92, gapY, gap, passed: false, star, starTaken: false };
  }

  function resetGame() {
    cancelAnimationFrame(raf);
    player = { x: 152, y: H * .5 - 24, w: 72, h: 48, vy: 0, tilt: 0 };
    gates = [createGate(W + 230, 0), createGate(W + 590, 1), createGate(W + 950, 2)];
    particles = [];
    score = 0;
    streak = 0;
    maxStreak = 0;
    shield = false;
    invincible = 0;
    running = false;
    paused = false;
    started = false;
    gameOver = false;
    skyOffset = 0;
    flash = 0;
    startButton.textContent = 'Start Flight';
    pauseButton.textContent = 'Pause';
    updateHud();
    showMessage('Ready to fly?', 'Tap, click, or press Space to lift the cloud through each opening.');
    draw(performance.now());
  }

  function start() {
    if (gameOver) resetGame();
    if (running) return;
    running = true;
    started = true;
    paused = false;
    startButton.textContent = 'Flying';
    pauseButton.textContent = 'Pause';
    hideMessage();
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function flap() {
    if (paused) return;
    if (!started || gameOver) start();
    if (!running) return;
    player.vy = -590;
    player.tilt = -.38;
    spawnParticles(player.x + 10, player.y + player.h * .55, '#dffbff', 5);
  }

  function pauseGame(fromVisibility = false) {
    if (!running || paused || gameOver) return;
    paused = true;
    pauseButton.textContent = 'Resume';
    showMessage('Flight paused', fromVisibility ? 'The game paused while this tab was away.' : 'Press Resume when you are ready.');
  }

  function resumeGame() {
    if (!running || !paused || gameOver) return;
    paused = false;
    pauseButton.textContent = 'Pause';
    hideMessage();
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function togglePause() {
    if (!started || gameOver) return;
    if (paused) resumeGame(); else pauseGame(false);
  }

  function spawnParticles(x, y, color, amount = 10) {
    const count = reducedMotion ? Math.min(3, amount) : amount;
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x,
        y,
        vx: -50 - Math.random() * 150,
        vy: (Math.random() - .5) * 150,
        life: .55 + Math.random() * .3,
        maxLife: .85,
        size: 3 + Math.random() * 5,
        color
      });
    }
  }

  function collectStar(gate) {
    gate.starTaken = true;
    shield = true;
    flash = .34;
    spawnParticles(gate.x + gate.width / 2, gate.gapY, '#f2c75c', 18);
    announce('Shield collected. One collision will be absorbed.');
    updateHud();
  }

  function circleRectCollision(cx, cy, radius, x, y, width, height) {
    const closestX = Math.max(x, Math.min(cx, x + width));
    const closestY = Math.max(y, Math.min(cy, y + height));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < radius * radius;
  }

  function hitsGate(gate) {
    if (invincible > 0) return false;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    const radius = 25;
    const topHeight = gate.gapY - gate.gap / 2;
    const bottomY = gate.gapY + gate.gap / 2;
    return circleRectCollision(cx, cy, radius, gate.x, 0, gate.width, topHeight)
      || circleRectCollision(cx, cy, radius, gate.x, bottomY, gate.width, H - bottomY);
  }

  function absorbHit(gate) {
    shield = false;
    invincible = 1.05;
    player.y = gate.gapY - player.h / 2;
    player.vy = -260;
    flash = .42;
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#f2c75c', 24);
    announce('Shield used. Keep flying.');
    updateHud();
  }

  function finish() {
    if (gameOver) return;
    running = false;
    started = false;
    gameOver = true;
    best = Math.max(best, score);
    try { localStorage.setItem(STORAGE_KEY, String(best)); } catch (_) {}
    updateHud();
    startButton.textContent = 'Fly Again';
    pauseButton.textContent = 'Pause';
    showMessage('Flight over', `You cleared ${score} ${score === 1 ? 'point' : 'points'}. Best streak: ${maxStreak}.`);
    announce(`Flight over. Score ${score}.`);
  }

  function update(dt) {
    const speed = currentSpeed();
    skyOffset += speed * dt * .12;
    invincible = Math.max(0, invincible - dt);
    flash = Math.max(0, flash - dt);
    player.vy += 1660 * dt;
    player.y += player.vy * dt;
    player.tilt += (Math.min(.72, player.vy / 850) - player.tilt) * Math.min(1, dt * 7);

    for (const gate of gates) {
      gate.x -= speed * dt;

      if (gate.star && !gate.starTaken) {
        const sx = gate.x + gate.width / 2;
        const sy = gate.gapY;
        const dx = player.x + player.w / 2 - sx;
        const dy = player.y + player.h / 2 - sy;
        if (dx * dx + dy * dy < 48 * 48) collectStar(gate);
      }

      if (!gate.passed && gate.x + gate.width < player.x + 8) {
        gate.passed = true;
        const centered = Math.abs(player.y + player.h / 2 - gate.gapY) < gate.gap * .18;
        if (centered) {
          score += 2;
          streak += 1;
          maxStreak = Math.max(maxStreak, streak);
          flash = .22;
          spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#68d0df', 14);
          announce(`Perfect gate. Streak ${streak}.`);
        } else {
          score += 1;
          streak = 0;
        }
        updateHud();
      }

      if (hitsGate(gate)) {
        if (shield) absorbHit(gate);
        else { finish(); return; }
      }
    }

    gates = gates.filter((gate) => gate.x + gate.width > -40);
    while (gates.length < 4) {
      const lastGate = gates[gates.length - 1];
      const index = Math.max(0, score + gates.length);
      gates.push(createGate((lastGate?.x || W) + 360, index));
    }

    particles.forEach((particle) => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 180 * dt;
      particle.life -= dt;
    });
    particles = particles.filter((particle) => particle.life > 0);

    if (player.y + player.h < -25 || player.y > H + 25) finish();
  }

  function drawSky(now) {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, '#12475d');
    gradient.addColorStop(.52, '#0a2b3a');
    gradient.addColorStop(1, '#06151d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,255,255,.48)';
    for (let i = 0; i < 46; i += 1) {
      const x = ((i * 109 - skyOffset * (.4 + (i % 3) * .16)) % (W + 80) + W + 80) % (W + 80) - 40;
      const y = 38 + ((i * 173) % (H - 100));
      const size = i % 7 === 0 ? 2.3 : 1.2;
      ctx.globalAlpha = .35 + ((i * 17) % 45) / 100;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    const moonX = W - 112;
    const moonY = 108;
    ctx.save();
    ctx.shadowColor = 'rgba(242,199,92,.45)';
    ctx.shadowBlur = 32;
    ctx.fillStyle = '#f7e6a8';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (!reducedMotion) {
      ctx.strokeStyle = 'rgba(104,208,223,.07)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i += 1) {
        const y = 210 + i * 132 + Math.sin(now / 900 + i) * 10;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(W * .3, y - 28, W * .66, y + 28, W, y - 8);
        ctx.stroke();
      }
    }
  }

  function drawGate(gate) {
    const topHeight = gate.gapY - gate.gap / 2;
    const bottomY = gate.gapY + gate.gap / 2;
    const drawTower = (x, y, width, height, capAtBottom) => {
      if (height <= 0) return;
      const gradient = ctx.createLinearGradient(x, y, x + width, y);
      gradient.addColorStop(0, '#174657');
      gradient.addColorStop(.5, '#26768a');
      gradient.addColorStop(1, '#123b4b');
      ctx.save();
      ctx.shadowColor = 'rgba(104,208,223,.22)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 18);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(178,239,247,.18)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(218,250,253,.14)';
      const capY = capAtBottom ? y + height - 28 : y + 8;
      ctx.beginPath();
      ctx.roundRect(x - 12, capY, width + 24, 28, 14);
      ctx.fill();
      ctx.restore();
    };

    drawTower(gate.x, -20, gate.width, topHeight + 20, true);
    drawTower(gate.x, bottomY, gate.width, H - bottomY + 20, false);

    if (gate.star && !gate.starTaken) drawStar(gate.x + gate.width / 2, gate.gapY, 18);
  }

  function drawStar(x, y, radius) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(performance.now() / 900);
    ctx.shadowColor = '#f2c75c';
    ctx.shadowBlur = 22;
    ctx.fillStyle = '#f7d56f';
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const length = i % 2 === 0 ? radius : radius * .45;
      const xPoint = Math.cos(angle) * length;
      const yPoint = Math.sin(angle) * length;
      if (i === 0) ctx.moveTo(xPoint, yPoint); else ctx.lineTo(xPoint, yPoint);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawCloud() {
    const x = player.x;
    const y = player.y;
    ctx.save();
    ctx.translate(x + player.w / 2, y + player.h / 2);
    ctx.rotate(player.tilt);
    if (invincible > 0 && Math.floor(invincible * 12) % 2 === 0) ctx.globalAlpha = .52;

    if (shield) {
      ctx.strokeStyle = 'rgba(242,199,92,.8)';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#f2c75c';
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.ellipse(0, 0, 45, 36, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowColor = '#68d0df';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#e4fcff';
    ctx.beginPath();
    ctx.arc(-20, 4, 17, 0, Math.PI * 2);
    ctx.arc(-3, -7, 23, 0, Math.PI * 2);
    ctx.arc(20, 3, 18, 0, Math.PI * 2);
    ctx.roundRect(-31, 1, 62, 25, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0a2a34';
    ctx.beginPath();
    ctx.arc(-10, 5, 3, 0, Math.PI * 2);
    ctx.arc(10, 5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0a2a34';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 9, 8, .2, Math.PI - .2);
    ctx.stroke();
    ctx.restore();
  }

  function draw(now) {
    drawSky(now);
    gates.forEach(drawGate);
    particles.forEach((particle) => {
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    drawCloud();

    if (flash > 0) {
      ctx.fillStyle = `rgba(104,208,223,${Math.min(.2, flash * .45)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function loop(now) {
    if (!running || paused) return;
    const dt = Math.min(.024, Math.max(0, (now - last) / 1000 || 0));
    last = now;
    update(dt);
    draw(now);
    if (running && !paused) raf = requestAnimationFrame(loop);
  }

  stage.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;
    event.preventDefault();
    flap();
  });

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space' || event.key === 'ArrowUp') {
      event.preventDefault();
      flap();
    } else if (event.key.toLowerCase() === 'p') {
      event.preventDefault();
      togglePause();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseGame(true);
  });
  startButton.addEventListener('click', () => { start(); flap(); });
  pauseButton.addEventListener('click', togglePause);
  restartButton.addEventListener('click', resetGame);

  bestEl.textContent = String(best);
  resetGame();
})();
