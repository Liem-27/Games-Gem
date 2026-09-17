import { describe, it, expect } from 'vitest';
import {
  createBoard,
  isValidCell,
  getCell,
  setCell,
  generateStableBoard,
  isAdjacent,
  swapCells,
  removeCells,
  applyGravity,
  refill,
  isDimensionAndTypeValid,
  isStableBoard,
} from '../js/board.js';
import { createGem } from '../js/gem.js';
import { findMatches } from '../js/match.js';
import { ROWS, COLS, GEM_TYPES } from '../js/config/board-config.js';

/**
 * A small deterministic RNG (mulberry32) used to make generateStableBoard tests
 * reproducible. Given the same seed it always yields the same [0, 1) sequence,
 * standing in for Math.random so a generated board is fully deterministic.
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
 * Unit tests for the Board Model (js/board.js).
 *
 * These cover the board-structure and cell-access concerns owned by the module:
 *   1. createBoard — yields exactly ROWS×COLS (8×8) with all cells null (Req 11.1).
 *   2. isValidCell — accepts 0..7 in both dims, rejects out-of-range and
 *      non-integers (Req 11.4).
 *   3. getCell — reads valid cells; returns null and leaves the board unchanged
 *      for out-of-bounds coordinates (Req 11.5).
 *   4. setCell — non-mutating write returning a NEW board when valid; returns the
 *      PRIOR board unchanged for out-of-bounds coordinates (Req 11.5) or an
 *      invalid gem type (Req 12.4); null clears the cell.
 */

describe('createBoard', () => {
  // Validates: Requirements 11.1
  it('yields exactly 8 rows by 8 columns with every cell null', () => {
    const board = createBoard();

    expect(board).toHaveLength(ROWS);
    expect(ROWS).toBe(8);
    expect(COLS).toBe(8);

    for (let row = 0; row < ROWS; row += 1) {
      expect(board[row]).toHaveLength(COLS);
      for (let col = 0; col < COLS; col += 1) {
        expect(board[row][col]).toBeNull();
      }
    }
  });

  // Validates: Requirements 11.1
  it('returns independent rows so mutating one row never affects another', () => {
    const board = createBoard();
    board[0][0] = createGem('Ruby');
    expect(board[1][0]).toBeNull();
    // Distinct row array instances.
    expect(board[0]).not.toBe(board[1]);
  });
});

describe('isValidCell', () => {
  // Validates: Requirements 11.4
  it('accepts every in-range coordinate 0..7 in both dimensions', () => {
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        expect(isValidCell(row, col)).toBe(true);
      }
    }
  });

  // Validates: Requirements 11.4
  it('rejects negative and out-of-range coordinates', () => {
    expect(isValidCell(-1, 0)).toBe(false);
    expect(isValidCell(0, -1)).toBe(false);
    expect(isValidCell(ROWS, 0)).toBe(false); // 8 is out of range
    expect(isValidCell(0, COLS)).toBe(false); // 8 is out of range
    expect(isValidCell(100, 100)).toBe(false);
    expect(isValidCell(-1, -1)).toBe(false);
  });

  // Validates: Requirements 11.4
  it('rejects non-integer coordinates', () => {
    expect(isValidCell(1.5, 0)).toBe(false);
    expect(isValidCell(0, 2.7)).toBe(false);
    expect(isValidCell(NaN, 0)).toBe(false);
    expect(isValidCell(0, NaN)).toBe(false);
    expect(isValidCell('0', 0)).toBe(false);
    expect(isValidCell(null, 0)).toBe(false);
    expect(isValidCell(undefined, undefined)).toBe(false);
  });
});

describe('getCell', () => {
  // Validates: Requirements 11.5
  it('reads the current contents of a valid cell', () => {
    const gem = createGem('Sapphire');
    const board = setCell(createBoard(), 3, 4, gem);
    expect(getCell(board, 3, 4)).toEqual(gem);
    // A valid empty cell reads as null.
    expect(getCell(board, 0, 0)).toBeNull();
  });

  // Validates: Requirements 11.5
  it('returns null and leaves the board unchanged for out-of-bounds coordinates', () => {
    const board = createBoard();
    const before = board.map((row) => row.slice());

    expect(getCell(board, -1, 0)).toBeNull();
    expect(getCell(board, 0, -1)).toBeNull();
    expect(getCell(board, ROWS, 0)).toBeNull();
    expect(getCell(board, 0, COLS)).toBeNull();

    expect(board).toEqual(before);
  });
});

