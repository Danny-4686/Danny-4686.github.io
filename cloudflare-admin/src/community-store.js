const GAME_RULES = Object.freeze({
  snake: { label: 'Snake', direction: 'desc', unit: 'points', min: 0, max: 1000000 },
  '2048': { label: '2048', direction: 'desc', unit: 'points', min: 0, max: 1000000000 },
  'memory-match': { label: 'Memory Match', direction: 'memory', unit: 'moves', min: 1, max: 100000 },
  pong: { label: 'Pong', direction: 'desc', unit: 'rally', min: 0, max: 1000000 },
  'tic-tac-toe': { label: 'Tic-Tac-Toe', direction: 'desc', unit: 'wins', min: 0, max: 1000000 },
  minesweeper: { label: 'Minesweeper', direction: 'asc', unit: 'seconds', min: 1, max: 86400 },
  breakout: { label: 'Breakout', direction: 'desc', unit: 'points', min: 0, max: 1000000000 },
  'connect-four': { label: 'Connect Four', direction: 'desc', unit: 'wins', min: 0, max: 1000000 },
  'cloud-hopper': { label: 'Cloud Hopper', direction: 'desc', unit: 'points', min: 0, max: 1000000000 },
  'tower-stacker': { label: 'Tower Stacker', direction: 'desc', unit: 'height', min: 0, max: 1000000 },
  'flappy-cloud': { label: 'Flappy Cloud', direction: 'desc', unit: 'points', min: 0, max: 1000000 },
  'cloudlab-clicker': { label: 'CloudLab Clicker', direction: 'desc', unit: 'clouds', min: 0, max: Number.MAX_SAFE_INTEGER },
  launcher: { label: 'Launcher', direction: 'desc', unit: 'distance', min: 0, max: 1000000000 }
});

const GAME_SAVE_SCHEMA_VERSION = 1;
const GAME_SAVE_IDS = Object.freeze(['flappy-cloud', 'cloudlab-clicker', 'launcher']);
const GAME_SAVE_ID_SET = new Set(GAME_SAVE_IDS);
const CLICKER_BUILDING_IDS = Object.freeze(['drone', 'farm', 'station', 'factory', 'bank', 'portal', 'foundry']);
const CLICKER_BOOST_IDS = Object.freeze(['tap-array', 'static-charge', 'drone-sync', 'weather-ai', 'golden-core', 'quantum-network']);
const CLICKER_ACHIEVEMENT_IDS = Object.freeze(['first-front', 'sky-builder', 'cloud-city', 'weather-legend']);
const LAUNCHER_LEVEL_LIMITS = Object.freeze({ power: 10, bounce: 10, aero: 10, boost: 8, magnet: 10 });
const MAX_GAME_SAVE_NUMBER = Number.MAX_SAFE_INTEGER;

const RESERVED_NAMES = new Set([
  'admin', 'administrator', 'cloudlab', 'cloudlabstudio', 'danny', 'danny4686', 'daniel',
  'moderator', 'mod', 'staff', 'owner', 'system', 'support', 'official', 'developer',
  'root', 'api', 'null', 'undefined', 'everyone', 'here'
]);

const BLOCKED_EXACT = new Set([
  'fuck', 'fucker', 'fucking', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'whore',
  'slut', 'retard', 'retarded', 'nazi', 'hitler', 'kkk', 'rape', 'rapist',
  'nigger', 'nigga', 'faggot', 'fag', 'tranny', 'chink', 'spic', 'kike', 'wetback'
]);

const BLOCKED_CONTAINS = [
  'nigger', 'nigga', 'faggot', 'retard', 'tranny', 'chink', 'wetback', 'whitepower',
  'heilhitler', 'killall', 'rapist', 'childporn', 'pedophile', 'paedophile'
];

// Existing production accounts were created with 100,000 iterations. New hashes
// include their work factor so a future upgrade does not invalidate old logins.
const PBKDF2_ITERATIONS = 100000;
const LEGACY_PBKDF2_ITERATIONS = 100000;
const DAY_MS = 24 * 60 * 60 * 1000;
const FIRST_USERNAME_LOCK_MS = 7 * DAY_MS;
const USERNAME_CHANGE_COOLDOWN_MS = 30 * DAY_MS;
const OLD_USERNAME_RESERVATION_MS = 7 * DAY_MS;
const MAX_AVATAR_BYTES = 180000;
const encoder = new TextEncoder();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function toBase64(bytes) {
  let binary = '';
  const value = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let index = 0; index < value.length; index += 1) binary += String.fromCharCode(value[index]);
  return btoa(binary);
}

function fromBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function normalizeUsername(value) {
  return String(value || '').normalize('NFKC').trim();
}

function moderationKey(value) {
  return normalizeUsername(value)
    .toLowerCase()
    .replace(/[0]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[4@]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/[7+]/g, 't')
    .replace(/[8]/g, 'b')
    .replace(/[^a-z0-9]/g, '');
}

