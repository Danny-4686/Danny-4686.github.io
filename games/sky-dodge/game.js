(() => {
  'use strict';

  const canvas = document.getElementById('dodgeCanvas');
  const ctx = canvas.getContext('2d');
  const stage = document.getElementById('dodgeStage');
  const W = 640;
  const H = 800;
  const BEST_KEY = 'cloudlab-sky-dodge-best';

  const scoreEl = document.getElementById('score');
  const starsEl = document.getElementById('stars');
  const bestEl = document.getElementById('best');
  const message = document.getElementById('gameMessage');
  const messageTitle = document.getElementById('messageTitle');
  const messageText = document.getElementById('messageText');
  const startButton = document.getElementById('startButton');
  const restartButton = document.getElementById('restartButton');
  const levelLabel = document.getElementById('levelLabel');
  const shieldLabel = document.getElementById('shieldLabel');
  const controlNote = document.getElementById('controlNote');
  const announcement = document.getElementById('gameAnnouncement');

  const touchUI = window.matchMedia?.('(pointer: coarse)').matches || false;
  const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionQuery?.matches || false;
  motionQuery?.addEventListener?.('change', (event) => { reducedMotion = event.matches; ensureLoop(); });

  const copy = touchUI ? {
    ready: 'Tap Start Run, then hold and drag anywhere on the sky to steer your cloud ship.',
    paused: 'Tap the sky or Resume to keep flying.',
    again: 'Tap the sky or Play Again for another run.',
    note: 'Hold and drag anywhere on the sky to steer. Stars add 50 points, shield bubbles absorb one hit, and every second survived adds 10.'
  } : {
    ready: 'Press Space or Start Run, then steer with the arrow keys or A/D. You can also drag on the sky.',
    paused: 'Press Space, P, or Resume to keep flying.',
    again: 'Press Space or Play Again for another run.',
    note: 'Arrow keys or A/D steer, or click and drag on the sky. P or Esc pauses. Stars add 50 points and every second survived adds 10.'
  };
  controlNote.textContent = copy.note;
  messageText.textContent = copy.ready;

  const COLORS = { cyan: '#68d0df', mint: '#8bcf9b', gold: '#f2c75c', orange: '#ed8b45', red: '#ef6d68', violet: '#9e8cff' };
  const LEVEL_NAMES = ['CALM SKIES', 'LIGHT SQUALL', 'RISING WINDS', 'HAIL FRONT', 'THUNDERHEAD', 'SUPERCELL', 'EYE OF THE STORM'];

  // Ship
  const SHIP_Y = H - 118;
  const SHIP_HIT = 19;
  const ship = { x: W / 2, y: SHIP_Y, vx: 0, tilt: 0, bob: 0 };

  // State
  let state = 'ready'; // ready | running | over
  let paused = false;
  let score = 0;
  let stars = 0;
  let elapsed = 0;
  let best = 0;
  let shield = false;
  let invulnerable = 0;
  let hazards = [];
  let pickups = [];
  let particles = [];
  let floaters = [];
  let rings = [];
  let spawnTimer = 0;
  let starTimer = 0;
  let shieldTimer = 0;
  let trailTimer = 0;
  let shake = 0;
  let flash = 0;
  let overTimer = 0;
  let worldTime = 0;
  let lastLevel = 0;
  let last = 0;
  let raf = 0;
  let loopActive = false;

  const keys = { left: false, right: false };
  const pointer = { active: false, id: null, x: W / 2 };

  try {
    const saved = Number(localStorage.getItem(BEST_KEY) || 0);
    best = Number.isFinite(saved) && saved >= 0 ? Math.floor(saved) : 0;
  } catch (_) {}

  // Background layers
  const rand = (min, max) => min + Math.random() * (max - min);
  const starLayers = [
    { speed: 14, size: [0.6, 1.2], alpha: [0.25, 0.5], items: [] },
    { speed: 34, size: [0.9, 1.6], alpha: [0.35, 0.7], items: [] },
    { speed: 70, size: [1.2, 2.2], alpha: [0.5, 0.9], items: [] }
  ];
  starLayers.forEach((layer, index) => {
    const count = [70, 42, 22][index];
    for (let i = 0; i < count; i += 1) {
      layer.items.push({ x: rand(0, W), y: rand(0, H), r: rand(...layer.size), a: rand(...layer.alpha), tw: rand(0, Math.PI * 2) });
    }
  });
  const clouds = [];
  for (let i = 0; i < 7; i += 1) clouds.push(makeCloud(rand(-60, H)));
  function makeCloud(y) {
    const near = Math.random() < 0.4;
    return {
      x: rand(-80, W + 80),
      y,
      w: near ? rand(220, 340) : rand(130, 220),
      speed: near ? rand(85, 120) : rand(40, 60),
      alpha: near ? rand(0.07, 0.11) : rand(0.04, 0.07),
      hue: Math.random() < 0.5 ? '104,208,223' : '158,140,255'
    };
  }

  function difficulty() {
    return {
      speed: 1 + Math.min(1.55, elapsed / 38),
      interval: Math.max(0.21, 0.82 - elapsed * 0.0105),
      level: Math.min(LEVEL_NAMES.length - 1, Math.floor(elapsed / 15))
    };
  }

  function isTypingTarget(target) {
    return target instanceof Element && Boolean(target.closest('input, select, textarea, [contenteditable="true"], [contenteditable=""]'));
  }

  function isActivatableTarget(target) {
    return target instanceof Element && Boolean(target.closest('a[href], button, summary'));
  }

  function showMessage(title, text) {
    messageTitle.textContent = title;
    messageText.textContent = text;
    message.classList.remove('hidden');
  }

  function hideMessage() { message.classList.add('hidden'); }

  function announce(text) { announcement.textContent = text; }

  function updateStats() {
    scoreEl.textContent = String(Math.floor(score));
    starsEl.textContent = String(stars);
  }

  function updateBest() { bestEl.textContent = String(best); }

  function updateStatus() {
    const { level } = difficulty();
    levelLabel.textContent = state === 'running' || state === 'over' ? `LV ${level + 1} · ${LEVEL_NAMES[level]}` : LEVEL_NAMES[0];
    shieldLabel.textContent = shield ? 'SHIELD READY' : 'NO SHIELD';
    shieldLabel.classList.toggle('is-active', shield);
  }

  function updateButtons() {
    if (state === 'running') startButton.textContent = paused ? 'Resume' : 'Pause';
    else if (state === 'over') startButton.textContent = 'Play Again';
    else startButton.textContent = 'Start Run';
  }

  function resetRun() {
    score = 0;
    stars = 0;
    elapsed = 0;
    shield = false;
    invulnerable = 0;
    hazards = [];
    pickups = [];
    particles = [];
    floaters = [];
    rings = [];
    spawnTimer = 0.6;
    starTimer = 1.6;
    shieldTimer = rand(10, 14);
    shake = 0;
    flash = 0;
    overTimer = 0;
    lastLevel = 0;
    ship.x = W / 2;
    ship.vx = 0;
    ship.tilt = 0;
    pointer.x = W / 2;
    updateStats();
    updateStatus();
  }

  function startRun() {
    resetRun();
    state = 'running';
    paused = false;
    hideMessage();
    updateButtons();
    announce('Run started.');
    ensureLoop();
  }

  function pauseGame() {
    if (state !== 'running' || paused) return;
    paused = true;
    keys.left = false;
    keys.right = false;
    releasePointer();
    updateButtons();
    showMessage('Paused', copy.paused);
    announce('Paused.');
    draw();
  }

  function resumeGame() {
    if (!paused) return;
    paused = false;
    updateButtons();
    hideMessage();
    announce('Resumed.');
    ensureLoop();
  }

  function primaryAction() {
    if (state === 'running') {
      if (paused) resumeGame(); else pauseGame();
    } else {
      startRun();
    }
  }

  function endRun() {
    state = 'over';
    overTimer = 0;
    const finalScore = Math.floor(score);
    const newBest = finalScore > best;
    if (newBest) {
      best = finalScore;
      try { localStorage.setItem(BEST_KEY, String(best)); } catch (_) {}
    }
    updateStats();
    updateBest();
    updateButtons();
    explode(ship.x, ship.y);
    if (!reducedMotion) shake = 18;
    flash = 1;
    const seconds = Math.floor(elapsed);
    const summary = `${finalScore} points, ${stars} ${stars === 1 ? 'star' : 'stars'}, ${seconds}s survived.`;
    window.setTimeout(() => {
      if (state !== 'over') return;
      showMessage(newBest ? 'New best!' : 'Storm hit', `${summary} ${copy.again}`);
    }, reducedMotion ? 150 : 700);
    announce(`Run over. ${summary}${newBest ? ' New best score.' : ''}`);
  }

  // Spawning
  function spawnHazard() {
    const diff = difficulty();
    const weights = [
      ['hail', 1],
      ['debris', elapsed > 4 ? 0.6 + Math.min(0.3, elapsed / 120) : 0],
      ['bolt', elapsed > 8 ? 0.42 + Math.min(0.3, elapsed / 140) : 0]
    ];
    const total = weights.reduce((sum, [, w]) => sum + w, 0);
    let pick = Math.random() * total;
    let type = 'hail';
    for (const [name, w] of weights) { if ((pick -= w) <= 0) { type = name; break; } }

    if (type === 'hail') {
      const r = rand(11, 19);
      hazards.push({ type, x: rand(r + 6, W - r - 6), y: -r - 10, r, vy: rand(210, 320) * diff.speed, vx: rand(-28, 28), spin: 0, vr: 0 });
    } else if (type === 'debris') {
      const r = rand(17, 27);
      const points = [];
      const sides = 6 + Math.floor(Math.random() * 3);
      for (let i = 0; i < sides; i += 1) points.push(rand(0.62, 1));
      hazards.push({ type, x: rand(r + 6, W - r - 6), y: -r - 12, r, vy: rand(150, 240) * diff.speed, vx: 0, sway: rand(30, 70), phase: rand(0, Math.PI * 2), baseX: 0, spin: rand(0, Math.PI * 2), vr: rand(-3.4, 3.4), points, tint: Math.random() < 0.5 ? COLORS.orange : COLORS.violet });
      hazards[hazards.length - 1].baseX = hazards[hazards.length - 1].x;
    } else {
      const len = rand(86, 118);
      const segments = 6;
      const zig = [];
      for (let i = 0; i <= segments; i += 1) zig.push(i === 0 || i === segments ? 0 : rand(-11, 11));
      const x = Math.random() < 0.35 ? Math.max(24, Math.min(W - 24, ship.x + rand(-70, 70))) : rand(24, W - 24);
      hazards.push({ type, x, y: -len / 2 - 6, len, zig, vy: rand(640, 780) * Math.min(1.6, 0.85 + diff.speed * 0.25), vx: 0, warn: Math.max(0.42, 0.75 - elapsed * 0.004), flicker: 0 });
    }
  }

  function spawnStar() {
    pickups.push({ type: 'star', x: rand(30, W - 30), y: -20, r: 15, vy: rand(150, 190) * (1 + Math.min(0.6, elapsed / 90)), spin: rand(0, Math.PI), t: rand(0, 6) });
  }

  function spawnShield() {
    pickups.push({ type: 'shield', x: rand(40, W - 40), y: -24, r: 19, vy: 140, spin: 0, t: 0 });
  }

  // Effects
  function burst(x, y, colors, count, speed, life = 0.8, size = [1.5, 3.5]) {
    const n = reducedMotion ? Math.ceil(count / 3) : count;
    for (let i = 0; i < n; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const s = rand(speed * 0.3, speed);
      particles.push({ x, y, vx: Math.cos(angle) * s, vy: Math.sin(angle) * s, life: rand(life * 0.6, life), max: life, r: rand(...size), color: colors[Math.floor(Math.random() * colors.length)], drag: 2.2 });
    }
  }

  function explode(x, y) {
    burst(x, y, ['#ffffff', COLORS.cyan, COLORS.gold, COLORS.orange, COLORS.red], 70, 420, 1.2, [2, 5]);
    rings.push({ x, y, r: 10, max: 150, life: 0.6, t: 0, color: COLORS.orange });
    rings.push({ x, y, r: 4, max: 90, life: 0.45, t: 0, color: COLORS.cyan });
  }

  // Collisions
  function hitsShip(h) {
    if (h.type === 'bolt') {
      if (h.warn > 0) return false;
      const top = h.y - h.len / 2;
      const bottom = h.y + h.len / 2;
      const cy = Math.max(top, Math.min(bottom, ship.y));
      const dx = ship.x - h.x;
      const dy = ship.y - cy;
      return dx * dx + dy * dy < (SHIP_HIT + 5) * (SHIP_HIT + 5);
    }
    const hitR = h.r * (h.type === 'debris' ? 0.72 : 0.8) + SHIP_HIT;
    const dx = ship.x - h.x;
    const dy = ship.y - h.y;
    return dx * dx + dy * dy < hitR * hitR;
  }

  // Update
  function updateShip(dt) {
    const maxSpeed = 560;
    if (pointer.active) {
      const desired = Math.max(-760, Math.min(760, (pointer.x - ship.x) * 9));
      ship.vx += (desired - ship.vx) * Math.min(1, dt * 14);
    } else {
      const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      if (dir) {
        // Turning around brakes harder so direction changes feel snappy.
        const accel = Math.sign(ship.vx) !== dir && ship.vx !== 0 ? 4200 : 2500;
        ship.vx += dir * accel * dt;
        ship.vx = Math.max(-maxSpeed, Math.min(maxSpeed, ship.vx));
      } else {
        ship.vx *= Math.exp(-dt * 9);
        if (Math.abs(ship.vx) < 4) ship.vx = 0;
      }
    }
    ship.x += ship.vx * dt;
    const minX = 34;
    const maxX = W - 34;
    if (ship.x < minX) { ship.x = minX; ship.vx = Math.max(0, ship.vx); }
    if (ship.x > maxX) { ship.x = maxX; ship.vx = Math.min(0, ship.vx); }
    ship.tilt += ((ship.vx / maxSpeed) * 0.32 - ship.tilt) * Math.min(1, dt * 10);
  }

  function update(dt) {
    worldTime += dt;
    const diff = difficulty();
    const scroll = state === 'running' ? diff.speed : 0.7;

    // Background drift
    starLayers.forEach((layer) => {
      layer.items.forEach((s) => {
        s.y += layer.speed * scroll * dt;
        if (s.y > H + 4) { s.y = -4; s.x = rand(0, W); }
      });
    });
    clouds.forEach((c, i) => {
      c.y += c.speed * scroll * dt;
      if (c.y - c.w * 0.4 > H) clouds[i] = makeCloud(-c.w * 0.4);
    });

    ship.bob += dt;

    if (state === 'running') {
      elapsed += dt;
      score += 10 * dt;
      updateShip(dt);

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnHazard();
        if (elapsed > 35 && Math.random() < Math.min(0.35, (elapsed - 35) / 120)) spawnHazard();
        spawnTimer = diff.interval * rand(0.75, 1.25);
      }
      starTimer -= dt;
      if (starTimer <= 0) { spawnStar(); starTimer = rand(2.1, 3.6); }
      shieldTimer -= dt;
      if (shieldTimer <= 0) {
        if (!shield && !pickups.some((p) => p.type === 'shield')) spawnShield();
        shieldTimer = rand(15, 22);
      }
      if (diff.level !== lastLevel) {
        lastLevel = diff.level;
        floaters.push({ x: W / 2, y: H * 0.36, text: LEVEL_NAMES[diff.level], color: COLORS.cyan, life: 1.6, max: 1.6, size: 26 });
      }

      // Engine trail
      trailTimer -= dt;
      if (trailTimer <= 0) {
        trailTimer = reducedMotion ? 0.07 : 0.022;
        particles.push({ x: ship.x + rand(-12, 12), y: ship.y + 20, vx: rand(-20, 20) - ship.vx * 0.15, vy: rand(140, 220), life: 0.45, max: 0.45, r: rand(2, 4), color: Math.random() < 0.7 ? COLORS.cyan : COLORS.mint, drag: 1.2, trail: true });
      }
      if (invulnerable > 0) invulnerable -= dt;
    } else if (state === 'over') {
      overTimer += dt;
    } else {
      // Idle hover on the ready screen.
      ship.x += (W / 2 + Math.sin(worldTime * 0.9) * 60 - ship.x) * Math.min(1, dt * 2);
      ship.tilt = Math.cos(worldTime * 0.9) * 0.1;
      trailTimer -= dt;
      if (trailTimer <= 0) {
        trailTimer = reducedMotion ? 0.12 : 0.04;
        particles.push({ x: ship.x + rand(-10, 10), y: ship.y + 20, vx: rand(-16, 16), vy: rand(110, 170), life: 0.4, max: 0.4, r: rand(2, 3.5), color: COLORS.cyan, drag: 1.2, trail: true });
      }
    }

    // Hazards
    for (const h of hazards) {
      if (h.type === 'bolt' && h.warn > 0) {
        h.warn -= dt;
        h.flicker += dt;
        continue;
      }
      h.y += h.vy * dt;
      if (h.type === 'hail') h.x += h.vx * dt;
      if (h.type === 'debris') {
        h.spin += h.vr * dt;
        h.phase += dt * 2;
        h.x = h.baseX + Math.sin(h.phase) * h.sway;
      }
      if (h.type === 'bolt') h.flicker += dt;
      if (state === 'running' && !h.dead && hitsShip(h)) {
        if (invulnerable > 0) continue;
        if (shield) {
          shield = false;
          invulnerable = 1.1;
          h.dead = true;
          burst(h.x, Math.min(h.y, ship.y), [COLORS.mint, '#ffffff', COLORS.cyan], 34, 300, 0.7);
          rings.push({ x: ship.x, y: ship.y, r: 34, max: 110, life: 0.5, t: 0, color: COLORS.mint });
          floaters.push({ x: ship.x, y: ship.y - 52, text: 'SHIELD POP', color: COLORS.mint, life: 1, max: 1, size: 18 });
          if (!reducedMotion) shake = Math.max(shake, 7);
          updateStatus();
        } else {
          endRun();
          break;
        }
      }
    }
    hazards = hazards.filter((h) => !h.dead && h.y - (h.len || h.r * 2) < H + 40 && h.x > -80 && h.x < W + 80);

    // Pickups
    for (const p of pickups) {
      p.y += p.vy * dt;
      p.t += dt;
      p.spin += dt * 1.6;
      if (state !== 'running') continue;
      const dx = ship.x - p.x;
      const dy = ship.y - p.y;
      const reach = p.r + SHIP_HIT + 8;
      if (dx * dx + dy * dy < reach * reach) {
        p.dead = true;
        if (p.type === 'star') {
          stars += 1;
          score += 50;
          burst(p.x, p.y, [COLORS.gold, '#fff5c9', COLORS.orange], 22, 240, 0.65);
          floaters.push({ x: p.x, y: p.y - 18, text: '+50', color: COLORS.gold, life: 0.9, max: 0.9, size: 22 });
        } else {
          shield = true;
          burst(p.x, p.y, [COLORS.mint, '#ffffff', COLORS.cyan], 26, 260, 0.7);
          rings.push({ x: ship.x, y: ship.y, r: 20, max: 70, life: 0.45, t: 0, color: COLORS.mint });
          floaters.push({ x: p.x, y: p.y - 22, text: 'SHIELD UP', color: COLORS.mint, life: 1, max: 1, size: 18 });
          updateStatus();
        }
      }
    }
    pickups = pickups.filter((p) => !p.dead && p.y - p.r < H + 20);

    // Particles and effects
    for (const p of particles) {
      p.life -= dt;
      p.vx *= Math.exp(-dt * p.drag);
      p.vy *= Math.exp(-dt * p.drag * (p.trail ? 0.3 : 1));
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    particles = particles.filter((p) => p.life > 0);
    if (particles.length > 600) particles.splice(0, particles.length - 600);
    for (const f of floaters) { f.life -= dt; f.y -= 38 * dt; }
    floaters = floaters.filter((f) => f.life > 0);
    for (const r of rings) r.t += dt;
    rings = rings.filter((r) => r.t < r.life);
    shake = Math.max(0, shake - dt * 40);
    flash = Math.max(0, flash - dt * 2.4);

    if (state === 'running') {
      updateStats();
      if (Math.floor(elapsed * 4) !== Math.floor((elapsed - dt) * 4)) updateStatus();
    }
  }

  // Drawing
  function drawBackground() {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a2230');
    bg.addColorStop(0.55, '#07151c');
    bg.addColorStop(1, '#040c11');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Storm glow near the top grows with difficulty.
    const intensity = state === 'running' || state === 'over' ? Math.min(1, elapsed / 90) : 0;
    const storm = ctx.createRadialGradient(W / 2, -60, 20, W / 2, -60, 520);
    storm.addColorStop(0, `rgba(158,140,255,${0.16 + intensity * 0.14})`);
    storm.addColorStop(1, 'rgba(158,140,255,0)');
    ctx.fillStyle = storm;
    ctx.fillRect(0, 0, W, H);

    starLayers.forEach((layer) => {
      layer.items.forEach((s) => {
        const tw = reducedMotion ? 1 : 0.75 + Math.sin(worldTime * 2 + s.tw) * 0.25;
        ctx.globalAlpha = s.a * tw;
        ctx.fillStyle = '#dff8ff';
        ctx.fillRect(s.x, s.y, s.r, s.r * (layer.speed > 50 ? 2.4 : 1));
      });
    });
    ctx.globalAlpha = 1;

    clouds.forEach((c) => {
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.w * 0.5);
      g.addColorStop(0, `rgba(${c.hue},${c.alpha})`);
      g.addColorStop(1, `rgba(${c.hue},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w * 0.5, c.w * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Horizon glow behind the ship lane.
    const lane = ctx.createLinearGradient(0, H - 200, 0, H);
    lane.addColorStop(0, 'rgba(104,208,223,0)');
    lane.addColorStop(1, 'rgba(104,208,223,.12)');
    ctx.fillStyle = lane;
    ctx.fillRect(0, H - 200, W, 200);
    ctx.strokeStyle = 'rgba(104,208,223,.12)';
    ctx.setLineDash([6, 10]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(18, SHIP_Y + 42);
    ctx.lineTo(W - 18, SHIP_Y + 42);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawShip() {
    const bob = reducedMotion ? 0 : Math.sin(ship.bob * 3) * 2.5;
    ctx.save();
    ctx.translate(ship.x, ship.y + bob);
    ctx.rotate(ship.tilt);
    if (invulnerable > 0 && Math.floor(invulnerable * 12) % 2 === 0) ctx.globalAlpha = 0.5;

    // Engine glow
    const engine = ctx.createRadialGradient(0, 22, 0, 0, 22, 34);
    engine.addColorStop(0, 'rgba(139,207,155,.75)');
    engine.addColorStop(1, 'rgba(104,208,223,0)');
    ctx.fillStyle = engine;
    ctx.beginPath();
    ctx.ellipse(0, 24, 26, 18 + (reducedMotion ? 0 : Math.sin(ship.bob * 22) * 2), 0, 0, Math.PI * 2);
    ctx.fill();

    // Fins
    ctx.fillStyle = '#2f8fa0';
    ctx.beginPath();
    ctx.moveTo(-26, 12); ctx.lineTo(-40, 26); ctx.lineTo(-18, 22); ctx.closePath();
    ctx.moveTo(26, 12); ctx.lineTo(40, 26); ctx.lineTo(18, 22); ctx.closePath();
    ctx.fill();

    // Cloud body
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 24;
    const body = ctx.createLinearGradient(0, -28, 0, 24);
    body.addColorStop(0, '#ffffff');
    body.addColorStop(1, '#bfeff6');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(-17, 2, 15, 0, Math.PI * 2);
    ctx.arc(-2, -9, 19, 0, Math.PI * 2);
    ctx.arc(17, 1, 15, 0, Math.PI * 2);
    ctx.roundRect(-28, 0, 56, 20, 10);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Cockpit visor
    const visor = ctx.createLinearGradient(-12, -10, 12, 6);
    visor.addColorStop(0, '#0b3a48');
    visor.addColorStop(1, '#16566a');
    ctx.fillStyle = visor;
    ctx.beginPath();
    ctx.roundRect(-13, -6, 26, 11, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(104,208,223,.85)';
    ctx.beginPath();
    ctx.roundRect(-9, -4, 9, 3, 1.5);
    ctx.fill();
    // Hull stripe
    ctx.fillStyle = 'rgba(104,208,223,.55)';
    ctx.beginPath();
    ctx.roundRect(-20, 13, 40, 3, 1.5);
    ctx.fill();
    ctx.restore();

    if (shield) {
      const pulse = reducedMotion ? 0 : Math.sin(worldTime * 4) * 2;
      ctx.save();
      ctx.strokeStyle = 'rgba(139,207,155,.85)';
      ctx.lineWidth = 3;
      ctx.shadowColor = COLORS.mint;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(ship.x, ship.y + bob + 2, 42 + pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(139,207,155,.07)';
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ship.x, ship.y + bob + 2, 42 + pulse, Math.PI * 1.15, Math.PI * 1.45);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawHail(h) {
    ctx.save();
    // Motion streak
    const streak = ctx.createLinearGradient(h.x, h.y - h.r * 4, h.x, h.y);
    streak.addColorStop(0, 'rgba(104,208,223,0)');
    streak.addColorStop(1, 'rgba(104,208,223,.28)');
    ctx.fillStyle = streak;
    ctx.beginPath();
    ctx.moveTo(h.x - h.r * 0.7, h.y);
    ctx.lineTo(h.x - h.vx * 0.04, h.y - h.r * 4);
    ctx.lineTo(h.x + h.r * 0.7, h.y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 14;
    const g = ctx.createRadialGradient(h.x - h.r * 0.35, h.y - h.r * 0.35, h.r * 0.1, h.x, h.y, h.r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.55, '#bdeef6');
    g.addColorStop(1, '#4fa9bb');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBolt(h) {
    ctx.save();
    if (h.warn > 0) {
      const blink = reducedMotion ? 0.6 : 0.4 + Math.abs(Math.sin(h.flicker * 14)) * 0.6;
      const col = ctx.createLinearGradient(0, 0, 0, H);
      col.addColorStop(0, `rgba(242,199,92,${0.2 * blink})`);
      col.addColorStop(1, 'rgba(242,199,92,0)');
      ctx.fillStyle = col;
      ctx.fillRect(h.x - 14, 0, 28, H);
      ctx.globalAlpha = blink;
      ctx.fillStyle = COLORS.gold;
      ctx.shadowColor = COLORS.gold;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(h.x, 10);
      ctx.lineTo(h.x + 12, 32);
      ctx.lineTo(h.x - 12, 32);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#07151c';
      ctx.font = '900 15px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', h.x, 30);
      ctx.restore();
      return;
    }
    const top = h.y - h.len / 2;
    const step = h.len / (h.zig.length - 1);
    const path = () => {
      ctx.beginPath();
      h.zig.forEach((off, i) => {
        const px = h.x + off;
        const py = top + i * step;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
    };
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#f7e27a';
    ctx.shadowBlur = 22;
    ctx.strokeStyle = `rgba(242,199,92,${reducedMotion ? 0.8 : 0.6 + Math.abs(Math.sin(h.flicker * 30)) * 0.4})`;
    ctx.lineWidth = 8;
    path();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fffbe6';
    ctx.lineWidth = 3;
    path();
    ctx.stroke();
    ctx.restore();
  }

  function drawDebris(h) {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.spin);
    ctx.shadowColor = h.tint;
    ctx.shadowBlur = 16;
    const g = ctx.createLinearGradient(-h.r, -h.r, h.r, h.r);
    g.addColorStop(0, '#3a3550');
    g.addColorStop(1, '#151a26');
    ctx.fillStyle = g;
    ctx.beginPath();
    h.points.forEach((p, i) => {
      const a = (i / h.points.length) * Math.PI * 2;
      const px = Math.cos(a) * h.r * p;
      const py = Math.sin(a) * h.r * p;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = h.tint;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-h.r * 0.4, -h.r * 0.15);
    ctx.lineTo(h.r * 0.25, h.r * 0.2);
    ctx.stroke();
    ctx.restore();
  }

  function starPath(x, y, outer, inner, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? outer : inner;
      const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
      if (i === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
  }

  function drawPickup(p) {
    ctx.save();
    if (p.type === 'star') {
      const pulse = reducedMotion ? 1 : 1 + Math.sin(p.t * 5) * 0.08;
      const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.4);
      halo.addColorStop(0, 'rgba(242,199,92,.35)');
      halo.addColorStop(1, 'rgba(242,199,92,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(p.x - p.r * 2.4, p.y - p.r * 2.4, p.r * 4.8, p.r * 4.8);
      ctx.shadowColor = COLORS.gold;
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ffd96e';
      starPath(p.x, p.y, p.r * pulse, p.r * 0.45 * pulse, reducedMotion ? 0 : p.spin * 0.6);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.beginPath();
      ctx.arc(p.x - 2, p.y - 3, 2.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const wobble = reducedMotion ? 0 : Math.sin(p.t * 4) * 1.5;
      const g = ctx.createRadialGradient(p.x - 6, p.y - 6, 2, p.x, p.y, p.r + wobble);
      g.addColorStop(0, 'rgba(255,255,255,.55)');
      g.addColorStop(0.5, 'rgba(139,207,155,.2)');
      g.addColorStop(1, 'rgba(139,207,155,.45)');
      ctx.shadowColor = COLORS.mint;
      ctx.shadowBlur = 20;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + wobble, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.mint;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
      // Shield glyph
      ctx.fillStyle = '#e6fff0';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 9);
      ctx.lineTo(p.x + 8, p.y - 5);
      ctx.quadraticCurveTo(p.x + 7, p.y + 6, p.x, p.y + 10);
      ctx.quadraticCurveTo(p.x - 7, p.y + 6, p.x - 8, p.y - 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEffects() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max) * (p.trail ? 0.55 : 0.9);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.save();
    for (const r of rings) {
      const k = r.t / r.life;
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3 * (1 - k) + 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r + (r.max - r.r) * k, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    for (const f of floaters) {
      ctx.globalAlpha = Math.min(1, f.life / f.max * 1.6);
      ctx.font = `900 ${f.size}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = f.color;
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 12;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
  }

  function draw() {
    ctx.save();
    if (shake > 0 && !reducedMotion) ctx.translate(rand(-shake, shake) * 0.5, rand(-shake, shake) * 0.5);
    drawBackground();
    pickups.forEach(drawPickup);
    for (const h of hazards) {
      if (h.type === 'hail') drawHail(h);
      else if (h.type === 'bolt') drawBolt(h);
      else drawDebris(h);
    }
    drawEffects();
    if (state !== 'over') drawShip();
    ctx.restore();
    if (flash > 0) {
      ctx.fillStyle = `rgba(239,109,104,${flash * (reducedMotion ? 0.12 : 0.25)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // Loop
  function ensureLoop() {
    if (loopActive) return;
    loopActive = true;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function loop(now) {
    const dt = Math.min(0.033, Math.max(0, (now - last) / 1000) || 0);
    last = now;
    if (paused) { loopActive = false; draw(); return; }
    update(dt);
    draw();
    // Once a crash has finished playing out, leave the final frame up instead of animating behind
    // the result card; the ready screen keeps its idle hover unless reduced motion is requested.
    const settled = state === 'over' ? overTimer > 1.6 && !particles.length && !floaters.length && !rings.length && flash <= 0
      : state === 'ready' && reducedMotion;
    if (settled) { loopActive = false; return; }
    raf = requestAnimationFrame(loop);
  }

  function fitCanvas() {
    const cssWidth = canvas.getBoundingClientRect().width || W;
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

  // Input
  function pointerToX(event) {
    const rect = canvas.getBoundingClientRect();
    return ((event.clientX - rect.left) / (rect.width || W)) * W;
  }

  function releasePointer() {
    if (pointer.id !== null) {
      try { canvas.releasePointerCapture(pointer.id); } catch (_) {}
    }
    pointer.active = false;
    pointer.id = null;
    canvas.classList.remove('is-steering');
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button > 0) return;
    event.preventDefault();
    if (state !== 'running') startRun();
    else if (paused) resumeGame();
    pointer.active = true;
    pointer.id = event.pointerId;
    pointer.x = pointerToX(event);
    canvas.classList.add('is-steering');
    try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!pointer.active || event.pointerId !== pointer.id) return;
    pointer.x = pointerToX(event);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => {
    canvas.addEventListener(type, (event) => { if (event.pointerId === pointer.id) releasePointer(); });
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  startButton.addEventListener('click', (event) => { if (event.detail) startButton.blur(); primaryAction(); });
  restartButton.addEventListener('click', (event) => { if (event.detail) restartButton.blur(); startRun(); });

  function directionFor(event) {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === 'ArrowLeft' || key === 'a') return 'left';
    if (key === 'ArrowRight' || key === 'd') return 'right';
    return null;
  }

  window.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTypingTarget(event.target) || isActivatableTarget(event.target)) return;
    const dir = directionFor(event);
    if (dir) {
      if (state === 'running' && !paused) {
        keys[dir] = true;
        if (event.key.startsWith('Arrow')) event.preventDefault();
      }
      return;
    }
    if (event.repeat) {
      if (event.code === 'Space' && state === 'running') event.preventDefault();
      return;
    }
    if (event.code === 'Space' || event.key === 'Enter') {
      if (state !== 'running') { event.preventDefault(); startRun(); }
      else if (paused) { event.preventDefault(); resumeGame(); }
      else if (event.code === 'Space') event.preventDefault();
    } else if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
      if (state !== 'running') return;
      event.preventDefault();
      if (paused) resumeGame(); else pauseGame();
    }
  });
  window.addEventListener('keyup', (event) => {
    const dir = directionFor(event);
    if (dir) keys[dir] = false;
  });
  window.addEventListener('blur', () => { keys.left = false; keys.right = false; releasePointer(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });

  let fitFrame = 0;
  const scheduleFit = () => {
    cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(fitCanvas);
  };
  if (window.ResizeObserver) new ResizeObserver(scheduleFit).observe(stage);
  window.addEventListener('resize', scheduleFit);
  window.addEventListener('orientationchange', scheduleFit);

  updateBest();
  resetRun();
  updateButtons();
  fitCanvas();
  ensureLoop();
})();
