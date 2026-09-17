import { describe, it, expect } from 'vitest';
import { createGem, randomGem, isValidGemType } from '../js/gem.js';
import { GEM_TYPES } from '../js/config/board-config.js';

/**
 * Unit tests for the Gem Model (js/gem.js).
 *
 * These cover the three concerns owned by the module:
 *   1. isValidGemType — accepts each of the six defined Gem_Types, rejects any
 *      unknown value (Req 12.1).
 *   2. randomGem — with a seeded/deterministic RNG, always produces a gem whose
 *      type is one of the six defined types (Req 12.2).
 *   3. createGem — builds a valid gem for a valid type, and follows the
 *      null-signal convention for an invalid type, committing no invalid gem
 *      (Req 12.4).
 */

describe('isValidGemType', () => {
  // Validates: Requirements 12.1
  it('accepts each of the six defined Gem_Types', () => {
    for (const type of GEM_TYPES) {
      expect(isValidGemType(type)).toBe(true);
    }
    // Sanity: exactly six defined types.
    expect(GEM_TYPES).toHaveLength(6);
  });

  // Validates: Requirements 12.1, 12.4
  it('rejects an unknown type', () => {
    expect(isValidGemType('Diamond')).toBe(false);
    expect(isValidGemType('')).toBe(false);
    expect(isValidGemType('ruby')).toBe(false); // case-sensitive
    expect(isValidGemType(null)).toBe(false);
    expect(isValidGemType(undefined)).toBe(false);
    expect(isValidGemType(0)).toBe(false);
  });
});

describe('createGem', () => {
  // Validates: Requirements 12.1, 12.2
  it('creates a valid gem for each valid type', () => {
    for (const type of GEM_TYPES) {
      const gem = createGem(type);
      expect(gem).not.toBeNull();
      expect(gem.type).toBe(type);
      expect(isValidGemType(gem.type)).toBe(true);
    }
  });

  // Validates: Requirements 12.1
  it('retains an optional caller-supplied id', () => {
    const gem = createGem('Ruby', 42);
    expect(gem).toEqual({ type: 'Ruby', id: 42 });
  });

  // Validates: Requirements 12.4
  it('rejects an invalid type by returning null (no invalid assignment retained)', () => {
    expect(createGem('Diamond')).toBeNull();
    expect(createGem('')).toBeNull();
    expect(createGem(undefined)).toBeNull();
    expect(createGem(null, 7)).toBeNull();
  });
});

describe('randomGem', () => {
  /**
   * A deterministic RNG that cycles through a fixed list of values in [0, 1),
   * mimicking Math.random so randomGem's selection is fully reproducible.
   *
   * @param {number[]} values
   * @returns {() => number}
   */
  function seededRng(values) {
    let i = 0;
    return () => values[i++ % values.length];
  }

  // Validates: Requirements 12.2
  it('always returns a gem whose type is one of the six defined types', () => {
    // Values chosen so that Math.floor(v * 6) hits every index 0..5, plus the
    // boundary value 0 and a value just under 1.
    const values = [0, 0.16, 0.33, 0.5, 0.66, 0.83, 0.999999, 0.99];
    const rng = seededRng(values);

    for (let n = 0; n < 100; n++) {
      const gem = randomGem(rng);
      expect(gem).not.toBeNull();
      expect(GEM_TYPES).toContain(gem.type);
      expect(isValidGemType(gem.type)).toBe(true);
    }
  });

  // Validates: Requirements 12.2
  it('maps RNG output to each defined type across the [0,1) range', () => {
    // One representative value per bucket index 0..5.
    const perBucket = [0.0, 0.2, 0.35, 0.55, 0.7, 0.9];
    const produced = perBucket.map((v) => randomGem(() => v).type);
    // Every produced type is valid, and all six defined types are covered.
    for (const type of produced) {
      expect(GEM_TYPES).toContain(type);
    }
    expect(new Set(produced)).toEqual(new Set(GEM_TYPES));
  });

  // Validates: Requirements 12.2
  it('stays within the defined types at the upper RNG boundary', () => {
    // A value approaching 1 must still index a valid type (never out of range).
    const gem = randomGem(() => 0.9999999);
    expect(GEM_TYPES).toContain(gem.type);
  });
});
