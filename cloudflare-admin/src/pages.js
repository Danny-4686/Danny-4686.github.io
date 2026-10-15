import { loginPage as adminLoginPage } from './admin-login-page.js';
import { escapeHtml } from './utils.js';

export function loginPage(message = '') {
  return adminLoginPage(message);
}

const ICONS = {
  overview: '<path d="M4 13h6V4H4zM14 20h6v-9h-6zM14 4v4h6V4zM4 20h6v-4H4z"/>',
  journal: '<path d="M5 4h11l3 3v13H5z"/><path d="M9 9h6M9 13h6M9 17h4"/>',
  projects: '<path d="M12 3 3 8l9 5 9-5z"/><path d="m3 13 9 5 9-5"/>',
  homepage: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  arcade: '<rect x="3" y="7" width="18" height="11" rx="4"/><path d="M8 11v3M6.5 12.5h3M15 12h.01M17.5 13.5h.01"/>',
  abyss: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>',
  site: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"/><path d="M3.5 9h17M3.5 15h17M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z"/>',
  power: '<path d="M12 3v8"/><path d="M6.3 7.5a8 8 0 1 0 11.4 0"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5H5V6h5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>'
};

function icon(name, className = 'icon') {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
}

const NAV = [
  ['overview', 'Overview', 'Status and recent changes'],
  ['journal', 'Journal', 'Posts and updates'],
  ['projects', 'Projects', 'Homepage project slider'],
  ['homepage', 'Homepage', 'Portrait and artwork'],
  ['arcade', 'Arcade', 'Featured games'],
  ['abyss', 'Fresh Abyss', 'Hidden page'],
  ['site', 'Site controls', 'Emergency close and loading']
];

function navLinks() {
  return NAV.map(([id, label, hint]) => `
        <a class="nav-link" href="#${id}" data-nav="${id}" title="${hint}">
          ${icon(id)}<span class="nav-label">${label}</span><span class="nav-badge" data-badge="${id}" hidden></span>
        </a>`).join('');
}

function viewHead(eyebrow, title, lede, actions = '') {
  return `<header class="view-head"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="lede">${lede}</p></div>${actions ? `<div class="view-actions">${actions}</div>` : ''}</header>`;
}

const externalLink = (href, label, extra = '') => `<a class="btn ghost" href="${href}" target="_blank" rel="noopener"${extra}>${label}${icon('external', 'icon sm')}</a>`;

const overviewView = `
    <section class="view" data-view="overview" aria-label="Overview" hidden>
      ${viewHead('Dashboard', 'Welcome back', 'Everything on danny4686.com at a glance. Changes you save here go live in about a minute.', externalLink('https://danny4686.com/', 'Open website'))}
      <section class="status-hero" data-site-state="loading" aria-live="polite">
        <div class="status-hero-main">
          <span class="status-orb" aria-hidden="true"></span>
          <div><p class="eyebrow">Website status</p><h2 data-site-title>Checking website status…</h2><p data-site-text>One moment.</p></div>
        </div>
        <div class="status-hero-actions">
          <button class="btn danger lg" type="button" data-action="close-site" hidden>${icon('power')}Emergency close</button>
          <button class="btn success lg" type="button" data-action="open-site" hidden>${icon('power')}Reopen website</button>
          <a class="btn ghost" href="#site">Site controls</a>
        </div>
      </section>
      <div class="stat-grid" id="statGrid"></div>
      <div class="overview-grid">
        <section class="panel">
          <header class="panel-head"><div><h2>Quick actions</h2><p>Jump straight into the most common jobs.</p></div></header>
          <div class="quick-grid">
            <a class="quick" href="#journal/new">${icon('journal')}<span><strong>Write a post</strong><small>Full post, card, or teaser</small></span></a>
            <a class="quick" href="#projects/new">${icon('projects')}<span><strong>Add a project</strong><small>Shows in the homepage slider</small></span></a>
            <a class="quick" href="#homepage">${icon('homepage')}<span><strong>Change portrait</strong><small>Artwork or Roblox avatar</small></span></a>
            <a class="quick" href="#arcade">${icon('arcade')}<span><strong>Feature games</strong><small>Pick the arcade lineup</small></span></a>
          </div>
        </section>
        <section class="panel">
          <header class="panel-head"><div><h2>Recent changes</h2><p>Latest updates published to the website.</p></div><a class="btn ghost sm" id="historyLink" href="https://github.com/" target="_blank" rel="noopener">Full history${icon('external', 'icon sm')}</a></header>
          <ol class="activity" id="activityList"><li class="muted">Loading recent changes…</li></ol>
        </section>
      </div>
    </section>`;

