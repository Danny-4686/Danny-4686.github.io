(() => {
  const canvas = document.getElementById('launcherCanvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  if (window.matchMedia?.('(max-width: 700px)').matches) {
    canvas.width = 860;
    canvas.height = 630;
  }

  const W = canvas.width;
  const H = canvas.height;
  const GROUND_Y = H - 82;
  const EARTH_RADIUS = 31;
  const START_X = 102;
  const STORAGE_KEY = 'cloudlab-launcher-save-v1';
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const distanceEl = document.getElementById('distance');
  const bestEl = document.getElementById('bestDistance');
  const creditsEl = document.getElementById('credits');
  const bounceEl = document.getElementById('bounceCount');
  const velocityLabel = document.getElementById('velocityLabel');
  const phaseLabel = document.getElementById('phaseLabel');
  const ringLabel = document.getElementById('ringLabel');
  const boostLabel = document.getElementById('boostLabel');
  const powerValue = document.getElementById('powerValue');
  const powerFill = document.getElementById('powerFill');
  const launchButton = document.getElementById('launchButton');
  const boostButton = document.getElementById('boostButton');
  const endRunButton = document.getElementById('endRunButton');
  const angleButtons = document.getElementById('angleButtons');
  const message = document.getElementById('launcherMessage');
  const messageTitle = document.getElementById('launcherMessageTitle');
  const messageText = document.getElementById('launcherMessageText');
  const upgradeGrid = document.getElementById('launcherUpgradeGrid');
  const upgradeSummary = document.getElementById('upgradeSummary');
  const flightReport = document.getElementById('flightReport');
  const announcement = document.getElementById('launcherAnnouncement');
  const stage = document.getElementById('launcherStage');
  const toastLayer = document.getElementById('launcherToastLayer');

  const upgradeDefinitions = [
    { id: 'power', icon: '➤', name: 'Launch Power', baseCost: 120, max: 10, description: 'Adds 7.5% launch velocity per level.' },
    { id: 'bounce', icon: '⌁', name: 'Bounce Core', baseCost: 180, max: 10, description: 'Keeps more speed after every ground impact.' },
    { id: 'aero', icon: '◒', name: 'Aero Shell', baseCost: 260, max: 10, description: 'Reduces atmospheric drag during flight.' },
    { id: 'boost', icon: '✦', name: 'Rocket Burst', baseCost: 420, max: 8, description: 'Strengthens boosts and adds extra charges.' },
    { id: 'magnet', icon: '◇', name: 'Credit Magnet', baseCost: 220, max: 10, description: 'Increases every flight reward by 12%.' }
  ];

  const blankState = () => ({
    credits: 0,
    best: 0,
    levels: Object.fromEntries(upgradeDefinitions.map((upgrade) => [upgrade.id, 0]))
  });

  function finite(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : fallback;
  }

  function loadState() {
    const next = blankState();
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!raw || typeof raw !== 'object') return next;
      next.credits = Math.floor(finite(raw.credits));
      next.best = Math.floor(finite(raw.best));
      upgradeDefinitions.forEach((upgrade) => {
        next.levels[upgrade.id] = Math.min(upgrade.max, Math.floor(finite(raw.levels?.[upgrade.id])));
      });
    } catch (_) {}
    return next;
  }

  const earthImage = new Image();
  earthImage.decoding = 'async';
  earthImage.src = '/assets/images/memory/Earth.png';

  let save = loadState();
  let earth;
  let rings = [];
  let particles = [];
  let shockwaves = [];
  let floatingLabels = [];
  let cameraX = 0;
  let status = 'ready';
  let paused = false;
  let angle = 35;
  let power = .25;
  let chargeStartedAt = 0;
  let flightStartedAt = 0;
  let last = performance.now();
  let bounces = 0;
  let ringHits = 0;
  let boostsRemaining = 1;
  let farthestX = START_X;
  let ignoreClickUntil = 0;
  let settleTimer = 0;
  let airtime = 0;
  let rollingDistance = 0;
  let trailTimer = 0;
  let dustTimer = 0;
  let cameraShake = 0;
  let muzzleFlashUntil = 0;
  let perfectLaunch = false;

  function level(id) { return save.levels[id] || 0; }
  function upgradeCost(upgrade) { return Math.floor(upgrade.baseCost * Math.pow(1.72, level(upgrade.id))); }
  function distanceMeters() { return Math.max(0, Math.floor((farthestX - START_X) / 3)); }
  function currentDistanceMeters() { return Math.max(0, Math.floor((earth.x - START_X) / 3)); }
  function bounceRetention() { return Math.min(.88, .54 + level('bounce') * .034); }
  function groundRetention() { return Math.min(.94, .82 + level('bounce') * .011); }
  function airDrag() { return Math.max(.012, .058 * Math.pow(.86, level('aero'))); }
  function launchVelocity() { return 745 * (1 + level('power') * .075) * (.55 + power * .45); }
  function boostStrength() { return 145 * (1 + level('boost') * .18); }
  function boostCharges() { return 1 + Math.floor(level('boost') / 2); }
  function rewardMultiplier() { return 1 + level('magnet') * .12; }

  function format(value) { return Math.max(0, Math.floor(value || 0)).toLocaleString('en-US'); }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); } catch (_) {}
  }

  function announce(text) {
    announcement.textContent = '';
    window.setTimeout(() => { announcement.textContent = text; }, 20);
  }

  function showToast(title, detail, tone = 'cyan') {
    if (!toastLayer) return;
    const toast = document.createElement('div');
    toast.className = `launcher-toast tone-${tone}`;
    const icon = document.createElement('span');
    icon.textContent = tone === 'gold' ? '✦' : tone === 'mint' ? '✓' : '➤';
    const copy = document.createElement('div');
    const heading = document.createElement('strong');
    const description = document.createElement('small');
    heading.textContent = title;
    description.textContent = detail;
    copy.append(heading, description);
    toast.append(icon, copy);
    toastLayer.appendChild(toast);
    while (toastLayer.children.length > 3) toastLayer.firstElementChild?.remove();
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    window.setTimeout(() => {
      toast.classList.remove('is-visible');
      window.setTimeout(() => toast.remove(), 260);
    }, reducedMotion ? 1500 : 2700);
  }

  function flashStage(effect, duration = 420) {
    stage.classList.remove(effect);
    void stage.offsetWidth;
    stage.classList.add(effect);
    window.setTimeout(() => stage.classList.remove(effect), duration);
  }

  function addFloatingLabel(x, y, text, color = '#d8f8fb') {
    floatingLabels.push({ x, y, text, color, life: 1.15, maxLife: 1.15 });
  }

  function spawnShockwave(x, y, color = '#68d0df', size = 85) {
    shockwaves.push({ x, y, color, size, life: .72, maxLife: .72 });
  }

  function showMessage(title, text) {
    messageTitle.textContent = title;
    messageText.textContent = text;
    message.classList.remove('hidden');
  }

  function hideMessage() { message.classList.add('hidden'); }

  function createRings() {
    rings = Array.from({ length: 9 }, (_, index) => ({
      x: 520 + index * 520 + (index % 3) * 80,
      y: 105 + ((index * 127) % 245),
      hit: false
    }));
  }

  function updatePowerUi() {
    const percent = Math.round(power * 100);
    powerValue.textContent = `${percent}%`;
    powerFill.style.width = `${percent}%`;
  }

  function updateHud() {
    distanceEl.textContent = `${format(distanceMeters())} m`;
    bestEl.textContent = `${format(Math.max(save.best, distanceMeters()))} m`;
    creditsEl.textContent = format(save.credits);
    bounceEl.textContent = String(bounces);
    const velocity = earth ? (earth.grounded ? Math.abs(earth.vx) : Math.hypot(earth.vx, earth.vy)) / 3 : 0;
    velocityLabel.textContent = `${format(velocity)} m/s`;
    phaseLabel.textContent = status === 'charging' ? 'CHARGING' : status === 'flying' ? earth?.grounded ? 'ROLLING' : 'AIRBORNE' : status === 'landed' ? 'LANDED' : 'READY';
    ringLabel.textContent = `${ringHits} ${ringHits === 1 ? 'RING' : 'RINGS'}`;
    boostLabel.textContent = `${boostsRemaining} ${boostsRemaining === 1 ? 'BOOST' : 'BOOSTS'}`;
    boostButton.disabled = status !== 'flying' || paused || boostsRemaining <= 0;
    endRunButton.textContent = status === 'flying' ? 'End Run' : 'Reset Run';
    stage.dataset.phase = status === 'flying' && earth?.grounded ? 'rolling' : status;
  }

  function resetFlight() {
    earth = { x: START_X, y: EARTH_RADIUS, vx: 0, vy: 0, rotation: 0, grounded: false };
    cameraX = 0;
    status = 'ready';
    paused = false;
    power = .25;
    bounces = 0;
    ringHits = 0;
    boostsRemaining = boostCharges();
    farthestX = START_X;
    particles = [];
    shockwaves = [];
    floatingLabels = [];
    settleTimer = 0;
    airtime = 0;
    rollingDistance = 0;
    trailTimer = 0;
    dustTimer = 0;
    cameraShake = 0;
    perfectLaunch = false;
    createRings();
    launchButton.textContent = 'Hold to Charge';
    launchButton.classList.remove('is-charging');
    stage.classList.remove('is-perfect','is-boosting','is-impact');
    angleButtons.querySelectorAll('button').forEach((button) => { button.disabled = false; });
    showMessage('Prepare launch', 'Choose an angle, hold the launch button to charge, then release at the brightest point.');
    updatePowerUi();
    updateHud();
    refreshUpgrades();
  }

  function startCharge() {
    if (status !== 'ready') return;
    status = 'charging';
    chargeStartedAt = performance.now();
    launchButton.textContent = 'Release to Launch';
    launchButton.classList.add('is-charging');
    stage.dataset.phase = 'charging';
    angleButtons.querySelectorAll('button').forEach((button) => { button.disabled = true; });
    hideMessage();
    refreshUpgrades();
    updateHud();
  }

  function cancelCharge() {
    if (status !== 'charging') return;
    status = 'ready';
    power = .25;
    launchButton.textContent = 'Hold to Charge';
    launchButton.classList.remove('is-charging');
    angleButtons.querySelectorAll('button').forEach((button) => { button.disabled = false; });
    showMessage('Launch canceled', 'Hold the launch button again when you are ready.');
    updatePowerUi();
    updateHud();
    refreshUpgrades();
  }

  function launch() {
    if (status !== 'charging') return;
    perfectLaunch = power >= .84 && power <= .96;
    const velocity = launchVelocity() * (perfectLaunch ? 1.12 : 1);
    const radians = angle * Math.PI / 180;
    earth.vx = Math.cos(radians) * velocity;
    earth.vy = Math.sin(radians) * velocity;
    earth.rotation = 0;
    earth.grounded = false;
    status = 'flying';
    flightStartedAt = performance.now();
    launchButton.textContent = 'In Flight';
    launchButton.classList.remove('is-charging');
    boostsRemaining = boostCharges();
    spawnBurst(earth.x, earth.y, '#68d0df', 24, -1);
    spawnShockwave(START_X, EARTH_RADIUS, perfectLaunch ? '#f2c75c' : '#68d0df', perfectLaunch ? 130 : 95);
    addFloatingLabel(START_X + 35, EARTH_RADIUS + 78, perfectLaunch ? 'PERFECT LAUNCH +12%' : 'LAUNCH!', perfectLaunch ? '#ffe28d' : '#c9f7fb');
    muzzleFlashUntil = performance.now() + 260;
    cameraShake = perfectLaunch ? 10 : 6;
    flashStage(perfectLaunch ? 'is-perfect' : 'is-impact', perfectLaunch ? 700 : 360);
    if (perfectLaunch) showToast('Perfect launch', 'Precision charge granted +12% launch velocity.', 'gold');
    navigator.vibrate?.(perfectLaunch ? [24, 28, 38] : 22);
    hideMessage();
    refreshUpgrades();
    updateHud();
    announce(`Launched at ${angle} degrees and ${Math.round(power * 100)} percent power.`);
  }

  function useBoost() {
    if (status !== 'flying' || paused || boostsRemaining <= 0) return;
    const strength = boostStrength();
    earth.vx += strength;
    earth.vy = Math.max(earth.vy, earth.grounded ? 65 : earth.vy) + strength * .42;
    earth.grounded = false;
    settleTimer = 0;
    boostsRemaining -= 1;
    spawnBurst(earth.x, earth.y, '#f2c75c', 24, -1);
    spawnShockwave(earth.x, earth.y, '#f2c75c', 72);
    addFloatingLabel(earth.x, earth.y + 66, 'ROCKET BOOST', '#ffe28d');
    cameraShake = Math.max(cameraShake, 5);
    flashStage('is-boosting', 480);
    navigator.vibrate?.(16);
    updateHud();
    announce(`${boostsRemaining} ${boostsRemaining === 1 ? 'boost' : 'boosts'} remaining.`);
  }

  function finishFlight(endedEarly = false) {
    if (status !== 'flying') return;
    status = 'landed';
    earth.grounded = true;
    earth.vx = 0;
    earth.vy = 0;
    const distance = distanceMeters();
    const baseReward = Math.floor(distance * .65 + bounces * 8 + ringHits * 22);
    const reward = Math.max(1, Math.floor(baseReward * rewardMultiplier()));
    save.credits += reward;
    const newBest = distance > save.best;
    save.best = Math.max(save.best, distance);
    saveState();
    launchButton.textContent = 'New Flight';
    angleButtons.querySelectorAll('button').forEach((button) => { button.disabled = false; });
    showMessage(newBest ? 'New distance record!' : endedEarly ? 'Run ended' : 'Flight complete', `${format(distance)} m · ${bounces} ${bounces === 1 ? 'bounce' : 'bounces'} · ${ringHits} ${ringHits === 1 ? 'ring' : 'rings'} · +${format(reward)} credits`);
    flightReport.querySelector('p').textContent = `${format(distance)} m traveled · ${airtime.toFixed(1)}s airborne · ${format(rollingDistance)} m rolling · ${bounces} ${bounces === 1 ? 'bounce' : 'bounces'} · ${ringHits} sky ${ringHits === 1 ? 'ring' : 'rings'} · +${format(reward)} credits.`;
    addFloatingLabel(earth.x, earth.y + 68, `+${format(reward)} CREDITS`, '#9fe1ab');
    spawnShockwave(earth.x, EARTH_RADIUS, '#8bcf9b', 92);
    showToast(newBest ? 'New distance record' : endedEarly ? 'Run ended' : 'Earth settled', `${format(distance)} m · +${format(reward)} credits`, newBest ? 'gold' : 'mint');
    updateHud();
    refreshUpgrades();
    announce(`Flight complete. ${distance} meters and ${reward} credits earned.`);
  }

  function spawnBurst(x, y, color, amount = 14, direction = 0) {
    const count = reducedMotion ? Math.min(4, amount) : amount;
    for (let i = 0; i < count; i += 1) {
      const life = .55 + Math.random() * .45;
      particles.push({
        x,
        y,
        vx: direction * (80 + Math.random() * 180) + (Math.random() - .5) * 90,
        vy: 40 + Math.random() * 190,
        life,
        maxLife: life,
        size: 3 + Math.random() * 6,
        color,
        gravity: 330,
        drag: .35,
        glow: true
      });
    }
  }

  function spawnTrail(color = '#68d0df', dust = false) {
    if (reducedMotion) return;
    const life = dust ? .48 + Math.random() * .28 : .32 + Math.random() * .32;
    particles.push({
      x: earth.x - Math.sign(earth.vx || 1) * EARTH_RADIUS * .75,
      y: dust ? EARTH_RADIUS * .35 : earth.y,
      vx: -earth.vx * (dust ? .08 : .035) + (Math.random() - .5) * 30,
      vy: dust ? 18 + Math.random() * 50 : (Math.random() - .5) * 28,
      life,
      maxLife: life,
      size: dust ? 5 + Math.random() * 9 : 2 + Math.random() * 5,
      color,
      gravity: dust ? 80 : 0,
      drag: dust ? 1.4 : .7,
      glow: !dust
    });
  }

  function updateEffects(dt) {
    particles.forEach((particle) => {
      particle.vx *= Math.exp(-(particle.drag || 0) * dt);
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy -= (particle.gravity || 0) * dt;
      particle.life -= dt;
    });
    particles = particles.filter((particle) => particle.life > 0);
    shockwaves.forEach((wave) => { wave.life -= dt; });
    shockwaves = shockwaves.filter((wave) => wave.life > 0);
    floatingLabels.forEach((label) => {
      label.y += 30 * dt;
      label.life -= dt;
    });
    floatingLabels = floatingLabels.filter((label) => label.life > 0);
    cameraShake *= Math.exp(-8 * dt);
    if (cameraShake < .05) cameraShake = 0;
  }

  function collectRings() {
    rings.forEach((ring) => {
      if (ring.hit) return;
      const dx = earth.x - ring.x;
      const dy = earth.y - ring.y;
      if (dx * dx + dy * dy < 55 * 55) {
        ring.hit = true;
        ringHits += 1;
        earth.vx += 65;
        earth.vy += 34;
        spawnBurst(ring.x, ring.y, '#f2c75c', 20, 0);
        spawnShockwave(ring.x, ring.y, '#f2c75c', 108);
        addFloatingLabel(ring.x, ring.y + 58, `RING +${ringHits}`, '#ffe28d');
        cameraShake = Math.max(cameraShake, 3);
        flashStage('is-ring', 420);
        navigator.vibrate?.(10);
        updateHud();
        announce(`Sky ring ${ringHits} collected.`);
      }
    });
  }

  function update(dt, now) {
    updateEffects(dt);
    if (status === 'charging') {
      const cycle = ((now - chargeStartedAt) % 1800) / 1800;
      const triangle = cycle < .5 ? cycle * 2 : (1 - cycle) * 2;
      power = .25 + triangle * .75;
      updatePowerUi();
      return;
    }
    if (status !== 'flying' || paused) return;

    if (earth.grounded) {
      const before = earth.x;
      const speed = Math.abs(earth.vx);
      const lowSpeedFriction = Math.max(0, (105 - speed) / 105) * 1.05;
      earth.vx *= Math.exp(-(.42 + lowSpeedFriction) * dt);
      earth.x += earth.vx * dt;
      earth.y = EARTH_RADIUS;
      earth.rotation += earth.vx * dt / EARTH_RADIUS;
      rollingDistance += Math.abs(earth.x - before) / 3;
      farthestX = Math.max(farthestX, earth.x);
      dustTimer -= dt;
      if (speed > 7 && dustTimer <= 0) {
        dustTimer = Math.max(.025, .11 - Math.min(80, speed) / 1100);
        spawnTrail('#8bcf9b', true);
      }
      if (speed < 5) settleTimer += dt;
      else settleTimer = 0;
      if (settleTimer >= .72) {
        finishFlight(false);
        return;
      }
    } else {
      const gravity = 660;
      airtime += dt;
      earth.vy -= gravity * dt;
      earth.vx *= Math.exp(-airDrag() * dt);
      earth.x += earth.vx * dt;
      earth.y += earth.vy * dt;
      earth.rotation += earth.vx * dt / EARTH_RADIUS;
      farthestX = Math.max(farthestX, earth.x);
      trailTimer -= dt;
      if (trailTimer <= 0 && Math.hypot(earth.vx, earth.vy) > 190) {
        trailTimer = perfectLaunch ? .025 : .045;
        spawnTrail(perfectLaunch ? '#f2c75c' : '#68d0df', false);
      }

      if (earth.y <= EARTH_RADIUS && earth.vy < 0) {
        const impact = -earth.vy;
        earth.y = EARTH_RADIUS;
        const minimumBounce = Math.max(46, 68 - level('bounce') * 1.6);
        if (impact > minimumBounce && earth.vx > 26 && bounces < 40) {
          earth.vy = impact * bounceRetention();
          earth.vx *= groundRetention();
          bounces += 1;
          cameraShake = Math.min(12, 3 + impact / 75);
          spawnBurst(earth.x, earth.y, '#8bcf9b', 20, -1);
          spawnShockwave(earth.x, EARTH_RADIUS, '#8bcf9b', Math.min(145, 72 + impact * .15));
          addFloatingLabel(earth.x, EARTH_RADIUS + 72, `BOUNCE ${bounces}`, '#a9ebb5');
          flashStage('is-impact', 350);
          navigator.vibrate?.(Math.min(30, Math.round(impact / 20)));
          announce(`Bounce ${bounces}.`);
        } else if (Math.abs(earth.vx) > 5) {
          earth.vy = 0;
          earth.vx *= .985;
          earth.grounded = true;
          settleTimer = 0;
          cameraShake = Math.max(cameraShake, 2.5);
          spawnBurst(earth.x, earth.y, '#8bcf9b', 10, -1);
          spawnShockwave(earth.x, EARTH_RADIUS, '#8bcf9b', 70);
          addFloatingLabel(earth.x, EARTH_RADIUS + 68, 'ROLLING', '#bcefc6');
          showToast('Touchdown', 'The Earth will keep rolling until it naturally settles.', 'mint');
          updateHud();
        } else {
          earth.vx = 0;
          earth.vy = 0;
          earth.grounded = true;
          settleTimer = .72;
        }
      }
      collectRings();
    }

    const targetCamera = Math.max(0, earth.x - W * .28);
    cameraX += (targetCamera - cameraX) * Math.min(1, dt * 4.2);
    if (now - flightStartedAt > 90000) finishFlight(false);
    updateHud();
  }

  function worldToScreenX(x) { return x - cameraX; }
  function worldToScreenY(y) { return GROUND_Y - y; }

  function drawSky(now) {
    const horizonShift = Math.min(1, distanceMeters() / 2200);
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, horizonShift > .7 ? '#25284e' : '#0e3c51');
    gradient.addColorStop(.52, horizonShift > .7 ? '#16364a' : '#092734');
    gradient.addColorStop(1, '#06151d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    if (horizonShift > 0) {
      const sunset = ctx.createRadialGradient(W * .78, H * .5, 10, W * .78, H * .5, W * .75);
      sunset.addColorStop(0, `rgba(242,199,92,${horizonShift * .17})`);
      sunset.addColorStop(.48, `rgba(119,85,151,${horizonShift * .09})`);
      sunset.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sunset;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (let i = 0; i < 58; i += 1) {
      const layer = .03 + (i % 4) * .018;
      const x = ((i * 193 - cameraX * layer) % (W + 80) + W + 80) % (W + 80) - 40;
      const y = 25 + ((i * 131) % (H - 180));
      const size = i % 9 === 0 ? 2.2 : 1.1;
      ctx.globalAlpha = .3 + (i % 5) * .1;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    for (let index = 0; index < 9; index += 1) {
      const layer = .07 + (index % 3) * .035;
      const x = ((index * 311 - cameraX * layer) % (W + 280) + W + 280) % (W + 280) - 140;
      const y = 105 + (index * 97) % 225;
      const scale = .7 + (index % 4) * .18;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = `rgba(190,232,238,${.035 + (index % 3) * .018})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 70, 19, 0, 0, Math.PI * 2);
      ctx.ellipse(-28, -9, 30, 23, 0, 0, Math.PI * 2);
      ctx.ellipse(15, -13, 38, 29, 0, 0, Math.PI * 2);
      ctx.ellipse(48, -5, 28, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const sunX = W - 112 - (cameraX * .018) % 180;
    ctx.save();
    ctx.shadowColor = 'rgba(242,199,92,.42)';
    ctx.shadowBlur = 40;
    ctx.fillStyle = '#f6df93';
    ctx.beginPath();
    ctx.arc(sunX, 105, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(79,145,157,.19)';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= W + 80; x += 80) {
      const world = x + cameraX * .18;
      const y = GROUND_Y - 70 - Math.sin(world / 230) * 38 - Math.sin(world / 89) * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    if (!reducedMotion && status === 'flying' && !earth.grounded) {
      const speed = Math.min(1, Math.hypot(earth.vx, earth.vy) / 900);
      ctx.strokeStyle = `rgba(190,242,248,${.05 + speed * .18})`;
      ctx.lineWidth = 1.5 + speed * 2;
      for (let i = 0; i < 9; i += 1) {
        const y = 65 + i * 54 + Math.sin(now / 500 + i) * 9;
        const length = 90 + speed * 260 + (i % 3) * 35;
        ctx.beginPath();
        ctx.moveTo(W - ((now * (.08 + speed * .24) + i * 173) % (W + length)), y);
        ctx.lineTo(W - ((now * (.08 + speed * .24) + i * 173) % (W + length)) + length, y - 14);
        ctx.stroke();
      }
    }
  }

  function drawGround() {
    const groundGradient = ctx.createLinearGradient(0, GROUND_Y, 0, H);
    groundGradient.addColorStop(0, '#2d6870');
    groundGradient.addColorStop(.08, '#163943');
    groundGradient.addColorStop(1, '#07151c');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.fillStyle = '#77c992';
    ctx.fillRect(0, GROUND_Y, W, 5);

    ctx.strokeStyle = 'rgba(104,208,223,.055)';
    ctx.lineWidth = 1;
    const tileOffset = -((cameraX * .82) % 54);
    for (let x = tileOffset; x < W + 54; x += 54) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 7);
      ctx.lineTo(x - 28, H);
      ctx.stroke();
    }

    const firstMarker = Math.floor(cameraX / 300) * 300;
    ctx.font = '800 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (let worldX = firstMarker; worldX < cameraX + W + 300; worldX += 300) {
      if (worldX < START_X) continue;
      const x = worldToScreenX(worldX);
      const meters = Math.max(0, Math.floor((worldX - START_X) / 3));
      ctx.strokeStyle = 'rgba(104,208,223,.22)';
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x, GROUND_Y + 18);
      ctx.stroke();
      ctx.fillStyle = 'rgba(191,231,237,.55)';
      ctx.fillText(`${meters} m`, x, GROUND_Y + 35);
    }
  }

  function drawLauncher() {
    const x = worldToScreenX(START_X - 34);
    if (x < -160 || x > W + 160) return;
    ctx.save();
    ctx.translate(x, GROUND_Y - 6);
    ctx.fillStyle = '#173c48';
    ctx.strokeStyle = 'rgba(104,208,223,.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-54, -34, 108, 34, 13);
    ctx.fill();
    ctx.stroke();
    ctx.rotate(-angle * Math.PI / 180);
    const barrelGradient = ctx.createLinearGradient(0, 0, 104, 0);
    barrelGradient.addColorStop(0, '#236579');
    barrelGradient.addColorStop(1, '#6fd1df');
    ctx.fillStyle = barrelGradient;
    ctx.beginPath();
    ctx.roundRect(0, -24, 112, 48, 18);
    ctx.fill();
    if (performance.now() < muzzleFlashUntil) {
      const strength = Math.max(0, (muzzleFlashUntil - performance.now()) / 260);
      const flash = ctx.createRadialGradient(120, 0, 2, 120, 0, 44 + strength * 30);
      flash.addColorStop(0, '#fff7cf');
      flash.addColorStop(.25, perfectLaunch ? '#f2c75c' : '#68d0df');
      flash.addColorStop(1, 'rgba(104,208,223,0)');
      ctx.fillStyle = flash;
      ctx.beginPath();
      ctx.arc(120, 0, 52 + strength * 22, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTrajectory() {
    if (status !== 'ready' && status !== 'charging') return;
    const previewVelocity = launchVelocity();
    const radians = angle * Math.PI / 180;
    const vx = Math.cos(radians) * previewVelocity;
    const vy = Math.sin(radians) * previewVelocity;
    ctx.fillStyle = 'rgba(208,248,252,.42)';
    for (let i = 1; i <= 18; i += 1) {
      const t = i * .105;
      const x = START_X + vx * t;
      const y = EARTH_RADIUS + vy * t - .5 * 660 * t * t;
      if (y < 0) break;
      ctx.globalAlpha = 1 - i / 22;
      ctx.beginPath();
      ctx.arc(worldToScreenX(x), worldToScreenY(y), 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawRings(now) {
    rings.forEach((ring, index) => {
      if (ring.hit) return;
      const x = worldToScreenX(ring.x);
      const y = worldToScreenY(ring.y);
      if (x < -80 || x > W + 80) return;
      ctx.save();
      ctx.translate(x, y);
      const pulse = reducedMotion ? 1 : 1 + Math.sin(now / 420 + index) * .08;
      ctx.scale(pulse, pulse);
      ctx.shadowColor = '#f2c75c';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#f2c75c';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,245,195,.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 30, -.9, .4);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawEarth() {
    const x = worldToScreenX(earth.x);
    const y = worldToScreenY(earth.y);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(earth.rotation);
    ctx.shadowColor = 'rgba(104,208,223,.5)';
    ctx.shadowBlur = status === 'flying' ? 28 : 16;
    if (earthImage.complete && earthImage.naturalWidth) {
      ctx.drawImage(earthImage, -EARTH_RADIUS, -EARTH_RADIUS, EARTH_RADIUS * 2, EARTH_RADIUS * 2);
    } else {
      const gradient = ctx.createRadialGradient(-8, -10, 2, 0, 0, EARTH_RADIUS);
      gradient.addColorStop(0, '#9ce8ef');
      gradient.addColorStop(1, '#368fa3');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, EARTH_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEarthShadow() {
    if (!earth) return;
    const height = Math.max(0, earth.y - EARTH_RADIUS);
    const opacity = Math.max(.04, .3 - height / 1150);
    const scale = Math.max(.22, 1 - height / 850);
    ctx.save();
    ctx.translate(worldToScreenX(earth.x), GROUND_Y + 3);
    ctx.scale(scale, scale);
    ctx.fillStyle = `rgba(0,0,0,${opacity})`;
    ctx.filter = `blur(${Math.min(13, 3 + height / 80)}px)`;
    ctx.beginPath();
    ctx.ellipse(0, 0, EARTH_RADIUS * 1.2, EARTH_RADIUS * .28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    particles.forEach((particle) => {
      const x = worldToScreenX(particle.x);
      const y = worldToScreenY(particle.y);
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.fillStyle = particle.color;
      if (particle.glow) {
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 12;
      }
      ctx.beginPath();
      ctx.arc(x, y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;
  }

  function drawShockwaves() {
    shockwaves.forEach((wave) => {
      const progress = 1 - wave.life / wave.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, (1 - progress) * .72);
      ctx.strokeStyle = wave.color;
      ctx.lineWidth = Math.max(1, 5 * (1 - progress));
      ctx.shadowColor = wave.color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(worldToScreenX(wave.x), worldToScreenY(wave.y), wave.size * progress, wave.size * progress * .3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawFloatingLabels() {
    floatingLabels.forEach((label) => {
      const progress = 1 - label.life / label.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.min(1, label.life * 2.2) * Math.min(1, progress * 5);
      ctx.fillStyle = label.color;
      ctx.shadowColor = 'rgba(0,0,0,.65)';
      ctx.shadowBlur = 8;
      ctx.font = '900 15px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label.text, worldToScreenX(label.x), worldToScreenY(label.y + progress * 35));
      ctx.restore();
    });
  }

  function draw(now) {
    ctx.save();
    if (cameraShake > 0 && !reducedMotion) ctx.translate((Math.random() - .5) * cameraShake, (Math.random() - .5) * cameraShake * .65);
    drawSky(now);
    drawGround();
    drawLauncher();
    drawTrajectory();
    drawRings(now);
    drawEarthShadow();
    drawShockwaves();
    drawParticles();
    drawEarth();
    drawFloatingLabels();
    ctx.restore();
  }

  function renderUpgrades() {
    upgradeGrid.replaceChildren();
    upgradeDefinitions.forEach((upgrade) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'launcher-upgrade-card';
      button.dataset.upgrade = upgrade.id;
      const icon = document.createElement('span');
      icon.className = 'upgrade-icon';
      icon.textContent = upgrade.icon;
      const title = document.createElement('strong');
      title.textContent = upgrade.name;
      const description = document.createElement('p');
      description.textContent = upgrade.description;
      const levels = document.createElement('span');
      levels.className = 'upgrade-levels';
      levels.dataset.role = 'upgrade-levels';
      for (let index = 0; index < upgrade.max; index += 1) levels.appendChild(document.createElement('i'));
      const cost = document.createElement('span');
      cost.dataset.role = 'upgrade-cost';
      button.append(icon, title, description, levels, cost);
      button.addEventListener('click', () => buyUpgrade(upgrade));
      upgradeGrid.appendChild(button);
    });
  }

  function refreshUpgrades() {
    let installed = 0;
    upgradeGrid.querySelectorAll('[data-upgrade]').forEach((button) => {
      const upgrade = upgradeDefinitions.find((item) => item.id === button.dataset.upgrade);
      const current = level(upgrade.id);
      installed += current;
      const maxed = current >= upgrade.max;
      const cost = maxed ? 0 : upgradeCost(upgrade);
      button.classList.toggle('is-max', maxed);
      button.disabled = status === 'flying' || status === 'charging' || maxed || save.credits < cost;
      button.querySelector('[data-role="upgrade-cost"]').textContent = maxed ? `MAX LEVEL ${upgrade.max}` : `LEVEL ${current} · ${format(cost)} CREDITS`;
      button.querySelectorAll('[data-role="upgrade-levels"] i').forEach((pip, index) => pip.classList.toggle('is-filled', index < current));
      button.setAttribute('aria-label', `${upgrade.name}. Level ${current} of ${upgrade.max}.${maxed ? ' Maximum level.' : ` Upgrade for ${cost} credits.`}`);
    });
    upgradeSummary.textContent = `${installed} ${installed === 1 ? 'upgrade' : 'upgrades'} installed`;
  }

  function buyUpgrade(upgrade) {
    const current = level(upgrade.id);
    if (current >= upgrade.max || status === 'flying' || status === 'charging') return;
    const cost = upgradeCost(upgrade);
    if (save.credits < cost) return;
    save.credits -= cost;
    save.levels[upgrade.id] += 1;
    saveState();
    boostsRemaining = boostCharges();
    updateHud();
    refreshUpgrades();
    const button = upgradeGrid.querySelector(`[data-upgrade="${upgrade.id}"]`);
    button?.classList.remove('just-upgraded');
    void button?.offsetWidth;
    button?.classList.add('just-upgraded');
    window.setTimeout(() => button?.classList.remove('just-upgraded'), 850);
    flashStage('is-upgraded', 560);
    showToast('Upgrade installed', `${upgrade.name} is now level ${save.levels[upgrade.id]}.`, 'mint');
    navigator.vibrate?.(12);
    announce(`${upgrade.name} upgraded to level ${save.levels[upgrade.id]}.`);
  }

  function loop(now) {
    const dt = Math.min(.024, Math.max(0, (now - last) / 1000 || 0));
    last = now;
    update(dt, now);
    draw(now);
    requestAnimationFrame(loop);
  }

  angleButtons.addEventListener('click', (event) => {
    const button = event.target.closest('[data-angle]');
    if (!button || button.disabled || status !== 'ready') return;
    angle = Number(button.dataset.angle);
    angleButtons.querySelectorAll('[data-angle]').forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
  });

  launchButton.addEventListener('pointerdown', (event) => {
    if (status !== 'ready') return;
    event.preventDefault();
    launchButton.setPointerCapture?.(event.pointerId);
    startCharge();
  });
  launchButton.addEventListener('pointerup', (event) => {
    if (status !== 'charging') return;
    event.preventDefault();
    ignoreClickUntil = performance.now() + 420;
    launch();
  });
  launchButton.addEventListener('pointercancel', cancelCharge);
  launchButton.addEventListener('click', () => {
    if (performance.now() < ignoreClickUntil) return;
    if (status === 'ready') startCharge();
    else if (status === 'charging') launch();
    else if (status === 'landed') resetFlight();
  });
  boostButton.addEventListener('click', useBoost);
  endRunButton.addEventListener('click', () => {
    if (status === 'flying') finishFlight(true);
    else resetFlight();
  });
  stage.addEventListener('pointerdown', (event) => {
    if (status !== 'flying' || event.target.closest('button')) return;
    event.preventDefault();
    useBoost();
  });

  window.addEventListener('keydown', (event) => {
    if (event.code !== 'Space' || event.repeat) return;
    event.preventDefault();
    if (status === 'flying') useBoost();
    else if (status === 'ready') startCharge();
  });
  window.addEventListener('keyup', (event) => {
    if (event.code !== 'Space') return;
    event.preventDefault();
    if (status === 'charging') launch();
  });
  document.addEventListener('visibilitychange', () => {
    last = performance.now();
    if (document.hidden) {
      if (status === 'charging') cancelCharge();
      if (status === 'flying' && !paused) {
        paused = true;
        showMessage('Flight paused', 'Return to this tab to continue from the same position.');
      }
    } else if (status === 'flying' && paused) {
      paused = false;
      hideMessage();
    }
    updateHud();
  });
  window.addEventListener('pagehide', saveState);

  renderUpgrades();
  resetFlight();
  requestAnimationFrame(loop);
})();
