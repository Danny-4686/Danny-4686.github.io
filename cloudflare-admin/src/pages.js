import { escapeHtml } from './utils.js';

const LOGIN_CSS = `:root{color-scheme:dark;--text:#f4fafb;--muted:#98adb5;--line:rgba(137,190,201,.2);--cyan:#68d0df}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;color:var(--text);font-family:Inter,system-ui,sans-serif;background:radial-gradient(circle at 15% 0,rgba(104,208,223,.14),transparent 31%),linear-gradient(180deg,#061117,#03090d)}main{width:min(460px,100%);padding:38px;border:1px solid var(--line);border-radius:28px;background:rgba(8,22,29,.95);box-shadow:0 24px 65px rgba(0,0,0,.38);text-align:center}img{width:82px;height:82px;object-fit:contain;margin-bottom:18px}.eyebrow{margin:0 0 8px;color:var(--cyan);font-size:.7rem;font-weight:800;letter-spacing:.14em}h1{margin:0 0 12px;font-size:2.4rem;letter-spacing:-.05em}p,small{color:var(--muted);line-height:1.65}a{display:inline-flex;align-items:center;justify-content:center;min-height:46px;margin-top:12px;padding:11px 17px;border-radius:13px;color:#061117;background:var(--cyan);font-weight:850;text-decoration:none}small{display:block;margin-top:18px}`;