const journalView = `
    <section class="view" data-view="journal" aria-label="Journal" hidden>
      ${viewHead('Content', 'Journal', 'Write full posts, quick post cards, or coming-soon teasers for the Journal page.', `<button class="btn primary" type="button" id="newPost">${icon('plus')}New post</button>${externalLink('https://danny4686.com/journal/', 'View Journal')}`)}
      <div class="split">
        <aside class="panel list-pane" aria-label="Journal posts">
          <div class="list-tools">
            <label class="search"><span class="sr-only">Search posts</span><input id="postSearch" type="search" placeholder="Search posts" autocomplete="off"></label>
            <div class="chips" id="postFilter" role="group" aria-label="Filter posts">
              <button type="button" class="chip" data-filter="all" aria-pressed="true">All <span></span></button>
              <button type="button" class="chip" data-filter="article" aria-pressed="false">Full <span></span></button>
              <button type="button" class="chip" data-filter="card" aria-pressed="false">Post <span></span></button>
              <button type="button" class="chip" data-filter="coming-soon" aria-pressed="false">Soon <span></span></button>
            </div>
          </div>
          <div class="list" id="postList" aria-busy="true"><span class="sr-only">Loading posts…</span><div class="skeleton-row" aria-hidden="true"><span class="skeleton"></span><span><span class="skeleton"></span><span class="skeleton"></span></span></div><div class="skeleton-row" aria-hidden="true"><span class="skeleton"></span><span><span class="skeleton"></span><span class="skeleton"></span></span></div><div class="skeleton-row" aria-hidden="true"><span class="skeleton"></span><span><span class="skeleton"></span><span class="skeleton"></span></span></div><div class="skeleton-row" aria-hidden="true"><span class="skeleton"></span><span><span class="skeleton"></span><span class="skeleton"></span></span></div><div class="skeleton-row" aria-hidden="true"><span class="skeleton"></span><span><span class="skeleton"></span><span class="skeleton"></span></span></div></div>
        </aside>
        <div class="editor-pane">
          <div class="notice-banner" id="draftBanner" hidden>
            <span><strong>Unsaved draft found</strong><small id="draftBannerText">From earlier on this device.</small></span>
            <span class="notice-actions"><button class="btn sm primary" type="button" id="restoreDraft">Restore</button><button class="btn sm ghost" type="button" id="discardDraft">Discard</button></span>
          </div>
          <form id="postForm" class="editor" novalidate>
            <div class="editor-head">
              <div><p class="eyebrow" id="postEyebrow">New post</p><h2 id="postEditorTitle">Create a post</h2></div>
              <a class="btn ghost sm" id="postLiveLink" href="https://danny4686.com/journal/" target="_blank" rel="noopener" hidden>View live${icon('external', 'icon sm')}</a>
            </div>
            <fieldset class="card">
              <legend class="card-title">Post type</legend>
              <div class="mode-picker">
                <label class="mode-option"><input name="postMode" type="radio" value="article" checked><span><strong>Full post</strong><small>A Journal card plus its own article page.</small></span></label>
                <label class="mode-option"><input name="postMode" type="radio" value="card"><span><strong>Post only</strong><small>A card that expands to show the full text.</small></span></label>
                <label class="mode-option"><input name="postMode" type="radio" value="coming-soon"><span><strong>Coming soon</strong><small>A locked teaser for something upcoming.</small></span></label>
              </div>
            </fieldset>
            <div class="editor-grid">
              <div class="editor-main">
                <section class="card">
                  <h3 class="card-title">Basics</h3>
                  <label class="field"><span class="field-label">Title <em class="counter" data-counter-for="postTitle"></em></span><input id="postTitle" maxlength="140" required placeholder="Post title"></label>
                  <label class="field"><span class="field-label">URL name</span><span class="prefixed"><span class="prefix">/journal/posts/</span><input id="postSlug" maxlength="90" required placeholder="post-url-name" spellcheck="false" autocapitalize="off"></span><small class="field-hint" id="slugHint">Created from the title. Lowercase letters, numbers, and dashes.</small></label>
                  <label class="field"><span class="field-label"><span id="descriptionLabel">Short description</span> <em class="counter" data-counter-for="postDescription"></em></span><textarea id="postDescription" maxlength="320" required rows="4" placeholder="A clean summary shown below the title."></textarea></label>
                  <div class="row">
                    <label class="field"><span class="field-label">Date</span><input id="postDate" type="date" required></label>
                    <label class="field"><span class="field-label">Tags</span><input id="postTags" placeholder="Website, CloudLab Studio"></label>
                    <label class="field"><span class="field-label">Thumbnail fit</span><select id="postFit"><option value="cover">Fill the frame</option><option value="contain">Show the whole image</option></select></label>
                  </div>
                </section>
                <section class="card">
                  <h3 class="card-title">Images and video</h3>
                  <div class="row">
                    <label class="dropzone" data-dropzone><input id="postThumbnail" type="file" accept="image/*,video/*"><span class="dropzone-copy"><strong>Card thumbnail</strong><small id="thumbCurrent">Drop a file or click to choose</small></span></label>
                    <label class="dropzone" data-dropzone id="heroZone"><input id="postHero" type="file" accept="image/*,video/*"><span class="dropzone-copy"><strong>Article hero</strong><small id="heroCurrent">Uses the thumbnail when empty</small></span></label>
                  </div>
                  <p class="field-hint">Photos are optimized automatically before upload. Videos and GIFs: up to 10 MB each, 30 MB per publish.</p>
                </section>
                <section class="card" id="articleFields">
                  <div class="card-title-row"><h3 class="card-title">Article sections</h3><button class="btn sm ghost" type="button" id="addSection">${icon('plus')}Add section</button></div>
                  <p class="field-hint">Each section can have a heading, text, and images or videos. Leave a blank line between paragraphs.</p>
                  <div class="sections" id="sections"></div>
                </section>
              </div>
              <aside class="editor-side">
                <div class="side-sticky">
                  <section class="preview-card" aria-label="Journal card preview">
                    <div class="preview-label"><span>Card preview</span><span id="previewModeBadge">Full post</span></div>
                    <div class="journal-preview">
                      <div class="journal-preview-media" id="cardPreviewMedia"><span>No thumbnail yet</span></div>
                      <div class="journal-preview-body">
                        <div class="journal-preview-meta"><span id="cardPreviewTag">JOURNAL</span><time id="cardPreviewDate">Today</time></div>
                        <h3 id="cardPreviewTitle">Your post title</h3>
                        <p id="cardPreviewDescription">Your short description will appear here.</p>
                        <strong id="cardPreviewAction">Read post →</strong>
                      </div>
                    </div>
                  </section>
                  <p class="side-note" id="modeHelpText">Readers can open the card and read the complete article.</p>
                </div>
              </aside>
            </div>
            <div class="action-bar">
              <span class="save-state" id="postSaveState" data-state="clean">No unsaved changes</span>
              <div class="action-buttons">
                <button class="btn danger-ghost" type="button" id="unpublishPost" hidden>Unpublish</button>
                <button class="btn ghost" type="button" id="previewPost">Preview</button>
                <button class="btn primary" type="submit" id="publishPost">Publish full post</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>`;

