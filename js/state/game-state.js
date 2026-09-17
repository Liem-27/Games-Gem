/**
 * Central Game State — Phase 1 scaffold.
 *
 * A framework-free, minimal pub/sub store. This is an EXTENSION POINT: Phase 1
 * intentionally implements only the store mechanics (`getState` / `setState` /
 * `subscribe`). It contains NO progression, coins, lives, boosters, or level
 * logic. Future phases populate the state and add domain logic without changing
 * this module's shape.
 *
 * @typedef {(state: Object) => void} Subscriber
 *
 * @typedef {Object} Store
 * @property {() => Object} getState  Returns the current state object.
 * @property {(patch: Object) => void} setState  Shallow-merges `patch` into the
 *   current state and notifies all subscribers with the new state.
 * @property {(fn: Subscriber) => (() => void)} subscribe  Registers a listener;
 *   returns an unsubscribe function.
 */

/**
 * Create a minimal central store.
 *
 * @param {Object} [initialState={}] Initial state contents.
 * @returns {Store} The store API.
 */
export function createStore(initialState = {}) {
  let state = { ...initialState };
  const subscribers = new Set();

  return {
    getState: () => state,
    setState: (patch) => {
      state = { ...state, ...patch };
      subscribers.forEach((fn) => fn(state));
    },
    subscribe: (fn) => {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}
