/**
 * Board Model — the single owner of the match-3 board structure and the
 * type-safe, bounds-checked cell accessors that sit on top of it.
 *
 * This module's single responsibility is the board concern: representing the
 * board as data and providing safe reads/writes of its cells. The board is a
 * row-major 2D array addressed as `board[row][col]`, with the origin `(0,0)` at
 * the top-left cell; `row` increases downward and `col` increases rightward.
 * Dimensions are never hardcoded here — ROWS and COLS are read from the
 * canonical board-config.js so a size change is a data edit (Req 11.1, 11.3).
 *
 * The module is PURE: no DOM, no timers, no globals. Writes are non-mutating —
 * setCell returns a NEW board and leaves the caller's board untouched.
 *
 * Error handling follows the null-signal convention shared with gem.js: an
 * out-of-bounds read returns `null` rather than throwing (Req 11.5), and an
 * invalid write (bad coordinates, or a value that is neither `null` nor a valid
 * Gem_Type) is rejected by returning the PRIOR board unchanged (Req 11.5, 12.4).
 */

import { ROWS, COLS, MIN_MATCH, GEM_TYPES } from './config/board-config.js';
import { isValidGemType, createGem, randomGem } from './gem.js';
import { findMatches } from './match.js';

/**
 * The match-3 board: a row-major ROWS×COLS grid of cells. Each cell holds a
 * {@link Gem} or `null` when empty.
 *
 * @typedef {Array<Array<(import('./gem.js').Gem|null)>>} Board
 */

/**
 * A cell address on the Board.
 *
 * @typedef {Object} Cell
 * @property {number} row  Row index, 0 (top) .. ROWS-1 (bottom).
 * @property {number} col  Column index, 0 (left) .. COLS-1 (right).
 */

/**
 * Create a fresh, empty board.
 *
 * Returns a brand-new ROWS×COLS row-major array with every cell set to `null`
 * (Req 11.1, 11.2). Each row is an independent array, so mutating one row never
 * affects another.
 *
 * @returns {Board} A new ROWS×COLS board with all cells `null`.
 */
export function createBoard() {
  const board = new Array(ROWS);
  for (let row = 0; row < ROWS; row += 1) {
    board[row] = new Array(COLS).fill(null);
  }
  return board;
}

/**
 * Report whether `(row, col)` addresses a cell that exists on the board.
 *
 * @param {number} row  Candidate row index.
 * @param {number} col  Candidate column index.
 * @returns {boolean} true iff `0 <= row < ROWS && 0 <= col < COLS` (Req 11.4).
 */
export function isValidCell(row, col) {
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    row < ROWS &&
    col >= 0 &&
    col < COLS
  );
}

/**
 * Read the gem (or `null`) at a cell.
 *
 * For valid coordinates, returns the cell's current contents. For out-of-bounds
 * coordinates, rejects the read by returning `null` (null-signal) and leaves the
 * board unchanged (Req 11.5). Note that a valid empty cell also reads as `null`;
 * callers that must distinguish "out of bounds" from "empty" should guard with
 * {@link isValidCell} first.
 *
 * @param {Board} board  The board to read from.
 * @param {number} row  Row index of the target cell.
 * @param {number} col  Column index of the target cell.
 * @returns {(import('./gem.js').Gem|null)} The gem at the cell, or `null` if the
 *   cell is empty or the coordinates are out of bounds.
 */
export function getCell(board, row, col) {
  if (!isValidCell(row, col)) {
    return null;
  }
  return board[row][col];
}

/**
 * Return a NEW board with one cell set, without mutating the input board.
 *
 * The write is committed only when it is fully valid: the coordinates are in
 * bounds (Req 11.5) AND the value is either `null` (clearing the cell) or a gem
 * whose type is a valid Gem_Type per {@link isValidGemType} (Req 12.4). When
 * valid, a shallow copy of the board is returned with the affected row replaced
 * so the original board and its other rows are shared and untouched. When the
 * coordinates or the gem are invalid, the write is rejected and the PRIOR board
 * is returned unchanged (null-signal / reject convention).
 *
 * @param {Board} board  The board to derive the new board from.
 * @param {number} row  Row index of the target cell.
 * @param {number} col  Column index of the target cell.
 * @param {(import('./gem.js').Gem|null)} gem  The gem to place, or `null` to clear.
 * @returns {Board} A new board with the cell set when valid; otherwise the
 *   original `board` unchanged.
 */