describe('setCell', () => {
  // Validates: Requirements 11.5
  it('returns a NEW board with the cell set without mutating the input', () => {
    const board = createBoard();
    const gem = createGem('Emerald');

    const next = setCell(board, 2, 5, gem);

    // A new board is returned...
    expect(next).not.toBe(board);
    // ...with the target cell set...
    expect(getCell(next, 2, 5)).toEqual(gem);
    // ...and the original board left untouched.
    expect(getCell(board, 2, 5)).toBeNull();
  });

  // Validates: Requirements 11.5
  it('shares untouched rows with the prior board (shallow copy)', () => {
    const board = createBoard();
    const next = setCell(board, 2, 5, createGem('Topaz'));

    // The mutated row is a fresh array; other rows are shared.
    expect(next[2]).not.toBe(board[2]);
    expect(next[0]).toBe(board[0]);
  });

  // Validates: Requirements 11.5
  it('accepts null as a valid value to clear a cell', () => {
    const seeded = setCell(createBoard(), 1, 1, createGem('Amethyst'));
    const cleared = setCell(seeded, 1, 1, null);

    expect(getCell(cleared, 1, 1)).toBeNull();
    // Non-mutating: prior board still holds the gem.
    expect(getCell(seeded, 1, 1)).not.toBeNull();
  });

  // Validates: Requirements 11.5
  it('rejects out-of-bounds writes by returning the PRIOR board unchanged', () => {
    const board = setCell(createBoard(), 0, 0, createGem('Ruby'));
    const gem = createGem('Amber');

    for (const [row, col] of [
      [-1, 0],
      [0, -1],
      [ROWS, 0],
      [0, COLS],
      [100, 100],
    ]) {
      const result = setCell(board, row, col, gem);
      // Same board reference returned, contents unchanged.
      expect(result).toBe(board);
    }
    expect(getCell(board, 0, 0)).toEqual(createGem('Ruby'));
  });

  // Validates: Requirements 12.4
  it('rejects a gem with an invalid type, retaining the prior cell', () => {
    const board = setCell(createBoard(), 4, 4, createGem('Ruby'));

    // A gem-shaped object with a type outside GEM_TYPES.
    const invalidGem = { type: 'Diamond' };
    expect(GEM_TYPES).not.toContain(invalidGem.type);

    const result = setCell(board, 4, 4, invalidGem);

    // Write rejected: prior board returned unchanged, prior cell retained.
    expect(result).toBe(board);
    expect(getCell(board, 4, 4)).toEqual(createGem('Ruby'));
  });

  // Validates: Requirements 12.4
  it('rejects non-object, non-null values as invalid writes', () => {
    const board = createBoard();

    expect(setCell(board, 0, 0, 'Ruby')).toBe(board);
    expect(setCell(board, 0, 0, 42)).toBe(board);
    expect(setCell(board, 0, 0, undefined)).toBe(board);

    expect(getCell(board, 0, 0)).toBeNull();
  });
});

describe('generateStableBoard', () => {
  // Validates: Requirements 13.2, 13.3, 25.1
  it('yields exactly 8 rows by 8 columns with a gem in every cell', () => {
    const board = generateStableBoard(makeSeededRng(1));

    expect(ROWS).toBe(8);
    expect(COLS).toBe(8);
    expect(board).toHaveLength(ROWS);

    for (let row = 0; row < ROWS; row += 1) {
      expect(board[row]).toHaveLength(COLS);
      for (let col = 0; col < COLS; col += 1) {
        const cell = board[row][col];
        // A Stable_Board is fully populated — no empty (null) cells.
        expect(cell).not.toBeNull();
        expect(typeof cell).toBe('object');
      }
    }
  });

  // Validates: Requirements 13.2, 25.2
  it('assigns every cell a gem whose type is one of the six defined types', () => {
    const board = generateStableBoard(makeSeededRng(2));

    expect(GEM_TYPES).toHaveLength(6);
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        expect(GEM_TYPES).toContain(board[row][col].type);
      }
    }
  });

  // Validates: Requirements 13.1, 13.3, 13.4, 25.3
  it('produces an initial board with zero matches (deterministic seed)', () => {
    const board = generateStableBoard(makeSeededRng(3));
    expect(findMatches(board)).toEqual([]);
  });

  // Validates: Requirements 13.1, 13.4, 25.3
  it('produces a match-free board across many different seeds', () => {
    // Exercising many independent generations strengthens the match-free
    // guarantee beyond a single lucky seed.
    for (let seed = 0; seed < 50; seed += 1) {
      const board = generateStableBoard(makeSeededRng(seed));
      expect(findMatches(board)).toHaveLength(0);
    }
  });

  // Validates: Requirements 13.1, 13.2, 25.1, 25.2, 25.3
  it('produces a valid, match-free board using the default RNG (Math.random)', () => {
    // Repeat with the default source of randomness to cover the un-seeded path
    // and guard against RNG-dependent regressions.
    for (let run = 0; run < 20; run += 1) {
      const board = generateStableBoard();

      expect(board).toHaveLength(ROWS);
      for (let row = 0; row < ROWS; row += 1) {
        expect(board[row]).toHaveLength(COLS);
        for (let col = 0; col < COLS; col += 1) {
          expect(GEM_TYPES).toContain(board[row][col].type);
        }
      }
      expect(findMatches(board)).toEqual([]);
    }
  });

  // Validates: Requirements 13.3
  it('returns a fresh board on each call without sharing structure', () => {
    const rngA = makeSeededRng(7);
    const rngB = makeSeededRng(7);
    const first = generateStableBoard(rngA);
    const second = generateStableBoard(rngB);

    // Same seed → structurally identical, but distinct array instances so a
    // later mutation of one board cannot leak into another.
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(second[0]).not.toBe(first[0]);
  });
});

