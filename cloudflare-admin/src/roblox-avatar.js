// Live Roblox 3D avatar for the homepage portrait.
//
// Roblox renders every avatar to an OBJ/MTL/texture bundle on its CDN, but the
// thumbnails API and CDN don't allow cross-origin browser requests. These routes
// proxy that bundle for one fixed account only, so this can never be used as an
// open proxy: the user id is pinned and asset names are validated content hashes
// fetched exclusively from Roblox's tN.rbxcdn.com hosts.

export const ROBLOX_AVATAR_USER_ID = '178415120';
const THUMBNAILS_API = `https://thumbnails.roblox.com/v1/users/avatar-3d?userId=${ROBLOX_AVATAR_USER_ID}`;
const MANIFEST_TTL_SECONDS = 300;
const PENDING_TTL_SECONDS = 30;
const ASSET_TTL_SECONDS = 30 * 24 * 60 * 60;
const MAX_ASSET_BYTES = 20 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 8000;
const ASSET_NAME = /^[A-Za-z0-9-]{16,160}$/;
const ROBLOX_CDN_HOST = /^t[0-7]\.rbxcdn\.com$/;
const ASSET_TYPES = new Map([
  ['image/png', 'image/png'],
  ['image/jpeg', 'image/jpeg'],
  ['image/webp', 'image/webp']
]);

// Roblox's own content-hash -> CDN shard mapping.
export function rbxcdnHostForHash(hash) {
  let value = 31;
  for (const character of String(hash).slice(0, 32)) value ^= character.charCodeAt(0);
  return `t${value % 8}.rbxcdn.com`;
}

// The 3D metadata lists assets either as bare hashes or as full CDN URLs.
export function robloxAssetName(value) {
  const text = String(value || '').trim();
  if (ASSET_NAME.test(text)) return text;
  try {
    const url = new URL(text);
    const name = url.pathname.replace(/^\/+/, '');
    if (url.protocol === 'https:' && ROBLOX_CDN_HOST.test(url.hostname) && ASSET_NAME.test(name)) return name;
  } catch {}
  return '';
}

function vector(value) {
  const output = {};
  for (const axis of ['x', 'y', 'z']) {
    const number = Number(value?.[axis]);
    if (!Number.isFinite(number)) return null;
    output[axis] = number;
  }
  return output;
}

export function normalizeAvatarManifest(data, assetBase) {
  const obj = robloxAssetName(data?.obj);
  const mtl = robloxAssetName(data?.mtl);
  if (!obj || !mtl) return null;
  const textures = (Array.isArray(data?.textures) ? data.textures : [])
    .map(robloxAssetName)
    .filter(Boolean)
    .slice(0, 32);
  const min = vector(data?.aabb?.min);
  const max = vector(data?.aabb?.max);
  const position = vector(data?.camera?.position);
  const fov = Number(data?.camera?.fov);
  return {
    available: true,
    obj: `${assetBase}/${obj}`,
    mtl: `${assetBase}/${mtl}`,
    assetBase: `${assetBase}/`,
    textures: textures.map((name) => `${assetBase}/${name}`),
    aabb: min && max ? { min, max } : null,
    camera: position ? { position, fov: Number.isFinite(fov) ? fov : 70 } : null
  };
}

function corsHeaders(request, allowedOrigins, extra = {}) {
  const headers = new Headers({ 'X-Content-Type-Options': 'nosniff', ...extra });
  const origin = request.headers.get('Origin');
  if (origin && allowedOrigins.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.append('Vary', 'Origin');
  }
  return headers;
}

function jsonResponse(request, allowedOrigins, data, status, maxAge) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(request, allowedOrigins, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': maxAge ? `public, max-age=${maxAge}` : 'no-store'
    })
  });
}

