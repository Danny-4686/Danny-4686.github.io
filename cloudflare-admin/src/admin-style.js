export const ADMIN_CSS = String.raw`
:root {
  color-scheme: dark;
  --bg: #040b0f;
  --panel: rgba(8, 22, 29, .93);
  --panel-strong: #0d2028;
  --panel-soft: rgba(255,255,255,.028);
  --text: #f4fafb;
  --muted: #94aab3;
  --line: rgba(137,190,201,.19);
  --line-strong: rgba(104,208,223,.42);
  --cyan: #68d0df;
  --cyan-strong: #8be7f2;
  --gold: #f2c75c;
  --danger: #ef6d68;
  --shadow: 0 24px 70px rgba(0,0,0,.35);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  min-height: 100vh;
  color: var(--text);
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at 8% 4%, rgba(104,208,223,.14), transparent 28%),
    radial-gradient(circle at 92% 82%, rgba(242,199,92,.06), transparent 29%),
    linear-gradient(180deg, #061117, var(--bg));
}
body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255,255,255,.018), transparent 24%);
}
button, input, textarea, select { font: inherit; }
button, a, input, textarea, select { -webkit-tap-highlight-color: transparent; }
a { color: inherit; text-decoration: none; }
button { color: inherit; }
.sr-only { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.eyebrow { margin: 0 0 7px; color: var(--cyan); font-size: .68rem; font-weight: 850; letter-spacing: .15em; }
.muted { color: var(--muted); }

.primary, .secondary, .danger, .icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid transparent;
  border-radius: 13px;
  cursor: pointer;
  font-weight: 820;
  transition: transform .18s ease, filter .18s ease, border-color .18s ease, background .18s ease;
}
.primary { color: #061117; background: linear-gradient(135deg, var(--cyan-strong), var(--cyan)); box-shadow: 0 12px 26px rgba(104,208,223,.18); }
.secondary { color: var(--text); border-color: var(--line); background: rgba(255,255,255,.03); }
.danger { color: #ffd9d7; border-color: rgba(239,109,104,.35); background: rgba(239,109,104,.08); }
.icon { width: 42px; padding: 0; color: #061117; background: var(--gold); font-size: 1.35rem; }
.primary:hover, .secondary:hover, .danger:hover, .icon:hover { transform: translateY(-1px); filter: brightness(1.06); }
button:disabled { cursor: not-allowed; opacity: .45; transform: none !important; }

.admin-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 72px;
  padding: 12px max(18px, calc((100vw - 1540px) / 2));
  border-bottom: 1px solid var(--line);
  background: rgba(3, 10, 14, .9);
  backdrop-filter: blur(18px) saturate(1.05);
}
.admin-brand { display: flex; align-items: center; gap: 12px; }
.admin-brand img { width: 46px; height: 46px; object-fit: contain; }
.admin-brand span { display: flex; flex-direction: column; gap: 2px; }
.admin-brand strong { font-size: .97rem; }
.admin-brand small { color: var(--muted); font-size: .75rem; }
.header-actions { display: flex; gap: 9px; }
.header-actions a { padding: 9px 12px; border: 1px solid var(--line); border-radius: 11px; color: var(--muted); font-size: .82rem; font-weight: 760; transition: color .18s ease, border-color .18s ease, background .18s ease; }
.header-actions a:hover { color: var(--text); border-color: var(--line-strong); background: rgba(104,208,223,.05); }

.dashboard {
  width: min(1540px, calc(100% - 28px));
  margin: 20px auto 56px;
  display: grid;
  grid-template-columns: 315px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}
.sidebar {
  position: sticky;
  top: 92px;
  max-height: calc(100vh - 112px);
  overflow: auto;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 23px;
  background: var(--panel);
  box-shadow: var(--shadow);
}
.sidebar-head, .workspace-head, .card-heading, .section-toolbar, .section-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.sidebar h2, .workspace h1, .editor-card h2 { margin: 0; letter-spacing: -.035em; }
.sidebar h2 { font-size: 1.25rem; }
.sidebar-search { display: block; margin-top: 16px; }
.sidebar-search input { min-height: 43px; }
.post-list { display: grid; gap: 9px; margin-top: 12px; }
.post-item {
  width: 100%;
  padding: 13px;
  border: 1px solid var(--line);
  border-radius: 15px;
  color: var(--text);
  background: rgba(255,255,255,.024);
  text-align: left;
  cursor: pointer;
  transition: border-color .18s ease, background .18s ease, transform .18s ease;
}
.post-item:hover { transform: translateY(-1px); }
.post-item:hover, .post-item.active { border-color: var(--line-strong); background: rgba(104,208,223,.065); }
.post-item strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.post-item small { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 7px; color: var(--muted); font-size: .72rem; }
.post-state { padding: 3px 7px; border: 1px solid var(--line); border-radius: 999px; color: var(--cyan); font-size: .61rem; font-weight: 850; letter-spacing: .05em; }
.post-state.card { color: var(--gold); }
.post-state.soon { color: #ffaaa6; }

.workspace { min-width: 0; }
.workspace-head { align-items: flex-start; padding: 7px 4px 18px; }
.workspace-head h1 { margin-bottom: 7px; font-size: clamp(1.8rem, 3vw, 2.75rem); }
.workspace-head p:last-child { max-width: 720px; margin: 0; color: var(--muted); line-height: 1.6; }
.status { flex: 0 0 auto; padding: 7px 11px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); background: rgba(255,255,255,.025); font-size: .73rem; font-weight: 800; }
#postForm { display: grid; gap: 16px; }
.editor-card, .live-preview-card, .mode-help {
  border: 1px solid var(--line);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255,255,255,.028), transparent 28%), var(--panel);
  box-shadow: var(--shadow);
}
.editor-card { padding: 22px; }
.card-heading { align-items: flex-end; margin-bottom: 18px; }
.card-heading > p, .section-toolbar > div > p:last-child { max-width: 430px; margin: 0; color: var(--muted); font-size: .84rem; line-height: 1.55; text-align: right; }
.editor-card h2 { font-size: 1.35rem; }

.mode-card { overflow: hidden; }
.mode-picker { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 11px; }
.mode-option { position: relative; display: block; cursor: pointer; }
.mode-option input { position: absolute; opacity: 0; pointer-events: none; }
.mode-option > span {
  display: block;
  min-height: 108px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(255,255,255,.022);
  transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease;
}
.mode-option:hover > span { transform: translateY(-2px); border-color: rgba(104,208,223,.32); }
.mode-option input:checked + span { border-color: var(--line-strong); background: rgba(104,208,223,.075); box-shadow: inset 0 0 0 1px rgba(104,208,223,.1), 0 12px 26px rgba(0,0,0,.16); }
.mode-option strong { display: block; margin-bottom: 7px; }
.mode-option small { display: block; color: var(--muted); line-height: 1.5; }

.editor-layout { display: grid; grid-template-columns: minmax(0,1fr) 330px; gap: 16px; align-items: start; }
.editor-main { display: grid; gap: 16px; min-width: 0; }
.editor-side { position: sticky; top: 92px; display: grid; gap: 13px; }
.grid { display: grid; gap: 13px; }
.grid.two { grid-template-columns: repeat(2, minmax(0,1fr)); }
.grid.three { grid-template-columns: repeat(3, minmax(0,1fr)); }
label > span { display: block; margin-bottom: 7px; color: #dce8eb; font-size: .8rem; font-weight: 800; }
input, textarea, select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 13px;
  color: var(--text);
  background: #07151b;
  padding: 12px 13px;
  outline: none;
  transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
}
input:focus, textarea:focus, select:focus { border-color: rgba(104,208,223,.58); box-shadow: 0 0 0 3px rgba(104,208,223,.08); background: #091a21; }
textarea { resize: vertical; line-height: 1.62; }
.upload { padding: 15px; border: 1px dashed rgba(145,190,202,.31); border-radius: 16px; background: rgba(255,255,255,.018); }
.upload input { padding: 9px; background: rgba(0,0,0,.12); }
.upload small { display: block; margin-top: 8px; color: var(--muted); word-break: break-word; }
.upload.is-hidden { display: none; }

.section-toolbar { align-items: flex-end; margin-bottom: 15px; }
.section-toolbar > div > p:last-child { text-align: left; }
.sections { display: grid; gap: 13px; }
.section-card { padding: 16px; border: 1px solid var(--line); border-radius: 17px; background: rgba(255,255,255,.021); transition: border-color .18s ease, transform .18s ease; }
.section-card:focus-within { border-color: rgba(104,208,223,.33); }
.section-head { margin-bottom: 13px; }
.section-number { display: flex; align-items: center; gap: 9px; }
.section-number span { display: grid; place-items: center; width: 29px; height: 29px; border: 1px solid var(--line); border-radius: 9px; color: var(--cyan); background: rgba(104,208,223,.05); font-size: .75rem; font-weight: 850; }
.section-actions { display: flex; gap: 6px; }
.section-actions button { min-height: 34px; padding: 6px 9px; }
.section-card textarea { min-height: 145px; }
.existing-media { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
.media-chip { display: inline-flex; align-items: center; gap: 7px; padding: 6px 7px 6px 9px; border: 1px solid var(--line); border-radius: 9px; color: var(--muted); background: rgba(0,0,0,.12); font-size: .72rem; }
.media-chip button { width: 22px; height: 22px; padding: 0; border: 0; border-radius: 7px; color: #ffc7c4; background: rgba(239,109,104,.09); cursor: pointer; }
.article-fields[hidden] { display: none; }

.live-preview-card { overflow: hidden; }
.live-preview-label { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px; border-bottom: 1px solid var(--line); color: var(--muted); font-size: .63rem; font-weight: 850; letter-spacing: .09em; }
.live-preview-label span:last-child { color: var(--cyan); }
.live-preview-media { position: relative; display: grid; place-items: center; aspect-ratio: 16 / 10; overflow: hidden; border-bottom: 1px solid var(--line); color: #69808a; background: radial-gradient(circle at center, rgba(104,208,223,.1), transparent 62%), #0b1b23; }
.live-preview-media img, .live-preview-media video { width: 100%; height: 100%; object-fit: cover; }
.live-preview-media.contain img, .live-preview-media.contain video { object-fit: contain; padding: 18px; }
.live-preview-body { padding: 17px; }
.live-preview-meta { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; color: var(--muted); font-size: .7rem; font-weight: 760; }
.live-preview-meta span { padding: 4px 8px; border: 1px solid var(--line); border-radius: 999px; color: var(--cyan); font-size: .61rem; letter-spacing: .07em; }
.live-preview-body h3 { margin: 0 0 8px; font-size: 1.35rem; letter-spacing: -.035em; }
.live-preview-body p { margin: 0; color: var(--muted); font-size: .86rem; line-height: 1.58; }
.live-preview-body > strong { display: block; margin-top: 15px; color: var(--cyan); font-size: .82rem; }
.mode-help { display: flex; gap: 12px; padding: 15px; }
.mode-help-icon { display: grid; place-items: center; flex: 0 0 34px; height: 34px; border: 1px solid var(--line); border-radius: 11px; color: var(--gold); background: rgba(242,199,92,.06); }
.mode-help strong { display: block; margin-bottom: 5px; }
.mode-help p { margin: 0; color: var(--muted); font-size: .8rem; line-height: 1.52; }

.editor-actions {
  position: sticky;
  bottom: 12px;
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 9px;
  padding: 13px;
  border: 1px solid var(--line);
  border-radius: 17px;
  background: rgba(4,13,18,.94);
  box-shadow: 0 18px 45px rgba(0,0,0,.28);
  backdrop-filter: blur(15px);
}

dialog { width: min(1180px, calc(100% - 24px)); max-height: 92vh; overflow: auto; padding: 0; border: 1px solid var(--line); border-radius: 25px; color: var(--text); background: #061117; box-shadow: var(--shadow); }
dialog::backdrop { background: rgba(0,0,0,.75); backdrop-filter: blur(7px); }
.dialog-close { position: sticky; float: right; top: 12px; right: 12px; z-index: 10; width: 42px; height: 42px; margin: 12px; border: 1px solid var(--line); border-radius: 50%; color: var(--text); background: rgba(13,32,40,.95); cursor: pointer; }
.preview { padding: 28px; }
.preview-intro { display: grid; grid-template-columns: minmax(0,.9fr) minmax(0,1.1fr); gap: clamp(22px,4vw,52px); align-items: center; padding: clamp(18px,3vw,32px); border: 1px solid var(--line); border-radius: 24px; background: linear-gradient(145deg,rgba(255,255,255,.025),transparent),#081820; }
.preview-hero { overflow: hidden; aspect-ratio: 4 / 3; border: 1px solid var(--line); border-radius: 19px; background: #0b1b23; }
.preview-hero img, .preview-hero video { width: 100%; height: 100%; object-fit: cover; }
.preview-copy h1 { margin: 10px 0 13px; font-size: clamp(2.2rem,5vw,4.7rem); line-height: .98; letter-spacing: -.06em; }
.preview-copy p { color: var(--muted); line-height: 1.72; }
.preview-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 9px; color: var(--muted); font-size: .76rem; font-weight: 750; }
.preview-meta span { padding: 5px 9px; border: 1px solid var(--line); border-radius: 999px; color: var(--cyan); }
.preview-divider { display: flex; align-items: center; gap: 14px; margin: 32px 4px 20px; color: var(--cyan); font-size: .68rem; font-weight: 850; letter-spacing: .14em; }
.preview-divider::before, .preview-divider::after { content: ""; flex: 1; height: 1px; background: var(--line); }
.preview-section { width: min(900px,100%); margin: 0 auto 14px; padding: 24px; border: 1px solid var(--line); border-radius: 20px; background: rgba(10,27,35,.87); }
.preview-section h2 { margin: 0 0 13px; font-size: clamp(1.55rem,3vw,2.35rem); }
.preview-section p { color: var(--muted); line-height: 1.78; }
.preview-media { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; margin-top: 16px; }
.preview-media.single { grid-template-columns: 1fr; }
.preview-media img, .preview-media video { width: 100%; max-height: 460px; object-fit: cover; border: 1px solid var(--line); border-radius: 15px; }
.static-preview { width: min(620px,100%); margin: 42px auto; }

@media (max-width: 1160px) {
  .editor-layout { grid-template-columns: 1fr; }
  .editor-side { position: static; grid-template-columns: minmax(0,420px) minmax(0,1fr); align-items: start; }
}
@media (max-width: 940px) {
  .dashboard { grid-template-columns: 1fr; }
  .sidebar { position: static; max-height: none; }
  .post-list { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .mode-picker { grid-template-columns: 1fr; }
  .mode-option > span { min-height: 0; }
  .grid.three { grid-template-columns: 1fr 1fr; }
  .editor-actions { position: static; }
}
@media (max-width: 700px) {
  .admin-header { align-items: flex-start; padding: 10px 12px; }
  .header-actions { flex-direction: column; gap: 5px; }
  .dashboard { width: calc(100% - 14px); margin-top: 10px; }
  .workspace-head { padding-inline: 3px; }
  .workspace-head { flex-direction: column; }
  .editor-card { padding: 16px; border-radius: 18px; }
  .card-heading, .section-toolbar { align-items: flex-start; flex-direction: column; }
  .card-heading > p { text-align: left; }
  .grid.two, .grid.three, .editor-side, .post-list { grid-template-columns: 1fr; }
  .preview { padding: 15px; }
  .preview-intro { grid-template-columns: 1fr; padding: 14px; }
  .preview-hero { aspect-ratio: 16 / 10; }
  .preview-media { grid-template-columns: 1fr; }
  .editor-actions { justify-content: stretch; }
  .editor-actions button { flex: 1 1 44%; }
}
@media (max-width: 440px) {
  .admin-brand img { width: 39px; height: 39px; }
  .admin-brand small { display: none; }
  .header-actions a { padding: 7px 9px; font-size: .73rem; }
  .editor-actions button { flex-basis: 100%; }
  .section-head { align-items: flex-start; }
  .section-actions { flex-wrap: wrap; justify-content: flex-end; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .001ms !important; animation-duration: .001ms !important; }
}
`;
