import assert from 'node:assert/strict';
import test from 'node:test';

import { addTransportSecurity, redirectToHttps } from '../src/transport-security.js';
import { clearLegacyCookie, cookie } from '../src/community-api.js';
import { hashPassword, verifyPassword } from '../src/community-store.js';
import { parseCookies } from '../src/utils.js';

test('parseCookies accepts a missing Cookie header', () => {
  assert.deepEqual(parseCookies(null), {});
  assert.deepEqual(parseCookies(undefined), {});
});

test('parseCookies decodes valid values and preserves malformed encoding', () => {
  assert.deepEqual(parseCookies('theme=dark; display=Cloud%20Lab; broken=%E0%A4%A'), {
    theme: 'dark',
    display: 'Cloud Lab',
    broken: '%E0%A4%A'
  });
});

test('HTTP requests are permanently redirected to the same HTTPS URL', () => {
  const response = redirectToHttps(new Request('http://admin.danny4686.com/admin?tab=posts'));
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('location'), 'https://admin.danny4686.com/admin?tab=posts');
});

test('HTTPS responses receive an HSTS policy', async () => {
  const response = addTransportSecurity(new Response('ok', { status: 200 }));
  assert.equal(response.headers.get('strict-transport-security'), 'max-age=31536000; includeSubDomains');
  assert.equal(await response.text(), 'ok');
});

test('community sessions use a host-only cookie and clear the legacy domain cookie', () => {
  const current = cookie('signed-token');
  assert.match(current, /^cl_community_session_v2=signed-token;/);
  assert.doesNotMatch(current, /\bDomain=/i);
  assert.match(clearLegacyCookie(), /cl_community_session=;/);
  assert.match(clearLegacyCookie(), /Domain=\.danny4686\.com/i);
  assert.match(clearLegacyCookie(), /Max-Age=0/i);
});

test('password hashes carry their work factor and legacy hashes remain valid', async () => {
  const value = await hashPassword('CloudLab-Test-Password-123!');
  assert.match(value.hash, /^pbkdf2-sha256\$100000\$/);
  assert.equal(await verifyPassword('CloudLab-Test-Password-123!', value.salt, value.hash), true);
  assert.equal(await verifyPassword('wrong-password', value.salt, value.hash), false);
  const legacyDigest = value.hash.split('$')[2];
  assert.equal(await verifyPassword('CloudLab-Test-Password-123!', value.salt, legacyDigest), true);
});
