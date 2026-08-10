import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ignored = new Set(['.git', 'node_modules', '.wrangler']);
const failures = [];

function filesUnder(directory, extension) {
  const output = [];
  for (const entry of readdirSync(directory)) {
    if (ignored.has(entry)) continue;
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) output.push(...filesUnder(path, extension));
    else if (!extension || path.endsWith(extension)) output.push(path);
  }
  return output;
}

function fail(path, message) {
  failures.push(`${relative(root, path)}: ${message}`);
}

function localTarget(page, value) {
  const clean = value.split('#')[0].split('?')[0];
  if (!clean || /^(?:[a-z]+:|\/\/|#|mailto:|tel:|data:)/i.test(clean)) return null;
  let target = clean.startsWith('/') ? join(root, clean.slice(1)) : resolve(dirname(page), clean);
  if (clean.endsWith('/')) target = join(target, 'index.html');
  else if (!extname(target) && !existsSync(target)) target = join(target, 'index.html');
  return normalize(target);
}

for (const page of filesUnder(root, '.html')) {
  const html = readFileSync(page, 'utf8');
  const requiredIconTokens = [
    'href="/favicon.ico"',
    'href="/assets/icons/favicon-48x48.png"',
    'href="/assets/icons/favicon-32x32.png"',
    'href="/assets/icons/apple-touch-icon.png"',
    'rel="manifest"'
  ];
  requiredIconTokens.forEach((token) => {
    if (!html.includes(token)) fail(page, `missing favicon token ${token}`);
  });

  const ids = [...html.matchAll(/\sid=["']([^"']+)["']/gi)].map((match) => match[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicates.length) fail(page, `duplicate IDs: ${duplicates.join(', ')}`);

  for (const match of html.matchAll(/\s(?:href|src)=["']([^"']+)["']/gi)) {
    const target = localTarget(page, match[1]);
    if (target && !existsSync(target)) fail(page, `missing local reference ${match[1]}`);
  }

  for (const form of html.matchAll(/<form\b([^>]*)>/gi)) {
    const opening = form[0];
    const start = form.index ?? 0;
    const end = html.indexOf('</form>', start);
    const contents = end >= 0 ? html.slice(start, end) : '';
    if (/type=["']password["']/i.test(contents) && !/\smethod=["']post["']/i.test(opening)) {
      fail(page, 'password form must explicitly use POST');
    }
  }
}

for (const entry of readdirSync(root)) {
  const path = join(root, entry);
  if (statSync(path).isFile() && /\.(?:css|js)$/i.test(entry)) {
    fail(path, 'shared CSS and JavaScript must live under assets/css or assets/js');
  }
}

const deprecatedSharedReference = /["'](?:\/(?:global-header|home-additions|home-mobile-nav|hub|site-loader|site-quality|styles)\.css|\/(?:hub|script|site-loader)\.js|(?:\.\.\/){1,2}hub\.(?:css|js))/;
for (const sourcePath of filesUnder(root).filter((path) => /\.(?:html|js|mjs)$/.test(path))) {
  if (deprecatedSharedReference.test(readFileSync(sourcePath, 'utf8'))) {
    fail(sourcePath, 'uses a deprecated root-level shared asset path');
  }
}

const manifestPath = join(root, 'site.webmanifest');
try {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  for (const icon of manifest.icons || []) {
    const target = localTarget(manifestPath, icon.src || '');
    if (target && !existsSync(target)) fail(manifestPath, `missing manifest icon ${icon.src}`);
  }
} catch (error) {
  fail(manifestPath, `invalid manifest JSON: ${error.message}`);
}

for (const template of [
  join(root, 'cloudflare-admin', 'src', 'admin-login-page.js'),
  join(root, 'cloudflare-admin', 'src', 'pages.js'),
  join(root, 'cloudflare-admin', 'src', 'post-template.js'),
  join(root, 'cloudflare-admin', 'src', 'fresh-abyss.js')
]) {
  const source = readFileSync(template, 'utf8');
  for (const token of ['favicon.ico', 'favicon-48x48.png', 'apple-touch-icon.png']) {
    if (!source.includes(token)) fail(template, `generated pages are missing ${token}`);
  }
}

const postTemplatePath = join(root, 'cloudflare-admin', 'src', 'post-template.js');
const postTemplateSource = readFileSync(postTemplatePath, 'utf8');
for (const token of [
  '/assets/css/site-loader.css',
  '/assets/js/site-loader.js',
  '/assets/css/hub.css',
  '/assets/css/site-quality.css',
  '/assets/js/hub.js'
]) {
  if (!postTemplateSource.includes(token)) fail(postTemplatePath, `generated journal posts are missing ${token}`);
}

for (const page of filesUnder(join(root, 'games'), '.html').filter((path) => dirname(path) !== join(root, 'games'))) {
  const html = readFileSync(page, 'utf8');
  const slug = relative(join(root, 'games'), dirname(page)).replaceAll('\\', '/');
  const canonical = `https://danny4686.com/games/${slug}/`;
  const required = [
    `rel="canonical" href="${canonical}"`,
    'property="og:title"', 'property="og:description"', `property="og:url" content="${canonical}"`,
    'property="og:image"', 'name="twitter:card"', 'name="twitter:title"',
    'rel="manifest"', '/assets/js/site-loader.js?v=', '/assets/css/site-quality.css?v='
  ];
  required.forEach((token) => { if (!html.includes(token)) fail(page, `missing metadata token ${token}`); });
}

const arcadePage = join(root, 'games', 'index.html');
const arcadeHtml = readFileSync(arcadePage, 'utf8');
const arcadeGameIds = [...arcadeHtml.matchAll(/\bdata-game-id="([^"]+)"/g)].map((match) => match[1]);
if (arcadeGameIds.length !== 13) fail(arcadePage, `expected 13 game cards, found ${arcadeGameIds.length}`);
const duplicateGameIds = [...new Set(arcadeGameIds.filter((id, index) => arcadeGameIds.indexOf(id) !== index))];
if (duplicateGameIds.length) fail(arcadePage, `duplicate game IDs: ${duplicateGameIds.join(', ')}`);
for (const gameId of ['cloud-hopper', 'cloudlab-clicker', 'launcher', 'flappy-cloud']) {
  if (!arcadeGameIds.includes(gameId)) fail(arcadePage, `missing arcade card ${gameId}`);
}
for (const token of ['id="featuredGameGrid"', 'id="featuredGameStatus">TOP GAMES', 'arcade-expansion.css?v=', 'games.js?v=20260810']) {
  if (!arcadeHtml.includes(token)) fail(arcadePage, `missing featured arcade token ${token}`);
}
const arcadeScriptPath = join(root, 'games', 'games.js');
const arcadeScript = readFileSync(arcadeScriptPath, 'utf8');
if (!arcadeScript.includes("featuredStatus.textContent = 'TOP GAMES'")) fail(arcadeScriptPath, 'featured games must be labeled Top Games');
if (/ADMIN PICKS|CLOUDLAB PICKS/.test(arcadeScript)) fail(arcadeScriptPath, 'featured games label must not include an admin label or count');

const sitemapPath = join(root, 'sitemap.xml');
const sitemap = readFileSync(sitemapPath, 'utf8');
for (const gameId of arcadeGameIds) {
  const url = `https://danny4686.com/games/${gameId}/`;
  if (!sitemap.includes(`<loc>${url}</loc>`)) fail(sitemapPath, `missing arcade URL ${url}`);
}

const requiredGameControls = new Map([
  ['flappy-cloud', ['id="flappyCanvas"', 'id="startButton"', 'id="pauseButton"', 'id="flappySaveStatus"', 'game.js']],
  ['cloudlab-clicker', ['id="cloudCore"', 'id="buildingList"', 'id="boostList"', 'id="buyModes"', 'id="productionNetwork"', 'id="activeResearch"', 'id="clickerTabs"', 'id="cloudSignIn"', 'id="clickRateStatus"', 'rate-limiter.js?v=1', 'game.js']],
  ['launcher', ['id="launcherCanvas"', 'id="launchButton"', 'id="launcherUpgradeGrid"', 'id="angleButtons"', 'id="phaseLabel"', 'id="launcherToastLayer"', 'id="launcherSaveStatus"', 'game.js']]
]);
for (const [slug, tokens] of requiredGameControls) {
  const path = join(root, 'games', slug, 'index.html');
  const html = readFileSync(path, 'utf8');
  tokens.forEach((token) => { if (!html.includes(token)) fail(path, `missing required game control ${token}`); });
}

const communityClientPath = join(root, 'community', 'community-client.js');
const communityClient = readFileSync(communityClientPath, 'utf8');
for (const token of ["id: 'flappy-cloud'", "id: 'cloudlab-clicker'", "id: 'launcher'", 'loadGameSave', 'saveGameState']) {
  if (!communityClient.includes(token)) fail(communityClientPath, `missing account game integration ${token}`);
}
const clickerScript = readFileSync(join(root, 'games', 'cloudlab-clicker', 'game.js'), 'utf8');
for (const token of [':user:', ':reset-pending', 'persistResetIntent', 'save.reset === true', 'spentProgressValue', 'coreInputLimiter?.attempt', 'event?.isTrusted === false', '10 CPS CAP ACTIVE']) {
  if (!clickerScript.includes(token)) fail(join(root, 'games', 'cloudlab-clicker', 'game.js'), `missing durable account-save safeguard ${token}`);
}
const clickRateLimiterScript = readFileSync(join(root, 'games', 'cloudlab-clicker', 'rate-limiter.js'), 'utf8');
for (const token of ['createRollingLimiter', 'acceptedAt.length >= limit', 'retryAfterMs']) {
  if (!clickRateLimiterScript.includes(token)) fail(join(root, 'games', 'cloudlab-clicker', 'rate-limiter.js'), `missing click-rate limiter safeguard ${token}`);
}
const launcherScript = readFileSync(join(root, 'games', 'launcher', 'game.js'), 'utf8');
if (/flightStartedAt\s*>\s*\d+/.test(launcherScript)) {
  fail(join(root, 'games', 'launcher', 'game.js'), 'Launcher must not end a run before the Earth naturally settles');
}

const settingsPath = join(root, 'site-settings.json');
try {
  const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
  const selected = settings.featuredGames;
  if (!Array.isArray(selected) || selected.length < 1 || selected.length > 6) {
    fail(settingsPath, 'featured games must contain between 1 and 6 entries');
  } else {
    const unknown = selected.filter((id) => !arcadeGameIds.includes(id));
    const duplicate = selected.filter((id, index) => selected.indexOf(id) !== index);
    if (unknown.length) fail(settingsPath, `unknown featured games: ${[...new Set(unknown)].join(', ')}`);
    if (duplicate.length) fail(settingsPath, `duplicate featured games: ${[...new Set(duplicate)].join(', ')}`);
  }
} catch (error) {
  fail(settingsPath, `invalid settings JSON: ${error.message}`);
}

const accountPage = join(root, 'account', 'index.html');
const accountHtml = readFileSync(accountPage, 'utf8');
for (const token of ['name="robots" content="noindex', 'rel="canonical" href="https://danny4686.com/account/"', 'rel="manifest"']) {
  if (!accountHtml.includes(token)) fail(accountPage, `missing private-page metadata token ${token}`);
}

for (const script of filesUnder(root).filter((path) => /\.(?:js|mjs)$/.test(path))) {
  try {
    execFileSync(process.execPath, ['--check', script], { stdio: 'pipe' });
  } catch (error) {
    fail(script, String(error.stderr || error.message).trim());
  }
}

if (failures.length) {
  console.error(`Site validation failed with ${failures.length} issue(s):\n${failures.map((item) => `- ${item}`).join('\n')}`);
  process.exit(1);
}

console.log('Site validation passed: repository layout, favicons, metadata, sitemap, local references, password forms, IDs, manifest, and JavaScript syntax.');