const projectsView = `
    <section class="view" data-view="projects" aria-label="Projects" hidden>
      ${viewHead('Homepage', 'Projects', 'Cards in the homepage project slider. Drafts stay hidden until you publish them.', `<button class="btn primary" type="button" id="newProject">${icon('plus')}New project</button>${externalLink('https://danny4686.com/#projects', 'View on homepage')}`)}
      <div class="split">
        <aside class="panel list-pane" aria-label="Projects">
          <div class="list-tools"><p class="list-caption" id="projectsCaption">Loading projects…</p></div>
          <div class="list" id="projectList" aria-busy="true"><span class="sr-only">Loading projects…</span><div class="skeleton-row" aria-hidden="true"><span class="skeleton"></span><span><span class="skeleton"></span><span class="skeleton"></span></span></div><div class="skeleton-row" aria-hidden="true"><span class="skeleton"></span><span><span class="skeleton"></span><span class="skeleton"></span></span></div><div class="skeleton-row" aria-hidden="true"><span class="skeleton"></span><span><span class="skeleton"></span><span class="skeleton"></span></span></div></div>
        </aside>
        <div class="editor-pane">
          <form id="projectForm" class="editor" novalidate>
            <div class="editor-head">
              <div><p class="eyebrow" id="projectEyebrow">New project</p><h2 id="projectEditorTitle">Create a project</h2></div>
              <label class="switch"><input id="projectPublished" type="checkbox" checked><span class="track" aria-hidden="true"></span><span class="switch-label" id="projectPublishedLabel">Published</span></label>
            </div>
            <div class="editor-grid">
              <div class="editor-main">
                <section class="card">
                  <h3 class="card-title">Content</h3>
                  <label class="field"><span class="field-label">Project name <em class="counter" data-counter-for="projectTitle"></em></span><input id="projectTitle" maxlength="90" required placeholder="CloudLab"></label>
                  <div class="row">
                    <label class="field"><span class="field-label">Category</span><input id="projectKicker" maxlength="40" placeholder="COMMUNITY"></label>
                    <label class="field"><span class="field-label">Status badge</span><input id="projectBadge" maxlength="28" placeholder="IN DEVELOPMENT"></label>
                  </div>
                  <label class="field"><span class="field-label">Description <em class="counter" data-counter-for="projectDescription"></em></span><textarea id="projectDescription" maxlength="1200" rows="5" required placeholder="What are you building?"></textarea></label>
                </section>
                <section class="card">
                  <h3 class="card-title">Link</h3>
                  <div class="row">
                    <label class="field"><span class="field-label">Project link</span><input id="projectUrl" maxlength="600" placeholder="https://… or /page/" spellcheck="false" autocapitalize="off"><small class="field-hint" id="projectUrlHint">Optional. Leave empty for a card without a link.</small></label>
                    <label class="field"><span class="field-label">Button text</span><input id="projectButtonLabel" maxlength="40" placeholder="Open project"></label>
                  </div>
                  <div class="toggle-list">
                    <label class="switch"><input id="projectShowButton" type="checkbox" checked><span class="track" aria-hidden="true"></span><span class="switch-label"><strong>Show button</strong><small>Adds a button when a link is set.</small></span></label>
                    <label class="switch"><input id="projectClickable" type="checkbox"><span class="track" aria-hidden="true"></span><span class="switch-label"><strong>Whole card is clickable</strong><small>Clicking anywhere on the card opens the link.</small></span></label>
                    <label class="switch"><input id="projectNewTab" type="checkbox" checked><span class="track" aria-hidden="true"></span><span class="switch-label"><strong>Open in a new tab</strong><small>Best for Roblox, Discord, and other sites.</small></span></label>
                  </div>
                </section>
                <section class="card">
                  <h3 class="card-title">Look</h3>
                  <div class="field"><span class="field-label">Accent colour</span>
                    <div class="swatches" role="radiogroup" aria-label="Accent colour">
                      <label class="swatch accent-cyan"><input type="radio" name="projectAccent" value="cyan" checked><span>Cyan</span></label>
                      <label class="swatch accent-gold"><input type="radio" name="projectAccent" value="gold"><span>Gold</span></label>
                      <label class="swatch accent-mint"><input type="radio" name="projectAccent" value="mint"><span>Mint</span></label>
                      <label class="swatch accent-orange"><input type="radio" name="projectAccent" value="orange"><span>Orange</span></label>
                    </div>
                  </div>
                  <div class="row">
                    <label class="field"><span class="field-label">Image size</span><select id="projectLayout"><option value="media-top">Standard (16:9)</option><option value="compact">Compact (shorter image)</option></select></label>
                    <label class="field"><span class="field-label">Image fit</span><select id="projectFit"><option value="cover">Fill the frame</option><option value="contain">Show the whole image</option></select></label>
                  </div>
                  <div class="image-field">
                    <label class="dropzone" data-dropzone><input id="projectImage" type="file" accept="image/png,image/jpeg,image/webp"><span class="dropzone-copy"><strong>Project image</strong><small id="projectImageCurrent">Drop an image or click to choose · PNG, JPG, or WebP · optimized automatically</small></span></label>
                    <button class="btn ghost sm" type="button" id="projectRemoveImage" hidden>Remove image</button>
                  </div>
                </section>
              </div>
              <aside class="editor-side">
                <div class="side-sticky">
                  <section class="preview-card" aria-label="Project card preview">
                    <div class="preview-label"><span>Card preview</span><span id="projectPreviewState">Published</span></div>
                    <article class="project-preview" id="projectPreview">
                      <div class="project-preview-media" id="projectPreviewMedia"><span>No image</span></div>
                      <div class="project-preview-body">
                        <div class="project-preview-meta"><span id="projectPreviewKicker">PROJECT</span><em id="projectPreviewBadge" hidden></em></div>
                        <h3 id="projectPreviewTitle">Your project</h3>
                        <p id="projectPreviewDescription">The project description will appear here.</p>
                        <b id="projectPreviewButton">Open project</b>
                      </div>
                    </article>
                  </section>
                </div>
              </aside>
            </div>
            <div class="action-bar">
              <span class="save-state" id="projectSaveState" data-state="clean">No unsaved changes</span>
              <div class="action-buttons">
                <button class="btn danger-ghost" type="button" id="deleteProject" hidden>Delete</button>
                <button class="btn ghost" type="button" id="discardProject">Discard changes</button>
                <button class="btn primary" type="submit" id="saveProject">Save project</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>`;

