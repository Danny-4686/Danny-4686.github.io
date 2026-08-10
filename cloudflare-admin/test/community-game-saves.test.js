import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import { handleCommunityApi } from '../src/community-api.js';
import {
  CommunityStore,
  GAME_RULES,
  GAME_SAVE_SCHEMA_VERSION,
  validateGameSaveState
} from '../src/community-store.js';

const clickerState = (overrides = {}) => ({
  clouds: 125.25,
  total: 500.75,
  clicks: 40,
  counts: { drone: 3, farm: 2, station: 1, factory: 0, bank: 0, portal: 0, foundry: 0 },
  boosts: ['tap-array'],
  achievements: ['first-front'],
  ...overrides
});

const launcherState = (overrides = {}) => ({
  credits: 900,
  best: 412,
  levels: { power: 2, bounce: 1, aero: 3, boost: 1, magnet: 0 },
  ...overrides
});

const flappyState = (overrides = {}) => ({ best: 27, ...overrides });

function sqliteAdapter() {
  const database = new DatabaseSync(':memory:');
  return {
    database,
    exec(query, ...bindings) {
      const sql = String(query);
      const trimmed = sql.trim();
      if (!bindings.length && trimmed.includes(';') && /^(PRAGMA|CREATE)/i.test(trimmed)) {
        database.exec(sql);
        return { toArray: () => [], one: () => undefined };
      }

      const statement = database.prepare(sql);
      const readsRows = /^(SELECT|PRAGMA|WITH)/i.test(trimmed);
      const rows = readsRows ? statement.all(...bindings) : (statement.run(...bindings), []);
      return {
        toArray: () => rows,
        one: () => rows[0]
      };
    }
  };
}

function createStore() {
  const sql = sqliteAdapter();
  const ctx = {
    storage: { sql },
    blockConcurrencyWhile(callback) { return callback(); }
  };
  const store = new CommunityStore(ctx, {});
  sql.exec(
    `INSERT INTO users(id, username, username_key, password_hash, password_salt, created_at, status)
     VALUES(?, ?, ?, ?, ?, ?, ?)`,
    'user-1',
    'CloudPlayer',
    'cloudplayer',
    'unused',
    'unused',
    Date.now(),
    'active'
  );
  return { store, sql };
}

async function responseJson(response) {
  return { status: response.status, body: await response.json() };
}

test('game save schemas accept only the exact known shape and bounded numbers', () => {
  assert.deepEqual(validateGameSaveState('cloudlab-clicker', clickerState()).state, clickerState());
  assert.deepEqual(validateGameSaveState('launcher', launcherState()).state, launcherState());
  assert.deepEqual(validateGameSaveState('flappy-cloud', flappyState()).state, flappyState());

  assert.match(validateGameSaveState('unknown', {}).error, /does not support/i);
  assert.match(validateGameSaveState('cloudlab-clicker', clickerState({ extra: true })).error, /shape/i);
  assert.match(validateGameSaveState('cloudlab-clicker', clickerState({ clouds: '125' })).error, /number/i);
  assert.match(validateGameSaveState('cloudlab-clicker', clickerState({ clouds: 600 })).error, /number/i);
  assert.match(validateGameSaveState('cloudlab-clicker', clickerState({ boosts: ['tap-array', 'tap-array'] })).error, /unlock/i);
  assert.match(validateGameSaveState('cloudlab-clicker', clickerState({ counts: { ...clickerState().counts, drone: -1 } })).error, /number/i);
  assert.match(validateGameSaveState('launcher', launcherState({ levels: { ...launcherState().levels, boost: 9 } })).error, /level/i);
  assert.match(validateGameSaveState('launcher', launcherState({ best: Number.NaN })).error, /number/i);
  assert.match(validateGameSaveState('flappy-cloud', flappyState({ best: 1000001 })).error, /number/i);
});

test('Clicker and Launcher have descending leaderboard rules', () => {
  assert.deepEqual(GAME_RULES['cloudlab-clicker'], {
    label: 'CloudLab Clicker', direction: 'desc', unit: 'clouds', min: 0, max: Number.MAX_SAFE_INTEGER
  });
  assert.deepEqual(GAME_RULES.launcher, {
    label: 'Launcher', direction: 'desc', unit: 'distance', min: 0, max: 1000000000
  });
  assert.deepEqual(GAME_RULES['flappy-cloud'], {
    label: 'Flappy Cloud', direction: 'desc', unit: 'points', min: 0, max: 1000000
  });
});

