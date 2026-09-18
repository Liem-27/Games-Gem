/**
 * Gem Model — the single owner of the Gem concept: creating gems, generating
 * random gems, validating Gem_Types and Special_Gem_Types, and minting unique
 * Gem_IDs.
 *
 * This module's single responsibility is the gem concern. Every valid base gem
 * type it recognizes is drawn from the canonical GEM_TYPES data declared in
 * board-config.js — no type literals are restated here (Req 12.1, 12.2). The
 * five Special_Gem_Types are declared here once as the canonical data for that
 * concern (Req 26.1).
 *
 * The module is PURE: no DOM, no timers, no globals. Randomness is injected via
 * an `rng` parameter so callers can supply a seeded generator for deterministic
 * tests (default Math.random). Gem_ID uniqueness (Req 26.4) is provided by a
 * deterministic monotonic counter (createIdSource), never Math.random.
 *
 * Error handling follows a null-signal convention: on an invalid Base_Gem_Type
 * or Special_Gem_Type, createGem returns `null` rather than throwing, so callers
 * can reject the assignment and retain their prior state (Req 12.4, 26.7).
 *
 * ── Backward-compatibility decision (Phase 2 → Phase 3) ───────────────────────
 * A Phase 3 gem is conceptually `{ baseType, specialType, id }` with `type` a
 * read alias equal to `baseType`. Phase 2 code and tests, however, read
 * `gem.type` and assert that a legacy `createGem('Ruby', 42)` deep-equals
 * exactly `{ type: 'Ruby', id: 42 }`.
 *
 * To reconcile "type is an alias for baseType" with that exact-shape
 * expectation, `type` is kept as the base-type field (its existing meaning,
 * stored as an own enumerable property) and `baseType` is exposed as a
 * non-enumerable accessor that returns `type`. Because `baseType` is
 * non-enumerable, it never appears in `toEqual`/deep-equality comparisons, and
 * `specialType` is only added as an own property when it is non-default.
 * Consequently:
 *   • The legacy 2-arg form `createGem('Ruby', 42)` still returns an object
 *     whose OWN enumerable shape is exactly `{ type, id }` (specialType is
 *     'normal' by derivation, not an extra own prop) — Phase 2 `toEqual` green.
 *   • Every gem exposes `baseType` (=== type) and a derived specialType, so
 *     match/gravity/refill/render logic that reads `gem.type` is unchanged and a
 *     board of only normal gems is behaviorally identical to Phase 2 (Req 26.8).
 */

import { GEM_TYPES } from './config/board-config.js';

/**
 * The five defined Special_Gem_Types plus 'normal', declared once as readonly
 * data so no logic module hardcodes a special-type literal (Req 26.1). Frozen to
 * prevent accidental mutation at runtime.
 *
 * @type {ReadonlyArray<string>}
 */
export const SPECIAL_GEM_TYPES = Object.freeze([
  'line_horizontal',
  'line_vertical',
  'rainbow',
  'bomb',
]);

/**
 * The default Special_Gem_Type for an ordinary gem.
 * @type {string}
 */
const NORMAL = 'normal';

/**
 * A single gem placed on the Board.
 *
 * @typedef {Object} Gem
 * @property {string} type  One of the six defined Base_Gem_Types (see GEM_TYPES);
 *   also readable as the non-enumerable alias `baseType`.
 * @property {string} [specialType]  One of the five Special_Gem_Types, or absent
 *   (derived as 'normal') for an ordinary gem.
 * @property {(string|number|undefined)} id  Gem_ID / caller-supplied identity.
 */

/**
 * Report whether a value is one of the six defined Base_Gem_Types.
 *
 * @param {*} type  The candidate base gem type.
 * @returns {boolean} true iff `type ∈ GEM_TYPES` (Req 12.1).
 */
export function isValidGemType(type) {
  return GEM_TYPES.includes(type);
}

/**
 * Report whether a value is one of the five defined Special_Gem_Types.
 *
 * The 'normal' sentinel is a valid, assignable Special_Gem_Type (an ordinary
 * gem), so it is accepted here alongside the four powered types (Req 26.1, 26.6).
 *
 * @param {*} specialType  The candidate special type.
 * @returns {boolean} true iff it is 'normal' or one of the four powered types.
 */
export function isValidSpecialType(specialType) {
  return specialType === NORMAL || SPECIAL_GEM_TYPES.includes(specialType);
}

/**
 * Attach a non-enumerable `baseType` accessor that mirrors `type`.
 *
 * Non-enumerable so it never appears in `toEqual`/deep-equality snapshots,
 * preserving the Phase 2 `{ type, id }` shape while still letting all callers
 * read `gem.baseType` (=== gem.type) uniformly (see module header).
 *
 * @param {Object} gem  The gem object to augment (mutated in place).
 * @returns {Gem} The same object, now exposing `baseType`.
 */
