/**
 * Application Bootstrap / Entry Point.
 *
 * **Primary responsibility:** initialize the application and wire the modules
 * together at startup. It owns startup and nothing else — the Router handles
 * navigation, the registry declares the screens, and the store holds state.
 *
 * The bootstrap iterates `screenRegistry` and depends only on the Screen
 * Lifecycle Contract, so future phases add screens by editing the registry (and
 * adding a screen module) without ever touching this file, `router.js`, or
 * `main-menu.js`.
 *
 * `boot()` is exported for testability and is also invoked at module end so the
 * game starts on load.
 */

import { createRouter } from './router.js';
import { screenRegistry } from './config/screens.js';
import { createStore } from './state/game-state.js';

/** The initial screen shown on startup. */
const INITIAL_SCREEN_ID = 'main-menu';

/**
 * Reveal the static, hidden `#boot-error` "failed to load" region so the
 * viewport is never left blank on a fatal startup failure. Defensive: if the
 * region is absent (e.g. under a test harness without the full HTML), this is a
 * no-op rather than a throw.
 */
function revealBootError() {
  const bootError =
    typeof document !== 'undefined'
      ? document.getElementById('boot-error')
      : null;
  if (bootError) {
    bootError.removeAttribute('hidden');
  }
}

/**
 * Initialize the application: resolve the mount root, create the store scaffold
 * and Router, register every declared screen, and navigate to the Main Menu.
 *
 * All wiring is wrapped in `try/catch`; on any failure — including a missing
 * `#app` container — the on-screen `#boot-error` region is revealed so the user
 * sees a "failed to load" message instead of a blank viewport.
 *
 * @param {string} [rootSelector='#app'] CSS selector for the mount container.
 * @returns {boolean} `true` if the app booted; `false` if it failed to start.
 */
export function boot(rootSelector = '#app') {
  try {
    // 1. Resolve the mount container; a missing root is a fatal startup error.
    const container = document.querySelector(rootSelector);
    if (!container) {
      revealBootError();
      return false;
    }

    // 2. Create the central state scaffold (Phase 1: minimal).
    const store = createStore();

    // 3. Create the Router over the container, passing the store through so it
    //    reaches screens via their ScreenContext.
    const router = createRouter(container, store);

    // 4. Register each declared screen from the single-source registry.
    for (const { id, factory } of screenRegistry) {
      router.register(id, factory);
    }

    // 5. Navigate to the initial screen.
    router.navigate(INITIAL_SCREEN_ID);

    return true;
  } catch (err) {
    // 6. Any failure during wiring reveals the on-screen "failed to load"
    //    region so the viewport is never left blank.
    console.error('Bootstrap failed:', err);
    revealBootError();
    return false;
  }
}

// Start the game on load. Kept separate from the export so tests can call
// `boot()` explicitly against their own fixtures.
boot();
