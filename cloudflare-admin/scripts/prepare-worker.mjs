import { readFile, writeFile } from 'node:fs/promises';

const target = new URL('../src/community-store.js', import.meta.url);
const unsupported = 'const PBKDF2_ITERATIONS = 240000;';
const supported = 'const PBKDF2_ITERATIONS = 100000;';

const source = await readFile(target, 'utf8');

if (source.includes(supported)) {
  console.log('Cloudflare PBKDF2 compatibility is already prepared.');
  process.exit(0);
}

if (!source.includes(unsupported)) {
  throw new Error('Could not find the expected PBKDF2 iteration setting. Deployment stopped to avoid changing the wrong code.');
}

await writeFile(target, source.replace(unsupported, supported), 'utf8');
console.log('Prepared Cloudflare Worker with PBKDF2 set to 100,000 iterations.');