const homepageView = `
    <section class="view" data-view="homepage" aria-label="Homepage" hidden>
      ${viewHead('Homepage', 'Portrait and artwork', 'Choose what the big homepage portrait shows. Switching saves straight away.', externalLink('https://danny4686.com/', 'View homepage'))}
      <section class="panel">
        <header class="panel-head"><div><h2>Homepage portrait shows</h2><p id="portraitHint">Loading the current setting…</p></div></header>
        <div class="choice-grid" role="radiogroup" aria-label="Homepage portrait">
          <button class="choice" type="button" role="radio" aria-checked="false" data-portrait="image">
            <span class="choice-media"><img id="portraitArtImage" alt="Your profile artwork"></span>
            <span class="choice-copy"><strong>Profile image</strong><small>Your uploaded artwork. Your Roblox avatar is not shown anywhere.</small></span>
            <span class="choice-check" aria-hidden="true"></span>
          </button>
          <button class="choice" type="button" role="radio" aria-checked="false" data-portrait="roblox">
            <span class="choice-media"><img id="portraitRobloxImage" alt="Your current Roblox avatar"><span class="choice-empty" id="robloxUnavailable" hidden>Roblox is not returning your avatar right now</span></span>
            <span class="choice-copy"><strong>Roblox avatar</strong><small>A live render of Danny4686. It updates on its own when you change your avatar.</small></span>
            <span class="choice-check" aria-hidden="true"></span>
          </button>
        </div>
      </section>
      <section class="panel">
        <header class="panel-head"><div><h2>Profile artwork</h2><p>Used in the portrait when "Profile image" is selected, and always in the Stay connected section.</p></div><button class="btn ghost sm" type="button" id="restoreArtwork">Restore original</button></header>
        <div class="artwork-editor">
          <div class="artwork-preview"><img id="artworkPreview" alt="Profile artwork preview"></div>
          <div class="artwork-controls">
            <label class="dropzone tall" data-dropzone><input id="artworkInput" type="file" accept="image/png,image/jpeg,image/webp"><span class="dropzone-copy"><strong>Choose new artwork</strong><small id="artworkFileText">PNG, JPG, or WebP · optimized automatically. Transparent artwork looks best.</small></span></label>
            <p class="field-hint" id="artworkPath"></p>
            <div class="inline-actions"><button class="btn primary" type="button" id="saveArtwork" disabled>Save artwork</button><button class="btn ghost" type="button" id="cancelArtwork" disabled>Cancel</button></div>
          </div>
        </div>
      </section>
    </section>`;

