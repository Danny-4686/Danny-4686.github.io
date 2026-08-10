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

function loadClient(fetchImpl) {
  const listeners = new Map();
  const document = {
    head: { append() {} },
    body: { append() {}, classList: { add() {}, remove() {} } },
    createElement() { return { dataset: {}, classList: { add() {} }, setAttribute() {} }; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {}
  };
  class TestCustomEvent {
    constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
  }
  const context = {
    URL,
    Headers,
    Response,
    CustomEvent: TestCustomEvent,
    console,
    document,
    fetch: fetchImpl,
    location: { pathname: '/' },
    setTimeout,
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

test('game-save loads attach the account that actually answered the request', async () => {
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
  assert.equal(result.authenticated, true);
  assert.equal(result.accountUserId, 'b');
  assert.equal(result.user.id, 'b');
});

test('an older session request cannot overwrite a newer account refresh', async () => {
  const pending = [];
  const client = loadClient(() => new Promise((resolve) => pending.push(resolve)));
  const first = client.refresh();
  const second = client.refresh();
  pending[1](sessionResponse(user('b')));
  assert.equal((await second).user.id, 'b');
  pending[0](sessionResponse(user('a')));
  assert.equal((await first).user.id, 'b');
});
