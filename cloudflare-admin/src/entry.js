import worker from './worker.js';
export { CommunityStore } from './community-store-runtime.js';

function allowAdminMediaPreview(response, request) {
  const url = new URL(request.url);
  const path = url.pathname.length > 1 && url.pathname.endsWith('/')
    ? url.pathname.slice(0, -1)
    : url.pathname;
  if (path !== '/' && path !== '/admin') return response;

  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  const csp = headers.get('Content-Security-Policy');
  if (csp) {
    headers.set(
      'Content-Security-Policy',
      csp
        .replace('img-src https://danny4686.com data: blob:', 'img-src https: data: blob:')
        .replace('media-src https://danny4686.com blob:', 'media-src https: blob:')
    );
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env, ctx) {
    return allowAdminMediaPreview(await worker.fetch(request, env, ctx), request);
  }
};
