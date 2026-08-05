export const PUBLISH_FEEDBACK_CSS = String.raw`
.publish-progress[hidden] { display: none !important; }
.publish-progress {
  position: relative;
  z-index: 24;
  display: grid;
  grid-template-columns: auto minmax(0,1fr) auto;
  align-items: center;
  gap: 16px;
  margin: 0 0 16px;
  padding: 17px 18px;
  overflow: hidden;
  border: 1px solid rgba(104,208,223,.32);
  border-radius: 20px;
  background:
    radial-gradient(circle at 8% 40%, rgba(104,208,223,.13), transparent 34%),
    linear-gradient(135deg, rgba(255,255,255,.04), transparent 44%),
    rgba(7,22,29,.97);
  box-shadow: 0 20px 52px rgba(0,0,0,.3), inset 0 1px rgba(255,255,255,.04);
  opacity: 0;
  transform: translateY(-9px) scale(.99);
  transition: opacity .24s ease, transform .24s ease, border-color .24s ease;
}
.publish-progress::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(112deg, transparent 24%, rgba(255,255,255,.055) 48%, transparent 72%);
  transform: translateX(-85%);
}
.publish-progress.is-visible { opacity: 1; transform: translateY(0) scale(1); }
.publish-progress.is-loading::after { animation: publishFeedbackSweep 1.9s ease-in-out infinite; }
.publish-progress.is-success { border-color: rgba(139,207,155,.47); background: radial-gradient(circle at 8% 40%, rgba(139,207,155,.14), transparent 34%), linear-gradient(135deg, rgba(255,255,255,.04), transparent 44%), rgba(7,22,25,.98); }
.publish-progress.is-error { border-color: rgba(239,109,104,.5); background: radial-gradient(circle at 8% 40%, rgba(239,109,104,.14), transparent 34%), linear-gradient(135deg, rgba(255,255,255,.04), transparent 44%), rgba(25,14,17,.98); }

.publish-progress-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 1px solid rgba(104,208,223,.28);
  border-radius: 15px;
  color: var(--cyan);
  background: rgba(104,208,223,.07);
  box-shadow: inset 0 1px rgba(255,255,255,.07), 0 10px 24px rgba(0,0,0,.2);
}
.publish-spinner {
  width: 22px;
  height: 22px;
  border: 3px solid rgba(104,208,223,.2);
  border-top-color: var(--cyan-strong);
  border-radius: 50%;
  animation: publishFeedbackSpin .75s linear infinite;
}
.publish-check, .publish-error-mark { display: none; font-size: 1.35rem; font-weight: 900; }
.publish-progress.is-success .publish-progress-icon { color: #9ce1aa; border-color: rgba(139,207,155,.35); background: rgba(139,207,155,.08); }
.publish-progress.is-success .publish-spinner { display: none; }
.publish-progress.is-success .publish-check { display: block; }
.publish-progress.is-error .publish-progress-icon { color: #ffaaa6; border-color: rgba(239,109,104,.38); background: rgba(239,109,104,.08); }
.publish-progress.is-error .publish-spinner { display: none; }
.publish-progress.is-error .publish-error-mark { display: block; }

.publish-progress-copy { min-width: 0; }
.publish-progress-kicker { margin: 0 0 4px; color: var(--cyan); font-size: .63rem; font-weight: 880; letter-spacing: .14em; }
.publish-progress.is-success .publish-progress-kicker { color: #9ce1aa; }
.publish-progress.is-error .publish-progress-kicker { color: #ffaaa6; }
.publish-progress-copy h2 { margin: 0 0 5px; font-size: clamp(1.05rem,2vw,1.3rem); letter-spacing: -.025em; }
.publish-progress-copy > p:not(.publish-progress-kicker) { margin: 0; color: var(--muted); font-size: .84rem; line-height: 1.5; }
.publish-progress-track { height: 4px; margin-top: 11px; overflow: hidden; border-radius: 999px; background: rgba(255,255,255,.055); }
.publish-progress-track span { display: block; width: 42%; height: 100%; border-radius: inherit; background: linear-gradient(90deg, transparent, var(--cyan), transparent); transform: translateX(-120%); animation: publishFeedbackBar 1.25s ease-in-out infinite; }
.publish-progress.is-success .publish-progress-track span { width: 100%; transform: none; animation: none; background: linear-gradient(90deg, #76c88a, #a7e7b3); }
.publish-progress.is-error .publish-progress-track span { width: 100%; transform: none; animation: none; background: linear-gradient(90deg, #cf5855, #ef8a85); }
.publish-progress-close { min-height: 38px; padding: 8px 12px; border: 1px solid rgba(239,109,104,.35); border-radius: 11px; color: #ffd0ce; background: rgba(239,109,104,.08); cursor: pointer; font-weight: 800; }

#postForm[aria-busy="true"] { opacity: .78; filter: saturate(.88); transition: opacity .2s ease, filter .2s ease; }
#postForm[aria-busy="true"] .editor-card,
#postForm[aria-busy="true"] .live-preview-card,
#postForm[aria-busy="true"] .mode-help { pointer-events: none; }

@keyframes publishFeedbackSpin { to { transform: rotate(360deg); } }
@keyframes publishFeedbackBar {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(340%); }
}
@keyframes publishFeedbackSweep {
  0%, 20% { transform: translateX(-85%); }
  75%, 100% { transform: translateX(85%); }
}

@media (max-width: 700px) {
  .publish-progress { grid-template-columns: auto minmax(0,1fr); gap: 12px; padding: 15px; border-radius: 17px; }
  .publish-progress-icon { width: 43px; height: 43px; border-radius: 13px; }
  .publish-progress-close { grid-column: 1 / -1; width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .publish-progress,
  .publish-spinner,
  .publish-progress-track span,
  .publish-progress::after { transition: none; animation: none !important; }
  .publish-progress.is-visible { opacity: 1; transform: none; }
  .publish-progress.is-loading .publish-progress-track span { width: 66%; transform: none; background: var(--cyan); }
}
`;
