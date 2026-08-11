export const PROFILE_ART_ADMIN_CSS = String.raw`
.profile-art-card{
  min-width:0;
  max-width:100%;
  margin-top:16px;
  padding:22px;
  border:1px solid var(--line);
  border-radius:20px;
  background:
    radial-gradient(circle at 88% 0,rgba(242,199,92,.065),transparent 32%),
    rgba(7,21,28,.82);
  box-shadow:0 18px 42px rgba(0,0,0,.2);
  overflow-wrap:anywhere;
}
.profile-art-head{display:flex;align-items:flex-start;justify-content:space-between;gap:22px;margin-bottom:18px}
.profile-art-head>div{min-width:0}
.profile-art-head h2{margin:0;font-size:1.45rem;letter-spacing:-.04em;overflow-wrap:anywhere}
.profile-art-head p:not(.eyebrow){max-width:620px;margin:6px 0 0;color:var(--muted);font-size:.78rem;line-height:1.55;overflow-wrap:anywhere}
.profile-art-layout{min-width:0;display:grid;grid-template-columns:minmax(250px,.72fr) minmax(0,1.28fr);gap:16px;align-items:stretch}
.profile-art-preview{
  position:relative;
  min-width:0;
  min-height:360px;
  overflow:hidden;
  display:grid;
  place-items:center;
  border:1px solid var(--line);
  border-radius:18px;
  background:
    radial-gradient(circle at 50% 42%,rgba(104,208,223,.11),transparent 42%),
    #07151b;
}
.profile-art-preview::before,.profile-art-preview::after{content:"";position:absolute;border:1px solid rgba(104,208,223,.11);border-radius:50%;pointer-events:none}
.profile-art-preview::before{width:240px;height:240px}.profile-art-preview::after{width:310px;height:310px}
.profile-art-preview img{position:relative;z-index:2;display:block;width:min(82%,310px);max-width:100%;max-height:330px;object-fit:contain;filter:drop-shadow(0 20px 24px rgba(0,0,0,.32))}
.profile-art-preview .profile-art-empty{position:relative;z-index:2;color:var(--muted);font-size:.74rem;text-align:center}
.profile-art-controls{min-width:0;padding:18px;border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,.016)}
.profile-art-current{margin-bottom:16px;padding:12px 13px;border:1px solid rgba(104,208,223,.16);border-radius:13px;background:rgba(104,208,223,.035)}
.profile-art-current strong,.profile-art-current small{display:block}.profile-art-current strong{font-size:.76rem}.profile-art-current small{margin-top:4px;color:var(--muted);font-size:.65rem;line-height:1.45;overflow-wrap:anywhere}
.profile-art-drop{
  min-height:142px;
  padding:18px;
  display:grid;
  place-items:center;
  border:1px dashed rgba(104,208,223,.3);
  border-radius:15px;
  color:var(--muted);
  background:rgba(104,208,223,.025);
  text-align:center;
  cursor:pointer;
  transition:border-color .18s ease,background .18s ease,transform .18s ease;
}
.profile-art-drop>span{display:block;max-width:100%;margin:0;color:inherit;font-size:inherit;font-weight:inherit;line-height:inherit}
.profile-art-drop:hover,.profile-art-drop.is-dragging{border-color:rgba(104,208,223,.58);background:rgba(104,208,223,.06);transform:translateY(-1px)}
.profile-art-drop strong{display:block;color:var(--text);font-size:.82rem}.profile-art-drop small{display:block;margin-top:5px;color:var(--muted);font-size:.66rem;font-weight:500;line-height:1.45;overflow-wrap:anywhere}
.profile-art-actions{margin-top:14px;display:flex;flex-wrap:wrap;gap:9px}
.profile-art-actions button{min-height:40px;max-width:100%;padding:9px 12px;border:1px solid var(--line);border-radius:11px;color:var(--text);background:#07151b;font:inherit;font-size:.7rem;font-weight:900;cursor:pointer;white-space:normal}
.profile-art-actions button.primary{border-color:rgba(104,208,223,.42);color:#06151b;background:linear-gradient(135deg,#dffbff,#74d5e2)}
.profile-art-actions button:hover:not(:disabled){transform:translateY(-1px);border-color:rgba(104,208,223,.4)}
.profile-art-actions button:disabled{opacity:.4;cursor:not-allowed;transform:none}
.profile-art-note{margin:13px 0 0;color:var(--muted);font-size:.65rem;line-height:1.5;overflow-wrap:anywhere}
.profile-art-card.is-saving{opacity:.72;pointer-events:none}
@media(max-width:780px){.profile-art-layout{grid-template-columns:minmax(0,1fr)}.profile-art-preview{min-height:320px}}
@media(max-width:620px){.profile-art-card{padding:16px}.profile-art-head{flex-direction:column}.profile-art-preview{min-height:280px}.profile-art-actions{flex-direction:column}.profile-art-actions button{width:100%}}
@media(max-width:420px){.profile-art-controls{padding:14px}.profile-art-preview{min-height:250px}.profile-art-preview::after{width:270px;height:270px}}
@media(prefers-reduced-motion:reduce){.profile-art-drop,.profile-art-actions button{transition:none}}
`;
