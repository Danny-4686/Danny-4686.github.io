const FALLBACK_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

export function redirectToHttps(request) {
  const url = new URL(request.url);
  if (url.protocol === 'https:') return null;
  url.protocol = 'https:';
  return new Response(null, {
    status: 308,
    headers: {
      Location: url.toString(),
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export function addTransportSecurity(response) {
  const headers = new Headers(response.headers);
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  if (!headers.has('Referrer-Policy')) headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (!headers.has('Permissions-Policy')) {
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  }
  // JSON, avatars and other non-page responses never need to run anything if opened directly.
  // Pages set their own policy (see html() in utils.js), which is preserved here.
  if (!headers.has('Content-Security-Policy')) headers.set('Content-Security-Policy', FALLBACK_CSP);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
