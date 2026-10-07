/**
 * EventBus — synchronous in-process pub/sub.
 *
 * Used to broadcast engine events (MATCH_CREATED, MESSAGE_SENT, …)
 * to whoever is listening (notifications, analytics, future workers).
 *
 * No dependency on any specific provider. Handlers are called
 * synchronously in subscription order. Errors in one handler do
 * NOT prevent other handlers from running — they are logged via
 * an injectable onError callback.
 */

export class EventBus {
  constructor({ onError } = {}) {
    this.handlers = new Map(); // eventType -> Set<fn>
    this.onError = onError || ((err, evt) => {
      // eslint-disable-next-line no-console
      console.error('[EventBus] handler error for', evt?.type, err);
    });
  }

  subscribe(type, handler) {
    if (typeof handler !== 'function') {
      throw new Error('EventBus.subscribe requires a function');
    }
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type).add(handler);
    return () => this.unsubscribe(type, handler);
  }

  unsubscribe(type, handler) {
    const set = this.handlers.get(type);
    if (!set) return false;
    const removed = set.delete(handler);
    if (set.size === 0) this.handlers.delete(type);
    return removed;
  }

  publish(event) {
    if (!event || typeof event.type !== 'string') {
      throw new Error('EventBus.publish requires an event with a type');
    }
    const set = this.handlers.get(event.type);
    if (!set || set.size === 0) return 0;
    let delivered = 0;
    for (const handler of [...set]) {
      try {
        handler(event);
        delivered++;
      } catch (err) {
        this.onError(err, event);
      }
    }
    return delivered;
  }

  clear() {
    this.handlers.clear();
  }

  listenerCount(type) {
    return this.handlers.get(type)?.size ?? 0;
  }
}
