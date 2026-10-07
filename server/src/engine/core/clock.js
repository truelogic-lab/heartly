/**
 * Heartly Dating Engine — clock abstraction.
 *
 * The engine never calls Date.now() directly. It always asks the clock.
 * Tests inject a FixedClock or ManualClock to control time.
 */

export class SystemClock {
  now() {
    return Date.now();
  }
  nowDate() {
    return new Date();
  }
}

/**
 * A clock whose time only advances when you call .tick(ms).
 * Use it in tests to make activity, match timestamps, and message
 * ordering deterministic.
 */
export class ManualClock {
  constructor(startMs = 0) {
    this.t = startMs;
  }
  now() {
    return this.t;
  }
  nowDate() {
    return new Date(this.t);
  }
  tick(ms) {
    this.t += ms;
    return this.t;
  }
  set(ms) {
    this.t = ms;
    return this.t;
  }
}

/**
 * A clock fixed at a single instant.
 */
export class FixedClock {
  constructor(atMs = 0) {
    this.t = atMs;
  }
  now() {
    return this.t;
  }
  nowDate() {
    return new Date(this.t);
  }
}

/* Default clock used in production */
export const defaultClock = new SystemClock();
