/**
 * Placeholder Screen Factory — a "coming-soon" screen for any not-yet-built
 * feature.
 *
 * This module's single responsibility is producing placeholder screens. Every
 * export relates to that one concern. It imports NO gameplay systems and
 * invokes none — activating a deferred-feature button lands here and touches no
 * board, level, booster, sound, or save logic.
 *
 * Screens conform to the Screen Lifecycle Contract defined in `js/router.js`:
 * an object with a required `mount(container, ctx)`, an optional `unmount()`,
 * and an optional `title`. `ctx` is a ScreenContext exposing `navigate(id)`
 * (and optionally `store`). Screens are produced by factories so each call
 * yields a fresh, isolated instance.
 *
 * @typedef {import('../router.js').Screen} Screen
 * @typedef {import('../router.js').ScreenContext} ScreenContext
 */

/**
 * The screen id the Back control returns to. Belongs to the placeholder
 * concern: every placeholder returns the user to the originating menu.
 * @type {string}
 */
const MAIN_MENU_ID = 'main-menu';

/**
 * Create a placeholder ("coming-soon") screen for a deferred feature.
 *
 * @param {{ title: string, message: string }} config
 *   `title` is the feature name; `message` is the "not yet available" text.
 * @returns {Screen} A fresh screen conforming to the Screen Lifecycle Contract.
 */
export function createPlaceholderScreen({ title, message } = {}) {
  /** @type {HTMLElement | null} The root element this screen owns. */
  let root = null;
  /** @type {HTMLButtonElement | null} */
  let backButton = null;
  /** @type {(() => void) | null} The bound click handler, kept for cleanup. */
  let onBack = null;

  return {
    title,

    /**
     * Render the placeholder into `container`.
     *
     * @param {HTMLElement} container
     * @param {ScreenContext} ctx
     */
    mount(container, ctx) {
      root = document.createElement('div');
      root.className = 'placeholder-screen';

      // Solid theme background so controls stay visible and interactive even if
      // artwork or external CSS fails to load. Uses theme custom properties with
      // defined fallbacks per the design's error-handling table.
      root.style.background = 'var(--crystal-bg, #1b1636)';
      root.style.color = 'var(--crystal-text, #f4f1ff)';
      root.style.minHeight = '100%';

      const heading = document.createElement('h1');
      heading.className = 'placeholder-screen__title';
      heading.textContent = title;

      const messageEl = document.createElement('p');
      messageEl.className = 'placeholder-screen__message';
      messageEl.textContent = message;

      backButton = document.createElement('button');
      backButton.type = 'button';
      backButton.className = 'placeholder-screen__back';
      backButton.textContent = 'Back';

      // Back control returns the user to the originating menu (main menu).
      onBack = () => {
        ctx.navigate(MAIN_MENU_ID);
      };
      backButton.addEventListener('click', onBack);

      root.append(heading, messageEl, backButton);
      container.append(root);
    },

    /**
     * Tear down: remove the listener and clear the screen's own DOM.
     */
    unmount() {
      if (backButton && onBack) {
        backButton.removeEventListener('click', onBack);
      }
      if (root && root.parentNode) {
        root.parentNode.removeChild(root);
      }
      root = null;
      backButton = null;
      onBack = null;
    },
  };
}