function validateUsername(value) {
  const username = normalizeUsername(value);
  if (username.length < 3 || username.length > 20) {
    return { error: 'Your username must be between 3 and 20 characters.' };
  }
  if (!/^[A-Za-z0-9_]+$/.test(username)) {
    return { error: 'Use only letters, numbers, and underscores in your username.' };
  }
  if (/^_|_$|__/.test(username)) {
    return { error: 'Usernames cannot start or end with an underscore or contain double underscores.' };
  }

  const key = moderationKey(username);
  if (!key || RESERVED_NAMES.has(key)) {
    return { error: 'That username is reserved. Please choose another one.' };
  }
  if (BLOCKED_EXACT.has(key) || BLOCKED_CONTAINS.some((term) => key.includes(term))) {
    return { error: 'That username is not allowed. Please choose something friendly.' };
  }
  return { username, key: username.toLowerCase() };
}

function validatePassword(value) {
  const password = String(value || '');
  if (password.length < 10 || password.length > 128) {
    return 'Use a password between 10 and 128 characters.';
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Your password needs at least one letter and one number.';
  }
  return '';
}

function validateAvatarData(value) {
  const data = String(value || '');
  if (!data) return { data: '', mime: '', bytes: new Uint8Array(0) };
  const match = data.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return { error: 'Use a PNG, JPG, or WebP image.' };

  try {
    const bytes = fromBase64(match[2]);
    if (bytes.length < 24) return { error: 'That profile picture is not a valid image.' };
    if (bytes.length > MAX_AVATAR_BYTES) {
      return { error: 'That profile picture is too large. Please choose a smaller image.' };
    }
    const mime = match[1] === 'jpeg' ? 'image/jpeg' : `image/${match[1]}`;
    return { data: `data:${mime};base64,${match[2]}`, mime, bytes };
  } catch {
    return { error: 'That profile picture could not be read.' };
  }
}

async function derivePasswordHash(password, saltBytes, iterations) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations },
    key,
    256
  );
  return toBase64(new Uint8Array(bits));
}

async function hashPassword(password, saltBytes = crypto.getRandomValues(new Uint8Array(16))) {
  const digest = await derivePasswordHash(password, saltBytes, PBKDF2_ITERATIONS);
  return {
    salt: toBase64(saltBytes),
    hash: `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${digest}`
  };
}

async function verifyPassword(password, salt, expectedHash) {
  try {
    const encoded = String(expectedHash || '');
    const versioned = encoded.match(/^pbkdf2-sha256\$(\d+)\$(.+)$/);
    const iterations = versioned ? Number(versioned[1]) : LEGACY_PBKDF2_ITERATIONS;
    if (!Number.isSafeInteger(iterations) || iterations < 10000 || iterations > 1000000) return false;
    const expectedDigest = versioned ? versioned[2] : encoded;
    const actualDigest = await derivePasswordHash(password, fromBase64(salt), iterations);
    const first = fromBase64(actualDigest);
    const second = fromBase64(expectedDigest);
    if (first.length !== second.length) return false;
    let difference = 0;
    for (let index = 0; index < first.length; index += 1) difference |= first[index] ^ second[index];
    return difference === 0;
  } catch {
    return false;
  }
}

function cleanExtra(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const output = {};
  Object.entries(value).slice(0, 10).forEach(([key, item]) => {
    const cleanKey = String(key).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
    if (!cleanKey) return;
    if (typeof item === 'number' && Number.isFinite(item)) output[cleanKey] = Math.trunc(item);
    else if (typeof item === 'string') output[cleanKey] = item.slice(0, 120);
    else if (typeof item === 'boolean') output[cleanKey] = item;
  });
  return output;
}