const arcadeView = `
    <section class="view" data-view="arcade" aria-label="Arcade" hidden>
      ${viewHead('Arcade', 'Featured games', 'Choose 1 to 6 games and the order they appear at the top of the CloudLab Arcade.', externalLink('https://danny4686.com/games/', 'Open arcade'))}
      <div class="arcade-layout">
        <section class="panel">
          <header class="panel-head"><div><h2>All games</h2><p>Click a game to add or remove it.</p></div><span class="count-pill" id="featuredCount">0 / 6</span></header>
          <div class="game-grid" id="gameGrid"></div>
        </section>
        <section class="panel">
          <header class="panel-head"><div><h2>Display order</h2><p>Number 1 is shown first. Drag or use the arrows.</p></div></header>
          <ol class="order-list" id="featuredOrder"></ol>
        </section>
      </div>
      <div class="action-bar floating">
        <span class="save-state" id="arcadeSaveState" data-state="clean">Lineup saved</span>
        <div class="action-buttons"><button class="btn ghost" type="button" id="resetArcade">Discard changes</button><button class="btn primary" type="button" id="saveArcade">Save lineup</button></div>
      </div>
    </section>`;

const abyssView = `
    <section class="view" data-view="abyss" aria-label="Fresh Abyss" hidden>
      ${viewHead('Hidden page', 'Fresh Abyss', 'Control the secret page and the image, GIF, or video it shows.', externalLink('https://danny4686.com/fresh_abyss/', 'Open Fresh Abyss'))}
      <div class="abyss-layout">
        <div class="stack">
          <section class="panel">
            <label class="switch big"><input id="abyssEnabled" type="checkbox"><span class="track" aria-hidden="true"></span><span class="switch-label"><strong>Page is visible</strong><small>When off, the URL shows the normal 404 page.</small></span></label>
          </section>
          <section class="panel">
            <header class="panel-head"><div><h2>Media</h2><p>Uploading is best, because links (especially Discord links) can expire.</p></div></header>
            <label class="dropzone" data-dropzone><input id="abyssFile" type="file" accept="image/*,video/*,.gif"><span class="dropzone-copy"><strong>Upload media</strong><small id="abyssFileText">Images, GIFs, and videos up to 30 MB</small></span></label>
            <div class="divider"><span>or use a link</span></div>
            <div class="row">
              <label class="field"><span class="field-label">Media link</span><input id="abyssUrl" type="url" inputmode="url" placeholder="https://example.com/media.mp4" spellcheck="false"></label>
              <label class="field"><span class="field-label">Link type</span><select id="abyssType"><option value="">Detect automatically</option><option value="image">Image or GIF</option><option value="video">Video</option></select></label>
            </div>
            <p class="field-hint">An upload takes priority over the link. Videos start muted and looped.</p>
          </section>
        </div>
        <section class="panel abyss-preview-panel">
          <header class="panel-head"><div><h2>Preview</h2><p id="abyssUpdated">Loading…</p></div><span class="count-pill" id="abyssState">…</span></header>
          <div class="abyss-preview" id="abyssPreview"><span>Loading media…</span></div>
        </section>
      </div>
      <div class="action-bar floating">
        <span class="save-state" id="abyssSaveState" data-state="clean">No unsaved changes</span>
        <div class="action-buttons"><button class="btn ghost" type="button" id="resetAbyss">Discard changes</button><button class="btn primary" type="button" id="saveAbyss">Save Fresh Abyss</button></div>
      </div>
    </section>`;

