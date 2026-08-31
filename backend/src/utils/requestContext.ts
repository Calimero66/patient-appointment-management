import { AsyncLocalStorage } from 'async_hooks';

/**
 * Request-scoped context store.
 * Allows passing data (e.g. userId, traceId) across the call stack
 * without threading it through every function argument.
 *
 * Usage:
 *   const store = requestContext.getStore();
 *   store?.userId  // available anywhere during the request lifecycle
 */
export interface RequestStore {
  userId?: number;
  traceId?: string;
  ip?: string;
}

export const requestContext = new AsyncLocalStorage<RequestStore>();
