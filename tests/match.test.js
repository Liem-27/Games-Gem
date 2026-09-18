import { describe, it, expect } from 'vitest';
import { findMatches, hasMatches, classifyMatches } from '../js/match.js';
import { createBoard, setCell } from '../js/board.js';
import { createGem } from '../js/gem.js';
import { MIN_MATCH } from '../js/config/board-config.js';

/**
 * Unit tests for Match Detection (js/match.js).
 *
 * These cover the match-detection concern owned by the module:
 *   1. findMatches — horizontal runs of >= MIN_MATCH (3) same-type gems are
 *      detected (Req 16.1).
 *   2. findMatches — vertical runs of >= MIN_MATCH are detected (Req 16.2).
 *   3. findMatches — a run of exactly 2 is NOT a match, and a run broken by an
 *      empty (null) cell does not span the gap (Req 16.1, 16.2).
 *   4. findMatches — an L/T overlap of a horizontal and vertical run unions
 *      every cell of both runs exactly once, no duplicates (Req 16.3, 16.4).
 *   5. findMatches — a board with no qualifying run reports zero matches, and
 *      hasMatches is false (Req 16.5).
 *   6. findMatches — output is deterministic, sorted by row then col, with no
 *      duplicates.
 *
 * Fixtures are built by composing the non-mutating setCell(createBoard(), ...)
 * with createGem(type), never touching production modules.
 */

/**
 * Place gems of a single type across a contiguous run of cells.
 *
 * @param {import('../js/board.js').Board} board  Starting board (not mutated).
 * @param {Array<[number, number]>} cells  [row, col] pairs to fill.
 * @param {string} type  The Gem_Type to place at each cell.
 * @returns {import('../js/board.js').Board} A new board with the cells set.
 */
function placeRun(board, cells, type) {
  return cells.reduce((acc, [row, col]) => setCell(acc, row, col, createGem(type)), board);
}

describe('findMatches — horizontal detection', () => {
  // Validates: Requirements 16.1
  it('detects a horizontal run of exactly MIN_MATCH same-type gems', () => {
    const board = placeRun(createBoard(), [[2, 1], [2, 2], [2, 3]], 'Ruby');

    expect(findMatches(board)).toEqual([
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
    ]);
    expect(hasMatches(board)).toBe(true);
  });

  // Validates: Requirements 16.1
  it('detects a horizontal run longer than MIN_MATCH (all cells included)', () => {
    const board = placeRun(
      createBoard(),
      [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
      'Sapphire',
    );

    expect(findMatches(board)).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 0, col: 4 },
    ]);
  });

  // Validates: Requirements 16.1
  it('does NOT match a horizontal run of only 2 same-type gems', () => {
    const board = placeRun(createBoard(), [[3, 3], [3, 4]], 'Emerald');

    expect(findMatches(board)).toEqual([]);
    expect(hasMatches(board)).toBe(false);
  });

  // Validates: Requirements 16.1
  it('does NOT let a run span across an empty (null) cell', () => {
    // Ruby at cols 1,2 then gap at col 3 then Ruby at cols 4,5 — no run reaches 3.
    const board = placeRun(createBoard(), [[5, 1], [5, 2], [5, 4], [5, 5]], 'Ruby');

    expect(findMatches(board)).toEqual([]);
  });

  // Validates: Requirements 16.1
  it('does NOT match a run broken by a different gem type', () => {
    // Ruby, Ruby, Sapphire, Ruby across a row — longest same-type run is 2.
    let board = placeRun(createBoard(), [[4, 0], [4, 1]], 'Ruby');
    board = setCell(board, 4, 2, createGem('Sapphire'));
    board = setCell(board, 4, 3, createGem('Ruby'));

    expect(findMatches(board)).toEqual([]);
  });
});

