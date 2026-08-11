import { ADMIN_CSS as BASE_ADMIN_CSS } from './admin-style.js';
import { ADMIN_JS as BASE_ADMIN_JS } from './admin-script.js';
import { PUBLISH_FEEDBACK_CSS } from './publish-feedback-style.js';
import { PUBLISH_FEEDBACK_JS } from './publish-feedback.js';
import { FRESH_ABYSS_ADMIN_CSS } from './fresh-abyss-admin-style.js';
import { ADMIN_TABS_CSS } from './admin-tabs-style.js';
import { FRESH_ABYSS_ADMIN_V2_JS } from './fresh-abyss-admin-v2.js';
import { SITE_INTRO_ADMIN_CSS } from './site-intro-admin-style.js';
import { SITE_INTRO_ADMIN_JS } from './site-intro-admin-ui.js';
import { PROFILE_ART_ADMIN_CSS } from './profile-art-admin-style.js';
import { PROFILE_ART_ADMIN_JS } from './profile-art-admin-ui.js';
import { PROJECTS_ADMIN_CSS } from './projects-admin-style.js';
import { PROJECTS_ADMIN_JS } from './projects-admin-ui.js';
import { ADMIN_RESPONSIVE_FIXES_CSS } from './admin-responsive-fixes.js';

export const ADMIN_CSS = `${BASE_ADMIN_CSS}\n${PUBLISH_FEEDBACK_CSS}\n${FRESH_ABYSS_ADMIN_CSS}\n${ADMIN_TABS_CSS}\n${SITE_INTRO_ADMIN_CSS}\n${PROFILE_ART_ADMIN_CSS}\n${PROJECTS_ADMIN_CSS}\n${ADMIN_RESPONSIVE_FIXES_CSS}`;
export const ADMIN_JS = `${BASE_ADMIN_JS}\n${PUBLISH_FEEDBACK_JS}\n${FRESH_ABYSS_ADMIN_V2_JS}\n${SITE_INTRO_ADMIN_JS}\n${PROFILE_ART_ADMIN_JS}\n${PROJECTS_ADMIN_JS}`;