function cleanSlug(value) {
  const slug = String(value || '').trim().toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 90 ? slug : '';
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value, keys) {
  if (!isRecord(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function cleanGameNumber(value, { integer = false, max = MAX_GAME_SAVE_NUMBER } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) return null;
  if (integer && !Number.isSafeInteger(value)) return null;
  // Fractional Clicker production is kept without allowing ever-growing JSON precision.
  return integer ? value : Math.round(value * 1000000) / 1000000;
}

function cleanKnownIdList(value, allowedIds) {
  if (!Array.isArray(value) || value.length > allowedIds.length) return null;
  const allowed = new Set(allowedIds);
  const output = [];
  for (const item of value) {
    if (typeof item !== 'string' || !allowed.has(item) || output.includes(item)) return null;
    output.push(item);
  }
  return output;
}

function validateClickerSave(value) {
  if (!hasExactKeys(value, ['clouds', 'total', 'clicks', 'counts', 'boosts', 'achievements'])) {
    return { error: 'CloudLab Clicker save data has an invalid shape.' };
  }
  if (!hasExactKeys(value.counts, CLICKER_BUILDING_IDS)) {
    return { error: 'CloudLab Clicker building data is invalid.' };
  }

  const clouds = cleanGameNumber(value.clouds);
  const total = cleanGameNumber(value.total);
  const clicks = cleanGameNumber(value.clicks, { integer: true, max: 1000000000000 });
  if (clouds === null || total === null || clicks === null || clouds > total) {
    return { error: 'CloudLab Clicker progress contains an invalid number.' };
  }

  const counts = {};
  for (const id of CLICKER_BUILDING_IDS) {
    const count = cleanGameNumber(value.counts[id], { integer: true, max: 1000000000 });
    if (count === null) return { error: 'CloudLab Clicker building data contains an invalid number.' };
    counts[id] = count;
  }

  const boosts = cleanKnownIdList(value.boosts, CLICKER_BOOST_IDS);
  const achievements = cleanKnownIdList(value.achievements, CLICKER_ACHIEVEMENT_IDS);
  if (!boosts || !achievements) return { error: 'CloudLab Clicker unlock data is invalid.' };
  return { state: { clouds, total, clicks, counts, boosts, achievements } };
}

function validateLauncherSave(value) {
  if (!hasExactKeys(value, ['credits', 'best', 'levels']) || !hasExactKeys(value.levels, Object.keys(LAUNCHER_LEVEL_LIMITS))) {
    return { error: 'Launcher save data has an invalid shape.' };
  }

  const credits = cleanGameNumber(value.credits, { integer: true });
  const best = cleanGameNumber(value.best, { integer: true, max: GAME_RULES.launcher.max });
  if (credits === null || best === null) return { error: 'Launcher progress contains an invalid number.' };

  const levels = {};
  for (const [id, max] of Object.entries(LAUNCHER_LEVEL_LIMITS)) {
    const level = cleanGameNumber(value.levels[id], { integer: true, max });
    if (level === null) return { error: 'Launcher upgrade data contains an invalid level.' };
    levels[id] = level;
  }
  return { state: { credits, best, levels } };
}

function validateFlappyCloudSave(value) {
  if (!hasExactKeys(value, ['best'])) return { error: 'Flappy Cloud save data has an invalid shape.' };
  const best = cleanGameNumber(value.best, { integer: true, max: GAME_RULES['flappy-cloud'].max });
  if (best === null) return { error: 'Flappy Cloud progress contains an invalid number.' };
  return { state: { best } };
}

function validateGameSaveState(gameIdValue, value) {
  const gameId = String(gameIdValue || '').trim().toLowerCase();
  if (!GAME_SAVE_ID_SET.has(gameId)) return { error: 'This game does not support account saves.' };
  if (gameId === 'cloudlab-clicker') return validateClickerSave(value);
  if (gameId === 'launcher') return validateLauncherSave(value);
  return validateFlappyCloudSave(value);
}

function isBlankGameSave(gameId, state) {
  if (gameId === 'cloudlab-clicker') {
    return state.clouds === 0
      && state.total === 0
      && state.clicks === 0
      && Object.values(state.counts).every((count) => count === 0)
      && state.boosts.length === 0
      && state.achievements.length === 0;
  }
  if (gameId === 'flappy-cloud') return state.best === 0;
  return state.credits === 0
    && state.best === 0
    && Object.values(state.levels).every((level) => level === 0);
}

function publicUser(row) {
  if (!row) return null;
  const createdAt = Number(row.created_at || 0);
  const usernameChangedAt = Number(row.username_changed_at || 0) || null;
  const nextUsernameChangeAt = usernameChangedAt
    ? usernameChangedAt + USERNAME_CHANGE_COOLDOWN_MS
    : createdAt + FIRST_USERNAME_LOCK_MS;

  return {
    id: row.id,
    username: row.username,
    createdAt,
    avatarUpdatedAt: Number(row.avatar_updated_at || 0) || null,
    usernameChangedAt,
    nextUsernameChangeAt,
    canChangeUsername: Date.now() >= nextUsernameChangeAt
  };
}

export class CommunityStore {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.sql = ctx.storage.sql;
    ctx.blockConcurrencyWhile(async () => {
      this.sql.exec(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL COLLATE NOCASE,
          username_key TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          password_salt TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'active'
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username COLLATE NOCASE);
        CREATE TABLE IF NOT EXISTS scores (
          user_id TEXT NOT NULL,
          game_id TEXT NOT NULL,
          value INTEGER NOT NULL,
          secondary_value INTEGER,
          extra_json TEXT NOT NULL DEFAULT '{}',
          updated_at INTEGER NOT NULL,
          PRIMARY KEY (user_id, game_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_scores_game_value ON scores(game_id, value, secondary_value, updated_at);
        CREATE TABLE IF NOT EXISTS game_saves (
          user_id TEXT NOT NULL,
          game_id TEXT NOT NULL,
          state_json TEXT NOT NULL,
          schema_version INTEGER NOT NULL,
          version INTEGER NOT NULL,
          reset_marker INTEGER NOT NULL DEFAULT 0,
          updated_at INTEGER NOT NULL,
          PRIMARY KEY (user_id, game_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_game_saves_updated ON game_saves(user_id, updated_at);
        CREATE TABLE IF NOT EXISTS likes (
          user_id TEXT NOT NULL,
          post_slug TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          PRIMARY KEY (user_id, post_slug),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_slug, created_at);
        CREATE TABLE IF NOT EXISTS rate_limits (
          rate_key TEXT PRIMARY KEY,
          attempts INTEGER NOT NULL,
          window_started INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS username_reservations (
          username_key TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          reserved_until INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_username_reservations_until ON username_reservations(reserved_until);
      `);

      const userColumns = new Set(
        this.sql.exec('PRAGMA table_info(users)').toArray().map((column) => String(column.name))
      );
      if (!userColumns.has('avatar_data')) this.sql.exec('ALTER TABLE users ADD COLUMN avatar_data TEXT');
      if (!userColumns.has('avatar_updated_at')) this.sql.exec('ALTER TABLE users ADD COLUMN avatar_updated_at INTEGER');
      if (!userColumns.has('username_changed_at')) this.sql.exec('ALTER TABLE users ADD COLUMN username_changed_at INTEGER');
    });
  }

  async fetch(request) {
    try {
      const url = new URL(request.url);
      const method = request.method.toUpperCase();
      const body = method === 'GET' ? {} : await request.json().catch(() => ({}));

      if (url.pathname === '/username' && method === 'GET') return this.usernameAvailability(url.searchParams.get('name'));
      if (url.pathname === '/signup' && method === 'POST') return this.signup(body);
      if (url.pathname === '/login' && method === 'POST') return this.login(body);
      if (url.pathname === '/user' && method === 'GET') return this.getUser(url.searchParams.get('id'));
      if (url.pathname === '/avatar' && method === 'GET') return this.getAvatar(url.searchParams.get('id'));
      if (url.pathname === '/avatar' && method === 'POST') return this.saveAvatar(body);
      if (url.pathname === '/username-change' && method === 'POST') return this.changeUsername(body);
      if (url.pathname === '/records' && method === 'GET') return this.records(url.searchParams.get('userId'));
      if (url.pathname === '/game-save' && method === 'GET') {
        return this.gameSave(url.searchParams.get('userId'), url.searchParams.get('gameId'));
      }
      if (url.pathname === '/game-save' && method === 'POST') return this.saveGame(body);
      if (url.pathname === '/score' && method === 'POST') return this.saveScore(body);
      if (url.pathname === '/leaderboard' && method === 'GET') {
        return this.leaderboard(url.searchParams.get('gameId'), url.searchParams.get('limit'));
      }
      if (url.pathname === '/like' && method === 'GET') {
        return this.likeStatus(url.searchParams.get('slug'), url.searchParams.get('userId'));
      }
      if (url.pathname === '/like' && method === 'POST') return this.toggleLike(body);
      return json({ error: 'Community storage route not found.' }, 404);
    } catch (error) {
      console.error('CommunityStore error', error);
      return json({ error: 'The community service could not complete that request.' }, 500);
    }
  }

  consumeRateLimit(key, limit, windowSeconds) {
    const now = Math.floor(Date.now() / 1000);
    const row = this.sql.exec(
      'SELECT attempts, window_started FROM rate_limits WHERE rate_key = ?',
      key
    ).toArray()[0];

    if (!row || now - row.window_started >= windowSeconds) {
      this.sql.exec(
        'INSERT INTO rate_limits(rate_key, attempts, window_started) VALUES(?, 1, ?) ON CONFLICT(rate_key) DO UPDATE SET attempts = 1, window_started = excluded.window_started',
        key,
        now
      );
      return true;
    }

    if (row.attempts >= limit) return false;
    this.sql.exec('UPDATE rate_limits SET attempts = attempts + 1 WHERE rate_key = ?', key);
    return true;
  }

  clearExpiredReservations() {
    this.sql.exec('DELETE FROM username_reservations WHERE reserved_until <= ?', Date.now());
  }

  usernameAvailability(value) {
    const checked = validateUsername(value);
    if (checked.error) return json({ available: false, error: checked.error });
    this.clearExpiredReservations();

    const existing = this.sql.exec('SELECT id FROM users WHERE username_key = ?', checked.key).toArray()[0];
    if (existing) return json({ available: false, error: 'That username is already taken.' });

    const reservation = this.sql.exec(
      'SELECT reserved_until FROM username_reservations WHERE username_key = ? AND reserved_until > ?',
      checked.key,
      Date.now()
    ).toArray()[0];
    if (reservation) {
      return json({
        available: false,
        error: 'That username is temporarily reserved. Please choose another one.',
        reservedUntil: reservation.reserved_until
      });
    }

    return json({ available: true, username: checked.username });
  }

  async signup(body) {
    const ipKey = String(body.ip || 'unknown').slice(0, 96);
    if (!this.consumeRateLimit(`signup:${ipKey}`, 5, 3600)) {
      return json({ error: 'Too many account attempts from this connection. Please try again later.' }, 429);
    }

    const checked = validateUsername(body.username);
    if (checked.error) return json({ error: checked.error }, 400);
    const passwordError = validatePassword(body.password);
    if (passwordError) return json({ error: passwordError }, 400);

    this.clearExpiredReservations();
    const existing = this.sql.exec('SELECT id FROM users WHERE username_key = ?', checked.key).toArray()[0];
    if (existing) return json({ error: 'That username is already taken.' }, 409);
    const reservation = this.sql.exec(
      'SELECT user_id FROM username_reservations WHERE username_key = ? AND reserved_until > ?',
      checked.key,
      Date.now()
    ).toArray()[0];
    if (reservation) return json({ error: 'That username is temporarily reserved.' }, 409);

    const password = await hashPassword(String(body.password));
    const user = {
      id: crypto.randomUUID(),
      username: checked.username,
      created_at: Date.now(),
      avatar_updated_at: null,
      username_changed_at: null
    };

    try {
      this.sql.exec(
        'INSERT INTO users(id, username, username_key, password_hash, password_salt, created_at, status, avatar_data, avatar_updated_at, username_changed_at) VALUES(?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)',
        user.id,
        user.username,
        checked.key,
        password.hash,
        password.salt,
        user.created_at,
        'active'
      );
    } catch (error) {
      if (String(error).toLowerCase().includes('unique')) return json({ error: 'That username is already taken.' }, 409);
      throw error;
    }

    return json({ ok: true, user: publicUser(user) }, 201);
  }

  async login(body) {
    const checked = validateUsername(body.username);
    if (checked.error) return json({ error: 'The username or password is incorrect.' }, 401);

    const ipKey = String(body.ip || 'unknown').slice(0, 96);
    const rateKey = `login:${ipKey}:${checked.key}`;
    if (!this.consumeRateLimit(rateKey, 12, 900)) {
      return json({ error: 'Too many sign-in attempts. Please wait a few minutes and try again.' }, 429);
    }

    const user = this.sql.exec(
      'SELECT id, username, password_hash, password_salt, created_at, status, avatar_updated_at, username_changed_at FROM users WHERE username_key = ?',
      checked.key
    ).toArray()[0];

    if (!user || user.status !== 'active' || !(await verifyPassword(String(body.password || ''), user.password_salt, user.password_hash))) {
      return json({ error: 'The username or password is incorrect.' }, 401);
    }

    this.sql.exec('DELETE FROM rate_limits WHERE rate_key = ?', rateKey);
    return json({ ok: true, user: publicUser(user) });
  }

  getUser(id) {
    const userId = String(id || '').slice(0, 80);
    if (!userId) return json({ user: null });
    const user = this.sql.exec(
      'SELECT id, username, created_at, avatar_updated_at, username_changed_at FROM users WHERE id = ? AND status = ?',
      userId,
      'active'
    ).toArray()[0];
    return json({ user: publicUser(user) });
  }

  getAvatar(id) {
    const userId = String(id || '').slice(0, 80);
    if (!userId) return new Response(null, { status: 404 });
    const user = this.sql.exec(
      'SELECT avatar_data, avatar_updated_at FROM users WHERE id = ? AND status = ?',
      userId,
      'active'
    ).toArray()[0];
    if (!user?.avatar_data) return new Response(null, { status: 404 });

    const avatar = validateAvatarData(user.avatar_data);
    if (avatar.error || !avatar.data) return new Response(null, { status: 404 });
    return new Response(avatar.bytes, {
      status: 200,
      headers: {
        'Content-Type': avatar.mime,
        'Content-Length': String(avatar.bytes.length),
        'Cache-Control': 'public, max-age=86400, immutable',
        'X-Content-Type-Options': 'nosniff',
        ETag: `"avatar-${user.avatar_updated_at || 0}"`
      }
    });
  }

  saveAvatar(body) {
    const userId = String(body.userId || '').slice(0, 80);
    if (!userId) return json({ error: 'Account not found.' }, 404);
    if (!this.consumeRateLimit(`avatar:${userId}`, 20, 86400)) {
      return json({ error: 'Too many profile picture changes. Please try again tomorrow.' }, 429);
    }

    const avatar = validateAvatarData(body.avatarData);
    if (avatar.error) return json({ error: avatar.error }, 400);
    const existing = this.sql.exec('SELECT id FROM users WHERE id = ? AND status = ?', userId, 'active').toArray()[0];
    if (!existing) return json({ error: 'Account not found.' }, 404);

    const updatedAt = avatar.data ? Date.now() : null;
    this.sql.exec(
      'UPDATE users SET avatar_data = ?, avatar_updated_at = ? WHERE id = ?',
      avatar.data || null,
      updatedAt,
      userId
    );
    const user = this.sql.exec(
      'SELECT id, username, created_at, avatar_updated_at, username_changed_at FROM users WHERE id = ?',
      userId
    ).toArray()[0];
    return json({ ok: true, user: publicUser(user) });
  }

  async changeUsername(body) {
    const userId = String(body.userId || '').slice(0, 80);
    if (!userId) return json({ error: 'Account not found.' }, 404);
    if (!this.consumeRateLimit(`username-change:${userId}`, 5, 86400)) {
      return json({ error: 'Too many username attempts. Please try again later.' }, 429);
    }

    const checked = validateUsername(body.username);
    if (checked.error) return json({ error: checked.error }, 400);
    const user = this.sql.exec(
      'SELECT id, username, username_key, password_hash, password_salt, created_at, status, avatar_updated_at, username_changed_at FROM users WHERE id = ?',
      userId
    ).toArray()[0];
    if (!user || user.status !== 'active') return json({ error: 'Account not found.' }, 404);
    if (!(await verifyPassword(String(body.password || ''), user.password_salt, user.password_hash))) {
      return json({ error: 'Enter your current password to change your username.' }, 401);
    }
    if (checked.key === String(user.username_key).toLowerCase()) {
      return json({ error: 'Choose a username different from your current one.' }, 400);
    }

    const now = Date.now();
    const firstAllowedAt = Number(user.created_at) + FIRST_USERNAME_LOCK_MS;
    const nextAllowedAt = user.username_changed_at
      ? Number(user.username_changed_at) + USERNAME_CHANGE_COOLDOWN_MS
      : firstAllowedAt;
    if (now < nextAllowedAt) {
      return json({
        error: user.username_changed_at
          ? 'Your username can only be changed once every 30 days.'
          : 'New accounts must wait 7 days before changing their username.',
        nextUsernameChangeAt: nextAllowedAt
      }, 409);
    }

    this.clearExpiredReservations();
    const existing = this.sql.exec('SELECT id FROM users WHERE username_key = ?', checked.key).toArray()[0];
    if (existing) return json({ error: 'That username is already taken.' }, 409);
    const reservation = this.sql.exec(
      'SELECT user_id, reserved_until FROM username_reservations WHERE username_key = ? AND reserved_until > ?',
      checked.key,
      now
    ).toArray()[0];
    if (reservation && reservation.user_id !== userId) {
      return json({ error: 'That username is temporarily reserved.', reservedUntil: reservation.reserved_until }, 409);
    }

    try {
      this.sql.exec('BEGIN IMMEDIATE');
      this.sql.exec(
        'INSERT INTO username_reservations(username_key, user_id, reserved_until) VALUES(?, ?, ?) ON CONFLICT(username_key) DO UPDATE SET user_id = excluded.user_id, reserved_until = excluded.reserved_until',
        user.username_key,
        userId,
        now + OLD_USERNAME_RESERVATION_MS
      );
      this.sql.exec('DELETE FROM username_reservations WHERE username_key = ? AND user_id = ?', checked.key, userId);
      this.sql.exec(
        'UPDATE users SET username = ?, username_key = ?, username_changed_at = ? WHERE id = ?',
        checked.username,
        checked.key,
        now,
        userId
      );
      this.sql.exec('COMMIT');
    } catch (error) {
      try { this.sql.exec('ROLLBACK'); } catch (_) {}
      if (String(error).toLowerCase().includes('unique')) return json({ error: 'That username is already taken.' }, 409);
      throw error;
    }

    const updated = this.sql.exec(
      'SELECT id, username, created_at, avatar_updated_at, username_changed_at FROM users WHERE id = ?',
      userId
    ).toArray()[0];
    return json({ ok: true, user: publicUser(updated), previousUsernameReservedUntil: now + OLD_USERNAME_RESERVATION_MS });
  }

  records(userIdValue) {
    const userId = String(userIdValue || '').slice(0, 80);
    const rows = this.sql.exec(
      'SELECT game_id, value, secondary_value, extra_json, updated_at FROM scores WHERE user_id = ? ORDER BY updated_at DESC',
      userId
    ).toArray();

    return json({
      records: rows.map((row) => ({
        gameId: row.game_id,
        value: row.value,
        secondary: row.secondary_value,
        extra: JSON.parse(row.extra_json || '{}'),
        updatedAt: row.updated_at,
        rule: GAME_RULES[row.game_id] || null
      }))
    });
  }

  gameSave(userIdValue, gameIdValue) {
    const userId = String(userIdValue || '').slice(0, 80);
    const gameId = String(gameIdValue || '').trim().toLowerCase();
    if (!userId || !GAME_SAVE_ID_SET.has(gameId)) {
      return json({ error: 'This game does not support account saves.' }, 400);
    }

    const user = this.sql.exec('SELECT id FROM users WHERE id = ? AND status = ?', userId, 'active').toArray()[0];
    if (!user) return json({ error: 'Account not found.' }, 404);
    const row = this.sql.exec(
      'SELECT state_json, schema_version, version, reset_marker, updated_at FROM game_saves WHERE user_id = ? AND game_id = ?',
      userId,
      gameId
    ).toArray()[0];
    if (!row) return json({ gameId, save: null, schemaVersion: GAME_SAVE_SCHEMA_VERSION });

    let parsed;
    try { parsed = JSON.parse(row.state_json); } catch { return json({ error: 'Saved game data could not be read.' }, 500); }
    const checked = validateGameSaveState(gameId, parsed);
    if (checked.error || Number(row.schema_version) !== GAME_SAVE_SCHEMA_VERSION) {
      return json({ error: 'Saved game data uses an unsupported format.' }, 500);
    }
    return json({
      gameId,
      save: {
        state: checked.state,
        schemaVersion: GAME_SAVE_SCHEMA_VERSION,
        version: Number(row.version),
        reset: Number(row.reset_marker) === 1,
        updatedAt: Number(row.updated_at)
      }
    });
  }

  async saveGame(body) {
    const userId = String(body.userId || '').slice(0, 80);
    const gameId = String(body.gameId || '').trim().toLowerCase();
    if (!userId || !GAME_SAVE_ID_SET.has(gameId)) {
      return json({ error: 'This game does not support account saves.' }, 400);
    }
    if (body.schemaVersion !== GAME_SAVE_SCHEMA_VERSION) {
      return json({ error: 'This saved game version is not supported.' }, 400);
    }
    const clientVersion = body.version;
    if (typeof clientVersion !== 'number' || !Number.isSafeInteger(clientVersion) || clientVersion < 0) {
      return json({ error: 'The saved game version is invalid.' }, 400);
    }
    if (body.reset !== undefined && typeof body.reset !== 'boolean') {
      return json({ error: 'The saved game reset flag is invalid.' }, 400);
    }
    const checked = validateGameSaveState(gameId, body.state);
    if (checked.error) return json({ error: checked.error }, 400);
    const reset = body.reset === true;
    if (reset && !isBlankGameSave(gameId, checked.state)) {
      return json({ error: 'A reset must contain the default game state.' }, 400);
    }

    const user = this.sql.exec('SELECT id FROM users WHERE id = ? AND status = ?', userId, 'active').toArray()[0];
    if (!user) return json({ error: 'Account not found.' }, 404);
    if (!this.consumeRateLimit(`game-save:${userId}:${gameId}`, 4000, 3600)) {
      return json({ error: 'Game progress is syncing too often. Please wait a moment and try again.' }, 429);
    }

    const previous = this.sql.exec(
      'SELECT version FROM game_saves WHERE user_id = ? AND game_id = ?',
      userId,
      gameId
    ).toArray()[0];
    const currentVersion = previous ? Number(previous.version) : 0;
    if (!reset && clientVersion !== currentVersion) {
      const current = this.gameSave(userId, gameId);
      const data = await current.json();
      return json({
        error: 'Newer game progress is already saved. Merge it before trying again.',
        ...data
      }, 409);
    }

    const version = currentVersion + 1;
    const updatedAt = Date.now();
    this.sql.exec(
      `INSERT INTO game_saves(user_id, game_id, state_json, schema_version, version, reset_marker, updated_at)
       VALUES(?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, game_id) DO UPDATE SET
         state_json = excluded.state_json,
         schema_version = excluded.schema_version,
         version = excluded.version,
         reset_marker = excluded.reset_marker,
         updated_at = excluded.updated_at`,
      userId,
      gameId,
      JSON.stringify(checked.state),
      GAME_SAVE_SCHEMA_VERSION,
      version,
      reset ? 1 : 0,
      updatedAt
    );

    const recordValue = gameId === 'cloudlab-clicker' ? Math.floor(checked.state.total) : checked.state.best;
    let leaderboardImproved = false;
    if (recordValue > 0) {
      const scoreResponse = this.saveScore({ userId, gameId, value: recordValue });
      const scoreResult = await scoreResponse.json();
      leaderboardImproved = scoreResult.improved === true;
    }
    return json({
      ok: true,
      gameId,
      leaderboardImproved,
      save: { state: checked.state, schemaVersion: GAME_SAVE_SCHEMA_VERSION, version, reset, updatedAt }
    });
  }

  saveScore(body) {
    const userId = String(body.userId || '').slice(0, 80);
    const gameId = String(body.gameId || '').trim().toLowerCase();
    const rule = GAME_RULES[gameId];
    if (!userId || !rule) return json({ error: 'Unknown game record.' }, 400);

    const value = Number(body.value);
    const secondary = body.secondary === null || body.secondary === undefined ? null : Number(body.secondary);
    if (!Number.isFinite(value) || value < rule.min || value > rule.max) {
      return json({ error: 'That score is outside the accepted range.' }, 400);
    }
    if (secondary !== null && (!Number.isFinite(secondary) || secondary < 0 || secondary > 86400)) {
      return json({ error: 'That secondary score is invalid.' }, 400);
    }

    const user = this.sql.exec('SELECT id FROM users WHERE id = ? AND status = ?', userId, 'active').toArray()[0];
    if (!user) return json({ error: 'Account not found.' }, 404);

    const numericValue = Math.trunc(value);
    const numericSecondary = secondary === null ? null : Math.trunc(secondary);
    const previous = this.sql.exec(
      'SELECT value, secondary_value FROM scores WHERE user_id = ? AND game_id = ?',
      userId,
      gameId
    ).toArray()[0];

    let improved = !previous;
    if (previous) {
      if (rule.direction === 'desc') improved = numericValue > previous.value;
      else if (rule.direction === 'asc') improved = numericValue < previous.value;
      else {
        improved = numericValue < previous.value
          || (numericValue === previous.value && numericSecondary !== null && (previous.secondary_value === null || numericSecondary < previous.secondary_value));
      }
    }

    if (!improved) return json({ ok: true, improved: false, record: previous });

    const extra = cleanExtra(body.extra);
    const now = Date.now();
    this.sql.exec(
      `INSERT INTO scores(user_id, game_id, value, secondary_value, extra_json, updated_at)
       VALUES(?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, game_id) DO UPDATE SET
         value = excluded.value,
         secondary_value = excluded.secondary_value,
         extra_json = excluded.extra_json,
         updated_at = excluded.updated_at`,
      userId,
      gameId,
      numericValue,
      numericSecondary,
      JSON.stringify(extra),
      now
    );

    return json({
      ok: true,
      improved: true,
      record: { gameId, value: numericValue, secondary: numericSecondary, extra, updatedAt: now }
    });
  }

  leaderboard(gameIdValue, limitValue) {
    const gameId = String(gameIdValue || '').trim().toLowerCase();
    const rule = GAME_RULES[gameId];
    if (!rule) return json({ error: 'Unknown game leaderboard.' }, 404);
    const limit = Math.max(1, Math.min(50, Number.parseInt(limitValue || '10', 10) || 10));
    const order = rule.direction === 'desc'
      ? 's.value DESC, s.updated_at ASC'
      : rule.direction === 'asc'
        ? 's.value ASC, s.updated_at ASC'
        : 's.value ASC, COALESCE(s.secondary_value, 2147483647) ASC, s.updated_at ASC';

    const rows = this.sql.exec(
      `SELECT u.username, s.value, s.secondary_value, s.extra_json, s.updated_at
       FROM scores s
       JOIN users u ON u.id = s.user_id
       WHERE s.game_id = ? AND u.status = 'active'
       ORDER BY ${order}
       LIMIT ?`,
      gameId,
      limit
    ).toArray();

    return json({
      gameId,
      rule,
      entries: rows.map((row, index) => ({
        rank: index + 1,
        username: row.username,
        value: row.value,
        secondary: row.secondary_value,
        extra: JSON.parse(row.extra_json || '{}'),
        updatedAt: row.updated_at
      }))
    });
  }

  likeStatus(slugValue, userIdValue) {
    const slug = cleanSlug(slugValue);
    if (!slug) return json({ error: 'Invalid post.' }, 400);
    const userId = String(userIdValue || '').slice(0, 80);
    const count = this.sql.exec('SELECT COUNT(*) AS total FROM likes WHERE post_slug = ?', slug).one().total;
    const liked = userId
      ? Boolean(this.sql.exec('SELECT 1 AS found FROM likes WHERE post_slug = ? AND user_id = ?', slug, userId).toArray()[0])
      : false;
    return json({ slug, count, liked });
  }

  toggleLike(body) {
    const slug = cleanSlug(body.slug);
    const userId = String(body.userId || '').slice(0, 80);
    if (!slug || !userId) return json({ error: 'A valid account and post are required.' }, 400);

    const user = this.sql.exec('SELECT id FROM users WHERE id = ? AND status = ?', userId, 'active').toArray()[0];
    if (!user) return json({ error: 'Account not found.' }, 404);

    const existing = this.sql.exec('SELECT 1 AS found FROM likes WHERE post_slug = ? AND user_id = ?', slug, userId).toArray()[0];
    let liked;
    if (existing) {
      this.sql.exec('DELETE FROM likes WHERE post_slug = ? AND user_id = ?', slug, userId);
      liked = false;
    } else {
      this.sql.exec('INSERT INTO likes(user_id, post_slug, created_at) VALUES(?, ?, ?)', userId, slug, Date.now());
      liked = true;
    }
    const count = this.sql.exec('SELECT COUNT(*) AS total FROM likes WHERE post_slug = ?', slug).one().total;
    return json({ ok: true, slug, liked, count });
  }
}

export {
  GAME_RULES,
  GAME_SAVE_IDS,
  GAME_SAVE_SCHEMA_VERSION,
  hashPassword,
  validateGameSaveState,
  verifyPassword
};
