import assert from 'node:assert/strict';
import test from 'node:test';

import worker from '../src/worker.js';
import { CSRF_COOKIE, SESSION_COOKIE, signSession } from '../src/utils.js';
import { SITE_GATE_PATH, buildSiteGateScript } from '../src/site-gate.js';

const settings = { forceSiteIntro: false, featuredGames: ['launcher'], profileImage: '/assets/images/optimized/profile-600.webp', profileView: 'image' };

function setup({ storeFails = false, commitFails = false } = {}) {
  let stored = null;
  const commits = [];
  const env = {
    SESSION_SECRET: 'secret', ALLOWED_GITHUB_LOGIN: 'Danny-4686', ALLOWED_GITHUB_ID: '1',
    GITHUB_TOKEN: 't', GITHUB_OWNER: 'o', GITHUB_REPO: 'r',
    COMMUNITY: {
      idFromName: () => 'id',
      get: () => ({
        fetch: async (url, init = {}) => {
          if (storeFails) throw new Error('store down');
          if ((init.method || 'GET') === 'POST') { stored = JSON.parse(init.body); return Response.json({ status: stored }); }
          return Response.json({ status: stored });
        }
      })
    }
  };
  globalThis.fetch = async (url, init = {}) => {
    const href = String(url);
    if (href.includes('/contents/site-settings.json')) return Response.json({ content: Buffer.from(JSON.stringify(settings)).toString('base64') });
    if (href.includes('/git/ref/heads/')) return Response.json({ object: { sha: 'p' } });
    if (href.includes('/git/commits/p')) return Response.json({ tree: { sha: 't' } });
    if (href.endsWith('/git/blobs')) { const body = JSON.parse(init.body); commits.push(Buffer.from(body.content, 'base64').toString()); return commitFails ? Response.json({ message: 'no' }, { status: 500 }) : Response.json({ sha: 'b'.repeat(40) }); }
    if (href.endsWith('/git/trees')) return Response.json({ sha: 'tree' });
    if (href.endsWith('/git/commits')) return Response.json({ sha: 'c' });
    if (href.includes('/git/refs/heads/')) return Response.json({});
    throw new Error('unexpected fetch ' + href);
  };
  return { env, commits, stored: () => stored };
}

async function adminRequest(env, body) {
  const now = Math.floor(Date.now() / 1000);
  const token = await signSession({ login: 'Danny-4686', githubId: 1, csrf: 'c', iat: now, exp: now + 600 }, env.SESSION_SECRET);
  return worker.fetch(new Request('https://admin.danny4686.com/api/site-status', {
    method: body ? 'POST' : 'GET',
    headers: { Cookie: `${SESSION_COOKIE}=${token}; ${CSRF_COOKIE}=c`, 'X-CSRF-Token': 'c', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  }), env, {});
}

test('closing the site stores the live state and commits the gate script', async () => {
  const { env, commits, stored } = setup();
  const response = await adminRequest(env, { open: false });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.open, false);
  assert.equal(data.live, true);
  assert.equal(data.persisted, true);
  assert.equal(stored().open, false);
  assert.ok(commits.includes(buildSiteGateScript({ closed: true })), `commit should include ${SITE_GATE_PATH}`);
  assert.equal(JSON.parse(commits.find((text) => text.includes('"siteClosed"'))).siteClosed, true);

  const publicResponse = await worker.fetch(new Request('https://api.danny4686.com/v1/site-status'), env, {});
  assert.equal(publicResponse.headers.get('Access-Control-Allow-Origin'), '*');
  assert.deepEqual(await publicResponse.json(), { open: false, redirect: 'https://www.roblox.com/users/178415120/profile' });
});

test('site status rejects bad input and unauthenticated requests', async () => {
  const { env } = setup();
  assert.equal((await adminRequest(env, { open: 'no' })).status, 400);
  assert.equal((await adminRequest(env, { open: false, redirect: 'http://example.com' })).status, 400);
  assert.equal((await adminRequest(env, { open: false, redirect: 'https://danny4686.com/' })).status, 400);
  const anonymous = await worker.fetch(new Request('https://admin.danny4686.com/api/site-status', { method: 'POST', body: '{"open":false}' }), env, {});
  assert.equal(anonymous.status, 401);
});

test('closing still works through GitHub when the live store is down, and reports a GitHub failure', async () => {
  const down = setup({ storeFails: true });
  const viaGithub = await (await adminRequest(down.env, { open: false })).json();
  assert.equal(viaGithub.live, false);
  assert.equal(viaGithub.persisted, true);
  assert.match(viaGithub.warning, /deploy/);

  const noBackup = setup({ commitFails: true });
  const instantOnly = await (await adminRequest(noBackup.env, { open: false })).json();
  assert.equal(instantOnly.live, true);
  assert.equal(instantOnly.persisted, false);
  assert.match(instantOnly.warning, /GitHub backup failed/);

  const nothing = setup({ storeFails: true, commitFails: true });
  assert.equal((await adminRequest(nothing.env, { open: false })).status, 502);
});
