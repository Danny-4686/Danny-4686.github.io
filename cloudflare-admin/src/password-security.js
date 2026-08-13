const encoder = new TextEncoder();

// OWASP's current PBKDF2-HMAC-SHA256 guidance is 600,000+ iterations.
// Existing hashes remain readable because the stored hash carries its own work factor.
export const PASSWORD_HASH_ITERATIONS = 600000;

function toBase64(bytes) {
  let binary = '';
  const value = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let index = 0; index < value.length; index += 1) binary += String.fromCharCode(value[index]);
  return btoa(binary);
}

export function passwordHashIterations(value) {
  const match = String(value || '').match(/^pbkdf2-sha256\$(\d+)\$/);
  if (!match) return 100000;
  const iterations = Number(match[1]);
  return Number.isSafeInteger(iterations) && iterations > 0 ? iterations : 0;
}

export function passwordHashNeedsUpgrade(value) {
  return passwordHashIterations(value) < PASSWORD_HASH_ITERATIONS;
}

export async function hashStrongPassword(password, saltBytes = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(String(password || '')), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: PASSWORD_HASH_ITERATIONS },
    key,
    256
  );
  return {
    salt: toBase64(saltBytes),
    hash: `pbkdf2-sha256$${PASSWORD_HASH_ITERATIONS}$${toBase64(new Uint8Array(bits))}`
  };
}
