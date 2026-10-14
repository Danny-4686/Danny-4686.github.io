import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';

import { DEFAULT_CLOSED_REDIRECT, buildSiteGateScript, normalizeRedirectUrl, normalizeSiteStatus } from '../src/site-gate.js';

function runGate(script, statusResponse, { hang = false } = {}) {
  const calls = { replaced: [], timers: [] };
  const root = { style: { visibility: '' } };
  const context = {
    document: { documentElement: root },
    window: {
      location: { replace: (url) => calls.replaced.push(url) },
      setTimeout: (fn, ms) => { calls.timers.push({ fn, ms }); return calls.timers.length; },
      clearTimeout: () => {}
    },
    fetch: () => hang
      ? new Promise(() => {})
      : statusResponse instanceof Error
        ? Promise.reject(statusResponse)
        : Promise.resolve({ ok: true, json: () => Promise.resolve(statusResponse) })
  };
  vm.runInNewContext(script, context);
  return { calls, root, settle: () => new Promise((resolve) => setImmediate(resolve)) };
}

test('redirect URLs must be https and point away from danny4686.com', () => {
  assert.equal(normalizeRedirectUrl('https://www.roblox.com/users/178415120/profile'), DEFAULT_CLOSED_REDIRECT);
  assert.equal(normalizeRedirectUrl('http://example.com'), '');
  assert.equal(normalizeRedirectUrl('javascript:alert(1)'), '');
  assert.equal(normalizeRedirectUrl('https://danny4686.com/'), '');
  assert.equal(normalizeRedirectUrl('https://user:pw@example.com/'), '');
  assert.equal(normalizeSiteStatus({ open: false, redirect: 'nope' }).redirect, DEFAULT_CLOSED_REDIRECT);
  assert.equal(normalizeSiteStatus({}).open, true);
});

test('open gate leaves the page alone unless the live status says closed', async () => {
  const open = runGate(buildSiteGateScript({ closed: false }), { open: true });
  await open.settle();
  assert.deepEqual(open.calls.replaced, []);
  assert.equal(open.root.style.visibility, '');

  const closedLive = runGate(buildSiteGateScript({ closed: false }), { open: false, redirect: 'https://example.com/away' });
  await closedLive.settle();
  assert.deepEqual(closedLive.calls.replaced, ['https://example.com/away']);
  assert.equal(closedLive.root.style.visibility, 'hidden');

  const offline = runGate(buildSiteGateScript({ closed: false }), new Error('offline'));
  await offline.settle();
  assert.deepEqual(offline.calls.replaced, []);
});

test('closed gate hides the page and redirects, but trusts a live reopen', async () => {
  const closed = runGate(buildSiteGateScript({ closed: true }), { open: false, redirect: 'javascript:alert(1)' });
  assert.equal(closed.root.style.visibility, 'hidden');
  await closed.settle();
  assert.deepEqual(closed.calls.replaced, [DEFAULT_CLOSED_REDIRECT]);

  const reopened = runGate(buildSiteGateScript({ closed: true }), { open: true });
  await reopened.settle();
  assert.deepEqual(reopened.calls.replaced, []);
  assert.equal(reopened.root.style.visibility, '');

  const down = runGate(buildSiteGateScript({ closed: true }), null, { hang: true });
  assert.equal(down.calls.timers[0].ms, 2500);
  down.calls.timers[0].fn();
  assert.deepEqual(down.calls.replaced, [DEFAULT_CLOSED_REDIRECT]);
});
