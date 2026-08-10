(function attachCloudLabClickRateLimiter(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CloudLabClickRateLimiter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  function createRollingLimiter(options = {}) {
    const limit = Math.max(1, Math.floor(Number(options.limit) || 10));
    const windowMs = Math.max(1, Number(options.windowMs) || 1000);
    const acceptedAt = [];

    function attempt(timestamp) {
      const now = Number(timestamp);
      if (!Number.isFinite(now)) {
        return { allowed: false, remaining: 0, retryAfterMs: windowMs };
      }

      while (acceptedAt.length && now - acceptedAt[0] >= windowMs) acceptedAt.shift();
      if (acceptedAt.length >= limit) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: Math.max(0, windowMs - (now - acceptedAt[0]))
        };
      }

      acceptedAt.push(now);
      return { allowed: true, remaining: limit - acceptedAt.length, retryAfterMs: 0 };
    }

    function reset() {
      acceptedAt.length = 0;
    }

    return Object.freeze({ attempt, reset });
  }

  return Object.freeze({ createRollingLimiter });
});
