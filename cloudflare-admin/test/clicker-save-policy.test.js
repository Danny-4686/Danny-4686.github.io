import test from 'node:test';
import assert from 'node:assert/strict';
import savePolicy from '../../games/cloudlab-clicker/save-policy.js';

const { createCloudSaveQueue } = savePolicy;

function fakeQueue(startAt = 10000) {
  let current = startAt;
  let nextTimerId = 1;
  const timers = new Map();
  const flushes = [];
  const queue = createCloudSaveQueue({
    now: () => current,
    setTimer: (callback, delay) => {
      const id = nextTimerId;
      nextTimerId += 1;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimer: (id) => timers.delete(id),
    onFlush: (options) => flushes.push(options),
    minIntervalMs: 60000,
    debounceMs: 2500
  });
  return { queue, timers, flushes, setNow: (value) => { current = value; } };
}

test('Clicker batches repeated progress changes into one minute cloud checkpoint', () => {
  const harness = fakeQueue();
  harness.queue.markSaved();
  harness.setNow(12000);
  harness.queue.schedule();
  harness.queue.schedule();
  harness.queue.schedule();
  assert.equal(harness.timers.size, 1);
  assert.equal([...harness.timers.values()][0].delay, 58000);
  assert.equal(harness.flushes.length, 0);
});

test('Clicker immediate saves flush one coalesced request with notification options', () => {
  const harness = fakeQueue();
  harness.queue.schedule({ notify: true });
  harness.queue.schedule({ keepalive: true });
  harness.queue.schedule({ immediate: true, force: true });
  assert.equal(harness.timers.size, 0);
  assert.deepEqual(harness.flushes, [{ force: true, keepalive: true, notify: true }]);
});

test('Clicker keeps device and cloud checkpoint intervals separate', () => {
  assert.equal(savePolicy.LOCAL_SAVE_INTERVAL_MS, 15000);
  assert.equal(savePolicy.CLOUD_SAVE_INTERVAL_MS, 60000);
  assert.equal(savePolicy.CLOUD_SAVE_DEBOUNCE_MS, 2500);
});
