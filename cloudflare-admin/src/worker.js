import app from './index.js';
import { handleCommunityApi } from './community-api-runtime.js';
import { handleFreshAbyss } from './fresh-abyss.js';
import { loginPage } from './admin-login-page.js';
import { commitFiles, readJsonFile } from './github.js';
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  html,
  json,
  parseCookies,
  safeStringEqual,
  verifySession
} from './utils.js';

const SITE_SETTINGS_PATH = 'site-settings.json';
export const FEATURED_GAME_IDS = Object.freeze([
  'breakout',
  'connect-four',
  'cloud-hopper',
  'cloudlab-clicker',
  'launcher',
  'flappy-cloud',
  'tower-stacker',
  'snake',
  '2048',
  'memory-match',
  'pong',
  'tic-tac-toe',
  'minesweeper'
]);
export const DEFAULT_FEATURED_GAMES = Object.freeze(['cloud-hopper', 'cloudlab-clicker', 'launcher']);
const FEATURED_GAME_ID_SET = new Set(FEATURED_GAME_IDS);
let siteSettingsCache = null;
let siteSettingsCacheUntil = 0;

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

export function normalizeFeaturedGames(value) {
  if (!Array.isArray(value)) return [...DEFAULT_FEATURED_GAMES];
  const seen = new Set();
  const normalized = [];
  for (const gameId of value) {
    if (typeof gameId !== 'string' || !FEATURED_GAME_ID_SET.has(gameId) || seen.has(gameId)) continue;
    seen.add(gameId);
    normalized.push(gameId);
    if (normalized.length === 6) break;
  }
  return normalized.length ? normalized : [...DEFAULT_FEATURED_GAMES];
}

export function isValidFeaturedGameSelection(value) {
  return Array.isArray(value)
    && value.length >= 1
    && value.length <= 6
    && new Set(value).size === value.length
    && value.every((gameId) => typeof gameId === 'string' && FEATURED_GAME_ID_SET.has(gameId));
}

export function normalizeSiteSettings(value) {
  return {
    forceSiteIntro: Boolean(value?.forceSiteIntro),
    featuredGames: normalizeFeaturedGames(value?.featuredGames),
    updatedAt: typeof value?.updatedAt === 'string' ? value.updatedAt : '',
    updatedBy: typeof value?.updatedBy === 'string' ? value.updatedBy : ''
  };
}

async function readSiteSettings(env, forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && siteSettingsCache && now < siteSettingsCacheUntil) return siteSettingsCache;
  const value = await readJsonFile(env, SITE_SETTINGS_PATH, {
    forceSiteIntro: false,
    featuredGames: [...DEFAULT_FEATURED_GAMES]
  });
  siteSettingsCache = normalizeSiteSettings(value);
  siteSettingsCacheUntil = now + 5000;
  return siteSettingsCache;
}

function publicSiteSettingsJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

async function publicSiteSettings(env) {
  try {
    const settings = await readSiteSettings(env);
    return publicSiteSettingsJson({
      ok: true,
      forceSiteIntro: settings.forceSiteIntro,
      featuredGames: settings.featuredGames,
      updatedAt: settings.updatedAt || null
    });
  } catch (error) {
    console.error('Could not read public site settings', error);
    return publicSiteSettingsJson({
      ok: false,
      forceSiteIntro: false,
      featuredGames: [...DEFAULT_FEATURED_GAMES],
      updatedAt: null
    });
  }
}

async function handleSiteIntroAdmin(request, env, session) {
  if (request.method === 'GET') {
    const settings = await readSiteSettings(env, true);
    return json({ ok: true, ...settings });
  }

  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  const parsedBody = await request.json().catch(() => ({}));
  const body = parsedBody && typeof parsedBody === 'object' && !Array.isArray(parsedBody) ? parsedBody : {};
  const hasForceSetting = Object.prototype.hasOwnProperty.call(body, 'forceSiteIntro');
  const hasFeaturedSetting = Object.prototype.hasOwnProperty.call(body, 'featuredGames');
  if (!hasForceSetting && !hasFeaturedSetting) return json({ error: 'No site setting was provided.' }, 400);
  if (hasForceSetting && typeof body.forceSiteIntro !== 'boolean') {
    return json({ error: 'The loading setting must be true or false.' }, 400);
  }
  if (hasFeaturedSetting) {
    if (!isValidFeaturedGameSelection(body.featuredGames)) {
      return json({ error: 'Choose between 1 and 6 unique games from the arcade.' }, 400);
    }
  }
  const current = await readSiteSettings(env, true);
  const settings = {
    forceSiteIntro: hasForceSetting ? body.forceSiteIntro : current.forceSiteIntro,
    featuredGames: hasFeaturedSetting ? normalizeFeaturedGames(body.featuredGames) : current.featuredGames,
    updatedAt: new Date().toISOString(),
    updatedBy: session.login
  };
  const message = hasForceSetting && hasFeaturedSetting
    ? 'Update site settings'
    : hasFeaturedSetting
      ? 'Update featured arcade games'
      : settings.forceSiteIntro
        ? 'Site intro: force animation on'
        : 'Site intro: restore hourly animation';
  const commit = await commitFiles(env, [{
    path: SITE_SETTINGS_PATH,
    text: `${JSON.stringify(settings, null, 2)}\n`
  }], message);

  siteSettingsCache = settings;
  siteSettingsCacheUntil = Date.now() + 5000;
  return json({ ok: true, ...settings, commit });
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
      if (path === '/v1/site-settings' && request.method === 'GET') return publicSiteSettings(env);
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

      if (path === '/api/site-intro') {
        const session = await getSession(request, env);
        if (!session) return json({ error: 'Authentication required.' }, 401);
        if (request.method !== 'GET' && !validCsrf(request, session)) {
          return json({ error: 'Security token expired. Refresh the dashboard and try again.' }, 403);
        }
        return handleSiteIntroAdmin(request, env, session);
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
