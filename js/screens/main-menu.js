/**
 * Main Menu UI Module — renders and manages the Main Menu.
 *
 * This module's single responsibility is rendering the Main Menu (title, the
 * five navigation buttons, and original inline-SVG crystal artwork) and wiring
 * those buttons to screen navigation. Every export relates to that one concern.
 * It is DISTINCT from the bootstrap and the Router: it neither initializes the
 * app nor knows the full set of screens — it only asks `ctx.navigate(id)` to
 * switch screens. It imports no gameplay systems and invokes none.
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
 * A single Main Menu navigation button, described as data rather than hardcoded
 * control flow. Belongs to the Main Menu concern.
 *
 * @typedef {Object} MenuItem
 * @property {string} label  The visible button text.
 * @property {string} screenId  The screen id this button navigates to.
 */

/**
 * The game title text, rendered verbatim.
 * @type {string}
 */
const TITLE_TEXT = 'Gemoria: Crystal Quest';

/**
 * CSS class applied to a button while it is being activated, producing the
 * <100ms visual state change before navigation.
 * @type {string}
 */
const ACTIVE_CLASS = 'menu-button--active';

/**
 * The data-driven menu: one entry per button, in display order. Adding or
 * reordering buttons is a data change here; the render logic never hardcodes a
 * per-button branch.
 * @type {ReadonlyArray<MenuItem>}
 */
const MENU_ITEMS = [
  { label: 'Play', screenId: 'play' },
  { label: 'World Map', screenId: 'world-map' },
  { label: 'Boosters', screenId: 'boosters' },
  { label: 'Achievements', screenId: 'achievements' },
  { label: 'Settings', screenId: 'settings' },
];

/**
 * Build the original Placeholder_Artwork as an inline SVG containing crystal /
 * gem shapes. Uses no external image files. Colors reference theme custom
 * properties with defined fallbacks so the artwork stays visible even if the
 * theme CSS fails to load.
 *
 * @returns {SVGSVGElement}
 */
function createArtwork() {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'main-menu__artwork');
  svg.setAttribute('viewBox', '0 0 200 160');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Crystal artwork');
  svg.setAttribute('focusable', 'false');

  // A tall central crystal (faceted gem shape).
  const crystal = document.createElementNS(svgNS, 'polygon');
  crystal.setAttribute('class', 'main-menu__crystal');
  crystal.setAttribute('points', '100,10 130,60 100,150 70,60');
  crystal.setAttribute('fill', 'var(--crystal-primary, #6c5ce7)');
  crystal.setAttribute('stroke', 'var(--crystal-accent, #a29bfe)');
  crystal.setAttribute('stroke-width', '2');

  // A facet highlight on the central crystal.
  const facet = document.createElementNS(svgNS, 'polygon');
  facet.setAttribute('class', 'main-menu__crystal-facet');
  facet.setAttribute('points', '100,10 130,60 100,60');
  facet.setAttribute('fill', 'var(--crystal-accent, #a29bfe)');
  facet.setAttribute('opacity', '0.7');

  // A smaller side gem (diamond shape).
  const gem = document.createElementNS(svgNS, 'polygon');
  gem.setAttribute('class', 'main-menu__gem');
  gem.setAttribute('points', '40,80 55,100 40,120 25,100');
  gem.setAttribute('fill', 'var(--crystal-secondary, #00cec9)');
  gem.setAttribute('stroke', 'var(--crystal-accent, #a29bfe)');
  gem.setAttribute('stroke-width', '2');

  // A second smaller side gem on the opposite side.
  const gem2 = document.createElementNS(svgNS, 'polygon');
  gem2.setAttribute('class', 'main-menu__gem');
  gem2.setAttribute('points', '160,80 175,100 160,120 145,100');
  gem2.setAttribute('fill', 'var(--crystal-secondary, #00cec9)');
  gem2.setAttribute('stroke', 'var(--crystal-accent, #a29bfe)');
  gem2.setAttribute('stroke-width', '2');

  svg.append(crystal, facet, gem, gem2);
  return svg;
}

/**
 * Create the Main Menu screen.
 *
 * @returns {Screen} A fresh screen conforming to the Screen Lifecycle Contract.
 */
export function mainMenuScreen() {
  /** @type {HTMLElement | null} The root element this screen owns. */
  let root = null;
  /**
   * Bound click handlers kept for cleanup, paired with their buttons.
   * @type {Array<{ button: HTMLButtonElement, handler: (event: Event) => void }>}
   */
  let handlers = [];

  return {
    title: 'Main Menu',

    /**
     * Render the Main Menu into `container`.
     *
     * @param {HTMLElement} container
     * @param {ScreenContext} ctx
     */
    mount(container, ctx) {
      root = document.createElement('div');
      root.className = 'main-menu';

      // Solid theme background keeps the menu visible/interactive even if the
      // inline artwork or external CSS fails to render. Theme custom properties
      // carry defined fallbacks per the design's error-handling table.
      root.style.background = 'var(--crystal-bg, #1b1636)';
      root.style.color = 'var(--crystal-text, #f4f1ff)';
      root.style.minHeight = '100%';

      const title = document.createElement('h1');
      title.className = 'main-menu__title';
      title.textContent = TITLE_TEXT;

      const artwork = createArtwork();

      const nav = document.createElement('nav');
      nav.className = 'main-menu__buttons';
      nav.setAttribute('aria-label', 'Main menu');

      handlers = [];

      // Data-driven render: one enabled, activatable button per MenuItem.
      for (const item of MENU_ITEMS) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'menu-button';
        button.textContent = item.label;
        // Explicitly enabled/activatable.
        button.disabled = false;
        button.dataset.screenId = item.screenId;

        // On activation: apply the active visual state (<100ms, via CSS class
        // toggle) then request navigation to this item's mapped screen id.
        const handler = () => {
          button.classList.add(ACTIVE_CLASS);
          ctx.navigate(item.screenId);
        };
        button.addEventListener('click', handler);
        handlers.push({ button, handler });

        nav.append(button);
      }

      root.append(title, artwork, nav);
      container.append(root);
    },

    /**
     * Tear down: remove listeners and clear the screen's own DOM.
     */
    unmount() {
      for (const { button, handler } of handlers) {
        button.removeEventListener('click', handler);
      }
      handlers = [];
      if (root && root.parentNode) {
        root.parentNode.removeChild(root);
      }
      root = null;
    },
  };
}