describe('isAdjacent', () => {
  // Validates: Requirements 15.2
  it('accepts all four edge-sharing (orthogonal) directions', () => {
    const center = { row: 3, col: 3 };
    const up = { row: 2, col: 3 };
    const down = { row: 4, col: 3 };
    const left = { row: 3, col: 2 };
    const right = { row: 3, col: 4 };

    // Adjacency holds in every orthogonal direction, and is symmetric.
    expect(isAdjacent(center, up)).toBe(true);
    expect(isAdjacent(up, center)).toBe(true);
    expect(isAdjacent(center, down)).toBe(true);
    expect(isAdjacent(down, center)).toBe(true);
    expect(isAdjacent(center, left)).toBe(true);
    expect(isAdjacent(left, center)).toBe(true);
    expect(isAdjacent(center, right)).toBe(true);
    expect(isAdjacent(right, center)).toBe(true);
  });

  // Validates: Requirements 15.2, 25.5
  it('rejects diagonal, identical, and distant pairs', () => {
    const center = { row: 3, col: 3 };

    // Diagonal neighbours share a corner, not an edge.
    expect(isAdjacent(center, { row: 2, col: 2 })).toBe(false);
    expect(isAdjacent(center, { row: 2, col: 4 })).toBe(false);
    expect(isAdjacent(center, { row: 4, col: 2 })).toBe(false);
    expect(isAdjacent(center, { row: 4, col: 4 })).toBe(false);

    // A cell is never adjacent to itself.
    expect(isAdjacent(center, { row: 3, col: 3 })).toBe(false);

    // Cells two apart in a single dimension are not adjacent.
    expect(isAdjacent(center, { row: 3, col: 5 })).toBe(false);
    expect(isAdjacent(center, { row: 1, col: 3 })).toBe(false);

    // Far-apart cells are not adjacent.
    expect(isAdjacent({ row: 0, col: 0 }, { row: 7, col: 7 })).toBe(false);
  });
});

describe('swapCells', () => {
  // Validates: Requirements 15.1, 25.4
  it('accepts an adjacent swap, exchanging the two cells non-mutatingly', () => {
    const a = { row: 2, col: 2 };
    const b = { row: 2, col: 3 };
    const gemA = createGem('Ruby');
    const gemB = createGem('Sapphire');

    // Two gems seeded at horizontally adjacent cells.
    let board = setCell(createBoard(), a.row, a.col, gemA);
    board = setCell(board, b.row, b.col, gemB);

    // The adjacency gate the screen uses to accept the swap holds.
    expect(isAdjacent(a, b)).toBe(true);

    const swapped = swapCells(board, a, b);

    // A new board is returned with the two gems exchanged...
    expect(swapped).not.toBe(board);
    expect(getCell(swapped, a.row, a.col)).toEqual(gemB);
    expect(getCell(swapped, b.row, b.col)).toEqual(gemA);

    // ...and the original board is left unchanged (non-mutating).
    expect(getCell(board, a.row, a.col)).toEqual(gemA);
    expect(getCell(board, b.row, b.col)).toEqual(gemB);
  });

  // Validates: Requirements 15.1, 25.4
  it('exchanges gems for a vertically adjacent swap', () => {
    const a = { row: 4, col: 5 };
    const b = { row: 5, col: 5 };
    const gemA = createGem('Emerald');
    const gemB = createGem('Amber');

    let board = setCell(createBoard(), a.row, a.col, gemA);
    board = setCell(board, b.row, b.col, gemB);

    expect(isAdjacent(a, b)).toBe(true);

    const swapped = swapCells(board, a, b);

    expect(getCell(swapped, a.row, a.col)).toEqual(gemB);
    expect(getCell(swapped, b.row, b.col)).toEqual(gemA);
    // Non-mutating: original preserved.
    expect(getCell(board, a.row, a.col)).toEqual(gemA);
    expect(getCell(board, b.row, b.col)).toEqual(gemB);
  });

  // Validates: Requirements 15.1, 25.5
  it('rejects a non-adjacent swap attempt via the isAdjacent gate', () => {
    // Per Req 25.5 the screen refuses to swap non-adjacent cells; the rejection
    // gate is isAdjacent returning false, so no swapCells call is made.
    const a = { row: 1, col: 1 };
    const diagonal = { row: 2, col: 2 };
    const distant = { row: 6, col: 6 };

    expect(isAdjacent(a, diagonal)).toBe(false);
    expect(isAdjacent(a, distant)).toBe(false);
  });
});

