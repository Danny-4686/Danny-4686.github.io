(() => {
  const API = 'https://api.danny4686.com/v1';
  const page = document.body.dataset.accountPage || '';
  let csrfToken = '';
  let turnstileWidget = null;
  let turnstileToken = '';

  async function api(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (options.method && options.method !== 'GET' && csrfToken) headers.set('X-CloudLab-CSRF', csrfToken);
    const response = await fetch(`${API}${path}`, { ...options, headers, credentials: 'include' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'The account service could not complete that request.');
    return data;
  }

  function setFeedback(message, type = '') {
    const element = document.getElementById('authFeedback');
    if (!element) return;
    element.hidden = !message;
    element.className = `auth-feedback${type ? ` ${type}` : ''}`;
    element.textContent = message;
  }

  function setBusy(button, busy, text) {
    if (!button) return;
    if (!button.dataset.defaultText) button.dataset.defaultText = button.textContent;
    button.disabled = busy;
    button.textContent = busy ? text : button.dataset.defaultText;
  }

  function safeNext() {
    const next = new URLSearchParams(location.search).get('next') || '';
    try {
      const url = new URL(next, location.origin);
      return url.origin === location.origin && url.pathname.startsWith('/') ? `${url.pathname}${url.search}${url.hash}` : '/account/';
    } catch {
      return '/account/';
    }
  }

  function passwordStrength(value) {
    let level = 0;
    if (value.length >= 10) level += 1;
    if (/[A-Za-z]/.test(value) && /\d/.test(value)) level += 1;
    if (/[^A-Za-z0-9]/.test(value)) level += 1;
    if (value.length >= 14) level += 1;
    return level;
  }

  function setupPasswordControls() {
    document.querySelectorAll('[data-password-toggle]').forEach((button) => {
      const input = document.getElementById(button.dataset.passwordToggle);
      if (!input) return;
      button.addEventListener('click', () => {
        const showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        button.textContent = showing ? 'Show' : 'Hide';
      });
    });

    const password = document.getElementById('password');
    const meter = document.getElementById('passwordMeter');
    if (password && meter) password.addEventListener('input', () => { meter.dataset.level = String(passwordStrength(password.value)); });
  }

  async function setupTurnstile(action) {
    const slot = document.getElementById('turnstileSlot');
    if (!slot) return;
    try {
      const config = await api('/config');
      if (!config.turnstileEnabled || !config.turnstileSiteKey) return;
      await new Promise((resolve, reject) => {
        if (window.turnstile) return resolve();
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.append(script);
      });
      turnstileWidget = window.turnstile.render(slot, {
        sitekey: config.turnstileSiteKey,
        theme: 'dark',
        action,
        callback: (token) => { turnstileToken = token; },
        'expired-callback': () => { turnstileToken = ''; },
        'error-callback': () => { turnstileToken = ''; }
      });
    } catch (_) {
      slot.replaceChildren();
    }
  }

  function resetTurnstile() {
    turnstileToken = '';
    if (window.turnstile && turnstileWidget !== null) window.turnstile.reset(turnstileWidget);
  }

  async function checkUsername(name) {
    const hint = document.getElementById('usernameHint');
    if (!hint) return;
    if (name.length < 3) {
      hint.textContent = '3–20 characters using letters, numbers, or underscores.';
      hint.className = 'field-hint';
      return;
    }
    try {
      const data = await api(`/username?name=${encodeURIComponent(name)}`);
      hint.textContent = data.available ? `${data.username} is available.` : (data.error || 'That username is already taken.');
      hint.className = `field-hint ${data.available ? 'good' : 'bad'}`;
    } catch (error) {
      hint.textContent = error.message;
      hint.className = 'field-hint bad';
    }
  }

  function setupUsernameCheck() {
    const username = document.getElementById('username');
    if (!username || page !== 'signup') return;
    let timer = null;
    username.addEventListener('input', () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => checkUsername(username.value.trim()), 320);
    });
  }

  async function existingSessionRedirect() {
    if (page === 'account') return null;
    try {
      const session = await api('/session');
      if (session.authenticated) {
        location.replace(safeNext());
        return true;
      }
    } catch (_) {}
    return false;
  }

  function setupAuthForm() {
    const form = document.querySelector('[data-auth-form]');
    if (!form) return;
    const submit = form.querySelector('[type="submit"]');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setFeedback('');
      const username = form.elements.username.value.trim();
      const password = form.elements.password.value;

      if (page === 'signup') {
        const confirmation = form.elements.confirmPassword.value;
        if (password !== confirmation) {
          setFeedback('The two passwords do not match.', 'error');
          return;
        }
      }

      try {
        setBusy(submit, true, page === 'signup' ? 'Creating account…' : 'Signing in…');
        const data = await api(page === 'signup' ? '/signup' : '/login', {
          method: 'POST',
          body: JSON.stringify({ username, password, turnstileToken })
        });
        csrfToken = data.csrfToken || '';
        setFeedback(page === 'signup' ? `Welcome, ${data.user.username}. Your account is ready.` : `Welcome back, ${data.user.username}.`, 'success');
        window.setTimeout(() => location.replace(page === 'signup' ? '/account/?welcome=1' : safeNext()), 520);
      } catch (error) {
        setFeedback(error.message, 'error');
        resetTurnstile();
      } finally {
        setBusy(submit, false);
      }
    });
  }

  const GAME_LABELS = {
    snake: 'Snake', '2048': '2048', 'memory-match': 'Memory Match', pong: 'Pong',
    'tic-tac-toe': 'Tic-Tac-Toe', minesweeper: 'Minesweeper', breakout: 'Breakout',
    'connect-four': 'Connect Four', 'cloud-hopper': 'Cloud Hopper', 'tower-stacker': 'Tower Stacker'
  };

  function formatRecord(record) {
    if (record.gameId === 'memory-match') {
      const time = Number(record.secondary || 0);
      return `${record.value} moves · ${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`;
    }
    if (record.gameId === 'minesweeper') return `${record.value}s`;
    return Number(record.value).toLocaleString('en-US');
  }

  async function loadAccount() {
    const card = document.getElementById('profileCard');
    if (!card) return;
    try {
      const session = await api('/session');
      if (!session.authenticated) {
        location.replace(`/login/?next=${encodeURIComponent('/account/')}`);
        return;
      }
      csrfToken = session.csrfToken;
      const username = session.user.username;
      document.getElementById('profileUsername').textContent = username;
      document.getElementById('profileAvatar').textContent = username.slice(0, 1).toUpperCase();
      const created = new Date(session.user.createdAt);
      document.getElementById('profileJoined').textContent = `Member since ${created.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`;

      const data = await api('/records');
      const grid = document.getElementById('recordGrid');
      grid.replaceChildren();
      if (!data.records.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-records';
        empty.innerHTML = '<strong>No synced records yet.</strong><br>Play any Arcade game while signed in and your best result will appear here.';
        grid.append(empty);
      } else {
        data.records.forEach((record) => {
          const item = document.createElement('article');
          item.className = 'record-card';
          item.innerHTML = `<div class="record-card-top"><strong>${GAME_LABELS[record.gameId] || record.gameId}</strong><span class="record-rank">PERSONAL BEST</span></div><div class="record-value">${formatRecord(record)}</div><small>Updated ${new Date(record.updatedAt).toLocaleDateString()}</small>`;
          grid.append(item);
        });
      }
    } catch (error) {
      setFeedback(error.message, 'error');
    }
  }

  function setupLogout() {
    const button = document.getElementById('logoutButton');
    if (!button) return;
    button.addEventListener('click', async () => {
      try {
        setBusy(button, true, 'Signing out…');
        await api('/logout', { method: 'POST', body: '{}' });
      } catch (_) {}
      location.replace('/');
    });
  }

  async function init() {
    setupPasswordControls();
    setupUsernameCheck();
    setupLogout();
    if (page === 'login' || page === 'signup') {
      const redirected = await existingSessionRedirect();
      if (redirected) return;
      setupAuthForm();
      setupTurnstile(page);
    } else if (page === 'account') {
      loadAccount();
    }
  }

  init();
})();
