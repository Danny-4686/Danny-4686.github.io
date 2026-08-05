import { ADMIN_CSS, ADMIN_JS } from './admin-assets.js';
import { commitFiles, readJsonFile } from './github.js';
import { dashboardPage, loginPage } from './pages.js';
import { buildPostHtml } from './post-template.js';
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  SESSION_TTL,
  STATE_COOKIE,
  cleanAssetPath,
  cleanMultiline,
  cleanText,
  cookie,
  displayDate,
  html,
  json,
  mediaType,
  normalizeTags,
  parseCookies,
  randomToken,
  requireEnv,
  safeStringEqual,
  signSession,
  slugify,
  uniqueFileName,
  validDate,
  verifySession
} from './utils.js';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 30 * 1024 * 1024;
const POST_MODES = new Set(['article', 'card', 'coming-soon']);

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const path = url.pathname.length > 1 && url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;

      if (path === '/health') return json({ ok: true, service: 'cloudlab-journal-admin' });
      if (path === '/auth/login') return startLogin(request, env);
      if (path === '/auth/callback') return finishLogin(request, env);
      if (path === '/auth/logout') return logout(request);

      const session = await getSession(request, env);

      if (path === '/admin.css' || path === '/admin.js') {
        if (!session) return new Response('Not found', { status: 404 });
        const isCss = path.endsWith('.css');
        return new Response(isCss ? ADMIN_CSS : ADMIN_JS, {
          headers: {
            'Content-Type': isCss ? 'text/css; charset=utf-8' : 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-store, private',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }

      if (path.startsWith('/api/')) {
        if (!session) return json({ error: 'Authentication required.' }, 401);
        if (request.method !== 'GET' && !validCsrf(request, session)) {
          return json({ error: 'Security token expired. Refresh the dashboard and try again.' }, 403);
        }
        return handleApi(request, env, session, path);
      }

      if (path === '/' || path === '/admin') {
        const csp = session
          ? "default-src 'none'; style-src 'self'; script-src 'self'; img-src https://danny4686.com data: blob:; media-src https://danny4686.com blob:; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"
          : "default-src 'none'; style-src 'unsafe-inline'; img-src https://danny4686.com; form-action 'self' https://github.com; frame-ancestors 'none'; base-uri 'none'";
        return html(session ? dashboardPage(session.login) : loginPage(), 200, { 'Content-Security-Policy': csp });
      }

      return new Response('Not found', { status: 404 });
    } catch (error) {
      console.error(error);
      return json({ error: 'Unexpected server error.' }, 500);
    }
  }
};

async function handleApi(request, env, session, path) {
  if (path === '/api/session' && request.method === 'GET') {
    return json({ login: session.login, csrfToken: session.csrf, expiresAt: session.exp * 1000 });
  }

  if (path === '/api/posts' && request.method === 'GET') {
    return json({ posts: await getPosts(env) });
  }

  if (path === '/api/post' && request.method === 'GET') {
    const slug = slugify(new URL(request.url).searchParams.get('slug') || '');
    if (!slug) return json({ error: 'A valid post URL name is required.' }, 400);
    const source = await readJsonFile(env, `journal/posts/${slug}/post.json`, null);
    if (source) return json({ post: source });
    const listing = (await getPosts(env)).find((post) => post.slug === slug);
    if (!listing) return json({ error: 'Post not found.' }, 404);
    return json({ post: { ...listing, mode: normalizeMode(listing), hero: listing.thumbnail, sections: [] } });
  }

  if (path === '/api/publish' && request.method === 'POST') {
    return publish(request, env, session);
  }

  if (path === '/api/unpublish' && request.method === 'POST') {
    const body = await request.json();
    return unpublish(env, body?.slug, session);
  }

  return json({ error: 'API route not found.' }, 404);
}

async function startLogin(request, env) {
  requireEnv(env, ['GITHUB_CLIENT_ID']);
  const state = randomToken(32);
  const auth = new URL('https://github.com/login/oauth/authorize');
  auth.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  auth.searchParams.set('redirect_uri', new URL('/auth/callback', request.url).toString());
  auth.searchParams.set('scope', 'read:user');
  auth.searchParams.set('state', state);
  const headers = new Headers({ Location: auth.toString() });
  headers.append('Set-Cookie', cookie(STATE_COOKIE, state, { httpOnly: true, maxAge: 600 }));
  return new Response(null, { status: 302, headers });
}

async function finishLogin(request, env) {
  requireEnv(env, ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'SESSION_SECRET', 'ALLOWED_GITHUB_LOGIN', 'ALLOWED_GITHUB_ID']);
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = parseCookies(request.headers.get('Cookie'))[STATE_COOKIE];
  if (!code || !state || !storedState || !safeStringEqual(state, storedState)) {
    return html(loginPage('The GitHub sign-in request could not be verified.'), 400);
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'CloudLab-Journal-Admin' },
    body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code })
  });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.access_token) return html(loginPage('GitHub did not complete the sign-in request.'), 401);

  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token.access_token}`,
      'User-Agent': 'CloudLab-Journal-Admin',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  const user = await userResponse.json();
  if (!userResponse.ok || !user.login) return html(loginPage('Your GitHub account could not be verified.'), 401);
  const allowedLogin = String(env.ALLOWED_GITHUB_LOGIN).trim().toLowerCase();
  const allowedId = String(env.ALLOWED_GITHUB_ID).trim();
  if (String(user.login).toLowerCase() !== allowedLogin || String(user.id) !== allowedId) {
    return html(loginPage('This GitHub account is not authorized.'), 403);
  }

  const now = Math.floor(Date.now() / 1000);
  const csrf = randomToken(24);
  const session = await signSession({ login: user.login, githubId: user.id, csrf, iat: now, exp: now + SESSION_TTL }, env.SESSION_SECRET);
  const headers = new Headers({ Location: '/' });
  headers.append('Set-Cookie', cookie(SESSION_COOKIE, session, { httpOnly: true, maxAge: SESSION_TTL }));
  headers.append('Set-Cookie', cookie(CSRF_COOKIE, csrf, { maxAge: SESSION_TTL, sameSite: 'Strict' }));
  headers.append('Set-Cookie', cookie(STATE_COOKIE, '', { httpOnly: true, maxAge: 0 }));
  return new Response(null, { status: 302, headers });
}

function logout(request) {
  const headers = new Headers({ Location: new URL('/', request.url).toString() });
  headers.append('Set-Cookie', cookie(SESSION_COOKIE, '', { httpOnly: true, maxAge: 0 }));
  headers.append('Set-Cookie', cookie(CSRF_COOKIE, '', { maxAge: 0, sameSite: 'Strict' }));
  return new Response(null, { status: 302, headers });
}

async function getSession(request, env) {
  if (!env.SESSION_SECRET || !env.ALLOWED_GITHUB_LOGIN || !env.ALLOWED_GITHUB_ID) return null;
  const token = parseCookies(request.headers.get('Cookie'))[SESSION_COOKIE];
  if (!token) return null;
  try {
    const session = await verifySession(token, env.SESSION_SECRET);
    if (!session || String(session.login).toLowerCase() !== String(env.ALLOWED_GITHUB_LOGIN).trim().toLowerCase() || String(session.githubId) !== String(env.ALLOWED_GITHUB_ID).trim()) return null;
    return session;
  } catch {
    return null;
  }
}

function validCsrf(request, session) {
  const cookies = parseCookies(request.headers.get('Cookie'));
  const header = request.headers.get('X-CSRF-Token') || '';
  return header && cookies[CSRF_COOKIE] && safeStringEqual(header, session.csrf) && safeStringEqual(cookies[CSRF_COOKIE], session.csrf);
}

async function getPosts(env) {
  const value = await readJsonFile(env, 'journal/posts.json', []);
  return Array.isArray(value) ? value : [];
}

function normalizeMode(value) {
  if (POST_MODES.has(value?.mode)) return value.mode;
  if (value?.comingSoon) return 'coming-soon';
  if (value?.cardOnly) return 'card';
  return 'article';
}

async function publish(request, env, session) {
  requireEnv(env, ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO']);
  const form = await request.formData();
  const raw = form.get('metadata');
  if (typeof raw !== 'string') return json({ error: 'Post information is missing.' }, 400);

  let input;
  try { input = JSON.parse(raw); } catch { return json({ error: 'Post information is invalid.' }, 400); }

  const title = cleanText(input.title, 140);
  const description = cleanText(input.description, 320);
  const slug = slugify(input.slug || title);
  const date = validDate(input.date);
  const tags = normalizeTags(input.tags);
  const fit = input.fit === 'contain' ? 'contain' : 'cover';
  const mode = normalizeMode(input);
  const isArticle = mode === 'article';
  const comingSoon = mode === 'coming-soon';
  const cardOnly = mode === 'card';
  const sections = isArticle ? normalizeSections(input.sections) : [];
  if (!title || !description || !slug || !date) return json({ error: 'Title, description, date, and URL name are required.' }, 400);

  const uploaded = [];
  for (const value of form.values()) if (value instanceof File && value.size > 0) uploaded.push(value);
  if (uploaded.some((file) => file.size > MAX_FILE_BYTES)) return json({ error: 'Each uploaded file must be 10 MB or smaller.' }, 413);
  if (uploaded.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_BYTES) return json({ error: 'The total upload must be 30 MB or smaller.' }, 413);

  const existingSource = await readJsonFile(env, `journal/posts/${slug}/post.json`, null);
  const files = [];
  const usedNames = new Set();
  const newMediaPaths = [];
  const mediaFolder = `assets/images/journal/${slug}`;

  async function uploadField(field, fallback) {
    const file = form.get(field);
    if (!(file instanceof File) || !file.size) return '';
    const name = uniqueFileName(file.name || fallback, usedNames);
    const path = `${mediaFolder}/${name}`;
    files.push({ path, bytes: new Uint8Array(await file.arrayBuffer()) });
    newMediaPaths.push(path);
    return `/${path}`;
  }

  const thumbnail = await uploadField('thumbnail', 'thumbnail.png') || cleanAssetPath(input.existingThumbnail) || '/assets/images/profile-gloss.webp';
  const hero = isArticle
    ? (await uploadField('hero', 'hero.png') || cleanAssetPath(input.existingHero) || thumbnail)
    : thumbnail;
  const resolvedSections = [];

  if (isArticle) {
    for (let i = 0; i < sections.length; i += 1) {
      const section = sections[i];
      const media = [];
      for (const existing of section.existingMedia) {
        const path = cleanAssetPath(existing.path);
        if (path) media.push({ path, alt: cleanText(existing.alt, 180), type: existing.type === 'video' ? 'video' : 'image' });
      }
      for (const item of section.uploads) {
        const path = await uploadField(item.field, `section-${i + 1}.png`);
        if (!path) continue;
        const file = form.get(item.field);
        media.push({ path, alt: cleanText(item.alt || file?.name || title, 180), type: file?.type?.startsWith('video/') ? 'video' : 'image' });
      }
      resolvedSections.push({ heading: section.heading, body: section.body, media });
    }
  }

  const post = {
    slug, title, description, date, displayDate: displayDate(date), tags,
    thumbnail, hero, fit, mode, comingSoon, cardOnly, sections: resolvedSections,
    updatedBy: session.login, updatedAt: new Date().toISOString(),
    mediaPaths: [...new Set([...(existingSource?.mediaPaths || []), ...newMediaPaths])]
  };

  const posts = await getPosts(env);
  const listing = {
    slug, title, description, date, displayDate: post.displayDate, tags,
    mediaType: mediaType(thumbnail), thumbnail, fit, mode, comingSoon, cardOnly
  };
  const updated = [listing, ...posts.filter((item) => item.slug !== slug)]
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  files.push({ path: 'journal/posts.json', text: `${JSON.stringify(updated, null, 2)}\n` });
  if (isArticle) {
    files.push({ path: `journal/posts/${slug}/post.json`, text: `${JSON.stringify(post, null, 2)}\n` });
    files.push({ path: `journal/posts/${slug}/index.html`, text: buildPostHtml(post) });
  } else if (existingSource) {
    files.push({ path: `journal/posts/${slug}/index.html`, delete: true });
    files.push({ path: `journal/posts/${slug}/post.json`, delete: true });
  }

  const action = mode === 'article' ? 'Publish' : mode === 'card' ? 'Publish Journal card' : 'Schedule';
  const commit = await commitFiles(env, files, `${action}: ${title}`);
  return json({ ok: true, slug, mode, comingSoon, cardOnly, commit });
}

function normalizeSections(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 30).map((section) => ({
    heading: cleanText(section?.heading, 180),
    body: cleanMultiline(section?.body, 12000),
    existingMedia: Array.isArray(section?.existingMedia) ? section.existingMedia.slice(0, 12) : [],
    uploads: Array.isArray(section?.uploads)
      ? section.uploads.slice(0, 12).map((item) => ({ field: cleanText(item?.field, 80), alt: cleanText(item?.alt, 180) })).filter((item) => item.field)
      : []
  })).filter((section) => section.heading || section.body || section.existingMedia.length || section.uploads.length);
}

async function unpublish(env, rawSlug, session) {
  requireEnv(env, ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO']);
  const slug = slugify(rawSlug || '');
  if (!slug) return json({ error: 'A valid post URL name is required.' }, 400);
  const posts = await getPosts(env);
  if (!posts.some((post) => post.slug === slug)) return json({ error: 'Post not found.' }, 404);
  const source = await readJsonFile(env, `journal/posts/${slug}/post.json`, null);
  const files = [
    { path: 'journal/posts.json', text: `${JSON.stringify(posts.filter((post) => post.slug !== slug), null, 2)}\n` }
  ];
  if (source) {
    files.push({ path: `journal/posts/${slug}/index.html`, delete: true });
    files.push({ path: `journal/posts/${slug}/post.json`, delete: true });
  }
  for (const media of source?.mediaPaths || []) {
    const path = String(media).replace(/^\//, '');
    if (path.startsWith(`assets/images/journal/${slug}/`)) files.push({ path, delete: true });
  }
  const commit = await commitFiles(env, files, `Unpublish journal post: ${slug} (${session.login})`);
  return json({ ok: true, slug, commit });
}
