(() => {
  const API = 'https://api.danny4686.com/v1';
  const initialPage = document.body.dataset.accountPage || '';
  const isAuthPage = initialPage === 'login' || initialPage === 'signup';
  let authMode = initialPage === 'signup' ? 'signup' : 'login';
  let csrfToken = '';
  const turnstileWidgets = { login: null, signup: null };
  const turnstileTokens = { login: '', signup: '' };
  let turnstileConfigPromise = null;
  let turnstileScriptPromise = null;

  async function api(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (options.method && options.method !== 'GET' && csrfToken) headers.set('X-CloudLab-CSRF', csrfToken);
    const response = await fetch(`${API}${path}`, { ...options, headers, credentials: 'include' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'The account service could not complete that request.');
    return data;
  }

  function feedbackElement(mode = authMode) {
    return document.querySelector(`[data-auth-feedback="${mode}"]`) || document.getElementById('authFeedback');
  }

  function setFeedback(message, type = '', mode = authMode) {
    const element = feedbackElement(mode);
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

    const password = document.getElementById('signupPassword');
    const meter = document.getElementById('passwordMeter');
    if (password && meter) {
      password.addEventListener('input', () => {
        meter.dataset.level = String(passwordStrength(password.value));
      });
    }
  }

  function getTurnstileSlot(mode) {
    return document.getElementById(mode === 'signup' ? 'turnstileSlotSignup' : 'turnstileSlotLogin');
  }

  async function getTurnstileConfig() {
    if (!turnstileConfigPromise) turnstileConfigPromise = api('/config');
    return turnstileConfigPromise;
  }

  async function loadTurnstileScript() {
    if (window.turnstile) return;
    if (!turnstileScriptPromise) {
      turnstileScriptPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-cloudlab-turnstile]');
        if (existing) {
          existing.addEventListener('load', resolve, { once: true });
          existing.addEventListener('error', reject, { once: true });
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.dataset.cloudlabTurnstile = 'true';
        script.onload = resolve;
        script.onerror = reject;
        document.head.append(script);
      });
    }
    await turnstileScriptPromise;
  }

  async function setupTurnstile(mode) {
    const slot = getTurnstileSlot(mode);
    if (!slot || turnstileWidgets[mode] !== null) return;
    try {
      const config = await getTurnstileConfig();
      if (!config.turnstileEnabled || !config.turnstileSiteKey) return;
      await loadTurnstileScript();
      turnstileWidgets[mode] = window.turnstile.render(slot, {
        sitekey: config.turnstileSiteKey,
        theme: 'dark',
        action: mode,
        callback: (token) => { turnstileTokens[mode] = token; },
        'expired-callback': () => { turnstileTokens[mode] = ''; },
        'error-callback': () => { turnstileTokens[mode] = ''; }
      });
    } catch (_) {
      slot.replaceChildren();
    }
  }

  function resetTurnstile(mode) {
    turnstileTokens[mode] = '';
    const widget = turnstileWidgets[mode];
    if (window.turnstile && widget !== null) window.turnstile.reset(widget);
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
    const username = document.getElementById('signupUsername');
    if (!username) return;
    let timer = null;
    username.addEventListener('input', () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => checkUsername(username.value.trim()), 320);
    });
  }

  async function existingSessionRedirect() {
    if (!isAuthPage) return null;
    try {
      const session = await api('/session');
      if (session.authenticated) {
        location.replace(safeNext());
        return true;
      }
    } catch (_) {}
    return false;
  }

  function updateAuthMetadata(mode) {
    const title = mode === 'signup' ? 'Join CloudLab | Danny4686' : 'Sign In | Danny4686';
    const description = mode === 'signup'
      ? 'Create your Danny4686.com CloudLab account.'
      : 'Sign in to your Danny4686.com CloudLab account.';
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = description;
  }

  function setAuthPanelState(mode) {
    document.querySelectorAll('[data-mode-panel]').forEach((panel) => {
      const inactive = panel.dataset.modePanel !== mode;
      panel.setAttribute('aria-hidden', String(inactive));
      panel.toggleAttribute('inert', inactive);
    });

    document.querySelectorAll('.auth-mobile-tabs [data-auth-switch]').forEach((button) => {
      const active = button.dataset.authSwitch === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function authUrl(mode) {
    const url = new URL(location.href);
    url.pathname = mode === 'signup' ? '/signup/' : '/login/';
    return `${url.pathname}${url.search}${url.hash}`;
  }

  function switchAuthMode(mode, options = {}) {
    if (mode !== 'login' && mode !== 'signup') return;
    const { updateHistory = true, focus = true } = options;
    const card = document.querySelector('.auth-switch-card');
    if (!card) return;

    authMode = mode;
    document.body.dataset.accountPage = mode;
    card.dataset.authMode = mode;
    card.classList.add('is-switching');
    setAuthPanelState(mode);
    setFeedback('', '', mode);
    updateAuthMetadata(mode);

    if (updateHistory && location.pathname !== (mode === 'signup' ? '/signup/' : '/login/')) {
      history.pushState({ authMode: mode }, '', authUrl(mode));
    }

    setupTurnstile(mode);
    window.setTimeout(() => card.classList.remove('is-switching'), 560);

    if (focus) {
      const inputId = mode === 'signup' ? 'signupUsername' : 'loginUsername';
      window.setTimeout(() => document.getElementById(inputId)?.focus({ preventScroll: true }), 360);
    }
  }

  function setupAuthSwitcher() {
    const welcome = document.querySelector('.auth-welcome-panel');
    if (welcome) welcome.removeAttribute('aria-hidden');

    document.querySelectorAll('[data-auth-switch]').forEach((control) => {
      control.addEventListener('click', () => switchAuthMode(control.dataset.authSwitch));
    });

    window.addEventListener('popstate', () => {
      const mode = location.pathname.toLowerCase().startsWith('/signup') ? 'signup' : 'login';
      switchAuthMode(mode, { updateHistory: false, focus: false });
    });

    setAuthPanelState(authMode);
  }

  function clearFormPasswords(form) {
    const password = form.elements.password;
    const confirmation = form.elements.confirmPassword;
    [password, confirmation].forEach((input) => {
      if (!input) return;
      input.value = '';
      input.type = 'password';
    });
    form.querySelectorAll('[data-password-toggle]').forEach((button) => { button.textContent = 'Show'; });
    const meter = form.querySelector('.password-meter');
    if (meter) meter.dataset.level = '0';
  }

  function clearAllAuthPasswords() {
    document.querySelectorAll('[data-auth-form]').forEach(clearFormPasswords);
  }

  function setupAuthForms() {
    document.querySelectorAll('[data-auth-form]').forEach((form) => {
      const mode = form.dataset.authForm === 'signup' ? 'signup' : 'login';
      const submit = form.querySelector('[type="submit"]');

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        setFeedback('', '', mode);
        const username = form.elements.username.value.trim();
        const password = form.elements.password.value;

        if (mode === 'signup') {
          const confirmation = form.elements.confirmPassword.value;
          if (password !== confirmation) {
            setFeedback('The two passwords do not match.', 'error', mode);
            return;
          }
        }

        try {
          setBusy(submit, true, mode === 'signup' ? 'Creating account…' : 'Signing in…');
          const data = await api(mode === 'signup' ? '/signup' : '/login', {
            method: 'POST',
            body: JSON.stringify({ username, password, turnstileToken: turnstileTokens[mode] })
          });
          csrfToken = data.csrfToken || '';
          clearFormPasswords(form);
          setFeedback(mode === 'signup' ? `Welcome, ${data.user.username}. Your account is ready.` : `Welcome back, ${data.user.username}.`, 'success', mode);
          window.setTimeout(() => location.replace(mode === 'signup' ? '/account/?welcome=1' : safeNext()), 520);
        } catch (error) {
          clearFormPasswords(form);
          setFeedback(error.message, 'error', mode);
          resetTurnstile(mode);
        } finally {
          setBusy(submit, false);
        }
      });
    });

    window.addEventListener('pagehide', clearAllAuthPasswords);
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

    if (isAuthPage) {
      const redirected = await existingSessionRedirect();
      if (redirected) return;
      setupAuthSwitcher();
      setupAuthForms();
      setupTurnstile(authMode);
    } else if (initialPage === 'account') {
      loadAccount();
    }
  }

  init();
})();