describe('removeCells', () => {
  // Validates: Requirements 17.1, 17.2, 25.8
  it('clears exactly the cells of a detected match while every other gem is retained', () => {
    // Build a board with a horizontal run of three same-type gems in row 4,
    // surrounded by differently-typed gems that must NOT be removed.
    let board = createBoard();
    board = setCell(board, 4, 2, createGem('Ruby'));
    board = setCell(board, 4, 3, createGem('Ruby'));
    board = setCell(board, 4, 4, createGem('Ruby'));
    // Non-matched neighbours in the same row (distinct types break the run).
    board = setCell(board, 4, 1, createGem('Sapphire'));
    board = setCell(board, 4, 5, createGem('Emerald'));
    // Non-matched gems elsewhere on the board.
    board = setCell(board, 0, 0, createGem('Topaz'));
    board = setCell(board, 7, 7, createGem('Amber'));
    board = setCell(board, 3, 4, createGem('Amethyst'));

    const matches = findMatches(board);
    // Precondition: exactly the three-in-a-row is detected as a Match.
    expect(matches).toEqual([
      { row: 4, col: 2 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
    ]);

    const result = removeCells(board, matches);

    // Every matched cell is now empty (Req 17.1).
    for (const { row, col } of matches) {
      expect(getCell(result, row, col)).toBeNull();
    }

    // Every non-matched cell keeps its gem unchanged (Req 17.2). Verify each
    // cell of the board against the original: matched cells are null, all
    // others equal their prior contents.
    const matchedKeys = new Set(matches.map(({ row, col }) => `${row},${col}`));
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (matchedKeys.has(`${row},${col}`)) {
          expect(getCell(result, row, col)).toBeNull();
        } else {
          expect(getCell(result, row, col)).toEqual(getCell(board, row, col));
        }
      }
    }
  });

  // Validates: Requirements 17.1, 17.2, 25.8
  it('clears the cells of a vertical match while retaining all other gems', () => {
    // A vertical run of three same-type gems in column 6.
    let board = createBoard();
    board = setCell(board, 1, 6, createGem('Emerald'));
    board = setCell(board, 2, 6, createGem('Emerald'));
    board = setCell(board, 3, 6, createGem('Emerald'));
    // A retained gem directly below the run (distinct type breaks it).
    board = setCell(board, 4, 6, createGem('Ruby'));

    const matches = findMatches(board);
    expect(matches).toEqual([
      { row: 1, col: 6 },
      { row: 2, col: 6 },
      { row: 3, col: 6 },
    ]);

    const result = removeCells(board, matches);

    expect(getCell(result, 1, 6)).toBeNull();
    expect(getCell(result, 2, 6)).toBeNull();
    expect(getCell(result, 3, 6)).toBeNull();
    // The non-matched gem below the run is retained.
    expect(getCell(result, 4, 6)).toEqual(createGem('Ruby'));
  });

  // Validates: Requirements 17.1, 17.2
  it('is non-mutating: returns a new board and leaves the original untouched', () => {
    let board = createBoard();
    board = setCell(board, 0, 0, createGem('Sapphire'));
    board = setCell(board, 0, 1, createGem('Sapphire'));
    board = setCell(board, 0, 2, createGem('Sapphire'));

    const matches = findMatches(board);
    const result = removeCells(board, matches);

    // A new board instance is returned.
    expect(result).not.toBe(board);

    // The original board still holds every matched gem (non-mutating).
    expect(getCell(board, 0, 0)).toEqual(createGem('Sapphire'));
    expect(getCell(board, 0, 1)).toEqual(createGem('Sapphire'));
    expect(getCell(board, 0, 2)).toEqual(createGem('Sapphire'));

    // ...while the returned board has those cells cleared.
    expect(getCell(result, 0, 0)).toBeNull();
    expect(getCell(result, 0, 1)).toBeNull();
    expect(getCell(result, 0, 2)).toBeNull();
  });

  // Validates: Requirements 17.2
  it('yields a board equal to the input, with all gems retained, for an empty match list', () => {
    let board = createBoard();
    board = setCell(board, 2, 2, createGem('Topaz'));
    board = setCell(board, 5, 3, createGem('Amber'));
    board = setCell(board, 6, 1, createGem('Amethyst'));

    const result = removeCells(board, []);

    // Nothing is cleared: the result equals the input cell-for-cell.
    expect(result).toEqual(board);
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        expect(getCell(result, row, col)).toEqual(getCell(board, row, col));
      }
    }
  });
});