export function loginPage(message = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>CloudLab Journal Admin</title><link rel="icon" href="https://danny4686.com/favicon.ico" sizes="16x16 32x32 48x48"><link rel="icon" href="https://danny4686.com/assets/icons/favicon-48x48.png" type="image/png" sizes="48x48"><link rel="apple-touch-icon" href="https://danny4686.com/assets/icons/apple-touch-icon.png" sizes="180x180"><style>${LOGIN_CSS}</style></head><body><main><img src="https://danny4686.com/assets/images/cloudlab-logo.png" alt="CloudLab logo"><p class="eyebrow">PRIVATE CLOUDLAB TOOL</p><h1>Journal Admin</h1><p>${escapeHtml(message || 'This dashboard is restricted to the authorized GitHub account.')}</p><a href="/auth/login">Sign in with GitHub</a><small>The dashboard is not linked from the public website.</small></main></body></html>`;
}

export function dashboardPage(login) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>CloudLab Journal Admin</title>
  <link rel="icon" href="https://danny4686.com/favicon.ico" sizes="16x16 32x32 48x48">
  <link rel="icon" href="https://danny4686.com/assets/icons/favicon-48x48.png" type="image/png" sizes="48x48">
  <link rel="apple-touch-icon" href="https://danny4686.com/assets/icons/apple-touch-icon.png" sizes="180x180">
  <link rel="stylesheet" href="/admin.css">
</head>
<body>
  <header class="admin-header">
    <div class="admin-brand">
      <img src="https://danny4686.com/assets/images/cloudlab-logo.png" alt="">
      <span><strong>Journal Admin</strong><small>Signed in as ${escapeHtml(login)}</small></span>
    </div>
    <div class="header-actions">
      <a href="https://danny4686.com/journal/" target="_blank" rel="noopener">View Journal</a>
      <a href="/auth/logout">Sign out</a>
    </div>
  </header>

  <main class="dashboard">
    <aside class="sidebar">
      <div class="sidebar-head">
        <div><p class="eyebrow">CONTENT</p><h2>Journal posts</h2></div>
        <button id="newPost" class="icon" type="button" aria-label="Create new post">＋</button>
      </div>
      <label class="sidebar-search"><span class="sr-only">Search posts</span><input id="postSearch" type="search" placeholder="Search your posts"></label>
      <div id="postList" class="post-list"><p class="muted">Loading posts…</p></div>
    </aside>

    <section class="workspace">
      <div class="workspace-head">
        <div><p class="eyebrow">EDITOR</p><h1 id="editorTitle">Create a new post</h1><p id="editorSubtitle">Choose how it should appear, add the details, then publish it directly to your website.</p></div>
        <span id="status" class="status">Ready</span>
      </div>

      <form id="postForm">
        <section class="editor-card mode-card">
          <div class="card-heading"><div><p class="eyebrow">POST TYPE</p><h2>How should this appear?</h2></div><p>Change this at any time before publishing.</p></div>
          <div class="mode-picker" role="radiogroup" aria-label="Post type">
            <label class="mode-option"><input id="modeArticle" name="postMode" type="radio" value="article" checked><span><strong>Full Post</strong><small>Journal card plus a complete article page.</small></span></label>
            <label class="mode-option"><input id="modeCard" name="postMode" type="radio" value="card"><span><strong>Post Only</strong><small>Journal card with expandable full text, without a separate page.</small></span></label>
            <label class="mode-option"><input id="modeComingSoon" name="postMode" type="radio" value="coming-soon"><span><strong>Coming Soon</strong><small>Show a locked preview for something upcoming.</small></span></label>
          </div>
        </section>

        <div class="editor-layout">
          <div class="editor-main">
            <section class="editor-card">
              <div class="card-heading"><div><p class="eyebrow">BASICS</p><h2>Post information</h2></div><p>This information appears on the Journal card.</p></div>
              <div class="grid two"><label><span>Title</span><input id="title" maxlength="140" required placeholder="Post title"></label><label><span>URL name</span><input id="slug" maxlength="90" required placeholder="post-url-name"></label></div>
              <label><span id="descriptionLabel">Short description</span><textarea id="description" maxlength="320" required rows="4" placeholder="A clean summary shown below the title."></textarea></label>
              <div class="grid three"><label><span>Date</span><input id="date" type="date" required></label><label><span>Tags</span><input id="tags" placeholder="Website, CloudLab Studio"></label><label><span>Thumbnail fit</span><select id="fit"><option value="cover">Fill the frame</option><option value="contain">Show the whole image</option></select></label></div>
            </section>

            <section class="editor-card">
              <div class="card-heading"><div><p class="eyebrow">VISUALS</p><h2>Images and video</h2></div><p>Your thumbnail is always used on the Journal card.</p></div>
              <div class="grid two media-fields">
                <label class="upload"><span>Card thumbnail</span><input id="thumbnail" type="file" accept="image/*,video/*"><small id="thumbCurrent">No file selected</small></label>
                <label id="heroUpload" class="upload"><span>Full-post hero media</span><input id="hero" type="file" accept="image/*,video/*"><small id="heroCurrent">Uses the thumbnail when empty</small></label>
              </div>
            </section>

            <section id="articleFields" class="editor-card article-fields">
              <div class="section-toolbar"><div><p class="eyebrow">FULL POST</p><h2>Post sections</h2><p>Each section can contain a heading, text, images, videos, or a gallery.</p></div><button id="addSection" class="secondary" type="button">Add section</button></div>
              <div id="sections" class="sections"></div>
            </section>
          </div>

          <aside class="editor-side">
            <section class="live-preview-card">
              <div class="live-preview-label"><span>LIVE CARD PREVIEW</span><span id="previewModeBadge">FULL POST</span></div>
              <div id="cardPreviewMedia" class="live-preview-media"><span>Choose a thumbnail</span></div>
              <div class="live-preview-body">
                <div class="live-preview-meta"><span id="cardPreviewTag">JOURNAL</span><time id="cardPreviewDate">Today</time></div>
                <h3 id="cardPreviewTitle">Your post title</h3>
                <p id="cardPreviewDescription">Your short description will appear here.</p>
                <strong id="cardPreviewAction">Read post →</strong>
              </div>
            </section>
            <section class="mode-help"><span class="mode-help-icon">✦</span><div><strong id="modeHelpTitle">Full Post</strong><p id="modeHelpText">Readers can open the card and view the complete article.</p></div></section>
          </aside>
        </div>

        <div class="editor-actions">
          <button id="saveDraft" class="secondary" type="button">Save local draft</button>
          <button id="preview" class="secondary" type="button">Preview layout</button>
          <button id="unpublish" class="danger" type="button" hidden>Unpublish</button>
          <button id="publishButton" class="primary" type="submit">Publish full post</button>
        </div>
      </form>
    </section>
  </main>

  <dialog id="previewDialog">
    <button id="closePreview" class="dialog-close" type="button" aria-label="Close preview">×</button>
    <div id="previewContent" class="preview"></div>
  </dialog>
  <script src="/admin.js"></script>
</body>
</html>`;
}
