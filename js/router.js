/**
 * General Screen Router — switches the visible screen.
 *
 * This module's single responsibility is screen navigation. It is the only
 * module aware of the full set of screens at runtime. It depends solely on the
 * Screen Lifecycle Contract (below), never on concrete screen modules, so new
 * screens plug in via `register` without modifying Router internals.
 *
 * ── Screen Lifecycle Contract ─────────────────────────────────────────────
 *
 * @typedef {Object} ScreenContext
 * @property {(id: string) => boolean} navigate  Request a screen switch; returns
 *   whether the navigation succeeded (target was registered).
 * @property {Object} [store]  Central state scaffold, passed through when the
 *   Router was created with one. Optional.
 *
 * @typedef {Object} Screen
 * @property {(container: HTMLElement, ctx: ScreenContext) => void} mount
 *   REQUIRED. Build DOM into `container`, wire listeners, use `ctx.navigate(id)`
 *   for transitions.
 * @property {() => void} [unmount]  OPTIONAL. Tear down listeners and clear DOM.
 *   When absent, the Router clears the container itself.
 * @property {string} [title]  OPTIONAL. Human-readable display name.
 *
 * @typedef {() => Screen} ScreenFactory
 *   Screens are produced by factories so each navigation yields a fresh,
 *   isolated instance.
 * ──────────────────────────────────────────────────────────────────────────
 */

/**
 * Create a screen router bound to a container element.
 *
 * @param {HTMLElement} container  The element screens mount into.
 * @param {Object} [store]  Optional central store, exposed to screens via
 *   `ctx.store`.
 * @returns {{
 *   register: (id: string, factory: ScreenFactory) => void,
 *   navigate: (id: string) => boolean,
 *   getCurrentScreenId: () => (string | null),
 *   hasScreen: (id: string) => boolean,
 * }} The router API.
 */
export function createRouter(container, store) {
  /** @type {Map<string, ScreenFactory>} */
  const registry = new Map();

  /** @type {Screen | null} */
  let currentScreen = null;
  /** @type {string | null} */
  let currentScreenId = null;

  /**
   * Register a screen factory under an id. Data-driven: adding screens never
   * requires touching Router internals.
   *
   * @param {string} id
   * @param {ScreenFactory} factory
   */
  function register(id, factory) {
    registry.set(id, factory);
  }

  /**
   * Whether a screen id is registered.
   *
   * @param {string} id
   * @returns {boolean}
   */
  function hasScreen(id) {
    return registry.has(id);
  }

  /**
   * The id of the currently mounted screen, or `null` if none is mounted.
   *
   * @returns {string | null}
   */
  function getCurrentScreenId() {
    return currentScreenId;
  }

  /**
   * Switch the visible screen to `id`.
   *
   * On a registered id: unmount the current screen (if any), instantiate the
   * target via its factory, mount it into the container, and record it as
   * current. Returns `true`.
   *
   * On an unregistered id: leave the current screen unchanged (no unmount, no
   * new mount), warn "screen not found: <id>", and return `false`. Never throws.
   *
   * @param {string} id
   * @returns {boolean}
   */
  function navigate(id) {
    if (!registry.has(id)) {
      console.warn(`screen not found: ${id}`);
      return false;
    }

    // Tear down the outgoing screen, if any.
    if (currentScreen && typeof currentScreen.unmount === 'function') {
      currentScreen.unmount();
    }

    // Build a fresh instance of the target screen.
    const factory = registry.get(id);
    const screen = factory();

    const ctx = { navigate, store };
    screen.mount(container, ctx);

    currentScreen = screen;
    currentScreenId = id;
    return true;
  }

  return { register, navigate, getCurrentScreenId, hasScreen };
}
