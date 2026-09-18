import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { createGameBoardScreen } from '../js/screens/game-board.js';
import { createBoard, swapCells, isStableBoard, applyGravity } from '../js/board.js';
import { createGem } from '../js/gem.js';
import { findMatches, hasMatches } from '../js/match.js';
import { ROWS, COLS, GEM_TYPES } from '../js/config/board-config.js';

/**
 * Property test for the required correctness Property 1 (Stable_Board when
 * playable) of the gemoria-crystal-quest feature.
 *
 * The Stable_Board invariant is asserted against the board the game actually
 * presents as ready — the DOM the real Game Board screen renders after its
 * cascade resolves. The cascade loop (`resolveCascade`: findMatches → removeCells
 * → applyGravity → refill, repeated to a Stable_Board) is a PRIVATE closure
 * inside `createGameBoardScreen` and is not exported. Rather than replicate that
 * production loop in the test (which could reproduce the same defect and make the
 * property agree with buggy code), this test drives the REAL private cascade end
 * to end through the screen's public/DOM surface:
 *
 *   - `createGameBoardScreen({ rng })` accepts an injectable deterministic RNG
 *     that seeds both the initial board and every refill, so each generated case
 *     is reproducible.
 *   - `screen.mount(container, ctx)` renders a Stable_Board into a jsdom node.
 *   - Clicking two adjacent cell buttons for a match-forming swap runs the real
 *     private cascade FULLY SYNCHRONOUSLY.
 *   - The resolved board is reconstructed from each cell's `dataset.gemType` and
 *     validated. `isStableBoard` and `findMatches` are used ONLY as independent
 *     oracles over that DOM-read board — never to re-run remove/gravity/refill.
 *
 * Randomness is seeded via fast-check and threaded into `makeSeededRng`, driving
 * ≥100 iterations per the design's minimum (Req 25.13).
 *
 * Validates: Requirements 11.2, 19.2, 21.1, 21.6, 25.13 (design Property 1).
 */

/**
 * A small deterministic RNG (mulberry32). Given the same seed it always yields
 * the same [0, 1) sequence, standing in for Math.random so a generated board and
 * every subsequent refill are fully reproducible. Matches the helper used by
 * board.test.js and game-board.test.js.
 *
 * @param {number} seed  Any 32-bit integer seed.
 * @returns {() => number} An RNG returning floats in the half-open range [0, 1).
 */
function makeSeededRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The Cell button at (row, col) in the mounted grid.
 *
 * @param {HTMLElement} container
 * @param {number} row
 * @param {number} col
 * @returns {HTMLButtonElement}
 */
function cellAt(container, row, col) {
  return container.querySelector(
    `.game-board__cell[data-row="${row}"][data-col="${col}"]`,
  );
}

/**
 * Reconstruct the displayed board from the rendered DOM. Each Cell's
 * `dataset.gemType` (absent for an empty Cell) is turned back into a Gem so the
 * pure engine's predicates can validate exactly the visible state.
 *
 * @param {HTMLElement} container
 * @returns {import('../js/board.js').Board}
 */
function readBoardFromDom(container) {
  const board = createBoard();
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const type = cellAt(container, row, col).dataset.gemType;
      board[row][col] = type ? createGem(type) : null;
    }
  }
  return board;
}

/**
 * Find an adjacent swap on `board` whose result forms at least one Match, so we
 * can drive a real cascade through the UI. Scans right/down neighbours (each
 * unordered adjacent pair once). Reused pattern from game-board.test.js.
 *
 * @param {import('../js/board.js').Board} board
 * @returns {{ from: {row:number,col:number}, to: {row:number,col:number} } | null}
 */
function findMatchingSwap(board) {
  const neighbours = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
  ];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      for (const { dr, dc } of neighbours) {
        const to = { row: row + dr, col: col + dc };
        if (to.row >= ROWS || to.col >= COLS) continue;
        const from = { row, col };
        if (hasMatches(swapCells(board, from, to))) {
          return { from, to };
        }
      }
    }
  }
  return null;
}

/**
 * Assert the full Stable_Board invariant on a board reconstructed from the DOM:
 * 8×8 dimensions (ROWS×COLS both === 8), all 64 cells hold exactly one gem of a
 * valid Gem_Type, zero Matches, and the engine predicate agrees (Req 11.2, 19.2,
 * 21.1, 21.6). `findMatches`/`isStableBoard` act purely as independent oracles.
 *
 * @param {import('../js/board.js').Board} board
 */
function expectStableBoard(board) {
  // 8×8 dimensions.
  expect(ROWS).toBe(8);
  expect(COLS).toBe(8);
  expect(board).toHaveLength(ROWS);

  // All 64 cells hold exactly one gem of a valid Gem_Type.
  let occupied = 0;
  for (let row = 0; row < ROWS; row += 1) {
    expect(board[row]).toHaveLength(COLS);
    for (let col = 0; col < COLS; col += 1) {
      const cell = board[row][col];
      expect(cell).not.toBeNull();
      expect(GEM_TYPES).toContain(cell.type);
      occupied += 1;
    }
  }
  expect(occupied).toBe(64);

  // Zero remaining Matches, and the engine predicate agrees it is ready-to-play.
  expect(findMatches(board)).toHaveLength(0);
  expect(isStableBoard(board)).toBe(true);
}

