import { describe, it, expect } from 'vitest';
import {
  createGem,
  randomGem,
  isValidGemType,
  isValidSpecialType,
  isSpecial,
  createIdSource,
  SPECIAL_GEM_TYPES,
} from '../js/gem.js';
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

/**
 * Phase 3 — Extended gem model (Task 36).
 *
 * These cover the special-gem extensions layered onto the Phase 2 gem model:
 *   • baseType/specialType with `type` as a read alias for baseType,
 *   • the null-signal validation of both base type and special type,
 *   • the monotonic Gem_ID source, and
 *   • randomGem id threading.
 * They must not weaken the Phase 2 assertions above, which remain the source of
 * truth for legacy shape and behavior (Req 26.8).
 */

// The four powered special types; 'normal' is validated separately as the
// ordinary/derived default.
const POWERED_SPECIAL_TYPES = ['line_horizontal', 'line_vertical', 'rainbow', 'bomb'];

describe('isValidSpecialType', () => {
  // Validates: Requirements 26.1
  it('accepts each of the five defined special types (normal + four powered)', () => {
    expect(isValidSpecialType('normal')).toBe(true);
    for (const st of POWERED_SPECIAL_TYPES) {
      expect(isValidSpecialType(st)).toBe(true);
    }
    // Exactly four powered types are declared as canonical data.
    expect(SPECIAL_GEM_TYPES).toHaveLength(4);
  });

  // Validates: Requirements 26.1, 26.7
  it('rejects any unknown special type', () => {
    expect(isValidSpecialType('sparkle')).toBe(false);
    expect(isValidSpecialType('LINE_HORIZONTAL')).toBe(false); // case-sensitive
    expect(isValidSpecialType('')).toBe(false);
    expect(isValidSpecialType(null)).toBe(false);
    expect(isValidSpecialType(undefined)).toBe(false);
    expect(isValidSpecialType(0)).toBe(false);
  });
});

describe('createGem (extended, options form)', () => {
  // Validates: Requirements 26.1, 26.2, 26.3, 26.5, 44.3
  it('accepts each base type with each special type and records baseType/specialType', () => {
    const allSpecialTypes = ['normal', ...POWERED_SPECIAL_TYPES];
    for (const baseType of GEM_TYPES) {
      for (const specialType of allSpecialTypes) {
        const gem = createGem(baseType, { specialType, id: 1 });
        expect(gem).not.toBeNull();
        // type is a read alias for baseType (Req 26.5, 26.8).
        expect(gem.baseType).toBe(baseType);
        expect(gem.type).toBe(gem.baseType);
        expect(isValidGemType(gem.baseType)).toBe(true);
        // The effective special type is what was requested.
        const effective = gem.specialType === undefined ? 'normal' : gem.specialType;
        expect(effective).toBe(specialType);
      }
    }
  });

  // Validates: Requirements 26.7
  it('rejects an invalid specialType via null-signal with no assignment retained', () => {
    const gem = createGem('Ruby', { specialType: 'sparkle', id: 5 });
    expect(gem).toBeNull();
  });

  // Validates: Requirements 26.7
  it('rejects an invalid baseType even when the specialType is valid', () => {
    expect(createGem('Diamond', { specialType: 'bomb', id: 5 })).toBeNull();
  });

  // Validates: Requirements 26.2, 26.5
  it('treats an options object without a specialType as a normal gem', () => {
    const gem = createGem('Emerald', { id: 9 });
    expect(gem).not.toBeNull();
    expect(gem.baseType).toBe('Emerald');
    expect(gem.type).toBe('Emerald');
    expect(isSpecial(gem)).toBe(false);
  });

  // Validates: Requirements 26.2, 26.3, 26.5, 44.3
  it('gives every gem a valid baseType with type === baseType (normal and special)', () => {
    const normal = createGem('Sapphire', { id: 1 });
    expect(normal.baseType).toBe('Sapphire');
    expect(normal.type).toBe(normal.baseType);
    expect(isValidGemType(normal.baseType)).toBe(true);

    for (const specialType of POWERED_SPECIAL_TYPES) {
      const gem = createGem('Topaz', { specialType, id: 2 });
      expect(gem.baseType).toBe('Topaz');
      expect(gem.type).toBe(gem.baseType); // alias holds for specials too
      expect(isValidGemType(gem.baseType)).toBe(true);
      // A rainbow still carries a valid, non-null base type (Req 26.3, 44.3).
    }
  });
});