test('durable game saves persist by user and game, update the leaderboard, and reject stale writes', async () => {
  const { store } = createStore();

  const empty = await responseJson(store.gameSave('user-1', 'cloudlab-clicker'));
  assert.equal(empty.status, 200);
  assert.equal(empty.body.save, null);
  assert.equal(empty.body.schemaVersion, GAME_SAVE_SCHEMA_VERSION);

  const first = await responseJson(await store.saveGame({
    userId: 'user-1',
    gameId: 'cloudlab-clicker',
    schemaVersion: GAME_SAVE_SCHEMA_VERSION,
    version: 0,
    state: clickerState()
  }));
  assert.equal(first.status, 200);
  assert.equal(first.body.save.version, 1);
  assert.equal(first.body.leaderboardImproved, true);

  const loaded = await responseJson(store.gameSave('user-1', 'cloudlab-clicker'));
  assert.deepEqual(loaded.body.save.state, clickerState());
  assert.equal(loaded.body.save.version, 1);

  const leaderboard = await responseJson(store.leaderboard('cloudlab-clicker', 10));
  assert.equal(leaderboard.body.entries.length, 1);
  assert.equal(leaderboard.body.entries[0].username, 'CloudPlayer');
  assert.equal(leaderboard.body.entries[0].value, 500);

  const stale = await responseJson(await store.saveGame({
    userId: 'user-1',
    gameId: 'cloudlab-clicker',
    schemaVersion: GAME_SAVE_SCHEMA_VERSION,
    version: 0,
    state: clickerState({ total: 900, clouds: 900 })
  }));
  assert.equal(stale.status, 409);
  assert.equal(stale.body.save.version, 1);
  assert.equal(stale.body.save.state.total, 500.75);
});

test('an explicit validated reset wins once and its new version prevents resurrection', async () => {
  const { store } = createStore();
  await store.saveGame({
    userId: 'user-1', gameId: 'launcher', schemaVersion: 1, version: 0, state: launcherState()
  });

  const invalidReset = await responseJson(await store.saveGame({
    userId: 'user-1', gameId: 'launcher', schemaVersion: 1, version: 0, reset: true, state: launcherState()
  }));
  assert.equal(invalidReset.status, 400);

  const blank = launcherState({
    credits: 0,
    best: 0,
    levels: { power: 0, bounce: 0, aero: 0, boost: 0, magnet: 0 }
  });
  const reset = await responseJson(await store.saveGame({
    userId: 'user-1', gameId: 'launcher', schemaVersion: 1, version: 0, reset: true, state: blank
  }));
  assert.equal(reset.status, 200);
  assert.equal(reset.body.save.version, 2);
  assert.equal(reset.body.save.reset, true);
  assert.deepEqual(reset.body.save.state, blank);

  const resurrection = await responseJson(await store.saveGame({
    userId: 'user-1', gameId: 'launcher', schemaVersion: 1, version: 1, state: launcherState({ best: 999 })
  }));
  assert.equal(resurrection.status, 409);
  assert.equal(resurrection.body.save.version, 2);
  assert.equal(resurrection.body.save.reset, true);
  assert.deepEqual(resurrection.body.save.state, blank);
});

test('save metadata is strictly typed and Flappy Cloud persists its best score', async () => {
  const { store } = createStore();
  const stringVersion = await responseJson(await store.saveGame({
    userId: 'user-1', gameId: 'flappy-cloud', schemaVersion: 1, version: '0', state: flappyState()
  }));
  assert.equal(stringVersion.status, 400);

  const saved = await responseJson(await store.saveGame({
    userId: 'user-1', gameId: 'flappy-cloud', schemaVersion: 1, version: 0, state: flappyState()
  }));
  assert.equal(saved.status, 200);
  assert.equal(saved.body.save.version, 1);
  assert.equal(saved.body.leaderboardImproved, true);
  const leaderboard = await responseJson(store.leaderboard('flappy-cloud', 10));
  assert.equal(leaderboard.body.entries[0].value, 27);
});

test('a blank first save does not add a zero-score leaderboard entry', async () => {
  const { store } = createStore();
  const saved = await responseJson(await store.saveGame({
    userId: 'user-1', gameId: 'flappy-cloud', schemaVersion: 1, version: 0, state: { best: 0 }
  }));
  assert.equal(saved.status, 200);
  assert.equal(saved.body.leaderboardImproved, false);
  const leaderboard = await responseJson(store.leaderboard('flappy-cloud', 10));
  assert.equal(leaderboard.body.entries.length, 0);
});

