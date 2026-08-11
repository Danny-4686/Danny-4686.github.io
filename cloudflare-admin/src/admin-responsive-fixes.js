export const ADMIN_RESPONSIVE_FIXES_CSS = String.raw`
/* Final corrective layer. Keep this last in ADMIN_CSS so section-specific styles cannot reintroduce layout/text bugs. */
.admin-section-tabs{
  grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
}

.site-intro-manager,
.projects-manager,
.profile-art-card,
.featured-settings-card,
.site-intro-card,
.site-intro-preview-card{
  min-width:0;
  max-width:100%;
}

.site-intro-manager,
.featured-settings-card,
.profile-art-card{
  overflow-wrap:anywhere;
}

.settings-section-label>div,
.site-intro-manager-head>div,
.site-intro-card-heading>div,
.featured-settings-head>div,
.project-editor-heading>div,
.projects-manager-head>div{
  min-width:0;
}

.settings-section-label strong,
.settings-section-label small,
.site-intro-manager-head p,
.site-intro-card-heading p,
.featured-settings-head p,
.featured-settings-actions p,
.site-intro-feedback small,
.site-intro-note{
  overflow-wrap:anywhere;
}

/* Base admin.css has a generic label > span rule. Neutralize it for custom compound controls. */
.site-intro-toggle-row>span:first-child,
.site-intro-toggle-row>.site-intro-switch,
.profile-art-drop>span,
.project-live-switch>span,
.project-option>span,
.project-field>span{
  margin-bottom:0;
}

.site-intro-toggle-row>span:first-child,
.site-intro-toggle-row>.site-intro-switch{
  color:inherit;
  font-size:inherit;
  font-weight:inherit;
}

.site-intro-toggle-row>span:first-child{
  min-width:0;
}

.site-intro-switch{
  display:block;
}

.feature-game-option strong,
.feature-game-option small,
.feature-order-name strong,
.feature-order-name small{
  max-width:100%;
}

@media(max-width:1100px){
  .admin-section-tabs{
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
}

@media(max-width:850px){
  .site-intro-layout,
  .profile-art-layout,
  .projects-layout{
    grid-template-columns:minmax(0,1fr);
  }
}

@media(max-width:620px){
  .admin-section-tabs{
    grid-template-columns:minmax(0,1fr);
  }

  .site-intro-manager-head,
  .featured-settings-head,
  .profile-art-head,
  .projects-manager-head,
  .project-editor-heading{
    align-items:flex-start;
    flex-direction:column;
  }

  .site-intro-toggle-row{
    align-items:flex-start;
  }

  .site-intro-toggle-row>span:first-child{
    flex:1 1 auto;
  }

  .site-intro-switch{
    flex:0 0 54px;
  }
}

@media(max-width:420px){
  .admin-section-tabs,
  .dashboard{
    max-width:calc(100vw - 14px);
  }

  .site-intro-card,
  .featured-settings-card,
  .profile-art-card,
  .project-editor-card,
  .projects-sidebar-card{
    max-width:100%;
  }
}
`;
