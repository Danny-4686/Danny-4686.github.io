import assert from 'node:assert/strict';
import test from 'node:test';

import { protectManagedUploadRequest } from '../src/managed-upload-security.js';

function pngBytes() {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
}

function mp4Bytes() {
  return new Uint8Array([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0]);
}

function request(path, form) {
  return new Request(`https://admin.danny4686.com${path}`, {
    method: 'POST',
    headers: { Cookie: 'cloudlab_admin_session=test' },
    body: form
  });
}

test('Project artwork rejects a spoofed image payload', async () => {
  const form = new FormData();
  form.append('metadata', '{}');
  form.append('image', new File([new TextEncoder().encode('<html>not an image</html>')], 'project.png', { type: 'image/png' }));
  const result = await protectManagedUploadRequest(request('/api/projects', form));
  assert.equal(result.response?.status, 415);
});

test('Project artwork receives a safe canonical image filename', async () => {
  const form = new FormData();
  form.append('metadata', '{}');
  form.append('image', new File([pngBytes()], 'project.html', { type: 'image/png' }));
  const result = await protectManagedUploadRequest(request('/api/projects', form));
  assert.equal(result.response, undefined);
  const sanitized = await result.request.formData();
  const image = sanitized.get('image');
  assert.ok(image instanceof File);
  assert.equal(image.name, 'image.png');
  assert.equal(image.type, 'image/png');
});

test('Fresh Abyss keeps real video support while canonicalizing the extension', async () => {
  const form = new FormData();
  form.append('enabled', 'true');
  form.append('media', new File([mp4Bytes()], 'clip.html', { type: 'video/mp4' }));
  const result = await protectManagedUploadRequest(request('/api/fresh-abyss', form));
  assert.equal(result.response, undefined);
  const sanitized = await result.request.formData();
  const media = sanitized.get('media');
  assert.ok(media instanceof File);
  assert.equal(media.name, 'media.mp4');
  assert.equal(media.type, 'video/mp4');
});
