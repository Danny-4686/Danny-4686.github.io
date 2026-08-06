import app from './index.js';
import { handleFreshAbyss } from './fresh-abyss.js';
import { loginPage } from './pages.js';
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  html,
  json,
  parseCookies,
  safeStringEqual,
  verifySession
} from './utils.js';

function missingSettings(env, names) {
  return names.filter((name) => !env[name]);
}

function configurationStatus(env) {
  return {
    oauthConfigured: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
    sessionConfigured: Boolean(env.SESSION_SECRET),
    publisherConfigured: Boolean(env.GITHUB_TOKEN && env.GITHUB_OWNER && env.GITHUB_REPO),
    accountRestrictionConfigured: Boolean(env.ALLOWED_GITHUB_LOGIN && env.ALLOWED_GITHUB_ID)
  };
}

function loginErrorPage(message, status = 500, requestId = '') {
  const detail = requestId ? `${message} Reference: ${requestId}.` : message;
  return html(loginPage(detail), status, {
    'X-CloudLab-Request-ID': requestId || 'not-generated'
  });
}

async function getSession(request, env) {
  if (!env.SESSION_SECRET || !env.ALLOWED_GITHUB_LOGIN || !env.ALLOWED_GITHUB_ID) return null;
  const token = parseCookies(request.headers.get('Cookie'))[SESSION_COOKIE];
  if (!token) return null;

  try {
    const session = await verifySession(token, env.SESSION_SECRET);
    const allowedLogin = String(env.ALLOWED_GITHUB_LOGIN).trim().toLowerCase();
    const allowedId = String(env.ALLOWED_GITHUB_ID).trim();
    if (!session || String(session.login).toLowerCase() !== allowedLogin || String(session.githubId) !== allowedId) return null;
    return session;
  } catch {
    return null;
  }
}

function validCsrf(request, session) {
  const cookies = parseCookies(request.headers.get('Cookie'));
  const header = request.headers.get('X-CSRF-Token') || '';
  return Boolean(
    header &&
    cookies[CSRF_COOKIE] &&
    safeStringEqual(header, session.csrf) &&
    safeStringEqual(cookies[CSRF_COOKIE], session.csrf)
  );
}

function allowExternalImagePreviews(response, path) {
  if (path !== '/' && path !== '/admin') return response;
  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  const csp = headers.get('Content-Security-Policy');
  if (csp) {
    headers.set(
      'Content-Security-Policy',
      csp.replace('img-src https://danny4686.com data: blob:', 'img-src https: data: blob:')
    );
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.length > 1 && url.pathname.endsWith('/')
      ? url.pathname.slice(0, -1)
      : url.pathname;
    const requestId = crypto.randomUUID();

    if (path === '/health') {
      return json({
        ok: true,
        service: 'cloudlab-journal-admin',
        ...configurationStatus(env)
      });
    }

    if (path === '/auth/login') {
      const missing = missingSettings(env, ['GITHUB_CLIENT_ID']);
      if (missing.length) {
        return loginErrorPage(
          `GitHub sign-in is not configured on this Worker. Missing: ${missing.join(', ')}.`,
          503,
          requestId
        );
      }
    }

    if (path === '/auth/callback') {
      const missing = missingSettings(env, [
        'GITHUB_CLIENT_ID',
        'GITHUB_CLIENT_SECRET',
        'SESSION_SECRET',
        'ALLOWED_GITHUB_LOGIN',
        'ALLOWED_GITHUB_ID'
      ]);
      if (missing.length) {
        return loginErrorPage(
          `GitHub sign-in cannot finish because the Worker is missing: ${missing.join(', ')}.`,
          503,
          requestId
        );
      }
    }

    try {
      if (path === '/api/fresh-abyss') {
        const session = await getSession(request, env);
        if (!session) return json({ error: 'Authentication required.' }, 401);
        if (request.method !== 'GET' && !validCsrf(request, session)) {
          return json({ error: 'Security token expired. Refresh the dashboard and try again.' }, 403);
        }
        return handleFreshAbyss(request, env, session);
      }

      const response = allowExternalImagePreviews(await app.fetch(request, env, ctx), path);
      if (response.status < 500) return response;

      if (path === '/' || path === '/admin' || path.startsWith('/auth/')) {
        return loginErrorPage(
          'GitHub sign-in hit a temporary server problem. Return to this page and press Sign in with GitHub again.',
          500,
          requestId
        );
      }

      return response;
    } catch (error) {
      console.error('Unhandled CloudLab admin error', requestId, error);
      if (path === '/' || path === '/admin' || path.startsWith('/auth/')) {
        return loginErrorPage(
          'The admin page hit a temporary server problem. Reload the page and try signing in again.',
          500,
          requestId
        );
      }
      return json({ error: 'Unexpected server error.', requestId }, 500);
    }
  }
};
