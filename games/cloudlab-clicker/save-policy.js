(function attachCloudLabClickerSavePolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CloudLabClickerSavePolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const LOCAL_SAVE_INTERVAL_MS = 15000;
  const CLOUD_SAVE_INTERVAL_MS = 60000;
  const CLOUD_SAVE_DEBOUNCE_MS = 2500;

  function createCloudSaveQueue(options = {}) {
    const now = typeof options.now === 'function' ? options.now : () => Date.now();
    const setTimer = typeof options.setTimer === 'function' ? options.setTimer : setTimeout;
    const clearTimer = typeof options.clearTimer === 'function' ? options.clearTimer : clearTimeout;
    const onFlush = typeof options.onFlush === 'function' ? options.onFlush : () => {};
    const minIntervalMs = Math.max(1000, Number(options.minIntervalMs) || CLOUD_SAVE_INTERVAL_MS);
    const debounceMs = Math.max(0, Number(options.debounceMs) || CLOUD_SAVE_DEBOUNCE_MS);
    let lastSavedAt = 0;
    let timer = 0;
    let dueAt = 0;
    let pending = { force: false, keepalive: false, notify: false };

    function takePending() {
      const next = pending;
      pending = { force: false, keepalive: false, notify: false };
      return next;
    }

    function flush() {
      if (timer) clearTimer(timer);
      timer = 0;
      dueAt = 0;
      onFlush(takePending());
    }

    function schedule(request = {}) {
      pending.force ||= request.force === true;
      pending.keepalive ||= request.keepalive === true;
      pending.notify ||= request.notify === true;
      if (request.immediate === true) {
        flush();
        return;
      }

      const current = now();
      const intervalDueAt = lastSavedAt ? lastSavedAt + minIntervalMs : current;
      const nextDueAt = Math.max(current + debounceMs, intervalDueAt);
      if (timer && dueAt <= nextDueAt) return;
      if (timer) clearTimer(timer);
      dueAt = nextDueAt;
      timer = setTimer(flush, Math.max(0, nextDueAt - current));
    }

    function markSaved(timestamp = now()) {
      const value = Number(timestamp);
      if (Number.isFinite(value)) lastSavedAt = value;
    }

    function cancel() {
      if (timer) clearTimer(timer);
      timer = 0;
      dueAt = 0;
      takePending();
    }

    return Object.freeze({ schedule, flush, markSaved, cancel });
  }

  return Object.freeze({
    LOCAL_SAVE_INTERVAL_MS,
    CLOUD_SAVE_INTERVAL_MS,
    CLOUD_SAVE_DEBOUNCE_MS,
    createCloudSaveQueue
  });
});
