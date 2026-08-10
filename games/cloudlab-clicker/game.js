(() => {
  const STORAGE_KEY = 'cloudlab-clicker-save-v1';
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const cloudCount = document.getElementById('cloudCount');
  const cloudRate = document.getElementById('cloudRate');
  const allTime = document.getElementById('allTime');
  const cloudCore = document.getElementById('cloudCore');
  const coreValue = document.getElementById('coreValue');
  const particleLayer = document.getElementById('particleLayer');
  const comboValue = document.getElementById('comboValue');
  const comboFill = document.getElementById('comboFill');
  const buildingList = document.getElementById('buildingList');
  const boostList = document.getElementById('boostList');
  const boostCount = document.getElementById('boostCount');
  const achievementList = document.getElementById('achievementList');
  const productionStatus = document.getElementById('productionStatus');
  const saveStatus = document.getElementById('saveStatus');
  const announcement = document.getElementById('clickerAnnouncement');
  const buyModes = document.getElementById('buyModes');

  if (!cloudCore || !buildingList || !boostList) return;

  const buildings = [
    { id: 'drone', icon: '⌁', name: 'Cursor Drone', baseCost: 15, cps: .1, description: 'A tiny drone taps the Core for you.' },
    { id: 'farm', icon: '☁', name: 'Cloud Farm', baseCost: 100, cps: 1, description: 'Grows fresh Clouds in controlled sky fields.' },
    { id: 'station', icon: '⌾', name: 'Weather Station', baseCost: 1100, cps: 8, description: 'Turns pressure data into steady production.' },
    { id: 'factory', icon: '▦', name: 'Sky Factory', baseCost: 12000, cps: 47, description: 'Builds Clouds at industrial scale.' },
    { id: 'bank', icon: '◇', name: 'Orbit Bank', baseCost: 130000, cps: 260, description: 'Compounds condensed cloud energy.' },
    { id: 'portal', icon: '◎', name: 'CloudLab Portal', baseCost: 1400000, cps: 1400, description: 'Imports Clouds from neighboring skies.' },
    { id: 'foundry', icon: '✦', name: 'Star Foundry', baseCost: 20000000, cps: 7800, description: 'Forges entire weather systems from starlight.' }
  ];

  const boosts = [
    { id: 'tap-array', name: 'Reinforced Touch', cost: 200, description: 'Double every manual Core press.' },
    { id: 'static-charge', name: 'Static Charge', cost: 3500, description: 'Triple tap power again and improve critical surges.' },
    { id: 'drone-sync', name: 'Drone Synchronizer', cost: 12000, description: 'Double Cursor Drone and Cloud Farm production.' },
    { id: 'weather-ai', name: 'Weather Intelligence', cost: 100000, description: 'Double Weather Station and Sky Factory output.' },
    { id: 'golden-core', name: 'Golden Core', cost: 1000000, description: 'Critical presses become much more common and powerful.' },
    { id: 'quantum-network', name: 'Quantum Network', cost: 8000000, description: 'Double all automatic Cloud production.' }
  ];

  const achievements = [
    { id: 'first-front', title: 'First Front', target: 100, label: '100 Clouds' },
    { id: 'sky-builder', title: 'Sky Builder', target: 10000, label: '10K Clouds' },
    { id: 'cloud-city', title: 'Cloud City', target: 1000000, label: '1M Clouds' },
    { id: 'weather-legend', title: 'Weather Legend', target: 1000000000, label: '1B Clouds' }
  ];

  const blankState = () => ({
    clouds: 0,
    total: 0,
    clicks: 0,
    counts: Object.fromEntries(buildings.map((item) => [item.id, 0])),
    boosts: [],
    achievements: []
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
      next.clouds = finite(raw.clouds);
      next.total = finite(raw.total);
      next.clicks = Math.floor(finite(raw.clicks));
      buildings.forEach((building) => {
        next.counts[building.id] = Math.floor(finite(raw.counts?.[building.id]));
      });
      next.boosts = Array.isArray(raw.boosts) ? [...new Set(raw.boosts.filter((id) => boosts.some((boost) => boost.id === id)))] : [];
      next.achievements = Array.isArray(raw.achievements) ? [...new Set(raw.achievements.filter((id) => achievements.some((achievement) => achievement.id === id)))] : [];
    } catch (_) {}
    return next;
  }

  let state = loadState();
  let combo = 0;
  let lastClickAt = 0;
  let buyMode = '1';
  let lastFrame = performance.now();
  let lastShopRefresh = 0;
  let saveTimer = 0;

  function format(value) {
    const number = Math.max(0, Number(value) || 0);
    if (number < 1000) return number < 10 && number % 1 ? number.toFixed(1) : Math.floor(number).toLocaleString('en-US');
    const units = [
      [1e18, 'Qi'], [1e15, 'Qa'], [1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']
    ];
    const unit = units.find(([size]) => number >= size);
    if (!unit) return Math.floor(number).toLocaleString('en-US');
    const scaled = number / unit[0];
    return `${scaled >= 100 ? scaled.toFixed(0) : scaled >= 10 ? scaled.toFixed(1) : scaled.toFixed(2)}${unit[1]}`;
  }

  function owns(id) { return state.boosts.includes(id); }

  function clickPower() {
    let value = 1;
    if (owns('tap-array')) value *= 2;
    if (owns('static-charge')) value *= 3;
    return value;
  }

  function buildingMultiplier(id) {
    let value = 1;
    if (owns('drone-sync') && (id === 'drone' || id === 'farm')) value *= 2;
    if (owns('weather-ai') && (id === 'station' || id === 'factory')) value *= 2;
    if (owns('quantum-network')) value *= 2;
    return value;
  }

  function cps() {
    return buildings.reduce((total, building) => total + state.counts[building.id] * building.cps * buildingMultiplier(building.id), 0);
  }

  function comboMultiplier() { return 1 + Math.min(2, combo * .04); }
  function criticalChance() { return owns('golden-core') ? .16 : owns('static-charge') ? .08 : .05; }
  function criticalMultiplier() { return owns('golden-core') ? 8 : 5; }

  function unitCost(building, ownedCount) {
    return Math.max(1, Math.ceil(building.baseCost * Math.pow(1.15, ownedCount)));
  }

  function purchaseQuote(building) {
    const owned = state.counts[building.id];
    const requested = buyMode === 'max' ? 10000 : Number(buyMode);
    let amount = 0;
    let cost = 0;
    while (amount < requested) {
      const next = unitCost(building, owned + amount);
      if (cost + next > state.clouds) break;
      cost += next;
      amount += 1;
    }
    if (buyMode !== 'max' && amount < requested) {
      amount = requested;
      cost = 0;
      for (let i = 0; i < requested; i += 1) cost += unitCost(building, owned + i);
    }
    return { amount, cost };
  }

  function save(showMessage = false) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (showMessage) {
        saveStatus.textContent = 'Progress saved on this device.';
        window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(() => { saveStatus.textContent = 'Progress saves automatically on this device.'; }, 2600);
      }
    } catch (_) {
      if (showMessage) saveStatus.textContent = 'This browser could not save progress.';
    }
  }

  function announce(text) {
    announcement.textContent = '';
    window.setTimeout(() => { announcement.textContent = text; }, 20);
  }

  function unlockAchievements() {
    let changed = false;
    achievements.forEach((achievement) => {
      if (state.total >= achievement.target && !state.achievements.includes(achievement.id)) {
        state.achievements.push(achievement.id);
        changed = true;
        announce(`${achievement.title} milestone unlocked.`);
      }
    });
    if (changed) {
      renderAchievements();
      save(false);
    }
  }

  function renderStats() {
    cloudCount.textContent = format(state.clouds);
    cloudRate.textContent = format(cps());
    allTime.textContent = format(state.total);
    coreValue.textContent = `+${format(clickPower())}`;
    comboValue.textContent = `${comboMultiplier().toFixed(2)}×`;
    comboFill.style.width = `${Math.min(100, combo * 2)}%`;
  }

  function createParticle(value, critical) {
    const particle = document.createElement('span');
    particle.className = `click-particle${critical ? ' critical' : ''}`;
    particle.textContent = `${critical ? 'CRIT ' : ''}+${format(value)}`;
    particle.style.setProperty('--drift', `${(Math.random() - .5) * 100}px`);
    particle.style.left = `${40 + Math.random() * 20}%`;
    particleLayer.appendChild(particle);
    window.setTimeout(() => particle.remove(), reducedMotion ? 120 : 950);
  }

  function pressCore() {
    const now = performance.now();
    combo = now - lastClickAt < 1100 ? Math.min(50, combo + 1) : 1;
    lastClickAt = now;
    const critical = Math.random() < criticalChance();
    const gain = clickPower() * comboMultiplier() * (critical ? criticalMultiplier() : 1);
    state.clouds += gain;
    state.total += gain;
    state.clicks += 1;
    cloudCore.classList.remove('is-pressed', 'is-critical');
    void cloudCore.offsetWidth;
    cloudCore.classList.add('is-pressed');
    if (critical) cloudCore.classList.add('is-critical');
    window.setTimeout(() => cloudCore.classList.remove('is-pressed', 'is-critical'), 180);
    if (!reducedMotion) createParticle(gain, critical);
    renderStats();
    refreshShop();
    unlockAchievements();
  }

  function renderBuildings() {
    buildingList.replaceChildren();
    buildings.forEach((building) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'building-card';
      button.dataset.building = building.id;
      const icon = document.createElement('span');
      icon.className = 'building-icon';
      icon.textContent = building.icon;
      const copy = document.createElement('span');
      copy.className = 'building-copy';
      const title = document.createElement('strong');
      title.textContent = building.name;
      const description = document.createElement('small');
      description.textContent = building.description;
      copy.append(title, description);
      const price = document.createElement('span');
      price.className = 'building-price';
      const amount = document.createElement('strong');
      amount.dataset.role = 'price';
      const output = document.createElement('small');
      output.dataset.role = 'output';
      price.append(amount, output);
      button.append(icon, copy, price);
      button.addEventListener('click', () => buyBuilding(building));
      buildingList.appendChild(button);
    });
  }

  function renderBoosts() {
    boostList.replaceChildren();
    boosts.forEach((boost) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'boost-card';
      button.dataset.boost = boost.id;
      const title = document.createElement('strong');
      title.textContent = boost.name;
      const description = document.createElement('p');
      description.textContent = boost.description;
      const cost = document.createElement('span');
      cost.dataset.role = 'boost-cost';
      button.append(title, description, cost);
      button.addEventListener('click', () => buyBoost(boost));
      boostList.appendChild(button);
    });
  }

  function renderAchievements() {
    achievementList.replaceChildren();
    achievements.forEach((achievement) => {
      const item = document.createElement('div');
      const unlocked = state.achievements.includes(achievement.id);
      item.className = `achievement${unlocked ? ' is-unlocked' : ''}`;
      const title = document.createElement('strong');
      title.textContent = unlocked ? achievement.title : 'Locked';
      const label = document.createElement('small');
      label.textContent = achievement.label;
      item.append(title, label);
      achievementList.appendChild(item);
    });
  }

  function refreshShop() {
    buildingList.querySelectorAll('[data-building]').forEach((button) => {
      const building = buildings.find((item) => item.id === button.dataset.building);
      const quote = purchaseQuote(building);
      const actualAmount = buyMode === 'max' ? quote.amount : Number(buyMode);
      button.querySelector('[data-role="price"]').textContent = `${actualAmount || 0} · ${format(quote.cost)}`;
      const owned = state.counts[building.id];
      const output = owned * building.cps * buildingMultiplier(building.id);
      button.querySelector('[data-role="output"]').textContent = `${owned} owned · ${format(output)}/s`;
      button.disabled = !actualAmount || quote.cost > state.clouds;
      button.setAttribute('aria-label', `Buy ${actualAmount || 0} ${building.name} for ${format(quote.cost)} Clouds. ${owned} owned.`);
    });

    boostList.querySelectorAll('[data-boost]').forEach((button) => {
      const boost = boosts.find((item) => item.id === button.dataset.boost);
      const owned = owns(boost.id);
      button.classList.toggle('is-owned', owned);
      button.disabled = owned || state.clouds < boost.cost;
      button.querySelector('[data-role="boost-cost"]').textContent = owned ? 'RESEARCHED' : `${format(boost.cost)} Clouds`;
    });
    boostCount.textContent = `${state.boosts.length} / ${boosts.length}`;
  }

  function buyBuilding(building) {
    const quote = purchaseQuote(building);
    const amount = buyMode === 'max' ? quote.amount : Number(buyMode);
    if (!amount || quote.cost > state.clouds) return;
    state.clouds -= quote.cost;
    state.counts[building.id] += amount;
    refreshShop();
    renderStats();
    save(false);
    announce(`${amount} ${building.name} purchased.`);
  }

  function buyBoost(boost) {
    if (owns(boost.id) || state.clouds < boost.cost) return;
    state.clouds -= boost.cost;
    state.boosts.push(boost.id);
    renderStats();
    refreshShop();
    save(false);
    announce(`${boost.name} researched.`);
  }

  function updateVisibilityStatus() {
    const status = productionStatus.closest('.core-status');
    if (document.hidden) {
      productionStatus.textContent = 'PRODUCTION PAUSED';
      status.classList.add('is-paused');
    } else {
      productionStatus.textContent = 'ACTIVE TAB PRODUCTION';
      status.classList.remove('is-paused');
    }
  }

  function loop(now) {
    const dt = Math.min(.25, Math.max(0, (now - lastFrame) / 1000 || 0));
    lastFrame = now;
    if (!document.hidden) {
      const gain = cps() * dt;
      state.clouds += gain;
      state.total += gain;
      if (now - lastClickAt > 1050 && combo > 0) combo = Math.max(0, combo - dt * 18);
    }
    renderStats();
    if (now - lastShopRefresh > 350) {
      lastShopRefresh = now;
      refreshShop();
      unlockAchievements();
    }
    requestAnimationFrame(loop);
  }

  cloudCore.addEventListener('click', pressCore);
  buyModes.addEventListener('click', (event) => {
    const button = event.target.closest('[data-buy]');
    if (!button) return;
    buyMode = button.dataset.buy;
    buyModes.querySelectorAll('[data-buy]').forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    refreshShop();
  });
  document.getElementById('saveButton').addEventListener('click', () => save(true));
  document.getElementById('resetButton').addEventListener('click', () => {
    if (!window.confirm('Reset all CloudLab Clicker progress on this device? This cannot be undone.')) return;
    state = blankState();
    combo = 0;
    lastClickAt = 0;
    save(false);
    renderAchievements();
    renderStats();
    refreshShop();
    saveStatus.textContent = 'Progress reset.';
    announce('CloudLab Clicker progress reset.');
  });
  document.addEventListener('visibilitychange', () => {
    lastFrame = performance.now();
    updateVisibilityStatus();
    save(false);
  });
  window.addEventListener('pagehide', () => save(false));
  window.setInterval(() => save(false), 5000);

  renderBuildings();
  renderBoosts();
  unlockAchievements();
  renderAchievements();
  updateVisibilityStatus();
  renderStats();
  refreshShop();
  requestAnimationFrame(loop);
})();
