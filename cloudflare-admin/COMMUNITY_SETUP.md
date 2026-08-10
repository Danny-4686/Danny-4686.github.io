# CloudLab Community Launch Checklist

This Worker now serves two separate systems:

- `admin.danny4686.com` — private owner workspace authenticated with the approved GitHub account.
- `api.danny4686.com` — public account, cross-device game-save, leaderboard, record, and Journal-like API.

The public website pages are:

- `https://danny4686.com/signup/`
- `https://danny4686.com/login/`
- `https://danny4686.com/account/`

## 1. Confirm the Worker deployment

The GitHub Actions deployment should create:

- the `api.danny4686.com` Worker custom domain;
- the `COMMUNITY` Durable Object binding;
- the SQLite-backed `CommunityStore` namespace and tables.

Check these endpoints after deployment:

- `https://admin.danny4686.com/health`
- `https://api.danny4686.com/v1/health`

The community health response should report `storageConfigured: true` and `sessionsConfigured: true`.

## 2. Add a dedicated community session secret

The account service can fall back to the existing `SESSION_SECRET`, but production should use a separate randomly generated Worker secret named:

- `COMMUNITY_SESSION_SECRET`

Do not commit the value to GitHub. Add it through Cloudflare Worker secrets or Wrangler secret management.

## 3. Enable Cloudflare Turnstile before broad public promotion

Create a Turnstile widget that allows:

- `danny4686.com`
- `www.danny4686.com`

Then configure:

- Worker variable: `TURNSTILE_SITE_KEY`
- Worker secret: `TURNSTILE_SECRET`

The signup and login pages discover the public site key automatically. The Worker already performs required server-side Siteverify validation. Until these values are configured, account creation and login still use IP-based rate limits but do not display a Turnstile challenge.

## 4. Complete a launch test

Use a non-owner test account and verify:

1. An allowed username can be created.
2. Reserved, offensive, and inappropriate usernames are rejected.
3. Duplicate usernames are rejected without regard to capitalization.
4. The account remains signed in after reopening the browser.
5. Signing out clears the session.
6. Existing local progress in Flappy Cloud, CloudLab Clicker, and Launcher merges into the account after signing in.
7. Progress reloads on a second signed-in device without granting offline Clicker production.
8. A stale tab cannot overwrite a newer save, and an explicit Clicker reset stays reset.
9. Only an improved personal record replaces the saved leaderboard value.
10. The player appears on the correct leaderboard for all three new games.
11. A full Journal article can be liked and unliked once per account.
12. Mobile Safari and desktop browsers both complete signup, login, save sync, and leaderboard loading.

## 5. Before a larger public launch

Add these next:

- password reset or account recovery;
- a short Privacy page and Terms/Community Rules page;
- an owner moderation dashboard for account suspension, username changes, record removal, and like review;
- automated backups or periodic Durable Object exports;
- monitoring for repeated signup, login, and score-submission failures.

## Leaderboard integrity

The current games run in the browser. The API validates identity, score type, score range, CSRF, and whether a submitted result improves the player's record. A determined user can still manipulate browser-side game values before submission.

Treat these as community/friendly leaderboards. Truly competitive verified leaderboards require server-validated run telemetry, replay verification, signed game events, or another anti-cheat system that does not trust the final browser value by itself.
