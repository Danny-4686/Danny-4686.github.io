import app from './index.js';
import { loginPage } from './pages.js';
import { html, json } from './utils.js';

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
      const response = await app.fetch(request, env, ctx);
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
