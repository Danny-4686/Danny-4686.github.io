import { commitFiles, readJsonFile } from './github.js';
import { json, requireEnv, uniqueFileName } from './utils.js';

const CONFIG_PATH = 'fresh_abyss/config.json';
const PAGE_PATH = 'fresh_abyss/index.html';
const MEDIA_FOLDER = 'assets/images/fresh_abyss';
const MAX_MEDIA_BYTES = 30 * 1024 * 1024;
const INITIAL_MEDIA = 'https://cdn.discordapp.com/attachments/1138912646943473785/1534791088831991888/image.png?ex=6a756916&is=6a741796&hm=a6063589806be1833ad1e4431bd4914da9ebdea9c411b98b255aa175f02b47a3&';

const DEFAULT_CONFIG = {
  enabled: true,
  media: INITIAL_MEDIA,
  mediaType: 'image',
  managedMedia: '',
  updatedAt: null,
  updatedBy: null
};

function escapeAttr(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function normalizeMediaSource(value) {
  const source = String(value || '').trim().slice(0, 2200);
  if (!source) return '';

  if (source.startsWith(`/${MEDIA_FOLDER}/`) && !source.includes('..') && !/[<>"']/.test(source)) {
    return source;
  }

  try {
    const url = new URL(source);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function normalizeMediaType(value) {
  return value === 'video' ? 'video' : value === 'image' ? 'image' : '';
}

function detectMediaType(source, mime = '') {
  if (String(mime).toLowerCase().startsWith('video/')) return 'video';
  if (String(mime).toLowerCase().startsWith('image/')) return 'image';

  try {
    const pathname = new URL(source, 'https://danny4686.com').pathname;
    if (/\.(mp4|webm|mov|m4v|ogv|ogg)$/i.test(pathname)) return 'video';
  } catch {
    if (/\.(mp4|webm|mov|m4v|ogv|ogg)(?:$|[?#])/i.test(String(source || ''))) return 'video';
  }

  return 'image';
}

function buildDisabledPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">
  <meta name="referrer" content="no-referrer">
  <meta name="theme-color" content="#000000">
  <title></title>
  <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
  <link rel="icon" href="/assets/icons/favicon-48x48.png" type="image/png" sizes="48x48">
  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png" sizes="180x180">
  <style>*{box-sizing:border-box}html,body{width:100%;min-height:100%;margin:0;background:#000}body{min-height:100svh}</style>
</head>
<body aria-hidden="true"></body>
</html>
`;
}

function buildMediaElement(media, mediaType) {
  const source = escapeAttr(media);
  if (mediaType === 'video') {
    return `<video src="${source}" aria-label="Fresh Abyss video" controls autoplay muted loop playsinline preload="metadata" referrerpolicy="no-referrer"></video>`;
  }
  return `<img src="${source}" alt="Fresh Abyss" referrerpolicy="no-referrer" draggable="false">`;
}

function buildEnabledPage(media, mediaType) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">
  <meta name="referrer" content="no-referrer">
  <meta name="theme-color" content="#020507">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' https: data:; media-src 'self' https: blob:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
  <title>Fresh Abyss</title>
  <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
  <link rel="icon" href="/assets/icons/favicon-48x48.png" type="image/png" sizes="48x48">
  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png" sizes="180x180">
  <style>
    :root{color-scheme:dark;--edge:rgba(255,255,255,.13);--glow:rgba(91,175,210,.12)}
    *{box-sizing:border-box}
    html,body{width:100%;min-height:100%;margin:0}
    body{min-height:100svh;display:grid;place-items:center;padding:clamp(12px,3vw,34px);overflow-x:hidden;background:radial-gradient(circle at 50% 42%,var(--glow),transparent 48%),linear-gradient(180deg,#05090c,#010203)}
    .media-frame{width:min(1120px,100%);max-height:calc(100svh - clamp(24px,6vw,68px));display:grid;place-items:center;overflow:hidden;padding:clamp(6px,1vw,11px);border:1px solid var(--edge);border-radius:clamp(15px,2vw,26px);background:rgba(5,10,14,.9);box-shadow:0 28px 80px rgba(0,0,0,.62),inset 0 1px rgba(255,255,255,.055)}
    .media-frame img,.media-frame video{display:block;width:auto;max-width:100%;height:auto;max-height:calc(100svh - clamp(38px,8vw,90px));object-fit:contain;border-radius:clamp(10px,1.35vw,18px);background:#000;box-shadow:0 18px 52px rgba(0,0,0,.34)}
    .media-frame img{user-select:none;-webkit-user-drag:none}
    .media-frame video{width:100%;outline:none}
    @media(max-width:600px){body{padding:8px}.media-frame{width:100%;max-height:calc(100svh - 16px);padding:5px;border-radius:15px}.media-frame img,.media-frame video{max-height:calc(100svh - 26px);border-radius:11px}}
  </style>
</head>
<body>
  <main class="media-frame" aria-label="Fresh Abyss media">
    ${buildMediaElement(media, mediaType)}
  </main>
</body>
</html>
`;
}

export async function getFreshAbyssConfig(env) {
  const stored = await readJsonFile(env, CONFIG_PATH, null);
  if (!stored || typeof stored !== 'object') {
    return { ...DEFAULT_CONFIG, image: DEFAULT_CONFIG.media, managedImage: '' };
  }

  const media = normalizeMediaSource(stored.media || stored.image) || INITIAL_MEDIA;
  const mediaType = normalizeMediaType(stored.mediaType) || detectMediaType(media);
  const managedMedia = String(stored.managedMedia || stored.managedImage || '').replace(/^\/+/, '');

  return {
    enabled: stored.enabled !== false,
    media,
    mediaType,
    managedMedia,
    updatedAt: stored.updatedAt || null,
    updatedBy: stored.updatedBy || null,
    image: media,
    managedImage: managedMedia
  };
}

export async function handleFreshAbyss(request, env, session) {
  if (request.method === 'GET') {
    return json({ config: await getFreshAbyssConfig(env) });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  requireEnv(env, ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO']);
  const form = await request.formData();
  const current = await getFreshAbyssConfig(env);
  const enabled = String(form.get('enabled')) === 'true';
  const mediaFile = form.get('media') || form.get('image');
  const requestedUrl = normalizeMediaSource(form.get('mediaUrl') || form.get('imageUrl'));
  const requestedType = normalizeMediaType(form.get('mediaType'));
  const files = [];
  let media = current.media;
  let mediaType = current.mediaType;
  let managedMedia = current.managedMedia;

  if (mediaFile instanceof File && mediaFile.size > 0) {
    if (!mediaFile.type.startsWith('image/') && !mediaFile.type.startsWith('video/')) {
      return json({ error: 'Fresh Abyss accepts images, animated GIFs, and videos.' }, 400);
    }
    if (mediaFile.size > MAX_MEDIA_BYTES) {
      return json({ error: 'The media file must be 30 MB or smaller.' }, 413);
    }

    const used = new Set();
    const name = uniqueFileName(`fresh-abyss-${Date.now()}-${mediaFile.name || 'media.bin'}`, used);
    const path = `${MEDIA_FOLDER}/${name}`;
    files.push({ path, bytes: new Uint8Array(await mediaFile.arrayBuffer()) });
    media = `/${path}`;
    mediaType = detectMediaType(media, mediaFile.type);

    if (managedMedia && managedMedia !== path) files.push({ path: managedMedia, delete: true });
    managedMedia = path;
  } else if (requestedUrl) {
    media = requestedUrl;
    mediaType = requestedType || detectMediaType(media);
    if (managedMedia && media !== `/${managedMedia}`) files.push({ path: managedMedia, delete: true });
    managedMedia = media.startsWith(`/${MEDIA_FOLDER}/`) ? media.slice(1) : '';
  } else if (requestedType) {
    mediaType = requestedType;
  }

  if (!normalizeMediaSource(media)) {
    return json({ error: 'Choose a media file or enter a valid HTTPS media URL.' }, 400);
  }

  const config = {
    enabled,
    media,
    mediaType,
    managedMedia,
    updatedAt: new Date().toISOString(),
    updatedBy: session.login
  };

  files.push({ path: CONFIG_PATH, text: `${JSON.stringify(config, null, 2)}\n` });
  files.push({ path: PAGE_PATH, text: enabled ? buildEnabledPage(media, mediaType) : buildDisabledPage() });

  const mediaChanged = media !== current.media || mediaType !== current.mediaType;
  const commit = await commitFiles(
    env,
    files,
    `${enabled ? 'Enable' : 'Disable'} Fresh Abyss${mediaChanged ? ' and update media' : ''}`
  );

  return json({ ok: true, config: { ...config, image: media, managedImage: managedMedia }, commit });
}
