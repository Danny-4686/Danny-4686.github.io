import test from 'node:test';
import assert from 'node:assert/strict';
import rateLimiter from '../../games/cloudlab-clicker/rate-limiter.js';

const { createRollingLimiter } = rateLimiter;

test('CloudLab Clicker accepts no more than 10 presses in a rolling second', () => {
  const limiter = createRollingLimiter({ limit: 10, windowMs: 1000 });
  for (let index = 0; index < 10; index += 1) {
    assert.equal(limiter.attempt(index * 100).allowed, true);
  }
  const blocked = limiter.attempt(999);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.equal(blocked.retryAfterMs, 1);
});

test('CloudLab Clicker rolling limit releases capacity exactly one second later', () => {
  const limiter = createRollingLimiter({ limit: 10, windowMs: 1000 });
  for (let index = 0; index < 10; index += 1) limiter.attempt(index * 100);
  assert.equal(limiter.attempt(1000).allowed, true);
  assert.equal(limiter.attempt(1001).allowed, false);
});

test('CloudLab Clicker click limit can be reset with game progress', () => {
  const limiter = createRollingLimiter({ limit: 1, windowMs: 1000 });
  assert.equal(limiter.attempt(0).allowed, true);
  assert.equal(limiter.attempt(1).allowed, false);
  limiter.reset();
  assert.equal(limiter.attempt(1).allowed, true);
});