describe('applyGravity', () => {
  /**
   * Read a single column of a board top-to-bottom as an array of gem types
   * (or null for empty cells). Convenient for asserting column layout after
   * gravity without comparing full gem object identities.
   *
   * @param {Array<Array<object|null>>} board  The board to read.
   * @param {number} col  Column index to extract.
   * @returns {Array<(string|null)>} Column contents, index 0 = top row.
   */
  function columnTypes(board, col) {
    const out = [];
    for (let row = 0; row < ROWS; row += 1) {
      const cell = board[row][col];
      out.push(cell === null ? null : cell.type);
    }
    return out;
  }

  // Validates: Requirements 18.1, 18.2, 25.9
  it('drops remaining gems to the lowest cells, empties rise to the top, order preserved', () => {
    // Seed column 0 with gaps: rows 1, 3, 5 hold gems (top-to-bottom order
    // Ruby, Emerald, Sapphire); every other cell in the column is empty.
    let board = createBoard();
    board = setCell(board, 1, 0, createGem('Ruby'));
    board = setCell(board, 3, 0, createGem('Emerald'));
    board = setCell(board, 5, 0, createGem('Sapphire'));

    const result = applyGravity(board);

    // The three gems now occupy the three lowest cells (rows 5, 6, 7) with
    // their relative vertical order preserved (Ruby above Emerald above
    // Sapphire), and every cell above them (rows 0..4) is empty.
    expect(columnTypes(result, 0)).toEqual([
      null,
      null,
      null,
      null,
      null,
      'Ruby',
      'Emerald',
      'Sapphire',
    ]);
  });

  // Validates: Requirements 18.3
  it('leaves a column with no empty cell unchanged', () => {
    // Fill column 2 completely with a known repeating pattern.
    const types = ['Ruby', 'Sapphire', 'Emerald', 'Topaz', 'Amethyst', 'Amber', 'Ruby', 'Sapphire'];
    let board = createBoard();
    for (let row = 0; row < ROWS; row += 1) {
      board = setCell(board, row, 2, createGem(types[row]));
    }

    const result = applyGravity(board);

    // A full column is left in its existing positions (Req 18.3), and the
    // untouched rows are shared with the input (non-mutating fast path).
    expect(columnTypes(result, 2)).toEqual(types);
    for (let row = 0; row < ROWS; row += 1) {
      expect(result[row]).toBe(board[row]);
    }
  });

  // Validates: Requirements 18.1
  it('produces columns whose empty cells appear only at the top', () => {
    // A mixed column: gems at rows 0, 2, 7 with gaps between them.
    let board = createBoard();
    board = setCell(board, 0, 4, createGem('Topaz'));
    board = setCell(board, 2, 4, createGem('Amber'));
    board = setCell(board, 7, 4, createGem('Amethyst'));

    const column = columnTypes(applyGravity(board), 4);

    // Once the first gem is seen scanning top-to-bottom, no null may follow —
    // i.e. every empty cell is strictly above every gem.
    let seenGem = false;
    for (const cell of column) {
      if (cell !== null) {
        seenGem = true;
      } else {
        expect(seenGem).toBe(false);
      }
    }
    // The three gems survived and fell to the bottom, order preserved.
    expect(column.slice(ROWS - 3)).toEqual(['Topaz', 'Amber', 'Amethyst']);
  });

  // Validates: Requirements 18.1, 18.2
  it('is non-mutating: returns a new board and leaves the original untouched', () => {
    let board = createBoard();
    board = setCell(board, 0, 6, createGem('Ruby'));
    board = setCell(board, 4, 6, createGem('Emerald'));

    // Snapshot the original column layout before applying gravity.
    const before = columnTypes(board, 6);

    const result = applyGravity(board);

    // A distinct board instance is returned...
    expect(result).not.toBe(board);
    // ...the original column is unchanged (gems still at rows 0 and 4)...
    expect(columnTypes(board, 6)).toEqual(before);
    // ...while the result has both gems fallen to the two lowest cells.
    expect(columnTypes(result, 6)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      'Ruby',
      'Emerald',
    ]);
  });

  /**
   * Read a single column as a sorted list of the gem `type`s in its non-null
   * cells — a multiset fingerprint independent of position. Two columns with
   * this same fingerprint hold the same gems in some order, so gravity neither
   * creating, destroying, nor altering gems shows up as an unchanged
   * fingerprint before and after.
   *
   * @param {Array<Array<object|null>>} board  The board to read.
   * @param {number} col  Column index to fingerprint.
   * @returns {Array<string>} Sorted gem types of the column's non-null cells.
   */
  function columnMultiset(board, col) {
    const types = [];
    for (let row = 0; row < ROWS; row += 1) {
      const cell = board[row][col];
      if (cell !== null) {
        types.push(cell.type);
      }
    }
    return types.sort();
  }

  /** Count the empty (null) cells in a single column. */
  function columnEmptyCount(board, col) {
    let count = 0;
    for (let row = 0; row < ROWS; row += 1) {
      if (board[row][col] === null) {
        count += 1;
      }
    }
    return count;
  }

  // Validates: Requirements 18.1, 18.2, 25.9
  it('is non-destructive: preserves each column gem multiset and empty count', () => {
    // A board with an uneven scatter of gems across several columns, including
    // duplicate types within a column, so a multiset (not a set) is required to
    // catch any accidental drop or duplication of a gem during compaction.
    let board = createBoard();
    // Column 0: two Rubies with a gap between them (duplicate type).
    board = setCell(board, 1, 0, createGem('Ruby'));
    board = setCell(board, 6, 0, createGem('Ruby'));
    // Column 1: three distinct gems scattered top, middle, and bottom.
    board = setCell(board, 0, 1, createGem('Sapphire'));
    board = setCell(board, 3, 1, createGem('Emerald'));
    board = setCell(board, 7, 1, createGem('Topaz'));
    // Column 3: a single floating gem.
    board = setCell(board, 2, 3, createGem('Amber'));
    // Column 5: left empty entirely (all-null column stays all-null).

    const result = applyGravity(board);

    for (let col = 0; col < COLS; col += 1) {
      // The exact multiset of gem types in each column is unchanged: no gem is
      // created, destroyed, or retyped by gravity.
      expect(columnMultiset(result, col)).toEqual(columnMultiset(board, col));
      // The number of empty cells in each column is likewise conserved.
      expect(columnEmptyCount(result, col)).toBe(columnEmptyCount(board, col));
    }
  });

  // Validates: Requirements 18.2, 25.9
  it('preserves gem identity (not just type) when dropping gems', () => {
    // Distinct ids on same-typed gems let us assert the SAME gem objects fall,
    // in order — order preservation is stronger than mere type preservation.
    let board = createBoard();
    board = setCell(board, 0, 0, createGem('Ruby', 'top'));
    board = setCell(board, 4, 0, createGem('Ruby', 'mid'));
    board = setCell(board, 6, 0, createGem('Ruby', 'bot'));

    const result = applyGravity(board);

    // All three Rubies fall to the lowest cells with their top-to-bottom order
    // (and identities) intact.
    expect(result[5][0]).toEqual(createGem('Ruby', 'top'));
    expect(result[6][0]).toEqual(createGem('Ruby', 'mid'));
    expect(result[7][0]).toEqual(createGem('Ruby', 'bot'));
    // The cells above the run are empty.
    expect(result[4][0]).toBeNull();
  });
});

