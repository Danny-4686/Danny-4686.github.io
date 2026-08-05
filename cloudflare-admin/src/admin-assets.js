import { ADMIN_CSS as BASE_ADMIN_CSS } from './admin-style.js';
import { ADMIN_JS as BASE_ADMIN_JS } from './admin-script.js';
import { PUBLISH_FEEDBACK_CSS } from './publish-feedback-style.js';
import { PUBLISH_FEEDBACK_JS } from './publish-feedback.js';

export const ADMIN_CSS = `${BASE_ADMIN_CSS}\n${PUBLISH_FEEDBACK_CSS}`;
export const ADMIN_JS = `${BASE_ADMIN_JS}\n${PUBLISH_FEEDBACK_JS}`;