const siteView = `
    <section class="view" data-view="site" aria-label="Site controls" hidden>
      ${viewHead('Website', 'Site controls', 'Emergency close, the loading intro, and the health of the admin service.')}
      <section class="status-hero big" data-site-state="loading" aria-live="polite">
        <div class="status-hero-main">
          <span class="status-orb" aria-hidden="true"></span>
          <div><p class="eyebrow">Website status</p><h2 data-site-title>Checking website status…</h2><p data-site-text>One moment.</p></div>
        </div>
        <div class="status-hero-actions">
          <button class="btn danger lg" type="button" data-action="close-site" hidden>${icon('power')}Emergency close</button>
          <button class="btn success lg" type="button" data-action="open-site" hidden>${icon('power')}Reopen website</button>
        </div>
      </section>
      <div class="site-grid">
        <section class="panel">
          <header class="panel-head"><div><h2>Where closed visitors go</h2><p>While the site is closed, every page on danny4686.com sends visitors here.</p></div></header>
          <label class="field"><span class="field-label">Redirect link</span><input id="redirectUrl" type="url" inputmode="url" spellcheck="false" autocapitalize="off" placeholder="https://www.roblox.com/users/178415120/profile"><small class="field-hint" id="redirectHint">Must be a full https:// link to another website.</small></label>
          <div class="inline-actions"><button class="btn primary" type="button" id="saveRedirect" disabled>Save link</button><a class="btn ghost" id="testRedirect" href="https://www.roblox.com/users/178415120/profile" target="_blank" rel="noopener">Test link${icon('external', 'icon sm')}</a><button class="btn ghost" type="button" id="defaultRedirect">Use Roblox profile</button></div>
          <ul class="facts">
            <li>Closing takes effect within seconds. There is no deploy to wait for.</li>
            <li>The admin panel stays reachable, so you can reopen at any time.</li>
            <li>A backup copy is also saved to GitHub, so the site stays closed even if the live service has a problem.</li>
          </ul>
        </section>
        <div class="stack">
          <section class="panel">
            <header class="panel-head"><div><h2>Loading intro</h2><p>The animated Earth intro normally plays at most once an hour.</p></div></header>
            <label class="switch big"><input id="forceIntro" type="checkbox" disabled><span class="track" aria-hidden="true"></span><span class="switch-label"><strong>Play on every page load</strong><small id="forceIntroHint">Saves as soon as you flip it.</small></span></label>
          </section>
          <section class="panel">
            <header class="panel-head"><div><h2>Admin health</h2><p>Checks that publishing and sign-in are set up.</p></div><button class="btn ghost sm" type="button" id="refreshHealth">Re-check</button></header>
            <ul class="health" id="healthList"><li class="muted">Checking…</li></ul>
          </section>
        </div>
      </div>
    </section>`;

