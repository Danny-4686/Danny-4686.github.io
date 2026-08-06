import { ADMIN_CSS as BASE_ADMIN_CSS } from './admin-style.js';
import { ADMIN_JS as BASE_ADMIN_JS } from './admin-script.js';
import { PUBLISH_FEEDBACK_CSS } from './publish-feedback-style.js';
import { PUBLISH_FEEDBACK_JS } from './publish-feedback.js';
import { FRESH_ABYSS_ADMIN_CSS } from './fresh-abyss-admin-style.js';
import { FRESH_ABYSS_ADMIN_JS } from './fresh-abyss-admin.js';

export const ADMIN_CSS = `${BASE_ADMIN_CSS}\n${PUBLISH_FEEDBACK_CSS}\n${FRESH_ABYSS_ADMIN_CSS}`;
export const ADMIN_JS = `${BASE_ADMIN_JS}\n${PUBLISH_FEEDBACK_JS}\n${FRESH_ABYSS_ADMIN_JS}`;
