import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const clientSource = await readFile(new URL('../../community/community-client.js', import.meta.url), 'utf8');

function user(id) {
  return { id, username: `Player-${id}`, createdAt: Date.now() };
}

function sessionResponse(account) {
  return Response.json(account
    ? { authenticated: true, user: account, csrfToken: `csrf-${account.id}` }
    : { authenticated: false, user: null, csrfToken: '' });
}

function loadClient(fetchImpl, options = {}) {
  const listeners = new Map();
  const target = options.target || null;
  const document = {
    head: { append() {} },
    body: { append(element) { options.onBodyAppend?.(element); }, classList: { add() {}, remove() {} } },
    createElement() {
      return {
        dataset: {},
        classList: { add() {}, remove() {}, toggle() {} },
        setAttribute() {},
        removeAttribute() {},
        remove() {}
      };
    },
    querySelector(selector) {
      if (selector === options.targetSelector) return target;
      return null;
    },
    querySelectorAll() { return []; },
    addEventListener() {}
  };
  class TestCustomEvent {
    constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
  }
  class TestMutationObserver {
    constructor(callback) { this.callback = callback; }
    observe() {}
    disconnect() {}
  }
  const context = {
    URL,
    Headers,
    MutationObserver: TestMutationObserver,
    Response,
    CustomEvent: TestCustomEvent,
    console,
    document,
    fetch: fetchImpl,
    location: { pathname: options.pathname || '/', reload: options.onReload || (() => {}) },
    setTimeout: options.setTimeout || setTimeout,
    clearTimeout,
    encodeURIComponent,
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type) { listeners.delete(type); },
    dispatchEvent(event) { listeners.get(event.type)?.(event); return true; }
  };
  context.window = context;
  vm.runInNewContext(clientSource, context, { filename: 'community-client.js' });
  return context.CloudLabCommunity;
}

test('a CSRF refresh never retries one account save under a different account', async () => {
  const accountA = user('a');
  const accountB = user('b');
  let sessionReads = 0;
  let saveWrites = 0;
  const client = loadClient(async (input, init = {}) => {
    const path = new URL(input).pathname;
    if (path.endsWith('/session')) return sessionResponse(sessionReads++ === 0 ? accountA : accountB);
    if (path.includes('/game-saves/') && init.method === 'POST') {
      saveWrites += 1;
      return Response.json({ error: 'Security token expired. Refresh and try again.' }, { status: 403 });
    }
    throw new Error(`Unexpected request: ${path}`);
  });

  const result = await client.saveGameState('launcher', { credits: 5 }, { version: 2 });
  assert.equal(result.accountChanged, true);
  assert.equal(result.user.id, 'b');
  assert.equal(saveWrites, 1);
});

test('a signed-out refresh stops stale account saves', async () => {
  const accountA = user('a');
  let sessionReads = 0;
  let saveWrites = 0;
  const client = loadClient(async (input, init = {}) => {
    const path = new URL(input).pathname;
    if (path.endsWith('/session')) return sessionResponse(sessionReads++ === 0 ? accountA : null);
    if (path.includes('/game-saves/') && init.method === 'POST') {
      saveWrites += 1;
      return Response.json({ error: 'Sign in to save game progress.' }, { status: 401 });
    }
    throw new Error(`Unexpected request: ${path}`);
  });

  const result = await client.saveGameState('launcher', { credits: 5 }, { version: 2 });
  assert.equal(result.signedOut, true);
  assert.equal(result.authenticated, false);
  assert.equal(saveWrites, 1);
});

test('a game-save load never attaches another account to the current game state', async () => {
  const accountA = user('a');
  const accountB = user('b');
  let sessionReads = 0;
  const client = loadClient(async (input) => {
    const path = new URL(input).pathname;
    if (path.endsWith('/session')) return sessionResponse(sessionReads++ === 0 ? accountA : accountB);
    if (path.includes('/game-saves/')) {
      return Response.json({ gameId: 'launcher', accountUserId: 'b', save: null, schemaVersion: 1 });
    }
    throw new Error(`Unexpected request: ${path}`);
  });

  const result = await client.loadGameSave('launcher');
  assert.equal(result.accountChanged, true);
  assert.equal(result.user.id, 'b');
});

test('a score refresh never retries one account record under another account', async () => {
  const accountA = user('a');
  const accountB = user('b');
  let sessionReads = 0;
  let scoreWrites = 0;
  const client = loadClient(async (input, init = {}) => {
    const path = new URL(input).pathname;
    if (path.endsWith('/session')) return sessionResponse(sessionReads++ === 0 ? accountA : accountB);
    if (path.endsWith('/scores') && init.method === 'POST') {
      scoreWrites += 1;
      return Response.json({ error: 'Security token expired. Refresh and try again.' }, { status: 403 });
    }
    throw new Error(`Unexpected request: ${path}`);
  });

  const result = await client.submitRecord('snake', 42);
  assert.equal(result.accountChanged, true);
  assert.equal(result.user.id, 'b');
  assert.equal(scoreWrites, 1);
});

