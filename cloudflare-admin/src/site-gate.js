// Emergency close ("site gate") for danny4686.com.
//
// Every public page loads /assets/js/site-gate.js first thing in <head>. The admin
// panel rewrites that file when the site is closed or reopened, and also stores the
// state in the CommunityStore Durable Object so the change is live within seconds:
// the script asks api.danny4686.com/v1/site-status on every page view, which covers
// visitors whose browser still has an older copy of the file cached.
//
// This module has no Worker-only dependencies so the repository validators can
// import it and check that the committed file matches site-settings.json.

export const SITE_GATE_PATH = 'assets/js/site-gate.js';
export const SITE_STATUS_URL = 'https://api.danny4686.com/v1/site-status';
export const DEFAULT_CLOSED_REDIRECT = 'https://www.roblox.com/users/178415120/profile';
export const SITE_GATE_TAG = '<script src="/assets/js/site-gate.js"></script>';

// Only plain https links are allowed as the redirect target.
export function normalizeRedirectUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw.length > 500) return '';
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return '';
    if (/^(?:www\.)?danny4686\.com$/i.test(url.hostname)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

export function normalizeSiteStatus(value) {
  return {
    open: value?.open !== false,
    redirect: normalizeRedirectUrl(value?.redirect) || DEFAULT_CLOSED_REDIRECT,
    changedAt: typeof value?.changedAt === 'string' ? value.changedAt : '',
    changedBy: typeof value?.changedBy === 'string' ? value.changedBy : ''
  };
}

export function buildSiteGateScript({ closed = false, redirect = DEFAULT_CLOSED_REDIRECT } = {}) {
  const target = normalizeRedirectUrl(redirect) || DEFAULT_CLOSED_REDIRECT;
  return `/* CloudLab site gate. Managed by the admin panel (Site controls); do not edit by hand. */
(function () {
  var CLOSED = ${closed ? 'true' : 'false'};
  var REDIRECT = ${JSON.stringify(target)};
  var STATUS = ${JSON.stringify(SITE_STATUS_URL)};
  var root = document.documentElement;
  var settled = false;
  var timer = 0;

  function safe(url) { return typeof url === 'string' && /^https:\\/\\//i.test(url) ? url : REDIRECT; }
  function hide() { root.style.visibility = 'hidden'; }
  function show() { root.style.visibility = ''; }
  function leave(url) { hide(); window.location.replace(safe(url)); }
  function settle(status) {
    if (settled) return;
    settled = true;
    window.clearTimeout(timer);
    if (status && status.open === false) leave(status.redirect);
    else if (status && status.open === true) show();
    else if (CLOSED) leave(REDIRECT);
  }

  if (CLOSED) {
    hide();
    timer = window.setTimeout(function () { settle(null); }, 2500);
  }
  try {
    fetch(STATUS, { cache: 'no-store', credentials: 'omit' })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(settle, function () { settle(null); });
  } catch (error) {
    settle(null);
  }
})();
`;
}
