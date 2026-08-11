export const ADMIN_TABS_CSS = String.raw`
.admin-section-tabs {
  width: min(1540px, calc(100% - 28px));
  max-width: 100%;
  margin: 14px auto 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 10px;
  padding: 7px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: rgba(4, 13, 18, .88);
  box-shadow: 0 14px 36px rgba(0, 0, 0, .22);
  backdrop-filter: blur(16px);
}

.admin-section-tab {
  min-width: 0;
  max-width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 11px;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 14px;
  color: var(--muted);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: transform .18s ease, color .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease;
}

.admin-section-tab > span:nth-child(2) {
  min-width: 0;
  max-width: 100%;
}

.admin-section-tab:hover {
  color: var(--text);
  border-color: rgba(104, 208, 223, .22);
  background: rgba(255, 255, 255, .025);
}

.admin-section-tab.active {
  color: var(--text);
  border-color: var(--line-strong);
  background: radial-gradient(circle at 8% 50%, rgba(104, 208, 223, .11), transparent 35%), rgba(104, 208, 223, .065);
  box-shadow: inset 0 0 0 1px rgba(104, 208, 223, .06), 0 10px 26px rgba(0, 0, 0, .17);
}

.admin-section-tab-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--line);
  border-radius: 11px;
  color: var(--cyan);
  background: rgba(104, 208, 223, .055);
  font-size: .78rem;
}

.admin-section-tab strong,
.admin-section-tab small {
  display: block;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.admin-section-tab strong {
  color: inherit;
  font-size: .91rem;
  line-height: 1.25;
}

.admin-section-tab small {
  margin-top: 3px;
  color: var(--muted);
  font-size: .7rem;
  line-height: 1.35;
  white-space: normal;
}

.admin-section-tab-state {
  flex: 0 0 auto;
  padding: 4px 8px;
  border: 1px solid rgba(139, 207, 155, .28);
  border-radius: 999px;
  color: #9ce1aa;
  background: rgba(139, 207, 155, .055);
  font-size: .58rem;
  font-weight: 900;
  letter-spacing: .07em;
  white-space: nowrap;
}

.admin-section-tab-state.is-off,
.admin-section-tab.is-off .admin-section-tab-state {
  border-color: rgba(239, 109, 104, .3);
  color: #ffaaa6;
  background: rgba(239, 109, 104, .055);
}

.dashboard.is-abyss-view {
  grid-template-columns: minmax(0, 1fr);
}

.dashboard.is-abyss-view .workspace,
.workspace,
.projects-manager,
.site-intro-manager,
#freshAbyssManager {
  min-width: 0;
  max-width: 100%;
}

.dashboard > .sidebar[hidden],
.workspace-head[hidden],
#postForm[hidden] {
  display: none !important;
}

.abyss-type-field {
  display: block;
  margin-top: 13px;
}

.abyss-type-field small {
  display: block;
  margin-top: 7px;
  color: var(--muted);
  font-size: .74rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.abyss-preview img,
.abyss-preview video {
  position: relative;
  z-index: 1;
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: 430px;
  object-fit: contain;
  border-radius: 14px;
  background: #000;
  box-shadow: 0 22px 54px rgba(0, 0, 0, .5);
}

.abyss-preview video {
  width: 100%;
  outline: none;
}

.abyss-preview.has-error img,
.abyss-preview.has-error video {
  opacity: .12;
}

.abyss-preview.has-error::before {
  content: "MEDIA COULD NOT LOAD";
}

@media (max-width: 1100px) {
  .admin-section-tabs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .admin-section-tabs {
    width: calc(100% - 14px);
    grid-template-columns: minmax(0, 1fr);
    margin-top: 9px;
    gap: 6px;
    padding: 5px;
    border-radius: 16px;
  }

  .admin-section-tab {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 8px;
    padding: 10px;
  }

  .admin-section-tab-state {
    grid-column: auto;
    justify-self: end;
    margin-left: 0;
  }

  .admin-section-tab-icon {
    width: 34px;
    height: 34px;
  }
}

@media (max-width: 400px) {
  .admin-section-tab {
    padding: 9px;
  }

  .admin-section-tab strong {
    font-size: .84rem;
  }

  .admin-section-tab small {
    font-size: .65rem;
  }

  .admin-section-tab-state {
    padding-inline: 6px;
    font-size: .54rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-section-tab {
    transition: none;
  }
}
`;
