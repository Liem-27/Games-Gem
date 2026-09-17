/**
 * Match Detection — the single owner of finding Matches on the Board.
 *
 * This module's single responsibility is the match-detection concern: scanning
 * a board for contiguous runs of same-type gems and reporting the Cells that
 * belong to any Match. It does nothing else — it neither removes gems, applies
 * gravity, refills, nor touches the DOM.
 *
 * The module is PURE: no DOM, no timers, no globals. It never mutates the input
 * board; it only reads cells and returns a fresh, deterministic result.
 *
 * A Match is a run of MIN_MATCH or more same-type gems occupying contiguous
 * cells within a single row (horizontal) or a single column (vertical). The
 * minimum run length MIN_MATCH and the board dimensions ROWS/COLS are read from
 * the canonical board-config.js rather than hardcoded here, so a size or
 * match-length change is a data edit in that file (Req 11.3, 12.3).
 *
 * Overlap handling: horizontal and vertical runs are collected into a single
 * set of matched cells keyed by position, so an L- or T-shaped overlap where a
 * horizontal and a vertical run share cells contributes every cell of both runs
 * exactly once with no duplicates (Req 16.4).
 *
 * A `null` cell is empty: it never participates in a Match and always breaks a
 * run — a same-type run cannot span across an empty cell (Req 16.1, 16.2).
 *
 * Complexity is O(ROWS × COLS): each cell is visited a constant number of times
 * across the row and column scans.
 */

import { ROWS, COLS, MIN_MATCH } from './config/board-config.js';

/**
 * Find every Cell that belongs to any Match on the board.
 *
 * Scans each row left-to-right and each column top-to-bottom for contiguous
 * runs of MIN_MATCH or more gems of the same Gem_Type. Every cell in a
 * qualifying run is recorded; overlapping horizontal and vertical runs are
 * unioned so each matched cell appears exactly once (Req 16.1, 16.2, 16.3,
 * 16.4). Empty (`null`) cells never match and break any run.
 *
 * The result is deterministic: an array of `{ row, col }` objects sorted by
 * `row` ascending, then `col` ascending, with no duplicates. When the board
 * contains no qualifying run, an empty array is returned (Req 16.5).
 *
 * @param {import('./board.js').Board} board  The board to scan (not mutated).
 * @returns {Array<import('./board.js').Cell>} Sorted, de-duplicated matched
 *   cells; empty when there is no Match.
 */
export function findMatches(board) {
  // Dedup set keyed by a stable position key so overlapping runs union cleanly.
  const matched = new Set();

  const markRun = (start, length, toKey) => {
    for (let offset = 0; offset < length; offset += 1) {
      matched.add(toKey(start + offset));
    }
  };

  // Horizontal scan: within each row, collect contiguous same-type runs.
  for (let row = 0; row < ROWS; row += 1) {
    let runStart = 0;
    let runType = null;
    for (let col = 0; col <= COLS; col += 1) {
      const cell = col < COLS ? board[row][col] : null;
      const type = cell === null ? null : cell.type;
      // Continue the run only for a non-empty cell whose type matches the run.
      if (type !== null && type === runType) {
        continue;
      }
      const runLength = col - runStart;
      if (runType !== null && runLength >= MIN_MATCH) {
        markRun(runStart, runLength, (c) => row * COLS + c);
      }
      runStart = col;
      runType = type;
    }
  }

  // Vertical scan: within each column, collect contiguous same-type runs.
  for (let col = 0; col < COLS; col += 1) {
    let runStart = 0;
    let runType = null;
    for (let row = 0; row <= ROWS; row += 1) {
      const cell = row < ROWS ? board[row][col] : null;
      const type = cell === null ? null : cell.type;
      if (type !== null && type === runType) {
        continue;
      }
      const runLength = row - runStart;
      if (runType !== null && runLength >= MIN_MATCH) {
        markRun(runStart, runLength, (r) => r * COLS + col);
      }
      runStart = row;
      runType = type;
    }
  }

  // Decode the position keys and return a deterministic, sorted list.
  const cells = new Array(matched.size);
  let index = 0;
  for (const key of matched) {
    cells[index] = { row: Math.floor(key / COLS), col: key % COLS };
    index += 1;
  }
  cells.sort((a, b) => (a.row - b.row) || (a.col - b.col));
  return cells;
}

/**
 * Report whether the board contains at least one Match.
 *
 * @param {import('./board.js').Board} board  The board to test (not mutated).
 * @returns {boolean} true iff {@link findMatches} returns a non-empty list
 *   (Req 16.3, 16.5).
 */
export function hasMatches(board) {
  return findMatches(board).length > 0;
}
