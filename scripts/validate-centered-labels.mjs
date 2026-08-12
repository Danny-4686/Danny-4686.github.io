import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const failures = [];
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const notFound = read('404.html');
const quality = read('assets/css/site-quality.css');

for (const token of [
  '.eyebrow{width:100%;max-width:none;',
  'text-align:center}',
  'p:not(.eyebrow){max-width:430px;',
  '/assets/css/site-quality.css?v=20260812.2'
]) {
  if (!notFound.includes(token)) failures.push(`404.html is missing centered-label safeguard: ${token}`);
}

if (!quality.includes('p.eyebrow{max-width:none}')) {
  failures.push('site-quality.css must prevent generic paragraph max-width rules from narrowing eyebrow labels site-wide');
}

if (/\n\s*p\{max-width:430px/.test(notFound)) {
  failures.push('404.html must not apply its readable paragraph max-width to the eyebrow label');
}

if (failures.length) {
  console.error(`Centered label validation failed with ${failures.length} issue(s):\n${failures.map((item) => `- ${item}`).join('\n')}`);
  process.exit(1);
}

console.log('Centered label validation passed: the 404 eyebrow stays geometrically centered and the shared corrective layer protects eyebrow labels from generic paragraph widths.');