describe('refill', () => {
  /**
   * Count the cells of a board that hold a gem (non-null).
   *
   * @param {Array<Array<object|null>>} board  The board to scan.
   * @returns {number} The number of occupied cells.
   */
  function occupiedCount(board) {
    let count = 0;
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (board[row][col] !== null) {
          count += 1;
        }
      }
    }
    return count;
  }

  // Validates: Requirements 19.1, 19.2, 25.10
  it('fills every empty cell so the resulting 8x8 board is completely full', () => {
    // An empty board is the extreme case: all 64 cells are null and must be
    // filled. A seeded RNG keeps the generated gems reproducible.
    const board = createBoard();

    const result = refill(board, makeSeededRng(11));

    // The board is exactly 8x8 and every one of its 64 cells now holds a gem.
    expect(result).toHaveLength(ROWS);
    for (let row = 0; row < ROWS; row += 1) {
      expect(result[row]).toHaveLength(COLS);
      for (let col = 0; col < COLS; col += 1) {
        expect(result[row][col]).not.toBeNull();
      }
    }
    expect(occupiedCount(result)).toBe(ROWS * COLS);
    expect(ROWS * COLS).toBe(64);
  });

  // Validates: Requirements 19.1, 25.10
  it('assigns every newly generated gem a type drawn from the six defined types', () => {
    const board = createBoard();

    const result = refill(board, makeSeededRng(12));

    expect(GEM_TYPES).toHaveLength(6);
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        expect(GEM_TYPES).toContain(result[row][col].type);
      }
    }
  });

  // Validates: Requirements 19.1, 19.2
  it('fills multiple empty cells at the tops of columns after gravity, preserving existing gems', () => {
    // Simulate the post-gravity state: existing gems sit at the bottom of some
    // columns, leaving several empty cells at the tops of those columns to fill.
    let board = createBoard();
    // Column 0: two gems at the bottom, rows 0..5 empty.
    board = setCell(board, 6, 0, createGem('Ruby', 'r6c0'));
    board = setCell(board, 7, 0, createGem('Emerald', 'r7c0'));
    // Column 3: one gem at the bottom, rows 0..6 empty.
    board = setCell(board, 7, 3, createGem('Sapphire', 'r7c3'));
    // Column 5: full-height single gem near the middle-bottom.
    board = setCell(board, 5, 5, createGem('Amber', 'r5c5'));

    // Snapshot the gems that must be preserved untouched by refill.
    const preserved = [
      { row: 6, col: 0, gem: createGem('Ruby', 'r6c0') },
      { row: 7, col: 0, gem: createGem('Emerald', 'r7c0') },
      { row: 7, col: 3, gem: createGem('Sapphire', 'r7c3') },
      { row: 5, col: 5, gem: createGem('Amber', 'r5c5') },
    ];

    const result = refill(board, makeSeededRng(13));

    // Every existing gem is retained exactly (type AND identity) — occupied
    // cells are never modified by refill.
    for (const { row, col, gem } of preserved) {
      expect(result[row][col]).toEqual(gem);
    }

    // Every previously empty cell is now filled with a valid gem, so the board
    // is completely full.
    expect(occupiedCount(result)).toBe(ROWS * COLS);
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        expect(result[row][col]).not.toBeNull();
        expect(GEM_TYPES).toContain(result[row][col].type);
      }
    }
  });

  // Validates: Requirements 19.2
  it('is non-mutating: returns a new board and leaves the original untouched', () => {
    // A board with a single seeded gem and 63 empty cells.
    const board = setCell(createBoard(), 7, 7, createGem('Topaz', 'corner'));
    const emptyBefore = ROWS * COLS - occupiedCount(board);

    const result = refill(board, makeSeededRng(14));

    // A distinct board instance is returned...
    expect(result).not.toBe(board);
    // ...the original board still has its 63 empty cells (non-mutating)...
    expect(ROWS * COLS - occupiedCount(board)).toBe(emptyBefore);
    expect(emptyBefore).toBe(63);
    expect(board[0][0]).toBeNull();
    // ...its one seeded gem is intact...
    expect(board[7][7]).toEqual(createGem('Topaz', 'corner'));
    // ...while the result is completely full.
    expect(occupiedCount(result)).toBe(ROWS * COLS);
  });

  // Validates: Requirements 19.2
  it('returns an equal, full board when there are no empty cells to fill', () => {
    // Start from a fully populated board (no nulls); refill must be a no-op
    // with respect to contents — every cell already holds exactly one gem.
    const full = generateStableBoard(makeSeededRng(15));
    expect(occupiedCount(full)).toBe(ROWS * COLS);

    const result = refill(full, makeSeededRng(16));

    // Contents are unchanged: no occupied cell is overwritten by refill.
    expect(result).toEqual(full);
    expect(occupiedCount(result)).toBe(ROWS * COLS);
  });

  // Validates: Requirements 19.1, 19.2, 25.10
  it('produces a full board of valid gems across many seeds', () => {
    // Exercising many independent seeds strengthens the "always full, always
    // valid" guarantee beyond a single lucky RNG sequence.
    for (let seed = 0; seed < 50; seed += 1) {
      const result = refill(createBoard(), makeSeededRng(seed));
      expect(occupiedCount(result)).toBe(ROWS * COLS);
      for (let row = 0; row < ROWS; row += 1) {
        for (let col = 0; col < COLS; col += 1) {
          expect(result[row][col]).not.toBeNull();
          expect(GEM_TYPES).toContain(result[row][col].type);
        }
      }
    }
  });
});

