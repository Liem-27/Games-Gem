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

/**
 * A single contiguous run of same-type gems in one orientation.
 *
 * @typedef {Object} Run
 * @property {'h'|'v'} orientation  'h' for a horizontal (single-row) run,
 *   'v' for a vertical (single-column) run.
 * @property {string} type  The shared Base_Gem_Type of every cell in the run.
 * @property {number} length  The number of cells in the run (>= MIN_MATCH).
 * @property {Array<import('./board.js').Cell>} cells  The run's cells in reading
 *   order (a horizontal run is left-to-right; a vertical run is top-to-bottom).
 */

/**
 * A classified group of matched cells sharing a single Base_Gem_Type.
 *
 * A structure is either a single independent straight run or the union of a
 * horizontal and vertical run that cross at a shared cell.
 *
 * @typedef {Object} MatchStructure
 * @property {'three'|'line_h4'|'line_v4'|'rainbow5'|'bomb_T'|'bomb_L'} kind
 *   The single classified shape of the structure, decided by precedence.
 * @property {Array<import('./board.js').Cell>} cells  Every cell belonging to
 *   the structure, de-duplicated and in reading order (row asc, then col asc).
 * @property {(import('./board.js').Cell|null)} pivot  The crossing cell for a
 *   T/L intersection (`bomb_T`/`bomb_L`), else `null`.
 * @property {string} baseType  The shared Base_Gem_Type of the structure.
 */

/**
 * The result of classifying every Match on a board.
 *
 * @typedef {Object} ClassifyResult
 * @property {Array<MatchStructure>} structures  The classified structures, in
 *   reading order of their first (smallest `(row, col)`) cell.
 * @property {Array<import('./board.js').Cell>} allCells  The union of every
 *   matched cell, identical to {@link findMatches} for the same board.
 */

/** Stable position key so cells can be compared/deduped by value. */
const cellKey = (row, col) => row * COLS + col;

/** Sort comparator for cells in reading order (row asc, then col asc). */
const byReadingOrder = (a, b) => (a.row - b.row) || (a.col - b.col);

/**
 * Collect every contiguous same-type run of length >= MIN_MATCH on the board.
 *
 * Reuses the same scan strategy as {@link findMatches} — a sentinel pass over
 * each row and each column that closes a run at the first type change or empty
 * cell — but retains each run's orientation, length, and ordered cells rather
 * than only unioning their cells. Empty (`null`) cells never participate and
 * always break a run (Req 16.1, 16.2).
 *
 * @param {import('./board.js').Board} board  The board to scan (not mutated).
 * @returns {Array<Run>} All qualifying runs; empty when there is no Match.
 */
function collectRuns(board) {
  const runs = [];

  // Horizontal runs: within each row, close a run at the first type change.
  for (let row = 0; row < ROWS; row += 1) {
    let runStart = 0;
    let runType = null;
    for (let col = 0; col <= COLS; col += 1) {
      const cell = col < COLS ? board[row][col] : null;
      const type = cell === null ? null : cell.type;
      if (type !== null && type === runType) {
        continue;
      }
      const runLength = col - runStart;
      if (runType !== null && runLength >= MIN_MATCH) {
        const cells = [];
        for (let c = runStart; c < col; c += 1) {
          cells.push({ row, col: c });
        }
        runs.push({ orientation: 'h', type: runType, length: runLength, cells });
      }
      runStart = col;
      runType = type;
    }
  }

  // Vertical runs: within each column, close a run at the first type change.
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
        const cells = [];
        for (let r = runStart; r < row; r += 1) {
          cells.push({ row: r, col });
        }
        runs.push({ orientation: 'v', type: runType, length: runLength, cells });
      }
      runStart = row;
      runType = type;
    }
  }

  return runs;
}

/**
 * Group runs that share any cell into a single crossing structure; runs that
 * share no cell remain independent. A weighted union-find over run indices,
 * keyed by cell position, performs the grouping in near-linear time.
 *
 * @param {Array<Run>} runs  The runs to group.
 * @returns {Array<Array<Run>>} Groups of runs; each group is one structure.
 */
function groupRuns(runs) {
  const parent = runs.map((_, i) => i);
  const find = (x) => {
    let root = x;
    while (parent[root] !== root) {
      root = parent[root];
    }
    // Path compression for repeated lookups.
    let node = x;
    while (parent[node] !== root) {
      const next = parent[node];
      parent[node] = root;
      node = next;
    }
    return root;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) {
      parent[rb] = ra;
    }
  };

  // Map each occupied cell to the first run that claimed it; union on collision.
  const owner = new Map();
  runs.forEach((run, index) => {
    run.cells.forEach((cell) => {
      const key = cellKey(cell.row, cell.col);
      if (owner.has(key)) {
        union(owner.get(key), index);
      } else {
        owner.set(key, index);
      }
    });
  });

  const groups = new Map();
  runs.forEach((run, index) => {
    const root = find(index);
    if (!groups.has(root)) {
      groups.set(root, []);
    }
    groups.get(root).push(run);
  });

  return Array.from(groups.values());
}

