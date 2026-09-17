/**
 * Board Configuration — the single declaration of the match-3 board's tunable
 * data: its dimensions, the minimum match length, and the set of gem types.
 *
 * This module's single responsibility is declaring board configuration as data.
 * Every export relates to that one concern. It is the ONLY place these values
 * are defined: match detection, gravity, refill, generation, and rendering all
 * read ROWS, COLS, MIN_MATCH, and GEM_TYPES from here rather than restating them
 * as literals. Changing the board size or the gem set is a data edit in this
 * file, with no edits to any logic module (Req 11.3, 12.3).
 */

/**
 * Number of rows on the Board.
 * @type {number}
 */
export const ROWS = 8;

/**
 * Number of columns on the Board.
 * @type {number}
 */
export const COLS = 8;

/**
 * Minimum number of contiguous same-type gems that form a Match.
 * @type {number}
 */
export const MIN_MATCH = 3;

/**
 * The six defined Gem_Types, declared once as a readonly data collection so no
 * match, gravity, or refill logic hardcodes a type literal (Req 12.1, 12.3).
 * Frozen to prevent accidental mutation at runtime.
 *
 * @type {ReadonlyArray<string>}
 */
export const GEM_TYPES = Object.freeze([
  'Ruby',
  'Sapphire',
  'Emerald',
  'Topaz',
  'Amethyst',
  'Amber',
]);
