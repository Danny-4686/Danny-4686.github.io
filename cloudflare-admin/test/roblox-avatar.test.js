import assert from 'node:assert/strict';
import test from 'node:test';

import { ROBLOX_AVATAR_USER_ID, handleRobloxAvatar, robloxImageUrl } from '../src/roblox-avatar.js';

const ORIGINS = new Set(['https://danny4686.com']);
const RENDER = 'https://tr.rbxcdn.com/30DAY-Avatar-0123456789ABCDEF-Png/720/720/Avatar/Png/noFilter';

function request(origin = 'https://danny4686.com', method = 'GET') {
  return new Request('https://api.danny4686.com/v1/roblox-avatar?userId=1', { method, headers: origin ? { Origin: origin } : {} });
}

function mockRoblox(context, entry = {}) {
  const calls = [];
  context.mock.method(globalThis, 'fetch', async (input) => {
    calls.push(String(input));
    return Response.json({ data: [{ targetId: Number(ROBLOX_AVATAR_USER_ID), state: 'Completed', imageUrl: RENDER, version: 'TN3', ...entry }] });
  });
  return calls;
}

test('only https Roblox CDN image URLs are accepted', () => {
  assert.equal(robloxImageUrl(RENDER), RENDER);
  assert.equal(robloxImageUrl('https://t3.rbxcdn.com/abc'), 'https://t3.rbxcdn.com/abc');
  assert.equal(robloxImageUrl('http://tr.rbxcdn.com/abc'), '');
  assert.equal(robloxImageUrl('https://evil.example/abc'), '');
  assert.equal(robloxImageUrl('https://tr.rbxcdn.com.evil.example/abc'), '');
  assert.equal(robloxImageUrl('javascript:alert(1)'), '');
});

test('the live render is looked up for the pinned account and served with CORS', async (context) => {
  const calls = mockRoblox(context);
  const response = await handleRobloxAvatar(request(), {}, '/roblox-avatar', ORIGINS);
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://danny4686.com');
  assert.match(response.headers.get('Cache-Control'), /max-age=300/);
  assert.deepEqual(data, { available: true, userId: ROBLOX_AVATAR_USER_ID, imageUrl: RENDER, version: 'TN3' });
  assert.equal(calls.length, 1);
  assert.match(calls[0], new RegExp(`userIds=${ROBLOX_AVATAR_USER_ID}&`), 'query string cannot change the account');
});

test('pending renders and unexpected image hosts are reported as unavailable', async (context) => {
  mockRoblox(context, { state: 'Pending' });
  let data = await (await handleRobloxAvatar(request(), {}, '/roblox-avatar', ORIGINS)).json();
  assert.deepEqual(data, { available: false, state: 'Pending' });

  context.mock.restoreAll();
  mockRoblox(context, { imageUrl: 'https://evil.example/avatar.png' });
  data = await (await handleRobloxAvatar(request(), {}, '/roblox-avatar', ORIGINS)).json();
  assert.equal(data.available, false);
});

test('Roblox errors surface their status without caching', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 403 }));
  const response = await handleRobloxAvatar(request(), {}, '/roblox-avatar', ORIGINS);
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal((await response.json()).upstreamStatus, 403);
});

test('other origins, methods, and sub-paths are refused', async (context) => {
  mockRoblox(context);
  const other = await handleRobloxAvatar(request('https://evil.example'), {}, '/roblox-avatar', ORIGINS);
  assert.equal(other.headers.get('Access-Control-Allow-Origin'), null);
  assert.equal((await handleRobloxAvatar(request(undefined, 'POST'), {}, '/roblox-avatar', ORIGINS)).status, 405);
  assert.equal((await handleRobloxAvatar(request(), {}, '/roblox-avatar/assets/x', ORIGINS)).status, 404);
});
