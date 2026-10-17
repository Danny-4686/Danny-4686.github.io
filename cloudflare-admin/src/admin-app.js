// Client code for the admin dashboard (served as /admin.js).
// It is kept in a String.raw template, so it must not contain backticks or "${".
export const ADMIN_JS = String.raw`
(function () {
  'use strict';

  var SITE = 'https://danny4686.com';
  var DEFAULT_REDIRECT = 'https://www.roblox.com/users/178415120/profile';
  var DEFAULT_PROFILE = '/assets/images/optimized/profile-600.webp';
  var DRAFT_KEY = 'cloudlab-admin:journal-draft';
  var TITLES = { overview: 'Overview', journal: 'Journal', projects: 'Projects', homepage: 'Homepage', arcade: 'Arcade', abyss: 'Fresh Abyss', site: 'Site controls' };
  var GAMES = [
    { id: 'breakout', name: 'Breakout', category: 'Arcade', emoji: '🧱' },
    { id: 'connect-four', name: 'Connect Four', category: 'Strategy', emoji: '🔴' },
    { id: 'cloud-hopper', name: 'Cloud Hopper', category: 'Arcade', emoji: '☁️' },
    { id: 'cloudlab-clicker', name: 'CloudLab Clicker', category: 'Arcade', emoji: '🖱️' },
    { id: 'launcher', name: 'Launcher', category: 'Physics', emoji: '🚀' },
    { id: 'flappy-cloud', name: 'Flappy Cloud', category: 'Arcade', emoji: '🐦' },
    { id: 'tower-stacker', name: 'Tower Stacker', category: 'Arcade', emoji: '🏗️' },
    { id: 'snake', name: 'Snake', category: 'Arcade', emoji: '🐍' },
    { id: '2048', name: '2048', category: 'Puzzle', emoji: '🔢' },
    { id: 'memory-match', name: 'Memory Match', category: 'Memory', emoji: '🧠' },
    { id: 'pong', name: 'Pong', category: 'Arcade', emoji: '🏓' },
    { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', category: 'Strategy', emoji: '❌' },
    { id: 'minesweeper', name: 'Minesweeper', category: 'Strategy', emoji: '💣' },
    { id: 'whack-a-cloud', name: 'Whack-a-Cloud', category: 'Arcade', emoji: '🔨' },
    { id: 'reflex-lab', name: 'Reflex Lab', category: 'Arcade', emoji: '⚡' },
    { id: 'pattern-pulse', name: 'Pattern Pulse', category: 'Memory', emoji: '🎵' },
    { id: 'sky-dodge', name: 'Sky Dodge', category: 'Arcade', emoji: '🌩️' },
    { id: 'slide-puzzle', name: 'Slide Puzzle', category: 'Puzzle', emoji: '🧩' }
  ];
  var ACCENTS = { cyan: '#68d0df', gold: '#f2c75c', mint: '#8bcf9b', orange: '#ed8b45' };

  var app = { csrf: '', login: '', expiresAt: 0, site: null, settings: null, posts: null, projects: null, portrait: null, abyss: null, activity: null, health: null };

  /* ---------- Small helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function qs(selector, root) { return (root || document).querySelector(selector); }
  function qsa(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }
  function publicUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return SITE + '/' + String(path).replace(/^\/+/, '');
  }
  function slugify(value) { return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90); }
  function plural(count, one, many) { return count + ' ' + (count === 1 ? one : (many || one + 's')); }
  function relTime(value) {
    var time = new Date(value).getTime();
    if (!value || isNaN(time)) return '';
    var seconds = Math.round((Date.now() - time) / 1000);
    if (seconds < 45) return 'just now';
    var minutes = Math.round(seconds / 60);
    if (minutes < 60) return plural(minutes, 'min') + ' ago';
    var hours = Math.round(minutes / 60);
    if (hours < 24) return plural(hours, 'hour') + ' ago';
    var days = Math.round(hours / 24);
    if (days < 30) return plural(days, 'day') + ' ago';
    return new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function readableDay(value) {
    if (!value) return 'Today';
    var date = new Date(value + 'T12:00:00');
    return isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function today() {
    var now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  function cardSummary(value) {
    var text = String(value || '').replace(/\s+/g, ' ').trim();
    if (text.length <= 320) return text;
    var slice = text.slice(0, 319);
    var breakAt = slice.lastIndexOf(' ');
    return slice.slice(0, breakAt >= Math.floor(319 * 0.68) ? breakAt : 319).trimEnd() + '…';
  }
  function fileSize(bytes) { return bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB'; }
  function debounce(fn, wait) {
    var timer = 0;
    return function () { var args = arguments; clearTimeout(timer); timer = setTimeout(function () { fn.apply(null, args); }, wait); };
  }
  function hostAndPath(url) {
    try { var parsed = new URL(url); return parsed.hostname.replace(/^www\./, '') + (parsed.pathname === '/' ? '' : parsed.pathname); }
    catch (error) { return url; }
  }
  function storage(action, key, value) {
    try {
      if (action === 'get') return JSON.parse(localStorage.getItem(key) || 'null');
      if (action === 'set') localStorage.setItem(key, JSON.stringify(value));
      if (action === 'remove') localStorage.removeItem(key);
    } catch (error) { return null; }
    return null;
  }
  function setLoading(button, loading) {
    if (!button) return;
    button.classList.toggle('is-loading', loading);
    button.disabled = loading;
    button.setAttribute('aria-busy', String(loading));
  }
  function setSaveState(node, state, text) { node.dataset.state = state; node.textContent = text; }
  function navIcon(name) { var svg = qs('.nav-link[data-nav="' + name + '"] svg'); return svg ? svg.cloneNode(true) : el('span'); }
  function isImagePath(path) { return !/\.(mp4|webm|mov|m4v|ogv|ogg)(?:$|[?#])/i.test(String(path || '')); }
  function validSlug(value) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value); }
  function mediaNode(source, isVideo, alt) {
    var node = el(isVideo ? 'video' : 'img');
    node.src = source;
    if (isVideo) { node.muted = true; node.loop = true; node.playsInline = true; node.autoplay = true; }
    else { node.alt = alt || ''; node.decoding = 'async'; }
    return node;
  }

  // Big photos and screenshots are shrunk and re-encoded as WebP in the browser before
  // upload, so the website stays fast. GIFs, videos, and files that would not get
  // smaller are uploaded untouched.
  async function optimizeImage(file, maxSide) {
    if (!file || !/^image\/(png|jpeg|webp)$/i.test(file.type) || !window.createImageBitmap) return file;
    try {
      var bitmap = await createImageBitmap(file);
      var scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      var width = Math.round(bitmap.width * scale), height = Math.round(bitmap.height * scale);
      var canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      var context = canvas.getContext('2d');
      context.imageSmoothingQuality = 'high';
      context.drawImage(bitmap, 0, 0, width, height);
      if (bitmap.close) bitmap.close();
      var blob = await new Promise(function (resolve) { canvas.toBlob(resolve, 'image/webp', 0.86); });
      if (!blob || blob.type !== 'image/webp' || (blob.size >= file.size && scale === 1)) return file;
      return new File([blob], file.name.replace(/\.[a-z0-9]+$/i, '') + '.webp', { type: 'image/webp', lastModified: Date.now() });
    } catch (error) { return file; }
  }
  async function optimizeAll(files, maxSide) {
    var output = [];
    for (var i = 0; i < files.length; i += 1) output.push(await optimizeImage(files[i], maxSide));
    return output;
  }
  function savedBytes(before, after) {
    var a = before.reduce(function (sum, file) { return sum + (file ? file.size : 0); }, 0);
    var b = after.reduce(function (sum, file) { return sum + (file ? file.size : 0); }, 0);
    return a - b > 51200 ? 'Images optimized: ' + fileSize(a) + ' → ' + fileSize(b) + '. ' : '';
  }

  /* ---------- API ---------- */
  async function api(url, options) {
    options = options || {};
    var init = { method: options.method || 'GET', headers: {}, credentials: 'same-origin' };
    if (init.method !== 'GET') init.headers['X-CSRF-Token'] = app.csrf;
    if (options.json !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(options.json); }
    else if (options.body) init.body = options.body;
    var response;
    try { response = await fetch(url, init); }
    catch (error) { throw new Error('Could not reach the admin server. Check your connection and try again.'); }
    var data = await response.json().catch(function () { return {}; });
    if (response.status === 401) { showSessionEnded(); throw new Error('Your session has ended. Sign in again to continue.'); }
    if (!response.ok) { var failure = new Error(data.error || 'Something went wrong (' + response.status + ').'); failure.status = response.status; throw failure; }
    return data;
  }

  /* ---------- Toasts ---------- */
  function toast(kind, title, detail, options) {
    options = options || {};
    var host = $('toasts');
    while (host.children.length >= 4) host.firstElementChild.remove();
    var node = el('div', 'toast ' + kind);
    node.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    var icon = el('span', 'toast-icon');
    var heading = el('strong', null, title);
    var close = el('button', 'toast-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Dismiss');
    var text = el('p', null, detail || '');
    text.hidden = !detail;
    node.append(icon, heading, close, text);
    var timer = 0;
    function iconFor(value) { return value === 'success' ? '✓' : value === 'error' ? '!' : value === 'info' ? 'i' : ''; }
    function dismiss() { clearTimeout(timer); node.classList.add('leaving'); setTimeout(function () { node.remove(); }, 200); }
    function schedule(value) { clearTimeout(timer); if (value !== 'loading') timer = setTimeout(dismiss, value === 'error' ? 10000 : (options.duration || 5000)); }
    function addAction(action) {
      if (!action) return;
      var button = el('button', 'btn sm ghost toast-action', action.label);
      button.type = 'button';
      button.onclick = function () { dismiss(); action.run(); };
      node.appendChild(button);
    }
    icon.textContent = iconFor(kind);
    close.onclick = dismiss;
    addAction(options.action);
    host.appendChild(node);
    schedule(kind);
    return {
      update: function (value, newTitle, newDetail, extra) {
        node.className = 'toast ' + value;
        node.setAttribute('role', value === 'error' ? 'alert' : 'status');
        icon.textContent = iconFor(value);
        heading.textContent = newTitle;
        text.textContent = newDetail || '';
        text.hidden = !newDetail;
        addAction(extra && extra.action);
        schedule(value);
      },
      dismiss: dismiss
    };
  }

  /* ---------- Dialogs ---------- */
  function confirmAction(options) {
    return new Promise(function (resolve) {
      var dialog = $('confirmDialog');
      var ok = $('confirmOk');
      var cancel = $('confirmCancel');
      dialog.className = 'dialog' + (options.tone === 'danger' ? ' danger' : '');
      $('confirmTitle').textContent = options.title;
      $('confirmText').textContent = options.text || '';
      ok.className = 'btn ' + (options.tone === 'danger' ? 'danger' : options.tone === 'success' ? 'success' : 'primary');
      ok.textContent = options.confirm || 'Confirm';
      cancel.textContent = options.cancel || 'Cancel';
      cancel.hidden = options.cancel === false;
      dialog.returnValue = '';
      dialog.onclose = function () { resolve(dialog.returnValue === 'ok'); };
      dialog.showModal();
      (options.focusConfirm ? ok : cancel).focus();
    });
  }

  var sessionDialogOpen = false;
  function showSessionEnded() {
    if (sessionDialogOpen) return;
    sessionDialogOpen = true;
    confirmAction({ title: 'Your session has ended', text: 'Sign in again to keep working. Unsaved Journal text is kept as a draft on this device.', confirm: 'Sign in again', cancel: 'Stay here', focusConfirm: true }).then(function (ok) {
      sessionDialogOpen = false;
      if (ok) window.location.href = '/auth/login';
    });
  }

  /* ---------- Deploy tracker ---------- */
  var deploys = [];
  function trackDeploy(commit, label) {
    if (!commit || !commit.verify) return;
    deploys = deploys.filter(function (item) {
      var replaced = item.path === commit.verify.path && item.state === 'pending';
      if (replaced) clearTimeout(item.timer);
      return !replaced;
    });
    var deploy = { label: label, url: commit.url, path: commit.verify.path, blob: commit.verify.blob || '', deleted: Boolean(commit.verify.deleted), started: Date.now(), state: 'pending', timer: 0 };
    deploys.unshift(deploy);
    deploys.slice(10).forEach(function (item) { clearTimeout(item.timer); });
    deploys = deploys.slice(0, 10);
    renderDeploys();
    deploy.timer = setTimeout(function () { checkDeploy(deploy); }, 12000);
  }
  async function checkDeploy(deploy) {
    if (deploy.state !== 'pending') return;
    try {
      var query = '/api/live-check?path=' + encodeURIComponent(deploy.path) + (deploy.deleted ? '&deleted=1' : '&blob=' + encodeURIComponent(deploy.blob));
      var result = await api(query);
      if (result.live) {
        deploy.state = 'live';
        deploy.liveAt = Date.now();
        renderDeploys();
        toast('success', deploy.label + ' is live', 'It is showing on danny4686.com now.');
        setTimeout(renderDeploys, 20000);
        return;
      }
    } catch (error) { /* keep waiting */ }
    var age = Date.now() - deploy.started;
    if (age > 6 * 60000) { deploy.state = 'slow'; renderDeploys(); return; }
    deploy.timer = setTimeout(function () { checkDeploy(deploy); }, age < 90000 ? 5000 : 12000);
  }
  function renderDeploys() {
    var pill = $('deployPill');
    var text = $('deployText');
    var pending = deploys.filter(function (item) { return item.state === 'pending'; }).length;
    var recentLive = deploys.some(function (item) { return item.state === 'live' && Date.now() - item.liveAt < 20000; });
    var slow = deploys.some(function (item) { return item.state === 'slow'; });
    if (pending) { pill.dataset.state = 'pending'; text.textContent = pending === 1 ? 'Publishing…' : 'Publishing ' + pending + ' changes…'; }
    else if (recentLive) { pill.dataset.state = 'live'; text.textContent = 'Live on site'; }
    else if (slow) { pill.dataset.state = 'slow'; text.textContent = 'Deploy is slow'; }
    else { pill.dataset.state = 'idle'; text.textContent = 'Up to date'; }
    var list = $('deployList');
    list.replaceChildren();
    $('deployEmpty').hidden = deploys.length > 0;
    deploys.forEach(function (item) {
      var row = el('li', 'deploy-item');
      row.dataset.state = item.state;
      var status = item.state === 'pending' ? 'Publishing · started ' + relTime(item.started) : item.state === 'live' ? 'Live on danny4686.com' : 'Still not live after 6 minutes. Check GitHub.';
      var small = el('small', null, status + ' · ');
      var link = el('a', null, 'commit');
      link.href = item.url; link.target = '_blank'; link.rel = 'noopener';
      small.appendChild(link);
      row.append(el('span', 'dot'), el('strong', null, item.label), small);
      list.appendChild(row);
    });
  }
  $('deployPill').addEventListener('click', function (event) {
    event.stopPropagation();
    var panel = $('deployPanel');
    panel.hidden = !panel.hidden;
    $('deployPill').setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) renderDeploys();
  });
  document.addEventListener('click', function (event) {
    if (!event.target.closest('.deploy')) { $('deployPanel').hidden = true; $('deployPill').setAttribute('aria-expanded', 'false'); }
  });

  /* ---------- Router ---------- */
  var views = {};
  var currentView = '';
  var lastHash = '';
  function parseHash() {
    var raw = window.location.hash.replace(/^#/, '');
    var parts = raw.split('/');
    var aliases = { 'fresh-abyss': 'abyss', settings: 'site', 'site-intro': 'site' };
    var name = aliases[parts[0]] || parts[0];
    if (!views[name]) name = 'overview';
    var arg = '';
    try { arg = decodeURIComponent(parts.slice(1).join('/')); } catch (error) { arg = ''; }
    return { name: name, arg: arg };
  }
  async function route() {
    var target = parseHash();
    var active = views[currentView];
    var leaving = active && (target.name !== currentView || (target.arg && active.key && target.arg !== active.key()));
    if (leaving && active.isDirty && active.isDirty()) {
      var ok = await confirmAction({ title: 'Discard unsaved changes?', text: 'You have unsaved changes in ' + TITLES[currentView] + '. Leave without saving them?', confirm: 'Discard changes', cancel: 'Keep editing', tone: 'danger' });
      if (!ok) { history.replaceState(null, '', lastHash || '#' + currentView); return; }
      if (active.discard) active.discard();
    }
    showView(target.name, target.arg);
    lastHash = window.location.hash;
  }
  var calmMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function showView(name, arg) {
    // Sections cross-fade where the browser supports view transitions.
    if (currentView && currentView !== name && document.startViewTransition && !calmMotion && !document.hidden) {
      document.startViewTransition(function () { renderView(name, arg); });
      return;
    }
    renderView(name, arg);
  }
  function renderView(name, arg) {
    var changed = currentView !== name;
    qsa('.view').forEach(function (view) { view.hidden = view.dataset.view !== name; });
    qsa('.nav-link').forEach(function (link) {
      if (link.dataset.nav === name) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    $('topbarTitle').textContent = TITLES[name];
    document.title = TITLES[name] + ' · CloudLab Admin';
    currentView = name;
    closeMenu();
    if (changed) window.scrollTo(0, 0);
    if (views[name].show) views[name].show(arg || '');
  }
  function setHash(hash) { history.replaceState(null, '', hash); lastHash = hash; }
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', function (event) {
    var active = views[currentView];
    if (active && active.isDirty && active.isDirty()) { event.preventDefault(); event.returnValue = ''; }
  });
  document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 's') {
      var active = views[currentView];
      if (active && active.save) { event.preventDefault(); active.save(); }
    }
    if (event.key === 'Escape') closeMenu();
    if (event.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) && currentView === 'journal') { event.preventDefault(); $('postSearch').focus(); }
  });

  /* ---------- Mobile menu ---------- */
  function openMenu() { $('sidebar').classList.add('open'); $('scrim').hidden = false; $('openMenu').setAttribute('aria-expanded', 'true'); var current = qs('.nav-link[aria-current="page"]'); if (current) current.focus(); }
  function closeMenu() { if (!$('sidebar').classList.contains('open')) return; $('sidebar').classList.remove('open'); $('scrim').hidden = true; $('openMenu').setAttribute('aria-expanded', 'false'); }
  $('openMenu').addEventListener('click', openMenu);
  $('closeMenu').addEventListener('click', closeMenu);
  $('scrim').addEventListener('click', closeMenu);

  function setBadge(name, text, tone) {
    var badge = qs('[data-badge="' + name + '"]');
    if (!badge) return;
    badge.hidden = text === '' || text === null || text === undefined;
    badge.textContent = text || '';
    badge.className = 'nav-badge' + (tone ? ' ' + tone : '');
  }

  /* ---------- Site status (emergency close) ---------- */
  var siteBusy = false;
  async function loadSiteStatus() {
    try { app.site = await api('/api/site-status'); }
    catch (error) { app.site = app.site || null; if (!app.site) toast('error', 'Could not check the website status', error.message); }
    renderSite();
    renderHealth();
  }
  function renderSite() {
    var site = app.site;
    var state = siteBusy ? 'busy' : !site ? 'loading' : site.open ? 'open' : 'closed';
    qsa('[data-site-state]').forEach(function (node) { node.dataset.siteState = state; });
    var title = !site ? 'Checking website status…' : site.open ? 'Website is live' : 'Website is closed';
    var since = site && site.changedAt ? relTime(site.changedAt) : '';
    var detail = !site ? 'One moment.'
      : site.open ? 'Visitors can use danny4686.com normally.' + (since ? ' Last changed ' + since + '.' : '') + ' If you need to take it down, Emergency close sends everyone to ' + hostAndPath(site.redirect || DEFAULT_REDIRECT) + '.'
      : 'Every page on danny4686.com is sending visitors to ' + hostAndPath(site.redirect) + (since ? ' (closed ' + since + ')' : '') + '. Reopen when you are ready.';
    qsa('[data-site-title]').forEach(function (node) { node.textContent = siteBusy ? 'Updating website status…' : title; });
    qsa('[data-site-text]').forEach(function (node) { node.textContent = detail; });
    qsa('[data-site-short]').forEach(function (node) { node.textContent = !site ? 'Checking…' : site.open ? 'Website is live' : 'Website is CLOSED'; });
    qsa('[data-action="close-site"]').forEach(function (button) { button.hidden = !site || !site.open; button.disabled = siteBusy; });
    qsa('[data-action="open-site"]').forEach(function (button) { button.hidden = !site || site.open; button.disabled = siteBusy; });
    $('closedBanner').hidden = !site || site.open;
    if (site && !site.open) { $('closedTarget').href = site.redirect; $('closedTarget').textContent = hostAndPath(site.redirect); }
    setBadge('site', site && !site.open ? 'Closed' : '', 'off');
    if (site && !redirectDirty) {
      $('redirectUrl').value = site.redirect || DEFAULT_REDIRECT;
      updateRedirectUi();
    }
  }
  async function setSiteOpen(open) {
    if (siteBusy || !app.site) return;
    var target = app.site.redirect || DEFAULT_REDIRECT;
    var ok = await confirmAction(open
      ? { title: 'Reopen the website?', text: 'danny4686.com goes back to normal for everyone within a few seconds.', confirm: 'Reopen website', tone: 'success', focusConfirm: true }
      : { title: 'Close the website now?', text: 'Every page on danny4686.com will immediately send visitors to ' + target + '. The admin panel stays available, so you can reopen whenever you want.', confirm: 'Close website', tone: 'danger', focusConfirm: true });
    if (!ok) return;
    siteBusy = true;
    renderSite();
    var note = toast('loading', open ? 'Reopening the website…' : 'Closing the website…');
    try {
      var result = await api('/api/site-status', { method: 'POST', json: { open: open } });
      siteBusy = false;
      app.site = result;
      renderSite();
      note.update(result.warning ? 'info' : 'success', open ? 'Website reopened' : 'Website closed', result.warning || (open ? 'Visitors can use danny4686.com again.' : 'Visitors are being redirected right now.'));
      if (result.commit) trackDeploy(result.commit, open ? 'Reopen website (backup)' : 'Emergency close (backup)');
      refreshActivitySoon();
    } catch (error) {
      siteBusy = false;
      renderSite();
      note.update('error', open ? 'The website was not reopened' : 'The website was not closed', error.message);
    }
  }
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-action]');
    if (!button) return;
    if (button.dataset.action === 'close-site') setSiteOpen(false);
    if (button.dataset.action === 'open-site') setSiteOpen(true);
  });

  var redirectDirty = false;
  function redirectProblem(value) {
    var url;
    try { url = new URL(value); } catch (error) { return 'Enter a full link, starting with https://'; }
    if (url.protocol !== 'https:') return 'The link must start with https://';
    if (/^(www\.)?danny4686\.com$/i.test(url.hostname)) return 'Pick a page on another website, or visitors would loop forever.';
    return '';
  }
  function updateRedirectUi() {
    var value = $('redirectUrl').value.trim();
    var problem = value ? redirectProblem(value) : 'Enter a link.';
    var saved = app.site ? app.site.redirect : DEFAULT_REDIRECT;
    redirectDirty = value !== saved;
    $('redirectUrl').setAttribute('aria-invalid', String(Boolean(problem) && redirectDirty));
    $('redirectHint').textContent = redirectDirty && problem ? problem : 'Must be a full https:// link to another website.';
    $('redirectHint').classList.toggle('error', Boolean(redirectDirty && problem));
    $('saveRedirect').disabled = !redirectDirty || Boolean(problem) || !app.site;
    $('testRedirect').href = problem ? DEFAULT_REDIRECT : value;
  }
  $('redirectUrl').addEventListener('input', updateRedirectUi);
  $('defaultRedirect').addEventListener('click', function () { $('redirectUrl').value = DEFAULT_REDIRECT; updateRedirectUi(); });
  async function saveRedirect() {
    var button = $('saveRedirect');
    if (button.disabled) return;
    setLoading(button, true);
    try {
      var result = await api('/api/site-status', { method: 'POST', json: { open: app.site.open, redirect: $('redirectUrl').value.trim() } });
      redirectDirty = false;
      app.site = result;
      toast('success', 'Redirect link saved', 'Closed-site visitors will go to ' + hostAndPath(result.redirect) + '.');
      if (result.commit) trackDeploy(result.commit, 'Closed-site redirect');
    } catch (error) { toast('error', 'The redirect link was not saved', error.message); }
    setLoading(button, false);
    renderSite();
  }
  $('saveRedirect').addEventListener('click', saveRedirect);

  /* ---------- Overview ---------- */
  function statTile(name, label, value, note) {
    var tile = el('a', 'stat');
    tile.href = '#' + name;
    var head = el('span', 'stat-label');
    head.append(navIcon(name), document.createTextNode(label));
    var big = el('span', 'stat-value');
    if (value === null) big.appendChild(el('span', 'skeleton'));
    else big.textContent = value;
    tile.append(head, big, el('span', 'stat-note', note || ''));
    return tile;
  }
  function renderOverview() {
    var grid = $('statGrid');
    var posts = app.posts, projects = app.projects, settings = app.settings, portrait = app.portrait, abyss = app.abyss;
    var counts = { article: 0, card: 0, 'coming-soon': 0 };
    (posts || []).forEach(function (post) { counts[postMode(post)] += 1; });
    var live = (projects || []).filter(function (item) { return !item.draft; }).length;
    var featured = settings ? settings.featuredGames || [] : [];
    grid.replaceChildren(
      statTile('journal', 'Journal posts', posts ? String(posts.length) : null, posts ? counts.article + ' full · ' + counts.card + ' post · ' + counts['coming-soon'] + ' soon' : ''),
      statTile('projects', 'Projects live', projects ? String(live) : null, projects ? (projects.length - live ? plural(projects.length - live, 'draft') : 'No drafts') : ''),
      statTile('homepage', 'Portrait', portrait ? (portrait.profileView === 'roblox' ? 'Roblox' : 'Artwork') : null, portrait ? (portrait.profileView === 'roblox' ? 'Live Roblox avatar' : 'Uploaded profile image') : ''),
      statTile('arcade', 'Featured games', settings ? featured.length + ' / 6' : null, settings ? featured.map(gameName).slice(0, 3).join(', ') + (featured.length > 3 ? '…' : '') : ''),
      statTile('abyss', 'Fresh Abyss', abyss ? (abyss.enabled !== false ? 'Visible' : 'Hidden') : null, abyss ? (abyss.mediaType === 'video' ? 'Showing a video' : 'Showing an image') : ''),
      statTile('site', 'Loading intro', settings ? (settings.forceSiteIntro ? 'Every load' : 'Hourly') : null, settings ? (settings.forceSiteIntro ? 'Forced on for all visits' : 'At most once an hour') : '')
    );
  }
  async function loadActivity() {
    try { var data = await api('/api/activity'); app.activity = data.commits || []; }
    catch (error) { app.activity = null; $('activityList').replaceChildren(el('li', 'muted', 'Recent changes could not be loaded. ' + error.message)); return; }
    renderActivity();
  }
  var refreshActivitySoon = debounce(loadActivity, 2500);
  function renderActivity() {
    var list = $('activityList');
    list.replaceChildren();
    if (!app.activity.length) { list.appendChild(el('li', 'muted', 'No changes yet.')); return; }
    app.activity.slice(0, 8).forEach(function (commit) {
      var item = el('li');
      var link = el('a', null, commit.message || 'Update');
      link.href = commit.url; link.target = '_blank'; link.rel = 'noopener'; link.title = commit.message;
      var time = el('time', null, relTime(commit.date));
      time.dateTime = commit.date;
      item.append(link, time, el('small', null, (commit.author ? 'by ' + commit.author + ' · ' : '') + commit.sha.slice(0, 7)));
      list.appendChild(item);
    });
    if (app.activity[0] && app.activity[0].url) $('historyLink').href = app.activity[0].url.replace(/\/commit\/[0-9a-f]+$/, '/commits/main');
  }
  views.overview = { show: function () { renderOverview(); if (app.activity === null) loadActivity(); } };

  /* ---------- Journal ---------- */
  var journal = { current: null, dirty: false, filling: false, filter: 'all', key: 'new', objectUrls: [] };
  var postForm = $('postForm');
  var sectionsHost = $('sections');
  function postMode(post) {
    if (post && post.mode) return post.mode;
    if (post && post.comingSoon) return 'coming-soon';
    if (post && post.cardOnly) return 'card';
    return 'article';
  }
  function modeValue() { var checked = qs('input[name="postMode"]:checked', postForm); return checked ? checked.value : 'article'; }
  function setMode(mode) { var input = qs('input[name="postMode"][value="' + mode + '"]', postForm); if (input) input.checked = true; updateModeUi(); }
  function trackObjectUrl(file) { var url = URL.createObjectURL(file); journal.objectUrls.push(url); return url; }
  function releaseObjectUrls() { journal.objectUrls.forEach(function (url) { URL.revokeObjectURL(url); }); journal.objectUrls = []; }

  async function loadPosts() {
    try { var data = await api('/api/posts'); app.posts = data.posts || []; }
    catch (error) { $('postList').replaceChildren(el('p', 'list-empty', 'Posts could not be loaded. ' + error.message)); return; }
    setBadge('journal', String(app.posts.length));
    renderPostList();
    renderOverview();
  }
  function renderPostList() {
    var list = $('postList');
    if (!app.posts) return;
    list.removeAttribute('aria-busy');
    var query = $('postSearch').value.trim().toLowerCase();
    var counts = { all: app.posts.length, article: 0, card: 0, 'coming-soon': 0 };
    app.posts.forEach(function (post) { counts[postMode(post)] += 1; });
    qsa('#postFilter .chip').forEach(function (chip) {
      chip.setAttribute('aria-pressed', String(chip.dataset.filter === journal.filter));
      chip.querySelector('span').textContent = counts[chip.dataset.filter];
    });
    var filtered = app.posts.filter(function (post) {
      if (journal.filter !== 'all' && postMode(post) !== journal.filter) return false;
      return !query || (post.title + ' ' + post.description + ' ' + (post.body || '') + ' ' + (post.tags || []).join(' ')).toLowerCase().indexOf(query) !== -1;
    });
    list.replaceChildren();
    if (!filtered.length) { list.appendChild(el('p', 'list-empty', query || journal.filter !== 'all' ? 'No posts match.' : 'No posts yet. Write your first one!')); return; }
    filtered.forEach(function (post) {
      var mode = postMode(post);
      var item = el('a', 'list-item');
      item.href = '#journal/' + encodeURIComponent(post.slug);
      if (journal.current && journal.current.slug === post.slug) item.setAttribute('aria-current', 'true');
      var thumb;
      if (post.thumbnail && post.mediaType !== 'video' && isImagePath(post.thumbnail)) { thumb = el('img', 'list-thumb'); thumb.src = publicUrl(post.thumbnail); thumb.alt = ''; thumb.loading = 'lazy'; }
      else thumb = el('span', 'list-thumb');
      var text = el('span', 'list-text');
      var meta = el('small');
      meta.append(el('span', 'tag ' + (mode === 'card' ? 'card' : mode === 'coming-soon' ? 'soon' : ''), mode === 'article' ? 'FULL' : mode === 'card' ? 'POST' : 'SOON'), document.createTextNode(post.displayDate || readableDay(post.date)));
      text.append(el('strong', null, post.title), meta);
      item.append(thumb, text);
      list.appendChild(item);
    });
  }
  $('postSearch').addEventListener('input', renderPostList);
  $('postFilter').addEventListener('click', function (event) {
    var chip = event.target.closest('.chip');
    if (!chip) return;
    journal.filter = chip.dataset.filter;
    renderPostList();
  });

  function updateCounters(root) {
    qsa('[data-counter-for]', root).forEach(function (counter) {
      var field = $(counter.dataset.counterFor);
      if (!field) return;
      var max = Number(field.maxLength) || 0;
      var length = field.value.length;
      counter.textContent = max > 0 ? length + ' / ' + max : '';
      counter.classList.toggle('near', max > 0 && length > max * 0.9 && length < max);
      counter.classList.toggle('full', max > 0 && length >= max);
    });
  }

  function updateModeUi() {
    var mode = modeValue();
    var isArticle = mode === 'article', isCard = mode === 'card';
    var description = $('postDescription');
    $('articleFields').hidden = !isArticle;
    $('heroZone').hidden = !isArticle;
    description.maxLength = isCard ? 20000 : 320;
    description.rows = isCard ? 10 : 4;
    description.placeholder = isCard ? 'Write the full post. A short card preview is made from it automatically.' : 'A clean summary shown below the title.';
    $('descriptionLabel').textContent = isCard ? 'Post text' : 'Short description';
    $('previewModeBadge').textContent = isArticle ? 'Full post' : isCard ? 'Post only' : 'Coming soon';
    $('cardPreviewAction').textContent = isArticle ? 'Read post →' : isCard ? 'Read more' : 'Coming soon';
    $('modeHelpText').textContent = isArticle ? 'Readers open the card to read the complete article on its own page.' : isCard ? 'The card shows a short preview. "Read more" expands the full text right on the Journal page.' : 'The card is visible but marked as upcoming, and it cannot be opened.';
    $('publishPost').textContent = journal.current ? (isArticle ? 'Update full post' : isCard ? 'Update post' : 'Update teaser') : (isArticle ? 'Publish full post' : isCard ? 'Publish post' : 'Publish teaser');
    updateCounters(postForm);
    updateCardPreview();
  }
  function updateCardPreview() {
    var mode = modeValue();
    var title = $('postTitle').value.trim() || 'Your post title';
    var raw = $('postDescription').value.trim();
    var tags = $('postTags').value.split(',').map(function (tag) { return tag.trim(); }).filter(Boolean);
    $('cardPreviewTitle').textContent = title;
    $('cardPreviewDescription').textContent = (mode === 'card' ? cardSummary(raw) : raw) || 'Your short description will appear here.';
    $('cardPreviewTag').textContent = mode === 'coming-soon' ? 'COMING SOON' : mode === 'card' ? 'POST' : (tags[0] || 'JOURNAL').toUpperCase();
    $('cardPreviewDate').textContent = readableDay($('postDate').value);
    var media = $('cardPreviewMedia');
    media.classList.toggle('contain', $('postFit').value === 'contain');
    var file = $('postThumbnail').files[0];
    var current = journal.current;
    var source = '', video = false;
    if (file) { source = journal.thumbUrl || (journal.thumbUrl = trackObjectUrl(file)); video = file.type.indexOf('video/') === 0; }
    else if (current && current.thumbnail) { source = publicUrl(current.thumbnail); video = current.mediaType === 'video' || !isImagePath(current.thumbnail); }
    if (media.dataset.source === source) return;
    media.dataset.source = source;
    media.replaceChildren(source ? mediaNode(source, video, title + ' thumbnail') : el('span', null, 'No thumbnail yet'));
  }
  function updateLiveLink() {
    var current = journal.current;
    var link = $('postLiveLink');
    link.hidden = !current;
    if (current) link.href = postMode(current) === 'article' ? SITE + '/journal/posts/' + current.slug + '/' : SITE + '/journal/';
  }

  function renderSectionMedia(card) {
    var host = qs('.media-chips', card);
    host.replaceChildren();
    card._existing.forEach(function (item, index) {
      var chip = el('span', 'media-chip');
      chip.appendChild(mediaNode(publicUrl(item.path), item.type === 'video', item.alt || ''));
      var remove = el('button', null, '×');
      remove.type = 'button';
      remove.setAttribute('aria-label', 'Remove ' + (item.path || '').split('/').pop());
      remove.onclick = function () { card._existing.splice(index, 1); renderSectionMedia(card); markJournalDirty(); };
      chip.appendChild(remove);
      host.appendChild(chip);
    });
    card._files.forEach(function (file, index) {
      var chip = el('span', 'media-chip is-new');
      chip.title = file.name + ' (new)';
      chip.appendChild(mediaNode(file._url || (file._url = trackObjectUrl(file)), file.type.indexOf('video/') === 0, file.name));
      var remove = el('button', null, '×');
      remove.type = 'button';
      remove.setAttribute('aria-label', 'Remove ' + file.name);
      remove.onclick = function () { card._files.splice(index, 1); renderSectionMedia(card); markJournalDirty(); };
      chip.appendChild(remove);
      host.appendChild(chip);
    });
    var zone = qs('.dropzone', card);
    zone.classList.toggle('has-file', card._files.length > 0);
    qs('.dropzone-copy small', card).textContent = card._files.length ? plural(card._files.length, 'new file') + ' ready to upload' : 'Drop images or videos, or click to choose';
  }
  function renumberSections() {
    qsa('.section-card', sectionsHost).forEach(function (card, index, all) {
      qs('.section-num', card).textContent = String(index + 1);
      qs('[data-move="up"]', card).disabled = index === 0;
      qs('[data-move="down"]', card).disabled = index === all.length - 1;
    });
  }
  function addSection(data, focus) {
    data = data || {};
    var card = el('section', 'section-card');
    card.innerHTML = '<div class="section-head"><strong><span class="section-num">1</span>Section</strong><span class="row-actions"><button class="icon-btn" type="button" data-move="up" aria-label="Move section up">↑</button><button class="icon-btn" type="button" data-move="down" aria-label="Move section down">↓</button><button class="icon-btn" type="button" data-remove aria-label="Remove section">✕</button></span></div>'
      + '<label class="field"><span class="field-label">Heading</span><input class="section-title" maxlength="180" placeholder="Section heading"></label>'
      + '<label class="field"><span class="field-label">Text</span><textarea class="section-body" maxlength="12000" rows="6" placeholder="Write this part of the post. Leave a blank line between paragraphs."></textarea></label>'
      + '<label class="dropzone" data-dropzone><input class="section-files" type="file" accept="image/*,video/*" multiple><span class="dropzone-copy"><strong>Images or videos</strong><small>Drop images or videos, or click to choose</small></span></label>'
      + '<div class="media-chips"></div>';
    qs('.section-title', card).value = data.heading || '';
    qs('.section-body', card).value = data.body || '';
    card._existing = Array.isArray(data.media) ? data.media.slice() : [];
    card._files = [];
    var input = qs('.section-files', card);
    input.addEventListener('change', function () {
      Array.prototype.forEach.call(input.files, function (file) { card._files.push(file); });
      input.value = '';
      renderSectionMedia(card);
      markJournalDirty();
    });
    wireDropzone(qs('.dropzone', card), input);
    qs('[data-move="up"]', card).onclick = function () { if (card.previousElementSibling) { sectionsHost.insertBefore(card, card.previousElementSibling); renumberSections(); markJournalDirty(); } };
    qs('[data-move="down"]', card).onclick = function () { if (card.nextElementSibling) { sectionsHost.insertBefore(card.nextElementSibling, card); renumberSections(); markJournalDirty(); } };
    qs('[data-remove]', card).onclick = function () {
      var next = card.nextElementSibling;
      card.remove();
      renumberSections();
      markJournalDirty();
      toast('info', 'Section removed', '', { action: { label: 'Undo', run: function () { sectionsHost.insertBefore(card, next && next.parentNode === sectionsHost ? next : null); renumberSections(); } } });
    };
    sectionsHost.appendChild(card);
    renderSectionMedia(card);
    renumberSections();
    if (focus) qs('.section-title', card).focus();
    return card;
  }
  $('addSection').addEventListener('click', function () { addSection({}, true); markJournalDirty(); });

  function fillPostForm(post, options) {
    options = options || {};
    journal.filling = true;
    releaseObjectUrls();
    journal.thumbUrl = '';
    postForm.reset();
    $('postTitle').value = post.title || '';
    $('postSlug').value = post.slug || '';
    $('postDescription').value = post.description || '';
    $('postDate').value = post.date || today();
    $('postTags').value = (post.tags || []).join(', ');
    $('postFit').value = post.fit === 'contain' ? 'contain' : 'cover';
    setMode(postMode(post));
    sectionsHost.replaceChildren();
    (post.sections || []).forEach(function (section) { addSection({ heading: section.heading, body: section.body, media: section.media || section.existingMedia || [] }); });
    if (!sectionsHost.children.length) addSection();
    var current = journal.current;
    $('thumbCurrent').textContent = current && current.thumbnail ? 'Current: ' + current.thumbnail.split('/').pop() + ' · drop a file to replace' : 'Drop a file or click to choose';
    $('heroCurrent').textContent = current && current.hero && current.hero !== current.thumbnail ? 'Current: ' + current.hero.split('/').pop() + ' · drop a file to replace' : 'Uses the thumbnail when empty';
    qsa('#postForm .dropzone').forEach(function (zone) { zone.classList.remove('has-file'); });
    $('postSlug').readOnly = Boolean(current);
    $('slugHint').textContent = current ? 'The address of a published post stays the same. Unpublish and create a new post to change it.' : 'Created from the title. Lowercase letters, numbers, and dashes.';
    qsa('[aria-invalid="true"]', postForm).forEach(function (field) { field.removeAttribute('aria-invalid'); });
    journal.filling = false;
    journal.slugTouched = Boolean(current) || Boolean(options.slugTouched);
    updateModeUi();
    updateLiveLink();
  }
  function setJournalClean(text) {
    journal.dirty = false;
    setSaveState($('postSaveState'), 'clean', text || 'No unsaved changes');
  }
  var saveDraftSoon = debounce(saveDraft, 700);
  function markJournalDirty() {
    if (journal.filling) return;
    journal.dirty = true;
    setSaveState($('postSaveState'), 'dirty', 'Unsaved changes');
    saveDraftSoon();
  }
  function draftData() {
    return {
      key: journal.key, savedAt: new Date().toISOString(),
      title: $('postTitle').value, slug: $('postSlug').value, description: $('postDescription').value, date: $('postDate').value,
      tags: $('postTags').value.split(',').map(function (tag) { return tag.trim(); }).filter(Boolean), fit: $('postFit').value, mode: modeValue(),
      sections: qsa('.section-card', sectionsHost).map(function (card) { return { heading: qs('.section-title', card).value, body: qs('.section-body', card).value, media: card._existing }; })
    };
  }
  function saveDraft() {
    if (!journal.dirty) return;
    storage('set', DRAFT_KEY, draftData());
    if (journal.dirty) setSaveState($('postSaveState'), 'dirty', 'Unsaved changes · draft kept on this device');
  }
  function offerDraft() {
    var draft = storage('get', DRAFT_KEY);
    var banner = $('draftBanner');
    banner.hidden = !(draft && draft.key === journal.key);
    if (!banner.hidden) $('draftBannerText').textContent = (draft.title ? '"' + draft.title + '" · ' : '') + 'saved ' + relTime(draft.savedAt) + ' on this device. Files need to be added again.';
  }
  $('restoreDraft').addEventListener('click', function () {
    var draft = storage('get', DRAFT_KEY);
    $('draftBanner').hidden = true;
    if (!draft) return;
    fillPostForm(draft, { slugTouched: true });
    journal.dirty = true;
    setSaveState($('postSaveState'), 'dirty', 'Draft restored · not published yet');
  });
  $('discardDraft').addEventListener('click', function () { storage('remove', DRAFT_KEY); $('draftBanner').hidden = true; });

  function newPost() {
    journal.current = null;
    journal.key = 'new';
    fillPostForm({ date: today(), mode: 'article' });
    $('postEyebrow').textContent = 'New post';
    $('postEditorTitle').textContent = 'Create a post';
    $('unpublishPost').hidden = true;
    setJournalClean();
    renderPostList();
    offerDraft();
  }
  async function openPost(slug) {
    if (journal.current && journal.current.slug === slug && journal.key === slug) return;
    setSaveState($('postSaveState'), 'saving', 'Loading post…');
    try {
      var data = await api('/api/post?slug=' + encodeURIComponent(slug));
      journal.current = data.post;
      journal.key = data.post.slug;
      fillPostForm(data.post);
      $('postEyebrow').textContent = 'Editing';
      $('postEditorTitle').textContent = data.post.title || 'Edit post';
      $('unpublishPost').hidden = false;
      setJournalClean('Published · no unsaved changes');
      renderPostList();
      offerDraft();
    } catch (error) {
      setSaveState($('postSaveState'), 'error', 'Could not load the post');
      toast('error', 'Could not open that post', error.message);
      setHash('#journal');
      if (!journal.current) newPost();
    }
  }

  postForm.addEventListener('input', function (event) {
    if (event.target.id === 'postTitle' && !journal.slugTouched) $('postSlug').value = slugify($('postTitle').value);
    if (event.target.id === 'postSlug') journal.slugTouched = true;
    if (event.target.getAttribute('aria-invalid') === 'true') event.target.removeAttribute('aria-invalid');
    updateCounters(postForm);
    updateCardPreview();
    markJournalDirty();
  });
  postForm.addEventListener('change', function (event) {
    if (event.target.name === 'postMode') updateModeUi();
    if (event.target.id === 'postThumbnail') {
      var file = $('postThumbnail').files[0];
      journal.thumbUrl = '';
      $('thumbCurrent').textContent = file ? file.name + ' · ' + fileSize(file.size) : (journal.current && journal.current.thumbnail ? 'Current: ' + journal.current.thumbnail.split('/').pop() : 'Drop a file or click to choose');
      $('postThumbnail').closest('.dropzone').classList.toggle('has-file', Boolean(file));
      updateCardPreview();
    }
    if (event.target.id === 'postHero') {
      var hero = $('postHero').files[0];
      $('heroCurrent').textContent = hero ? hero.name + ' · ' + fileSize(hero.size) : 'Uses the thumbnail when empty';
      $('postHero').closest('.dropzone').classList.toggle('has-file', Boolean(hero));
    }
    if (event.target.id === 'postFit' || event.target.id === 'postDate') updateCardPreview();
    // Text fields already report edits through 'input'; a late 'change' on blur is not a new edit.
    if (event.target.matches('select, input[type="radio"], input[type="checkbox"], input[type="file"]:not(.section-files)')) markJournalDirty();
  });

  function collectPost(form) {
    var sections = [];
    qsa('.section-card', sectionsHost).forEach(function (card, index) {
      var uploads = [];
      (card._ready || card._files).forEach(function (file, fileIndex) {
        var field = 'section-' + index + '-' + fileIndex;
        form.append(field, file);
        uploads.push({ field: field, alt: file.name });
      });
      sections.push({ heading: qs('.section-title', card).value.trim(), body: qs('.section-body', card).value.trim(), existingMedia: card._existing, uploads: uploads });
    });
    var current = journal.current;
    return {
      title: $('postTitle').value.trim(), slug: $('postSlug').value.trim(), description: $('postDescription').value.trim(), date: $('postDate').value,
      tags: $('postTags').value.split(',').map(function (tag) { return tag.trim(); }).filter(Boolean), fit: $('postFit').value, mode: modeValue(),
      existingThumbnail: current && current.thumbnail || '', existingHero: current && (current.hero || current.thumbnail) || '', sections: sections
    };
  }
  function flagField(id, message) {
    var field = $(id);
    field.setAttribute('aria-invalid', 'true');
    field.focus();
    toast('error', 'Check the post before publishing', message);
    return false;
  }
  function validatePost() {
    var mode = modeValue();
    var slug = $('postSlug').value.trim();
    if (!$('postTitle').value.trim()) return flagField('postTitle', 'Give the post a title.');
    if (!slug || !validSlug(slug)) return flagField('postSlug', 'The URL name can only use lowercase letters, numbers, and single dashes.');
    var text = $('postDescription').value.trim();
    if (!text) return flagField('postDescription', mode === 'card' ? 'Write the post text.' : 'Add a short description.');
    if (mode !== 'card' && text.length > 320) return flagField('postDescription', 'Short descriptions can be up to 320 characters. Switch to "Post only" for longer text.');
    if (!$('postDate').value) return flagField('postDate', 'Pick a date.');
    return true;
  }
  function checkUploadSizes(files) {
    var total = 0;
    for (var i = 0; i < files.length; i += 1) {
      if (!files[i]) continue;
      if (files[i].size > 10 * 1048576) { toast('error', 'A file is too large', files[i].name + ' is ' + fileSize(files[i].size) + '. Each file can be up to 10 MB.'); return false; }
      total += files[i].size;
    }
    if (total > 30 * 1048576) { toast('error', 'The upload is too large', 'All new files together come to ' + fileSize(total) + '. The limit is 30 MB per publish.'); return false; }
    return true;
  }
  async function publishPost() {
    if (!validatePost()) return;
    var slug = $('postSlug').value.trim();
    var existing = !journal.current && (app.posts || []).some(function (post) { return post.slug === slug; });
    if (existing && !(await confirmAction({ title: 'Replace an existing post?', text: 'A post already uses the address "' + slug + '". Publishing will replace it.', confirm: 'Replace post', tone: 'danger' }))) return;
    var mode = modeValue();
    var button = $('publishPost');
    var title = $('postTitle').value.trim();
    setLoading(button, true);
    setSaveState($('postSaveState'), 'saving', 'Preparing images…');
    var note = toast('loading', 'Publishing "' + title + '"…', 'Optimizing images…');
    var cards = mode === 'article' ? qsa('.section-card', sectionsHost) : [];
    var originals = [$('postThumbnail').files[0], mode === 'article' ? $('postHero').files[0] : null];
    var thumbnail = await optimizeImage(originals[0], 1920);
    var hero = await optimizeImage(originals[1], 2400);
    var prepared = [thumbnail, hero];
    for (var c = 0; c < cards.length; c += 1) {
      originals = originals.concat(cards[c]._files);
      cards[c]._ready = await optimizeAll(cards[c]._files, 2400);
      prepared = prepared.concat(cards[c]._ready);
    }
    var savings = savedBytes(originals.filter(Boolean), prepared.filter(Boolean));
    if (!checkUploadSizes(prepared)) { note.dismiss(); setLoading(button, false); setSaveState($('postSaveState'), 'dirty', 'Unsaved changes'); return; }
    var form = new FormData();
    if (thumbnail) form.append('thumbnail', thumbnail);
    if (hero) form.append('hero', hero);
    form.append('metadata', JSON.stringify(collectPost(form)));
    qsa('.section-card', sectionsHost).forEach(function (card) { card._ready = null; });
    setSaveState($('postSaveState'), 'saving', 'Publishing…');
    note.update('loading', 'Publishing "' + title + '"…', savings + 'Uploading and saving to GitHub.');
    try {
      var result = await api('/api/publish', { method: 'POST', body: form });
      storage('remove', DRAFT_KEY);
      journal.dirty = false;
      note.update('success', mode === 'coming-soon' ? 'Teaser saved' : 'Post published', '"' + title + '" will be live in about a minute.');
      trackDeploy(result.commit, 'Journal: ' + title);
      refreshActivitySoon();
      await loadPosts();
      journal.current = null;
      journal.key = '';
      setHash('#journal/' + encodeURIComponent(result.slug));
      await openPost(result.slug);
    } catch (error) {
      setSaveState($('postSaveState'), 'error', 'Not published · your changes are still here');
      note.update('error', 'The post was not published', error.message);
    }
    setLoading(button, false);
  }
  postForm.addEventListener('submit', function (event) { event.preventDefault(); publishPost(); });

  $('unpublishPost').addEventListener('click', async function () {
    var current = journal.current;
    if (!current) return;
    var ok = await confirmAction({ title: 'Unpublish "' + current.title + '"?', text: 'The post is removed from the Journal, along with any media uploaded for it. This cannot be undone.', confirm: 'Unpublish', tone: 'danger' });
    if (!ok) return;
    var button = $('unpublishPost');
    setLoading(button, true);
    try {
      var result = await api('/api/unpublish', { method: 'POST', json: { slug: current.slug } });
      toast('success', 'Post unpublished', '"' + current.title + '" has been removed.');
      trackDeploy(result.commit, 'Unpublish: ' + current.title);
      refreshActivitySoon();
      journal.dirty = false;
      await loadPosts();
      setHash('#journal');
      newPost();
    } catch (error) { toast('error', 'The post was not unpublished', error.message); }
    setLoading(button, false);
  });

  $('newPost').addEventListener('click', function () { window.location.hash = '#journal/new'; });

  $('previewPost').addEventListener('click', function () {
    var mode = modeValue();
    var preview = $('previewContent');
    preview.replaceChildren();
    var hero = el('div', 'preview-hero');
    var heroFile = (mode === 'article' && $('postHero').files[0]) || $('postThumbnail').files[0];
    var current = journal.current;
    if (heroFile) hero.appendChild(mediaNode(trackObjectUrl(heroFile), heroFile.type.indexOf('video/') === 0, ''));
    else if (current && (current.hero || current.thumbnail)) { var path = mode === 'article' ? (current.hero || current.thumbnail) : current.thumbnail; hero.appendChild(mediaNode(publicUrl(path), !isImagePath(path), '')); }
    else hero.appendChild(el('span', null, 'No image yet'));
    var copy = el('div');
    var meta = el('div', 'preview-meta');
    meta.append(el('span', null, $('cardPreviewTag').textContent), el('time', null, readableDay($('postDate').value)));
    var raw = $('postDescription').value;
    copy.append(meta, el('h1', null, $('postTitle').value || 'Untitled post'), el('p', 'preview-lead', mode === 'card' ? cardSummary(raw) : raw));
    preview.append(hero, copy);
    function paragraphs(text, host) { String(text || '').split(/\n\s*\n/).filter(function (part) { return part.trim(); }).forEach(function (part) { host.appendChild(el('p', null, part)); }); }
    if (mode === 'article') {
      preview.appendChild(el('div', 'preview-divider', 'FULL POST'));
      qsa('.section-card', sectionsHost).forEach(function (card) {
        var section = el('section', 'preview-section');
        var heading = qs('.section-title', card).value.trim();
        if (heading) section.appendChild(el('h2', null, heading));
        paragraphs(qs('.section-body', card).value, section);
        var nodes = card._existing.map(function (item) { return mediaNode(publicUrl(item.path), item.type === 'video', item.alt); })
          .concat(card._files.map(function (file) { return mediaNode(file._url || (file._url = trackObjectUrl(file)), file.type.indexOf('video/') === 0, file.name); }));
        nodes.forEach(function (node) { if (node.tagName === 'VIDEO') { node.controls = true; node.autoplay = false; } });
        if (nodes.length) { var media = el('div', 'preview-media'); nodes.forEach(function (node) { media.appendChild(node); }); section.appendChild(media); }
        if (section.children.length) preview.appendChild(section);
      });
    } else if (mode === 'card') {
      preview.appendChild(el('div', 'preview-divider', 'READ MORE'));
      var full = el('section', 'preview-section');
      paragraphs(raw, full);
      preview.appendChild(full);
    }
    $('previewDialog').showModal();
  });
  $('closePreview').addEventListener('click', function () { $('previewDialog').close(); });
  $('previewDialog').addEventListener('close', function () { qsa('#previewContent video').forEach(function (video) { video.pause(); }); });

  views.journal = {
    show: function (arg) {
      if (!app.posts) loadPosts();
      if (arg === 'new') { setHash('#journal'); if (journal.key !== 'new' || journal.dirty) newPost(); else offerDraft(); return; }
      if (arg) { openPost(arg); return; }
      if (!journal.key) newPost();
    },
    key: function () { return journal.key; },
    isDirty: function () { return journal.dirty; },
    discard: function () { journal.dirty = false; journal.key = ''; },
    save: publishPost
  };
  journal.key = '';

  /* ---------- Projects ---------- */
  var projectsUi = { currentId: '', dirty: false, filling: false, removedImage: false, objectUrl: '', key: '' };
  var projectForm = $('projectForm');
  function projectById(id) { return (app.projects || []).find(function (item) { return item.id === id; }) || null; }
  async function loadProjects() {
    try { var data = await api('/api/projects'); app.projects = data.projects || []; }
    catch (error) { $('projectList').replaceChildren(el('p', 'list-empty', 'Projects could not be loaded. ' + error.message)); $('projectsCaption').textContent = ''; return; }
    afterProjectsChange();
  }
  function afterProjectsChange() {
    var live = app.projects.filter(function (item) { return !item.draft; }).length;
    setBadge('projects', String(live));
    $('projectsCaption').textContent = app.projects.length ? plural(live, 'live project') + (app.projects.length - live ? ' · ' + plural(app.projects.length - live, 'draft') : '') + '. The order here is the slider order.' : 'No projects yet.';
    renderProjectList();
    renderOverview();
  }
  var projectListBusy = false;
  function renderProjectList() {
    var list = $('projectList');
    list.replaceChildren();
    list.removeAttribute('aria-busy');
    if (!app.projects) return;
    if (!app.projects.length) { list.appendChild(el('p', 'list-empty', 'Create your first project to fill the homepage slider.')); return; }
    app.projects.forEach(function (project, index) {
      var row = el('div', 'project-row');
      var item = el('a', 'list-item');
      item.href = '#projects/' + encodeURIComponent(project.id);
      if (project.id === projectsUi.currentId) item.setAttribute('aria-current', 'true');
      var thumb;
      if (project.image) { thumb = el('img', 'list-thumb'); thumb.src = publicUrl(project.image); thumb.alt = ''; thumb.loading = 'lazy'; }
      else thumb = el('span', 'list-thumb');
      var text = el('span', 'list-text');
      var meta = el('small');
      meta.append(el('span', 'tag ' + (project.draft ? 'draft' : 'live'), project.draft ? 'DRAFT' : 'LIVE'), document.createTextNode(project.kicker || 'Project'));
      text.append(el('strong', null, project.title), meta);
      item.append(thumb, text);
      var actions = el('span', 'row-actions');
      function action(label, symbol, disabled, run) {
        var button = el('button', 'icon-btn', symbol);
        button.type = 'button';
        button.title = label;
        button.setAttribute('aria-label', label + ': ' + project.title);
        button.disabled = disabled || projectListBusy;
        button.onclick = run;
        return button;
      }
      actions.append(
        action('Move up', '↑', index === 0, function () { moveProject(project.id, -1); }),
        action('Move down', '↓', index === app.projects.length - 1, function () { moveProject(project.id, 1); }),
        action(project.draft ? 'Publish' : 'Move to drafts', project.draft ? '◯' : '●', false, function () { toggleProject(project.id); })
      );
      row.append(item, actions);
      list.appendChild(row);
    });
  }
  async function projectAction(body, busyText, success, label) {
    projectListBusy = true;
    renderProjectList();
    var note = toast('loading', busyText);
    try {
      var result = await api('/api/projects', { method: 'POST', json: body });
      app.projects = result.projects || app.projects;
      note.update('success', success);
      trackDeploy(result.commit, label);
      refreshActivitySoon();
    } catch (error) {
      note.update('error', 'That did not work', error.message);
      await loadProjects();
    }
    projectListBusy = false;
    afterProjectsChange();
    if (projectsUi.currentId && !projectsUi.dirty) loadProjectEditor(projectsUi.currentId);
  }
  function moveProject(id, direction) {
    var list = app.projects.slice();
    var index = list.findIndex(function (item) { return item.id === id; });
    var target = index + direction;
    if (index < 0 || target < 0 || target >= list.length || projectListBusy) return;
    var moved = list[index];
    list[index] = list[target];
    list[target] = moved;
    app.projects = list;
    projectAction({ action: 'reorder', ids: list.map(function (item) { return item.id; }) }, 'Saving the new order…', 'Project order saved', 'Project order');
  }
  function toggleProject(id) {
    var project = projectById(id);
    if (!project || projectListBusy) return;
    projectAction({ action: 'toggle', id: id }, project.draft ? 'Publishing "' + project.title + '"…' : 'Moving "' + project.title + '" to drafts…', project.draft ? '"' + project.title + '" is published' : '"' + project.title + '" is now a draft', (project.draft ? 'Publish: ' : 'Draft: ') + project.title);
  }

  function accentValue() { var checked = qs('input[name="projectAccent"]:checked', projectForm); return checked ? checked.value : 'cyan'; }
  function setAccent(value) { var input = qs('input[name="projectAccent"][value="' + (ACCENTS[value] ? value : 'cyan') + '"]', projectForm); if (input) input.checked = true; }
  function projectImageSource() {
    var file = $('projectImage').files[0];
    if (file) return projectsUi.objectUrl || (projectsUi.objectUrl = URL.createObjectURL(file));
    var project = projectById(projectsUi.currentId);
    return !projectsUi.removedImage && project && project.image ? publicUrl(project.image) : '';
  }
  function projectUrlProblem(value) {
    if (!value) return '';
    if (/^https?:\/\/[^\s]+\.[^\s]+/i.test(value)) return '';
    if (/^\/(?!\/)[^\s<>"'\\]*$/.test(value) && value.indexOf('..') === -1) return '';
    return 'Use a full link (https://…) or a page on this site starting with /';
  }
  function renderProjectPreview() {
    var title = $('projectTitle').value.trim() || 'Your project';
    var url = $('projectUrl').value.trim();
    var preview = $('projectPreview');
    preview.style.setProperty('--accent', ACCENTS[accentValue()]);
    preview.classList.toggle('compact', $('projectLayout').value === 'compact');
    preview.classList.toggle('is-draft', !$('projectPublished').checked);
    $('projectPreviewKicker').textContent = ($('projectKicker').value.trim() || 'PROJECT').toUpperCase();
    var badge = $('projectBadge').value.trim();
    $('projectPreviewBadge').hidden = !badge;
    $('projectPreviewBadge').textContent = badge.toUpperCase();
    $('projectPreviewTitle').textContent = title;
    $('projectPreviewDescription').textContent = $('projectDescription').value.trim() || 'The project description will appear here.';
    $('projectPreviewButton').textContent = $('projectButtonLabel').value.trim() || 'Open project';
    $('projectPreviewButton').hidden = !$('projectShowButton').checked || !url;
    $('projectPreviewState').textContent = $('projectPublished').checked ? 'Published' : 'Draft';
    $('projectPublishedLabel').textContent = $('projectPublished').checked ? 'Published' : 'Draft';
    var problem = projectUrlProblem(url);
    $('projectUrl').setAttribute('aria-invalid', String(Boolean(problem)));
    $('projectUrlHint').textContent = problem || (url ? ($('projectNewTab').checked ? 'Opens in a new tab.' : 'Opens in the same tab.') : 'Optional. Leave empty for a card without a link.');
    $('projectUrlHint').classList.toggle('error', Boolean(problem));
    var media = $('projectPreviewMedia');
    media.classList.toggle('contain', $('projectFit').value === 'contain');
    var source = projectImageSource();
    if (media.dataset.source !== source) {
      media.dataset.source = source;
      media.replaceChildren(source ? mediaNode(source, false, title + ' image') : el('span', null, 'No image'));
    }
    var file = $('projectImage').files[0];
    var project = projectById(projectsUi.currentId);
    $('projectImageCurrent').textContent = file ? file.name + ' · ' + fileSize(file.size) : source && project ? 'Current: ' + project.image.split('/').pop() + ' · drop an image to replace' : 'Drop an image or click to choose · optimized automatically';
    $('projectImage').closest('.dropzone').classList.toggle('has-file', Boolean(file));
    $('projectRemoveImage').hidden = !source;
    updateCounters(projectForm);
  }
  function clearProjectObject() { if (projectsUi.objectUrl) { URL.revokeObjectURL(projectsUi.objectUrl); projectsUi.objectUrl = ''; } }
  function fillProject(project) {
    projectsUi.filling = true;
    clearProjectObject();
    projectForm.reset();
    projectsUi.removedImage = false;
    $('projectTitle').value = project ? project.title : '';
    $('projectKicker').value = project ? project.kicker || '' : '';
    $('projectBadge').value = project ? project.badge || '' : '';
    $('projectDescription').value = project ? project.description || '' : '';
    $('projectUrl').value = project ? project.url || '' : '';
    $('projectButtonLabel').value = project ? project.buttonLabel || '' : '';
    $('projectShowButton').checked = project ? project.showButton !== false : true;
    $('projectClickable').checked = project ? Boolean(project.clickable) : false;
    $('projectNewTab').checked = project ? project.newTab !== false : true;
    $('projectPublished').checked = project ? !project.draft : true;
    setAccent(project ? project.accent : 'cyan');
    $('projectLayout').value = project && project.layout === 'compact' ? 'compact' : 'media-top';
    $('projectFit').value = project && project.fit === 'contain' ? 'contain' : 'cover';
    $('projectEyebrow').textContent = project ? 'Editing' : 'New project';
    $('projectEditorTitle').textContent = project ? project.title : 'Create a project';
    $('deleteProject').hidden = !project;
    $('saveProject').textContent = project ? 'Save changes' : 'Create project';
    projectsUi.filling = false;
    projectsUi.dirty = false;
    setSaveState($('projectSaveState'), 'clean', project ? (project.draft ? 'Draft · no unsaved changes' : 'Live · no unsaved changes') : 'New project');
    renderProjectPreview();
    renderProjectList();
  }
  function loadProjectEditor(id) {
    var project = projectById(id);
    if (!project) { toast('error', 'Project not found', 'It may have been removed.'); setHash('#projects'); newProject(); return; }
    projectsUi.currentId = id;
    projectsUi.key = id;
    fillProject(project);
  }
  function newProject() { projectsUi.currentId = ''; projectsUi.key = 'new'; fillProject(null); }
  function markProjectDirty() {
    if (projectsUi.filling) return;
    projectsUi.dirty = true;
    setSaveState($('projectSaveState'), 'dirty', 'Unsaved changes');
  }
  projectForm.addEventListener('input', function () { renderProjectPreview(); markProjectDirty(); });
  projectForm.addEventListener('change', function (event) {
    if (event.target.id === 'projectImage') {
      var file = $('projectImage').files[0];
      if (file && (!/^image\/(png|jpeg|webp)$/i.test(file.type) || file.size > 25 * 1048576)) {
        $('projectImage').value = '';
        toast('error', 'That image cannot be used', 'Project images must be PNG, JPG, or WebP and 25 MB or smaller. Large images are shrunk automatically.');
      } else projectsUi.removedImage = false;
      clearProjectObject();
    }
    renderProjectPreview();
    if (event.target.matches('select, input[type="radio"], input[type="checkbox"], input[type="file"]')) markProjectDirty();
  });
  $('projectRemoveImage').addEventListener('click', function () { clearProjectObject(); $('projectImage').value = ''; projectsUi.removedImage = true; renderProjectPreview(); markProjectDirty(); });
  async function saveProject() {
    var title = $('projectTitle').value.trim();
    if (!title) { $('projectTitle').setAttribute('aria-invalid', 'true'); $('projectTitle').focus(); toast('error', 'Give the project a name'); return; }
    if (!$('projectDescription').value.trim()) { $('projectDescription').setAttribute('aria-invalid', 'true'); $('projectDescription').focus(); toast('error', 'Add a short description'); return; }
    var urlProblem = projectUrlProblem($('projectUrl').value.trim());
    if (urlProblem) { $('projectUrl').focus(); toast('error', 'Check the project link', urlProblem); return; }
    var project = projectById(projectsUi.currentId);
    var metadata = {
      id: projectsUi.currentId, title: title, kicker: $('projectKicker').value.trim(), badge: $('projectBadge').value.trim(), description: $('projectDescription').value.trim(),
      url: $('projectUrl').value.trim(), buttonLabel: $('projectButtonLabel').value.trim(), showButton: $('projectShowButton').checked, clickable: $('projectClickable').checked,
      newTab: $('projectNewTab').checked, draft: !$('projectPublished').checked, accent: accentValue(), layout: $('projectLayout').value, fit: $('projectFit').value,
      existingImage: !projectsUi.removedImage && project ? project.image || '' : ''
    };
    var form = new FormData();
    form.append('metadata', JSON.stringify(metadata));
    if ($('projectImage').files[0]) form.append('image', await optimizeImage($('projectImage').files[0], 1600));
    var button = $('saveProject');
    setLoading(button, true);
    setSaveState($('projectSaveState'), 'saving', 'Saving…');
    var note = toast('loading', 'Saving "' + title + '"…');
    try {
      var result = await api('/api/projects', { method: 'POST', body: form });
      app.projects = result.projects || app.projects;
      projectsUi.dirty = false;
      note.update('success', project ? 'Project updated' : 'Project created', metadata.draft ? 'Saved as a draft. It is not on the homepage yet.' : 'It will show in the homepage slider in about a minute.');
      trackDeploy(result.commit, 'Project: ' + title);
      refreshActivitySoon();
      afterProjectsChange();
      if (result.project) { setHash('#projects/' + encodeURIComponent(result.project.id)); loadProjectEditor(result.project.id); }
    } catch (error) {
      setSaveState($('projectSaveState'), 'error', 'Not saved · your changes are still here');
      note.update('error', 'The project was not saved', error.message);
    }
    setLoading(button, false);
  }
  projectForm.addEventListener('submit', function (event) { event.preventDefault(); saveProject(); });
  $('discardProject').addEventListener('click', function () { if (projectsUi.currentId) loadProjectEditor(projectsUi.currentId); else newProject(); });
  $('newProject').addEventListener('click', function () { window.location.hash = '#projects/new'; });
  $('deleteProject').addEventListener('click', async function () {
    var project = projectById(projectsUi.currentId);
    if (!project) return;
    var ok = await confirmAction({ title: 'Delete "' + project.title + '"?', text: 'The project and its uploaded image are removed from the homepage. This cannot be undone. Tip: switch it to Draft instead if you just want to hide it.', confirm: 'Delete project', tone: 'danger' });
    if (!ok) return;
    var button = $('deleteProject');
    setLoading(button, true);
    try {
      var result = await api('/api/projects', { method: 'POST', json: { action: 'delete', id: project.id } });
      app.projects = result.projects || [];
      projectsUi.dirty = false;
      toast('success', 'Project deleted', '"' + project.title + '" has been removed.');
      trackDeploy(result.commit, 'Delete project: ' + project.title);
      refreshActivitySoon();
      afterProjectsChange();
      setHash('#projects');
      newProject();
    } catch (error) { toast('error', 'The project was not deleted', error.message); }
    setLoading(button, false);
  });
  views.projects = {
    show: async function (arg) {
      if (!app.projects) await loadProjects();
      if (!app.projects) return;
      if (arg === 'new') { setHash('#projects'); newProject(); return; }
      if (arg) { if (arg !== projectsUi.key) loadProjectEditor(arg); return; }
      if (!projectsUi.key) newProject();
    },
    key: function () { return projectsUi.key; },
    isDirty: function () { return projectsUi.dirty; },
    discard: function () { projectsUi.dirty = false; projectsUi.key = ''; },
    save: saveProject
  };

  /* ---------- Homepage portrait ---------- */
  var portraitUi = { busy: false, objectUrl: '' };
  async function loadPortrait() {
    try { app.portrait = await api('/api/profile-art'); }
    catch (error) { $('portraitHint').textContent = 'Could not load the current setting. ' + error.message; return; }
    renderPortrait();
    renderOverview();
  }
  function renderPortrait() {
    var portrait = app.portrait;
    if (!portrait) return;
    var view = portrait.profileView === 'roblox' ? 'roblox' : 'image';
    qsa('[data-portrait]').forEach(function (button) {
      button.setAttribute('aria-checked', String(button.dataset.portrait === view));
      button.disabled = portraitUi.busy;
    });
    var art = publicUrl(portrait.profileImage || DEFAULT_PROFILE);
    if ($('portraitArtImage').dataset.src !== art) { $('portraitArtImage').dataset.src = art; $('portraitArtImage').src = art; }
    $('portraitRobloxImage').hidden = !portrait.robloxAvatar;
    $('robloxUnavailable').hidden = Boolean(portrait.robloxAvatar);
    if (portrait.robloxAvatar) $('portraitRobloxImage').src = portrait.robloxAvatar;
    $('portraitHint').textContent = view === 'roblox'
      ? (portrait.robloxAvatar ? 'Showing your live Roblox avatar. Visitors see the artwork if Roblox is ever unavailable.' : 'Set to your Roblox avatar, but Roblox is not responding right now, so visitors see your artwork for now.')
      : 'Showing your profile artwork. Your Roblox avatar is not requested or shown anywhere.';
    if (!$('artworkInput').files[0]) {
      $('artworkPreview').src = art;
      $('artworkPath').textContent = 'Current file: ' + (portrait.profileImage || DEFAULT_PROFILE) + (portrait.profileImage === DEFAULT_PROFILE ? ' (original)' : '');
    }
    $('restoreArtwork').disabled = portraitUi.busy || portrait.profileImage === DEFAULT_PROFILE;
    setBadge('homepage', view === 'roblox' ? 'Roblox' : '', '');
  }
  qsa('[data-portrait]').forEach(function (button) {
    button.addEventListener('click', async function () {
      var view = button.dataset.portrait;
      if (portraitUi.busy || !app.portrait || app.portrait.profileView === view) return;
      if (view === 'roblox' && !app.portrait.robloxAvatar && !(await confirmAction({ title: 'Roblox is not responding', text: 'Your avatar cannot be loaded right now. You can still switch; visitors see your artwork until Roblox is back.', confirm: 'Switch anyway' }))) return;
      portraitUi.busy = true;
      var previous = app.portrait.profileView;
      app.portrait.profileView = view;
      renderPortrait();
      var note = toast('loading', view === 'roblox' ? 'Switching to your Roblox avatar…' : 'Switching to your profile image…');
      try {
        var result = await api('/api/profile-art', { method: 'POST', json: { profileView: view } });
        app.portrait.profileView = result.profileView;
        note.update('success', view === 'roblox' ? 'Portrait now shows your Roblox avatar' : 'Portrait now shows your artwork', 'The homepage updates in about a minute.');
        trackDeploy(result.commit, 'Homepage portrait');
        refreshActivitySoon();
      } catch (error) {
        app.portrait.profileView = previous;
        note.update('error', 'The portrait was not changed', error.message);
      }
      portraitUi.busy = false;
      renderPortrait();
      renderOverview();
    });
  });
  function clearArtworkSelection() {
    if (portraitUi.objectUrl) { URL.revokeObjectURL(portraitUi.objectUrl); portraitUi.objectUrl = ''; }
    $('artworkInput').value = '';
    $('artworkInput').closest('.dropzone').classList.remove('has-file');
    $('artworkFileText').textContent = 'PNG, JPG, or WebP · optimized automatically. Transparent artwork looks best.';
    $('saveArtwork').disabled = true;
    $('cancelArtwork').disabled = true;
    renderPortrait();
  }
  $('artworkInput').addEventListener('change', function () {
    var file = $('artworkInput').files[0];
    if (!file) { clearArtworkSelection(); return; }
    if (!/^image\/(png|jpeg|webp)$/i.test(file.type) || file.size > 25 * 1048576) { clearArtworkSelection(); toast('error', 'That image cannot be used', 'Use a PNG, JPG, or WebP image up to 25 MB. Large images are shrunk automatically.'); return; }
    if (portraitUi.objectUrl) URL.revokeObjectURL(portraitUi.objectUrl);
    portraitUi.objectUrl = URL.createObjectURL(file);
    $('artworkPreview').src = portraitUi.objectUrl;
    $('artworkFileText').textContent = file.name + ' · ' + fileSize(file.size) + ' · not saved yet';
    $('artworkPath').textContent = 'Previewing your new image.';
    $('artworkInput').closest('.dropzone').classList.add('has-file');
    $('saveArtwork').disabled = false;
    $('cancelArtwork').disabled = false;
  });
  $('cancelArtwork').addEventListener('click', clearArtworkSelection);
  async function saveArtwork() {
    var file = $('artworkInput').files[0];
    if (!file || portraitUi.busy) return;
    var button = $('saveArtwork');
    portraitUi.busy = true;
    setLoading(button, true);
    var note = toast('loading', 'Uploading your artwork…');
    try {
      var form = new FormData();
      form.append('image', await optimizeImage(file, 1200));
      var result = await api('/api/profile-art', { method: 'POST', body: form });
      app.portrait.profileImage = result.profileImage;
      note.update('success', 'Artwork saved', 'The homepage updates in about a minute.');
      trackDeploy(result.commit, 'Profile artwork');
      refreshActivitySoon();
      portraitUi.busy = false;
      setLoading(button, false);
      clearArtworkSelection();
      return;
    } catch (error) { note.update('error', 'The artwork was not saved', error.message); }
    portraitUi.busy = false;
    setLoading(button, false);
  }
  $('saveArtwork').addEventListener('click', saveArtwork);
  $('restoreArtwork').addEventListener('click', async function () {
    if (portraitUi.busy || !(await confirmAction({ title: 'Restore the original artwork?', text: 'Your uploaded artwork is replaced with the original Danny4686 profile image.', confirm: 'Restore original' }))) return;
    portraitUi.busy = true;
    var note = toast('loading', 'Restoring the original artwork…');
    try {
      var result = await api('/api/profile-art', { method: 'POST', json: { reset: true } });
      app.portrait.profileImage = result.profileImage;
      note.update('success', 'Original artwork restored');
      trackDeploy(result.commit, 'Restore artwork');
      refreshActivitySoon();
    } catch (error) { note.update('error', 'The artwork was not restored', error.message); }
    portraitUi.busy = false;
    clearArtworkSelection();
  });
  views.homepage = {
    show: function () { if (!app.portrait) loadPortrait(); else renderPortrait(); },
    isDirty: function () { return Boolean($('artworkInput').files[0]); },
    discard: clearArtworkSelection,
    save: saveArtwork
  };

  /* ---------- Settings (arcade + loading intro) ---------- */
  var arcade = { draft: [], busy: false };
  function gameById(id) { return GAMES.find(function (game) { return game.id === id; }); }
  function gameName(id) { var game = gameById(id); return game ? game.name : id; }
  async function loadSettings() {
    try { app.settings = await api('/api/site-intro'); }
    catch (error) { $('forceIntroHint').textContent = 'Could not load. ' + error.message; return; }
    arcade.draft = (app.settings.featuredGames || []).slice();
    renderArcade();
    renderIntro();
    renderOverview();
  }
  function arcadeDirty() { return Boolean(app.settings) && JSON.stringify(arcade.draft) !== JSON.stringify(app.settings.featuredGames || []); }
  function renderArcade() {
    var grid = $('gameGrid');
    grid.replaceChildren();
    GAMES.forEach(function (game) {
      var rank = arcade.draft.indexOf(game.id);
      var tile = el('button', 'game-tile');
      tile.type = 'button';
      tile.setAttribute('aria-pressed', String(rank !== -1));
      tile.disabled = !app.settings || arcade.busy || (rank === -1 && arcade.draft.length >= 6);
      tile.title = rank === -1 ? (arcade.draft.length >= 6 ? 'Remove a game first (6 maximum)' : 'Add to featured') : 'Remove from featured';
      tile.append(el('span', 'game-emoji', game.emoji), el('strong', null, game.name), el('small', null, game.category));
      if (rank !== -1) tile.appendChild(el('span', 'game-rank', String(rank + 1)));
      tile.onclick = function () {
        var index = arcade.draft.indexOf(game.id);
        if (index === -1) arcade.draft.push(game.id); else arcade.draft.splice(index, 1);
        renderArcade();
      };
      grid.appendChild(tile);
    });
    var list = $('featuredOrder');
    list.replaceChildren();
    if (!arcade.draft.length) list.appendChild(el('li', 'order-empty', 'Pick at least one game.'));
    arcade.draft.forEach(function (id, index) {
      var game = gameById(id) || { name: id, emoji: '🎮' };
      var item = el('li', 'order-item');
      item.draggable = true;
      item.dataset.id = id;
      var actions = el('span', 'row-actions');
      function action(label, symbol, disabled, run) { var button = el('button', 'icon-btn', symbol); button.type = 'button'; button.setAttribute('aria-label', label + ': ' + game.name); button.disabled = disabled || arcade.busy; button.onclick = run; return button; }
      actions.append(
        action('Move up', '↑', index === 0, function () { arcade.draft.splice(index - 1, 0, arcade.draft.splice(index, 1)[0]); renderArcade(); }),
        action('Move down', '↓', index === arcade.draft.length - 1, function () { arcade.draft.splice(index + 1, 0, arcade.draft.splice(index, 1)[0]); renderArcade(); }),
        action('Remove', '✕', false, function () { arcade.draft.splice(index, 1); renderArcade(); })
      );
      item.append(el('span', 'order-rank', String(index + 1)), el('span', 'game-emoji', game.emoji), el('span', 'order-name', game.name), actions);
      list.appendChild(item);
    });
    var count = $('featuredCount');
    count.textContent = arcade.draft.length + ' / 6';
    count.className = 'count-pill' + (arcade.draft.length === 6 ? ' warn' : arcade.draft.length === 0 ? ' off' : '');
    var dirty = arcadeDirty();
    setSaveState($('arcadeSaveState'), dirty ? 'dirty' : 'clean', !arcade.draft.length ? 'Pick at least one game' : dirty ? 'Unsaved lineup changes' : 'Lineup saved');
    $('saveArcade').disabled = !dirty || !arcade.draft.length || arcade.busy;
    $('resetArcade').disabled = !dirty || arcade.busy;
    setBadge('arcade', app.settings ? (app.settings.featuredGames || []).length + '/6' : '');
  }
  var dragId = '';
  $('featuredOrder').addEventListener('dragstart', function (event) {
    var item = event.target.closest('.order-item');
    if (!item) return;
    dragId = item.dataset.id;
    item.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', dragId);
  });
  $('featuredOrder').addEventListener('dragover', function (event) {
    var item = event.target.closest('.order-item');
    if (!dragId || !item || item.dataset.id === dragId) { event.preventDefault(); return; }
    event.preventDefault();
    var from = arcade.draft.indexOf(dragId), to = arcade.draft.indexOf(item.dataset.id);
    if (from === -1 || to === -1) return;
    arcade.draft.splice(to, 0, arcade.draft.splice(from, 1)[0]);
    renderArcade();
    var dragged = qs('.order-item[data-id="' + dragId + '"]');
    if (dragged) dragged.classList.add('dragging');
  });
  $('featuredOrder').addEventListener('dragend', function () { dragId = ''; renderArcade(); });
  $('featuredOrder').addEventListener('drop', function (event) { event.preventDefault(); });
  async function saveArcade() {
    if (!arcadeDirty() || !arcade.draft.length || arcade.busy) return;
    arcade.busy = true;
    setLoading($('saveArcade'), true);
    var note = toast('loading', 'Saving the featured lineup…');
    try {
      var result = await api('/api/site-intro', { method: 'POST', json: { featuredGames: arcade.draft.slice() } });
      app.settings = result;
      arcade.draft = (result.featuredGames || []).slice();
      note.update('success', 'Featured games saved', 'The arcade shows ' + plural(arcade.draft.length, 'featured game') + ' in this order in about a minute.');
      trackDeploy(result.commit, 'Featured games');
      refreshActivitySoon();
    } catch (error) { note.update('error', 'The lineup was not saved', error.message); }
    arcade.busy = false;
    setLoading($('saveArcade'), false);
    renderArcade();
    renderOverview();
  }
  $('saveArcade').addEventListener('click', saveArcade);
  $('resetArcade').addEventListener('click', function () { arcade.draft = (app.settings.featuredGames || []).slice(); renderArcade(); });
  views.arcade = {
    show: function () { if (!app.settings) loadSettings(); else renderArcade(); },
    isDirty: arcadeDirty,
    discard: function () { if (app.settings) arcade.draft = (app.settings.featuredGames || []).slice(); },
    save: saveArcade
  };

  function renderIntro() {
    var toggle = $('forceIntro');
    if (!app.settings) return;
    toggle.checked = Boolean(app.settings.forceSiteIntro);
    toggle.disabled = false;
    $('forceIntroHint').textContent = app.settings.forceSiteIntro ? 'On: the intro plays every time a page loads.' : 'Off: the intro plays at most once an hour per visitor.';
  }
  $('forceIntro').addEventListener('change', async function () {
    var toggle = $('forceIntro');
    var desired = toggle.checked;
    toggle.disabled = true;
    var note = toast('loading', desired ? 'Turning the intro on for every load…' : 'Restoring the hourly intro…');
    try {
      var result = await api('/api/site-intro', { method: 'POST', json: { forceSiteIntro: desired } });
      app.settings = result;
      note.update('success', desired ? 'Intro now plays on every load' : 'Intro back to once an hour');
      trackDeploy(result.commit, 'Loading intro');
      refreshActivitySoon();
    } catch (error) { note.update('error', 'The loading setting was not changed', error.message); }
    renderIntro();
    renderOverview();
  });

  /* ---------- Fresh Abyss ---------- */
  var abyssUi = { dirty: false, objectUrl: '' };
  function abyssType(source, mime, selected) {
    if (mime && mime.indexOf('video/') === 0) return 'video';
    if (mime && mime.indexOf('image/') === 0) return 'image';
    if (selected === 'video' || selected === 'image') return selected;
    return isImagePath(source) ? 'image' : 'video';
  }
  async function loadAbyss() {
    try { var data = await api('/api/fresh-abyss'); app.abyss = data.config; }
    catch (error) { $('abyssUpdated').textContent = 'Could not load. ' + error.message; return; }
    fillAbyss();
    renderOverview();
  }
  function fillAbyss() {
    var config = app.abyss;
    if (!config) return;
    if (abyssUi.objectUrl) { URL.revokeObjectURL(abyssUi.objectUrl); abyssUi.objectUrl = ''; }
    $('abyssEnabled').checked = config.enabled !== false;
    $('abyssUrl').value = config.media || config.image || '';
    $('abyssType').value = config.mediaType || '';
    $('abyssFile').value = '';
    $('abyssFile').closest('.dropzone').classList.remove('has-file');
    $('abyssFileText').textContent = 'Images, GIFs, and videos up to 30 MB';
    $('abyssUpdated').textContent = config.updatedAt ? 'Last changed ' + relTime(config.updatedAt) : 'Not changed from the dashboard yet';
    abyssUi.dirty = false;
    renderAbyss();
  }
  function renderAbyss() {
    var on = $('abyssEnabled').checked;
    var state = $('abyssState');
    state.textContent = on ? 'Visible' : 'Hidden';
    state.className = 'count-pill' + (on ? '' : ' off');
    setBadge('abyss', app.abyss ? (app.abyss.enabled !== false ? 'On' : 'Off') : '', app.abyss && app.abyss.enabled !== false ? 'on' : '');
    var preview = $('abyssPreview');
    preview.classList.toggle('is-off', !on);
    var file = $('abyssFile').files[0];
    var source = file ? (abyssUi.objectUrl || (abyssUi.objectUrl = URL.createObjectURL(file))) : publicUrl($('abyssUrl').value.trim());
    var type = abyssType(source, file ? file.type : '', $('abyssType').value);
    var key = source + '|' + type;
    if (preview.dataset.key !== key) {
      preview.dataset.key = key;
      preview.classList.remove('has-error');
      if (!source) preview.replaceChildren(el('span', null, 'Choose media'));
      else {
        var node = mediaNode(source, type === 'video', 'Fresh Abyss preview');
        node.referrerPolicy = 'no-referrer';
        if (type === 'video') node.controls = true;
        node.onerror = function () { preview.classList.add('has-error'); };
        preview.replaceChildren(node);
      }
    }
    setSaveState($('abyssSaveState'), abyssUi.dirty ? 'dirty' : 'clean', abyssUi.dirty ? 'Unsaved changes' : (on ? 'Visible · no unsaved changes' : 'Hidden · no unsaved changes'));
    $('resetAbyss').disabled = !abyssUi.dirty;
  }
  ['abyssEnabled', 'abyssUrl', 'abyssType', 'abyssFile'].forEach(function (id) {
    $(id).addEventListener(id === 'abyssUrl' ? 'input' : 'change', function () {
      if (id === 'abyssFile') {
        var file = $('abyssFile').files[0];
        if (abyssUi.objectUrl) { URL.revokeObjectURL(abyssUi.objectUrl); abyssUi.objectUrl = ''; }
        if (file && file.size > 30 * 1048576) { $('abyssFile').value = ''; file = null; toast('error', 'That file is too large', 'Fresh Abyss media can be up to 30 MB.'); }
        $('abyssFileText').textContent = file ? file.name + ' · ' + fileSize(file.size) : 'Images, GIFs, and videos up to 30 MB';
        $('abyssFile').closest('.dropzone').classList.toggle('has-file', Boolean(file));
      }
      abyssUi.dirty = true;
      renderAbyss();
    });
  });
  async function saveAbyss() {
    var button = $('saveAbyss');
    var on = $('abyssEnabled').checked;
    var url = $('abyssUrl').value.trim();
    if (!$('abyssFile').files[0] && url && !/^https:\/\//i.test(url) && url.indexOf('/assets/images/fresh_abyss/') !== 0) { $('abyssUrl').focus(); toast('error', 'Check the media link', 'Media links must start with https://'); return; }
    setLoading(button, true);
    setSaveState($('abyssSaveState'), 'saving', 'Saving…');
    var note = toast('loading', on ? 'Saving Fresh Abyss…' : 'Hiding Fresh Abyss…');
    try {
      var form = new FormData();
      form.append('enabled', String(on));
      form.append('mediaUrl', url);
      form.append('mediaType', $('abyssType').value);
      if ($('abyssFile').files[0]) form.append('media', await optimizeImage($('abyssFile').files[0], 2400));
      var result = await api('/api/fresh-abyss', { method: 'POST', body: form });
      app.abyss = result.config;
      fillAbyss();
      note.update('success', result.config.enabled ? 'Fresh Abyss saved' : 'Fresh Abyss is hidden', result.config.enabled ? 'The page updates in about a minute.' : 'The address shows the normal 404 page after the next deploy.');
      trackDeploy(result.commit, 'Fresh Abyss');
      refreshActivitySoon();
      renderOverview();
    } catch (error) {
      setSaveState($('abyssSaveState'), 'error', 'Not saved · your changes are still here');
      note.update('error', 'Fresh Abyss was not changed', error.message);
    }
    setLoading(button, false);
  }
  $('saveAbyss').addEventListener('click', saveAbyss);
  $('resetAbyss').addEventListener('click', fillAbyss);
  views.abyss = {
    show: function () { if (!app.abyss) loadAbyss(); },
    isDirty: function () { return abyssUi.dirty; },
    discard: fillAbyss,
    save: saveAbyss
  };

  /* ---------- Site controls ---------- */
  async function loadHealth() {
    try {
      var response = await fetch('/health', { credentials: 'same-origin' });
      app.health = await response.json();
    } catch (error) { app.health = null; }
    renderHealth();
  }
  function renderHealth() {
    var list = $('healthList');
    var health = app.health;
    if (!health) { list.replaceChildren(el('li', 'muted', 'Checking…')); return; }
    var rows = [
      [health.publisherConfigured, 'Publishing to GitHub', 'Publishing is not set up (GITHUB_TOKEN)'],
      [health.oauthConfigured, 'GitHub sign-in', 'GitHub sign-in is not set up'],
      [health.sessionConfigured && health.accountRestrictionConfigured, 'Owner-only access', 'Owner-only access is not fully set up'],
      [app.site ? app.site.source === 'live' : null, 'Instant close service', 'Instant close is unavailable, so the GitHub backup will be used (about a minute slower)']
    ];
    list.replaceChildren.apply(list, rows.map(function (row) {
      var item = el('li', row[0] === null ? '' : row[0] ? 'ok' : 'bad', row[0] === false ? row[2] : row[1]);
      return item;
    }));
  }
  $('refreshHealth').addEventListener('click', function () { loadHealth(); loadSiteStatus(); });
  views.site = {
    show: function () { if (!app.settings) loadSettings(); if (!app.health) loadHealth(); renderSite(); },
    isDirty: function () { return redirectDirty && !$('saveRedirect').disabled; },
    discard: function () { redirectDirty = false; renderSite(); },
    save: saveRedirect
  };

  /* ---------- Drag and drop on file zones ---------- */
  function wireDropzone(zone, input) {
    if (!zone || !input || zone.dataset.wired) return;
    zone.dataset.wired = '1';
    ['dragenter', 'dragover'].forEach(function (type) { zone.addEventListener(type, function (event) { event.preventDefault(); zone.classList.add('is-dragging'); }); });
    ['dragleave', 'drop'].forEach(function (type) { zone.addEventListener(type, function () { zone.classList.remove('is-dragging'); }); });
    zone.addEventListener('drop', function (event) {
      event.preventDefault();
      var files = event.dataTransfer && event.dataTransfer.files;
      if (!files || !files.length) return;
      var transfer = new DataTransfer();
      Array.prototype.slice.call(files, 0, input.multiple ? files.length : 1).forEach(function (file) { transfer.items.add(file); });
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  qsa('[data-dropzone]').forEach(function (zone) { wireDropzone(zone, qs('input[type="file"]', zone)); });

  /* ---------- Session ---------- */
  function renderSession() {
    if (!app.expiresAt) return;
    var minutes = Math.round((app.expiresAt - Date.now()) / 60000);
    $('sessionText').textContent = minutes > 90 ? Math.round(minutes / 60) + ' h left in session' : minutes > 0 ? minutes + ' min left in session' : 'Session ended';
  }
  function watchSession() {
    renderSession();
    setInterval(renderSession, 60000);
    var warnAt = app.expiresAt - 10 * 60000 - Date.now();
    if (warnAt > 0 && warnAt < 2147483647) setTimeout(function () { toast('info', 'Your session ends in 10 minutes', 'Save your work, then sign in again to keep going.', { duration: 15000, action: { label: 'Sign in again', run: function () { window.location.href = '/auth/login'; } } }); }, warnAt);
    var endAt = app.expiresAt - Date.now();
    if (endAt > 0 && endAt < 2147483647) setTimeout(showSessionEnded, endAt + 1000);
  }

  /* ---------- Start ---------- */
  async function start() {
    renderOverview();
    renderDeploys();
    try {
      var session = await api('/api/session');
      app.csrf = session.csrfToken;
      app.login = session.login;
      app.expiresAt = session.expiresAt;
      watchSession();
    } catch (error) {
      toast('error', 'The dashboard could not start', error.message);
      return;
    }
    route();
    loadSiteStatus();
    loadPosts();
    loadProjects();
    loadSettings();
    loadPortrait();
    loadAbyss();
    loadActivity();
    loadHealth();
    document.addEventListener('visibilitychange', function () { if (!document.hidden) loadSiteStatus(); });
    setInterval(function () { if (!document.hidden) loadSiteStatus(); }, 60000);
  }
  start();
})();
`;