describe('findMatches — vertical detection', () => {
  // Validates: Requirements 16.2
  it('detects a vertical run of exactly MIN_MATCH same-type gems', () => {
    const board = placeRun(createBoard(), [[1, 6], [2, 6], [3, 6]], 'Topaz');

    expect(findMatches(board)).toEqual([
      { row: 1, col: 6 },
      { row: 2, col: 6 },
      { row: 3, col: 6 },
    ]);
    expect(hasMatches(board)).toBe(true);
  });

  // Validates: Requirements 16.2
  it('detects a vertical run longer than MIN_MATCH (all cells included)', () => {
    const board = placeRun(
      createBoard(),
      [[0, 2], [1, 2], [2, 2], [3, 2]],
      'Amethyst',
    );

    expect(findMatches(board)).toEqual([
      { row: 0, col: 2 },
      { row: 1, col: 2 },
      { row: 2, col: 2 },
      { row: 3, col: 2 },
    ]);
  });

  // Validates: Requirements 16.2
  it('does NOT match a vertical run of only 2 same-type gems', () => {
    const board = placeRun(createBoard(), [[6, 0], [7, 0]], 'Amber');

    expect(findMatches(board)).toEqual([]);
    expect(hasMatches(board)).toBe(false);
  });

  // Validates: Requirements 16.2
  it('does NOT let a vertical run span across an empty (null) cell', () => {
    // Topaz at rows 0,1 then gap at row 2 then Topaz at rows 3,4 — no run of 3.
    const board = placeRun(createBoard(), [[0, 7], [1, 7], [3, 7], [4, 7]], 'Topaz');

    expect(findMatches(board)).toEqual([]);
  });
});

describe('findMatches — overlapping matches (L/T shapes)', () => {
  // Validates: Requirements 16.3, 16.4
  it('unions an L-shaped overlap so the shared corner appears exactly once', () => {
    // Horizontal Ruby run at row 2, cols 2..4, plus a vertical Ruby run at
    // col 2, rows 2..4. They share the corner (2, 2).
    const board = placeRun(
      createBoard(),
      [
        [2, 2], [2, 3], [2, 4], // horizontal
        [3, 2], [4, 2], // vertical continuation (with [2,2] above)
      ],
      'Ruby',
    );

    const result = findMatches(board);

    expect(result).toEqual([
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 3, col: 2 },
      { row: 4, col: 2 },
    ]);

    // The shared corner is present exactly once (no duplicates).
    const corners = result.filter((c) => c.row === 2 && c.col === 2);
    expect(corners).toHaveLength(1);
  });

  // Validates: Requirements 16.3, 16.4
  it('unions a T-shaped overlap so the intersection appears exactly once', () => {
    // Horizontal Emerald run at row 3, cols 1..3, plus a vertical Emerald run
    // at col 2, rows 2..4. They intersect at (3, 2).
    const board = placeRun(
      createBoard(),
      [
        [3, 1], [3, 2], [3, 3], // horizontal
        [2, 2], [4, 2], // vertical arms (with [3,2] in the middle)
      ],
      'Emerald',
    );

    const result = findMatches(board);

    expect(result).toEqual([
      { row: 2, col: 2 },
      { row: 3, col: 1 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
      { row: 4, col: 2 },
    ]);

    // No duplicate cells at all.
    const keys = result.map((c) => `${c.row},${c.col}`);
    expect(new Set(keys).size).toBe(keys.length);
    // The intersection cell appears exactly once.
    expect(keys.filter((k) => k === '3,2')).toHaveLength(1);
  });
});

describe('findMatches — empty / no-match case', () => {
  // Validates: Requirements 16.5
  it('reports zero matches on a completely empty board', () => {
    const board = createBoard();

    expect(findMatches(board)).toEqual([]);
    expect(hasMatches(board)).toBe(false);
  });

  // Validates: Requirements 16.5
  it('reports zero matches on a board with gems but no qualifying run', () => {
    // Scattered gems, deliberately arranged so no row or column has 3 in a line.
    let board = createBoard();
    board = setCell(board, 0, 0, createGem('Ruby'));
    board = setCell(board, 0, 1, createGem('Sapphire'));
    board = setCell(board, 1, 0, createGem('Emerald'));
    board = setCell(board, 1, 1, createGem('Ruby'));
    board = setCell(board, 2, 2, createGem('Ruby'));

    expect(findMatches(board)).toEqual([]);
    expect(hasMatches(board)).toBe(false);
  });
});

