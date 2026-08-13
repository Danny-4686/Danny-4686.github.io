import { handleCommunityApi as handleBaseCommunityApi } from './community-api.js';

const API_PREFIX = '/v1';
const COMMUNITY_BUILD = '2026-08-13.1';
const AUTH_BODY_MAX_BYTES = 32768;
const PROFILE_BODY_MAX_BYTES = 8192;
const encoder = new TextEncoder();

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
  const session = await sessionResponse.json().catch(() => ({}));
  if (!sessionResponse.ok) {
    return { authenticated: false, user: null, csrfToken: '', serviceUnavailable: true };
  }
  return session;
}

async function publicProfile(request, env, userId) {
  const response = await storeFetch(env, `/public-profile?userId=${encodeURIComponent(userId)}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.profile) {
    return json(request, env, { error: 'Profile not found.' }, response.status || 404);
  }
  return json(request, env, { profile: profileForApi(data.profile, request) });
}

function botProtectionConfigured(env) {
  return Boolean(String(env.TURNSTILE_SECRET || '').trim() && String(env.TURNSTILE_SITE_KEY || '').trim());
}

async function readBoundedJson(request, maxBytes) {
  const contentType = String(request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') return { error: 'This request must use JSON.', status: 415 };

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return { error: 'Request is too large.', status: 413 };

  const text = await request.text();
  if (encoder.encode(text).byteLength > maxBytes) return { error: 'Request is too large.', status: 413 };
  let body;
  try { body = JSON.parse(text); } catch { return { error: 'Request is not valid JSON.', status: 400 }; }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Request has an invalid shape.', status: 400 };
  return { body, text };
}

function rebuildJsonRequest(request, text) {
  const headers = new Headers(request.headers);
  headers.set('Content-Type', 'application/json');
  headers.delete('Content-Length');
  return new Request(request.url, {
    method: request.method,
    headers,
    body: text,
    redirect: request.redirect,
    signal: request.signal
  });
}

export async function handleCommunityApi(request, env) {
  const url = new URL(request.url);
  const path = pathAfterPrefix(url.pathname);
  const method = request.method.toUpperCase();

  if (path === '/health' && method === 'GET') {
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
        accountFeaturesConfigured: Boolean(baseData.sessionsConfigured && baseData.turnstileConfigured),
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

  if ((path === '/login' || path === '/signup') && method === 'POST') {
    if (!botProtectionConfigured(env)) {
      return json(request, env, { error: 'Account security is temporarily unavailable. Please try again later.' }, 503);
    }
    const parsed = await readBoundedJson(request, AUTH_BODY_MAX_BYTES);
    if (parsed.error) return json(request, env, { error: parsed.error }, parsed.status);
    request = rebuildJsonRequest(request, parsed.text);
  }

  const publicProfileMatch = path.match(/^\/profiles\/([A-Za-z0-9-]+)$/);
  if (publicProfileMatch && method === 'GET') {
    return publicProfile(request, env, publicProfileMatch[1]);
  }

  if (path === '/profile' && method === 'GET') {
    const session = await readCurrentSession(request, env);
    if (session.serviceUnavailable) {
      return json(request, env, { error: 'The community service is temporarily unavailable.' }, 503);
    }
    if (!session.authenticated || !session.user?.id) {
      return json(request, env, { error: 'Sign in to view your profile settings.' }, 401);
    }
    return publicProfile(request, env, session.user.id);
  }

  if (path === '/profile' && method === 'POST') {
    const session = await readCurrentSession(request, env);
    if (session.serviceUnavailable) {
      return json(request, env, { error: 'The community service is temporarily unavailable.' }, 503);
    }
    if (!session.authenticated || !session.user?.id) {
      return json(request, env, { error: 'Sign in to update your profile.' }, 401);
    }
    if (!csrfMatches(request, session)) {
      return json(request, env, { error: 'Security token expired. Refresh and try again.' }, 403);
    }

    const parsed = await readBoundedJson(request, PROFILE_BODY_MAX_BYTES);
    if (parsed.error) return json(request, env, { error: parsed.error }, parsed.status);
    const body = parsed.body;
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
  if (leaderboardMatch && method === 'GET') {
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
