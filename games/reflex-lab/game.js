(() => {
  const TRIALS = 5;
  const MIN_WAIT = 1200;
  const MAX_WAIT = 4000;
  const ANTICIPATION_MS = 90;
  const BAR_SCALE_MS = 500;
  const BEST_KEY = 'cloudlab-reflex-lab-best';

  const stage = document.getElementById('reflexStage');
  const stateKicker = document.getElementById('stateKicker');
  const stateText = document.getElementById('stateText');
  const stateSub = document.getElementById('stateSub');
  const dots = [...document.querySelectorAll('#reflexDots .reflex-dot')];
  const foulEl = document.getElementById('foulCount');
  const lastEl = document.getElementById('last');
  const averageEl = document.getElementById('average');
  const trialEl = document.getElementById('trial');
  const bestEl = document.getElementById('best');
  const barsEl = document.getElementById('reflexBars');
  const avgLine = document.getElementById('avgLine');
  const avgLineLabel = document.getElementById('avgLineLabel');
  const resultsTitle = document.getElementById('resultsTitle');
  const resultsText = document.getElementById('resultsText');
  const ratingEl = document.getElementById('rating');
  const newBestEl = document.getElementById('newBest');
  const startButton = document.getElementById('startButton');
  const resetButton = document.getElementById('resetButton');
  const controlNote = document.getElementById('controlNote');

  const touchUI = window.matchMedia?.('(pointer: coarse)').matches || false;
  const copy = touchUI ? {
    ready: 'Tap Start, wait for the glow, then tap the signal.',
    wait: 'Tap the moment it turns mint.',
    go: 'Tap now!',
    foul: 'You tapped before the signal. This trial restarts.',
    anticipated: 'Under 90 ms is a guess, not a reaction. This trial restarts.',
    paused: 'Trial paused while you were away. Tap the signal to resume.',
    again: 'Tap the signal or Play Again for a new run.',
    note: 'Tap the signal the instant it turns mint. Tapping early is a foul and that trial restarts.'
  } : {
    ready: 'Press Start, wait for the glow, then click or hit Space.',
    wait: 'Click or press Space the moment it turns mint.',
    go: 'Click or press Space!',
    foul: 'You pressed before the signal. This trial restarts.',
    anticipated: 'Under 90 ms is a guess, not a reaction. This trial restarts.',
    paused: 'Trial paused while you were away. Press Space or click to resume.',
    again: 'Press Space or Play Again for a new run.',
    note: 'Click the signal or press Space / Enter the instant it turns mint. Pressing early is a foul and that trial restarts.'
  };
  controlNote.textContent = copy.note;

  const BANDS = [
    { max: 200, name: 'Lightning', color: '#9e8cff' },
    { max: 250, name: 'Sharp', color: '#8bcf9b' },
    { max: 320, name: 'Steady', color: '#f2c75c' },
    { max: Infinity, name: 'Warming up', color: '#ed8b45' }
  ];
  const bandFor = (ms) => BANDS.find((band) => ms < band.max);

  // phase: idle | waiting | armed | go | hit | foul | paused | done
  let phase = 'idle';
  let results = [];
  let fouls = 0;
  let signalAt = 0;
  let timer = 0;
  let frame = 0;
  let doneAt = 0;
  let best = null;
  try {
    const saved = Number(localStorage.getItem(BEST_KEY));
    if (Number.isFinite(saved) && saved > 0) best = Math.round(saved);
  } catch (_) {}

  const bars = Array.from({ length: TRIALS }, (_, index) => {
    const bar = document.createElement('div');
    bar.className = 'reflex-bar';
    bar.innerHTML = '<span class="reflex-bar-value">--</span><span class="reflex-bar-track"><span class="reflex-bar-fill"></span></span><span class="reflex-bar-label"></span>';
    bar.querySelector('.reflex-bar-label').textContent = `T${index + 1}`;
    barsEl.append(bar);
    return { root: bar, value: bar.querySelector('.reflex-bar-value'), track: bar.querySelector('.reflex-bar-track'), fill: bar.querySelector('.reflex-bar-fill') };
  });

  const ms = (value) => `${Math.round(value)} ms`;
  const mean = (list) => list.reduce((sum, value) => sum + value, 0) / list.length;
  const barHeight = (value) => Math.max(6, Math.min(100, (value / BAR_SCALE_MS) * 100));

  function clearTimers() {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    timer = 0;
    frame = 0;
  }

  function show(state, kicker, title, sub) {
    stage.dataset.state = state;
    stateKicker.textContent = kicker;
    stateText.textContent = title;
    stateSub.textContent = sub;
  }

  function shake() {
    stage.classList.remove('shake');
    void stage.offsetWidth;
    stage.classList.add('shake');
  }

  function renderBest() {
    bestEl.textContent = best ? ms(best) : '--';
  }

  function renderStats() {
    const running = phase !== 'idle' && phase !== 'done';
    lastEl.textContent = results.length ? ms(results[results.length - 1]) : '--';
    averageEl.textContent = results.length ? ms(mean(results)) : '--';
    trialEl.textContent = phase === 'idle' ? `0/${TRIALS}` : `${Math.min(TRIALS, results.length + (running ? 1 : 0))}/${TRIALS}`;
    foulEl.textContent = `FOULS ${fouls}`;
    foulEl.classList.toggle('has-fouls', fouls > 0);
    dots.forEach((dot, index) => {
      const value = results[index];
      dot.classList.toggle('done', value !== undefined);
      dot.classList.toggle('current', running && index === results.length);
      dot.style.setProperty('--dot', value !== undefined ? bandFor(value).color : '');
    });
    bars.forEach((bar, index) => {
      const value = results[index];
      const filled = value !== undefined;
      bar.root.classList.toggle('filled', filled);
      bar.value.textContent = filled ? ms(value) : '--';
      bar.fill.style.height = filled ? `${barHeight(value)}%` : '0';
      bar.root.style.setProperty('--bar', filled ? bandFor(value).color : '');
    });
    positionAverageLine();
  }

  function positionAverageLine() {
    if (!results.length) { avgLine.hidden = true; return; }
    const avg = mean(results);
    const track = bars[0].track;
    const containerRect = barsEl.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    if (!trackRect.height) { avgLine.hidden = true; return; }
    const fromBottom = (containerRect.bottom - trackRect.bottom) + trackRect.height * (barHeight(avg) / 100);
    avgLine.style.bottom = `${fromBottom}px`;
    avgLineLabel.textContent = `AVG ${Math.round(avg)}`;
    avgLine.hidden = false;
  }

  function resetResultsPanel() {
    resultsTitle.textContent = 'Run breakdown';
    resultsText.textContent = `Your ${TRIALS} reaction times will appear here.`;
    ratingEl.hidden = true;
    newBestEl.hidden = true;
  }

  function toIdle() {
    clearTimers();
    phase = 'idle';
    results = [];
    fouls = 0;
    startButton.textContent = 'Start Test';
    show('idle', 'Signal lab', 'Ready?', copy.ready);
    resetResultsPanel();
    renderStats();
  }

  function startRun() {
    clearTimers();
    results = [];
    fouls = 0;
    resetResultsPanel();
    startButton.textContent = 'Restart Run';
    beginTrial();
  }

  function beginTrial() {
    clearTimers();
    phase = 'waiting';
    show('waiting', `Trial ${results.length + 1} of ${TRIALS}`, 'Wait…', copy.wait);
    renderStats();
    const delay = MIN_WAIT + Math.random() * (MAX_WAIT - MIN_WAIT);
    timer = setTimeout(fireSignal, delay);
  }

  function fireSignal() {
    timer = 0;
    phase = 'armed';
    show('go', `Trial ${results.length + 1} of ${TRIALS}`, 'TAP!', copy.go);
    // Start the clock in the frame that paints the signal.
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (phase !== 'armed') return;
      signalAt = performance.now();
      phase = 'go';
    });
  }

  function inputTime(event) {
    const now = performance.now();
    const stamp = event?.timeStamp;
    if (typeof stamp === 'number' && stamp > 0 && stamp <= now + 1 && now - stamp < 1000) return stamp;
    return now;
  }

  function foul(anticipated) {
    clearTimers();
    phase = 'foul';
    fouls += 1;
    show('foul', anticipated ? 'False start' : 'Foul', 'Too soon!', anticipated ? copy.anticipated : copy.foul);
    shake();
    renderStats();
    timer = setTimeout(beginTrial, 1150);
  }

  function recordHit(reaction) {
    clearTimers();
    results.push(reaction);
    const band = bandFor(reaction);
    stage.style.setProperty('--band', band.color);
    if (results.length >= TRIALS) { finishRun(); return; }
    phase = 'hit';
    show('hit', band.name, ms(reaction), `Trial ${results.length} locked in. Next signal incoming…`);
    renderStats();
    timer = setTimeout(beginTrial, 950);
  }

  function finishRun() {
    phase = 'done';
    doneAt = performance.now();
    const avg = Math.round(mean(results));
    const band = bandFor(avg);
    const improved = best === null || avg < best;
    if (improved) {
      best = avg;
      try { localStorage.setItem(BEST_KEY, String(best)); } catch (_) {}
      renderBest();
    }
    stage.style.setProperty('--band', band.color);
    startButton.textContent = 'Play Again';
    show('done', improved ? 'New personal best' : 'Run average', ms(avg), `${band.name}. ${copy.again}`);
    resultsTitle.textContent = `Run complete · ${avg} ms average`;
    const fastest = Math.round(Math.min(...results));
    const slowest = Math.round(Math.max(...results));
    resultsText.textContent = `Fastest ${fastest} ms · Slowest ${slowest} ms · ${fouls} ${fouls === 1 ? 'foul' : 'fouls'}`;
    ratingEl.textContent = band.name.toUpperCase();
    ratingEl.style.setProperty('--band', band.color);
    ratingEl.hidden = false;
    newBestEl.hidden = !improved;
    renderStats();
  }

  function pause() {
    if (!['waiting', 'armed', 'go', 'hit', 'foul'].includes(phase)) return;
    clearTimers();
    phase = 'paused';
    show('paused', `Trial ${results.length + 1} of ${TRIALS}`, 'Paused', copy.paused);
    renderStats();
  }

  function handleInput(event) {
    switch (phase) {
      case 'idle': startRun(); break;
      case 'done': if (performance.now() - doneAt > 700) startRun(); break;
      case 'paused': beginTrial(); break;
      case 'waiting':
      case 'armed': foul(false); break;
      case 'go': {
        const reaction = inputTime(event) - signalAt;
        if (reaction < ANTICIPATION_MS) foul(true);
        else recordHit(reaction);
        break;
      }
      default: break; // hit / foul feedback windows ignore input
    }
  }

  stage.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    handleInput(event);
  });
  stage.addEventListener('dblclick', (event) => event.preventDefault());
  stage.addEventListener('contextmenu', (event) => { if (phase !== 'idle' && phase !== 'done') event.preventDefault(); });
  stage.addEventListener('animationend', () => stage.classList.remove('shake'));

  startButton.addEventListener('click', (event) => {
    if (event.detail) startButton.blur();
    startRun();
  });
  resetButton.addEventListener('click', (event) => {
    if (event.detail) resetButton.blur();
    toIdle();
  });

  function isTypingTarget(target) {
    return target instanceof Element && Boolean(target.closest('input, select, textarea, [contenteditable="true"], [contenteditable=""]'));
  }

  function isActivatableTarget(target) {
    return target instanceof Element && Boolean(target.closest('a[href], button, summary'));
  }

  window.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    if (isTypingTarget(event.target) || isActivatableTarget(event.target)) return;
    if (event.code === 'Space' || event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (phase === 'done') startRun();
      else handleInput(event);
    }
  });

  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);

  let fitFrame = 0;
  const scheduleFit = () => {
    cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(positionAverageLine);
  };
  if (window.ResizeObserver) new ResizeObserver(scheduleFit).observe(barsEl);
  window.addEventListener('resize', scheduleFit);

  renderBest();
  toIdle();
})();