describe('findMatches — deterministic sorted output', () => {
  // Validates: Requirements 16.1, 16.2, 16.4
  it('returns cells sorted by row then col with no duplicates', () => {
    // Two separate runs placed out of natural scan order to exercise sorting:
    // a vertical run at col 5 (rows 4..6) and a horizontal run at row 0 (cols 0..2).
    let board = placeRun(createBoard(), [[4, 5], [5, 5], [6, 5]], 'Amber');
    board = placeRun(board, [[0, 0], [0, 1], [0, 2]], 'Sapphire');

    const result = findMatches(board);

    // Sorted by row ascending, then col ascending.
    const sorted = [...result].sort((a, b) => (a.row - b.row) || (a.col - b.col));
    expect(result).toEqual(sorted);

    expect(result).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 4, col: 5 },
      { row: 5, col: 5 },
      { row: 6, col: 5 },
    ]);

    // No duplicates.
    const keys = result.map((c) => `${c.row},${c.col}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  // Validates: Requirements 16.1, 16.2
  it('produces identical output across repeated calls (deterministic)', () => {
    const board = placeRun(
      createBoard(),
      [[7, 2], [7, 3], [7, 4], [1, 1], [2, 1], [3, 1]],
      'Ruby',
    );

    const first = findMatches(board);
    const second = findMatches(board);

    expect(first).toEqual(second);
  });

  it('exercises MIN_MATCH as the configured threshold, not a hardcoded 3', () => {
    // Guard: a run one short of MIN_MATCH must not match.
    const shortCells = Array.from({ length: MIN_MATCH - 1 }, (_, i) => [0, i]);
    const shortBoard = placeRun(createBoard(), shortCells, 'Ruby');
    expect(findMatches(shortBoard)).toEqual([]);

    // A run of exactly MIN_MATCH must match.
    const exactCells = Array.from({ length: MIN_MATCH }, (_, i) => [0, i]);
    const exactBoard = placeRun(createBoard(), exactCells, 'Ruby');
    expect(findMatches(exactBoard)).toHaveLength(MIN_MATCH);
  });
});

/**
 * Unit tests for Match Classification (classifyMatches in js/match.js).
 *
 * These cover the classification concern layered on top of match detection:
 *   1. Shape classification — a plain 3-run is `three`; a straight 4-run is
 *      `line_h4`/`line_v4` by orientation; a straight 5+ run is `rainbow5`
 *      (Req 33.1).
 *   2. Overlap analysis — a crossing horizontal/vertical pair is one combined
 *      structure with a single pivot, classified `bomb_T` (interior pivot) or
 *      `bomb_L` (pivot is an endpoint of BOTH runs) (Req 33.2, 33.3).
 *   3. Precedence — exactly one `kind` per structure, ordered
 *      T/L bomb > rainbow5 > line4 > three (Req 33.2).
 *   4. Determinism — repeated calls on the same board return identical results.
 *   5. `allCells` agreement — `classifyMatches(board).allCells` deep-equals
 *      `findMatches(board)` for the same board (Req 33.1).
 *
 * Fixtures reuse the same non-mutating placeRun/setCell/createGem helpers as the
 * findMatches tests above.
 */
describe('classifyMatches — shape classification', () => {
  // Validates: Requirements 33.1
  it('classifies a plain 3-run as `three` with a null pivot', () => {
    const board = placeRun(createBoard(), [[2, 1], [2, 2], [2, 3]], 'Ruby');

    const { structures } = classifyMatches(board);

    expect(structures).toHaveLength(1);
    expect(structures[0].kind).toBe('three');
    expect(structures[0].pivot).toBeNull();
    expect(structures[0].baseType).toBe('Ruby');
    expect(structures[0].cells).toEqual([
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
    ]);
  });

  // Validates: Requirements 33.1
  it('classifies a horizontal run of exactly 4 as `line_h4`', () => {
    const board = placeRun(createBoard(), [[0, 0], [0, 1], [0, 2], [0, 3]], 'Sapphire');

    const { structures } = classifyMatches(board);

    expect(structures).toHaveLength(1);
    expect(structures[0].kind).toBe('line_h4');
    expect(structures[0].pivot).toBeNull();
    expect(structures[0].cells).toHaveLength(4);
  });

  // Validates: Requirements 33.1
  it('classifies a vertical run of exactly 4 as `line_v4`', () => {
    const board = placeRun(createBoard(), [[1, 5], [2, 5], [3, 5], [4, 5]], 'Emerald');

    const { structures } = classifyMatches(board);

    expect(structures).toHaveLength(1);
    expect(structures[0].kind).toBe('line_v4');
    expect(structures[0].pivot).toBeNull();
    expect(structures[0].cells).toHaveLength(4);
  });

  // Validates: Requirements 33.1
  it('classifies a straight run of 5 or more as `rainbow5`', () => {
    const board = placeRun(
      createBoard(),
      [[6, 0], [6, 1], [6, 2], [6, 3], [6, 4]],
      'Topaz',
    );

    const { structures } = classifyMatches(board);

    expect(structures).toHaveLength(1);
    expect(structures[0].kind).toBe('rainbow5');
    expect(structures[0].pivot).toBeNull();
    expect(structures[0].cells).toHaveLength(5);
  });
});

describe('classifyMatches — crossing (bomb) structures', () => {
  // Validates: Requirements 33.2, 33.3
  it('classifies a T intersection (interior pivot) as `bomb_T` with the crossing pivot', () => {
    // Horizontal run at row 3, cols 1..3 (pivot interior); vertical run at
    // col 2, rows 2..4 (pivot interior). They cross at (3, 2).
    const board = placeRun(
      createBoard(),
      [
        [3, 1], [3, 2], [3, 3], // horizontal
        [2, 2], [4, 2], // vertical arms above/below the shared (3,2)
      ],
      'Amethyst',
    );

    const { structures } = classifyMatches(board);

    expect(structures).toHaveLength(1);
    expect(structures[0].kind).toBe('bomb_T');
    expect(structures[0].pivot).toEqual({ row: 3, col: 2 });
    expect(structures[0].baseType).toBe('Amethyst');
    // Every cell of both runs, deduped and in reading order.
    expect(structures[0].cells).toEqual([
      { row: 2, col: 2 },
      { row: 3, col: 1 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
      { row: 4, col: 2 },
    ]);
  });

  // Validates: Requirements 33.2, 33.3
  it('classifies an L intersection (pivot is an endpoint of BOTH runs) as `bomb_L`', () => {
    // Horizontal run at row 2, cols 2..4 (pivot 2,2 is the left endpoint);
    // vertical run at col 2, rows 2..4 (pivot 2,2 is the top endpoint).
    const board = placeRun(
      createBoard(),
      [
        [2, 2], [2, 3], [2, 4], // horizontal
        [3, 2], [4, 2], // vertical continuation below the shared corner (2,2)
      ],
      'Amber',
    );

    const { structures } = classifyMatches(board);

    expect(structures).toHaveLength(1);
    expect(structures[0].kind).toBe('bomb_L');
    expect(structures[0].pivot).toEqual({ row: 2, col: 2 });
    expect(structures[0].cells).toEqual([
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 3, col: 2 },
      { row: 4, col: 2 },
    ]);
  });

  // Validates: Requirements 33.2
  it('analyzes overlapping H/V runs as ONE combined structure, not two', () => {
    // A crossing pair must collapse into a single structure with one pivot.
    const board = placeRun(
      createBoard(),
      [
        [3, 1], [3, 2], [3, 3], // horizontal
        [2, 2], [4, 2], // vertical arms crossing at (3,2)
      ],
      'Ruby',
    );

    const { structures } = classifyMatches(board);

    // Exactly one structure spanning every cell of both runs.
    expect(structures).toHaveLength(1);
    expect(structures[0].cells).toHaveLength(5);
    expect(structures[0].pivot).toEqual({ row: 3, col: 2 });
  });
});

describe('classifyMatches — precedence, determinism, and allCells agreement', () => {
  // Validates: Requirements 33.2
  it('assigns exactly one `kind` per structure by precedence (T/L > rainbow5 > line4 > three)', () => {
    // A crossing structure (bomb) and, separately, a straight 5-run (rainbow5).
    let board = placeRun(
      createBoard(),
      [[3, 1], [3, 2], [3, 3], [2, 2], [4, 2]], // T crossing → bomb_T
      'Emerald',
    );
    board = placeRun(
      board,
      [[7, 0], [7, 1], [7, 2], [7, 3], [7, 4]], // straight 5 → rainbow5
      'Sapphire',
    );

    const { structures } = classifyMatches(board);
    const validKinds = ['three', 'line_h4', 'line_v4', 'rainbow5', 'bomb_T', 'bomb_L'];

    expect(structures).toHaveLength(2);
    structures.forEach((structure) => {
      // Exactly one kind, drawn from the closed set.
      expect(validKinds).toContain(structure.kind);
    });

    // The crossing beats a straight-line reading of the horizontal 3-run.
    const kinds = structures.map((s) => s.kind).sort();
    expect(kinds).toEqual(['bomb_T', 'rainbow5']);
  });

  // Validates: Requirements 33.1
  it('never mis-classifies a plain 3-run as a bomb/line/rainbow', () => {
    const board = placeRun(createBoard(), [[4, 4], [4, 5], [4, 6]], 'Topaz');

    const { structures } = classifyMatches(board);

    expect(structures).toHaveLength(1);
    expect(structures[0].kind).toBe('three');
    expect(structures[0].kind).not.toBe('bomb_T');
    expect(structures[0].kind).not.toBe('bomb_L');
    expect(structures[0].kind).not.toBe('line_h4');
    expect(structures[0].kind).not.toBe('line_v4');
    expect(structures[0].kind).not.toBe('rainbow5');
  });

  // Validates: Requirements 33.1, 33.2, 33.3
  it('produces identical results across repeated calls (deterministic)', () => {
    let board = placeRun(
      createBoard(),
      [[3, 1], [3, 2], [3, 3], [2, 2], [4, 2]], // bomb_T
      'Ruby',
    );
    board = placeRun(board, [[0, 5], [0, 6], [0, 7]], 'Amber'); // three

    const first = classifyMatches(board);
    const second = classifyMatches(board);

    expect(first).toEqual(second);
  });

  // Validates: Requirements 33.1
  it('agrees with findMatches: allCells deep-equals findMatches for the same board', () => {
    let board = placeRun(
      createBoard(),
      [[3, 1], [3, 2], [3, 3], [2, 2], [4, 2]], // crossing structure
      'Emerald',
    );
    board = placeRun(board, [[6, 0], [6, 1], [6, 2], [6, 3], [6, 4]], 'Sapphire'); // rainbow5
    board = placeRun(board, [[0, 6], [1, 6], [2, 6]], 'Amber'); // vertical three

    const { allCells } = classifyMatches(board);

    expect(allCells).toEqual(findMatches(board));
  });

  // Validates: Requirements 33.1
  it('produces zero structures and an empty allCells when there is no run', () => {
    const board = createBoard();

    const { structures, allCells } = classifyMatches(board);

    expect(structures).toEqual([]);
    expect(allCells).toEqual([]);
    // Agreement holds in the empty case too.
    expect(allCells).toEqual(findMatches(board));
  });
});
