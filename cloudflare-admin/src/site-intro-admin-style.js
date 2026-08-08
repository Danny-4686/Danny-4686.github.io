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

@keyframes siteIntroAdminOrbit{to{transform:rotate(360deg)}}
@keyframes siteIntroAdminFloat{50%{transform:translateY(-5px) scale(1.02)}}

@media(max-width:850px){
  .site-intro-layout{grid-template-columns:1fr}
  .site-intro-preview-card{min-height:300px}
}

@media(max-width:620px){
  .admin-section-tabs{grid-template-columns:1fr}
  .site-intro-manager-head{align-items:flex-start;flex-direction:column}
  .site-intro-toggle-row{align-items:flex-start}
  .site-intro-card{padding:16px}
}

@media(prefers-reduced-motion:reduce){
  .site-intro-switch span,
  .site-intro-switch span::after{transition:none}
  .site-intro-preview-earth::before,
  .site-intro-preview-earth::after,
  .site-intro-preview-earth img{animation:none}
}
`;
