(() => {
  const API = 'https://api.danny4686.com/v1';
  let session = { authenticated: false, user: null, csrfToken: '' };
  let sessionPromise = null;
  let sessionGeneration = 0;
  let profileOverlay = null;
  let profileReturnFocus = null;
  let profileRequest = 0;
  let leaderboardRefreshTimer = 0;
  let lastLeaderboardRefreshAt = 0;

  if (!document.querySelector('link[data-public-profile-ui]')) {
    const styles = document.createElement('link');
    styles.rel = 'stylesheet';
    styles.href = '/community/public-profile.css?v=20260808';
    styles.dataset.publicProfileUi = 'true';
    document.head.append(styles);
  }

  const GAME_CONFIG = {
    '/games/snake/': { id: 'snake', name: 'Snake', selector: '#bestScore', metric: 'points', direction: 'desc' },
    '/games/2048/': { id: '2048', name: '2048', selector: '#bestScore', metric: 'points', direction: 'desc' },
    '/games/memory-match/': { id: 'memory-match', name: 'Memory Match', selector: '#best', metric: 'memory', direction: 'asc' },
    '/games/pong/': { id: 'pong', name: 'Pong', selector: '#bestRally', metric: 'rally', direction: 'desc' },
    '/games/tic-tac-toe/': { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', selector: '#xWins', metric: 'wins', direction: 'desc' },
    '/games/minesweeper/': { id: 'minesweeper', name: 'Minesweeper', selector: '#best', metric: 'seconds', direction: 'asc' },
    '/games/breakout/': { id: 'breakout', name: 'Breakout', selector: '#best', metric: 'points', direction: 'desc' },
    '/games/connect-four/': { id: 'connect-four', name: 'Connect Four', selector: '#cyanWins', metric: 'wins', direction: 'desc' },
    '/games/cloud-hopper/': { id: 'cloud-hopper', name: 'Cloud Hopper', selector: '#best', metric: 'points', direction: 'desc' },
    '/games/flappy-cloud/': { id: 'flappy-cloud', name: 'Flappy Cloud', selector: '#best', metric: 'points', direction: 'desc' },
    '/games/cloudlab-clicker/': { id: 'cloudlab-clicker', name: 'CloudLab Clicker', selector: '#allTime', attribute: 'data-record-value', metric: 'clouds', direction: 'desc', syncDelay: 5000 },
    '/games/launcher/': { id: 'launcher', name: 'Launcher', selector: '#bestDistance', metric: 'distance', direction: 'desc' },
    '/games/tower-stacker/': { id: 'tower-stacker', name: 'Tower Stacker', selector: '#best', metric: 'height', direction: 'desc' }
  };

  function publishCommunity() {
    const community = {
      session,
      refresh: refreshSession,
      submitRecord,
      loadGameSave,
      saveGameState
    };
    window.CloudLabCommunity = community;
    window.dispatchEvent(new CustomEvent('cloudlab:community-ready', { detail: community }));
    return community;
  }

  async function api(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (options.method && options.method !== 'GET' && session.csrfToken) headers.set('X-CloudLab-CSRF', session.csrfToken);
    const response = await fetch(`${API}${path}`, { ...options, headers, credentials: 'include' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || 'The community service could not complete that request.');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  function loadSession() {
    if (!sessionPromise) {
      const generation = ++sessionGeneration;
      sessionPromise = api('/session').then((data) => {
        if (generation !== sessionGeneration) return session;
        session = data;
        publishCommunity();
        return session;
      }).catch(() => {
        if (generation === sessionGeneration) sessionPromise = null;
        return session;
      });
    }
    return sessionPromise;
  }

  async function refreshSession() {
    sessionPromise = null;
    return loadSession();
  }

  function toast(message, type = '') {
    document.querySelector('.community-toast')?.remove();
    const element = document.createElement('div');
    element.className = `community-toast${type ? ` is-${type}` : ''}`;
    element.setAttribute('role', 'status');
    element.textContent = message;
    document.body.append(element);
    window.setTimeout(() => element.classList.add('is-leaving'), 2600);
    window.setTimeout(() => element.remove(), 2920);
  }

  function ensureProfileOverlay() {
    if (profileOverlay) return profileOverlay;
    profileOverlay = document.createElement('div');
    profileOverlay.className = 'community-profile-overlay';
    profileOverlay.hidden = true;
    profileOverlay.innerHTML = `
      <section class="community-public-profile" role="dialog" aria-modal="true" aria-label="CloudLab public profile">
        <button class="community-profile-close" type="button" aria-label="Close profile">×</button>
        <div class="community-profile-loading" role="status" aria-live="polite">Loading profile…</div>
        <div class="community-profile-content" hidden>
          <div class="community-profile-head">
            <div class="community-profile-avatar"><span></span><img alt="" hidden></div>
            <div class="community-profile-identity">
              <span class="community-profile-status" hidden></span>
              <h3 id="communityProfileName"></h3>
              <p class="community-profile-joined"></p>
            </div>
          </div>
          <p class="community-profile-bio"></p>
        </div>
      </section>`;
    document.body.append(profileOverlay);

    const close = () => closePublicProfile();
    profileOverlay.querySelector('.community-profile-close').addEventListener('click', close);
    profileOverlay.addEventListener('click', (event) => {
      if (event.target === profileOverlay) close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !profileOverlay.hidden) close();
      if (event.key === 'Tab' && !profileOverlay.hidden) {
        event.preventDefault();
        profileOverlay.querySelector('.community-profile-close').focus();
      }
    });
    return profileOverlay;
  }

  function closePublicProfile() {
    if (!profileOverlay) return;
    profileOverlay.hidden = true;
    document.body.classList.remove('community-profile-open');
    profileReturnFocus?.focus?.();
    profileReturnFocus = null;
  }

  async function openPublicProfile(userId, trigger) {
    if (!userId) return;
    const request = ++profileRequest;
    const overlay = ensureProfileOverlay();
    const loading = overlay.querySelector('.community-profile-loading');
    const content = overlay.querySelector('.community-profile-content');
    profileReturnFocus = trigger || document.activeElement;
    loading.textContent = 'Loading profile…';
    loading.hidden = false;
    content.hidden = true;
    overlay.hidden = false;
    document.body.classList.add('community-profile-open');
    overlay.querySelector('.community-profile-close').focus();

    try {
      const data = await api(`/profiles/${encodeURIComponent(userId)}`);
      if (request !== profileRequest || overlay.hidden) return;
      const profile = data.profile;
      const avatar = overlay.querySelector('.community-profile-avatar');
      const fallback = avatar.querySelector('span');
      const image = avatar.querySelector('img');
      const status = overlay.querySelector('.community-profile-status');
      const name = overlay.querySelector('.community-profile-identity h3');
      const joined = overlay.querySelector('.community-profile-joined');
      const bio = overlay.querySelector('.community-profile-bio');

      fallback.textContent = profile.username.slice(0, 1).toUpperCase();
      if (profile.avatarUrl) {
        image.src = profile.avatarUrl;
        image.alt = `${profile.username}'s profile picture`;
        image.hidden = false;
        avatar.classList.add('has-image');
      } else {
        image.hidden = true;
        image.removeAttribute('src');
        avatar.classList.remove('has-image');
      }

      status.textContent = profile.statusText || '';
      status.hidden = !profile.statusText;
      name.textContent = profile.username;
      joined.textContent = `Account created ${new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`;
      bio.textContent = profile.bio || 'This user has not added a bio yet.';
      loading.hidden = true;
      content.hidden = false;
    } catch (error) {
      if (request !== profileRequest || overlay.hidden) return;
      loading.textContent = error.message;
    }
  }

  function normalizePath() {
    const path = location.pathname.toLowerCase();
    return path.endsWith('/') ? path : `${path}/`;
  }

  function currentGame() {
    const path = normalizePath();
    return Object.entries(GAME_CONFIG).find(([route]) => path.startsWith(route))?.[1] || null;
  }

  function parseRecord(config, target) {
    const rawValue = config.attribute ? target?.getAttribute(config.attribute) : target?.textContent;
    const value = String(rawValue || '').trim();
    if (!value || value === '--') return null;
    if (config.metric === 'memory') {
      const match = value.match(/(\d+)\s*\/\s*(\d+):(\d+)/);
      if (!match) return null;
      return { value: Number(match[1]), secondary: Number(match[2]) * 60 + Number(match[3]), extra: {} };
    }
    const number = Number(value.replace(/[^0-9-]/g, ''));
    if (!Number.isFinite(number) || number <= 0) return null;
    return { value: number, secondary: null, extra: {} };
  }

  function formatValue(config, entry) {
    if (config.metric === 'memory') {
      const time = Number(entry.secondary || 0);
      return `${entry.value} moves · ${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`;
    }
    if (config.metric === 'seconds') return `${entry.value}s`;
    if (config.metric === 'rally') return `${entry.value} rally`;
    if (config.metric === 'wins') return `${entry.value} wins`;
    if (config.metric === 'height') return `${Number(entry.value).toLocaleString()} high`;
    if (config.metric === 'clouds') return `${Number(entry.value).toLocaleString()} Clouds`;
    if (config.metric === 'distance') return `${Number(entry.value).toLocaleString()} m`;
    return Number(entry.value).toLocaleString();
  }

  async function submitRecord(gameId, value, secondary = null, extra = {}) {
    await loadSession();
    if (!session.authenticated) return { improved: false, signedOut: true };
    return api('/scores', {
      method: 'POST',
      body: JSON.stringify({ gameId, value, secondary, extra })
    });
  }

  async function loadGameSave(gameId) {
    await refreshSession();
    if (!session.authenticated) {
      return { authenticated: false, user: null, gameId, save: null };
    }
    const expectedUserId = session.user?.id || '';
    let data;
    try {
      data = await api(`/game-saves/${encodeURIComponent(gameId)}`);
    } catch (error) {
      if (error.status !== 401) throw error;
      await refreshSession();
      if (!session.authenticated) return { authenticated: false, signedOut: true, user: null, gameId, save: null };
      data = await api(`/game-saves/${encodeURIComponent(gameId)}`);
    }
    if (data.accountUserId && data.accountUserId !== expectedUserId) {
      await refreshSession();
      if (!session.authenticated) return { authenticated: false, signedOut: true, user: null, gameId, save: null };
      if (data.accountUserId !== session.user?.id) {
        return { authenticated: true, accountChanged: true, user: session.user, gameId, save: null };
      }
    }
    return { ...data, authenticated: true, user: session.user };
  }

  async function saveGameState(gameId, state, options = {}) {
    await loadSession();
    if (!session.authenticated) {
      return { ok: false, authenticated: false, signedOut: true, gameId };
    }
    const expectedUserId = session.user?.id || '';
    const request = {
      method: 'POST',
      body: JSON.stringify({
        state,
        schemaVersion: 1,
        version: Number.isSafeInteger(options.version) && options.version >= 0 ? options.version : 0,
        reset: options.reset === true
      })
    };
    if (options.keepalive) request.keepalive = true;
    let data;
    try {
      data = await api(`/game-saves/${encodeURIComponent(gameId)}`, request);
    } catch (error) {
      if (error.status === 409 && error.data?.save) {
        if (error.data.accountUserId && error.data.accountUserId !== expectedUserId) {
          await refreshSession();
          return { ok: false, authenticated: session.authenticated, accountChanged: true, gameId, user: session.user };
        }
        return { ...error.data, conflict: true, authenticated: true, user: session.user };
      }
      const canRefresh = error.status === 401 || (error.status === 403 && /security token expired/i.test(error.message));
      if (!canRefresh) throw error;
      await refreshSession();
      if (!session.authenticated) {
        return { ok: false, authenticated: false, signedOut: true, gameId };
      }
      if (session.user?.id !== expectedUserId) {
        return { ok: false, authenticated: true, accountChanged: true, gameId, user: session.user };
      }
      data = await api(`/game-saves/${encodeURIComponent(gameId)}`, request);
    }
    if (data.accountUserId && data.accountUserId !== expectedUserId) {
      await refreshSession();
      return { ok: false, authenticated: session.authenticated, accountChanged: true, gameId, user: session.user };
    }
    if (data.leaderboardImproved) scheduleLeaderboardRefresh();
    return { ...data, authenticated: true, user: session.user };
  }

  async function initHeaderAccount() {
    const header = document.querySelector('.hub-header');
    const action = header?.querySelector('.header-action');
    if (!header || !action || header.querySelector('.community-header-actions')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'community-header-actions';
    action.before(wrapper);

    const account = document.createElement('a');
    account.className = 'community-account-link';
    account.href = '/login/';
    account.innerHTML = '<span class="community-account-dot"></span><span>Sign in</span>';
    wrapper.append(account, action);

    await loadSession();
    if (session.authenticated) {
      account.href = '/account/';
      account.classList.add('is-authenticated');
      account.querySelector('span:last-child').textContent = session.user.username;
      account.setAttribute('aria-label', `Open ${session.user.username}'s account`);
    }
  }

  async function initJournalLike() {
    const match = normalizePath().match(/^\/journal\/posts\/([a-z0-9-]+)\/$/);
    const copy = document.querySelector('.post-intro-copy');
    if (!match || !copy || copy.querySelector('.journal-like-wrap')) return;
    const slug = match[1];
    const wrap = document.createElement('div');
    wrap.className = 'journal-like-wrap';
    wrap.innerHTML = '<button class="journal-like-button" type="button"><span class="journal-like-heart">♡</span><span class="journal-like-label">Like post</span><strong class="journal-like-count">0</strong></button><span class="journal-like-note">Account-based likes</span>';
    copy.append(wrap);
    const button = wrap.querySelector('button');
    const heart = wrap.querySelector('.journal-like-heart');
    const label = wrap.querySelector('.journal-like-label');
    const count = wrap.querySelector('.journal-like-count');

    function apply(data) {
      button.classList.toggle('is-liked', Boolean(data.liked));
      button.setAttribute('aria-pressed', String(Boolean(data.liked)));
      heart.textContent = data.liked ? '♥' : '♡';
      label.textContent = data.liked ? 'Liked' : 'Like post';
      count.textContent = Number(data.count || 0).toLocaleString();
    }

    try {
      await loadSession();
      apply(await api(`/posts/${slug}/like`));
    } catch (_) {}

    button.addEventListener('click', async () => {
      await loadSession();
      if (!session.authenticated) {
        location.href = `/login/?next=${encodeURIComponent(location.pathname)}`;
        return;
      }
      button.disabled = true;
      try {
        apply(await api(`/posts/${slug}/like`, { method: 'POST', body: '{}' }));
      } catch (error) {
        toast(error.message, 'error');
      } finally {
        button.disabled = false;
      }
    });
  }

  async function initLeaderboard() {
    const config = currentGame();
    const panel = document.querySelector('.game-panel');
    if (!config || !panel || document.querySelector('.community-leaderboard')) return;

    const section = document.createElement('section');
    section.className = 'community-leaderboard reveal visible';
    section.innerHTML = `<div class="community-leaderboard-head"><div><p class="eyebrow">COMMUNITY RECORDS</p><h2>${config.name} leaderboard</h2><p>Tap a player to view their CloudLab profile.</p></div><span class="community-leaderboard-status">TOP 10</span></div><div class="community-ranking"><div class="community-leaderboard-empty">Loading leaderboard…</div></div><div class="community-leaderboard-foot"><span class="community-sync-note">Sign in to sync your personal best.</span><a href="/login/">Sign in</a></div>`;
    panel.insertAdjacentElement('afterend', section);
    const ranking = section.querySelector('.community-ranking');
    const note = section.querySelector('.community-sync-note');
    const link = section.querySelector('.community-leaderboard-foot a');

    try {
      await loadSession();
      if (session.authenticated) {
        note.textContent = `Signed in as ${session.user.username}. Improved records sync automatically.`;
        link.href = '/account/';
        link.textContent = 'My records';
      } else {
        link.href = `/login/?next=${encodeURIComponent(location.pathname)}`;
      }

      const data = await api(`/leaderboards/${config.id}?limit=10`);
      ranking.replaceChildren();
      if (!data.entries.length) {
        const empty = document.createElement('div');
        empty.className = 'community-leaderboard-empty';
        empty.textContent = 'No saved records yet. The first signed-in player can take the top spot.';
        ranking.append(empty);
      } else {
        data.entries.forEach((entry) => {
          const row = document.createElement('div');
          row.className = `community-rank-row${session.user?.id === entry.userId ? ' is-me' : ''}`;

          const rank = document.createElement('span');
          rank.className = 'community-rank-number';
          rank.textContent = entry.rank;

          const profileButton = document.createElement('button');
          profileButton.className = 'community-rank-profile';
          profileButton.type = 'button';
          profileButton.setAttribute('aria-label', `View ${entry.username}'s profile`);

          const avatar = document.createElement('span');
          avatar.className = 'community-rank-avatar';
          avatar.textContent = entry.username.slice(0, 1).toUpperCase();
          if (entry.avatarUrl) {
            const image = document.createElement('img');
            image.src = entry.avatarUrl;
            image.alt = '';
            avatar.append(image);
          }

          const name = document.createElement('span');
          name.className = 'community-rank-name';
          name.textContent = entry.username;
          profileButton.append(avatar, name);
          profileButton.addEventListener('click', () => openPublicProfile(entry.userId, profileButton));

          const value = document.createElement('span');
          value.className = 'community-rank-value';
          value.textContent = formatValue(config, entry);
          row.append(rank, profileButton, value);
          ranking.append(row);
        });
      }
    } catch (error) {
      ranking.replaceChildren();
      const empty = document.createElement('div');
      empty.className = 'community-leaderboard-empty';
      empty.textContent = error.message;
      ranking.append(empty);
    }
  }

  async function initRecordSync() {
    const config = currentGame();
    if (!config) return;
    const target = document.querySelector(config.selector);
    if (!target) return;
    await loadSession();
    if (!session.authenticated) return;

    let lastSent = '';
    let timer = null;
    async function sync() {
      const record = parseRecord(config, target);
      if (!record) return;
      const signature = `${record.value}:${record.secondary ?? ''}`;
      if (signature === lastSent) return;
      lastSent = signature;
      try {
        const result = await submitRecord(config.id, record.value, record.secondary, record.extra);
        if (result.improved) {
          toast(`${config.name} personal best saved to your account.`, 'success');
          scheduleLeaderboardRefresh();
        }
      } catch (error) {
        lastSent = '';
        if (!/sign in/i.test(error.message)) toast(error.message, 'error');
      }
    }

    let syncRunning = false;
    let pending = false;
    function schedule() {
      if (timer || syncRunning) {
        pending = true;
        return;
      }
      timer = window.setTimeout(async () => {
        timer = null;
        syncRunning = true;
        await sync();
        syncRunning = false;
        if (pending) {
          pending = false;
          schedule();
        }
      }, config.syncDelay || 750);
    }

    new MutationObserver(schedule).observe(target, { attributes: true, childList: true, characterData: true, subtree: true });
    schedule();
  }

  async function initLeaderboardRefresh() {
    const existing = document.querySelector('.community-leaderboard');
    if (existing) existing.remove();
    await initLeaderboard();
  }

  function scheduleLeaderboardRefresh() {
    if (leaderboardRefreshTimer) return;
    const elapsed = Date.now() - lastLeaderboardRefreshAt;
    const wait = Math.max(450, 5000 - elapsed);
    leaderboardRefreshTimer = window.setTimeout(async () => {
      leaderboardRefreshTimer = 0;
      lastLeaderboardRefreshAt = Date.now();
      await initLeaderboardRefresh();
    }, wait);
  }

  async function init() {
    initHeaderAccount();
    initJournalLike();
    initLeaderboard();
    initRecordSync();
  }

  publishCommunity();
  init();
})();