export function setCell(board, row, col, gem) {
  if (!isValidCell(row, col)) {
    return board;
  }
  const isClearing = gem === null;
  const isValidGem =
    gem !== null &&
    typeof gem === 'object' &&
    isValidGemType(gem.type);
  if (!isClearing && !isValidGem) {
    return board;
  }
  const nextBoard = board.slice();
  const nextRow = board[row].slice();
  nextRow[col] = gem;
  nextBoard[row] = nextRow;
  return nextBoard;
}

/**
 * Report whether two cells share an edge (are orthogonally adjacent).
 *
 * Two cells are adjacent iff they lie in the same row with columns differing by
 * exactly 1, or in the same column with rows differing by exactly 1 (Req 15.2).
 * Diagonal pairs and non-adjacent pairs — including two identical cells — are
 * not adjacent and return `false`.
 *
 * This is a pure predicate on cell addresses; it does not read the board.
 *
 * @param {Cell} a  One cell address `{ row, col }`.
 * @param {Cell} b  The other cell address `{ row, col }`.
 * @returns {boolean} true iff `a` and `b` share an edge.
 */
export function isAdjacent(a, b) {
  const sameRowAdjacentCol = a.row === b.row && Math.abs(a.col - b.col) === 1;
  const sameColAdjacentRow = a.col === b.col && Math.abs(a.row - b.row) === 1;
  return sameRowAdjacentCol || sameColAdjacentRow;
}

/**
 * Return a NEW board with the gems at cells `a` and `b` exchanged, without
 * mutating the input board.
 *
 * The caller guarantees the two cells are adjacent (validated by the screen via
 * {@link isAdjacent}); this function does not re-validate adjacency and does not
 * consult match logic — the keep-vs-revert decision is made by the Game Board
 * screen from `hasMatches` on the swapped board, not here (Req 15.1). Following
 * the module's non-mutating convention (see {@link setCell}), a shallow copy of
 * the board is returned with only the affected rows replaced, so the original
 * board and its untouched rows are shared and left intact.
 *
 * @param {Board} board  The board to derive the new board from.
 * @param {Cell} a  One cell address `{ row, col }`.
 * @param {Cell} b  The other cell address `{ row, col }`.
 * @returns {Board} A new board with the gems at `a` and `b` swapped.
 */
export function swapCells(board, a, b) {
  const gemA = board[a.row][a.col];
  const gemB = board[b.row][b.col];
  const nextBoard = board.slice();
  if (a.row === b.row) {
    // Both cells live in the same row: copy that row once and set both cells.
    const nextRow = board[a.row].slice();
    nextRow[a.col] = gemB;
    nextRow[b.col] = gemA;
    nextBoard[a.row] = nextRow;
  } else {
    // Different rows: copy each affected row independently.
    const nextRowA = board[a.row].slice();
    nextRowA[a.col] = gemB;
    nextBoard[a.row] = nextRowA;
    const nextRowB = board[b.row].slice();
    nextRowB[b.col] = gemA;
    nextBoard[b.row] = nextRowB;
  }
  return nextBoard;
}

/**
 * Return a NEW board with every cell in `matchedCells` cleared to `null`,
 * without mutating the input board.
 *
 * Each `{ row, col }` in `matchedCells` names a gem belonging to a detected
 * Match; those cells are emptied (Req 17.1) while every other cell keeps its
 * current contents unchanged (Req 17.2). Following the module's non-mutating
 * convention (see {@link setCell}), only the rows that contain a cleared cell
 * are copied; the original board and its untouched rows are shared and left
 * intact. An empty `matchedCells` list clears nothing and yields an unchanged
 * copy of the board.
 *
 * The caller supplies coordinates that came from match detection, so they are
 * expected to be in bounds; out-of-bounds entries are ignored rather than
 * throwing, consistent with the module's null-signal / reject convention.
 *
 * @param {Board} board  The board to derive the new board from.
 * @param {ReadonlyArray<Cell>} matchedCells  Cell addresses to clear to `null`.
 * @returns {Board} A new board with the matched cells emptied and all other
 *   cells unchanged.
 */
