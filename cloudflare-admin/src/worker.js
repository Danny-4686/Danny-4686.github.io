import app from './index.js';
import { handleCommunityApi } from './community-api-runtime.js';
import { handleFreshAbyss } from './fresh-abyss.js';
import { loginPage } from './admin-login-page.js';
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
    accountRestrictionConfigured: Boolean(env.ALLOWED_GITHUB_LOGIN && env.ALLOWED_GITHUB_ID),
    communityConfigured: Boolean(env.COMMUNITY && env.SESSION_SECRET)
  };
}

function loginNoticePage(status = 500, requestId = '') {
  return html(loginPage('retry'), status, {
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

async function replaceAdminAuthFailure(response, path) {
  if (!path.startsWith('/auth/') || response.status < 400) return response;
  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes('text/html')) return response;
  return loginNoticePage(response.status, response.headers.get('X-CloudLab-Request-ID') || '');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.length > 1 && url.pathname.endsWith('/')
      ? url.pathname.slice(0, -1)
      : url.pathname;
    const requestId = crypto.randomUUID();
    const communityHost = url.hostname.toLowerCase() === 'api.danny4686.com';

    if (communityHost) {
      if (path === '/') return Response.redirect('https://danny4686.com/account/', 302);
      if (!path.startsWith('/v1')) return json({ error: 'Community API route not found.' }, 404);
      return handleCommunityApi(request, env);
    }

    if (path === '/health') {
      return json({
        ok: true,
        service: 'cloudlab-journal-admin',
        ...configurationStatus(env)
      });
    }

    if (path === '/auth/login') {
      const missing = missingSettings(env, ['GITHUB_CLIENT_ID']);
      if (missing.length) return loginNoticePage(503, requestId);
    }

    if (path === '/auth/callback') {
      const missing = missingSettings(env, [
        'GITHUB_CLIENT_ID',
        'GITHUB_CLIENT_SECRET',
        'SESSION_SECRET',
        'ALLOWED_GITHUB_LOGIN',
        'ALLOWED_GITHUB_ID'
      ]);
      if (missing.length) return loginNoticePage(503, requestId);
    }

    try {
      if (path === '/' || path === '/admin') {
        const session = await getSession(request, env);
        if (!session) {
          const csp = "default-src 'none'; style-src 'unsafe-inline'; img-src https://danny4686.com; form-action 'self' https://github.com; frame-ancestors 'none'; base-uri 'none'";
          return html(loginPage(), 200, { 'Content-Security-Policy': csp });
        }
      }

      if (path === '/api/fresh-abyss') {
        const session = await getSession(request, env);
        if (!session) return json({ error: 'Authentication required.' }, 401);
        if (request.method !== 'GET' && !validCsrf(request, session)) {
          return json({ error: 'Security token expired. Refresh the dashboard and try again.' }, 403);
        }
        return handleFreshAbyss(request, env, session);
      }

      const rawResponse = await app.fetch(request, env, ctx);
      const replacedResponse = await replaceAdminAuthFailure(rawResponse, path);
      const response = allowExternalImagePreviews(replacedResponse, path);
      if (response.status < 500) return response;

      if (path === '/' || path === '/admin' || path.startsWith('/auth/')) {
        return loginNoticePage(500, requestId);
      }

      return response;
    } catch (error) {
      console.error('Unhandled CloudLab admin error', requestId, error);
      if (path === '/' || path === '/admin' || path.startsWith('/auth/')) {
        return loginNoticePage(500, requestId);
      }
      return json({ error: 'Unexpected server error.', requestId }, 500);
    }
  }
};
