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
import { isValidGemType, createGem } from './gem.js';
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
