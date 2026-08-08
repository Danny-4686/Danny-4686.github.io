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
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
