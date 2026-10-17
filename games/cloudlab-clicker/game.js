(() => {
  const STORAGE_KEY = 'cloudlab-clicker-save-v1';
  const SOUND_KEY = 'cloudlab-clicker-sound';
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  const cloudCount = $('cloudCount');
  const cloudRate = $('cloudRate');
  const allTime = $('allTime');
  const pressValue = $('pressValue');
  const pressCount = $('pressCount');
  const cloudCore = $('cloudCore');
  const coreStage = $('coreStage');
  const coreValue = $('coreValue');
  const particleLayer = $('particleLayer');
  const comboValue = $('comboValue');
  const comboFill = $('comboFill');
  const comboRing = $('comboRing');
  const clickRateStatus = $('clickRateStatus');
  const buildingList = $('buildingList');
  const boostList = $('boostList');
  const boostCount = $('boostCount');
  const achievementList = $('achievementList');
  const achievementCount = $('achievementCount');
  const productionStatus = $('productionStatus');
  const saveStatus = $('saveStatus');
  const announcement = $('clickerAnnouncement');
  const buyModes = $('buyModes');
  const productionNetwork = $('productionNetwork');
  const networkShare = $('networkShare');
  const activeResearch = $('activeResearch');
  const nextMilestone = $('nextMilestone');
  const nextMilestoneFill = $('nextMilestoneFill');
  const buffList = $('buffList');
  const soundToggle = $('soundToggle');
  const labBadge = $('labBadge');
  const toastLayer = $('clickerToastLayer');
  const corePanel = cloudCore?.closest('.core-panel');
  const clickerPanel = document.querySelector('.clicker-panel');
  const cloudSignIn = $('cloudSignIn');
  const clickerTabs = $('clickerTabs');
  const compactLayout = window.matchMedia?.('(max-width: 1099px)');
  const coreInputLimiter = window.CloudLabClickRateLimiter?.createRollingLimiter({ limit: 10, windowMs: 1000 });
  const savePolicy = window.CloudLabClickerSavePolicy;
  const icons = window.CloudLabClickerIcons;
  const icon = (id, className) => icons?.icon(id, className) || document.createElement('span');

  if (!cloudCore || !buildingList || !boostList || !productionNetwork || !activeResearch) return;

  // accent is an "r,g,b" triple used for each building's colour.
  const buildings = [
    { id: 'drone', name: 'Cursor Drone', baseCost: 15, cps: .1, accent: '104,208,223', description: 'A tiny drone taps the Core for you.' },
    { id: 'farm', name: 'Cloud Farm', baseCost: 100, cps: 1, accent: '139,207,155', description: 'Grows fresh Clouds in controlled sky fields.' },
    { id: 'station', name: 'Weather Station', baseCost: 1100, cps: 8, accent: '120,180,255', description: 'Turns pressure data into steady production.' },
    { id: 'factory', name: 'Sky Factory', baseCost: 12000, cps: 47, accent: '139,207,155', description: 'Builds Clouds at industrial scale.' },
    { id: 'bank', name: 'Orbit Bank', baseCost: 130000, cps: 260, accent: '242,199,92', description: 'Compounds condensed cloud energy in orbit.' },
    { id: 'portal', name: 'CloudLab Portal', baseCost: 1400000, cps: 1400, accent: '190,137,255', description: 'Imports Clouds from neighbouring skies.' },
    { id: 'foundry', name: 'Star Foundry', baseCost: 20000000, cps: 7800, accent: '255,170,110', description: 'Forges whole weather systems from starlight.' },
    { id: 'reactor', name: 'Storm Reactor', baseCost: 330000000, cps: 44000, accent: '120,160,255', description: 'Bottles lightning and spins it into Clouds.' },
    { id: 'nexus', name: 'Sky Nexus', baseCost: 5100000000, cps: 260000, accent: '255,130,200', description: 'Links every sky in the network into one.' }
  ];

  const boosts = [
    { id: 'tap-array', name: 'Reinforced Touch', cost: 200, description: 'Doubles every Core press.' },
    { id: 'static-charge', name: 'Static Charge', cost: 3500, description: 'Triples Core presses again and raises critical chance to 8%.' },
    { id: 'drone-sync', name: 'Drone Synchronizer', cost: 12000, description: 'Doubles Cursor Drone and Cloud Farm output.' },
    { id: 'cloud-seeding', name: 'Cloud Seeding', cost: 50000, description: 'Every Core press also adds 3% of your Clouds per second.' },
    { id: 'weather-ai', name: 'Weather Intelligence', cost: 100000, description: 'Doubles Weather Station and Sky Factory output.' },
    { id: 'storm-chaser', name: 'Storm Chaser', cost: 250000, description: 'Golden Clouds appear twice as often and their effects last 50% longer.' },
    { id: 'golden-core', name: 'Golden Core', cost: 1000000, description: 'Critical presses hit 16% of the time for 8× power.' },
    { id: 'quantum-network', name: 'Quantum Network', cost: 8000000, description: 'Doubles all automatic production.' },
    { id: 'orbital-vault', name: 'Orbital Vault', cost: 25000000, description: 'Doubles Orbit Bank and CloudLab Portal output.' },
    { id: 'stellar-forge', name: 'Stellar Forge', cost: 900000000, description: 'Doubles Star Foundry and Storm Reactor output.' },
    { id: 'nexus-link', name: 'Nexus Link', cost: 60000000000, description: 'Doubles Sky Nexus output and boosts all production by 50%.' }
  ];

  const buildingTotal = (value) => Object.values(value.counts).reduce((sum, count) => sum + count, 0);
  const achievements = [
    { id: 'first-front', title: 'First Front', label: '100 all-time Clouds', icon: 'record', target: 100, value: (s) => s.total },
    { id: 'sky-builder', title: 'Sky Builder', label: '10K all-time Clouds', icon: 'record', target: 1e4, value: (s) => s.total },
    { id: 'cloud-city', title: 'Cloud City', label: '1M all-time Clouds', icon: 'record', target: 1e6, value: (s) => s.total },
    { id: 'weather-legend', title: 'Weather Legend', label: '1B all-time Clouds', icon: 'record', target: 1e9, value: (s) => s.total },
    { id: 'storm-empire', title: 'Storm Empire', label: '1T all-time Clouds', icon: 'record', target: 1e12, value: (s) => s.total },
    { id: 'hands-on', title: 'Hands On', label: '1,000 Core presses', icon: 'press', target: 1000, value: (s) => s.clicks },
    { id: 'tireless', title: 'Tireless', label: '10,000 Core presses', icon: 'press', target: 10000, value: (s) => s.clicks },
    { id: 'architect', title: 'Architect', label: 'Own 100 buildings', icon: 'architect', target: 100, value: buildingTotal },
    { id: 'golden-touch', title: 'Golden Touch', label: 'Catch a Golden Cloud', icon: 'golden', target: 1, value: () => (goldenCaught ? 1 : 0) },
    { id: 'full-research', title: 'Full Research', label: 'Research every boost', icon: 'golden-core', target: boosts.length, value: (s) => s.boosts.length }
  ];
  const records = achievements.filter((achievement) => achievement.icon === 'record');

  // Golden Cloud effects live only in memory; they never touch the save.
  const buffs = { frenzy: 0, overdrive: 0 };
  const buffTotals = { frenzy: 1, overdrive: 1 };
  let goldenCaught = false;
  let goldenElement = null;
  let nextGoldenAt = performance.now() + (45 + Math.random() * 45) * 1000;
  let soundOn = false;
  try { soundOn = localStorage.getItem(SOUND_KEY) === '1'; } catch (_) {}

  const blankState = () => ({
    clouds: 0,
    total: 0,
    clicks: 0,
    counts: Object.fromEntries(buildings.map((item) => [item.id, 0])),
    boosts: [],
    achievements: []
  });

  function isBlankState(value) {
    return value.clouds === 0
      && value.total === 0
      && value.clicks === 0
      && Object.values(value.counts).every((count) => count === 0)
      && value.boosts.length === 0
      && value.achievements.length === 0;
  }

  function finite(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : fallback;
  }

  function sanitizeState(raw) {
    const next = blankState();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return next;
    next.clouds = finite(raw.clouds);
    next.total = Math.max(next.clouds, finite(raw.total));
    next.clicks = Math.floor(finite(raw.clicks));
    buildings.forEach((building) => {
      next.counts[building.id] = Math.floor(finite(raw.counts?.[building.id]));
    });
    next.boosts = Array.isArray(raw.boosts) ? [...new Set(raw.boosts.filter((id) => boosts.some((boost) => boost.id === id)))] : [];
    next.achievements = Array.isArray(raw.achievements) ? [...new Set(raw.achievements.filter((id) => achievements.some((achievement) => achievement.id === id)))] : [];
    return next;
  }

  function loadStateFromKey(key) {
    try { return sanitizeState(JSON.parse(localStorage.getItem(key) || 'null')); }
    catch (_) { return blankState(); }
  }

  function spentProgressValue(candidate) {
    const buildingValue = buildings.reduce(
      (total, building) => total + candidate.counts[building.id] * building.baseCost,
      0
    );
    const boostValue = boosts.reduce(
      (total, boost) => total + (candidate.boosts.includes(boost.id) ? boost.cost : 0),
      0
    );
    return buildingValue + boostValue;
  }

  function mergeStates(localValue, remoteValue) {
    const local = sanitizeState(localValue);
    const remote = sanitizeState(remoteValue);
    // Keep a complete progression branch so spent Clouds cannot be restored by
    // combining one device's upgrades with another device's unspent balance.
    if (local.total !== remote.total) return sanitizeState(local.total > remote.total ? local : remote);
    const localSpent = spentProgressValue(local);
    const remoteSpent = spentProgressValue(remote);
    if (localSpent !== remoteSpent) return sanitizeState(localSpent > remoteSpent ? local : remote);
    if (local.clicks !== remote.clicks) return sanitizeState(local.clicks > remote.clicks ? local : remote);
    return remote;
  }

  let activeStorageKey = STORAGE_KEY;
  let state = loadStateFromKey(activeStorageKey);
  let combo = 0;
  let lastClickAt = 0;
  let buyMode = '1';
  let lastFrame = performance.now();
  let lastShopRefresh = 0;
  let lastMachinePulse = 0;
  let lastAmbientEffect = 0;
  let saveTimer = 0;
  let activeView = 'core';
  let lastComboBurstLevel = 0;
  let inputCapActive = false;
  let inputCapTimer = 0;
  let cloudCommunity = null;
  let cloudConnected = false;
  let cloudVersion = 0;
  let cloudSaveInFlight = false;
  let cloudSaveQueued = false;
  let cloudSaveQueuedOptions = { force: false, keepalive: false, notify: false };
  let lastCloudSignature = '';
  let cloudSaveHadError = false;
  let cloudResetPending = false;
  let cloudResetTombstone = false;
  let cloudUsername = '';
  let cloudResetIntentKey = '';
  const cloudSaveQueue = savePolicy?.createCloudSaveQueue({
    minIntervalMs: savePolicy.CLOUD_SAVE_INTERVAL_MS,
    debounceMs: savePolicy.CLOUD_SAVE_DEBOUNCE_MS,
    onFlush: (options) => syncCloudSave(options)
  });

  function persistResetIntent(pending) {
    cloudResetPending = pending;
    if (!cloudResetIntentKey) return;
    try {
      if (pending) localStorage.setItem(cloudResetIntentKey, '1');
      else localStorage.removeItem(cloudResetIntentKey);
    } catch (_) {}
  }

  function selectAccountStorage(userId) {
    const cleanUserId = String(userId || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 80);
    if (!cleanUserId) throw new Error('CloudLab account identity is unavailable.');
    const accountKey = `${STORAGE_KEY}:user:${cleanUserId}`;
    state = mergeStates(state, loadStateFromKey(accountKey));
    activeStorageKey = accountKey;
    cloudResetIntentKey = `${accountKey}:reset-pending`;
    try {
      localStorage.setItem(activeStorageKey, JSON.stringify(state));
      localStorage.removeItem(STORAGE_KEY);
      cloudResetPending = localStorage.getItem(cloudResetIntentKey) === '1';
    } catch (_) {}
  }

  function format(value) {
    const number = Math.max(0, Number(value) || 0);
    if (number < 1000) return number < 10 && number % 1 ? number.toFixed(1) : Math.floor(number).toLocaleString('en-US');
    const units = [
      [1e21, 'Sx'], [1e18, 'Qi'], [1e15, 'Qa'], [1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']
    ];
    const unit = units.find(([size]) => number >= size);
    if (!unit) return Math.floor(number).toLocaleString('en-US');
    const scaled = number / unit[0];
    return `${scaled >= 100 ? scaled.toFixed(0) : scaled >= 10 ? scaled.toFixed(1) : scaled.toFixed(2)}${unit[1]}`;
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '';
    if (seconds < 60) return `${Math.max(1, Math.ceil(seconds))}s`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.round(seconds / 360) / 10}h`;
    return `${Math.round(seconds / 8640) / 10}d`;
  }

  function owns(id) { return state.boosts.includes(id); }
  function buffActive(name, now = performance.now()) { return buffs[name] > now; }

  function basePressPower() {
    let value = 1;
    if (owns('tap-array')) value *= 2;
    if (owns('static-charge')) value *= 3;
    if (owns('cloud-seeding')) value += baseCps() * .03;
    return value;
  }

  function clickPower() {
    return basePressPower() * (buffActive('overdrive') ? 10 : 1);
  }

  function buildingMultiplier(id) {
    let value = 1;
    if (owns('drone-sync') && (id === 'drone' || id === 'farm')) value *= 2;
    if (owns('weather-ai') && (id === 'station' || id === 'factory')) value *= 2;
    if (owns('orbital-vault') && (id === 'bank' || id === 'portal')) value *= 2;
    if (owns('stellar-forge') && (id === 'foundry' || id === 'reactor')) value *= 2;
    if (owns('nexus-link')) value *= id === 'nexus' ? 3 : 1.5;
    if (owns('quantum-network')) value *= 2;
    return value;
  }

  function buildingOutput(building) {
    return state.counts[building.id] * building.cps * buildingMultiplier(building.id);
  }

  function baseCps() {
    return buildings.reduce((total, building) => total + buildingOutput(building), 0);
  }

  function frenzyMultiplier() { return buffActive('frenzy') ? 7 : 1; }
  function cps() { return baseCps() * frenzyMultiplier(); }

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
    if (buyMode === 'max' && amount === 0) return { amount: 1, cost: unitCost(building, owned), short: true };
    if (buyMode !== 'max' && amount < requested) {
      amount = requested;
      cost = 0;
      for (let i = 0; i < requested; i += 1) cost += unitCost(building, owned + i);
    }
    return { amount, cost, short: cost > state.clouds };
  }

  // A building opens once the one before it is owned (or it is nearly affordable);
  // the first closed building shows as a mystery silhouette and the rest stay hidden.
  function buildingOpen(index) {
    const building = buildings[index];
    if (index === 0 || state.counts[building.id] > 0) return true;
    return state.counts[buildings[index - 1].id] > 0 || state.total >= building.baseCost * .5;
  }

  function setAccountSaveStatus(text, stateName = 'syncing', showSignIn = false) {
    saveStatus.textContent = text;
    if (clickerPanel) clickerPanel.dataset.saveState = stateName;
    if (cloudSignIn) cloudSignIn.hidden = !showSignIn;
  }

  function setAccountSaveState(stateName) {
    if (clickerPanel) clickerPanel.dataset.saveState = stateName;
  }

  function markCloudSaveComplete() {
    cloudSaveQueue?.markSaved();
    saveStatus.dataset.lastSavedAt = new Date().toISOString();
    saveStatus.title = `Last cloud save: ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }

  function waitForCommunity(timeout = 6000) {
    if (window.CloudLabCommunity?.loadGameSave && window.CloudLabCommunity?.saveGameState) {
      return Promise.resolve(window.CloudLabCommunity);
    }
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        window.removeEventListener('cloudlab:community-ready', ready);
        resolve(value);
      };
      const ready = (event) => {
        const community = event.detail || window.CloudLabCommunity;
        if (community?.loadGameSave && community?.saveGameState) finish(community);
      };
      window.addEventListener('cloudlab:community-ready', ready);
      window.setTimeout(() => finish(null), timeout);
    });
  }

  function save(showMessage = false, options = {}) {
    try {
      localStorage.setItem(activeStorageKey, JSON.stringify(state));
      if (showMessage) {
        if (cloudConnected) setAccountSaveStatus('Saving to your CloudLab account…', 'syncing');
        else {
          setAccountSaveStatus('Progress saved on this device.', 'local', true);
          window.clearTimeout(saveTimer);
          saveTimer = window.setTimeout(() => {
            if (!cloudConnected) setAccountSaveStatus('Progress saves here. Sign in to play anywhere.', 'local', true);
          }, 2600);
        }
      }
    } catch (_) {
      if (showMessage) setAccountSaveStatus('This browser could not save progress.', 'error');
    }
    if (options.cloud !== false) {
      scheduleCloudSave({
        immediate: Boolean(options.immediate || showMessage),
        keepalive: Boolean(options.keepalive),
        notify: Boolean(options.notify || showMessage),
        force: Boolean(options.force)
      });
    }
  }

  function scheduleCloudSave(options = {}) {
    if (!cloudConnected) return;
    if (cloudSaveQueue) {
      cloudSaveQueue.schedule(options);
      return;
    }
    if (options.immediate) syncCloudSave(options);
  }

  async function syncCloudSave(options = {}) {
    if (!cloudConnected || !cloudCommunity) return;
    if (cloudSaveInFlight) {
      cloudSaveQueued = true;
      cloudSaveQueuedOptions.force ||= options.force === true;
      cloudSaveQueuedOptions.keepalive ||= options.keepalive === true;
      cloudSaveQueuedOptions.notify ||= options.notify === true;
      return;
    }
    const notify = options.notify === true;
    const reset = options.reset === true || cloudResetPending;
    const snapshot = reset ? blankState() : sanitizeState(state);
    if (!reset && cloudResetTombstone && isBlankState(snapshot)) {
      setAccountSaveState('synced');
      if (notify) setAccountSaveStatus('Account progress is reset · new play will start a fresh save.', 'synced');
      return;
    }
    const signature = JSON.stringify(snapshot);
    if (!reset && !options.force && signature === lastCloudSignature) {
      setAccountSaveState('synced');
      if (notify) setAccountSaveStatus('Everything is already saved to your CloudLab account.', 'synced');
      return;
    }
    cloudSaveInFlight = true;
    if (reset || notify) setAccountSaveStatus(reset ? 'Resetting account progress…' : 'Syncing progress to your account…', 'syncing');
    else setAccountSaveState('syncing');
    try {
      const result = await cloudCommunity.saveGameState('cloudlab-clicker', snapshot, {
        version: cloudVersion,
        reset,
        keepalive: Boolean(options.keepalive)
      });
      if (result.accountChanged) {
        cloudConnected = false;
        setAccountSaveStatus('Account changed · loading the correct save…', 'syncing');
        window.setTimeout(() => location.reload(), 250);
        return;
      }
      if (result.signedOut || !result.authenticated) {
        cloudConnected = false;
        setAccountSaveStatus('Signed out · switching to device-only progress…', 'syncing');
        window.setTimeout(() => location.reload(), 250);
        return;
      }
      if (result.conflict && result.save) {
        cloudVersion = Number(result.save.version || cloudVersion);
        cloudResetTombstone = result.save.reset === true;
        const remoteState = sanitizeState(result.save.state);
        state = cloudResetTombstone ? blankState() : mergeStates(state, remoteState);
        const mergedSignature = JSON.stringify(state);
        const remoteSignature = JSON.stringify(remoteState);
        save(false, { cloud: false });
        unlockAchievements();
        renderAchievements();
        renderActiveResearch();
        renderStats();
        refreshShop();
        refreshNetwork();
        if (cloudResetTombstone) {
          lastCloudSignature = mergedSignature;
          persistResetIntent(false);
          setAccountSaveStatus('A newer account reset was applied on this device.', 'synced');
        } else if (mergedSignature === remoteSignature) {
          lastCloudSignature = remoteSignature;
          setAccountSaveStatus('Loaded newer progress from your CloudLab account.', 'synced');
        } else {
          lastCloudSignature = '';
          cloudSaveQueued = true;
        }
      } else {
        cloudVersion = Number(result.save?.version || result.version || cloudVersion);
        if (reset) persistResetIntent(false);
        cloudResetTombstone = result.save?.reset === true;
        lastCloudSignature = signature;
        markCloudSaveComplete();
        if (notify || reset || cloudSaveHadError) {
          const accountName = cloudUsername || result.user?.username || 'your CloudLab account';
          setAccountSaveStatus(`Saved to ${accountName} · cloud autosave runs every minute.`, 'synced');
        } else {
          setAccountSaveState('synced');
        }
        cloudSaveHadError = false;
        if (reset && !isBlankState(state)) cloudSaveQueued = true;
      }
    } catch (error) {
      if (reset) persistResetIntent(true);
      cloudSaveHadError = true;
      setAccountSaveStatus('Local progress is safe. Account sync will retry.', 'error');
      window.setTimeout(() => scheduleCloudSave({ immediate: true, keepalive: true }), error?.status === 429 ? 30000 : 5000);
    } finally {
      cloudSaveInFlight = false;
      if (cloudSaveQueued) {
        cloudSaveQueued = false;
        const queuedOptions = cloudSaveQueuedOptions;
        cloudSaveQueuedOptions = { force: false, keepalive: false, notify: false };
        window.setTimeout(() => syncCloudSave({ ...queuedOptions, force: true }), 180);
      }
    }
  }

  function applyCloudPayload(payload) {
    cloudVersion = Number(payload.save?.version || payload.version || 0);
    cloudUsername = payload.user?.username || '';
    if (cloudResetPending) {
      save(false, { cloud: false });
      setAccountSaveStatus('Finishing your account reset…', 'syncing');
      syncCloudSave({ force: true, reset: true, keepalive: true, notify: true });
      return;
    }
    cloudResetTombstone = payload.save?.reset === true;
    const remoteState = payload.save?.state ? sanitizeState(payload.save.state) : null;
    if (cloudResetTombstone) state = blankState();
    else if (remoteState) state = mergeStates(state, remoteState);
    save(false, { cloud: false });
    unlockAchievements();
    renderAchievements();
    renderActiveResearch();
    renderStats();
    refreshShop();
    refreshNetwork();
    if (cloudResetTombstone && isBlankState(state)) {
      lastCloudSignature = JSON.stringify(state);
      markCloudSaveComplete();
      setAccountSaveStatus('Account progress is reset · new play will start a fresh save.', 'synced');
    } else if (!remoteState || JSON.stringify(state) !== JSON.stringify(remoteState)) {
      syncCloudSave({ force: true, notify: true });
    } else {
      lastCloudSignature = JSON.stringify(remoteState);
      markCloudSaveComplete();
      setAccountSaveStatus(`Loaded progress for ${cloudUsername || 'your CloudLab account'} · cloud autosave runs every minute.`, 'synced');
    }
  }

  async function initializeCloudSave() {
    setAccountSaveStatus('Checking CloudLab account…', 'syncing');
    cloudCommunity = await waitForCommunity();
    if (!cloudCommunity) {
      setAccountSaveStatus('Progress saves on this device. Account sync is temporarily unavailable.', 'local');
      return;
    }
    try {
      const payload = await cloudCommunity.loadGameSave('cloudlab-clicker');
      if (payload.accountChanged) {
        setAccountSaveStatus('Account changed · loading the correct save…', 'syncing');
        window.setTimeout(() => location.reload(), 250);
        return;
      }
      if (!payload.authenticated) {
        setAccountSaveStatus('Progress saves here. Sign in to play anywhere.', 'local', true);
        return;
      }
      selectAccountStorage(payload.user?.id);
      cloudConnected = true;
      applyCloudPayload(payload);
    } catch (_) {
      setAccountSaveStatus('Progress saves on this device. Account sync will retry.', 'error');
      window.setTimeout(initializeCloudSave, 5000);
    }
  }

  function announce(text) {
    announcement.textContent = '';
    window.setTimeout(() => { announcement.textContent = text; }, 20);
  }

  function showToast(title, detail, tone = 'cyan', iconId = 'clouds') {
    if (!toastLayer) return;
    const toast = document.createElement('div');
    toast.className = `clicker-toast tone-${tone}`;
    const copy = document.createElement('div');
    const heading = document.createElement('strong');
    const description = document.createElement('small');
    heading.textContent = title;
    description.textContent = detail;
    copy.append(heading, description);
    toast.append(icon(iconId, 'toast-icon'), copy);
    toastLayer.appendChild(toast);
    while (toastLayer.children.length > 3) toastLayer.firstElementChild?.remove();
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    window.setTimeout(() => {
      toast.classList.remove('is-visible');
      window.setTimeout(() => toast.remove(), 260);
    }, reducedMotion ? 1800 : 3000);
  }

  // Small synthesized sound set. Off by default; the choice is remembered per device.
  let audio = null;
  let lastSoundAt = 0;
  function playSound(kind) {
    if (!soundOn) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const now = audio.currentTime;
      if (kind === 'press' && now - lastSoundAt < .035) return;
      lastSoundAt = now;
      const notes = {
        press: [[420 + Math.min(50, combo) * 9, 0, .07, .05]],
        crit: [[660, 0, .09, .07], [990, .05, .14, .06]],
        buy: [[523, 0, .12, .05], [659, .06, .14, .05], [784, .12, .18, .05]],
        golden: [[784, 0, .12, .06], [988, .08, .12, .06], [1175, .16, .12, .06], [1568, .24, .3, .05]],
        record: [[659, 0, .16, .06], [880, .1, .3, .06]]
      }[kind] || [];
      notes.forEach(([frequency, delay, length, volume]) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = kind === 'press' ? 'sine' : 'triangle';
        oscillator.frequency.setValueAtTime(frequency, now + delay);
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(volume, now + delay + .01);
        gain.gain.exponentialRampToValueAtTime(.0001, now + delay + length);
        oscillator.connect(gain).connect(audio.destination);
        oscillator.start(now + delay);
        oscillator.stop(now + delay + length + .02);
      });
    } catch (_) {}
  }

  function syncSoundToggle() {
    if (!soundToggle) return;
    soundToggle.setAttribute('aria-pressed', String(soundOn));
    soundToggle.setAttribute('aria-label', soundOn ? 'Sound effects on' : 'Sound effects off');
    soundToggle.replaceChildren(icon(soundOn ? 'sound' : 'mute'));
  }

  function updateMilestone() {
    if (!nextMilestone || !nextMilestoneFill) return;
    const upcoming = records.find((record) => state.total < record.target);
    if (!upcoming) {
      nextMilestone.textContent = 'All records complete';
      nextMilestoneFill.style.width = '100%';
      return;
    }
    const previousIndex = records.indexOf(upcoming) - 1;
    const previous = previousIndex >= 0 ? records[previousIndex].target : 0;
    const progress = Math.max(0, Math.min(1, (state.total - previous) / (upcoming.target - previous)));
    const label = `${format(upcoming.target)} Clouds`;
    if (nextMilestone.textContent !== label) nextMilestone.textContent = label;
    nextMilestoneFill.style.width = `${progress * 100}%`;
  }

  function unlockAchievements() {
    let changed = false;
    achievements.forEach((achievement) => {
      if (achievement.value(state) >= achievement.target && !state.achievements.includes(achievement.id)) {
        state.achievements.push(achievement.id);
        changed = true;
        announce(`${achievement.title} record unlocked.`);
        showToast('Record unlocked', achievement.title, 'gold', achievement.icon);
        playSound('record');
      }
    });
    if (changed) {
      renderAchievements();
      save(false);
    }
  }

  let lastComboShare = null;
  function setText(element, text) {
    if (element && element.textContent !== text) element.textContent = text;
  }

  function renderStats() {
    const now = performance.now();
    const cloudText = format(state.clouds);
    const rateText = format(cps());
    const totalText = format(state.total);
    const rawTotal = String(Math.floor(state.total));
    const pressText = format(clickPower());
    if (cloudCount.textContent !== cloudText) cloudCount.textContent = cloudText;
    if (cloudRate.textContent !== rateText) cloudRate.textContent = rateText;
    if (allTime.textContent !== totalText) allTime.textContent = totalText;
    if (allTime.dataset.recordValue !== rawTotal) allTime.dataset.recordValue = rawTotal;
    if (pressValue && pressValue.textContent !== pressText) pressValue.textContent = pressText;
    // This runs every frame, so only touch the DOM when a value actually changes.
    setText(pressCount, state.clicks.toLocaleString('en-US'));
    setText(coreValue, `+${pressText}`);
    setText(comboValue, `${comboMultiplier().toFixed(2)}×`);
    const comboShare = Math.round(Math.min(100, combo * 2) * 10) / 10;
    if (comboShare !== lastComboShare) {
      lastComboShare = comboShare;
      comboFill.style.width = `${comboShare}%`;
      comboRing?.style.setProperty('stroke-dashoffset', String(100 - comboShare));
      corePanel?.style.setProperty('--combo-energy', String(Math.min(1, combo / 50)));
    }
    corePanel?.classList.toggle('combo-hot', combo >= 15);
    corePanel?.classList.toggle('combo-max', combo >= 42);
    clickerPanel?.classList.toggle('is-frenzy', buffActive('frenzy', now));
    clickerPanel?.classList.toggle('is-overdrive', buffActive('overdrive', now));
    renderBuffs(now);
    updateMilestone();
  }

  const buffInfo = {
    frenzy: { label: 'Cloud Burst', detail: '×7 production', icon: 'frenzy' },
    overdrive: { label: 'Core Overdrive', detail: '×10 press power', icon: 'overdrive' }
  };
  const buffChips = {};
  function renderBuffs(now) {
    if (!buffList) return;
    Object.keys(buffInfo).forEach((name) => {
      const remaining = buffs[name] - now;
      let chip = buffChips[name];
      if (remaining <= 0) {
        if (chip) { chip.remove(); delete buffChips[name]; }
        return;
      }
      if (!chip) {
        chip = document.createElement('div');
        chip.className = `buff-chip buff-${name}`;
        const copy = document.createElement('span');
        const label = document.createElement('b');
        label.textContent = buffInfo[name].label;
        const detail = document.createElement('small');
        copy.append(label, detail);
        const bar = document.createElement('i');
        chip.append(icon(buffInfo[name].icon), copy, bar);
        buffList.appendChild(chip);
        buffChips[name] = chip;
      }
      const seconds = `${buffInfo[name].detail} · ${Math.ceil(remaining / 1000)}s`;
      const detail = chip.querySelector('small');
      if (detail.textContent !== seconds) detail.textContent = seconds;
      chip.style.setProperty('--buff-left', String(Math.max(0, remaining / buffTotals[name])));
    });
  }

  function getParticleOrigin(event) {
    const layerRect = particleLayer.getBoundingClientRect();
    const coreRect = cloudCore.getBoundingClientRect();
    const fromPointer = event && event.detail !== 0 && Number.isFinite(event.clientX) && Number.isFinite(event.clientY);
    const x = fromPointer ? event.clientX - layerRect.left : coreRect.left + coreRect.width / 2 - layerRect.left;
    const y = fromPointer ? event.clientY - layerRect.top : coreRect.top + coreRect.height / 2 - layerRect.top;
    return {
      x: Math.max(18, Math.min(layerRect.width - 18, x)),
      y: Math.max(18, Math.min(layerRect.height - 18, y))
    };
  }

  function trimParticleLayer() {
    while (particleLayer.childElementCount > 120) particleLayer.firstElementChild?.remove();
  }

  function createParticle(value, critical, event) {
    trimParticleLayer();
    const origin = getParticleOrigin(event);
    const particle = document.createElement('span');
    particle.className = `click-particle${critical ? ' critical' : ''}`;
    particle.textContent = `${critical ? 'CRIT ' : ''}+${format(value)}`;
    particle.style.setProperty('--drift', `${(Math.random() - .5) * 100}px`);
    particle.style.left = `${origin.x + (Math.random() - .5) * 20}px`;
    particle.style.top = `${origin.y - 4}px`;
    particleLayer.appendChild(particle);
    window.setTimeout(() => particle.remove(), reducedMotion ? 120 : 950);

    if (reducedMotion) return;
    const flash = document.createElement('span');
    flash.className = `impact-flash${critical ? ' critical' : ''}`;
    flash.style.left = `${origin.x}px`;
    flash.style.top = `${origin.y}px`;
    particleLayer.appendChild(flash);
    window.setTimeout(() => flash.remove(), 520);

    const ripple = document.createElement('span');
    ripple.className = `core-ripple${critical ? ' critical' : ''}`;
    cloudCore.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 720);
    for (let index = 0; index < (critical ? 14 : 8); index += 1) {
      const spark = document.createElement('span');
      spark.className = `click-spark${critical ? ' critical' : ''}`;
      const angle = Math.random() * Math.PI * 2;
      const distance = 55 + Math.random() * (critical ? 100 : 60);
      spark.style.setProperty('--spark-x', `${Math.cos(angle) * distance}px`);
      spark.style.setProperty('--spark-y', `${Math.sin(angle) * distance}px`);
      spark.style.left = `${origin.x + (Math.random() - .5) * 10}px`;
      spark.style.top = `${origin.y + (Math.random() - .5) * 10}px`;
      particleLayer.appendChild(spark);
      window.setTimeout(() => spark.remove(), 760);
    }

    for (let index = 0; index < (critical ? 7 : 4); index += 1) {
      const cloudlet = document.createElement('span');
      const angle = Math.random() * Math.PI * 2;
      const distance = 42 + Math.random() * (critical ? 94 : 60);
      cloudlet.className = `click-cloudlet${critical ? ' critical' : ''}`;
      cloudlet.style.left = `${origin.x}px`;
      cloudlet.style.top = `${origin.y}px`;
      cloudlet.style.setProperty('--cloud-x', `${Math.cos(angle) * distance}px`);
      cloudlet.style.setProperty('--cloud-y', `${Math.sin(angle) * distance - 18}px`);
      cloudlet.style.setProperty('--cloud-rotate', `${Math.round((Math.random() - .5) * 36)}deg`);
      particleLayer.appendChild(cloudlet);
      window.setTimeout(() => cloudlet.remove(), 860);
    }

    for (let index = 0; index < (critical ? 6 : 3); index += 1) {
      const streak = document.createElement('span');
      const angle = Math.random() * 360;
      streak.className = `energy-streak${critical ? ' critical' : ''}`;
      streak.style.left = `${origin.x}px`;
      streak.style.top = `${origin.y}px`;
      streak.style.setProperty('--streak-angle', `${angle}deg`);
      streak.style.setProperty('--streak-travel', `${35 + Math.random() * (critical ? 75 : 45)}px`);
      streak.style.setProperty('--streak-size', `${22 + Math.random() * 28}px`);
      particleLayer.appendChild(streak);
      window.setTimeout(() => streak.remove(), 620);
    }

    const comboBurstLevel = Math.floor(combo / 10);
    if (comboBurstLevel > lastComboBurstLevel) {
      lastComboBurstLevel = comboBurstLevel;
      const burst = document.createElement('span');
      burst.className = 'combo-burst';
      burst.textContent = `${comboMultiplier().toFixed(2)}× flow`;
      burst.style.left = `${origin.x}px`;
      burst.style.top = `${origin.y}px`;
      particleLayer.appendChild(burst);
      window.setTimeout(() => burst.remove(), 850);
    }
    if (critical) {
      corePanel?.classList.remove('critical-flash');
      void corePanel?.offsetWidth;
      corePanel?.classList.add('critical-flash');
      window.setTimeout(() => corePanel?.classList.remove('critical-flash'), 520);
      navigator.vibrate?.(18);
    }
  }

  function createAmbientCloud() {
    if (reducedMotion) return;
    const cloud = document.createElement('span');
    cloud.className = 'ambient-cloud';
    cloud.style.setProperty('--ambient-x', `${15 + Math.random() * 70}%`);
    cloud.style.setProperty('--ambient-size', `${12 + Math.random() * 22}px`);
    cloud.style.setProperty('--ambient-drift', `${(Math.random() - .5) * 90}px`);
    particleLayer.appendChild(cloud);
    window.setTimeout(() => cloud.remove(), 2600);
  }

  function showInputCap(scriptGenerated = false, retryAfterMs = 0) {
    const label = scriptGenerated ? 'AUTOMATED INPUT BLOCKED' : '10 CPS CAP ACTIVE';
    if (clickRateStatus) {
      clickRateStatus.textContent = label;
      clickRateStatus.classList.add('is-capped');
    }
    corePanel?.classList.add('input-capped');
    if (!inputCapActive) {
      inputCapActive = true;
      const detail = scriptGenerated
        ? 'Only real mouse, touch, and keyboard presses can power the Core.'
        : 'The Core accepts a maximum of 10 presses in any one-second window.';
      announce(scriptGenerated ? 'Automated Core input blocked.' : 'Core input capped at 10 clicks per second.');
      showToast('Core input protected', detail, 'gold');
    }
    window.clearTimeout(inputCapTimer);
    inputCapTimer = window.setTimeout(() => {
      inputCapActive = false;
      clickRateStatus?.classList.remove('is-capped');
      if (clickRateStatus) clickRateStatus.textContent = '10 CPS MAX';
      corePanel?.classList.remove('input-capped');
    }, Math.max(700, Math.ceil(retryAfterMs) + 120));
  }

  function pressCore(event) {
    const now = performance.now();
    if (event?.isTrusted === false) {
      showInputCap(true);
      return;
    }
    const inputAttempt = coreInputLimiter?.attempt(now);
    if (inputAttempt && !inputAttempt.allowed) {
      event?.preventDefault();
      showInputCap(false, inputAttempt.retryAfterMs);
      return;
    }
    combo = now - lastClickAt < 1100 ? Math.min(50, combo + 1) : 1;
    if (combo < 10) lastComboBurstLevel = 0;
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
    createParticle(gain, critical, event);
    playSound(critical ? 'crit' : 'press');
    renderStats();
    refreshShop();
    unlockAchievements();
  }

  // Golden Clouds drift past the Core now and then. Catching one triggers a short bonus.
  function goldenScale() { return owns('storm-chaser') ? 1.5 : 1; }
  function scheduleGolden(now = performance.now()) {
    const seconds = (70 + Math.random() * 90) / (owns('storm-chaser') ? 2 : 1);
    nextGoldenAt = now + seconds * 1000;
  }

  function removeGolden() {
    if (!goldenElement) return;
    const element = goldenElement;
    goldenElement = null;
    element.classList.add('is-leaving');
    window.setTimeout(() => element.remove(), 420);
  }

  function spawnGolden(now) {
    if (goldenElement || !coreStage) return;
    const golden = document.createElement('button');
    golden.type = 'button';
    golden.className = 'golden-cloud';
    golden.setAttribute('aria-label', 'Golden Cloud: press for a bonus');
    golden.style.setProperty('--golden-x', `${8 + Math.random() * 70}%`);
    golden.style.setProperty('--golden-y', `${6 + Math.random() * 62}%`);
    golden.append(icon('golden'));
    golden.addEventListener('click', catchGolden);
    coreStage.appendChild(golden);
    goldenElement = golden;
    announce('A Golden Cloud appeared near the Core.');
    const life = 13000 * goldenScale();
    window.setTimeout(() => { if (goldenElement === golden) { removeGolden(); scheduleGolden(); } }, life);
    scheduleGolden(now + life);
  }

  function catchGolden(event) {
    if (event?.isTrusted === false || !goldenElement) return;
    const now = performance.now();
    const base = baseCps();
    const roll = Math.random();
    const scale = goldenScale();
    goldenCaught = true;
    if (base > 0 && roll < .45) {
      const duration = 40000 * scale;
      buffs.frenzy = now + duration;
      buffTotals.frenzy = duration;
      showToast('Cloud Burst', `Production ×7 for ${Math.round(duration / 1000)} seconds.`, 'gold', 'frenzy');
      announce('Cloud Burst: production times seven.');
    } else if (roll < .9 || base === 0) {
      const gain = Math.max(basePressPower() * 60, Math.min(state.clouds * .15, base * 900) + 13);
      state.clouds += gain;
      state.total += gain;
      createParticle(gain, true, event);
      showToast('Lucky Front', `+${format(gain)} Clouds collected.`, 'gold', 'golden');
      announce(`Lucky Front: ${format(gain)} Clouds.`);
    } else {
      const duration = 15000 * scale;
      buffs.overdrive = now + duration;
      buffTotals.overdrive = duration;
      showToast('Core Overdrive', `Core presses ×10 for ${Math.round(duration / 1000)} seconds.`, 'gold', 'overdrive');
      announce('Core Overdrive: presses times ten.');
    }
    playSound('golden');
    goldenElement.classList.add('is-caught');
    const element = goldenElement;
    goldenElement = null;
    window.setTimeout(() => element.remove(), 520);
    scheduleGolden(now);
    renderStats();
    refreshShop();
    unlockAchievements();
    save(false);
  }

  function renderNetwork() {
    productionNetwork.replaceChildren();
    buildings.forEach((building) => {
      const card = document.createElement('li');
      card.className = 'machine-card is-locked';
      card.dataset.machine = building.id;
      card.style.setProperty('--accent', building.accent);
      const header = document.createElement('div');
      header.className = 'machine-header';
      const name = document.createElement('strong');
      name.dataset.role = 'machine-name';
      const count = document.createElement('b');
      count.dataset.role = 'machine-count';
      header.append(name, count);
      const scene = document.createElement('div');
      scene.className = 'machine-scene';
      scene.setAttribute('aria-hidden', 'true');
      const halo = document.createElement('span');
      halo.className = 'machine-halo';
      scene.append(halo, icon(building.id, 'machine-art'), icon('lock', 'machine-lock'));
      const footer = document.createElement('div');
      footer.className = 'machine-footer';
      const stateLabel = document.createElement('span');
      stateLabel.dataset.role = 'machine-state';
      const output = document.createElement('strong');
      output.dataset.role = 'machine-output';
      footer.append(stateLabel, output);
      const share = document.createElement('i');
      share.className = 'machine-share';
      card.append(header, scene, footer, share);
      productionNetwork.appendChild(card);
    });
  }

  function refreshNetwork() {
    const total = baseCps();
    let online = 0;
    let mysteryShown = false;
    buildings.forEach((building, index) => {
      const card = productionNetwork.querySelector(`[data-machine="${building.id}"]`);
      if (!card) return;
      const owned = state.counts[building.id];
      const output = buildingOutput(building) * frenzyMultiplier();
      const active = owned > 0;
      const known = buildingOpen(index);
      card.hidden = !known && mysteryShown;
      if (!known) mysteryShown = true;
      if (active) online += 1;
      card.classList.toggle('is-active', active);
      card.classList.toggle('is-locked', !active);
      card.classList.toggle('is-unknown', !known);
      card.dataset.tier = String(Math.min(5, Math.max(0, Math.ceil(Math.log10(owned + 1)))));
      card.style.setProperty('--machine-speed', `${Math.max(.8, 3.4 - Math.log10(owned + 1) * .7)}s`);
      card.style.setProperty('--share', String(total > 0 ? buildingOutput(building) / total : 0));
      card.querySelector('[data-role="machine-name"]').textContent = known ? building.name : '???';
      card.querySelector('[data-role="machine-count"]').textContent = `×${format(owned)}`;
      card.querySelector('[data-role="machine-state"]').textContent = active
        ? `${Math.round(total > 0 ? (buildingOutput(building) / total) * 100 : 0)}% of output`
        : known ? 'Buy to activate' : 'Undiscovered';
      card.querySelector('[data-role="machine-output"]').textContent = active ? `${format(output)}/s` : '';
      card.setAttribute('aria-label', known
        ? `${building.name}. ${owned} owned. Producing ${format(output)} Clouds per second.`
        : 'Undiscovered building.');
    });
    if (networkShare) networkShare.textContent = `${online} of ${buildings.length} online`;
  }

  function pulseMachine(id, purchased = false) {
    const card = productionNetwork.querySelector(`[data-machine="${id}"]`);
    if (!card) return;
    card.classList.remove('is-producing', 'just-purchased');
    void card.offsetWidth;
    card.classList.add(purchased ? 'just-purchased' : 'is-producing');
    const scene = card.querySelector('.machine-scene');
    if (!reducedMotion && scene && scene.offsetParent) {
      const orb = document.createElement('i');
      orb.className = 'machine-output-orb';
      orb.style.left = `${24 + Math.random() * 52}%`;
      scene.appendChild(orb);
      window.setTimeout(() => orb.remove(), 900);
    }
    window.setTimeout(() => card.classList.remove('is-producing', 'just-purchased'), purchased ? 900 : 520);
  }

  function renderActiveResearch() {
    activeResearch.replaceChildren();
    const researched = boosts.filter((boost) => owns(boost.id));
    if (!researched.length) {
      const empty = document.createElement('span');
      empty.className = 'research-empty';
      empty.textContent = 'Researched boosts orbit here.';
      activeResearch.appendChild(empty);
      return;
    }
    researched.forEach((boost, index) => {
      const chip = document.createElement('span');
      chip.className = 'research-chip';
      chip.dataset.research = boost.id;
      chip.title = `${boost.name}: ${boost.description}`;
      chip.style.setProperty('--research-delay', `${index * -.37}s`);
      const label = document.createElement('b');
      label.textContent = boost.name;
      chip.append(icon(boost.id), label);
      activeResearch.appendChild(chip);
    });
  }

  function renderBuildings() {
    buildingList.replaceChildren();
    buildings.forEach((building) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'building-card';
      button.dataset.building = building.id;
      button.style.setProperty('--accent', building.accent);
      const art = document.createElement('span');
      art.className = 'building-art';
      art.append(icon(building.id, 'building-icon'), icon('lock', 'building-lock'));
      const copy = document.createElement('span');
      copy.className = 'building-copy';
      const title = document.createElement('strong');
      title.dataset.role = 'name';
      const description = document.createElement('small');
      description.dataset.role = 'description';
      const meta = document.createElement('span');
      meta.className = 'building-meta';
      const price = document.createElement('span');
      price.className = 'building-cost';
      const priceText = document.createElement('b');
      priceText.dataset.role = 'price';
      price.append(icon('clouds'), priceText);
      const yieldText = document.createElement('span');
      yieldText.dataset.role = 'yield';
      const eta = document.createElement('span');
      eta.className = 'building-eta';
      eta.dataset.role = 'eta';
      meta.append(price, yieldText, eta);
      copy.append(title, description, meta);
      const owned = document.createElement('span');
      owned.className = 'building-owned';
      const ownedCount = document.createElement('b');
      ownedCount.dataset.role = 'owned';
      const ownedLabel = document.createElement('small');
      ownedLabel.textContent = 'owned';
      owned.append(ownedCount, ownedLabel);
      const progress = document.createElement('span');
      progress.className = 'building-progress';
      progress.appendChild(document.createElement('i'));
      button.append(art, copy, owned, progress);
      button.addEventListener('click', () => buyBuilding(building));
      buildingList.appendChild(button);
    });
  }

  function renderBoosts() {
    boostList.replaceChildren();
    boosts.forEach((boost, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'boost-card';
      button.dataset.boost = boost.id;
      button.dataset.order = String(index);
      const top = document.createElement('span');
      top.className = 'boost-top';
      const title = document.createElement('strong');
      title.textContent = boost.name;
      top.append(icon(boost.id, 'boost-icon'), title, icon('check', 'boost-check'));
      const description = document.createElement('small');
      description.textContent = boost.description;
      const cost = document.createElement('span');
      cost.className = 'boost-cost';
      const costText = document.createElement('b');
      costText.dataset.role = 'boost-cost';
      cost.append(icon('clouds'), costText);
      button.append(top, description, cost);
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
      item.dataset.achievement = achievement.id;
      const copy = document.createElement('span');
      const title = document.createElement('strong');
      title.textContent = achievement.title;
      const label = document.createElement('small');
      label.textContent = achievement.label;
      copy.append(title, label);
      const progress = document.createElement('i');
      progress.className = 'achievement-progress';
      item.append(icon(unlocked ? achievement.icon : 'lock', 'achievement-icon'), copy, progress);
      achievementList.appendChild(item);
    });
    if (achievementCount) achievementCount.textContent = `${state.achievements.length} / ${achievements.length}`;
    refreshAchievementProgress();
  }

  function refreshAchievementProgress() {
    achievementList.querySelectorAll('[data-achievement]').forEach((item) => {
      const achievement = achievements.find((entry) => entry.id === item.dataset.achievement);
      const progress = state.achievements.includes(achievement.id) ? 1 : Math.min(1, achievement.value(state) / achievement.target);
      item.style.setProperty('--progress', progress.toFixed(3));
    });
  }

  function refreshShop() {
    const rate = cps();
    let mysteryShown = false;
    let affordable = 0;
    buildingList.querySelectorAll('[data-building]').forEach((button, index) => {
      const building = buildings[index];
      const open = buildingOpen(index);
      const mystery = !open && !mysteryShown;
      if (mystery) mysteryShown = true;
      button.hidden = !open && !mystery;
      button.classList.toggle('is-mystery', mystery);
      const quote = purchaseQuote(building);
      const owned = state.counts[building.id];
      const each = building.cps * buildingMultiplier(building.id);
      const canBuy = open && !quote.short && quote.cost <= state.clouds;
      if (canBuy) affordable += 1;
      button.disabled = !canBuy;
      button.classList.toggle('is-affordable', canBuy);
      button.querySelector('[data-role="name"]').textContent = open ? building.name : '???';
      button.querySelector('[data-role="description"]').textContent = open
        ? building.description
        : `Own a ${buildings[index - 1]?.name || 'building'} to reveal this building.`;
      button.querySelector('[data-role="price"]').textContent = `${quote.amount > 1 ? `${quote.amount}× · ` : ''}${format(quote.cost)}`;
      button.querySelector('[data-role="yield"]').textContent = open ? `+${format(each)}/s each` : '';
      const eta = button.querySelector('[data-role="eta"]');
      eta.textContent = open && !canBuy && rate > 0 ? `ready in ${formatTime((quote.cost - state.clouds) / rate)}` : '';
      button.querySelector('[data-role="owned"]').textContent = format(owned);
      button.style.setProperty('--afford', String(Math.min(1, quote.cost > 0 ? state.clouds / quote.cost : 0)));
      button.setAttribute('aria-label', open
        ? `Buy ${quote.amount} ${building.name} for ${format(quote.cost)} Clouds. ${owned} owned. Each produces ${format(each)} Clouds per second.`
        : 'Undiscovered building.');
    });

    boostList.querySelectorAll('[data-boost]').forEach((button) => {
      const boost = boosts.find((item) => item.id === button.dataset.boost);
      const owned = owns(boost.id);
      const canBuy = !owned && state.clouds >= boost.cost;
      if (canBuy) affordable += 1;
      button.classList.toggle('is-owned', owned);
      button.classList.toggle('is-affordable', canBuy);
      button.disabled = !canBuy;
      button.style.order = String(owned ? 100 + Number(button.dataset.order) : Number(button.dataset.order));
      button.style.setProperty('--afford', String(Math.min(1, state.clouds / boost.cost)));
      button.querySelector('[data-role="boost-cost"]').textContent = owned ? 'Researched' : format(boost.cost);
      button.setAttribute('aria-label', owned
        ? `${boost.name}, researched. ${boost.description}`
        : `Research ${boost.name} for ${format(boost.cost)} Clouds. ${boost.description}`);
    });
    boostCount.textContent = `${state.boosts.length} / ${boosts.length}`;
    if (labBadge) {
      labBadge.hidden = affordable === 0 || activeView === 'lab';
      labBadge.textContent = String(affordable);
    }
  }

  function buyBuilding(building) {
    const quote = purchaseQuote(building);
    const amount = quote.amount;
    if (!amount || quote.short || quote.cost > state.clouds) return;
    state.clouds -= quote.cost;
    state.counts[building.id] += amount;
    refreshShop();
    refreshNetwork();
    pulseMachine(building.id, true);
    renderStats();
    save(false);
    playSound('buy');
    showToast(`${building.name} online`, `+${amount} · now ${format(buildingOutput(building))} Clouds/s`, 'cyan', building.id);
    announce(`${amount} ${building.name} purchased.`);
    unlockAchievements();
  }

  function buyBoost(boost) {
    if (owns(boost.id) || state.clouds < boost.cost) return;
    state.clouds -= boost.cost;
    state.boosts.push(boost.id);
    renderStats();
    refreshShop();
    refreshNetwork();
    renderActiveResearch();
    corePanel?.classList.remove('research-flash');
    void corePanel?.offsetWidth;
    corePanel?.classList.add('research-flash');
    window.setTimeout(() => corePanel?.classList.remove('research-flash'), 800);
    save(false);
    playSound('buy');
    showToast('Research complete', boost.name, 'mint', boost.id);
    announce(`${boost.name} researched.`);
    unlockAchievements();
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

  // Sticky parts sit just under the site header, whose height changes with screen size.
  const siteHeader = document.querySelector('.hub-header');
  let stickyTop = '';
  let hudHeight = '';
  let stickyFrame = 0;
  function measureStickyTop() {
    stickyFrame = 0;
    const bottom = siteHeader ? Math.max(0, siteHeader.getBoundingClientRect().bottom) : 0;
    const nextTop = `${Math.round(bottom + 10)}px`;
    if (nextTop !== stickyTop) {
      stickyTop = nextTop;
      clickerPanel?.style.setProperty('--clicker-sticky', nextTop);
    }
    const hud = clickerPanel?.querySelector('.clicker-hud');
    const nextHud = hud ? `${Math.round(hud.offsetHeight)}px` : '';
    if (hud && nextHud !== hudHeight) {
      hudHeight = nextHud;
      clickerPanel.style.setProperty('--clicker-hud', nextHud);
    }
  }

  function loop(now) {
    const dt = Math.min(.25, Math.max(0, (now - lastFrame) / 1000 || 0));
    lastFrame = now;
    if (!document.hidden) {
      const rate = cps();
      const gain = rate * dt;
      state.clouds += gain;
      state.total += gain;
      if (now - lastClickAt > 1050 && combo > 0) combo = Math.max(0, combo - dt * 18);
      const machineDelay = Math.max(230, 1150 - Math.log10(rate + 1) * 190);
      if (rate > 0 && now - lastMachinePulse > machineDelay) {
        lastMachinePulse = now;
        const activeMachines = buildings.filter((building) => state.counts[building.id] > 0);
        const machine = activeMachines[Math.floor(Math.random() * activeMachines.length)];
        if (machine) pulseMachine(machine.id, false);
      }
      if (now - lastAmbientEffect > 1200) {
        lastAmbientEffect = now;
        createAmbientCloud();
      }
      if (now >= nextGoldenAt && !goldenElement) spawnGolden(now);
    }
    renderStats();
    if (now - lastShopRefresh > 350) {
      lastShopRefresh = now;
      refreshShop();
      refreshNetwork();
      refreshAchievementProgress();
      unlockAchievements();
      measureStickyTop();
    }
    requestAnimationFrame(loop);
  }

  function syncClickerSections() {
    if (!clickerTabs || !clickerPanel) return;
    const compact = Boolean(compactLayout?.matches);
    const views = [...clickerPanel.querySelectorAll('[data-clicker-view]')];
    const tabs = [...clickerTabs.querySelectorAll('[data-clicker-tab]')];
    clickerPanel.dataset.activeView = activeView;
    views.forEach((view) => {
      const selected = view.dataset.clickerView === activeView;
      view.hidden = compact && !selected;
      view.setAttribute('aria-hidden', String(compact && !selected));
    });
    tabs.forEach((tab) => {
      const selected = tab.dataset.clickerTab === activeView;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    refreshShop();
  }

  function selectClickerSection(view) {
    if (!clickerTabs?.querySelector(`[data-clicker-tab="${view}"]`)) return;
    activeView = view;
    syncClickerSections();
    // On small screens, bring the new section's top into view under the sticky bars.
    if (compactLayout?.matches) {
      const stickyTop = parseFloat(clickerPanel.style.getPropertyValue('--clicker-sticky')) || 0;
      const panelTop = clickerPanel.getBoundingClientRect().top;
      if (panelTop < stickyTop) window.scrollTo({ top: window.scrollY + panelTop - stickyTop, behavior: 'instant' });
    }
  }

  clickerTabs?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-clicker-tab]');
    if (!tab) return;
    selectClickerSection(tab.dataset.clickerTab);
  });
  clickerTabs?.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = [...clickerTabs.querySelectorAll('[data-clicker-tab]')];
    const currentIndex = Math.max(0, tabs.indexOf(event.target.closest('[data-clicker-tab]')));
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    event.preventDefault();
    selectClickerSection(tabs[nextIndex].dataset.clickerTab);
    tabs[nextIndex].focus();
  });
  if (compactLayout?.addEventListener) compactLayout.addEventListener('change', syncClickerSections);
  else compactLayout?.addListener?.(syncClickerSections);

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
  soundToggle?.addEventListener('click', () => {
    soundOn = !soundOn;
    try { localStorage.setItem(SOUND_KEY, soundOn ? '1' : '0'); } catch (_) {}
    syncSoundToggle();
    playSound('buy');
  });
  $('saveButton').addEventListener('click', () => save(true));
  $('resetButton').addEventListener('click', () => {
    const scope = cloudConnected ? 'on this device and your CloudLab account' : 'on this device';
    if (!window.confirm(`Reset all CloudLab Clicker progress ${scope}? This cannot be undone.`)) return;
    state = blankState();
    combo = 0;
    lastClickAt = 0;
    buffs.frenzy = 0;
    buffs.overdrive = 0;
    coreInputLimiter?.reset();
    save(false, { cloud: false });
    renderAchievements();
    renderStats();
    refreshShop();
    refreshNetwork();
    renderActiveResearch();
    if (cloudConnected) {
      persistResetIntent(true);
      syncCloudSave({ force: true, reset: true, keepalive: true, notify: true });
    } else {
      setAccountSaveStatus('Progress reset on this device.', 'local', true);
    }
    announce('CloudLab Clicker progress reset.');
  });
  document.addEventListener('visibilitychange', () => {
    lastFrame = performance.now();
    updateVisibilityStatus();
    save(false, { immediate: document.hidden, keepalive: document.hidden });
  });
  window.addEventListener('resize', measureStickyTop, { passive: true });
  window.addEventListener('scroll', () => { if (!stickyFrame) stickyFrame = requestAnimationFrame(measureStickyTop); }, { passive: true });
  window.addEventListener('pagehide', () => save(false, { immediate: true, keepalive: true }));
  window.setInterval(() => save(false, { cloud: false }), savePolicy?.LOCAL_SAVE_INTERVAL_MS || 15000);
  window.setInterval(() => scheduleCloudSave(), savePolicy?.CLOUD_SAVE_INTERVAL_MS || 60000);

  document.querySelectorAll('[data-icon]').forEach((slot) => slot.replaceWith(icon(slot.dataset.icon)));
  syncSoundToggle();
  measureStickyTop();
  renderBuildings();
  renderBoosts();
  renderNetwork();
  syncClickerSections();
  unlockAchievements();
  renderAchievements();
  renderActiveResearch();
  updateVisibilityStatus();
  renderStats();
  refreshShop();
  refreshNetwork();
  initializeCloudSave();
  requestAnimationFrame(loop);
})();
