import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { canonicalizeDeclaredMediaType, sniffMediaBytes } from '../src/media-security.js';
import { hashStrongPassword, PASSWORD_HASH_ITERATIONS, passwordHashIterations, passwordHashNeedsUpgrade } from '../src/password-security.js';
import { protectAdminRequest } from '../src/request-security.js';
import { addTransportSecurity } from '../src/transport-security.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

function pngBytes() {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
}

function adminPublishRequest(form, headers = {}) {
  return new Request('https://admin.danny4686.com/api/publish', {
    method: 'POST',
    headers: {
      Cookie: 'cloudlab_admin_session=signed-test-session',
      Origin: 'https://admin.danny4686.com',
      'Sec-Fetch-Site': 'same-origin',
      ...headers
    },
    body: form
  });
}

test('media validation checks magic bytes instead of trusting a filename or MIME alone', () => {
  const detected = sniffMediaBytes(pngBytes());
  assert.equal(detected?.format, 'png');
  assert.equal(canonicalizeDeclaredMediaType('image/png', detected)?.extension, 'png');
  assert.equal(canonicalizeDeclaredMediaType('image/jpeg', detected), null);
  assert.equal(sniffMediaBytes(new TextEncoder().encode('<html><script>alert(1)</script>')), null);
});

test('Journal uploads are renamed to a canonical safe extension after signature validation', async () => {
  const form = new FormData();
  form.append('thumbnail', new File([pngBytes()], 'looks-safe.html', { type: 'image/png' }));
  form.append('metadata', JSON.stringify({
    title: 'Security test',
    slug: 'security-test',
    description: 'Test',
    date: '2026-08-13',
    mode: 'card',
    sections: []
  }));

  const protectedRequest = await protectAdminRequest(adminPublishRequest(form));
  assert.equal(protectedRequest.response, undefined);
  const sanitized = await protectedRequest.request.formData();
  const thumbnail = sanitized.get('thumbnail');
  assert.ok(thumbnail instanceof File);
  assert.equal(thumbnail.name, 'thumbnail.png');
  assert.equal(thumbnail.type, 'image/png');
});

test('Journal upload rejects spoofed media and unexpected file fields', async () => {
  const spoofed = new FormData();
  spoofed.append('thumbnail', new File([new TextEncoder().encode('<script>alert(1)</script>')], 'image.png', { type: 'image/png' }));
  spoofed.append('metadata', JSON.stringify({ title: 'Bad', slug: 'bad', description: 'Bad', date: '2026-08-13', mode: 'card', sections: [] }));
  const spoofedResult = await protectAdminRequest(adminPublishRequest(spoofed));
  assert.equal(spoofedResult.response?.status, 415);

  const unexpected = new FormData();
  unexpected.append('evil', new File([pngBytes()], 'evil.png', { type: 'image/png' }));
  unexpected.append('metadata', JSON.stringify({ title: 'Bad', slug: 'bad', description: 'Bad', date: '2026-08-13', mode: 'card', sections: [] }));
  const unexpectedResult = await protectAdminRequest(adminPublishRequest(unexpected));
  assert.equal(unexpectedResult.response?.status, 400);
});

test('cross-site admin mutations are rejected before the admin API runs', async () => {
  const request = new Request('https://admin.danny4686.com/api/projects', {
    method: 'POST',
    headers: {
      Origin: 'https://attacker.example',
      'Sec-Fetch-Site': 'cross-site',
      'Content-Type': 'application/json'
    },
    body: '{}'
  });
  const result = await protectAdminRequest(request);
  assert.equal(result.response?.status, 403);
});

test('new password hashes use the stronger work factor and older hashes are upgradeable', async () => {
  assert.equal(PASSWORD_HASH_ITERATIONS, 600000);
  const hash = await hashStrongPassword('CloudLab-Security-Test-123!');
  assert.equal(passwordHashIterations(hash.hash), 600000);
  assert.equal(passwordHashNeedsUpgrade(hash.hash), false);
  assert.equal(passwordHashNeedsUpgrade('pbkdf2-sha256$100000$legacy'), true);
});

test('Worker response hardening preserves existing policies and adds missing protections', () => {
  const response = addTransportSecurity(new Response('ok', {
    headers: { 'Referrer-Policy': 'no-referrer' }
  }));
  assert.equal(response.headers.get('strict-transport-security'), 'max-age=31536000; includeSubDomains');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('x-permitted-cross-domain-policies'), 'none');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.match(response.headers.get('permissions-policy') || '', /camera=\(\)/);
});

test('production runtime source keeps Turnstile fail-closed and account rate-limit layers', () => {
  const apiRuntime = readFileSync(resolve(root, 'src/community-api-runtime.js'), 'utf8');
  const storeRuntime = readFileSync(resolve(root, 'src/community-store-runtime.js'), 'utf8');
  assert.match(apiRuntime, /botProtectionConfigured/);
  assert.match(apiRuntime, /Account security is temporarily unavailable/);
  assert.match(apiRuntime, /sessionsConfigured && baseData\.turnstileConfigured/);
  assert.match(storeRuntime, /login-ip:/);
  assert.match(storeRuntime, /login-account:/);
  assert.match(storeRuntime, /strengthenPassword/);
  assert.match(storeRuntime, /avatarSignatureIsValid/);
});