export function removeCells(board, matchedCells) {
  const nextBoard = board.slice();
  for (const { row, col } of matchedCells) {
    if (!isValidCell(row, col)) {
      continue;
    }
    // Copy the row lazily so a row is cloned at most once even when several of
    // its cells are matched, and untouched rows stay shared with the input.
    if (nextBoard[row] === board[row]) {
      nextBoard[row] = board[row].slice();
    }
    nextBoard[row][col] = null;
  }
  return nextBoard;
}

/**
 * The most alternative Gem_Types considered for a single cell before giving up
 * on that cell and triggering a full-board regeneration. With six defined types
 * and at most two excluded per cell (one from the left run, one from the above
 * run), a legal type always exists, so this cap is a safety net that is never
 * expected to be exhausted under normal RNG.
 * @type {number}
 */
const MAX_CELL_REROLLS = GEM_TYPES.length * 4;

/**
 * The most full-board regeneration attempts before the generator gives up. The
 * constraint-aware fill produces a no-match board on the first pass, so this
 * cap is a guard against pathological RNG and is never expected to be reached.
 * @type {number}
 */
const MAX_BOARD_ATTEMPTS = 32;

/**
 * Report whether placing `type` at `(row, col)` would immediately complete a
 * run of MIN_MATCH same-type gems with the already-placed gems directly to its
 * left (same row) or directly above (same column).
 *
 * Only the trailing MIN_MATCH-1 neighbors need to be inspected: a run is
 * completed exactly when the candidate plus that many contiguous same-type
 * predecessors reach MIN_MATCH. Because the board is filled row-major, every
 * left and above neighbor is already placed when this cell is considered.
 *
 * @param {Board} board  The partially filled board.
 * @param {number} row  Row index of the candidate cell.
 * @param {number} col  Column index of the candidate cell.
 * @param {string} type  The candidate Gem_Type.
 * @returns {boolean} true iff placing `type` here would complete a run.
 */
function wouldCompleteRun(board, row, col, type) {
  const runLength = MIN_MATCH - 1;

  // Contiguous same-type gems immediately to the left (same row).
  let left = 0;
  for (let c = col - 1; c >= 0 && left < runLength; c -= 1) {
    const cell = board[row][c];
    if (cell === null || cell.type !== type) {
      break;
    }
    left += 1;
  }
  if (left >= runLength) {
    return true;
  }

  // Contiguous same-type gems immediately above (same column).
  let above = 0;
  for (let r = row - 1; r >= 0 && above < runLength; r -= 1) {
    const cell = board[r][col];
    if (cell === null || cell.type !== type) {
      break;
    }
    above += 1;
  }
  return above >= runLength;
}

/**
 * Attempt to fill a fresh board row-major so that no cell completes a Match.
 *
 * For each cell it repeatedly draws a random valid Gem_Type from the injected
 * RNG and accepts the first that would not immediately complete a run of
 * MIN_MATCH with its already-placed left/above neighbors (see
 * {@link wouldCompleteRun}). The per-cell draw is bounded by
 * {@link MAX_CELL_REROLLS}; if a cell cannot be placed within that bound, the
 * whole attempt is abandoned by returning `null` so the caller can regenerate.
 *
 * @param {() => number} rng  Injectable random source in [0, 1).
 * @returns {(Board|null)} A fully filled candidate board, or `null` if a cell
 *   could not be placed within the per-cell reroll bound.
 */
function fillBoardOnce(rng) {
  const board = createBoard();
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      let placed = null;
      for (let attempt = 0; attempt < MAX_CELL_REROLLS; attempt += 1) {
        const type = GEM_TYPES[Math.floor(rng() * GEM_TYPES.length)];
        if (!wouldCompleteRun(board, row, col, type)) {
          placed = type;
          break;
        }
      }
      if (placed === null) {
        // No legal type found for this cell within the bound; abandon attempt.
        return null;
      }
      board[row][col] = createGem(placed);
    }
  }
  return board;
}

