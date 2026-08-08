import { escapeAttr, escapeHtml, mediaType } from './utils.js';

function mediaBlock(item) {
  if (item.type === 'video' || mediaType(item.path) === 'video') {
    return `<figure class="media-item"><video src="${escapeAttr(item.path)}" controls playsinline preload="metadata" aria-label="${escapeAttr(item.alt || 'Journal video')}"></video></figure>`;
  }
  return `<figure class="media-item"><img data-zoom src="${escapeAttr(item.path)}" alt="${escapeAttr(item.alt || 'Journal image')}"></figure>`;
}

function heroBlock(post) {
  if (mediaType(post.hero) === 'video') {
    return `<video src="${escapeAttr(post.hero)}" controls playsinline preload="metadata" aria-label="${escapeAttr(post.title)}"></video>`;
  }
  return `<img src="${escapeAttr(post.hero)}" alt="${escapeAttr(post.title)} hero image">`;
}

function absolutePublicUrl(value) {
  const path = String(value || '').trim();
  if (/^https?:\/\//i.test(path)) return path;
  return `https://danny4686.com/${path.replace(/^\/+/, '')}`;
}

export function buildPostHtml(post) {
  const tags = post.tags.length
    ? post.tags.map((tag) => escapeHtml(tag.toUpperCase())).join(' · ')
    : 'JOURNAL';

  const canonicalUrl = `https://danny4686.com/journal/posts/${encodeURIComponent(post.slug)}/`;
  const previewMedia = mediaType(post.hero) === 'video' ? post.thumbnail : post.hero;
  const shareImage = absolutePublicUrl(previewMedia || '/assets/images/cloudlab-logo.png');

  const sections = post.sections.map((section) => {
    const heading = section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : '';
    const paragraphs = section.body
      ? section.body.split(/\n\s*\n/).map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`).join('\n        ')
      : '';
    const media = section.media?.length
      ? `<div class="media-grid${section.media.length === 1 ? ' single-media' : ''}">${section.media.map(mediaBlock).join('')}</div>`
      : '';
    return `<section class="post-panel reveal">${heading}${paragraphs}${media}</section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeAttr(post.description)}">
  <meta name="author" content="Danny4686">
  <meta name="application-name" content="CloudLab">
  <meta name="apple-mobile-web-app-title" content="CloudLab">
  <meta name="theme-color" content="#061117">
  <link rel="canonical" href="${escapeAttr(canonicalUrl)}">
  <meta property="og:site_name" content="CloudLab">
  <meta property="og:title" content="${escapeAttr(post.title)}">
  <meta property="og:description" content="${escapeAttr(post.description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeAttr(canonicalUrl)}">
  <meta property="og:image" content="${escapeAttr(shareImage)}">
  <meta property="og:image:alt" content="${escapeAttr(post.title)}">
  <meta property="article:published_time" content="${escapeAttr(post.date)}">
  ${post.tags.map((tag) => `<meta property="article:tag" content="${escapeAttr(tag)}">`).join('\n  ')}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(post.title)}">
  <meta name="twitter:description" content="${escapeAttr(post.description)}">
  <meta name="twitter:image" content="${escapeAttr(shareImage)}">
  <title>${escapeHtml(post.title)} | CloudLab Journal</title>
  <link rel="icon" href="/assets/images/cloudlab-logo.png" type="image/png">
  <link rel="shortcut icon" href="/assets/images/cloudlab-logo.png" type="image/png">
  <link rel="apple-touch-icon" href="/assets/images/cloudlab-logo.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/hub.css">
  <link rel="stylesheet" href="/journal/post-layout.css?v=1">
</head>
<body>
  <header class="hub-header">
    <a class="hub-brand" href="/" aria-label="Danny4686 home"><img src="/assets/images/cloudlab-logo.png" alt="CloudLab logo"><span><strong>Danny4686</strong><small>CloudLab Studio</small></span></a>
    <nav class="hub-nav" aria-label="Journal navigation"><a class="active" href="/journal/">Journal</a><a href="/">Home</a></nav>
    <a class="header-action" href="/journal/">All Posts</a>
  </header>

  <main class="journal-post-shell">
    <section class="post-intro reveal">
      <figure class="post-intro-media">${heroBlock(post)}</figure>
      <div class="post-intro-copy">
        <a class="back-link" href="/journal/">← Back to Journal</a>
        <div class="post-intro-meta">
          <p class="eyebrow">${tags}</p>
          <time datetime="${escapeAttr(post.date)}">${escapeHtml(post.displayDate)}</time>
        </div>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="post-description">${escapeHtml(post.description)}</p>
      </div>
    </section>

    <div class="post-divider reveal"><span>FULL POST</span></div>
    <article class="post-content">${sections || '<section class="post-panel reveal"><p>More details will be added soon.</p></section>'}</article>
  </main>

  <footer class="site-footer"><a class="footer-brand" href="/"><img src="/assets/images/cloudlab-logo.png" alt="CloudLab logo"><span><strong>CloudLab Studio</strong><small>Journal</small></span></a><p>© <span id="year"></span> Danny4686.</p></footer>
  <script src="/hub.js"></script>
</body>
</html>
`;
}
