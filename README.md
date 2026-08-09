<p align="center">
  <img src="assets/images/optimized/cloudlab-logo-256.webp" width="112" alt="CloudLab logo">
</p>

# Danny4686.com

The official home of Danny4686 and CloudLab Studio: projects, browser games, journal updates, and community features.

[Visit the website](https://danny4686.com) · [Open the arcade](https://danny4686.com/games/) · [Read the journal](https://danny4686.com/journal/)

[![Site Quality](https://github.com/Danny-4686/Danny-4686.github.io/actions/workflows/site-quality.yml/badge.svg)](https://github.com/Danny-4686/Danny-4686.github.io/actions/workflows/site-quality.yml)
[![Journal Admin](https://github.com/Danny-4686/Danny-4686.github.io/actions/workflows/deploy-journal-admin.yml/badge.svg)](https://github.com/Danny-4686/Danny-4686.github.io/actions/workflows/deploy-journal-admin.yml)

## Repository layout

| Path | Purpose |
| --- | --- |
| `assets/` | Shared CSS, JavaScript, icons, and optimized images |
| `community/` | Account, profile, and public community interface |
| `games/` | CloudLab Arcade hub and individual browser games |
| `journal/` | Journal index, post data, media, and article styling |
| `cloudflare-admin/` | Private Journal Admin and community API Worker |
| `scripts/` | Repository-wide validation tools |
| `blog/`, `game/`, `snake/` | Compatibility redirects for older public links |

Root-level files are limited to GitHub Pages entry points and web platform metadata such as `CNAME`, `robots.txt`, `sitemap.xml`, favicons, and the web manifest.

## Local validation

Run the same checks used by GitHub before publishing:

```bash
node scripts/validate-site.mjs

cd cloudflare-admin
npm ci
npm test
npm run deploy -- --dry-run
```

## Deployment

- Commits merged into `main` publish the static site through GitHub Pages.
- Changes under `cloudflare-admin/` deploy through the Journal Admin workflow.
- Pull requests run the Site Quality workflow before they are merged.

Private keys and deployment secrets are stored in GitHub and Cloudflare settings, never in this repository.