let container;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Board engine — Property 1: Stable_Board when playable (task 31.1)', () => {
  // Feature: gemoria-crystal-quest, Property 1: Stable_Board when playable
  it('any generated board, after a valid adjacent swap resolved by the real screen cascade, is presented as a Stable_Board', () => {
    fc.assert(
      fc.property(
        // Seed for the deterministic RNG that generates the initial board and
        // threads through every refill during the real cascade resolution.
        fc.integer({ min: 0, max: 0x7fffffff }),
        (seed) => {
          const screen = createGameBoardScreen({ rng: makeSeededRng(seed) });
          screen.mount(container, { navigate: () => true });

          try {
            // The freshly generated, mounted board is already a Stable_Board —
            // this is the board the game presents as ready for the first move.
            const start = readBoardFromDom(container);
            expectStableBoard(start);

            // Drive a match-forming adjacent swap through the UI. The real
            // private cascade runs FULLY SYNCHRONOUSLY inside the second click.
            // If this board admits no match-forming swap, the case is a no-op:
            // the already-asserted mounted board stands as the presented board.
            const swap = findMatchingSwap(start);
            if (swap) {
              cellAt(container, swap.from.row, swap.from.col).click();
              cellAt(container, swap.to.row, swap.to.col).click();
            }

            // Reconstruct the board the screen now presents as ready and assert
            // the Stable_Board invariant against the REAL resolved DOM state.
            const resolved = readBoardFromDom(container);
            expectStableBoard(resolved);
          } finally {
            // Unmount between iterations so DOM/listeners never leak across
            // fast-check runs; afterEach also clears the body per test.
            screen.unmount();
          }
        },
      ),
      { numRuns: 100 },
    );
    // 100 iterations each mount the real screen and resolve a full cascade under
    // jsdom; under parallel workers that exceeds Vitest's 5s default, so an
    // explicit generous per-test timeout is set (this bounds the whole property,
    // not any single fast-check run — a genuine hang would still fail).
  }, 60000);
});

/**
 * Property test for the required correctness Property 5 (Gravity preserves the
 * gem multiset and order) of the gemoria-crystal-quest feature.
 *
 * `applyGravity` compacts each column downward (see js/board.js): within any
 * single column it must neither create nor destroy gems, so the multiset of
 * non-empty gem types is unchanged, and — because falling gems keep their
 * relative vertical arrangement — their top-to-bottom order is unchanged too.
 *
 * The test generates ARBITRARY boards that deliberately include transient empty
 * (null) cells: each of the 64 cells is independently either null or a valid gem
 * of one of the six GEM_TYPES. This exercises the exact intermediate state
 * gravity runs on after removal (holes anywhere in a column), rather than only
 * fully occupied boards.
 *
 * A per-column top-to-bottom sequence of non-empty gem types is the canonical
 * summary of both properties at once: equal sequences before and after gravity
 * prove the multiset AND the relative order are preserved. (Applied to a whole
 * column, position independence makes the ordered-sequence check strictly
 * stronger than a multiset check, so it covers Req 18.2 order and the
 * multiset-preservation obligation together.)
 *
 * Randomness is driven by fast-check across ≥100 iterations per the design's
 * minimum (Req 25.14). This is a PURE-engine property: it calls `applyGravity`
 * directly, with no DOM or screen involvement.
 *
 * Validates: Requirements 18.2, 18.3, 25.14 (design Property 5).
 */

/**
 * fast-check arbitrary for a single cell: either an empty hole (`null`) or a
 * valid gem of one of the six GEM_TYPES. Keeping the two outcomes explicit means
 * generated boards routinely contain the transient empties gravity must handle.
 *
 * @returns {fc.Arbitrary<(import('../js/gem.js').Gem|null)>}
 */
const cellArbitrary = fc.option(
  fc.constantFrom(...GEM_TYPES).map((type) => createGem(type)),
  { nil: null, freq: 2 },
);

/**
 * fast-check arbitrary for a full ROWS×COLS board whose cells are independently
 * empty or a valid gem, matching the row-major `board[row][col]` shape the
 * engine uses.
 *
 * @returns {fc.Arbitrary<import('../js/board.js').Board>}
 */
const boardArbitrary = fc.array(
  fc.array(cellArbitrary, { minLength: COLS, maxLength: COLS }),
  { minLength: ROWS, maxLength: ROWS },
);

/**
 * The top-to-bottom sequence of gem TYPES in one column, skipping empty cells.
 * Two such sequences being equal means the same gems, in the same vertical
 * order — capturing both the multiset and the relative-order obligations.
 *
 * @param {import('../js/board.js').Board} board
 * @param {number} col
 * @returns {string[]}
 */
function columnGemTypes(board, col) {
  const types = [];
  for (let row = 0; row < ROWS; row += 1) {
    const cell = board[row][col];
    if (cell !== null) {
      types.push(cell.type);
    }
  }
  return types;
}

describe('Board engine — Property 5: Gravity preserves the gem multiset and order (task 32.1)', () => {
  // Feature: gemoria-crystal-quest, Property 5: Gravity preserves the gem multiset (and order)
  it('for any board (including transient empties), applying gravity preserves each column\'s non-empty gem multiset and relative vertical order', () => {
    fc.assert(
      fc.property(boardArbitrary, (board) => {
        const after = applyGravity(board);

        for (let col = 0; col < COLS; col += 1) {
          const before = columnGemTypes(board, col);
          const settled = columnGemTypes(after, col);
          // Equal ordered sequences prove, for this column, that gravity neither
          // created nor destroyed any gem (multiset preserved) and left the
          // surviving gems in the same top-to-bottom order (Req 18.2, 18.3).
          expect(settled).toEqual(before);
        }
      }),
      { numRuns: 100 },
    );
  });
});
