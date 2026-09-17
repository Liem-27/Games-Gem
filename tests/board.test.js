import { describe, it, expect } from 'vitest';
import { createBoard, isValidCell, getCell, setCell } from '../js/board.js';
import { createGem } from '../js/gem.js';
import { ROWS, COLS, GEM_TYPES } from '../js/config/board-config.js';

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
