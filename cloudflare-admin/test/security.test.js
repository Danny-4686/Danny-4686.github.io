import assert from 'node:assert/strict';
import test from 'node:test';

import { addTransportSecurity, redirectToHttps } from '../src/transport-security.js';
import { ADMIN_CSS, ADMIN_JS } from '../src/admin-assets.js';
import { clearLegacyCookie, cookie } from '../src/community-api.js';
import { hashPassword, verifyPassword } from '../src/community-store.js';
import { parseCookies } from '../src/utils.js';
import {
  DEFAULT_FEATURED_GAMES,
  DEFAULT_PROFILE_IMAGE,
  FEATURED_GAME_IDS,
  isValidFeaturedGameSelection,
  normalizeFeaturedGames,
  normalizeProjects,
  normalizeSiteSettings
} from '../src/worker.js';

test('parseCookies accepts a missing Cookie header', () => {
  assert.deepEqual(parseCookies(null), {});
  assert.deepEqual(parseCookies(undefined), {});
});

test('parseCookies decodes valid values and preserves malformed encoding', () => {
  assert.deepEqual(parseCookies('theme=dark; display=Cloud%20Lab; broken=%E0%A4%A'), {
    theme: 'dark', display: 'Cloud Lab', broken: '%E0%A4%A'
  });
});

test('HTTP requests are permanently redirected to the same HTTPS URL', () => {
  const response = redirectToHttps(new Request('http://admin.danny4686.com/admin?tab=posts'));
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('location'), 'https://admin.danny4686.com/admin?tab=posts');
});

test('HTTPS responses receive an HSTS policy', async () => {
  const response = addTransportSecurity(new Response('ok', { status: 200 }));
  assert.equal(response.headers.get('strict-transport-security'), 'max-age=31536000; includeSubDomains');
  assert.equal(await response.text(), 'ok');
});

test('community sessions use a host-only cookie and clear the legacy domain cookie', () => {
  const current = cookie('signed-token');
  assert.match(current, /^cl_community_session_v2=signed-token;/);
  assert.doesNotMatch(current, /\bDomain=/i);
  assert.match(clearLegacyCookie(), /cl_community_session=;/);
  assert.match(clearLegacyCookie(), /Domain=\.danny4686\.com/i);
  assert.match(clearLegacyCookie(), /Max-Age=0/i);
});

test('password hashes carry their work factor and legacy hashes remain valid', async () => {
  const value = await hashPassword('CloudLab-Test-Password-123!');
  assert.match(value.hash, /^pbkdf2-sha256\$100000\$/);
  assert.equal(await verifyPassword('CloudLab-Test-Password-123!', value.salt, value.hash), true);
  assert.equal(await verifyPassword('wrong-password', value.salt, value.hash), false);
  const legacyDigest = value.hash.split('$')[2];
  assert.equal(await verifyPassword('CloudLab-Test-Password-123!', value.salt, legacyDigest), true);
});

test('featured games are unique, known, ordered, and limited to six', () => {
  const selected = normalizeFeaturedGames(['launcher','cloud-hopper','launcher','not-a-game','cloudlab-clicker','snake','pong','2048','breakout']);
  assert.deepEqual(selected, ['launcher', 'cloud-hopper', 'cloudlab-clicker', 'snake', 'pong', '2048']);
  assert.equal(selected.length, 6);
  selected.forEach((gameId) => assert.ok(FEATURED_GAME_IDS.includes(gameId)));
  assert.equal(isValidFeaturedGameSelection(['launcher', 'cloud-hopper']), true);
  assert.equal(isValidFeaturedGameSelection([]), false);
  assert.equal(isValidFeaturedGameSelection(['launcher', 'launcher']), false);
  assert.equal(isValidFeaturedGameSelection(['unknown-game']), false);
  assert.equal(isValidFeaturedGameSelection(FEATURED_GAME_IDS.slice(0, 7)), false);
});

test('legacy or empty site settings receive safe defaults including profile artwork', () => {
  assert.deepEqual(normalizeFeaturedGames([]), [...DEFAULT_FEATURED_GAMES]);
  assert.deepEqual(normalizeFeaturedGames(null), [...DEFAULT_FEATURED_GAMES]);
  assert.deepEqual(normalizeSiteSettings({ forceSiteIntro: true }), {
    forceSiteIntro: true,
    featuredGames: [...DEFAULT_FEATURED_GAMES],
    profileImage: DEFAULT_PROFILE_IMAGE,
    updatedAt: '',
    updatedBy: ''
  });
  assert.equal(normalizeSiteSettings({ profileImage: 'javascript:alert(1)' }).profileImage, DEFAULT_PROFILE_IMAGE);
  assert.equal(normalizeSiteSettings({ profileImage: '/assets/images/profile-managed/new.webp' }).profileImage, '/assets/images/profile-managed/new.webp');
});

test('project normalization keeps safe presentation controls and rejects unsafe URLs', () => {
  const projects = normalizeProjects([
    { id:'cloudlab', title:'CloudLab', description:'Community project', url:'https://discord.com/invite/CloudLab', image:'/assets/images/optimized/cloudlab-logo-256.webp', accent:'gold', layout:'media-top', fit:'contain' },
    { id:'unsafe', title:'Unsafe link', description:'This should not preserve a script URL.', url:'javascript:alert(1)', image:'../../secret.png' },
    { id:'cloudlab', title:'Duplicate', description:'Duplicate ids are discarded.' }
  ]);
  assert.equal(projects.length, 2);
  assert.equal(projects[0].url, 'https://discord.com/invite/CloudLab');
  assert.equal(projects[0].image, '/assets/images/optimized/cloudlab-logo-256.webp');
  assert.equal(projects[0].accent, 'gold');
  assert.equal(projects[1].url, '');
  assert.equal(projects[1].image, '');
});

test('assembled admin JavaScript parses and contains Settings, profile artwork, and Projects controls', () => {
  assert.doesNotThrow(() => new Function(ADMIN_JS));
  assert.match(ADMIN_JS, /<strong>Settings<\/strong>/);
  assert.match(ADMIN_JS, /Save featured games/);
  assert.match(ADMIN_JS, /Profile Artwork/);
  assert.match(ADMIN_JS, /<strong>Projects<\/strong>/);
  assert.match(ADMIN_JS, /Save project/);
});

test('assembled admin CSS ends with responsive text and tab corrections', () => {
  const correction = ADMIN_CSS.lastIndexOf('Final corrective layer');
  const projects = ADMIN_CSS.lastIndexOf('.projects-manager{');
  assert.ok(correction > projects, 'responsive correction layer must load after section styles');
  assert.match(ADMIN_CSS.slice(correction), /repeat\(auto-fit,minmax\(240px,1fr\)\)/);
  assert.match(ADMIN_CSS.slice(correction), /\.project-option>span/);
  assert.match(ADMIN_CSS.slice(correction), /\.profile-art-drop>span/);
  assert.match(ADMIN_CSS.slice(correction), /@media\(max-width:620px\)/);
});
