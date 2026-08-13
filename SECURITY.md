# Security Policy

Security issues are treated separately from normal bugs and feature requests.

## Reporting a vulnerability

Please do not publish exploitable details, credentials, session tokens, private account data, or proof-of-concept payloads in a public issue. Use GitHub private vulnerability reporting when it is available for this repository, or contact the project owner privately through an established CloudLab/Danny4686 channel.

Include the affected URL or component, the impact, the minimum steps required to reproduce the issue, and any relevant request/response details with secrets removed.

## Security expectations

- Secrets and production credentials must stay in GitHub Actions or Cloudflare secret storage, never frontend JavaScript or committed environment files.
- Public account identity is derived from the signed server session for protected writes; client-supplied user IDs are not trusted for authorization.
- Admin mutations require an authenticated session and CSRF validation, and cross-site mutation requests are rejected.
- Community signup and login require Cloudflare Turnstile in production and are rate limited.
- Passwords are salted and stored with an adaptive PBKDF2-HMAC-SHA256 work factor. Older hashes are upgraded after a successful sign-in.
- Uploaded Journal media is size-limited, allow-listed, signature-checked, and renamed to a safe canonical extension before publishing.
- Profile images are limited to approved image formats and checked against their actual file signature.
- Worker responses force HTTPS and carry defensive browser security headers.
- CI runs security regression checks and dependency vulnerability auditing, while Dependabot monitors dependency updates.

## If a secret is exposed

Treat any committed or logged production secret as compromised even if it is deleted later. Revoke or rotate it at the provider first, update the stored secret, redeploy, and then remove the leaked value from Git history if necessary. Never reuse the exposed value.
