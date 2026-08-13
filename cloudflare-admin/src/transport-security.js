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
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  if (!headers.has('Referrer-Policy')) headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (!headers.has('Permissions-Policy')) {
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
