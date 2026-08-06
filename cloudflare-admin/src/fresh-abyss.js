import { commitFiles, readJsonFile } from './github.js';
import { json, requireEnv, uniqueFileName } from './utils.js';

const CONFIG_PATH = 'fresh_abyss/config.json';
const PAGE_PATH = 'fresh_abyss/index.html';
const MEDIA_FOLDER = 'assets/images/fresh_abyss';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const INITIAL_IMAGE = 'https://cdn.discordapp.com/attachments/1138912646943473785/1534791088831991888/image.png?ex=6a756916&is=6a741796&hm=a6063589806be1833ad1e4431bd4914da9ebdea9c411b98b255aa175f02b47a3&';

const DEFAULT_CONFIG = {
  enabled: true,
  image: INITIAL_IMAGE,
  managedImage: '',
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

function normalizeImageSource(value) {
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
  <style>*{box-sizing:border-box}html,body{width:100%;min-height:100%;margin:0;background:#000}body{min-height:100svh}</style>
</head>
<body aria-hidden="true"></body>
</html>
`;
}

function buildEnabledPage(image) {
  const source = escapeAttr(image);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">
  <meta name="referrer" content="no-referrer">
  <meta name="theme-color" content="#020507">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' https: data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
  <title>Fresh Abyss</title>
  <style>
    :root{color-scheme:dark;--edge:rgba(255,255,255,.13);--glow:rgba(91,175,210,.12)}
    *{box-sizing:border-box}
    html,body{width:100%;min-height:100%;margin:0}
    body{min-height:100svh;display:grid;place-items:center;padding:clamp(12px,3vw,34px);overflow-x:hidden;background:radial-gradient(circle at 50% 42%,var(--glow),transparent 48%),linear-gradient(180deg,#05090c,#010203)}
    .image-frame{width:min(1120px,100%);max-height:calc(100svh - clamp(24px,6vw,68px));display:grid;place-items:center;overflow:hidden;padding:clamp(6px,1vw,11px);border:1px solid var(--edge);border-radius:clamp(15px,2vw,26px);background:rgba(5,10,14,.9);box-shadow:0 28px 80px rgba(0,0,0,.62),inset 0 1px rgba(255,255,255,.055)}
    .image-frame img{display:block;width:auto;max-width:100%;height:auto;max-height:calc(100svh - clamp(38px,8vw,90px));object-fit:contain;border-radius:clamp(10px,1.35vw,18px);user-select:none;-webkit-user-drag:none}
    @media(max-width:600px){body{padding:8px}.image-frame{width:100%;max-height:calc(100svh - 16px);padding:5px;border-radius:15px}.image-frame img{max-height:calc(100svh - 26px);border-radius:11px}}
  </style>
</head>
<body>
  <main class="image-frame" aria-label="Fresh Abyss image">
    <img src="${source}" alt="Fresh Abyss" referrerpolicy="no-referrer" draggable="false">
  </main>
</body>
</html>
`;
}

export async function getFreshAbyssConfig(env) {
  const stored = await readJsonFile(env, CONFIG_PATH, null);
  if (!stored || typeof stored !== 'object') return { ...DEFAULT_CONFIG };
  return {
    enabled: stored.enabled !== false,
    image: normalizeImageSource(stored.image) || INITIAL_IMAGE,
    managedImage: String(stored.managedImage || '').replace(/^\/+/, ''),
    updatedAt: stored.updatedAt || null,
    updatedBy: stored.updatedBy || null
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
  const imageFile = form.get('image');
  const requestedUrl = normalizeImageSource(form.get('imageUrl'));
  const files = [];
  let image = current.image;
  let managedImage = current.managedImage;

  if (imageFile instanceof File && imageFile.size > 0) {
    if (!imageFile.type.startsWith('image/')) {
      return json({ error: 'Fresh Abyss only accepts image files.' }, 400);
    }
    if (imageFile.size > MAX_IMAGE_BYTES) {
      return json({ error: 'The image must be 10 MB or smaller.' }, 413);
    }

    const used = new Set();
    const name = uniqueFileName(`fresh-abyss-${Date.now()}-${imageFile.name || 'image.png'}`, used);
    const path = `${MEDIA_FOLDER}/${name}`;
    files.push({ path, bytes: new Uint8Array(await imageFile.arrayBuffer()) });
    image = `/${path}`;

    if (managedImage && managedImage !== path) files.push({ path: managedImage, delete: true });
    managedImage = path;
  } else if (requestedUrl) {
    image = requestedUrl;
    if (managedImage && image !== `/${managedImage}`) files.push({ path: managedImage, delete: true });
    managedImage = image.startsWith(`/${MEDIA_FOLDER}/`) ? image.slice(1) : '';
  }

  if (!normalizeImageSource(image)) {
    return json({ error: 'Choose an image file or enter a valid HTTPS image URL.' }, 400);
  }

  const config = {
    enabled,
    image,
    managedImage,
    updatedAt: new Date().toISOString(),
    updatedBy: session.login
  };

  files.push({ path: CONFIG_PATH, text: `${JSON.stringify(config, null, 2)}\n` });
  files.push({ path: PAGE_PATH, text: enabled ? buildEnabledPage(image) : buildDisabledPage() });

  const commit = await commitFiles(
    env,
    files,
    `${enabled ? 'Enable' : 'Disable'} Fresh Abyss${image !== current.image ? ' and update image' : ''}`
  );

  return json({ ok: true, config, commit });
}
