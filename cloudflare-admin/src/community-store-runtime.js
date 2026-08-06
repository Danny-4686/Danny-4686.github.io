import { DurableObject } from 'cloudflare:workers';
import { CommunityStore as BaseCommunityStore, GAME_RULES } from './community-store.js';

const PROFILE_BIO_MAX = 160;
const PROFILE_STATUS_MAX = 20;
const PROFILE_BLOCKED = [
  'fuck', 'fucker', 'fucking', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'whore',
  'slut', 'retard', 'retarded', 'nazi', 'hitler', 'kkk', 'rape', 'rapist',
  'nigger', 'nigga', 'faggot', 'fag', 'tranny', 'chink', 'spic', 'kike', 'wetback',
  'whitepower', 'heilhitler', 'childporn', 'pedophile', 'paedophile'
];

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

function profileModerationKey(value) {
  return String(value || '')
    .normalize('NFKC')
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

function cleanProfileText(value, maxLength, label) {
  const text = String(value || '')
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length > maxLength) {
    return { error: `${label} must be ${maxLength} characters or fewer.` };
  }

  const moderationKey = profileModerationKey(text);
  if (moderationKey && PROFILE_BLOCKED.some((term) => moderationKey.includes(term))) {
    return { error: `${label} contains text that is not allowed.` };
  }

  return { text };
}

class CommunityStoreImplementation extends BaseCommunityStore {
  ensureProfilesTable() {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        user_id TEXT PRIMARY KEY,
        bio TEXT NOT NULL DEFAULT '',
        status_text TEXT NOT NULL DEFAULT '',
        updated_at INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  }

  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    if (url.pathname === '/health' && method === 'GET') {
      const check = this.sql.exec('SELECT 1 AS ready').one();
      if (url.searchParams.get('deep') === '1') return this.signupSelfTest();
      return json({ ok: check.ready === 1, storage: 'sqlite' });
    }

    if (url.pathname === '/public-profile' && method === 'GET') {
      return this.getPublicProfile(url.searchParams.get('userId'));
    }

    if (url.pathname === '/profile' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      return this.saveProfile(body);
    }

    return super.fetch(request);
  }

  async signupSelfTest() {
    const suffix = Date.now().toString(36).slice(-8);
    const username = `Probe${suffix}`.slice(0, 20);
    const usernameKey = username.toLowerCase();
    const ip = `health-${crypto.randomUUID()}`;
    const rateKey = `signup:${ip}`;
    let userId = '';

    try {
      const response = await super.signup({
        username,
        password: 'CloudLabProbe123!',
        ip
      });
      const data = await response.json().catch(() => ({}));
      userId = String(data.user?.id || '');

      if (!response.ok || !userId) {
        return json({
          ok: false,
          storage: 'sqlite',
          signupReady: false,
          stage: 'signup',
          signupStatus: response.status,
          signupResponse: data
        }, 500);
      }

      const saved = this.sql.exec(
        'SELECT id, username FROM users WHERE id = ? AND username_key = ?',
        userId,
        usernameKey
      ).toArray()[0];

      if (!saved) {
        return json({
          ok: false,
          storage: 'sqlite',
          signupReady: false,
          stage: 'verification'
        }, 500);
      }

      return json({
        ok: true,
        storage: 'sqlite',
        signupReady: true,
        stage: 'complete'
      });
    } catch (error) {
      return json({
        ok: false,
        storage: 'sqlite',
        signupReady: false,
        stage: 'exception',
        error: String(error?.message || error || 'Unknown signup self-test error').slice(0, 300)
      }, 500);
    } finally {
      if (userId) this.sql.exec('DELETE FROM users WHERE id = ?', userId);
      else this.sql.exec('DELETE FROM users WHERE username_key = ?', usernameKey);
      this.sql.exec('DELETE FROM rate_limits WHERE rate_key = ?', rateKey);
    }
  }

  getPublicProfile(userIdValue) {
    this.ensureProfilesTable();
    const userId = String(userIdValue || '').slice(0, 80);
    if (!userId) return json({ profile: null }, 404);

    const row = this.sql.exec(
      `SELECT
         u.id,
         u.username,
         u.created_at,
         u.avatar_updated_at,
         COALESCE(p.bio, '') AS bio,
         COALESCE(p.status_text, '') AS status_text,
         COALESCE(p.updated_at, 0) AS profile_updated_at
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = ? AND u.status = 'active'`,
      userId
    ).toArray()[0];

    if (!row) return json({ profile: null }, 404);
    return json({
      profile: {
        id: row.id,
        username: row.username,
        createdAt: Number(row.created_at || 0),
        avatarUpdatedAt: Number(row.avatar_updated_at || 0) || null,
        bio: String(row.bio || ''),
        statusText: String(row.status_text || ''),
        profileUpdatedAt: Number(row.profile_updated_at || 0) || null
      }
    });
  }

  saveProfile(body) {
    this.ensureProfilesTable();
    const userId = String(body.userId || '').slice(0, 80);
    if (!userId) return json({ error: 'Account not found.' }, 404);
    if (!this.consumeRateLimit(`profile-text:${userId}`, 30, 86400)) {
      return json({ error: 'Too many profile updates. Please try again tomorrow.' }, 429);
    }

    const bio = cleanProfileText(body.bio, PROFILE_BIO_MAX, 'Bio');
    if (bio.error) return json({ error: bio.error }, 400);
    const statusText = cleanProfileText(body.statusText, PROFILE_STATUS_MAX, 'Status');
    if (statusText.error) return json({ error: statusText.error }, 400);

    const user = this.sql.exec(
      'SELECT id FROM users WHERE id = ? AND status = ?',
      userId,
      'active'
    ).toArray()[0];
    if (!user) return json({ error: 'Account not found.' }, 404);

    const updatedAt = Date.now();
    this.sql.exec(
      `INSERT INTO profiles(user_id, bio, status_text, updated_at)
       VALUES(?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         bio = excluded.bio,
         status_text = excluded.status_text,
         updated_at = excluded.updated_at`,
      userId,
      bio.text,
      statusText.text,
      updatedAt
    );

    return this.getPublicProfile(userId);
  }

  async changeUsername(body) {
    const originalSql = this.sql;
    const originalExec = originalSql.exec.bind(originalSql);

    this.sql = {
      exec(query, ...bindings) {
        const statement = String(query || '').trim().toUpperCase();
        if (statement === 'BEGIN IMMEDIATE' || statement === 'COMMIT' || statement === 'ROLLBACK') {
          return { toArray: () => [], one: () => null };
        }
        return originalExec(query, ...bindings);
      }
    };

    try {
      return await super.changeUsername(body);
    } finally {
      this.sql = originalSql;
    }
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
      `SELECT
         u.id AS user_id,
         u.username,
         u.avatar_updated_at,
         s.value,
         s.secondary_value,
         s.extra_json,
         s.updated_at
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
        userId: row.user_id,
        username: row.username,
        avatarUpdatedAt: Number(row.avatar_updated_at || 0) || null,
        value: row.value,
        secondary: row.secondary_value,
        extra: JSON.parse(row.extra_json || '{}'),
        updatedAt: row.updated_at
      }))
    });
  }
}

export class CommunityStore extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.implementation = new CommunityStoreImplementation(ctx, env);
  }

  fetch(request) {
    return this.implementation.fetch(request);
  }
}
