import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const failures = [];
const warnings = [];

function read(path) {
  return readFileSync(resolve(root, path), 'utf8');
}

function requireToken(source, token, label) {
  if (!source.includes(token)) failures.push(`${label}: missing ${token}`);
}

const pages = read('cloudflare-admin/src/pages.js');
const admin = read('cloudflare-admin/src/admin-script.js');
const worker = read('cloudflare-admin/src/index.js');
const journal = read('journal/journal.js');
const journalCss = read('journal/journal-polish.css');
const journalPage = read('journal/index.html');

requireToken(pages, 'id="descriptionLabel"', 'Admin page');
requireToken(pages, 'expandable full text', 'Admin page');
requireToken(admin, "description.maxLength=isCard?20000:320", 'Admin editor');
requireToken(admin, "descriptionLabel.textContent=isCard?'Post text':'Short description'", 'Admin editor');
requireToken(admin, "isCard?'Read More':'Coming Soon'", 'Admin editor');
requireToken(admin, 'cardSummary(rawDescription)', 'Admin editor');
requireToken(worker, 'MAX_CARD_BODY_CHARS = 20000', 'Journal publisher');
requireToken(worker, 'const body = cardOnly ? cleanMultiline(input.description, MAX_CARD_BODY_CHARS)', 'Journal publisher');
requireToken(worker, 'const description = cardOnly ? buildCardSummary(body)', 'Journal publisher');
requireToken(worker, '...(cardOnly ? { body } : {})', 'Journal publisher');
requireToken(worker, "listing.body || listing.description || ''", 'Journal editor API');
requireToken(journal, "post.body || post.description || ''", 'Journal reader');
requireToken(journal, 'hasExpandedReaderText(card._journalPost)', 'Journal reader');
requireToken(journal, "if (mode === 'article') { open.hidden = false;", 'Journal reader article action');
requireToken(journal, 'else { open.hidden = true; open.removeAttribute(\'href\'); }', 'Journal reader Post Only action');
requireToken(journalCss, '.journal-reader-open[hidden] { display: none !important; }', 'Journal reader hidden action');
requireToken(journal, "${post.body || ''}", 'Journal search');
requireToken(journalPage, 'journal-polish.css?v=20260817.1', 'Journal page styles');
requireToken(journalPage, 'journal.js?v=20260812', 'Journal page');

let posts;
try {
  posts = JSON.parse(read('journal/posts.json'));
} catch (error) {
  failures.push(`journal/posts.json: invalid JSON (${error.message})`);
  posts = [];
}

if (!Array.isArray(posts)) {
  failures.push('journal/posts.json: expected an array');
} else {
  for (const post of posts) {
    if (!post || typeof post !== 'object') continue;
    if (typeof post.description === 'string' && post.description.length > 320) {
      failures.push(`${post.slug || 'unknown post'}: public card description exceeds 320 characters`);
    }
    if (Object.prototype.hasOwnProperty.call(post, 'body')) {
      if (post.mode !== 'card' || post.cardOnly !== true) failures.push(`${post.slug || 'unknown post'}: only Post Only entries may store body text`);
      if (typeof post.body !== 'string' || !post.body.trim()) failures.push(`${post.slug || 'unknown post'}: body must be non-empty text`);
      if (typeof post.body === 'string' && post.body.length > 20000) failures.push(`${post.slug || 'unknown post'}: body exceeds 20,000 characters`);
    } else if (post.mode === 'card' && typeof post.description === 'string' && post.description.length >= 318) {
      warnings.push(`${post.slug || 'unknown post'}: legacy Post Only entry has no full body and may have been created under the old 320-character limit`);
    }
  }
}

warnings.forEach((warning) => console.warn(`Journal validation warning: ${warning}`));
if (failures.length) {
  console.error(`Journal validation failed with ${failures.length} issue(s):\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
  process.exit(1);
}

console.log('Journal validation passed: Post Only full text, generated summaries, reader actions, search, and editor limits are wired correctly.');
