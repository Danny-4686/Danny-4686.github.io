import worker from './worker.js';
import { protectManagedUploadRequest } from './managed-upload-security.js';
import { protectAdminRequest } from './request-security.js';
import { addTransportSecurity, redirectToHttps } from './transport-security.js';
export { CommunityStore } from './community-store-runtime.js';

export default {
  async fetch(request, env, ctx) {
    const redirect = redirectToHttps(request);
    if (redirect) return addTransportSecurity(redirect);

    const protection = await protectAdminRequest(request);
    if (protection.response) return addTransportSecurity(protection.response);
    let securedRequest = protection.request || request;

    const managedProtection = await protectManagedUploadRequest(securedRequest);
    if (managedProtection.response) return addTransportSecurity(managedProtection.response);
    securedRequest = managedProtection.request || securedRequest;

    const response = await worker.fetch(securedRequest, env, ctx);
    return addTransportSecurity(response);
  }
};