/**
 * Report whether a cell is an endpoint (first or last) of a run.
 *
 * @param {Run} run  The run to test against.
 * @param {import('./board.js').Cell} cell  The candidate cell.
 * @returns {boolean} true iff `cell` is the run's first or last cell.
 */
function isEndpoint(run, cell) {
  const first = run.cells[0];
  const last = run.cells[run.cells.length - 1];
  return (
    (cell.row === first.row && cell.col === first.col) ||
    (cell.row === last.row && cell.col === last.col)
  );
}

/**
 * Classify a single group of runs into exactly one {@link MatchStructure}.
 *
 * Precedence (Req 33.2), highest first:
 *   1. A T/L crossing (shared cell between a horizontal and a vertical run)
 *      yields a `bomb_T`/`bomb_L` (Req 33.3). `bomb_L` when the pivot is an
 *      endpoint of BOTH runs; `bomb_T` otherwise (pivot interior to at least
 *      one run).
 *   2. A straight run of length >= 5 → `rainbow5`.
 *   3. A straight run of length exactly 4 → `line_h4`/`line_v4` by orientation.
 *   4. Otherwise (length 3) → `three`.
 *
 * @param {Array<Run>} group  One structure's runs (shared base type).
 * @returns {MatchStructure} The classified structure with deduped cells.
 */
function classifyGroup(group) {
  const baseType = group[0].type;

  // Union all of the group's cells once, in reading order, for `cells`.
  const seen = new Set();
  const cells = [];
  group.forEach((run) => {
    run.cells.forEach((cell) => {
      const key = cellKey(cell.row, cell.col);
      if (!seen.has(key)) {
        seen.add(key);
        cells.push({ row: cell.row, col: cell.col });
      }
    });
  });
  cells.sort(byReadingOrder);

  // Look for a crossing: a horizontal run and a vertical run sharing a cell.
  const horizontals = group.filter((run) => run.orientation === 'h');
  const verticals = group.filter((run) => run.orientation === 'v');
  for (const h of horizontals) {
    const hKeys = new Set(h.cells.map((c) => cellKey(c.row, c.col)));
    for (const v of verticals) {
      const shared = v.cells.find((c) => hKeys.has(cellKey(c.row, c.col)));
      if (shared) {
        const pivot = { row: shared.row, col: shared.col };
        // L-shape iff the pivot is an endpoint of BOTH runs; else T-shape.
        const kind = isEndpoint(h, pivot) && isEndpoint(v, pivot) ? 'bomb_L' : 'bomb_T';
        return { kind, cells, pivot, baseType };
      }
    }
  }

  // No crossing: classify the single straight run by length and orientation.
  const run = group[0];
  let kind;
  if (run.length >= 5) {
    kind = 'rainbow5';
  } else if (run.length === 4) {
    kind = run.orientation === 'h' ? 'line_h4' : 'line_v4';
  } else {
    kind = 'three';
  }
  return { kind, cells, pivot: null, baseType };
}

/**
 * Classify every Match on the board into distinct, deterministically shaped
 * structures without altering {@link findMatches}.
 *
 * Collects horizontal and vertical runs (length >= MIN_MATCH), unions runs that
 * share any cell into crossing structures, and assigns exactly one `kind` per
 * structure by the precedence T/L bomb > rainbow5 > line4 > three (Req 33.1,
 * 33.2, 33.3). Structures — and the cells within each — are emitted in reading
 * order (row asc, then col asc), so repeated calls on the same board return
 * identical results.
 *
 * The returned `allCells` is the sorted, de-duplicated union of every matched
 * cell and is guaranteed to equal {@link findMatches} for the same board, so
 * the two functions never disagree about which cells are matched.
 *
 * The function is PURE: it never mutates the input board and reads MIN_MATCH,
 * ROWS, and COLS from board-config.js.
 *
 * @param {import('./board.js').Board} board  The board to classify (not mutated).
 * @returns {ClassifyResult} The classified structures and their unioned cells.
 */
export function classifyMatches(board) {
  const runs = collectRuns(board);
  const groups = groupRuns(runs);

  const structures = groups.map(classifyGroup);
  // Emit structures in reading order of their first (smallest) cell.
  structures.sort((a, b) => byReadingOrder(a.cells[0], b.cells[0]));

  // `allCells` is the sorted, de-duplicated union across all structures.
  const seen = new Set();
  const allCells = [];
  structures.forEach((structure) => {
    structure.cells.forEach((cell) => {
      const key = cellKey(cell.row, cell.col);
      if (!seen.has(key)) {
        seen.add(key);
        allCells.push({ row: cell.row, col: cell.col });
      }
    });
  });
  allCells.sort(byReadingOrder);

  return { structures, allCells };
}
