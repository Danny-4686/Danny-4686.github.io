// Live Roblox avatar render for the homepage portrait.
//
// Roblox's thumbnails API doesn't allow cross-origin browser requests, so this
// route looks up the current full-body render for one fixed account and hands
// back its CDN URL. The account is pinned and only Roblox CDN URLs are returned,
// so the route can't be pointed at anything else. Results are cached for a few
// minutes, which is how avatar changes on Roblox show up on the site.

export const ROBLOX_AVATAR_USER_ID = '178415120';
const THUMBNAILS_API = `https://thumbnails.roblox.com/v1/users/avatar?userIds=${ROBLOX_AVATAR_USER_ID}&size=720x720&format=Png&isCircular=false`;
const READY_TTL_SECONDS = 300;
const PENDING_TTL_SECONDS = 30;
const FETCH_TIMEOUT_MS = 8000;
const ROBLOX_CDN_HOST = /^(?:tr|t[0-7])\.rbxcdn\.com$/;

export function robloxImageUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' && ROBLOX_CDN_HOST.test(url.hostname) ? url.toString() : '';
  } catch {
    return '';
  }
}

function jsonResponse(request, allowedOrigins, data, status, maxAge = 0) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': maxAge ? `public, max-age=${maxAge}` : 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  const origin = request.headers.get('Origin');
  if (origin && allowedOrigins.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.append('Vary', 'Origin');
  }
  return new Response(JSON.stringify(data), { status, headers });
}

async function lookupAvatar() {
  const cache = typeof caches !== 'undefined' && caches.default ? caches.default : null;
  const cacheKey = new Request('https://roblox-avatar.internal/render');
  const hit = cache && await cache.match(cacheKey);
  if (hit) return hit.json();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(THUMBNAILS_API, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; CloudLabAvatar/1.0; +https://danny4686.com)' }
    });
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    return { status: 502, data: { available: false, error: 'Roblox did not return the avatar.', upstreamStatus: response.status } };
  }
  const body = await response.json().catch(() => ({}));
  const entry = (Array.isArray(body.data) ? body.data : []).find((item) => String(item?.targetId) === ROBLOX_AVATAR_USER_ID);
  const imageUrl = robloxImageUrl(entry?.imageUrl);
  const result = entry?.state === 'Completed' && imageUrl
    ? { status: 200, ttl: READY_TTL_SECONDS, data: { available: true, userId: ROBLOX_AVATAR_USER_ID, imageUrl, version: String(entry.version || '') } }
    : { status: 200, ttl: PENDING_TTL_SECONDS, data: { available: false, state: String(entry?.state || 'Unavailable') } };

  if (cache) {
    await cache.put(cacheKey, new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${result.ttl}` }
    }));
  }
  return result;
}

export async function handleRobloxAvatar(request, env, path, allowedOrigins) {
  if (path !== '/roblox-avatar') return jsonResponse(request, allowedOrigins, { error: 'Not found.' }, 404);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return jsonResponse(request, allowedOrigins, { error: 'Method not allowed.' }, 405);
  }
  try {
    const result = await lookupAvatar();
    return jsonResponse(request, allowedOrigins, result.data, result.status, result.status === 200 ? result.ttl : 0);
  } catch (error) {
    console.error('Roblox avatar lookup failed', error);
    return jsonResponse(request, allowedOrigins, { available: false, error: 'Roblox is unavailable right now.' }, 502);
  }
}