test('concurrent session refreshes share one authoritative request', async () => {
  let resolveSession;
  let sessionReads = 0;
  const client = loadClient(() => {
    sessionReads += 1;
    return new Promise((resolve) => { resolveSession = resolve; });
  });
  const first = client.refresh();
  const second = client.refresh();
  assert.equal(sessionReads, 1);
  resolveSession(sessionResponse(user('b')));
  assert.equal((await second).user.id, 'b');
  assert.equal((await first).user.id, 'b');
});

test('a game-save load joins the in-flight session check instead of invalidating it', async () => {
  const account = user('a');
  let resolveSession;
  let sessionReads = 0;
  const client = loadClient(async (input) => {
    const path = new URL(input).pathname;
    if (path.endsWith('/session')) {
      sessionReads += 1;
      return new Promise((resolve) => { resolveSession = resolve; });
    }
    if (path.includes('/game-saves/')) {
      return Response.json({ gameId: 'launcher', accountUserId: 'a', save: null, schemaVersion: 1 });
    }
    throw new Error(`Unexpected request: ${path}`);
  });

  const sessionCheck = client.refresh();
  const gameSave = client.loadGameSave('launcher');
  assert.equal(sessionReads, 1);
  resolveSession(sessionResponse(account));
  assert.equal((await sessionCheck).user.id, 'a');
  assert.equal((await gameSave).user.id, 'a');
});

test('a temporary session-service failure is not reported as a logout', async () => {
  const client = loadClient(async (input) => {
    const path = new URL(input).pathname;
    if (path.endsWith('/session')) {
      return Response.json({ error: 'The community service is temporarily unavailable.' }, { status: 503 });
    }
    throw new Error(`Unexpected request: ${path}`);
  });

  await assert.rejects(client.loadGameSave('launcher'), /temporarily unavailable/i);
  assert.equal(client.session.authenticated, false);
});

test('a failed refresh preserves the last confirmed authenticated session', async () => {
  const account = user('a');
  let sessionReads = 0;
  const client = loadClient(async (input) => {
    const path = new URL(input).pathname;
    if (!path.endsWith('/session')) throw new Error(`Unexpected request: ${path}`);
    if (sessionReads++ === 0) return sessionResponse(account);
    return Response.json({ error: 'The community service is temporarily unavailable.' }, { status: 503 });
  });

  assert.equal((await client.refresh()).user.id, 'a');
  await assert.rejects(client.refresh(), /temporarily unavailable/i);
  assert.equal(client.session.authenticated, true);
  assert.equal(client.session.user.id, 'a');
});

test('a confirmed account switch reloads a game before its in-memory state can cross accounts', async () => {
  const accounts = [user('a'), user('b')];
  let sessionReads = 0;
  let reloads = 0;
  const client = loadClient(async (input) => {
    const path = new URL(input).pathname;
    if (path.endsWith('/session')) return sessionResponse(accounts[sessionReads++]);
    throw new Error(`Unexpected request: ${path}`);
  }, {
    pathname: '/games/cloudlab-clicker/',
    onReload() { reloads += 1; }
  });

  assert.equal((await client.refresh()).user.id, 'a');
  assert.equal((await client.refresh()).user.id, 'b');
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.equal(reloads, 1);
});

test('save-managed games do not run the duplicate generic score notifier', async () => {
  let sessionReads = 0;
  let scoreWrites = 0;
  const target = {
    textContent: '250',
    getAttribute() { return '250'; }
  };
  loadClient(async (input, init = {}) => {
    const path = new URL(input).pathname;
    if (path.endsWith('/session')) {
      sessionReads += 1;
      return sessionResponse(user('a'));
    }
    if (path.endsWith('/scores') && init.method === 'POST') {
      scoreWrites += 1;
      return Response.json({ improved: true });
    }
    throw new Error(`Unexpected request: ${path}`);
  }, {
    pathname: '/games/cloudlab-clicker/',
    target,
    targetSelector: '#allTime'
  });

  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(sessionReads, 0);
  assert.equal(scoreWrites, 0);
});

test('a legacy game silently migrates its current best after sign-in', async () => {
  let scoreWrites = 0;
  let toastAppends = 0;
  const target = { textContent: '42', getAttribute() { return null; } };
  loadClient(async (input, init = {}) => {
    const path = new URL(input).pathname;
    if (path.endsWith('/session')) return sessionResponse(user('a'));
    if (path.endsWith('/scores') && init.method === 'POST') {
      scoreWrites += 1;
      return Response.json({ improved: true });
    }
    throw new Error(`Unexpected request: ${path}`);
  }, {
    pathname: '/games/snake/',
    target,
    targetSelector: '#bestScore',
    onBodyAppend() { toastAppends += 1; },
    setTimeout(callback, delay) { return setTimeout(callback, Math.min(delay, 5)); }
  });

  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(scoreWrites, 1);
  assert.equal(toastAppends, 0);
});