/**
 * Generate a full Stable_Board that contains zero Matches (Req 13.1, 13.2,
 * 13.3).
 *
 * The board is filled cell by cell in row-major order. For each cell a random
 * valid Gem_Type is chosen but any type that would immediately complete a run
 * of MIN_MATCH with the gems already placed to its left (same row) or above
 * (same column) is excluded, so a Match is normally never created while filling
 * (Req 13.4). Termination is guaranteed by two bounded guards: a per-cell
 * reroll cap ({@link MAX_CELL_REROLLS}) and a capped number of full-board
 * regeneration attempts ({@link MAX_BOARD_ATTEMPTS}). With six defined types and
 * at most two excluded per cell a legal type always exists, so the first pass
 * succeeds under normal RNG; the guards only protect against pathological RNG.
 *
 * After a candidate board is built it is validated with {@link findMatches} as a
 * safety net — the exclusion logic already guarantees zero Matches, and a
 * non-empty result forces another regeneration attempt.
 *
 * The function is PURE: it reads only its injected RNG and returns a fresh
 * board. Randomness is injected via `rng` (default `Math.random`) so tests can
 * supply a seeded generator for deterministic results.
 *
 * @param {() => number} [rng=Math.random]  Injectable random source in [0, 1).
 * @returns {Board} A Stable_Board: a ROWS×COLS grid of valid gems with zero
 *   Matches.
 */
export function generateStableBoard(rng = Math.random) {
  for (let attempt = 0; attempt < MAX_BOARD_ATTEMPTS; attempt += 1) {
    const board = fillBoardOnce(rng);
    if (board !== null && findMatches(board).length === 0) {
      return board;
    }
  }
  // Unreachable under the constraint-aware fill for the six defined types; this
  // guards against a pathological RNG that never yields a legal type.
  throw new Error(
    'generateStableBoard: failed to produce a Stable_Board within the attempt bound',
  );
}

/**
 * Return a NEW board with gravity applied to every column, without mutating the
 * input board.
 *
 * Because the board is row-major with the origin `(0,0)` at the top-left and
 * `row` increasing downward, the "lowest available Cells" are the HIGHER row
 * indices at the bottom of the board. For each column independently, the
 * non-null gems fall so they occupy those lowest cells while every remaining
 * empty cell rises to the top of the column (Req 18.1). The relative vertical
 * order of the surviving gems is preserved (Req 18.2), and a column that
 * contains no empty cell is left in its existing positions (Req 18.3). Within a
 * column this neither creates nor destroys gems, so the per-column multiset of
 * gems is preserved.
 *
 * Following the module's non-mutating convention (see {@link setCell}), only the
 * rows whose contents actually change are copied; the original board and its
 * untouched rows are shared and left intact. A board with no empty cell anywhere
 * is returned as an unchanged copy that shares all of its rows.
 *
 * @param {Board} board  The board to derive the new board from.
 * @returns {Board} A new board with each column compacted downward.
 */
export function applyGravity(board) {
  const nextBoard = board.slice();
  for (let col = 0; col < COLS; col += 1) {
    // Collect the surviving gems from bottom to top so their relative vertical
    // order is preserved when they are written back to the lowest cells.
    const survivors = [];
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      const gem = board[row][col];
      if (gem !== null) {
        survivors.push(gem);
      }
    }
    // A full column has nothing to compact; leave it in place (Req 18.3).
    if (survivors.length === ROWS) {
      continue;
    }
    // Rewrite the column bottom-up: survivors fill the lowest cells and the
    // remaining top cells become null. Copy each affected row lazily so an
    // untouched row stays shared with the input.
    let survivorIndex = 0;
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      const nextGem = survivorIndex < survivors.length ? survivors[survivorIndex] : null;
      survivorIndex += 1;
      if (board[row][col] === nextGem) {
        continue;
      }
      if (nextBoard[row] === board[row]) {
        nextBoard[row] = board[row].slice();
      }
      nextBoard[row][col] = nextGem;
    }
  }
  return nextBoard;
}

/**
 * Return a NEW board with every empty Cell filled by a fresh valid Gem, without
 * mutating the input board.
 *
 * After gravity has compacted each column, the only empty Cells are the `null`
 * Cells at the tops of columns; this fills each of them with a freshly generated
 * valid Gem drawn from {@link randomGem}, so once refill completes every Cell of
 * the board holds exactly one Gem of a valid Gem_Type (Req 19.1, 19.2). Cells
 * that already hold a Gem are left untouched. The refill is not constrained
 * against forming Matches — any Matches the new Gems create are resolved by the
 * screen's subsequent cascade step, not here.
 *
 * The function is PURE: it reads only its injected RNG and returns a fresh
 * board. Randomness is injected via `rng` (default `Math.random`) and threaded
 * through to `randomGem` so tests can supply a seeded generator for
 * deterministic results. Following the module's non-mutating convention (see
 * {@link setCell}), only the rows that contain a filled Cell are copied; the
 * original board and its untouched rows are shared and left intact. A board with
 * no empty Cell is returned as an unchanged copy that shares all of its rows.
 *
 * @param {Board} board  The board to derive the new board from.
 * @param {() => number} [rng=Math.random]  Injectable random source in [0, 1).
 * @returns {Board} A new, fully occupied board with every prior empty Cell
 *   filled by a valid gem and all other cells unchanged.
 */
