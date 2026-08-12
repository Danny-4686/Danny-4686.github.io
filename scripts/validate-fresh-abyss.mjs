import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const failures = [];
const fail = (message) => failures.push(message);

const configPath = resolve(root, 'fresh_abyss/config.json');
const pagePath = resolve(root, 'fresh_abyss/index.html');
const notFoundPath = resolve(root, '404.html');
const managerPath = resolve(root, 'cloudflare-admin/src/fresh-abyss.js');

let config = null;
try {
  config = JSON.parse(readFileSync(configPath, 'utf8'));
} catch (error) {
  fail(`fresh_abyss/config.json is invalid: ${error.message}`);
}

const pageExists = existsSync(pagePath);
if (config) {
  const enabled = config.enabled !== false;
  if (enabled && !pageExists) fail('Fresh Abyss is enabled but fresh_abyss/index.html is missing');
  if (!enabled && pageExists) fail('Fresh Abyss is disabled but fresh_abyss/index.html still exists; disabled routes must fall through to the site 404 page');
}

if (!existsSync(notFoundPath)) {
  fail('404.html is missing');
} else {
  const notFound = readFileSync(notFoundPath, 'utf8');
  for (const token of ['CLOUDLAB · 404', 'Lost in the clouds.', 'Go Home']) {
    if (!notFound.includes(token)) fail(`404.html is missing expected custom 404 token: ${token}`);
  }
}

const manager = readFileSync(managerPath, 'utf8');
for (const token of [
  "files.push({ path: PAGE_PATH, text: buildEnabledPage(media, mediaType) })",
  "files.push({ path: PAGE_PATH, delete: true })",
  "else if (current.enabled)"
]) {
  if (!manager.includes(token)) fail(`Fresh Abyss manager is missing disabled-route safeguard: ${token}`);
}
if (manager.includes('function buildDisabledPage()')) {
  fail('Fresh Abyss manager must not generate a blank disabled page; disabling should remove the route so the custom 404 is served');
}

if (failures.length) {
  console.error(`Fresh Abyss validation failed with ${failures.length} issue(s):\n${failures.map((item) => `- ${item}`).join('\n')}`);
  process.exit(1);
}

console.log('Fresh Abyss validation passed: enabled state matches route presence, and disabled state falls through to the custom 404 page.');
