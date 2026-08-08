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

for (const page of filesUnder(join(root, 'games'), '.html').filter((path) => dirname(path) !== join(root, 'games'))) {
  const html = readFileSync(page, 'utf8');
  const slug = relative(join(root, 'games'), dirname(page)).replaceAll('\\', '/');
  const canonical = `https://danny4686.com/games/${slug}/`;
  const required = [
    `rel="canonical" href="${canonical}"`,
    'property="og:title"', 'property="og:description"', `property="og:url" content="${canonical}"`,
    'property="og:image"', 'name="twitter:card"', 'name="twitter:title"',
    'rel="manifest"', '/site-loader.js?v=', '/site-quality.css?v='
  ];
  required.forEach((token) => { if (!html.includes(token)) fail(page, `missing metadata token ${token}`); });
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

console.log('Site validation passed: metadata, local references, password forms, IDs, and JavaScript syntax.');