export function refill(board, rng = Math.random) {
  const nextBoard = board.slice();
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (board[row][col] !== null) {
        continue;
      }
      // Copy the row lazily so a row is cloned at most once even when several of
      // its cells are empty, and untouched rows stay shared with the input.
      if (nextBoard[row] === board[row]) {
        nextBoard[row] = board[row].slice();
      }
      nextBoard[row][col] = randomGem(rng);
    }
  }
  return nextBoard;
}

/**
 * Report whether a value is a single valid Gem: a non-null object whose `type`
 * is one of the defined Gem_Types (see {@link isValidGemType}). This is the same
 * validity notion used by {@link setCell} when it accepts a write.
 *
 * @param {*} gem  The candidate cell contents.
 * @returns {boolean} true iff `gem` is a valid Gem.
 */
function isValidGem(gem) {
  return gem !== null && typeof gem === 'object' && isValidGemType(gem.type);
}

/**
 * Report whether the board has the correct shape and only valid gems in its
 * occupied cells, allowing transient empties (Req 21.3, 21.2).
 *
 * This is the intermediate-state consistency check used between removal,
 * Gravity, and Refill: the board must still be exactly ROWS×COLS (8×8), each row
 * must be an array of exactly COLS cells, and every OCCUPIED cell must hold a
 * valid Gem_Type. Empty cells (`null`) are permitted because they are the
 * temporary holes that removal creates and Refill later fills (Req 21.2). Any
 * value in a cell that is neither `null` nor a valid Gem — or any dimension that
 * is not 8×8 — makes the board invalid, so an operation that would produce such
 * a state can be rejected and the prior Stable_Board retained (Req 21.5).
 *
 * The check is PURE: it only reads the board and returns a boolean.
 *
 * @param {Board} board  The board to validate.
 * @returns {boolean} true iff dimensions are ROWS×COLS and every occupied cell
 *   holds a valid Gem_Type; `null` cells are allowed.
 */
export function isDimensionAndTypeValid(board) {
  if (!Array.isArray(board) || board.length !== ROWS) {
    return false;
  }
  for (let row = 0; row < ROWS; row += 1) {
    const cells = board[row];
    if (!Array.isArray(cells) || cells.length !== COLS) {
      return false;
    }
    for (let col = 0; col < COLS; col += 1) {
      const cell = cells[col];
      // An empty cell is a permitted transient hole; only occupied cells must
      // carry a valid Gem_Type.
      if (cell !== null && !isValidGem(cell)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Report whether the board is a Stable_Board: ready for the Player to make a new
 * move (Req 21.1).
 *
 * A Stable_Board is the fully settled, ready-to-play state: the board is exactly
 * ROWS×COLS (8×8), EVERY one of the 64 cells holds exactly one valid Gem (no
 * empty cells and no invalid values), AND {@link findMatches} reports no Match.
 * This is strictly stronger than {@link isDimensionAndTypeValid}: the latter
 * tolerates transient empty cells during removal/Gravity/Refill, whereas a
 * Stable_Board tolerates none. The screen presents the board as ready-to-play
 * only when this predicate holds, so any operation that would leave an empty
 * cell, an invalid gem, or a remaining Match is rejected and the prior
 * Stable_Board is retained (Req 21.5, 21.6).
 *
 * The check is PURE: it only reads the board (via {@link findMatches}) and
 * returns a boolean.
 *
 * @param {Board} board  The board to validate.
 * @returns {boolean} true iff all 64 cells hold exactly one valid gem AND the
 *   board contains zero Matches.
 */
export function isStableBoard(board) {
  if (!isDimensionAndTypeValid(board)) {
    return false;
  }
  // isDimensionAndTypeValid has confirmed the 8×8 shape and that no cell holds
  // an invalid value; the only remaining way a cell can fail is by being empty.
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (board[row][col] === null) {
        return false;
      }
    }
  }
  return findMatches(board).length === 0;
}
