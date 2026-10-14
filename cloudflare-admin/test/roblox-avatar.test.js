import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ROBLOX_AVATAR_USER_ID,
  handleRobloxAvatar,
  normalizeAvatarManifest,
  rbxcdnHostForHash,
  robloxAssetName
} from '../src/roblox-avatar.js';

const ORIGINS = new Set(['https://danny4686.com']);
const OBJ = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
const MTL = '0f9e8d7c6b5a49382716f5e4d3c2b1a0';
const TEX = 'ffeeddccbbaa99887766554433221100';

function request(path, origin = 'https://danny4686.com') {
  return new Request(`https://api.danny4686.com/v1${path}`, { headers: origin ? { Origin: origin } : {} });
}

function mockRoblox(context, { state = 'Completed', metadata } = {}) {
  const calls = [];
  context.mock.method(globalThis, 'fetch', async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.startsWith('https://thumbnails.roblox.com/')) {
      return Response.json({ targetId: Number(ROBLOX_AVATAR_USER_ID), state, imageUrl: 'https://t2.rbxcdn.com/30DAY-Avatar-meta', version: 'TN3' });
    }
    if (url === 'https://t2.rbxcdn.com/30DAY-Avatar-meta') {
      return Response.json(metadata || {
        camera: { position: { x: 1, y: 2, z: 3 }, direction: { x: 0, y: 0, z: 1 }, fov: 70 },
        aabb: { min: { x: -2, y: 0, z: -1 }, max: { x: 2, y: 5, z: 1 } },
        obj: OBJ,
        mtl: `https://t5.rbxcdn.com/${MTL}`,
        textures: [TEX, 'javascript:alert(1)']
      });
    }
    if (url === `https://${rbxcdnHostForHash(OBJ)}/${OBJ}`) {
      return new Response('v 0 0 0', { headers: { 'Content-Type': 'application/octet-stream' } });
    }
    if (url === `https://${rbxcdnHostForHash(TEX)}/${TEX}`) {
      return new Response(new Uint8Array([137, 80, 78, 71]), { headers: { 'Content-Type': 'image/png' } });
    }
    return new Response('not found', { status: 404 });
  });
  return calls;
}

test('Roblox CDN shard follows the content hash', () => {
  assert.match(rbxcdnHostForHash(OBJ), /^t[0-7]\.rbxcdn\.com$/);
  assert.equal(rbxcdnHostForHash(OBJ), rbxcdnHostForHash(OBJ));
});

test('avatar asset names accept only Roblox content hashes and CDN URLs', () => {
  assert.equal(robloxAssetName(OBJ), OBJ);
  assert.equal(robloxAssetName(`https://t3.rbxcdn.com/${OBJ}`), OBJ);
  assert.equal(robloxAssetName(`https://evil.example/${OBJ}`), '');
  assert.equal(robloxAssetName(`http://t3.rbxcdn.com/${OBJ}`), '');
  assert.equal(robloxAssetName('../secrets'), '');
  assert.equal(robloxAssetName('short'), '');
});

test('manifest is normalized to proxied asset URLs', () => {
  const manifest = normalizeAvatarManifest({ obj: OBJ, mtl: MTL, textures: [TEX, 'bad'] }, 'https://api.danny4686.com/v1/roblox-avatar/assets');
  assert.equal(manifest.obj, `https://api.danny4686.com/v1/roblox-avatar/assets/${OBJ}`);
  assert.deepEqual(manifest.textures, [`https://api.danny4686.com/v1/roblox-avatar/assets/${TEX}`]);
  assert.equal(normalizeAvatarManifest({ obj: OBJ }, 'x'), null);
});

test('avatar manifest is fetched for the pinned account only and served with CORS', async (context) => {
  const calls = mockRoblox(context);
  const response = await handleRobloxAvatar(request('/roblox-avatar?userId=1'), {}, '/roblox-avatar', ORIGINS);
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://danny4686.com');
  assert.match(response.headers.get('Cache-Control'), /max-age=300/);
  assert.equal(data.available, true);
  assert.equal(data.userId, ROBLOX_AVATAR_USER_ID);
  assert.equal(data.mtl, `https://api.danny4686.com/v1/roblox-avatar/assets/${MTL}`);
  assert.equal(data.textures.length, 1);
  assert.ok(calls[0].endsWith(`userId=${ROBLOX_AVATAR_USER_ID}`), 'query string cannot change the account');
});

test('a pending Roblox render is reported without failing', async (context) => {
  mockRoblox(context, { state: 'Pending' });
  const response = await handleRobloxAvatar(request('/roblox-avatar'), {}, '/roblox-avatar', ORIGINS);
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.available, false);
  assert.equal(data.state, 'Pending');
});

test('avatar assets are proxied from the Roblox CDN with safe content types', async (context) => {
  mockRoblox(context);
  const model = await handleRobloxAvatar(request(`/roblox-avatar/assets/${OBJ}`), {}, `/roblox-avatar/assets/${OBJ}`, ORIGINS);
  assert.equal(model.status, 200);
  assert.equal(model.headers.get('Content-Type'), 'text/plain; charset=utf-8');
  assert.equal(await model.text(), 'v 0 0 0');

  const texture = await handleRobloxAvatar(request(`/roblox-avatar/assets/${TEX}`), {}, `/roblox-avatar/assets/${TEX}`, ORIGINS);
  assert.equal(texture.headers.get('Content-Type'), 'image/png');
  assert.match(texture.headers.get('Cache-Control'), /immutable/);
});

test('the avatar proxy cannot be pointed at other hosts or paths', async (context) => {
  const calls = mockRoblox(context);
  for (const name of ['..%2F..%2Fadmin', 'evil.example', 'abc', `${OBJ}?x=1`]) {
    const path = `/roblox-avatar/assets/${name}`;
    const response = await handleRobloxAvatar(request(path), {}, path, ORIGINS);
    assert.equal(response.status, 404, name);
  }
  assert.ok(calls.every((url) => /^https:\/\/(thumbnails\.roblox\.com|t[0-7]\.rbxcdn\.com)\//.test(url)));

  const other = await handleRobloxAvatar(request('/roblox-avatar', 'https://evil.example'), {}, '/roblox-avatar', ORIGINS);
  assert.equal(other.headers.get('Access-Control-Allow-Origin'), null);
  const post = await handleRobloxAvatar(new Request('https://api.danny4686.com/v1/roblox-avatar', { method: 'POST' }), {}, '/roblox-avatar', ORIGINS);
  assert.equal(post.status, 405);
});