function withBaseTypeAlias(gem) {
  Object.defineProperty(gem, 'baseType', {
    enumerable: false,
    configurable: true,
    get() {
      return this.type;
    },
  });
  return gem;
}

/**
 * Create a Gem of the given base type.
 *
 * Two call forms are supported:
 *   • Legacy Phase 2 form — `createGem(baseType, id)` where the second argument
 *     is a string, number, or omitted. specialType defaults to 'normal' and the
 *     returned object's OWN enumerable shape is exactly `{ type, id }`.
 *   • Options form — `createGem(baseType, { specialType = 'normal', id })`. When
 *     specialType is a powered type it is stored as an own property.
 *
 * Returns `null` (null-signal) — committing no gem — if `baseType` is not a
 * valid Base_Gem_Type OR `specialType` is not one of the five defined
 * Special_Gem_Types (Req 12.4, 26.7). Never throws; never mutates caller state.
 *
 * A `rainbow` gem still carries a valid `baseType` (never null); its base type
 * is not used to decide its own effect — that is driven by a partner gem in a
 * later task (Req 26.3, 44.3).
 *
 * @param {string} baseType  The desired Base_Gem_Type; must be one of GEM_TYPES.
 * @param {(string|number|{specialType?:string, id?:(string|number)})} [optionsOrId]
 *   Legacy id (string/number/undefined) or an options object.
 * @returns {(Gem|null)} The created gem, or `null` if any input is invalid.
 */
export function createGem(baseType, optionsOrId) {
  if (!isValidGemType(baseType)) {
    return null;
  }

  // Overload resolution: an object (non-null) is the options form; anything else
  // (string, number, undefined) is the legacy `id` argument.
  let specialType = NORMAL;
  let id;
  if (optionsOrId !== null && typeof optionsOrId === 'object') {
    specialType = optionsOrId.specialType === undefined ? NORMAL : optionsOrId.specialType;
    id = optionsOrId.id;
  } else {
    id = optionsOrId;
  }

  if (!isValidSpecialType(specialType)) {
    return null;
  }

  // Legacy/normal gems keep the exact `{ type, id }` own-enumerable shape;
  // specialType is derived (not stored) so Phase 2 deep-equality stays green.
  const gem = { type: baseType, id };
  if (specialType !== NORMAL) {
    gem.specialType = specialType;
  }
  return withBaseTypeAlias(gem);
}

/**
 * Report whether a gem is a Special_Gem (any powered special type).
 *
 * Derives from the (possibly absent) `specialType` own property so a legacy
 * normal gem — created via the 2-arg form and lacking a `specialType` field —
 * still correctly reports `false` (Req 26.6).
 *
 * @param {Gem} gem  The gem to classify.
 * @returns {boolean} true iff the gem's effective specialType is not 'normal'.
 */
export function isSpecial(gem) {
  if (gem === null || typeof gem !== 'object') {
    return false;
  }
  const specialType = gem.specialType === undefined ? NORMAL : gem.specialType;
  return specialType !== NORMAL;
}

/**
 * Create a deterministic, monotonic Gem_ID source.
 *
 * Returns an object with a `next()` method yielding `start, start+1, start+2, …`
 * — a reproducible, strictly increasing, unique sequence with no reliance on
 * Math.random. Threading one id source through generation and refill guarantees
 * Gem_ID uniqueness within the active board (Req 26.4, 26.5).
 *
 * @param {number} [start=1]  The first id to yield.
 * @returns {{ next: () => number }} A monotonic id source.
 */
export function createIdSource(start = 1) {
  let counter = start;
  return {
    next() {
      return counter++;
    },
  };
}

/**
 * Generate a random valid normal Gem.
 *
 * Picks a Base_Gem_Type uniformly from GEM_TYPES using the injectable RNG, so
 * every generated gem is drawn from the six defined types (Req 12.2). The RNG
 * must behave like Math.random, returning a float in the half-open range [0, 1).
 *
 * When an `idSource` is provided, the generated gem is assigned a unique id via
 * `idSource.next()` (Req 26.4, 26.5). When `idSource` is omitted, Phase 2
 * behavior is preserved exactly: the gem carries no explicit id (undefined), so
 * existing Phase 2 randomGem tests — which only assert the type — are unaffected.
 *
 * @param {() => number} [rng=Math.random]  Injectable random source in [0, 1).
 * @param {{ next: () => number }} [idSource]  Optional monotonic Gem_ID source.
 * @returns {Gem} A normal gem whose type is one of the six defined Base_Gem_Types.
 */
export function randomGem(rng = Math.random, idSource) {
  const index = Math.floor(rng() * GEM_TYPES.length);
  const id = idSource ? idSource.next() : undefined;
  return createGem(GEM_TYPES[index], id);
}