export function dashboardPage(login) {
  const name = escapeHtml(login);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <meta name="theme-color" content="#050f14">
  <title>CloudLab Admin</title>
  <link rel="icon" href="https://danny4686.com/favicon.ico" sizes="16x16 32x32 48x48">
  <link rel="icon" href="https://danny4686.com/assets/icons/favicon-48x48.png" type="image/png" sizes="48x48">
  <link rel="apple-touch-icon" href="https://danny4686.com/assets/icons/apple-touch-icon.png" sizes="180x180">
  <link rel="preload" href="https://danny4686.com/assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/admin.css">
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="app">
    <aside class="sidebar" id="sidebar" aria-label="Admin navigation">
      <div class="brand">
        <img src="https://danny4686.com/assets/images/optimized/cloudlab-logo-256.webp" width="40" height="40" alt="">
        <span><strong>CloudLab Admin</strong><small>danny4686.com</small></span>
        <button class="icon-btn sidebar-close" type="button" id="closeMenu" aria-label="Close menu">${icon('close')}</button>
      </div>
      <nav class="nav" aria-label="Admin sections">${navLinks()}
      </nav>
      <div class="sidebar-status" data-site-state="loading">
        <span class="sidebar-status-row"><span class="dot" aria-hidden="true"></span><span data-site-short>Checking…</span></span>
        <button class="btn danger sm block" type="button" data-action="close-site" hidden>${icon('power', 'icon sm')}Emergency close</button>
        <button class="btn success sm block" type="button" data-action="open-site" hidden>${icon('power', 'icon sm')}Reopen website</button>
      </div>
      <div class="sidebar-user">
        <span class="avatar" aria-hidden="true">${name.slice(0, 1).toUpperCase()}</span>
        <span class="user-name"><strong>${name}</strong><small id="sessionText">Signed in</small></span>
        <a class="btn ghost sm" href="/auth/logout">Sign out</a>
      </div>
    </aside>
    <div class="scrim" id="scrim" hidden></div>
    <div class="main">
      <div class="closed-banner" id="closedBanner" role="alert" hidden>
        <span><strong>The website is closed.</strong> Every visitor is being sent to <a id="closedTarget" href="https://www.roblox.com/users/178415120/profile" target="_blank" rel="noopener">your Roblox profile</a>.</span>
        <button class="btn sm light" type="button" data-action="open-site">Reopen now</button>
      </div>
      <header class="topbar">
        <button class="icon-btn menu-btn" type="button" id="openMenu" aria-label="Open menu" aria-controls="sidebar" aria-expanded="false">${icon('menu')}</button>
        <h2 class="topbar-title" id="topbarTitle">Overview</h2>
        <div class="topbar-right">
          <div class="deploy">
            <button class="deploy-pill" type="button" id="deployPill" data-state="idle" aria-expanded="false" aria-controls="deployPanel"><span class="dot" aria-hidden="true"></span><span id="deployText">Up to date</span></button>
            <div class="deploy-panel" id="deployPanel" hidden><p class="deploy-empty" id="deployEmpty">Changes you save show up here until they are live on the website.</p><ol id="deployList"></ol></div>
          </div>
          <a class="btn ghost sm hide-sm" href="https://danny4686.com/" target="_blank" rel="noopener">View site${icon('external', 'icon sm')}</a>
        </div>
      </header>
      <main class="content" id="main" tabindex="-1">
${overviewView}
${journalView}
${projectsView}
${homepageView}
${arcadeView}
${abyssView}
${siteView}
      </main>
    </div>
  </div>
  <div class="toasts" id="toasts" aria-live="polite" aria-atomic="false"></div>
  <dialog class="dialog" id="confirmDialog" aria-labelledby="confirmTitle">
    <form method="dialog">
      <h2 id="confirmTitle">Are you sure?</h2>
      <p id="confirmText"></p>
      <div class="dialog-actions"><button class="btn ghost" value="cancel" id="confirmCancel">Cancel</button><button class="btn primary" value="ok" id="confirmOk">Confirm</button></div>
    </form>
  </dialog>
  <dialog class="dialog wide" id="previewDialog" aria-label="Post preview">
    <div class="dialog-bar"><strong>Post preview</strong><button class="icon-btn" type="button" id="closePreview" aria-label="Close preview">${icon('close')}</button></div>
    <div class="preview" id="previewContent"></div>
  </dialog>
  <script src="/admin.js"></script>
</body>
</html>`;
}