describe('createGem (backward compatibility)', () => {
  // Validates: Requirements 26.8, 12.1
  it('keeps the legacy 2-arg normal gem shape exactly { type, id }', () => {
    const gem = createGem('Ruby', 42);
    // Own enumerable shape is unchanged from Phase 2 — no extra own props.
    expect(gem).toEqual({ type: 'Ruby', id: 42 });
    expect(Object.keys(gem).sort()).toEqual(['id', 'type']);
    // The baseType alias is still readable (non-enumerable) and equals type.
    expect(gem.baseType).toBe('Ruby');
    expect(gem.type).toBe(gem.baseType);
    expect(isSpecial(gem)).toBe(false);
  });
});

describe('isSpecial', () => {
  // Validates: Requirements 26.6
  it('classifies a legacy 2-arg normal gem as not special', () => {
    expect(isSpecial(createGem('Ruby', 42))).toBe(false);
  });

  // Validates: Requirements 26.6
  it('classifies an options-form normal gem as not special', () => {
    expect(isSpecial(createGem('Ruby', { specialType: 'normal', id: 1 }))).toBe(false);
  });

  // Validates: Requirements 26.6
  it('classifies each powered special gem as special', () => {
    for (const specialType of POWERED_SPECIAL_TYPES) {
      const gem = createGem('Amber', { specialType, id: 3 });
      expect(isSpecial(gem)).toBe(true);
    }
  });
});

describe('createIdSource', () => {
  // Validates: Requirements 26.4, 26.5
  it('yields strictly increasing unique ids from the default start', () => {
    const ids = createIdSource();
    const seen = [];
    for (let i = 0; i < 50; i++) {
      seen.push(ids.next());
    }
    // Strictly increasing.
    for (let i = 1; i < seen.length; i++) {
      expect(seen[i]).toBeGreaterThan(seen[i - 1]);
    }
    // Unique.
    expect(new Set(seen).size).toBe(seen.length);
    // Deterministic default sequence: 1, 2, 3, ...
    expect(seen.slice(0, 3)).toEqual([1, 2, 3]);
  });

  // Validates: Requirements 26.4, 26.5
  it('honors a custom start and remains monotonic', () => {
    const ids = createIdSource(100);
    expect(ids.next()).toBe(100);
    expect(ids.next()).toBe(101);
    expect(ids.next()).toBe(102);
  });
});

describe('randomGem (id threading)', () => {
  function seededRng(values) {
    let i = 0;
    return () => values[i++ % values.length];
  }

  // Validates: Requirements 26.4, 26.5
  it('assigns unique ids from the id source when provided', () => {
    const rng = seededRng([0, 0.2, 0.35, 0.55, 0.7, 0.9]);
    const ids = createIdSource();
    const gems = [];
    for (let n = 0; n < 30; n++) {
      gems.push(randomGem(rng, ids));
    }
    const gemIds = gems.map((g) => g.id);
    // Every gem got an id, and all ids are unique.
    for (const id of gemIds) {
      expect(typeof id).toBe('number');
    }
    expect(new Set(gemIds).size).toBe(gemIds.length);
    // Every generated gem is a valid normal gem.
    for (const gem of gems) {
      expect(GEM_TYPES).toContain(gem.type);
      expect(isSpecial(gem)).toBe(false);
    }
  });

  // Validates: Requirements 26.5, 12.2 (Phase 2 behavior preserved)
  it('preserves Phase 2 behavior (no id) when no id source is provided', () => {
    const gem = randomGem(() => 0);
    expect(GEM_TYPES).toContain(gem.type);
    expect(gem.id).toBeUndefined();
    expect(isSpecial(gem)).toBe(false);
  });
});
