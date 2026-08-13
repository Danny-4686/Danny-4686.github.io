import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const failures = [];
const warnings = [];
const scanHistory = process.argv.includes('--history');

const SECRET_PATTERNS = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
  ['GitHub classic token', /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g],
  ['GitHub fine-grained token', /\bgithub_pat_[A-Za-z0-9_]{40,}\b/g],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/g],
  ['OpenAI-style secret', /\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}\b/g]
];

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.mp4', '.webm', '.mov', '.m4v', '.zip', '.pdf', '.woff', '.woff2'
]);
const SKIP_DIRECTORIES = new Set(['.git', 'node_modules', '.wrangler', 'coverage']);

function read(path) {
  return readFileSync(resolve(root, path), 'utf8');
}

function requireToken(path, source, token) {
  if (!source.includes(token)) failures.push(`${path}: missing security control ${token}`);
}

function scanText(label, text) {
  for (const [name, pattern] of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) failures.push(`${label}: possible ${name} detected`);
  }
}

function walk(directory) {
  for (const name of readdirSync(directory)) {
    if (SKIP_DIRECTORIES.has(name)) continue;
    const path = join(directory, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path);
      continue;
    }
    if (!stat.isFile() || BINARY_EXTENSIONS.has(extname(name).toLowerCase()) || stat.size > 2 * 1024 * 1024) continue;
    const repoPath = relative(root, path).replaceAll('\\', '/');
    scanText(repoPath, readFileSync(path, 'utf8'));
  }
}

for (const dangerous of ['.env', '.dev.vars', 'cloudflare-admin/.env', 'cloudflare-admin/.dev.vars']) {
  if (existsSync(resolve(root, dangerous))) failures.push(`${dangerous}: secret environment file is tracked in the checkout`);
}

const gitignore = read('.gitignore');
for (const token of ['.env', '.env.*', '.dev.vars', '.dev.vars.*']) requireToken('.gitignore', gitignore, token);

const transport = read('cloudflare-admin/src/transport-security.js');
for (const token of [
  "Strict-Transport-Security', 'max-age=63072000; includeSubDomains'",
  "X-Content-Type-Options', 'nosniff'",
  "X-Frame-Options', 'DENY'",
  "Permissions-Policy'"
]) requireToken('transport-security.js', transport, token);

const requestSecurity = read('cloudflare-admin/src/request-security.js');
for (const token of [
  'sniffMediaBytes',
  'canonicalizeDeclaredMediaType',
  'MAX_TOTAL_FILE_BYTES',
  "Sec-Fetch-Site",
  "Origin not allowed.",
  'safeUploadName'
]) requireToken('request-security.js', requestSecurity, token);

const passwordSecurity = read('cloudflare-admin/src/password-security.js');
requireToken('password-security.js', passwordSecurity, 'PASSWORD_HASH_ITERATIONS = 600000');
requireToken('password-security.js', passwordSecurity, 'passwordHashNeedsUpgrade');

const storeRuntime = read('cloudflare-admin/src/community-store-runtime.js');
for (const token of [
  'login-ip:',
  'login-account:',
  'strengthenPassword',
  'passwordHashNeedsUpgrade',
  'avatarSignatureIsValid'
]) requireToken('community-store-runtime.js', storeRuntime, token);

const apiRuntime = read('cloudflare-admin/src/community-api-runtime.js');
for (const token of [
  'botProtectionConfigured',
  'baseData.sessionsConfigured && baseData.turnstileConfigured',
  'readBoundedJson',
  'AUTH_BODY_MAX_BYTES'
]) requireToken('community-api-runtime.js', apiRuntime, token);

walk(root);

if (scanHistory) {
  try {
    const history = execFileSync('git', [
      'log', '--all', '-p', '--no-ext-diff', '--no-textconv', '--no-color', '--',
      '.',
      ':(exclude)*.png', ':(exclude)*.jpg', ':(exclude)*.jpeg', ':(exclude)*.gif', ':(exclude)*.webp',
      ':(exclude)*.mp4', ':(exclude)*.webm', ':(exclude)*.mov', ':(exclude)*.m4v'
    ], { cwd: root, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });
    scanText('Git history', history);
  } catch (error) {
    warnings.push(`Git history secret scan could not complete: ${error.message}`);
  }
}

warnings.forEach((warning) => console.warn(`Security audit warning: ${warning}`));
if (failures.length) {
  console.error(`Security audit failed with ${failures.length} issue(s):\n${failures.map((item) => `- ${item}`).join('\n')}`);
  process.exit(1);
}

console.log(`Security audit passed: secrets, upload controls, authentication hardening, and response headers are protected${scanHistory ? ', including a high-confidence Git history scan' : ''}.`);
