import { escapeHtml } from './utils.js';

const LOGIN_CSS = `:root{color-scheme:dark;--text:#f4fafb;--muted:#98adb5;--line:rgba(137,190,201,.2);--cyan:#68d0df}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;color:var(--text);font-family:Inter,system-ui,sans-serif;background:radial-gradient(circle at 15% 0,rgba(104,208,223,.14),transparent 31%),linear-gradient(180deg,#061117,#03090d)}main{width:min(460px,100%);padding:38px;border:1px solid var(--line);border-radius:28px;background:rgba(8,22,29,.95);box-shadow:0 24px 65px rgba(0,0,0,.38);text-align:center}img{width:82px;height:82px;object-fit:contain;margin-bottom:18px}.eyebrow{margin:0 0 8px;color:var(--cyan);font-size:.7rem;font-weight:800;letter-spacing:.14em}h1{margin:0 0 12px;font-size:2.4rem;letter-spacing:-.05em}p,small{color:var(--muted);line-height:1.65}a{display:inline-flex;align-items:center;justify-content:center;min-height:46px;margin-top:12px;padding:11px 17px;border-radius:13px;color:#061117;background:var(--cyan);font-weight:850;text-decoration:none}small{display:block;margin-top:18px}`;

export function loginPage(message = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>CloudLab Journal Admin</title><style>${LOGIN_CSS}</style></head><body><main><img src="https://danny4686.com/assets/images/cloudlab-logo.png" alt="CloudLab logo"><p class="eyebrow">PRIVATE CLOUDLAB TOOL</p><h1>Journal Admin</h1><p>${escapeHtml(message || 'This dashboard is restricted to the authorized GitHub account.')}</p><a href="/auth/login">Sign in with GitHub</a><small>The dashboard is not linked from the public website.</small></main></body></html>`;
}

export function dashboardPage(login) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>CloudLab Journal Admin</title>
  <link rel="stylesheet" href="/admin.css">
</head>
<body>
  <header class="admin-header">
    <div class="admin-brand"><img src="https://danny4686.com/assets/images/cloudlab-logo.png" alt=""><span><strong>Journal Admin</strong><small>Signed in as ${escapeHtml(login)}</small></span></div>
    <div class="header-actions"><a href="https://danny4686.com/journal/" target="_blank" rel="noopener">View Journal</a><a href="/auth/logout">Sign out</a></div>
  </header>

  <main class="dashboard">
    <aside class="sidebar">
      <div class="sidebar-head"><div><p class="eyebrow">POSTS</p><h2>Journal entries</h2></div><button id="newPost" class="icon" type="button" aria-label="New post">＋</button></div>
      <div id="postList" class="post-list"><p class="muted">Loading posts…</p></div>
    </aside>

    <section class="editor">
      <div class="editor-head"><div><p class="eyebrow">EDITOR</p><h1 id="editorTitle">New post</h1></div><span id="status" class="status">Ready</span></div>
      <form id="postForm">
        <div class="grid two"><label><span>Title</span><input id="title" maxlength="140" required placeholder="Post title"></label><label><span>URL name</span><input id="slug" maxlength="90" required placeholder="post-url-name"></label></div>
        <label><span>Short description</span><textarea id="description" maxlength="320" required rows="3" placeholder="Shown on the Journal card and in search previews."></textarea></label>
        <div class="grid three"><label><span>Date</span><input id="date" type="date" required></label><label><span>Tags</span><input id="tags" placeholder="Website, CloudLab Studio"></label><label><span>Thumbnail fit</span><select id="fit"><option value="cover">Cover</option><option value="contain">Contain</option></select></label></div>
        <div class="grid two"><label class="upload"><span>Card thumbnail</span><input id="thumbnail" type="file" accept="image/*,video/*"><small id="thumbCurrent">No file selected</small></label><label class="upload"><span>Hero image or video</span><input id="hero" type="file" accept="image/*,video/*"><small id="heroCurrent">No file selected</small></label></div>
        <label class="switch"><input id="comingSoon" type="checkbox"><span><strong>Coming Soon</strong><small>Show the card but keep it non-clickable.</small></span></label>

        <div class="section-toolbar"><div><p class="eyebrow">CONTENT</p><h2>Post sections</h2></div><button id="addSection" class="secondary" type="button">Add section</button></div>
        <div id="sections" class="sections"></div>

        <div class="editor-actions"><button id="saveDraft" class="secondary" type="button">Save draft locally</button><button id="preview" class="secondary" type="button">Preview</button><button id="unpublish" class="danger" type="button" hidden>Unpublish</button><button class="primary" type="submit">Publish to website</button></div>
      </form>
    </section>
  </main>

  <dialog id="previewDialog"><button id="closePreview" class="dialog-close" type="button">×</button><article id="previewContent" class="preview"></article></dialog>
  <script src="/admin.js"></script>
</body>
</html>`;
}
