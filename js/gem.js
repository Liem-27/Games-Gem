/**
 * Gem Model — the single owner of the Gem concept: creating gems, generating
 * random gems, and validating Gem_Types.
 *
 * This module's single responsibility is the gem concern. Every export relates
 * to that one concern, and every valid gem type it recognizes is drawn from the
 * canonical GEM_TYPES data declared in board-config.js — no type literals are
 * restated here (Req 12.1, 12.2).
 *
 * The module is PURE: no DOM, no timers, no globals. Randomness is injected via
 * an `rng` parameter so callers can supply a seeded generator for deterministic
 * tests (default Math.random).
 *
 * Error handling follows a null-signal convention: on an invalid Gem_Type,
 * createGem returns `null` rather than throwing, so callers can reject the
 * assignment and retain their prior state (Req 12.4).
 */

import { GEM_TYPES } from './config/board-config.js';

/**
 * A single gem placed on the Board.
 *
 * @typedef {Object} Gem
 * @property {string} type  One of the six defined Gem_Types (see GEM_TYPES).
 * @property {(string|number|undefined)} id  Optional caller-supplied identity.
 */

/**
 * Report whether a value is one of the six defined Gem_Types.
 *
 * @param {*} type  The candidate gem type.
 * @returns {boolean} true iff `type ∈ GEM_TYPES` (Req 12.1).
 */
export function isValidGemType(type) {
  return GEM_TYPES.includes(type);
}

/**
 * Create a Gem of the given type.
 *
 * For a valid type, returns a `{ type, id }` object. For an invalid type,
 * returns `null` (null-signal) so callers can reject the invalid assignment and
 * keep their prior state rather than committing a malformed gem (Req 12.4).
 *
 * @param {string} type  The desired Gem_Type; must be one of GEM_TYPES.
 * @param {(string|number)} [id]  Optional caller-supplied identity for the gem.
 * @returns {(Gem|null)} The created gem, or `null` if `type` is invalid.
 */
export function createGem(type, id) {
  if (!isValidGemType(type)) {
    return null;
  }
  return { type, id };
}

/**
 * Generate a random valid Gem.
 *
 * Picks a Gem_Type uniformly from GEM_TYPES using the injectable RNG, so every
 * generated gem is drawn from the six defined types (Req 12.2). The RNG must
 * behave like Math.random, returning a float in the half-open range [0, 1).
 *
 * @param {() => number} [rng=Math.random]  Injectable random source in [0, 1).
 * @returns {Gem} A gem whose type is one of the six defined Gem_Types.
 */
export function randomGem(rng = Math.random) {
  const index = Math.floor(rng() * GEM_TYPES.length);
  return createGem(GEM_TYPES[index]);
}
