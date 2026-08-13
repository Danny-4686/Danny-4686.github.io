const IMAGE_MIME_BY_KIND = Object.freeze({
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif'
});

const IMAGE_EXTENSION_BY_KIND = Object.freeze({
  png: 'png',
  jpeg: 'jpg',
  webp: 'webp',
  gif: 'gif'
});

const ALLOWED_DECLARED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v'
]);

function bytes(value) {
  return value instanceof Uint8Array ? value : new Uint8Array(value || 0);
}

function startsWith(input, signature) {
  if (input.length < signature.length) return false;
  for (let index = 0; index < signature.length; index += 1) {
    if (input[index] !== signature[index]) return false;
  }
  return true;
}

function ascii(input, start, length) {
  if (input.length < start + length) return '';
  let output = '';
  for (let index = start; index < start + length; index += 1) output += String.fromCharCode(input[index]);
  return output;
}

export function sniffMediaBytes(value) {
  const input = bytes(value);

  if (startsWith(input, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { kind: 'image', format: 'png', mime: 'image/png', extension: 'png' };
  }
  if (startsWith(input, [0xff, 0xd8, 0xff])) {
    return { kind: 'image', format: 'jpeg', mime: 'image/jpeg', extension: 'jpg' };
  }
  if (ascii(input, 0, 4) === 'RIFF' && ascii(input, 8, 4) === 'WEBP') {
    return { kind: 'image', format: 'webp', mime: 'image/webp', extension: 'webp' };
  }
  if (ascii(input, 0, 6) === 'GIF87a' || ascii(input, 0, 6) === 'GIF89a') {
    return { kind: 'image', format: 'gif', mime: 'image/gif', extension: 'gif' };
  }
  if (startsWith(input, [0x1a, 0x45, 0xdf, 0xa3])) {
    return { kind: 'video', format: 'webm', mime: 'video/webm', extension: 'webm' };
  }
  if (ascii(input, 4, 4) === 'ftyp') {
    const brand = ascii(input, 8, 4);
    if (brand === 'qt  ') return { kind: 'video', format: 'quicktime', mime: 'video/quicktime', extension: 'mov' };
    if (/^M4V/i.test(brand)) return { kind: 'video', format: 'm4v', mime: 'video/x-m4v', extension: 'm4v' };
    return { kind: 'video', format: 'mp4', mime: 'video/mp4', extension: 'mp4' };
  }

  return null;
}

export function canonicalizeDeclaredMediaType(declaredType, detected) {
  const declared = String(declaredType || '').trim().toLowerCase();
  if (!detected || !ALLOWED_DECLARED_TYPES.has(declared)) return null;

  if (detected.kind === 'image') {
    const expected = IMAGE_MIME_BY_KIND[detected.format];
    if (declared !== expected) return null;
    return { ...detected, mime: expected, extension: IMAGE_EXTENSION_BY_KIND[detected.format] };
  }

  if (detected.format === 'webm') {
    return declared === 'video/webm' ? detected : null;
  }

  if (!['mp4', 'quicktime', 'm4v'].includes(detected.format)) return null;
  if (!['video/mp4', 'video/quicktime', 'video/x-m4v'].includes(declared)) return null;

  if (declared === 'video/quicktime') return { ...detected, mime: 'video/quicktime', extension: 'mov' };
  if (declared === 'video/x-m4v') return { ...detected, mime: 'video/x-m4v', extension: 'm4v' };
  return { ...detected, mime: 'video/mp4', extension: 'mp4' };
}

export function isAllowedImageBytes(declaredType, value) {
  const detected = sniffMediaBytes(value);
  const canonical = canonicalizeDeclaredMediaType(declaredType, detected);
  return Boolean(canonical && canonical.kind === 'image' && canonical.format !== 'gif');
}

export const JOURNAL_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/x-m4v';
