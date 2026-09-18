/**
 * Screen Registry — the single declaration of which screens exist and how to
 * build each one.
 *
 * This module's single responsibility is declaring the screen set as data.
 * Every export relates to that one concern. It is the ONLY place that lists the
 * available screens: adding a future screen is a registry entry here plus a new
 * screen module, with no edits to the Main Menu, the Router, or the bootstrap.
 *
 * Each entry is a ScreenDescriptor `{ id, factory }` where `factory` is a
 * zero-argument function that returns a fresh Screen instance conforming to the
 * Screen Lifecycle Contract (`mount` / optional `unmount` / optional `title`).
 * Producing screens through factories keeps every navigation isolated to its
 * own instance.
 *
 * @typedef {import('../router.js').Screen} Screen
 *
 * @typedef {Object} ScreenDescriptor
 * @property {string} id  Unique screen identifier, e.g. "main-menu".
 * @property {() => Screen} factory  Builds a fresh screen instance.
 */

import { mainMenuScreen } from '../screens/main-menu.js';
import { createPlaceholderScreen } from '../screens/placeholder.js';
import { createGameBoardScreen } from '../screens/game-board.js';

/**
 * The declared set of Phase 1 screens, in registration order. `main-menu` is
 * the Main Menu UI; the remaining five are placeholder ("coming-soon") screens,
 * one per deferred feature, each given a per-feature title and message.
 *
 * Future phases add screens by appending descriptors here, or by swapping a
 * placeholder's `factory` for a real screen (e.g., point `play` at the game
 * board) — the menu, router, and bootstrap remain untouched.
 *
 * @type {ReadonlyArray<ScreenDescriptor>}
 */
export const screenRegistry = [
  { id: 'main-menu', factory: () => mainMenuScreen() },
  { id: 'play', factory: () => createGameBoardScreen() },
  { id: 'world-map', factory: () => createPlaceholderScreen({ title: 'World Map', message: 'The realm map is coming soon.' }) },
  { id: 'boosters', factory: () => createPlaceholderScreen({ title: 'Boosters', message: 'Boosters are coming soon.' }) },
  { id: 'achievements', factory: () => createPlaceholderScreen({ title: 'Achievements', message: 'Achievements are coming soon.' }) },
  { id: 'settings', factory: () => createPlaceholderScreen({ title: 'Settings', message: 'Settings are coming soon.' }) },
];
