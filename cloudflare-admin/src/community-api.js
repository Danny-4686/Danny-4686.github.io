const API_PREFIX = '/v1';
const COOKIE_NAME = 'cl_community_session';
const SESSION_TTL = 60 * 60 * 24 * 30;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(bytes) {
  let binary = '';
  const value = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let index = 0; index < value.length; index += 1) binary += String.fromCharCode(value[index]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function parseCookies(header) {
  const output = {};
  String(header || '').split(';').forEach((part) => {
    const index = part.indexOf('=');
    if (index < 0) return;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) output[key] = value;
  });
  return output;
}

function cookie(value, maxAge = SESSION_TTL) {
  return [
    `${COOKIE_NAME}=${value}`,
    'Path=/',
    'Domain=.danny4686.com',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAge}`
  ].join('; ');
}

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

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  if (origin && allowedOrigins(env).has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, X-CloudLab-CSRF');
    headers.set('Access-Control-Max-Age', '86400');
    headers.append('Vary', 'Origin');
  }
  return headers;
}

function json(request, env, data, status = 200, extraHeaders = {}) {
  const headers = corsHeaders(request, env);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  Object.entries(extraHeaders).forEach(([key, value]) => headers.append(key, value));
  return new Response(JSON.stringify(data), { status, headers });
}

function originIsAllowed(request, env) {
  const origin = request.headers.get('Origin');
  return !origin || allowedOrigins(env).has(origin);
}

async function signingKey(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function signSession(payload, secret) {
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await signingKey(secret), encoder.encode(encodedPayload));
  return `${encodedPayload}.${base64UrlEncode(signature)}`;
}

async function verifySessionToken(token, secret) {
  try {
    const [encodedPayload, encodedSignature] = String(token || '').split('.');
    if (!encodedPayload || !encodedSignature) return null;
    const valid = await crypto.subtle.verify(
      'HMAC',
      await signingKey(secret),
      base64UrlDecode(encodedSignature),
      encoder.encode(encodedPayload)
    );
    if (!valid) return null;
    const payload = JSON.parse(decoder.decode(base64UrlDecode(encodedPayload)));
    if (!payload?.uid || !payload?.username || !payload?.csrf || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function sessionSecret(env) {
  return String(env.COMMUNITY_SESSION_SECRET || env.SESSION_SECRET || '');
}

async function currentSession(request, env, verifyUser = true) {
  const secret = sessionSecret(env);
  if (!secret) return null;
  const token = parseCookies(request.headers.get('Cookie'))[COOKIE_NAME];
  const session = await verifySessionToken(token, secret);
  if (!session || !verifyUser) return session;

  const response = await storeFetch(env, `/user?id=${encodeURIComponent(session.uid)}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.user) return null;
  return { ...session, username: data.user.username, createdAt: data.user.createdAt };
}

function validCsrf(request, session) {
  const header = request.headers.get('X-CloudLab-CSRF') || '';
  if (!header || !session?.csrf || header.length !== session.csrf.length) return false;
  let difference = 0;
  for (let index = 0; index < header.length; index += 1) difference |= header.charCodeAt(index) ^ session.csrf.charCodeAt(index);
  return difference === 0;
}

function communityStub(env) {
  if (!env.COMMUNITY) throw new Error('COMMUNITY Durable Object binding is missing.');
  const id = env.COMMUNITY.idFromName('cloudlab-community-global');
  return env.COMMUNITY.get(id);
}

function storeFetch(env, path, init = {}) {
  return communityStub(env).fetch(`https://community.internal${path}`, init);
}

async function readBody(request) {
  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > 32768) throw new Error('Request too large.');
  return request.json().catch(() => ({}));
}

async function verifyTurnstile(request, env, token, action) {
  const secret = String(env.TURNSTILE_SECRET || '').trim();
  if (!secret) return { success: true, skipped: true };
  if (!token) return { success: false };

  const form = new FormData();
  form.set('secret', secret);
  form.set('response', String(token));
  form.set('remoteip', request.headers.get('CF-Connecting-IP') || '');
  form.set('idempotency_key', crypto.randomUUID());

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) return { success: false };
  if (result.action && result.action !== action) return { success: false };
  return { success: true };
}

async function createLoginResponse(request, env, user, status = 200) {
  const secret = sessionSecret(env);
  if (!secret) return json(request, env, { error: 'Community sessions are not configured yet.' }, 503);
  const now = Math.floor(Date.now() / 1000);
  const csrf = base64UrlEncode(crypto.getRandomValues(new Uint8Array(24)));
  const token = await signSession({
    uid: user.id,
    username: user.username,
    csrf,
    iat: now,
    exp: now + SESSION_TTL
  }, secret);
  return json(request, env, { ok: true, user, csrfToken: csrf }, status, {
    'Set-Cookie': cookie(token)
  });
}

