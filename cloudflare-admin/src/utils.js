export const SESSION_COOKIE = 'cloudlab_admin_session';
export const STATE_COOKIE = 'cloudlab_oauth_state';
export const CSRF_COOKIE = 'cloudlab_admin_csrf';
export const SESSION_TTL = 8 * 60 * 60;

export function html(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Referrer-Policy': 'no-referrer',
      ...headers
    }
  });
}

export function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export function parseCookies(header = '') {
  const result = {};
  for (const part of String(header || '').split(';')) {
    const at = part.indexOf('=');
    if (at < 0) continue;
    const key = part.slice(0, at).trim();
    const raw = part.slice(at + 1).trim();
    try { result[key] = decodeURIComponent(raw); } catch { result[key] = raw; }
  }
  return result;
}

export function cookie(name, value, { httpOnly = false, maxAge = SESSION_TTL, sameSite = 'Lax' } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'Secure', `SameSite=${sameSite}`, `Max-Age=${Math.max(0, Math.floor(maxAge))}`];
  if (httpOnly) parts.push('HttpOnly');
  return parts.join('; ');
}

export function randomToken(size = 24) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export async function signSession(payload, secret) {
  const data = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmac(data, secret);
  return `${data}.${base64UrlEncode(signature)}`;
}

export async function verifySession(token, secret) {
  const [data, sig] = String(token || '').split('.');
  if (!data || !sig) return null;
  const expected = await hmac(data, secret);
  const actual = base64UrlDecode(sig);
  if (!timingSafeEqual(expected, actual)) return null;
  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(data)));
  if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function safeStringEqual(a, b) {
  return timingSafeEqual(new TextEncoder().encode(String(a)), new TextEncoder().encode(String(b)));
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a[i] ^ b[i];
  return result === 0;
}

export function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function decodeBase64Utf8(value) {
  const binary = atob(String(value || '').replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function base64UrlEncode(bytes) {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function requireEnv(env, names) {
  const missing = names.filter((name) => !env[name]);
  if (missing.length) throw new Error(`Missing Worker settings: ${missing.join(', ')}`);
}

export function cleanText(value, max = 500) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function cleanMultiline(value, max = 12000) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max);
}

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

export function validDate(value) {
  const text = String(value || '');
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(`${text}T00:00:00Z`)) ? text : '';
}

export function displayDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
  }).format(new Date(`${value}T00:00:00Z`));
}

export function normalizeTags(value) {
  const list = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(list.map((tag) => cleanText(tag, 40)).filter(Boolean))].slice(0, 8);
}

export function cleanAssetPath(value) {
  const path = String(value || '').trim();
  if (!path) return '';
  if (path === '/assets/images/profile-gloss.webp') return path;
  if (!path.startsWith('/assets/images/journal/') || path.includes('..') || /[<>"']/.test(path)) return '';
  return path;
}

export function mediaType(path) {
  return /\.(mp4|webm|mov|m4v)$/i.test(String(path || '')) ? 'video' : 'image';
}

export function uniqueFileName(name, used) {
  const parts = String(name || 'media.bin').split('.');
  const ext = (parts.length > 1 ? parts.pop() : 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin';
  const stem = parts.join('.').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'media';
  let candidate = `${stem}.${ext}`;
  let number = 2;
  while (used.has(candidate)) candidate = `${stem}-${number++}.${ext}`;
  used.add(candidate);
  return candidate;
}

export function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

export function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

export function encodePath(path) {
  return String(path).split('/').map(encodeURIComponent).join('/');
}
