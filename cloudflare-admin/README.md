# CloudLab Journal Admin

Private Cloudflare Worker dashboard for publishing Journal posts to `Danny-4686/Danny-4686.github.io`.

## Security model

- The dashboard is served from `admin.danny4686.com`, not from the public GitHub Pages site.
- It is not linked in the public navigation.
- Dashboard HTML, JavaScript, CSS, and API routes are served only after a valid signed session.
- Authentication uses GitHub OAuth and permits only the configured GitHub username and permanent numeric account ID.
- Repository writes use a fine-grained GitHub token stored only as a Cloudflare Worker secret.
- Sessions use signed Secure/HttpOnly cookies and CSRF protection.
- Pages return `noindex`, `nofollow`, and `noarchive` headers.

## 1. Create the GitHub OAuth app

Open GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.

- Application name: `CloudLab Journal Admin`
- Homepage URL: `https://admin.danny4686.com`
- Authorization callback URL: `https://admin.danny4686.com/auth/callback`

Copy the Client ID and generate a Client Secret.

## 2. Create the repository token

Create a fine-grained personal access token restricted to:

- Repository: `Danny-4686/Danny-4686.github.io`
- Repository permission: **Contents — Read and write**
- Metadata: Read-only

Never put this token in a source file.

## 3. Configure Worker secrets

From the `cloudflare-admin` folder:

```bash
npm install
npx wrangler login
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put SESSION_SECRET
```

Use a long random value for `SESSION_SECRET`, for example:

```bash
openssl rand -base64 48
```

## 4. Deploy

```bash
npm run deploy
```

Wrangler attaches the Worker to `admin.danny4686.com/*`. The `danny4686.com` zone must be active in the same Cloudflare account, with the admin hostname proxied through Cloudflare.

## 5. Optional automatic deployment

The repository includes `.github/workflows/deploy-journal-admin.yml`.
Add these repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The API token needs Workers Scripts and Workers Routes edit access for the `danny4686.com` zone. After the secrets are configured, set the repository variable `ENABLE_ADMIN_DEPLOY` to `true`, or run the workflow manually.

## Publishing behavior

The dashboard writes:

```text
assets/images/journal/<slug>/...
journal/posts/<slug>/index.html
journal/posts/<slug>/post.json
journal/posts.json
```

All files for one publish action are committed atomically through GitHub's Git Data API.

A Coming Soon entry updates `journal/posts.json` but does not create a clickable article page.
