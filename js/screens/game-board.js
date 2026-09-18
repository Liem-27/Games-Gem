/**
 * Game Board Screen — the single DOM module that presents the match-3 board and
 * owns the transient interaction state that sits on top of the pure engine.
 *
 * This module's single responsibility is the Game_Board_Screen concern: build
 * the 8×8 grid into the DOM, render each Cell's Gem, and manage the transient UI
 * state (the current board, the Selected_Gem, and the `isResolving` flag). It is
 * DISTINCT from the pure engine: it NEVER embeds match, gravity, refill, swap, or
 * generation logic — all such logic lives in `board.js`, `match.js`, and
 * `gem.js`, and this screen only calls into those modules. It references no
 * external image files; gems are drawn from `gem.type` as text.
 *
 * Screens conform to the Screen Lifecycle Contract defined in `js/router.js`:
 * an object with a required `mount(container, ctx)`, an optional `unmount()`,
 * and an optional `title`. `ctx` is a ScreenContext exposing `navigate(id)`
 * (and optionally `store`). Screens are produced by factories so each call
 * yields a fresh, isolated instance.
 *
 * SCOPE: structure, rendering, selection state, swap orchestration (selection →
 * swap → keep/revert), cascade resolution, click/tap listener wiring, and the
 * return-to-menu control (Req 23.5, 24.3) that navigates back to the Main_Menu.
 * The board CSS (task 30) is a later task; concrete styling stays in the
 * stylesheet, with inline theme fallbacks here only so the screen renders when
 * external CSS is absent.
 *
 * @typedef {import('../router.js').Screen} Screen
 * @typedef {import('../router.js').ScreenContext} ScreenContext
 * @typedef {import('../board.js').Board} Board
 * @typedef {import('../board.js').Cell} Cell
 */

import { ROWS, COLS } from '../config/board-config.js';
import {
  generateStableBoard,
  getCell,
  isAdjacent,
  swapCells,
  removeCells,
  applyGravity,
  refill,
} from '../board.js';
import { findMatches, hasMatches } from '../match.js';

/**
 * Hard upper bound on cascade iterations for a single resolved move (Req 20.2).
 *
 * Each cascade round removes at least MIN_MATCH gems from the finite ROWS×COLS
 * board before refilling, so the number of distinct rounds a single move can
 * trigger is small and finite. This guard is set on the order of the total cell
 * count — far above any value reachable under correct logic — purely as a defect
 * safety net: under correct logic the loop always exits naturally when
 * {@link findMatches} reports no Match. Reaching this bound indicates a logic
 * defect, at which point the loop breaks defensively rather than hanging.
 * @type {number}
 */
const MAX_CASCADE_ITERATIONS = ROWS * COLS;

/**
 * Minimum Touch_Target edge in CSS pixels. Each Cell is rendered at least this
 * wide and this tall (Req 22.4). Applied as an inline-style fallback because the
 * board stylesheet is a later task (task 30). Exported so integration tests can
 * assert the inline Touch_Target floor without restating the literal (Req 22.4).
 * @type {number}
 */
export const TOUCH_TARGET_MIN_PX = 44;

/**
 * CSS class toggled on a Cell element while its Gem is the Selected_Gem. Toggling
 * a class (rather than restyling inline) is the visual selection indication
 * (Req 14.2) and keeps the concrete styling to the stylesheet task.
 * @type {string}
 */
const SELECTED_CLASS = 'game-board__cell--selected';

/**
 * The screen id the return control navigates to. Activating it returns the
 * Player to the Main_Menu (Req 23.5, 24.3).
 * @type {string}
 */
const MAIN_MENU_ID = 'main-menu';

/**
 * Create the Game Board screen.
 *
 * @param {Object} [config]  Optional overrides for future tasks.
 * @param {() => number} [config.rng=Math.random]  Injectable random source in
 *   [0, 1) threaded into `generateStableBoard`, so tests can seed a deterministic
 *   initial board.
 * @returns {Screen} A fresh screen conforming to the Screen Lifecycle Contract.
 */