describe('isStableBoard', () => {
  // Validates: Requirements 21.1
  it('accepts a full, match-free 8x8 board as stable', () => {
    // generateStableBoard yields the canonical Stable_Board: all 64 cells hold
    // a valid gem and there are zero matches.
    const board = generateStableBoard(makeSeededRng(21));

    // Precondition sanity: the board really is full and match-free.
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        expect(board[row][col]).not.toBeNull();
      }
    }
    expect(findMatches(board)).toEqual([]);

    expect(isStableBoard(board)).toBe(true);
  });

  // Validates: Requirements 21.1, 21.6
  it('rejects a full board that still contains a match', () => {
    // Start from a stable board, then overwrite a horizontal run of three cells
    // with the same type so the board is full but no longer match-free.
    let board = generateStableBoard(makeSeededRng(22));
    board = setCell(board, 4, 2, createGem('Ruby'));
    board = setCell(board, 4, 3, createGem('Ruby'));
    board = setCell(board, 4, 4, createGem('Ruby'));

    // The board is still full (no empty cells) but now has a match.
    expect(findMatches(board).length).toBeGreaterThan(0);

    expect(isStableBoard(board)).toBe(false);
  });

  // Validates: Requirements 21.1, 21.6
  it('rejects a board with an empty (null) cell as not stable', () => {
    // A single transient empty cell disqualifies an otherwise match-free board
    // from being presented as ready for a new move (Req 21.6).
    let board = generateStableBoard(makeSeededRng(23));
    board = setCell(board, 0, 0, null);

    expect(board[0][0]).toBeNull();
    expect(isStableBoard(board)).toBe(false);
  });
});