function mockCommunityEnvironment() {
  const calls = [];
  const user = {
    id: 'user-1',
    username: 'CloudPlayer',
    createdAt: Date.now(),
    avatarUpdatedAt: null,
    usernameChangedAt: null,
    nextUsernameChangeAt: Date.now(),
    canChangeUsername: true
  };
  const stub = {
    async fetch(input, init = {}) {
      const url = new URL(input);
      calls.push({ path: `${url.pathname}${url.search}`, init });
      if (url.pathname === '/login') return Response.json({ ok: true, user });
      if (url.pathname === '/user') return Response.json({ user });
      if (url.pathname === '/game-save' && (init.method || 'GET') === 'GET') {
        return Response.json({ gameId: 'launcher', save: null, schemaVersion: 1 });
      }
      if (url.pathname === '/game-save' && init.method === 'POST') {
        const body = JSON.parse(init.body);
        return Response.json({
          ok: true,
          gameId: body.gameId,
          save: { state: body.state, schemaVersion: 1, version: body.version + 1, updatedAt: Date.now() }
        });
      }
      return Response.json({ error: 'not found' }, { status: 404 });
    }
  };
  return {
    calls,
    env: {
      COMMUNITY_SESSION_SECRET: 'test-session-secret-that-is-long-enough',
      COMMUNITY: { idFromName: () => 'global-id', get: () => stub }
    }
  };
}

async function login(env) {
  const response = await handleCommunityApi(new Request('https://api.danny4686.com/v1/login', {
    method: 'POST',
    headers: { Origin: 'https://danny4686.com', 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'CloudPlayer', password: 'ignored' })
  }), env);
  const data = await response.json();
  const cookieHeader = response.headers.get('Set-Cookie') || '';
  const token = cookieHeader.match(/cl_community_session_v2=([^;]+)/)?.[1];
  assert.ok(token);
  return { cookie: `cl_community_session_v2=${token}`, csrf: data.csrfToken };
}

test('public game-save API requires authentication and CSRF, then forwards only the session user', async () => {
  const { env, calls } = mockCommunityEnvironment();
  const anonymous = await handleCommunityApi(new Request('https://api.danny4686.com/v1/game-saves/launcher', {
    headers: { Origin: 'https://danny4686.com' }
  }), env);
  assert.equal(anonymous.status, 401);

  const session = await login(env);
  const loaded = await handleCommunityApi(new Request('https://api.danny4686.com/v1/game-saves/launcher', {
    headers: { Origin: 'https://danny4686.com', Cookie: session.cookie }
  }), env);
  assert.equal(loaded.status, 200);
  assert.equal((await loaded.clone().json()).accountUserId, 'user-1');

  const rejected = await handleCommunityApi(new Request('https://api.danny4686.com/v1/game-saves/launcher', {
    method: 'POST',
    headers: {
      Origin: 'https://danny4686.com',
      Cookie: session.cookie,
      'Content-Type': 'application/json',
      'X-CloudLab-CSRF': 'wrong'
    },
    body: JSON.stringify({ state: launcherState(), schemaVersion: 1, version: 0 })
  }), env);
  assert.equal(rejected.status, 403);

  const saved = await handleCommunityApi(new Request('https://api.danny4686.com/v1/game-saves/launcher', {
    method: 'POST',
    headers: {
      Origin: 'https://danny4686.com',
      Cookie: session.cookie,
      'Content-Type': 'application/json; charset=utf-8',
      'X-CloudLab-CSRF': session.csrf
    },
    body: JSON.stringify({ state: launcherState(), schemaVersion: 1, version: 0 })
  }), env);
  assert.equal(saved.status, 200);
  assert.equal((await saved.clone().json()).accountUserId, 'user-1');

  const forwarded = calls.filter((call) => call.path === '/game-save' && call.init.method === 'POST');
  assert.equal(forwarded.length, 1);
  assert.equal(JSON.parse(forwarded[0].init.body).userId, 'user-1');
});

test('game-save API rejects unknown fields and oversized bodies before durable storage', async () => {
  const { env, calls } = mockCommunityEnvironment();
  const session = await login(env);
  const headers = {
    Origin: 'https://danny4686.com',
    Cookie: session.cookie,
    'Content-Type': 'application/json',
    'X-CloudLab-CSRF': session.csrf
  };

  const wrongShape = await handleCommunityApi(new Request('https://api.danny4686.com/v1/game-saves/launcher', {
    method: 'POST', headers, body: JSON.stringify({ state: launcherState(), schemaVersion: 1, version: 0, unexpected: true })
  }), env);
  assert.equal(wrongShape.status, 400);

  const oversized = await handleCommunityApi(new Request('https://api.danny4686.com/v1/game-saves/launcher', {
    method: 'POST', headers, body: JSON.stringify({ state: launcherState(), schemaVersion: 1, version: 0, padding: 'x'.repeat(17000) })
  }), env);
  assert.equal(oversized.status, 413);
  assert.equal(calls.filter((call) => call.path === '/game-save' && call.init.method === 'POST').length, 0);
});