export function createGameBoardScreen(config = {}) {
  const { rng = Math.random } = config;

  /** @type {HTMLElement | null} The root element this screen owns. */
  let root = null;
  /** @type {HTMLElement | null} The grid element that holds the Cell elements. */
  let grid = null;

  /**
   * The control that returns the Player to the Main_Menu (Req 23.5, 24.3), kept
   * so its activation listeners can be removed in `unmount`.
   * @type {HTMLButtonElement | null}
   */
  let returnButton = null;
  /**
   * Activation listeners bound to {@link returnButton}, paired with the event
   * type they were registered for, kept for cleanup in `unmount`.
   * @type {Array<{ type: string, handler: (event: Event) => void }>}
   */
  let returnHandlers = [];

  /**
   * The Cell button elements indexed as `cellEls[row][col]`, kept so activation
   * and selection indication can address a Cell in O(1) without re-querying the
   * DOM.
   * @type {HTMLButtonElement[][]}
   */
  let cellEls = [];

  /**
   * Bound activation handlers paired with their Cell element and the event type
   * they were registered for, kept for cleanup in `unmount`.
   * @type {Array<{ el: HTMLButtonElement, type: string, handler: (event: Event) => void }>}
   */
  let handlers = [];

  // ── Transient UI state (closure variables) ──────────────────────────────
  /**
   * The current board being displayed. Produced by the pure engine; this module
   * never mutates it, it only re-reads and re-renders from it.
   * @type {Board | null}
   */
  let board = null;
  /**
   * The address of the current Selected_Gem, or `null` when nothing is selected.
   * At most one Selected_Gem is retained at a time (Req 14.4).
   * @type {Cell | null}
   */
  let selectedGem = null;
  /**
   * Guard against the browser's synthesized duplicate `click` that follows a
   * `touchend` on the same tap. A touch tap is handled on `touchend` (for the
   * <100 ms response, Req 22.5) which also calls `preventDefault()`; in a real
   * browser that suppresses the synthesized `click`, but as a robust,
   * environment-independent guard the `touchend` handler also raises this flag,
   * and the `click` handler consumes-and-clears it so a single tap causes
   * exactly one {@link activateCell} (Req 22.2). A plain mouse click — with no
   * preceding `touchend` — never sees the flag set, so it always activates
   * (Req 22.1).
   * @type {boolean}
   */
  let suppressNextClick = false;
  /**
   * Whether the board is mid-resolution (a swap/cascade is settling). Set true
   * for the duration of {@link resolveCascade} so activations are ignored and
   * the player cannot act on a transient board (Req 20.4); cleared once the
   * board is Stable again. Defaults to false.
   * @type {boolean}
   */
  let isResolving = false;

  /**
   * Apply the visual selection indication to a Cell element by toggling
   * {@link SELECTED_CLASS} (Req 14.2).
   *
   * @param {Cell} cell  The Cell address to mark.
   * @param {boolean} on  Whether the Cell is the Selected_Gem.
   */
  function setSelectionIndication(cell, on) {
    const el = cellEls[cell.row] && cellEls[cell.row][cell.col];
    if (el) {
      el.classList.toggle(SELECTED_CLASS, on);
    }
  }

  /**
   * Clear the current Selected_Gem and its visual indication, if any.
   */
  function clearSelection() {
    if (selectedGem) {
      setSelectionIndication(selectedGem, false);
      selectedGem = null;
    }
  }

  /**
   * Set the Selected_Gem to `cell` and show its selection indication, replacing
   * any prior selection so exactly one Selected_Gem is retained (Req 14.4).
   *
   * @param {Cell} cell  The Cell address to select.
   */
  function select(cell) {
    clearSelection();
    selectedGem = { row: cell.row, col: cell.col };
    setSelectionIndication(selectedGem, true);
  }

  /**
   * Resolve the board to a Stable_Board by running the automatic Cascade, then
   * re-enable input.
   *
   * Called after a kept Swap has left one or more Matches on the board. Input is
   * blocked for the whole resolution by setting `isResolving` (Req 20.4), then
   * the loop repeats automatically (Req 20.1, 20.2): detect Matches with
   * {@link findMatches}; when there are none the board is Stable and the loop
   * stops (Req 20.3); otherwise clear the matched Cells with `removeCells`
   * (Req 17), let the survivors fall with `applyGravity` (Req 18), fill the new
   * empties with `refill` (Req 19), re-render so the resolved step is visible,
   * and loop again. No match/gravity/refill logic is embedded here — every step
   * calls the pure engine.
   *
   * The loop carries an explicit iteration bound ({@link MAX_CASCADE_ITERATIONS},
   * on the order of the cell count) that never triggers under correct logic; if
   * it is ever reached the loop breaks defensively rather than hanging (Req 20.2).
   *
   * Input is re-enabled (`isResolving` cleared) once the loop exits, whether it
   * exited naturally at a Stable_Board or defensively at the bound.
   */
  function resolveCascade() {
    isResolving = true;
    try {
      let iterations = 0;
      // Loop until no Match remains (Stable_Board, Req 20.3) or the defensive
      // bound is hit (Req 20.2).
      while (iterations < MAX_CASCADE_ITERATIONS) {
        const matches = findMatches(board);
        if (matches.length === 0) {
          // No Match remains: the board is Stable — stop the Cascade (Req 20.3).
          break;
        }
        // One Cascade round: remove → gravity → refill, then re-render so the
        // resolved step is visible before the next detection (Req 17/18/19).
        board = removeCells(board, matches);
        board = applyGravity(board);
        board = refill(board, rng);
        renderGrid();
        iterations += 1;
      }
    } finally {
      // Re-enable input on reaching a Stable_Board (or on the defensive break).
      isResolving = false;
    }
  }

  /**
   * Attempt a Swap between the Selected_Gem's Cell (`from`) and an adjacent
   * activated Cell (`to`), then decide keep-vs-revert and re-render.
   *
   * The caller guarantees `from` and `to` are Adjacent_Cells (Req 15.2). This
   * orchestrates only — every rule is evaluated by the pure engine: `swapCells`
   * produces the swapped Board (Req 15.1) and `hasMatches` tests it for a Match
   * anywhere on the Board. When the swapped Board has at least one Match, the
   * Swap is kept as the new displayed Board (Req 15.4); otherwise both Gems are
   * returned to their pre-Swap Cells by leaving the pre-Swap `board` in place
   * (Req 15.5). Either way the Selected_Gem is cleared and the grid is re-rendered
   * so the final Cell positions are shown; a single synchronous re-render is well
   * within the 300 ms UI budget (Req 15.6). No match/gravity/refill logic is
   * embedded here — those stay in the pure engine.
   *
   * The clear-then-render order matters: {@link clearSelection} removes the
   * selection indication from the OLD Cell elements before {@link renderGrid}
   * rebuilds them, so no stale selected class survives the re-render.
   *
   * @param {Cell} from  The Selected_Gem's Cell.
   * @param {Cell} to  The adjacent activated Cell.
   */
  function attemptSwap(from, to) {
    const swapped = swapCells(board, from, to);
    const kept = hasMatches(swapped);

    if (kept) {
      // Req 15.4: the Swap forms a Match somewhere — keep it as the new board.
      board = swapped;
    }
    // Req 15.5: no Match anywhere — leave the pre-Swap `board` in place, which
    // returns both Gems to their pre-Swap Cells (the revert).

    // Req 15.4 / 15.5: the Selected_Gem is cleared on both keep and revert.
    clearSelection();

    // Req 15.6: reflect the final Cell positions in the displayed Board.
    renderGrid();

    // Req 20.1–20.4: a kept Swap leaves at least one Match, so resolve the
    // board back to a Stable_Board via the automatic Cascade, blocking input
    // meanwhile. A reverted Swap left a Stable_Board, so no cascade is needed.
    if (kept) {
      resolveCascade();
    }
  }

  /**
   * Handle activation of the Cell at `(row, col)` and update selection state.
   *
   * Activation is ignored entirely while `isResolving` is true (Req 20.4). Empty
   * Cells never start or change a selection. With no current selection, an
   * occupied Cell becomes the Selected_Gem (Req 14.1). Re-activating the current
   * Selected_Gem clears it (Req 14.3). With a selection present, activating an
   * occupied non-adjacent Cell re-selects it (Req 15.3), while an occupied
   * adjacent Cell routes to {@link attemptSwap} which performs the keep/revert.
   *
   * @param {number} row  Activated Cell row.
   * @param {number} col  Activated Cell col.
   */
  function activateCell(row, col) {
    if (isResolving || !board) {
      return;
    }

    const gem = getCell(board, row, col);
    if (gem === null) {
      // Activating an empty Cell neither starts nor changes a selection.
      return;
    }

    const activated = { row, col };

    if (!selectedGem) {
      // Req 14.1: first activation of an occupied Cell selects it.
      select(activated);
      return;
    }

    if (selectedGem.row === row && selectedGem.col === col) {
      // Req 14.3: re-activating the Selected_Gem clears the selection.
      clearSelection();
      return;
    }

    if (isAdjacent(selectedGem, activated)) {
      // Req 15.1: adjacent occupied Cell → attempt a Swap (keep or revert).
      attemptSwap(selectedGem, activated);
      return;
    }

    // Req 15.3: non-adjacent occupied Cell re-selects (old selection cleared).
    select(activated);
  }

  /**
   * Render the current `board` into the grid, building one Cell element per
   * board Cell and wiring a basic activation handler on each.
   *
   * Each Cell is a Touch_Target at least {@link TOUCH_TARGET_MIN_PX} wide and
   * tall (Req 22.4) and shows its Gem's `type` as text — no external image files
   * are referenced. Theme colors use `var()` with defined fallbacks per project
   * convention.
   *
   * Input wiring (Req 22): every Cell routes both a mouse click and a touch tap
   * to the SAME discrete {@link activateCell} entry point, so the two gestures are
   * equivalent (Req 22.1, 22.2). A touch tap is handled on `touchend`, which fires
   * as soon as the finger lifts, so the visible selection/swap change lands well
   * within 100 ms without waiting on the browser's synthesized click (Req 22.5);
   * that `touchend` handler calls `preventDefault()` so the browser does NOT then
   * emit a duplicate synthesized `click` for the same tap. Only discrete `click`
   * and `touchend` listeners are registered — no `pointermove`, `touchmove`,
   * `dragstart`, or `drag` handlers exist, so a Swap never requires a swipe or
   * drag gesture (Req 22.3).
   */
  function renderGrid() {
    cellEls = [];
    handlers = [];
    grid.textContent = '';

    for (let row = 0; row < ROWS; row += 1) {
      const rowEls = [];
      for (let col = 0; col < COLS; col += 1) {
        const cellEl = document.createElement('button');
        cellEl.type = 'button';
        cellEl.className = 'game-board__cell';
        cellEl.dataset.row = String(row);
        cellEl.dataset.col = String(col);

        // Touch_Target minimum size (Req 22.4). Inline fallback until task 30.
        cellEl.style.minWidth = `${TOUCH_TARGET_MIN_PX}px`;
        cellEl.style.minHeight = `${TOUCH_TARGET_MIN_PX}px`;
        cellEl.style.color = 'var(--crystal-text, #f4f1ff)';
        cellEl.style.background = 'var(--crystal-cell-bg, #2a2350)';
        cellEl.style.border = '1px solid var(--crystal-accent, #a29bfe)';

        const gem = getCell(board, row, col);
        if (gem) {
          cellEl.dataset.gemType = gem.type;
          cellEl.textContent = gem.type;
          cellEl.setAttribute('aria-label', `${gem.type} at row ${row + 1}, column ${col + 1}`);
        } else {
          cellEl.setAttribute('aria-label', `Empty cell at row ${row + 1}, column ${col + 1}`);
        }

        // Req 22.1: a mouse click routes to the discrete cell activation. If a
        // preceding `touchend` on this same tap already activated the cell, the
        // synthesized duplicate `click` is consumed here (flag cleared) so the
        // tap causes exactly one activation. A plain click never sees the flag.
        const clickHandler = () => {
          if (suppressNextClick) {
            suppressNextClick = false;
            return;
          }
          activateCell(row, col);
        };
        cellEl.addEventListener('click', clickHandler);
        handlers.push({ el: cellEl, type: 'click', handler: clickHandler });

        // Req 22.2 / 22.5: a touch tap routes to the SAME discrete activation on
        // `touchend`, landing the visible change without waiting for the
        // synthesized click. `preventDefault()` suppresses that synthesized
        // click in real browsers (scoped to this Cell only, so page scrolling
        // elsewhere is unaffected); `suppressNextClick` guards the case where a
        // click is still delivered. No touchstart/touchmove/drag handlers are
        // registered, so no swipe/drag gesture is ever required (Req 22.3).
        const touchHandler = (event) => {
          event.preventDefault();
          suppressNextClick = true;
          activateCell(row, col);
        };
        cellEl.addEventListener('touchend', touchHandler);
        handlers.push({ el: cellEl, type: 'touchend', handler: touchHandler });

        grid.append(cellEl);
        rowEls.push(cellEl);
      }
      cellEls.push(rowEls);
    }
  }

  return {
    title: 'Play',

    /**
     * Render the Game Board into `container`.
     *
     * Generates a fresh Stable_Board via the pure engine and renders the 8×8
     * grid. Selection starts empty and `isResolving` starts false.
     *
     * @param {HTMLElement} container
     * @param {ScreenContext} ctx
     */
    mount(container, ctx) {
      board = generateStableBoard(rng);
      selectedGem = null;
      isResolving = false;
      suppressNextClick = false;

      root = document.createElement('div');
      root.className = 'game-board';

      // Solid theme background so the board stays visible even if the board
      // stylesheet (task 30) fails to load. Theme custom properties carry
      // defined fallbacks per the design's error-handling table.
      root.style.background = 'var(--crystal-bg, #1b1636)';
      root.style.color = 'var(--crystal-text, #f4f1ff)';
      root.style.minHeight = '100%';

      const heading = document.createElement('h1');
      heading.className = 'game-board__title';
      heading.textContent = this.title;

      grid = document.createElement('div');
      grid.className = 'game-board__grid';
      grid.setAttribute('role', 'grid');
      grid.setAttribute('aria-label', 'Game board');

      renderGrid();

      // Return-to-menu control (Req 23.5, 24.3). Activating it — by mouse click
      // or touch tap — calls `ctx.navigate(MAIN_MENU_ID)`, which the Router
      // resolves to the Main_Menu well within the 500 ms budget. The control is
      // a Touch_Target at least TOUCH_TARGET_MIN_PX tall/wide (Req 22.4 guidance),
      // applied inline as a fallback until the board stylesheet (task 30). Both a
      // `click` and a `touchend` gesture route to the SAME navigation so the two
      // are equivalent; the `touchend` handler calls `preventDefault()` so the
      // browser does not also emit a synthesized duplicate `click` for the tap.
      returnButton = document.createElement('button');
      returnButton.type = 'button';
      returnButton.className = 'game-board__return';
      returnButton.textContent = 'Menu';
      returnButton.setAttribute('aria-label', 'Return to main menu');
      returnButton.style.minWidth = `${TOUCH_TARGET_MIN_PX}px`;
      returnButton.style.minHeight = `${TOUCH_TARGET_MIN_PX}px`;
      returnButton.style.color = 'var(--crystal-text, #f4f1ff)';
      returnButton.style.background = 'var(--crystal-cell-bg, #2a2350)';
      returnButton.style.border = '1px solid var(--crystal-accent, #a29bfe)';

      const navigateToMenu = () => {
        ctx.navigate(MAIN_MENU_ID);
      };
      const returnClickHandler = () => {
        navigateToMenu();
      };
      const returnTouchHandler = (event) => {
        event.preventDefault();
        navigateToMenu();
      };
      returnButton.addEventListener('click', returnClickHandler);
      returnButton.addEventListener('touchend', returnTouchHandler);
      returnHandlers = [
        { type: 'click', handler: returnClickHandler },
        { type: 'touchend', handler: returnTouchHandler },
      ];

      root.append(heading, grid, returnButton);
      container.append(root);
    },

    /**
     * Tear down: remove Cell listeners, clear the grid, and remove the screen's
     * own DOM. Transient state is reset so a fresh instance starts clean.
     */
    unmount() {
      for (const { el, type, handler } of handlers) {
        el.removeEventListener(type, handler);
      }
      handlers = [];
      if (returnButton) {
        for (const { type, handler } of returnHandlers) {
          returnButton.removeEventListener(type, handler);
        }
      }
      returnHandlers = [];
      returnButton = null;
      cellEls = [];
      suppressNextClick = false;
      if (root && root.parentNode) {
        root.parentNode.removeChild(root);
      }
      root = null;
      grid = null;
      board = null;
      selectedGem = null;
      isResolving = false;
    },
  };
}
