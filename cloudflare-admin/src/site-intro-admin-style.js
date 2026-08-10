export const SITE_INTRO_ADMIN_CSS = String.raw`
.admin-section-tabs{grid-template-columns:repeat(3,minmax(0,1fr))}

#siteIntroManager[hidden]{display:none!important}

.site-intro-manager{
  width:100%;
}

.site-intro-manager-head{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:20px;
  margin-bottom:18px;
}

.site-intro-manager-head h1{
  margin:0;
  font-size:clamp(2rem,4vw,3.2rem);
  letter-spacing:-.05em;
}

.site-intro-manager-head p:last-child{
  max-width:720px;
  margin:8px 0 0;
  color:var(--muted);
  line-height:1.6;
}

.site-intro-manager-head a{
  flex:0 0 auto;
  padding:10px 13px;
  border:1px solid var(--line);
  border-radius:12px;
  color:var(--text);
  background:rgba(255,255,255,.025);
  font-size:.75rem;
  font-weight:800;
  text-decoration:none;
}

.site-intro-layout{
  display:grid;
  grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);
  gap:16px;
}

.site-intro-card,
.site-intro-preview-card{
  border:1px solid var(--line);
  border-radius:20px;
  background:rgba(7,21,28,.82);
  box-shadow:0 18px 42px rgba(0,0,0,.2);
}

.site-intro-card{padding:22px}

.settings-section-label{
  display:flex;
  align-items:center;
  gap:11px;
  margin-bottom:20px;
  padding-bottom:15px;
  border-bottom:1px solid var(--line);
}

.settings-section-label>span{
  width:32px;
  height:32px;
  flex:0 0 auto;
  display:grid;
  place-items:center;
  border:1px solid rgba(104,208,223,.28);
  border-radius:10px;
  color:var(--cyan);
  background:rgba(104,208,223,.055);
  font-size:.65rem;
  font-weight:900;
}

.settings-section-label strong,
.settings-section-label small{display:block}
.settings-section-label strong{font-size:.79rem}
.settings-section-label small{margin-top:3px;color:var(--muted);font-size:.66rem;line-height:1.35}

.site-intro-card-heading{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:16px;
  margin-bottom:18px;
}

.site-intro-card-heading h2{
  margin:0;
  font-size:1.35rem;
  letter-spacing:-.035em;
}

.site-intro-card-heading p{
  margin:5px 0 0;
  color:var(--muted);
  font-size:.75rem;
  line-height:1.55;
}

.site-intro-status-pill{
  padding:5px 9px;
  border:1px solid rgba(139,207,155,.28);
  border-radius:999px;
  color:#9ce1aa;
  background:rgba(139,207,155,.055);
  font-size:.59rem;
  font-weight:900;
  letter-spacing:.08em;
}

.site-intro-status-pill.is-forced{
  border-color:rgba(242,199,92,.34);
  color:#f2d67f;
  background:rgba(242,199,92,.06);
}

.site-intro-toggle-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:20px;
  padding:17px;
  border:1px solid var(--line);
  border-radius:16px;
  background:rgba(255,255,255,.018);
  cursor:pointer;
}

.site-intro-toggle-row strong,
.site-intro-toggle-row small{display:block}

.site-intro-toggle-row strong{font-size:.94rem}

.site-intro-toggle-row small{
  max-width:620px;
  margin-top:5px;
  color:var(--muted);
  font-size:.72rem;
  line-height:1.55;
}

.site-intro-switch{
  position:relative;
  width:54px;
  height:31px;
  flex:0 0 auto;
}

.site-intro-switch input{
  position:absolute;
  opacity:0;
  pointer-events:none;
}

.site-intro-switch span{
  position:absolute;
  inset:0;
  border:1px solid var(--line);
  border-radius:999px;
  background:#09171d;
  transition:background .2s ease,border-color .2s ease,box-shadow .2s ease;
}

.site-intro-switch span::after{
  content:"";
  position:absolute;
  top:4px;
  left:4px;
  width:21px;
  height:21px;
  border-radius:50%;
  background:#90a5ad;
  box-shadow:0 5px 12px rgba(0,0,0,.35);
  transition:transform .22s cubic-bezier(.2,.82,.2,1),background .2s ease;
}

.site-intro-switch input:checked+span{
  border-color:rgba(104,208,223,.5);
  background:rgba(104,208,223,.18);
  box-shadow:0 0 0 4px rgba(104,208,223,.055);
}

.site-intro-switch input:checked+span::after{
  transform:translateX(23px);
  background:#74d5e2;
}

.site-intro-switch input:disabled+span{opacity:.5;cursor:not-allowed}

.site-intro-note{
  margin:14px 2px 0;
  color:#748b94;
  font-size:.69rem;
  line-height:1.55;
}

.site-intro-feedback[hidden]{display:none!important}
.site-intro-feedback{
  margin-bottom:16px;
  padding:13px 15px;
  display:flex;
  align-items:center;
  gap:11px;
  border:1px solid var(--line);
  border-radius:15px;
  background:rgba(255,255,255,.025);
}

.site-intro-feedback-icon{
  width:30px;
  height:30px;
  flex:0 0 auto;
  display:grid;
  place-items:center;
  border:1px solid var(--line);
  border-radius:10px;
  color:var(--cyan);
  font-weight:900;
}

.site-intro-feedback strong,
.site-intro-feedback small{display:block}
.site-intro-feedback strong{font-size:.78rem}
.site-intro-feedback small{margin-top:3px;color:var(--muted);font-size:.69rem;line-height:1.45}
.site-intro-feedback.is-success{border-color:rgba(139,207,155,.3);background:rgba(139,207,155,.045)}
.site-intro-feedback.is-success .site-intro-feedback-icon{color:#9ce1aa;border-color:rgba(139,207,155,.3)}
.site-intro-feedback.is-error{border-color:rgba(239,109,104,.34);background:rgba(239,109,104,.05)}
.site-intro-feedback.is-error .site-intro-feedback-icon{color:#ffaaa6;border-color:rgba(239,109,104,.34)}

.site-intro-preview-card{
  min-height:340px;
  padding:22px;
  display:grid;
  place-items:center;
  overflow:hidden;
  position:relative;
  background:
    radial-gradient(circle at 50% 44%,rgba(104,208,223,.12),transparent 32%),
    linear-gradient(180deg,#06141b,#02080b);
}

.site-intro-preview-stage{text-align:center;position:relative;z-index:1}
.site-intro-preview-earth{
  position:relative;
  width:112px;
  height:112px;
  margin:0 auto 18px;
  display:grid;
  place-items:center;
}
.site-intro-preview-earth::before,
.site-intro-preview-earth::after{
  content:"";
  position:absolute;
  inset:-13px;
  border:1px solid rgba(104,208,223,.26);
  border-radius:50%;
  animation:siteIntroAdminOrbit 5s linear infinite;
}
.site-intro-preview-earth::after{
  inset:-25px;
  border-color:rgba(139,207,155,.14);
  animation-direction:reverse;
  animation-duration:7s;
}
.site-intro-preview-earth img{
  width:92px;
  height:92px;
  object-fit:contain;
  filter:drop-shadow(0 14px 30px rgba(104,208,223,.2));
  animation:siteIntroAdminFloat 2.8s ease-in-out infinite;
}
.site-intro-preview-stage .eyebrow{margin-bottom:6px}
.site-intro-preview-stage h3{margin:0;font-size:1.75rem;letter-spacing:-.05em}
.site-intro-preview-stage p{margin:8px 0 0;color:var(--muted);font-size:.73rem}
.site-intro-preview-updated{position:absolute;left:16px;right:16px;bottom:14px;color:#667d86;font-size:.62rem;text-align:center}

.featured-settings-card{
  margin-top:16px;
  padding:22px;
  border:1px solid var(--line);
  border-radius:20px;
  background:
    radial-gradient(circle at 88% 0,rgba(104,208,223,.07),transparent 32%),
    rgba(7,21,28,.82);
  box-shadow:0 18px 42px rgba(0,0,0,.2);
}

.featured-settings-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:20px;
  margin-bottom:18px;
}

.featured-settings-head h2{
  margin:0;
  font-size:1.45rem;
  letter-spacing:-.04em;
}

.featured-settings-head p:not(.eyebrow){
  margin:6px 0 0;
  color:var(--muted);
  font-size:.75rem;
  line-height:1.55;
}

.featured-count{
  flex:0 0 auto;
  padding:6px 10px;
  border:1px solid rgba(104,208,223,.3);
  border-radius:999px;
  color:var(--cyan);
  background:rgba(104,208,223,.055);
  font-size:.62rem;
  font-weight:900;
  letter-spacing:.05em;
}

.featured-count.is-full{
  border-color:rgba(242,199,92,.34);
  color:#f2d67f;
  background:rgba(242,199,92,.06);
}

.feature-game-options{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:9px;
}

.feature-game-option{
  min-width:0;
  padding:11px;
  display:flex;
  align-items:center;
  gap:10px;
  border:1px solid var(--line);
  border-radius:14px;
  color:var(--text);
  background:rgba(255,255,255,.018);
  font:inherit;
  text-align:left;
  cursor:pointer;
  transition:transform .16s ease,border-color .16s ease,background .16s ease;
}

.feature-game-option:hover{
  transform:translateY(-2px);
  border-color:rgba(104,208,223,.3);
}

.feature-game-option.is-selected{
  border-color:rgba(104,208,223,.45);
  background:rgba(104,208,223,.075);
  box-shadow:inset 0 1px rgba(255,255,255,.04),0 10px 25px rgba(0,0,0,.12);
}

.feature-game-option[aria-disabled="true"]:not(.is-selected){opacity:.45}
.feature-game-option span:last-child{min-width:0}
.feature-game-option strong,
.feature-game-option small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.feature-game-option strong{font-size:.72rem}
.feature-game-option small{margin-top:3px;color:var(--muted);font-size:.59rem}

.feature-option-number{
  width:27px;
  height:27px;
  flex:0 0 auto;
  display:grid;
  place-items:center;
  border:1px solid var(--line);
  border-radius:9px;
  color:#81979f;
  background:#07151b;
  font-size:.68rem;
  font-weight:900;
}

.feature-game-option.is-selected .feature-option-number{
  border-color:rgba(104,208,223,.4);
  color:#06151b;
  background:var(--cyan);
}

.featured-order-heading{
  margin:22px 0 10px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
}
.featured-order-heading strong{font-size:.76rem}
.featured-order-heading small{color:var(--muted);font-size:.62rem}

.selected-feature-list{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:8px;
}

.feature-order-item{
  min-width:0;
  padding:9px 10px;
  display:flex;
  align-items:center;
  gap:10px;
  border:1px solid var(--line);
  border-radius:13px;
  background:rgba(255,255,255,.018);
}

.feature-order-rank{
  width:27px;
  height:27px;
  flex:0 0 auto;
  display:grid;
  place-items:center;
  border-radius:9px;
  color:#07151b;
  background:linear-gradient(135deg,#dffbff,#74d5e2);
  font-size:.67rem;
  font-weight:950;
}

.feature-order-name{min-width:0;flex:1}
.feature-order-name strong,
.feature-order-name small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.feature-order-name strong{font-size:.73rem}
.feature-order-name small{margin-top:3px;color:var(--muted);font-size:.58rem}

.feature-order-actions{display:flex;gap:4px}
.feature-order-actions button{
  width:29px;
  height:29px;
  display:grid;
  place-items:center;
  border:1px solid var(--line);
  border-radius:9px;
  color:var(--muted);
  background:#07151b;
  font:inherit;
  font-size:.76rem;
  cursor:pointer;
}
.feature-order-actions button:hover:not(:disabled){border-color:rgba(104,208,223,.34);color:var(--cyan)}
.feature-order-actions button[data-remove]:hover:not(:disabled){border-color:rgba(239,109,104,.36);color:#ffaaa6}
.feature-order-actions button:disabled{opacity:.28;cursor:not-allowed}

.featured-settings-actions{
  margin-top:16px;
  padding-top:15px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:18px;
  border-top:1px solid var(--line);
}
.featured-settings-actions p{margin:0;color:var(--muted);font-size:.65rem;line-height:1.45}

.site-settings-save{
  flex:0 0 auto;
  padding:10px 14px;
  border:1px solid rgba(104,208,223,.45);
  border-radius:12px;
  color:#06151b;
  background:linear-gradient(135deg,#dffbff,#74d5e2);
  box-shadow:0 10px 22px rgba(104,208,223,.13);
  font:inherit;
  font-size:.7rem;
  font-weight:900;
  cursor:pointer;
}
.site-settings-save:disabled{opacity:.38;cursor:not-allowed;box-shadow:none}
.site-intro-manager.is-saving .featured-settings-card{opacity:.72}
.site-intro-manager.has-unsaved-features .featured-settings-card{border-color:rgba(242,199,92,.24)}

@keyframes siteIntroAdminOrbit{to{transform:rotate(360deg)}}
@keyframes siteIntroAdminFloat{50%{transform:translateY(-5px) scale(1.02)}}

@media(max-width:850px){
  .site-intro-layout{grid-template-columns:1fr}
  .site-intro-preview-card{min-height:300px}
  .feature-game-options{grid-template-columns:repeat(3,minmax(0,1fr))}
}

@media(max-width:620px){
  .admin-section-tabs{grid-template-columns:1fr}
  .site-intro-manager-head{align-items:flex-start;flex-direction:column}
  .site-intro-toggle-row{align-items:flex-start}
  .site-intro-card{padding:16px}
  .featured-settings-card{padding:16px}
  .featured-settings-head{align-items:flex-start;flex-direction:column}
  .feature-game-options{grid-template-columns:repeat(2,minmax(0,1fr))}
  .selected-feature-list{grid-template-columns:1fr}
  .featured-settings-actions{align-items:stretch;flex-direction:column}
  .site-settings-save{width:100%}
}

@media(prefers-reduced-motion:reduce){
  .site-intro-switch span,
  .site-intro-switch span::after{transition:none}
  .site-intro-preview-earth::before,
  .site-intro-preview-earth::after,
  .site-intro-preview-earth img{animation:none}
  .feature-game-option{transition:none}
}
`;
