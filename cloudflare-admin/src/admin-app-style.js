export const ADMIN_CSS = String.raw`
@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:swap;src:url("https://danny4686.com/assets/fonts/inter-latin.woff2") format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Inter Fallback";src:local("Arial"),local("Helvetica Neue"),local("Helvetica");size-adjust:107%;ascent-override:90%;descent-override:22.4%;line-gap-override:0%}
:root{
  color-scheme:dark;
  --bg:#050f14;--bg-2:#07161d;--panel:#0a1c25;--panel-2:#0d2430;--raised:#102b38;
  --line:rgba(145,190,202,.15);--line-2:rgba(145,190,202,.27);
  --text:#eef7f9;--muted:#93aab3;--faint:#6c858f;
  --cyan:#68d0df;--cyan-2:#8fe2ec;--ink:#04131a;
  --mint:#8bcf9b;--gold:#f2c75c;--orange:#ed8b45;--danger:#ef7b76;--danger-2:#ff9b96;
  --radius:16px;--radius-sm:11px;--shadow:0 18px 50px rgba(0,0,0,.32);
  --sidebar:264px;--topbar:64px;
  --ease:cubic-bezier(.22,1,.36,1);
}
*{box-sizing:border-box}
html{background:var(--bg)}
body{margin:0;min-height:100vh;color:var(--text);font:15px/1.5 Inter,"Inter Fallback",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:radial-gradient(1200px 600px at 85% -10%,rgba(104,208,223,.07),transparent 60%),linear-gradient(180deg,var(--bg-2),var(--bg) 40%);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overflow-x:hidden}
::selection{background:rgba(104,208,223,.3);color:#fff}
html{scrollbar-color:rgba(104,208,223,.26) #040a0f}
h1,h2,h3{text-wrap:balance}
::view-transition-old(root),::view-transition-new(root){animation-duration:.22s;animation-timing-function:cubic-bezier(.4,0,.2,1)}
img,video{max-width:100%}
a{color:var(--cyan)}
h1,h2,h3{margin:0;letter-spacing:-.02em;line-height:1.15}
p{margin:0}
button,input,select,textarea{font:inherit;color:inherit}
:focus-visible{outline:3px solid rgba(104,208,223,.6);outline-offset:2px}
[hidden]{display:none!important}
.sr-only{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.skip-link{position:fixed;left:12px;top:-60px;z-index:100;padding:10px 14px;border-radius:10px;background:var(--cyan);color:var(--ink);font-weight:800;text-decoration:none}
.skip-link:focus{top:12px}
.muted{color:var(--muted)}
.pad{padding:14px}
.icon{width:20px;height:20px;flex:0 0 auto;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.icon.sm{width:15px;height:15px}
.eyebrow{margin:0 0 6px;color:var(--cyan);font-size:.7rem;font-weight:850;letter-spacing:.14em;text-transform:uppercase}

/* Buttons */
.btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 16px;border:1px solid transparent;border-radius:var(--radius-sm);background:var(--raised);color:var(--text);font-size:.88rem;font-weight:750;text-decoration:none;white-space:nowrap;cursor:pointer;transition:background .16s,border-color .16s,transform .16s var(--ease),filter .16s,opacity .16s}
.btn:hover{filter:brightness(1.1)}
.btn:active{transform:translateY(1px)}
.btn:disabled,.btn[aria-disabled="true"]{opacity:.45;cursor:not-allowed;filter:none;transform:none}
.btn.primary,.btn.danger,.btn.success{overflow:hidden;isolation:isolate}
.btn.primary::before,.btn.danger::before,.btn.success::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.35) 50%,transparent 70%);transform:translateX(-120%);transition:transform .75s var(--ease)}
.btn.primary:hover::before,.btn.danger:hover::before,.btn.success:hover::before{transform:translateX(120%)}
.btn:active:not(:disabled){transform:scale(.975)}
.btn.primary{background:linear-gradient(145deg,var(--cyan-2),var(--cyan));color:var(--ink);box-shadow:0 8px 22px rgba(104,208,223,.18)}
.btn.ghost{background:transparent;border-color:var(--line-2);color:var(--text)}
.btn.ghost:hover{background:rgba(255,255,255,.04)}
.btn.danger{background:linear-gradient(145deg,#ff8f89,var(--danger));color:#2a0605;box-shadow:0 8px 24px rgba(239,123,118,.22)}
.btn.danger-ghost{background:transparent;border-color:rgba(239,123,118,.45);color:var(--danger-2)}
.btn.danger-ghost:hover{background:rgba(239,123,118,.08)}
.btn.success{background:linear-gradient(145deg,#a6e3b3,var(--mint));color:#06200f;box-shadow:0 8px 24px rgba(139,207,155,.2)}
.btn.light{background:#fff;color:#3b0b09}
.btn.sm{min-height:34px;padding:0 12px;font-size:.8rem;border-radius:9px}
.btn.lg{min-height:52px;padding:0 22px;font-size:.98rem;border-radius:13px}
.btn.block{width:100%}
.btn.is-loading{color:transparent!important;pointer-events:none}
.btn.is-loading>*{visibility:hidden}
.btn.is-loading::after{content:"";position:absolute;width:18px;height:18px;border-radius:50%;border:2px solid currentColor;border-color:var(--ink) transparent var(--ink) transparent;animation:spin .8s linear infinite}
.btn.ghost.is-loading::after,.btn.danger-ghost.is-loading::after{border-color:var(--text) transparent var(--text) transparent}
.icon-btn{display:inline-grid;place-items:center;width:40px;height:40px;padding:0;border:1px solid var(--line-2);border-radius:11px;background:transparent;color:var(--text);cursor:pointer}
.icon-btn:hover{background:rgba(255,255,255,.05)}
.icon-btn:disabled{opacity:.35;cursor:not-allowed}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}

/* App shell */
.app{display:grid;grid-template-columns:var(--sidebar) minmax(0,1fr);min-height:100vh}
.sidebar{position:sticky;top:0;height:100vh;height:100dvh;display:flex;flex-direction:column;gap:14px;padding:18px 14px;border-right:1px solid var(--line);background:rgba(5,16,21,.92);overflow-y:auto;z-index:40}
.brand{display:flex;align-items:center;gap:11px;padding:4px 6px 10px}
.brand img{width:40px;height:40px;object-fit:contain}
.brand span{display:flex;flex-direction:column;min-width:0}
.brand strong{font-size:.98rem}
.brand small{color:var(--muted);font-size:.74rem}
.sidebar-close{display:none;margin-left:auto}
.nav{display:flex;flex-direction:column;gap:3px}
.nav-link{display:flex;align-items:center;gap:12px;min-height:44px;padding:0 12px;border-radius:12px;color:var(--muted);font-weight:700;font-size:.9rem;text-decoration:none;transition:background .15s,color .15s}
.nav-link:hover{background:rgba(255,255,255,.035);color:var(--text)}
.nav-link[aria-current="page"]{background:linear-gradient(90deg,rgba(104,208,223,.16),rgba(104,208,223,.04));color:var(--text);box-shadow:inset 3px 0 0 var(--cyan)}
.nav-link[aria-current="page"] .icon{color:var(--cyan)}
.nav-label{flex:1;min-width:0}
.nav-badge{min-width:24px;padding:2px 7px;border-radius:999px;background:rgba(255,255,255,.06);color:var(--muted);font-size:.7rem;font-weight:800;text-align:center}
.nav-badge.off{background:rgba(239,123,118,.14);color:var(--danger-2)}
.nav-badge.on{background:rgba(139,207,155,.14);color:var(--mint)}
.sidebar-status{margin-top:auto;display:grid;gap:10px;padding:13px;border:1px solid var(--line);border-radius:14px;background:var(--panel)}
.sidebar-status-row{display:flex;align-items:center;gap:9px;font-size:.84rem;font-weight:750}
.dot{width:9px;height:9px;flex:0 0 auto;border-radius:50%;background:var(--faint)}
[data-site-state="open"] .dot{background:var(--mint);box-shadow:0 0 0 4px rgba(139,207,155,.14)}
[data-site-state="closed"] .dot{background:var(--danger);box-shadow:0 0 0 4px rgba(239,123,118,.18);animation:pulse 1.6s infinite}
[data-site-state="closed"].sidebar-status{border-color:rgba(239,123,118,.45);background:rgba(239,123,118,.07)}
.sidebar-user{display:flex;align-items:center;gap:10px;padding:10px 4px 0;border-top:1px solid var(--line)}
.avatar{display:grid;place-items:center;width:34px;height:34px;flex:0 0 auto;border-radius:50%;background:var(--raised);color:var(--cyan);font-weight:850}
.user-name{display:flex;flex-direction:column;min-width:0;flex:1}
.user-name strong{font-size:.84rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.user-name small{color:var(--faint);font-size:.72rem}
.main{min-width:0;display:flex;flex-direction:column}
.closed-banner{position:sticky;top:0;z-index:31;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:10px clamp(16px,3vw,32px);background:linear-gradient(90deg,#b8322d,#d9534d);color:#fff;font-size:.88rem}
.closed-banner a{color:#fff;font-weight:800}
.topbar{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:12px;min-height:var(--topbar);padding:10px clamp(16px,3vw,32px);border-bottom:1px solid var(--line);background:rgba(5,15,20,.84);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.closed-banner:not([hidden])+.topbar{top:44px}
.menu-btn{display:none}
.topbar-title{flex:1;min-width:0;font-size:1rem;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.topbar-right{display:flex;align-items:center;gap:10px}
.deploy{position:relative}
.deploy-pill{display:inline-flex;align-items:center;gap:9px;min-height:36px;padding:0 13px;border:1px solid var(--line-2);border-radius:999px;background:var(--panel);color:var(--muted);font-size:.8rem;font-weight:750;cursor:pointer}
.deploy-pill[data-state="idle"] .dot,.deploy-pill[data-state="live"] .dot{background:var(--mint)}
.deploy-pill[data-state="pending"]{color:var(--text);border-color:rgba(242,199,92,.4)}
.deploy-pill[data-state="pending"] .dot{background:var(--gold);animation:pulse 1.2s infinite}
.deploy-pill[data-state="live"]{color:var(--mint);border-color:rgba(139,207,155,.45)}
.deploy-pill[data-state="slow"]{color:var(--orange);border-color:rgba(237,139,69,.45)}
.deploy-pill[data-state="slow"] .dot{background:var(--orange)}
.deploy-panel{position:absolute;right:0;top:calc(100% + 8px);width:min(360px,calc(100vw - 24px));max-height:60vh;overflow:auto;padding:12px;border:1px solid var(--line-2);border-radius:14px;background:var(--panel);box-shadow:var(--shadow);z-index:50}
.deploy-panel ol{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.deploy-empty{color:var(--muted);font-size:.84rem}
.deploy-item{display:grid;grid-template-columns:auto 1fr;gap:4px 10px;align-items:center;padding:9px 10px;border-radius:10px;background:rgba(255,255,255,.03);font-size:.84rem}
.deploy-item small{grid-column:2;color:var(--muted)}
.deploy-item a{color:var(--muted)}
.deploy-item[data-state="pending"] .dot{background:var(--gold);animation:pulse 1.2s infinite}
.deploy-item[data-state="live"] .dot{background:var(--mint)}
.deploy-item[data-state="slow"] .dot{background:var(--orange)}
.scrim{position:fixed;inset:0;z-index:39;background:rgba(0,0,0,.55);backdrop-filter:blur(2px)}
.content{width:100%;max-width:1480px;margin:0 auto;padding:clamp(16px,3vw,34px) clamp(14px,3vw,34px) 40px;outline:none}

/* Views */
.view{display:grid;gap:clamp(14px,2vw,22px);animation:fadeIn .22s var(--ease)}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.view-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.view-head h1{font-size:clamp(1.6rem,3vw,2.2rem)}
.lede{max-width:660px;margin-top:6px;color:var(--muted)}
.view-actions{display:flex;gap:10px;flex-wrap:wrap}
.panel,.card{min-width:0;padding:clamp(15px,2vw,20px);border:1px solid var(--line);border-radius:var(--radius);background:linear-gradient(180deg,rgba(255,255,255,.018),transparent 120px),var(--panel)}
.panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap}
.panel-head h2{font-size:1.06rem}
.panel-head p{margin-top:4px;color:var(--muted);font-size:.86rem}
.stack{display:grid;gap:clamp(14px,2vw,20px);align-content:start;min-width:0}
fieldset.card{margin:0}
fieldset.card>legend{float:left;width:100%}
fieldset.card>legend+*{clear:both}
.card-title{margin:0 0 12px;padding:0;font-size:.95rem;font-weight:800}
.card-title-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px}
.card-title-row .card-title{margin:0}
.count-pill{padding:5px 11px;border-radius:999px;background:rgba(104,208,223,.1);color:var(--cyan);font-size:.78rem;font-weight:850;white-space:nowrap}
.count-pill.warn{background:rgba(242,199,92,.12);color:var(--gold)}
.count-pill.off{background:rgba(239,123,118,.12);color:var(--danger-2)}

/* Status hero */
.status-hero{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;padding:clamp(18px,2.4vw,26px);border:1px solid var(--line-2);border-radius:20px;background:var(--panel)}
.status-hero-main{display:flex;align-items:center;gap:18px;min-width:0;flex:1 1 320px}
.status-hero h2{font-size:clamp(1.25rem,2.4vw,1.6rem)}
.status-hero p[data-site-text]{margin-top:5px;color:var(--muted);max-width:620px}
.status-hero-actions{display:flex;gap:10px;flex-wrap:wrap}
.status-orb{position:relative;width:54px;height:54px;flex:0 0 auto;border-radius:50%;background:var(--raised)}
.status-orb::after{content:"";position:absolute;inset:16px;border-radius:50%;background:var(--faint)}
[data-site-state="open"].status-hero{border-color:rgba(139,207,155,.35);background:radial-gradient(circle at 0 50%,rgba(139,207,155,.12),transparent 45%),var(--panel)}
[data-site-state="open"] .status-orb{background:rgba(139,207,155,.14)}
[data-site-state="open"] .status-orb::after{background:var(--mint);box-shadow:0 0 22px rgba(139,207,155,.6)}
[data-site-state="closed"].status-hero{border-color:rgba(239,123,118,.55);background:radial-gradient(circle at 0 50%,rgba(239,123,118,.2),transparent 50%),#1c1012}
[data-site-state="closed"] .status-orb{background:rgba(239,123,118,.18);animation:pulse 1.6s infinite}
[data-site-state="closed"] .status-orb::after{background:var(--danger);box-shadow:0 0 26px rgba(239,123,118,.75)}
[data-site-state="busy"] .status-orb::after{background:var(--gold);animation:pulse 1s infinite}

/* Overview */
.stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(max(min(100%,190px),calc((100% - 24px) / 3)),1fr));gap:12px}
.stat{display:grid;gap:6px;padding:15px 16px;border:1px solid var(--line);border-radius:14px;background:var(--panel);color:var(--text);text-decoration:none;transition:border-color .15s,transform .15s var(--ease)}
.stat:hover{border-color:var(--line-2);transform:translateY(-2px)}
.stat-label{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:.76rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
.stat-label .icon{width:17px;height:17px;color:var(--cyan)}
.stat-value{font-size:1.5rem;font-weight:850;letter-spacing:-.03em}
.stat-note{color:var(--muted);font-size:.8rem}
.skeleton-row{display:flex;align-items:center;gap:10px;padding:9px 10px}
.skeleton-row .skeleton:first-child{width:46px;height:46px;min-width:46px;border-radius:9px}
.skeleton-row span:last-child{display:grid;gap:7px;flex:1}
.skeleton-row span:last-child .skeleton{height:10px;width:80%}
.skeleton-row span:last-child .skeleton+.skeleton{width:45%}
.skeleton{display:inline-block;min-width:60px;height:1em;border-radius:6px;background:linear-gradient(90deg,rgba(255,255,255,.04),rgba(255,255,255,.09),rgba(255,255,255,.04));background-size:200% 100%;animation:shimmer 1.3s infinite}
@keyframes shimmer{to{background-position:-200% 0}}
.overview-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:clamp(14px,2vw,22px);align-items:start}
.quick-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,200px),1fr));gap:10px}
.quick{display:flex;align-items:center;gap:12px;padding:13px;border:1px solid var(--line);border-radius:13px;background:rgba(255,255,255,.02);color:var(--text);text-decoration:none;transition:border-color .15s,background .15s}
.quick:hover{border-color:rgba(104,208,223,.4);background:rgba(104,208,223,.05)}
.quick .icon{width:22px;height:22px;color:var(--cyan)}
.quick span{display:flex;flex-direction:column;min-width:0}
.quick strong{font-size:.9rem}
.quick small{color:var(--muted);font-size:.78rem}
.activity{list-style:none;margin:0;padding:0;display:grid}
.activity li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 12px;padding:10px 2px;border-top:1px solid var(--line)}
.activity li:first-child{border-top:0}
.activity a{color:var(--text);text-decoration:none;font-weight:650;font-size:.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.activity a:hover{color:var(--cyan)}
.activity time{color:var(--faint);font-size:.78rem;white-space:nowrap}
.activity small{grid-column:1/-1;color:var(--faint);font-size:.74rem}

/* Split list + editor */
.split{display:grid;grid-template-columns:minmax(260px,330px) minmax(0,1fr);gap:clamp(14px,2vw,22px);align-items:start}
.list-pane{position:sticky;top:calc(var(--topbar) + 16px);display:flex;flex-direction:column;max-height:calc(100vh - var(--topbar) - 32px);padding:0;overflow:hidden}
.list-tools{display:grid;gap:10px;padding:14px;border-bottom:1px solid var(--line)}
.list-caption{color:var(--muted);font-size:.84rem}
.search input{width:100%}
.chips{display:flex;gap:6px;flex-wrap:wrap}
.chip{display:inline-flex;align-items:center;gap:6px;min-height:30px;padding:0 10px;border:1px solid var(--line-2);border-radius:999px;background:transparent;color:var(--muted);font-size:.76rem;font-weight:750;cursor:pointer}
.chip span{color:var(--faint)}
.chip[aria-pressed="true"]{border-color:rgba(104,208,223,.5);background:rgba(104,208,223,.12);color:var(--text)}
.list>*{min-width:0}
.list{flex:1;overflow-y:auto;padding:8px;display:grid;gap:4px;align-content:start;overscroll-behavior:contain}
.list-item{text-decoration:none;display:flex;align-items:center;gap:10px;width:100%;min-height:58px;padding:9px 10px;border:1px solid transparent;border-radius:12px;background:transparent;color:var(--text);text-align:left;cursor:pointer}
.list-item:hover{background:rgba(255,255,255,.035)}
.list-item[aria-current="true"]{border-color:rgba(104,208,223,.4);background:rgba(104,208,223,.08)}
.list-thumb{width:46px;height:46px;flex:0 0 auto;border-radius:9px;object-fit:cover;background:var(--raised)}
.list-text{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.list-text strong{font-size:.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.list-text small{display:flex;align-items:center;gap:7px;color:var(--faint);font-size:.74rem}
.tag{padding:1px 7px;border-radius:6px;background:rgba(104,208,223,.12);color:var(--cyan);font-size:.66rem;font-weight:850;letter-spacing:.05em}
.tag.card{background:rgba(139,207,155,.13);color:var(--mint)}
.tag.soon,.tag.draft{background:rgba(242,199,92,.13);color:var(--gold)}
.tag.live{background:rgba(139,207,155,.13);color:var(--mint)}
.row-actions{display:flex;gap:4px}
.row-actions{flex:0 0 auto}
.row-actions .icon-btn{width:28px;height:28px;border-radius:8px;font-size:.82rem}
.project-row{display:flex;align-items:center;gap:4px;border-radius:12px}
.project-row .list-item{flex:1;min-width:0}
.list-empty{padding:22px 14px;color:var(--muted);text-align:center;font-size:.88rem}

/* Editor */
.editor-pane{min-width:0;display:grid;gap:14px}
.editor{container-type:inline-size;display:grid;gap:clamp(12px,1.6vw,18px);min-width:0}
.editor-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.editor-head h2{font-size:clamp(1.2rem,2vw,1.45rem)}
.editor-grid{display:grid;gap:clamp(12px,1.6vw,18px);min-width:0}
.editor-main{display:grid;gap:clamp(12px,1.6vw,18px);min-width:0}
.editor-side{min-width:0;width:100%;max-width:440px}
@container (min-width:700px){.editor-side{max-width:none}}
.side-sticky{display:grid;gap:12px}
@container (min-width:700px){
  .editor-grid{grid-template-columns:minmax(0,1fr) clamp(250px,32cqi,320px);align-items:start}
  .side-sticky{position:sticky;top:calc(var(--topbar) + 16px)}
}
.field{display:grid;gap:6px;min-width:0;margin-bottom:12px;align-content:start}
.field:last-child{margin-bottom:0}
.field-label{display:flex;align-items:baseline;justify-content:space-between;gap:10px;color:#c5d6dc;font-size:.82rem;font-weight:750}
.counter{color:var(--faint);font-style:normal;font-size:.72rem;font-weight:650;font-variant-numeric:tabular-nums}
.counter.near{color:var(--gold)}
.counter.full{color:var(--danger-2)}
.field-hint{color:var(--faint);font-size:.76rem}
.field-hint.error{color:var(--danger-2)}
input:not([type=checkbox]):not([type=radio]):not([type=file]),select,textarea{width:100%;min-height:44px;padding:10px 12px;border:1px solid var(--line-2);border-radius:11px;background:#06141a;color:var(--text);transition:border-color .15s,box-shadow .15s}
textarea{min-height:96px;resize:vertical;line-height:1.55}
input::placeholder,textarea::placeholder{color:#5c757f}
input:focus,select,textarea:focus{outline:none}
input:focus,select:focus,textarea:focus{border-color:rgba(104,208,223,.65);box-shadow:0 0 0 3px rgba(104,208,223,.14)}
input[aria-invalid="true"],textarea[aria-invalid="true"]{border-color:rgba(239,123,118,.7)}
.prefixed{display:flex;align-items:stretch;min-width:0;border:1px solid var(--line-2);border-radius:11px;background:#06141a;overflow:hidden}
.prefixed:focus-within{border-color:rgba(104,208,223,.65);box-shadow:0 0 0 3px rgba(104,208,223,.14)}
.prefix{display:flex;align-items:center;padding:0 4px 0 12px;color:var(--faint);font-size:.84rem;white-space:nowrap}
.prefixed input{border:0!important;box-shadow:none!important;padding-left:2px!important;min-width:0}
.row{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));gap:12px;margin-bottom:12px}
.row:last-child{margin-bottom:0}
.row .field{margin-bottom:0}
.mode-picker{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:10px}
.mode-option{position:relative;cursor:pointer}
.mode-option input{position:absolute;opacity:0;pointer-events:none}
.mode-option span{display:grid;gap:4px;height:100%;padding:13px 14px;border:1px solid var(--line-2);border-radius:13px;background:rgba(255,255,255,.015);transition:border-color .15s,background .15s}
.mode-option strong{font-size:.9rem}
.mode-option small{color:var(--muted);font-size:.78rem;line-height:1.4}
.mode-option input:checked+span{border-color:var(--cyan);background:rgba(104,208,223,.09);box-shadow:inset 0 0 0 1px var(--cyan)}
.mode-option input:focus-visible+span{outline:3px solid rgba(104,208,223,.6);outline-offset:2px}
.dropzone{position:relative;display:flex;align-items:center;gap:12px;min-height:84px;padding:14px;border:1.5px dashed var(--line-2);border-radius:13px;background:rgba(255,255,255,.015);cursor:pointer;transition:border-color .15s,background .15s}
.dropzone.tall{min-height:120px}
.dropzone:hover,.dropzone.is-dragging{border-color:var(--cyan);background:rgba(104,208,223,.06)}
.dropzone.has-file{border-style:solid;border-color:rgba(139,207,155,.5);background:rgba(139,207,155,.05)}
.dropzone input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%}
.dropzone:focus-within{outline:3px solid rgba(104,208,223,.6);outline-offset:2px}
.dropzone-copy{display:grid;gap:3px;min-width:0;pointer-events:none}
.dropzone-copy strong{font-size:.88rem}
.dropzone-copy small{color:var(--muted);font-size:.78rem;overflow-wrap:anywhere}
.dropzone::before{content:"";width:38px;height:38px;flex:0 0 auto;border-radius:10px;background:rgba(104,208,223,.12) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2368d0df' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 16V4M7 9l5-5 5 5M5 20h14'/%3E%3C/svg%3E") center/20px no-repeat}
.dropzone.has-file::before{background-color:rgba(139,207,155,.14);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238bcf9b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5 12 5 5 9-10'/%3E%3C/svg%3E")}
.sections{display:grid;gap:12px;margin-top:12px}
.section-card{display:grid;gap:10px;padding:14px;border:1px solid var(--line);border-radius:13px;background:rgba(0,0,0,.14)}
.section-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.section-head strong{display:flex;align-items:center;gap:9px;font-size:.86rem}
.section-num{display:grid;place-items:center;width:26px;height:26px;border-radius:8px;background:rgba(104,208,223,.12);color:var(--cyan);font-size:.78rem;font-weight:850}
.media-chips{display:flex;gap:8px;flex-wrap:wrap}
.media-chip{position:relative;width:76px;height:76px;border-radius:10px;overflow:hidden;border:1px solid var(--line-2);background:var(--raised)}
.media-chip img,.media-chip video{width:100%;height:100%;object-fit:cover;display:block}
.media-chip.is-new{border-color:rgba(139,207,155,.6)}
.media-chip button{position:absolute;top:4px;right:4px;width:22px;height:22px;display:grid;place-items:center;padding:0;border:0;border-radius:50%;background:rgba(0,0,0,.72);color:#fff;cursor:pointer;font-size:.9rem;line-height:1}
.toggle-list{display:grid;gap:12px;margin-top:4px}
.switch{display:flex;align-items:center;gap:12px;cursor:pointer;min-width:0}
.switch input{position:absolute;opacity:0;width:1px;height:1px}
.switch .track{position:relative;width:46px;height:26px;flex:0 0 auto;border-radius:999px;background:#25404b;transition:background .18s}
.switch .track::after{content:"";position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#dbe8ec;box-shadow:0 2px 6px rgba(0,0,0,.35);transition:transform .2s var(--ease)}
.switch input:checked+.track{background:var(--cyan)}
.switch input:checked+.track::after{transform:translateX(20px);background:#fff}
.switch input:focus-visible+.track{outline:3px solid rgba(104,208,223,.6);outline-offset:2px}
.switch input:disabled+.track{opacity:.5}
.switch-label{display:grid;gap:2px;min-width:0;font-size:.86rem;font-weight:750}
.switch-label strong{font-size:.88rem}
.switch-label small{color:var(--muted);font-size:.78rem;font-weight:500}
.switch.big .track{width:54px;height:30px}
.switch.big .track::after{width:24px;height:24px}
.switch.big input:checked+.track::after{transform:translateX(24px)}
.swatches{display:flex;gap:8px;flex-wrap:wrap}
.swatch{position:relative;cursor:pointer}
.swatch input{position:absolute;opacity:0}
.swatch span{display:inline-flex;align-items:center;gap:8px;min-height:38px;padding:0 13px 0 9px;border:1px solid var(--line-2);border-radius:999px;font-size:.82rem;font-weight:750}
.swatch span::before{content:"";width:18px;height:18px;border-radius:50%;background:var(--swatch)}
.swatch input:checked+span{border-color:var(--swatch);background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 1px var(--swatch)}
.swatch input:focus-visible+span{outline:3px solid rgba(104,208,223,.6);outline-offset:2px}
.accent-cyan{--swatch:#68d0df}.accent-gold{--swatch:#f2c75c}.accent-mint{--swatch:#8bcf9b}.accent-orange{--swatch:#ed8b45}
.image-field{display:grid;gap:8px;justify-items:start}
.image-field .dropzone{width:100%}

/* Sticky action bar */
.action-bar{position:sticky;bottom:12px;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:11px 12px 11px 16px;border:1px solid var(--line-2);border-radius:15px;background:rgba(10,28,37,.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 14px 40px rgba(0,0,0,.4)}
.action-buttons{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto}
.save-state{display:inline-flex;align-items:center;gap:8px;color:var(--muted);font-size:.84rem;font-weight:700}
.save-state::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--mint)}
.save-state[data-state="dirty"]{color:var(--gold)}
.save-state[data-state="dirty"]::before{background:var(--gold)}
.save-state[data-state="saving"]::before{background:var(--cyan);animation:pulse 1s infinite}
.save-state[data-state="error"]{color:var(--danger-2)}
.save-state[data-state="error"]::before{background:var(--danger)}

/* Previews */
.preview-card{padding:12px;border:1px solid var(--line);border-radius:var(--radius);background:var(--panel)}
.preview-label{display:flex;justify-content:space-between;gap:8px;margin-bottom:10px;color:var(--faint);font-size:.7rem;font-weight:850;letter-spacing:.1em;text-transform:uppercase}
.preview-label span:last-child{color:var(--cyan)}
.journal-preview,.project-preview{overflow:hidden;border:1px solid var(--line-2);border-radius:14px;background:#081820}
.journal-preview-media,.project-preview-media{display:grid;place-items:center;aspect-ratio:16/9;background:linear-gradient(135deg,#0d2a35,#071419);color:var(--faint);font-size:.8rem;overflow:hidden}
.journal-preview-media img,.journal-preview-media video,.project-preview-media img{width:100%;height:100%;object-fit:cover;display:block}
.journal-preview-media.contain img,.journal-preview-media.contain video,.project-preview-media.contain img{object-fit:contain}
.journal-preview-body,.project-preview-body{display:grid;gap:7px;padding:14px}
.journal-preview-meta,.project-preview-meta{display:flex;justify-content:space-between;gap:8px;color:var(--cyan);font-size:.68rem;font-weight:850;letter-spacing:.1em}
.journal-preview-meta time{color:var(--faint)}
.journal-preview h3,.project-preview h3{font-size:1.05rem;overflow-wrap:anywhere}
.journal-preview p,.project-preview p{color:var(--muted);font-size:.83rem;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}
.journal-preview strong{color:var(--cyan);font-size:.82rem}
.project-preview{border-top:3px solid var(--accent,#68d0df)}
.project-preview.compact .project-preview-media{aspect-ratio:16/7}
.project-preview-meta em{padding:1px 7px;border-radius:6px;background:rgba(255,255,255,.07);color:var(--text);font-style:normal}
.project-preview b{justify-self:start;margin-top:4px;padding:7px 12px;border-radius:9px;background:var(--accent,#68d0df);color:var(--ink);font-size:.8rem}
.project-preview.is-draft{opacity:.6}
.side-note{color:var(--muted);font-size:.82rem;padding:0 4px}
.notice-banner{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 14px;border:1px solid rgba(242,199,92,.38);border-radius:13px;background:rgba(242,199,92,.07)}
.notice-banner span:first-child{display:grid;gap:2px}
.notice-banner small{color:var(--muted)}
.notice-actions{display:flex;gap:8px}

/* Homepage */
.choice-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:14px}
.choice{position:relative;display:grid;grid-template-rows:auto 1fr;padding:0;border:1.5px solid var(--line-2);border-radius:16px;background:rgba(255,255,255,.015);color:var(--text);text-align:left;cursor:pointer;overflow:hidden;transition:border-color .15s,transform .15s var(--ease)}
.choice:hover{transform:translateY(-2px)}
.choice[aria-checked="true"]{border-color:var(--cyan);box-shadow:0 0 0 1px var(--cyan),0 14px 36px rgba(104,208,223,.12)}
.choice:disabled{cursor:progress}
.choice-media{position:relative;display:grid;place-items:center;aspect-ratio:4/3;background:radial-gradient(circle at 50% 40%,rgba(104,208,223,.16),transparent 60%),#071419}
.choice-media img{width:78%;height:88%;object-fit:contain}
.choice-empty{position:absolute;inset:auto 12px 12px;padding:8px 10px;border-radius:9px;background:rgba(0,0,0,.6);color:var(--muted);font-size:.78rem;text-align:center}
.choice-copy{display:grid;gap:4px;padding:14px 16px 16px}
.choice-copy strong{font-size:.98rem}
.choice-copy small{color:var(--muted);font-size:.82rem}
.choice-check{position:absolute;top:12px;right:12px;width:28px;height:28px;border-radius:50%;border:2px solid var(--line-2);background:rgba(0,0,0,.4)}
.choice[aria-checked="true"] .choice-check{border-color:var(--cyan);background:var(--cyan) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2304131a' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5 12 5 5 9-10'/%3E%3C/svg%3E") center/16px no-repeat}
.artwork-editor{display:grid;grid-template-columns:minmax(160px,240px) minmax(0,1fr);gap:18px;align-items:start}
.artwork-preview{display:grid;place-items:center;aspect-ratio:1;border:1px solid var(--line);border-radius:16px;background:radial-gradient(circle,rgba(104,208,223,.14),transparent 65%),#071419;overflow:hidden}
.artwork-preview img{width:88%;height:88%;object-fit:contain}
.artwork-controls{display:grid;gap:12px;min-width:0}
.inline-actions{display:flex;gap:8px;flex-wrap:wrap}

/* Arcade */
.arcade-layout{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(280px,1fr);gap:clamp(14px,2vw,22px);align-items:start}
.game-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr));gap:10px}
.game-tile{position:relative;display:grid;gap:6px;justify-items:start;padding:13px;border:1.5px solid var(--line);border-radius:14px;background:rgba(255,255,255,.015);color:var(--text);text-align:left;cursor:pointer;transition:border-color .15s,background .15s}
.game-tile:hover{border-color:var(--line-2)}
.game-tile[aria-pressed="true"]{border-color:var(--cyan);background:rgba(104,208,223,.08)}
.game-tile:disabled{opacity:.4;cursor:not-allowed}
.game-emoji{font-size:1.5rem;line-height:1}
.game-tile strong{font-size:.86rem}
.game-tile small{color:var(--faint);font-size:.72rem}
.game-rank{position:absolute;top:9px;right:9px;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--cyan);color:var(--ink);font-size:.74rem;font-weight:900}
.order-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.order-item{display:flex;align-items:center;gap:10px;padding:9px 9px 9px 12px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.02);cursor:grab;touch-action:none}
.order-item.dragging{opacity:.5;border-color:var(--cyan)}
.order-rank{display:grid;place-items:center;width:26px;height:26px;flex:0 0 auto;border-radius:8px;background:rgba(104,208,223,.12);color:var(--cyan);font-size:.8rem;font-weight:900}
.order-name{flex:1;min-width:0;font-weight:700;font-size:.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.order-empty{padding:18px;border:1.5px dashed var(--line-2);border-radius:12px;color:var(--muted);text-align:center;font-size:.86rem}
.action-bar.floating{margin-top:4px}

/* Fresh Abyss */
.abyss-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.9fr);gap:clamp(14px,2vw,22px);align-items:start}
.abyss-preview-panel{position:sticky;top:calc(var(--topbar) + 16px)}
.abyss-preview{display:grid;place-items:center;min-height:260px;aspect-ratio:4/3;border-radius:13px;background:#000;overflow:hidden;color:var(--faint);font-size:.86rem}
.abyss-preview img,.abyss-preview video{width:100%;height:100%;object-fit:contain;display:block}
.abyss-preview.is-off{filter:grayscale(1) brightness(.4)}
.abyss-preview.has-error::after{content:"This media could not be loaded";position:absolute;padding:8px 12px;border-radius:9px;background:rgba(0,0,0,.7);color:var(--danger-2)}
.divider{display:flex;align-items:center;gap:10px;margin:14px 0;color:var(--faint);font-size:.74rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.divider::before,.divider::after{content:"";flex:1;height:1px;background:var(--line)}

/* Site controls */
.site-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr));gap:clamp(14px,2vw,22px);align-items:start}
.facts{display:grid;gap:8px;margin:16px 0 0;padding:14px 14px 14px 32px;border-radius:12px;background:rgba(255,255,255,.025);color:var(--muted);font-size:.84rem}
.health{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.health li{display:flex;align-items:center;gap:10px;font-size:.86rem}
.health li::before{content:"";width:9px;height:9px;flex:0 0 auto;border-radius:50%;background:var(--faint)}
.health li.ok::before{background:var(--mint)}
.health li.bad::before{background:var(--danger)}
.health li.bad{color:var(--danger-2)}
.health li.muted::before{display:none}

/* Toasts and dialogs */
.toasts{position:fixed;right:18px;bottom:18px;z-index:200;display:grid;gap:10px;width:min(380px,calc(100vw - 24px));pointer-events:none}
.toast{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:4px 12px;align-items:start;padding:13px 12px 13px 14px;border:1px solid var(--line-2);border-radius:14px;background:#0e2631;box-shadow:var(--shadow);pointer-events:auto;animation:toastIn .25s var(--ease)}
.toast.leaving{animation:toastOut .2s ease forwards}
@keyframes toastIn{from{opacity:0;transform:translateY(10px) scale(.98)}}
@keyframes toastOut{to{opacity:0;transform:translateY(6px)}}
.toast-icon{display:grid;place-items:center;width:24px;height:24px;margin-top:1px;border-radius:50%;font-size:.8rem;font-weight:900}
.toast.success .toast-icon{background:rgba(139,207,155,.18);color:var(--mint)}
.toast.error{border-color:rgba(239,123,118,.5)}
.toast.error .toast-icon{background:rgba(239,123,118,.18);color:var(--danger-2)}
.toast.info .toast-icon{background:rgba(104,208,223,.16);color:var(--cyan)}
.toast.loading .toast-icon::after{content:"";width:13px;height:13px;border-radius:50%;border:2px solid var(--cyan);border-right-color:transparent;animation:spin .8s linear infinite}
.toast strong{font-size:.88rem}
.toast p{grid-column:2;color:var(--muted);font-size:.8rem}
.toast-close{grid-row:1/span 2;grid-column:3;width:26px;height:26px;padding:0;border:0;border-radius:8px;background:transparent;color:var(--faint);cursor:pointer;font-size:1.1rem}
.toast-action{grid-column:2;justify-self:start;margin-top:6px}
.dialog{width:min(460px,calc(100vw - 24px));padding:22px;border:1px solid var(--line-2);border-radius:18px;background:var(--panel);color:var(--text);box-shadow:var(--shadow)}
.dialog::backdrop{background:rgba(1,6,9,.72);backdrop-filter:blur(3px)}
.dialog h2{font-size:1.2rem}
.dialog p{margin-top:8px;color:var(--muted);overflow-wrap:anywhere}
.dialog-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:20px}
.dialog.danger{border-color:rgba(239,123,118,.55)}
.dialog.wide{width:min(980px,calc(100vw - 24px));max-height:calc(100vh - 24px);padding:0}
.dialog-bar{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:12px 14px 12px 20px;border-bottom:1px solid var(--line);background:var(--panel)}
.preview{padding:clamp(16px,3vw,32px);display:grid;gap:22px}
.preview-hero{border-radius:16px;overflow:hidden;background:#071419;aspect-ratio:16/8;display:grid;place-items:center;color:var(--faint)}
.preview-hero img,.preview-hero video{width:100%;height:100%;object-fit:cover}
.preview-meta{display:flex;gap:12px;color:var(--cyan);font-size:.74rem;font-weight:850;letter-spacing:.1em}
.preview h1{font-size:clamp(1.6rem,4vw,2.4rem);margin-top:8px}
.preview .preview-lead{margin-top:10px;color:var(--muted);font-size:1.04rem}
.preview-divider{padding-top:16px;border-top:1px solid var(--line);color:var(--faint);font-size:.72rem;font-weight:850;letter-spacing:.14em}
.preview-section{display:grid;gap:12px}
.preview-section p{color:#c9d8dd;line-height:1.75}
.preview-media{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}
.preview-media img,.preview-media video{width:100%;border-radius:12px}

/* Responsive */
@media (max-width:1180px){
  .split{grid-template-columns:minmax(0,1fr)}
  .list-pane{position:static;max-height:none}
  .list{max-height:300px}
  .arcade-layout,.abyss-layout{grid-template-columns:minmax(0,1fr)}
  .abyss-preview-panel{position:static}
}
@media (max-width:1023px){
  .app{grid-template-columns:minmax(0,1fr)}
  .sidebar{position:fixed;left:0;top:0;bottom:0;width:min(300px,86vw);transform:translateX(-102%);transition:transform .25s var(--ease);box-shadow:var(--shadow)}
  .sidebar.open{transform:none}
  .sidebar-close,.menu-btn{display:inline-grid}
}
@media (max-width:640px){
  body{font-size:14.5px}
  .hide-sm{display:none!important}
  .topbar{gap:8px}
  .deploy-pill{padding:0 10px}
  .view-head{align-items:flex-start}
  .view-actions{width:100%}
  .view-actions .btn{flex:1}
  .status-hero-actions,.status-hero-actions .btn{width:100%}
  .status-hero-main{align-items:flex-start;gap:12px}
  .status-orb{width:34px;height:34px}
  .status-orb::after{inset:10px}
  .choice-media{aspect-ratio:16/10}
  .artwork-editor{grid-template-columns:minmax(0,1fr)}
  .artwork-preview{max-width:240px}
  .action-bar{bottom:8px;padding:10px}
  .action-buttons{width:100%}
  .action-buttons .btn{flex:1 1 auto}
  .toasts{right:12px;left:12px;bottom:12px;width:auto}
  .closed-banner .btn{width:100%}
  .closed-banner:not([hidden])+.topbar{top:0;position:relative}
}
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
`;
