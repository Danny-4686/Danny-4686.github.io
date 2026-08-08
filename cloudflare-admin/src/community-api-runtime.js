import { handleCommunityApi as handleBaseCommunityApi } from './community-api.js';

const API_PREFIX = '/v1';
const COMMUNITY_BUILD = '2026-08-06.2';

function allowedOrigins(env) {
  const configured = String(env.COMMUNITY_ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return new Set(configured.length ? configured : [
    'https://danny4686.com',
    'https://www.danny4686.com'
  ]);
}

function responseHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin'
  });

  if (origin && allowedOrigins(env).has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.append('Vary', 'Origin');
  }
  return headers;
}

function json(request, env, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: responseHeaders(request, env)
  });
}

function pathAfterPrefix(pathname) {
  if (!pathname.startsWith(API_PREFIX)) return '';
  const path = pathname.slice(API_PREFIX.length) || '/';
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

function communityStub(env) {
  if (!env.COMMUNITY) throw new Error('COMMUNITY Durable Object binding is missing.');
  const id = env.COMMUNITY.idFromName('cloudlab-community-global');
  return env.COMMUNITY.get(id);
}

function storeFetch(env, path, init = {}) {
  return communityStub(env).fetch(`https://community.internal${path}`, init);
}

function profileForApi(profile, request) {
  if (!profile) return null;
  const origin = new URL(request.url).origin;
  return {
    ...profile,
    avatarUrl: profile.avatarUpdatedAt
      ? `${origin}${API_PREFIX}/avatars/${encodeURIComponent(profile.id)}?v=${encodeURIComponent(profile.avatarUpdatedAt)}`
      : ''
  };
}

function csrfMatches(request, session) {
  const supplied = request.headers.get('X-CloudLab-CSRF') || '';
  const expected = session?.csrfToken || '';
  if (!supplied || !expected || supplied.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < supplied.length; index += 1) {
    difference |= supplied.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

async function readCurrentSession(request, env) {
  const url = new URL(request.url);
  const headers = new Headers();
  const cookie = request.headers.get('Cookie');
  if (cookie) headers.set('Cookie', cookie);
  const sessionResponse = await handleBaseCommunityApi(new Request(`${url.origin}${API_PREFIX}/session`, {
    method: 'GET',
    headers
  }), env);
  return sessionResponse.json().catch(() => ({ authenticated: false, user: null, csrfToken: '' }));
}

async function publicProfile(request, env, userId) {
  const response = await storeFetch(env, `/public-profile?userId=${encodeURIComponent(userId)}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.profile) {
    return json(request, env, { error: 'Profile not found.' }, response.status || 404);
  }
  return json(request, env, { profile: profileForApi(data.profile, request) });
}

export async function handleCommunityApi(request, env) {
  const url = new URL(request.url);
  const path = pathAfterPrefix(url.pathname);

  if (path === '/health' && request.method === 'GET') {
    const baseResponse = await handleBaseCommunityApi(request, env);
    const baseData = await baseResponse.json().catch(() => ({ ok: false }));
    const deep = url.searchParams.get('deep') === '1';

    try {
      const storageResponse = await storeFetch(env, '/health');
      const storageData = await storageResponse.json().catch(() => ({}));
      const storageReady = Boolean(storageResponse.ok && storageData.ok);
      return json(request, env, {
        ...baseData,
        build: COMMUNITY_BUILD,
        deepCheck: deep,
        storageReady,
        storageBackend: storageReady ? (storageData.storage || 'sqlite') : 'unavailable',
        storageResponseStatus: storageResponse.status,
        accountFeaturesConfigured: Boolean(baseData.sessionsConfigured),
        storageResponse: storageReady ? undefined : storageData
      }, storageReady ? 200 : 503);
    } catch (error) {
      console.error('Community storage health check failed', error);
      return json(request, env, {
        ...baseData,
        build: COMMUNITY_BUILD,
        deepCheck: deep,
        storageReady: false,
        storageBackend: 'unavailable',
        storageError: 'Storage check failed.'
      }, 503);
    }
  }

  const publicProfileMatch = path.match(/^\/profiles\/([A-Za-z0-9-]+)$/);
  if (publicProfileMatch && request.method === 'GET') {
    return publicProfile(request, env, publicProfileMatch[1]);
  }

  if (path === '/profile' && request.method === 'GET') {
    const session = await readCurrentSession(request, env);
    if (!session.authenticated || !session.user?.id) {
      return json(request, env, { error: 'Sign in to view your profile settings.' }, 401);
    }
    return publicProfile(request, env, session.user.id);
  }

  if (path === '/profile' && request.method === 'POST') {
    const session = await readCurrentSession(request, env);
    if (!session.authenticated || !session.user?.id) {
      return json(request, env, { error: 'Sign in to update your profile.' }, 401);
    }
    if (!csrfMatches(request, session)) {
      return json(request, env, { error: 'Security token expired. Refresh and try again.' }, 403);
    }

    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (contentLength > 8192) return json(request, env, { error: 'Profile update is too large.' }, 413);
    const body = await request.json().catch(() => ({}));
    const response = await storeFetch(env, '/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.user.id,
        bio: body.bio,
        statusText: body.statusText
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.profile) return json(request, env, data, response.status);
    return json(request, env, { ok: true, profile: profileForApi(data.profile, request) });
  }

  const leaderboardMatch = path.match(/^\/leaderboards\/([a-z0-9-]+)$/);
  if (leaderboardMatch && request.method === 'GET') {
    const response = await handleBaseCommunityApi(request, env);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(data.entries)) return json(request, env, data, response.status);

    const origin = url.origin;
    data.entries = data.entries.map((entry) => ({
      ...entry,
      avatarUrl: entry.userId && entry.avatarUpdatedAt
        ? `${origin}${API_PREFIX}/avatars/${encodeURIComponent(entry.userId)}?v=${encodeURIComponent(entry.avatarUpdatedAt)}`
        : ''
    }));
    return json(request, env, data, response.status);
  }

  return handleBaseCommunityApi(request, env);
}
