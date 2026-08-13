import { canonicalizeDeclaredMediaType, sniffMediaBytes } from './media-security.js';

const ADMIN_SESSION_COOKIE = 'cloudlab_admin_session';
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_FILE_BYTES = 30 * 1024 * 1024;
const MAX_REQUEST_BYTES = 32 * 1024 * 1024;
const MAX_UPLOAD_FILES = 48;
const MAX_METADATA_CHARS = 600000;
const POST_MODES = new Set(['article', 'card', 'coming-soon']);

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

function normalizedPath(url) {
  return url.pathname.length > 1 && url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
}

function normalizeMode(value) {
  if (POST_MODES.has(value?.mode)) return value.mode;
  if (value?.comingSoon) return 'coming-soon';
  if (value?.cardOnly) return 'card';
  return 'article';
}

function sectionUploadFields(input, mode) {
  if (mode !== 'article') return new Set();
  const fields = new Set();
  const sections = Array.isArray(input?.sections) ? input.sections.slice(0, 30) : [];
  for (const section of sections) {
    const uploads = Array.isArray(section?.uploads) ? section.uploads.slice(0, 12) : [];
    for (const upload of uploads) {
      const field = String(upload?.field || '').trim();
      if (!/^section-\d+-\d+$/.test(field) || fields.has(field)) return null;
      fields.add(field);
    }
  }
  return fields;
}

function hasAdminSessionCookie(request) {
  return String(request.headers.get('Cookie') || '').split(';').some((part) => part.trim().startsWith(`${ADMIN_SESSION_COOKIE}=`));
}

function safeUploadName(field, extension) {
  const stem = String(field || 'media').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'media';
  return `${stem}.${extension}`;
}

async function sanitizeJournalPublishRequest(request) {
  const contentType = String(request.headers.get('Content-Type') || '').toLowerCase();
  if (!contentType.startsWith('multipart/form-data')) {
    return { response: jsonError('Journal publishing requires multipart form data.', 415) };
  }

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return { response: jsonError('The Journal upload is too large.', 413) };
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return { response: jsonError('The Journal upload could not be read.', 400) };
  }

  const metadataValues = form.getAll('metadata');
  if (metadataValues.length !== 1 || typeof metadataValues[0] !== 'string') {
    return { response: jsonError('Post information is missing or duplicated.', 400) };
  }
  if (metadataValues[0].length > MAX_METADATA_CHARS) {
    return { response: jsonError('Post information is too large.', 413) };
  }

  let input;
  try {
    input = JSON.parse(metadataValues[0]);
  } catch {
    return { response: jsonError('Post information is invalid.', 400) };
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { response: jsonError('Post information is invalid.', 400) };
  }

  const mode = normalizeMode(input);
  const sectionFields = sectionUploadFields(input, mode);
  if (!sectionFields) return { response: jsonError('Post upload fields are invalid or duplicated.', 400) };

  const allowedFileFields = new Set(['thumbnail']);
  if (mode === 'article') allowedFileFields.add('hero');
  sectionFields.forEach((field) => allowedFileFields.add(field));

  const sanitized = new FormData();
  const seenFiles = new Set();
  let fileCount = 0;
  let totalBytes = 0;

  for (const [field, value] of form.entries()) {
    if (!(value instanceof File)) {
      sanitized.append(field, value);
      continue;
    }
    if (!value.size) continue;

    fileCount += 1;
    totalBytes += value.size;
    if (fileCount > MAX_UPLOAD_FILES) return { response: jsonError(`A Journal post can contain at most ${MAX_UPLOAD_FILES} new files.`, 413) };
    if (value.size > MAX_FILE_BYTES) return { response: jsonError('Each Journal file must be 10 MB or smaller.', 413) };
    if (totalBytes > MAX_TOTAL_FILE_BYTES) return { response: jsonError('The total Journal upload must be 30 MB or smaller.', 413) };
    if (!allowedFileFields.has(field)) return { response: jsonError('The upload contains an unexpected file field.', 400) };
    if (seenFiles.has(field)) return { response: jsonError('The upload contains a duplicated file field.', 400) };
    seenFiles.add(field);

    let prefix;
    try {
      prefix = new Uint8Array(await value.slice(0, 32).arrayBuffer());
    } catch {
      return { response: jsonError('One of the uploaded files could not be read.', 400) };
    }

    const detected = sniffMediaBytes(prefix);
    const canonical = canonicalizeDeclaredMediaType(value.type, detected);
    if (!canonical) {
      return { response: jsonError('Journal media must be a real PNG, JPG, WebP, GIF, MP4, WebM, MOV, or M4V file.', 415) };
    }

    sanitized.append(
      field,
      new File([value], safeUploadName(field, canonical.extension), {
        type: canonical.mime,
        lastModified: Number(value.lastModified || Date.now())
      })
    );
  }

  const headers = new Headers(request.headers);
  headers.delete('Content-Type');
  headers.delete('Content-Length');

  return {
    request: new Request(request.url, {
      method: request.method,
      headers,
      body: sanitized,
      redirect: request.redirect,
      signal: request.signal
    })
  };
}

export async function protectAdminRequest(request) {
  const url = new URL(request.url);
  const path = normalizedPath(url);
  const method = request.method.toUpperCase();
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  if (path.startsWith('/api/') && unsafe) {
    const origin = request.headers.get('Origin');
    if (origin) {
      let originUrl;
      try { originUrl = new URL(origin); } catch { return { response: jsonError('Origin not allowed.', 403) }; }
      if (originUrl.origin !== url.origin) return { response: jsonError('Origin not allowed.', 403) };
    }
    if (String(request.headers.get('Sec-Fetch-Site') || '').toLowerCase() === 'cross-site') {
      return { response: jsonError('Cross-site admin requests are not allowed.', 403) };
    }
  }

  if (path !== '/api/publish' || method !== 'POST' || !hasAdminSessionCookie(request)) {
    return { request };
  }

  return sanitizeJournalPublishRequest(request);
}