async function timedFetch(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json, */*', 'User-Agent': 'Mozilla/5.0 (compatible; CloudLabAvatar/1.0; +https://danny4686.com)' },
      redirect: 'follow'
    });
  } finally {
    clearTimeout(timer);
  }
}

function edgeCache() {
  return typeof caches !== 'undefined' && caches.default ? caches.default : null;
}

async function cached(cacheKey, ttl, produce) {
  const cache = edgeCache();
  const key = new Request(cacheKey);
  if (cache) {
    const hit = await cache.match(key);
    if (hit) return hit;
  }
  const response = await produce();
  if (cache && response.ok) {
    const copy = new Response(response.clone().body, response);
    copy.headers.set('Cache-Control', `public, max-age=${ttl}`);
    await cache.put(key, copy);
  }
  return response;
}

async function loadManifest(assetBase) {
  const thumbResponse = await timedFetch(THUMBNAILS_API);
  if (!thumbResponse.ok) {
    return { status: 502, data: { available: false, error: 'Roblox did not return the avatar.', upstreamStatus: thumbResponse.status } };
  }
  const thumb = await thumbResponse.json().catch(() => ({}));
  if (thumb.state !== 'Completed' || !thumb.imageUrl) {
    return { status: 200, ttl: PENDING_TTL_SECONDS, data: { available: false, state: String(thumb.state || 'Unavailable') } };
  }
  let metadataUrl;
  try { metadataUrl = new URL(thumb.imageUrl); } catch { metadataUrl = null; }
  if (!metadataUrl || metadataUrl.protocol !== 'https:' || !ROBLOX_CDN_HOST.test(metadataUrl.hostname)) {
    return { status: 502, data: { available: false, error: 'Roblox returned an unexpected avatar location.' } };
  }
  const metadataResponse = await timedFetch(metadataUrl.toString());
  if (!metadataResponse.ok) {
    return { status: 502, data: { available: false, error: 'Roblox did not return the avatar model.', upstreamStatus: metadataResponse.status } };
  }
  const manifest = normalizeAvatarManifest(await metadataResponse.json().catch(() => null), assetBase);
  if (!manifest) return { status: 502, data: { available: false, error: 'The avatar model was incomplete.' } };
  return { status: 200, ttl: MANIFEST_TTL_SECONDS, data: { ...manifest, userId: ROBLOX_AVATAR_USER_ID, version: String(thumb.version || '') } };
}

async function fetchAsset(name) {
  const preferred = rbxcdnHostForHash(name);
  const hosts = [preferred, ...Array.from({ length: 8 }, (_, index) => `t${index}.rbxcdn.com`).filter((host) => host !== preferred)];
  for (const host of hosts) {
    const response = await timedFetch(`https://${host}/${name}`).catch(() => null);
    if (response?.ok) return response;
    if (response && response.status !== 404 && response.status !== 403) return null;
  }
  return null;
}

function assetContentType(upstreamType, name) {
  const type = String(upstreamType || '').split(';')[0].trim().toLowerCase();
  if (ASSET_TYPES.has(type)) return ASSET_TYPES.get(type);
  // OBJ and MTL files are served by Roblox as octet-stream or text.
  return /-(obj|mtl)$/i.test(name) || type.startsWith('text/') || type === 'application/octet-stream'
    ? 'text/plain; charset=utf-8'
    : '';
}

export async function handleRobloxAvatar(request, env, path, allowedOrigins) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return jsonResponse(request, allowedOrigins, { error: 'Method not allowed.' }, 405);
  }
  const origin = new URL(request.url).origin;
  const assetBase = `${origin}/v1/roblox-avatar/assets`;

  if (path === '/roblox-avatar') {
    try {
      const result = await loadManifest(assetBase);
      return jsonResponse(request, allowedOrigins, result.data, result.status, result.status === 200 ? result.ttl : 0);
    } catch (error) {
      console.error('Roblox avatar manifest failed', error);
      return jsonResponse(request, allowedOrigins, { available: false, error: 'Roblox is unavailable right now.' }, 502);
    }
  }

  const assetMatch = path.match(/^\/roblox-avatar\/assets\/([^/]+)$/);
  if (!assetMatch || !ASSET_NAME.test(assetMatch[1])) {
    return jsonResponse(request, allowedOrigins, { error: 'Avatar asset not found.' }, 404);
  }
  const name = assetMatch[1];
  try {
    const response = await cached(`https://roblox-avatar.internal/assets/${name}`, ASSET_TTL_SECONDS, async () => {
      const upstream = await fetchAsset(name);
      if (!upstream) return new Response(null, { status: 404 });
      const contentType = assetContentType(upstream.headers.get('Content-Type'), name);
      const declaredSize = Number(upstream.headers.get('Content-Length') || 0);
      if (!contentType || declaredSize > MAX_ASSET_BYTES) return new Response(null, { status: 415 });
      const body = await upstream.arrayBuffer();
      if (body.byteLength > MAX_ASSET_BYTES) return new Response(null, { status: 413 });
      return new Response(body, { status: 200, headers: { 'Content-Type': contentType } });
    });
    if (!response.ok) return jsonResponse(request, allowedOrigins, { error: 'Avatar asset unavailable.' }, response.status === 404 ? 404 : 502);
    return new Response(request.method === 'HEAD' ? null : response.body, {
      status: 200,
      headers: corsHeaders(request, allowedOrigins, {
        'Content-Type': response.headers.get('Content-Type'),
        'Cache-Control': `public, max-age=${ASSET_TTL_SECONDS}, immutable`
      })
    });
  } catch (error) {
    console.error('Roblox avatar asset failed', error);
    return jsonResponse(request, allowedOrigins, { error: 'Avatar asset unavailable.' }, 502);
  }
}
