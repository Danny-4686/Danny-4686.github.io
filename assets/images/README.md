# Website image assets

This folder is the image library for Danny4686.com.

## Source artwork (owner uploads, kept as masters)

- `cloudlab-logo.png` — CloudLab Earth logo (2048 px master; also the social `og:image`).
- `profile-gloss.webp` — Danny4686 character/profile artwork.
- `discord-gloss.png`, `github-gloss.webp`, `tools-gloss.webp`, `tiktok-gloss.webp`, `roblox-gloss.png` — glossy icons.
- `memory/*.png` — Memory Match, Minesweeper, Snake and launcher artwork.

These masters are large. Pages should not link to them directly.

## What pages actually load

- `optimized/` — resized WebP copies of the masters above (`cloudlab-logo-256.webp`, `profile-600.webp`, `*-160.webp` icons, ...).
- `memory/optimized/` — small WebP card/icon copies (`*-256.webp`, `*-160.webp`, `Earth-256.webp`).
- `journal/<slug>/` — Journal thumbnails. `*-1080w.webp` files are smaller copies listed in a post's
  `thumbnailSrcset` in `journal/posts.json`; the full `thumbnail` stays the fallback and the reader-modal image.
- `projects/<id>/` — Project artwork. `*-960w.webp` files are sized for the homepage project cards
  (about 458 CSS px wide, so 960 px covers 2x screens).

Rule of thumb: size a served copy to about 2x its largest on-screen CSS size, encode WebP at quality 82-85,
and keep the original upload next to it.