function pathAfterPrefix(pathname) {
  if (!pathname.startsWith(API_PREFIX)) return '';
  const path = pathname.slice(API_PREFIX.length) || '/';
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

export async function handleCommunityApi(request, env) {
  const url = new URL(request.url);
  const path = pathAfterPrefix(url.pathname);

  if (request.method === 'OPTIONS') {
    if (!originIsAllowed(request, env)) return json(request, env, { error: 'Origin not allowed.' }, 403);
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }
  if (!originIsAllowed(request, env)) return json(request, env, { error: 'Origin not allowed.' }, 403);

  try {
    if (path === '/health' && request.method === 'GET') {
      return json(request, env, {
        ok: true,
        service: 'cloudlab-community',
        storageConfigured: Boolean(env.COMMUNITY),
        sessionsConfigured: Boolean(sessionSecret(env)),
        turnstileConfigured: Boolean(env.TURNSTILE_SECRET && env.TURNSTILE_SITE_KEY)
      });
    }

    if (path === '/config' && request.method === 'GET') {
      return json(request, env, {
        turnstileSiteKey: String(env.TURNSTILE_SITE_KEY || ''),
        turnstileEnabled: Boolean(env.TURNSTILE_SECRET && env.TURNSTILE_SITE_KEY)
      });
    }

    if (path === '/username' && request.method === 'GET') {
      const response = await storeFetch(env, `/username?name=${encodeURIComponent(url.searchParams.get('name') || '')}`);
      return json(request, env, await response.json(), response.status);
    }

    if (path === '/signup' && request.method === 'POST') {
      const body = await readBody(request);
      const challenge = await verifyTurnstile(request, env, body.turnstileToken, 'signup');
      if (!challenge.success) return json(request, env, { error: 'Please complete the security check and try again.' }, 400);
      const response = await storeFetch(env, '/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: body.username,
          password: body.password,
          ip: request.headers.get('CF-Connecting-IP') || 'unknown'
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return json(request, env, data, response.status);
      return createLoginResponse(request, env, data.user, 201);
    }

    if (path === '/login' && request.method === 'POST') {
      const body = await readBody(request);
      const challenge = await verifyTurnstile(request, env, body.turnstileToken, 'login');
      if (!challenge.success) return json(request, env, { error: 'Please complete the security check and try again.' }, 400);
      const response = await storeFetch(env, '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: body.username,
          password: body.password,
          ip: request.headers.get('CF-Connecting-IP') || 'unknown'
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return json(request, env, data, response.status);
      return createLoginResponse(request, env, data.user);
    }

    if (path === '/logout' && request.method === 'POST') {
      const session = await currentSession(request, env, false);
      if (session && !validCsrf(request, session)) return json(request, env, { error: 'Security token expired. Refresh and try again.' }, 403);
      return json(request, env, { ok: true }, 200, { 'Set-Cookie': cookie('', 0) });
    }

    if (path === '/session' && request.method === 'GET') {
      const session = await currentSession(request, env);
      return json(request, env, session ? {
        authenticated: true,
        user: { id: session.uid, username: session.username, createdAt: session.createdAt },
        csrfToken: session.csrf,
        expiresAt: session.exp * 1000
      } : { authenticated: false, user: null, csrfToken: '' });
    }

    if (path === '/records' && request.method === 'GET') {
      const session = await currentSession(request, env);
      if (!session) return json(request, env, { error: 'Sign in to view saved records.' }, 401);
      const response = await storeFetch(env, `/records?userId=${encodeURIComponent(session.uid)}`);
      return json(request, env, await response.json(), response.status);
    }

    if (path === '/scores' && request.method === 'POST') {
      const session = await currentSession(request, env);
      if (!session) return json(request, env, { error: 'Sign in to save game records.' }, 401);
      if (!validCsrf(request, session)) return json(request, env, { error: 'Security token expired. Refresh and try again.' }, 403);
      const body = await readBody(request);
      const response = await storeFetch(env, '/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, userId: session.uid })
      });
      return json(request, env, await response.json(), response.status);
    }

    const leaderboardMatch = path.match(/^\/leaderboards\/([a-z0-9-]+)$/);
    if (leaderboardMatch && request.method === 'GET') {
      const response = await storeFetch(env, `/leaderboard?gameId=${encodeURIComponent(leaderboardMatch[1])}&limit=${encodeURIComponent(url.searchParams.get('limit') || '10')}`);
      return json(request, env, await response.json(), response.status);
    }

    const likeMatch = path.match(/^\/posts\/([a-z0-9-]+)\/like$/);
    if (likeMatch && request.method === 'GET') {
      const session = await currentSession(request, env);
      const response = await storeFetch(env, `/like?slug=${encodeURIComponent(likeMatch[1])}&userId=${encodeURIComponent(session?.uid || '')}`);
      return json(request, env, await response.json(), response.status);
    }
    if (likeMatch && request.method === 'POST') {
      const session = await currentSession(request, env);
      if (!session) return json(request, env, { error: 'Sign in to like Journal posts.' }, 401);
      if (!validCsrf(request, session)) return json(request, env, { error: 'Security token expired. Refresh and try again.' }, 403);
      const response = await storeFetch(env, '/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: likeMatch[1], userId: session.uid })
      });
      return json(request, env, await response.json(), response.status);
    }

    return json(request, env, { error: 'Community API route not found.' }, 404);
  } catch (error) {
    console.error('Community API error', error);
    return json(request, env, { error: 'The community service is temporarily unavailable.' }, 500);
  }
}
