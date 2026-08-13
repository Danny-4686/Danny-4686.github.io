import { canonicalizeDeclaredMediaType, sniffMediaBytes } from './media-security.js';

const ADMIN_SESSION_COOKIE = 'cloudlab_admin_session';

function jsonError(error, status) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function hasAdminSessionCookie(request) {
  return String(request.headers.get('Cookie') || '').split(';').some((part) => part.trim().startsWith(`${ADMIN_SESSION_COOKIE}=`));
}

function rebuildRequest(request, form) {
  const headers = new Headers(request.headers);
  headers.delete('Content-Type');
  headers.delete('Content-Length');
  return new Request(request.url, {
    method: request.method,
    headers,
    body: form,
    redirect: request.redirect,
    signal: request.signal
  });
}

async function sanitizeUpload(request, { fields, maxBytes, imageOnly, label }) {
  const contentType = String(request.headers.get('Content-Type') || '').toLowerCase();
  if (!contentType.startsWith('multipart/form-data')) return { request };

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes + 1024 * 1024) {
    return { response: jsonError(`${label} upload is too large.`, 413) };
  }

  let form;
  try { form = await request.formData(); }
  catch { return { response: jsonError(`${label} upload could not be read.`, 400) }; }

  const output = new FormData();
  let fileCount = 0;
  for (const [field, value] of form.entries()) {
    if (!(value instanceof File)) {
      output.append(field, value);
      continue;
    }
    if (!value.size) continue;
    if (!fields.has(field)) return { response: jsonError(`${label} contains an unexpected file field.`, 400) };
    fileCount += 1;
    if (fileCount > 1) return { response: jsonError(`${label} accepts one new media file at a time.`, 400) };
    if (value.size > maxBytes) return { response: jsonError(`${label} upload is too large.`, 413) };

    let prefix;
    try { prefix = new Uint8Array(await value.slice(0, 32).arrayBuffer()); }
    catch { return { response: jsonError(`${label} media could not be read.`, 400) }; }

    const canonical = canonicalizeDeclaredMediaType(value.type, sniffMediaBytes(prefix));
    if (!canonical || (imageOnly && (canonical.kind !== 'image' || canonical.format === 'gif'))) {
      return {
        response: jsonError(
          imageOnly
            ? `${label} must be a real PNG, JPG, or WebP image.`
            : `${label} must be a real PNG, JPG, WebP, GIF, MP4, WebM, MOV, or M4V file.`,
          415
        )
      };
    }

    output.append(
      field,
      new File([value], `${field}.${canonical.extension}`, {
        type: canonical.mime,
        lastModified: Number(value.lastModified || Date.now())
      })
    );
  }

  return { request: rebuildRequest(request, output) };
}

export async function protectManagedUploadRequest(request) {
  if (request.method.toUpperCase() !== 'POST' || !hasAdminSessionCookie(request)) return { request };
  const path = new URL(request.url).pathname.replace(/\/$/, '') || '/';

  if (path === '/api/profile-art') {
    return sanitizeUpload(request, {
      fields: new Set(['image']),
      maxBytes: 8 * 1024 * 1024,
      imageOnly: true,
      label: 'Profile artwork'
    });
  }

  if (path === '/api/projects') {
    return sanitizeUpload(request, {
      fields: new Set(['image']),
      maxBytes: 8 * 1024 * 1024,
      imageOnly: true,
      label: 'Project artwork'
    });
  }

  if (path === '/api/fresh-abyss') {
    return sanitizeUpload(request, {
      fields: new Set(['media', 'image']),
      maxBytes: 30 * 1024 * 1024,
      imageOnly: false,
      label: 'Fresh Abyss media'
    });
  }

  return { request };
}