describe('isDimensionAndTypeValid', () => {
  // Validates: Requirements 21.3
  it('accepts a full, valid 8x8 board', () => {
    const board = generateStableBoard(makeSeededRng(31));
    expect(isDimensionAndTypeValid(board)).toBe(true);
  });

  // Validates: Requirements 21.2, 21.3
  it('accepts a board with transient empty cells during removal/gravity/refill', () => {
    // Removal produces temporary holes; the intermediate-state check must still
    // pass because empty cells are permitted until refill completes (Req 21.2).
    let board = generateStableBoard(makeSeededRng(32));
    board = setCell(board, 1, 1, null);
    board = setCell(board, 2, 5, null);
    board = setCell(board, 7, 0, null);

    // An entirely empty board is the extreme transient case and is still valid.
    const empty = createBoard();

    expect(isDimensionAndTypeValid(board)).toBe(true);
    expect(isDimensionAndTypeValid(empty)).toBe(true);
  });

  // Validates: Requirements 21.3, 21.5
  it('rejects a board with the wrong dimensions', () => {
    // Too few rows.
    const tooFewRows = createBoard().slice(0, ROWS - 1);
    expect(tooFewRows).toHaveLength(ROWS - 1);
    expect(isDimensionAndTypeValid(tooFewRows)).toBe(false);

    // Correct row count but a row with the wrong column count.
    const wrongCols = createBoard();
    wrongCols[3] = wrongCols[3].slice(0, COLS - 1);
    expect(isDimensionAndTypeValid(wrongCols)).toBe(false);

    // A non-array is not a board at all.
    expect(isDimensionAndTypeValid(null)).toBe(false);
  });

  // Validates: Requirements 21.3, 21.5
  it('rejects a board where an occupied cell holds an invalid gem type', () => {
    // A gem-shaped object whose type is outside the six defined Gem_Types makes
    // the board invalid even though its dimensions are correct (Req 21.5).
    const board = createBoard();
    board[2][2] = { type: 'Diamond' };
    expect(GEM_TYPES).not.toContain(board[2][2].type);

    expect(isDimensionAndTypeValid(board)).toBe(false);
  });
});
