import assert from 'node:assert/strict';
import test from 'node:test';

import { handleCommunityApi } from '../src/community-api.js';
import { isSafeRepositoryPath } from '../src/github.js';
import { addTransportSecurity } from '../src/transport-security.js';
import { html, LOGIN_PAGE_CSP } from '../src/utils.js';

const SECRET = 'test-session-secret-that-is-long-enough';
const encoder = new TextEncoder();

function base64Url(bytes) {
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function signToken(payload) {
  const data = base64Url(encoder.encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey('raw', encoder.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `${data}.${base64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(data))))}`;
}

function communityEnvironment() {
  const calls = [];
  const user = { id: 'user-1', username: 'CloudPlayer', createdAt: Date.now() };
  const stub = {
    async fetch(input, init = {}) {
      const url = new URL(input);
      calls.push({ path: url.pathname, init });
      if (url.pathname === '/user') return Response.json({ user });
      if (url.pathname === '/score') return Response.json({ ok: true, improved: true });
      return Response.json({ error: 'not found' }, { status: 404 });
    }
  };
  return { calls, env: { COMMUNITY_SESSION_SECRET: SECRET, COMMUNITY: { idFromName: () => 'id', get: () => stub } } };
}

test('responses without their own policy get a locked-down CSP; existing policies are kept', () => {
  const plain = addTransportSecurity(new Response('{}', { headers: { 'Content-Type': 'application/json' } }));
  assert.match(plain.headers.get('content-security-policy') || '', /default-src 'none'/);
  assert.match(plain.headers.get('content-security-policy') || '', /frame-ancestors 'none'/);

  const custom = addTransportSecurity(new Response('ok', { headers: { 'Content-Security-Policy': "default-src 'self'" } }));
  assert.equal(custom.headers.get('content-security-policy'), "default-src 'self'");
});

test('admin HTML pages, including sign-in error pages, always carry a CSP', () => {
  const errorPage = html('<p>error</p>', 400);
  assert.equal(errorPage.headers.get('content-security-policy'), LOGIN_PAGE_CSP);
  assert.equal(errorPage.headers.get('cross-origin-opener-policy'), 'same-origin');

  const dashboard = html('<p>ok</p>', 200, { 'Content-Security-Policy': "default-src 'none'; script-src 'self'" });
  assert.equal(dashboard.headers.get('content-security-policy'), "default-src 'none'; script-src 'self'");
});

test('GitHub commits refuse paths that leave the site tree or touch git metadata', () => {
  assert.equal(isSafeRepositoryPath('assets/images/journal/post/thumbnail.png'), true);
  assert.equal(isSafeRepositoryPath('journal/posts.json'), true);
  for (const bad of ['', '../x', 'a/../b', 'a//b', 'a/./b', '.git/config', 'assets/.GIT/hooks/x', 'a\\b', 'a/b\u0000.png', 'x/']) {
    assert.equal(isSafeRepositoryPath(bad), false, bad);
  }
});

test('community session tokens without a valid expiry are rejected', async () => {
  const { env } = communityEnvironment();
  const now = Math.floor(Date.now() / 1000);
  const session = async (payload) => {
    const token = await signToken(payload);
    const response = await handleCommunityApi(new Request('https://api.danny4686.com/v1/session', {
      headers: { Origin: 'https://danny4686.com', Cookie: `cl_community_session_v2=${token}` }
    }), env);
    return (await response.json()).authenticated;
  };

  assert.equal(await session({ uid: 'user-1', username: 'CloudPlayer', csrf: 'abc', iat: now, exp: now + 60 }), true);
  assert.equal(await session({ uid: 'user-1', username: 'CloudPlayer', csrf: 'abc', iat: now }), false);
  assert.equal(await session({ uid: 'user-1', username: 'CloudPlayer', csrf: 'abc', iat: now, exp: 'never' }), false);
  assert.equal(await session({ uid: 'user-1', username: 'CloudPlayer', csrf: 'abc', iat: now, exp: now - 5 }), false);
});

test('community JSON bodies are size-checked even without a Content-Length header', async (context) => {
  context.mock.method(console, 'error', () => {});
  const { env, calls } = communityEnvironment();
  const now = Math.floor(Date.now() / 1000);
  const token = await signToken({ uid: 'user-1', username: 'CloudPlayer', csrf: 'csrf-token', iat: now, exp: now + 60 });
  const headers = {
    Origin: 'https://danny4686.com',
    Cookie: `cl_community_session_v2=${token}`,
    'Content-Type': 'application/json',
    'X-CloudLab-CSRF': 'csrf-token'
  };

  const body = JSON.stringify({ gameId: 'snake', value: 10, padding: 'x'.repeat(400000) });
  const request = new Request('https://api.danny4686.com/v1/scores', { method: 'POST', headers, body });
  assert.equal(request.headers.get('Content-Length'), null);
  const oversized = await handleCommunityApi(request, env);
  assert.equal(oversized.status, 500);
  assert.equal(calls.filter((call) => call.path === '/score').length, 0);

  const normal = await handleCommunityApi(new Request('https://api.danny4686.com/v1/scores', {
    method: 'POST', headers, body: JSON.stringify({ gameId: 'snake', value: 10 })
  }), env);
  assert.equal(normal.status, 200);
  assert.equal(JSON.parse(calls.find((call) => call.path === '/score').init.body).userId, 'user-1');
});
