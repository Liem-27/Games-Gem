# Implementation Plan: Gemoria: Crystal Quest — Phase 1

## Overview

This plan implements **Phase 1 only**: the project foundation and a responsive, touch-friendly main menu with fully wired navigation and original placeholder artwork. It follows the layered architecture from the design — `index.html` → `js/main.js` (bootstrap) → screen registry + general Router + store scaffold → Main Menu UI module + placeholder factory.

The build order is bottom-up: pure, dependency-free modules first (store scaffold, Router, placeholder factory, main menu), then the registry that wires them, then the bootstrap and HTML entry point, then styles, then tests and run instructions. This keeps each step independently verifiable and ensures every module is integrated by the time the app boots — no orphaned code.

Implementation language: **Vanilla JavaScript (ES modules)**, as specified in the design. Property tests use **fast-check**; DOM tests run against jsdom (or a headless browser) via an ES-module-capable runner. All code must be served over HTTP.

Everything is deliberately additive: the Router is general, the registry is the single place screens are declared, and the store scaffold is passed through the screen context — so future phases (board, levels, boosters, sound, save) plug in without editing `main.js`, `router.js`, or `main-menu.js`.

## Tasks

- [x] 1. Set up project structure and test tooling
  - Create the directory layout: `index.html` at project root, `css/` for styles, `js/` for scripts with subfolders `js/config/`, `js/screens/`, `js/state/`, and `tests/` for tests.
  - Keep markup, style, and script files strictly separated by directory (no directory mixing the three categories).
  - Add `package.json` with a dev dependency on **fast-check** and an ES-module-capable test runner with a DOM (e.g., a runner using jsdom); add a `test` script and a static HTTP serve script (e.g., `npx serve` / documented `python -m http.server`).
  - Do NOT create any board, gameplay, sound, save, or level modules — those are future extension points.
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 2. Implement the central game-state store scaffold
  - [x] 2.1 Create `js/state/game-state.js`
    - Export `createStore(initialState = {})` returning `{ getState, setState, subscribe }`.
    - `getState` returns current state; `setState(patch)` merges the patch and notifies subscribers; `subscribe(fn)` registers a listener and returns an unsubscribe function.
    - Keep it minimal; add a comment marking it a Phase 1 scaffold / extension point (no progression, coins, lives, boosters, or level logic).
    - _Requirements: 1.3, 1.4, 1.6_

- [x] 3. Implement the general screen Router and lifecycle contract
  - [x] 3.1 Create `js/router.js`
    - Export `createRouter(container)` returning `{ register(id, factory), navigate(id), getCurrentScreenId(), hasScreen(id) }`.
    - Define the Screen Lifecycle Contract in JSDoc: `mount(container, ctx)` required, `unmount()` optional, optional `title`; screens are produced by factories so each navigation yields a fresh instance.
    - `navigate(id)` on a registered id: call `unmount()` on the current screen (if any), instantiate and `mount()` the target into the container with a `ctx` exposing a `navigate` callback (and the store), and record it as current.
    - `navigate(id)` on an unregistered id: leave current screen unchanged (no unmount, no new mount), `console.warn` a "screen not found: <id>" message, and return `false`. Never throw.
    - `register` must let new screens be added without modifying Router internals.
    - _Requirements: 4.2, 4.3, 9.4_

- [x] 4. Implement the placeholder screen factory
  - [x] 4.1 Create `js/screens/placeholder.js`
    - Export `createPlaceholderScreen({ title, message })` returning a `Screen`.
    - `mount(container, ctx)` renders the feature title, the "not yet available" message, and a **Back** control whose activation calls `ctx.navigate('main-menu')`.
    - Style the container with a solid theme background so controls remain visible/interactive even if artwork fails.
    - _Requirements: 6.4, 6.5, 9.3, 9.5, 1.4_

- [x] 5. Implement the Main Menu UI module
  - [x] 5.1 Create `js/screens/main-menu.js`
    - Export `mainMenuScreen()` returning a `Screen`.
    - Render the title text exactly "Gemoria: Crystal Quest".
    - Render the five buttons from a data-driven `MenuItem` list (`{ label, screenId }`): Play→`play`, World Map→`world-map`, Boosters→`boosters`, Achievements→`achievements`, Settings→`settings`; one enabled, activatable button per item with a matching label.
    - Render inline-SVG Placeholder_Artwork containing at least one crystal/gem shape; reference no external image files.
    - On activation: toggle an active-state CSS class (visual change) then call `ctx.navigate(targetId)` for that item.
    - _Requirements: 4.4, 5.1, 5.3, 6.1, 6.2, 6.6, 7.1, 7.2, 7.3, 10.3, 10.4_

- [x] 6. Checkpoint — Ensure all module tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Wire the screen registry
  - [x] 7.1 Create `js/config/screens.js`
    - Import `mainMenuScreen` and `createPlaceholderScreen`.
    - Export `screenRegistry` declaring `main-menu` plus the five placeholder screens (`play`, `world-map`, `boosters`, `achievements`, `settings`), each with an `id` and a `factory`, and per-feature `title`/`message` for placeholders.
    - This is the single place screens are declared; future screens are added here without editing menu/router/bootstrap.
    - _Requirements: 1.3, 1.4, 1.6, 6.1_

- [x] 8. Implement the application bootstrap
  - [x] 8.1 Create `js/main.js`
    - Import `createRouter`, `screenRegistry`, and `createStore`.
    - Export `boot(rootSelector = '#app')` that: resolves `#app` (reveal `#boot-error` if missing); creates the store scaffold; creates the Router over the container; registers each screen from the registry; navigates to the initial screen `'main-menu'`.
    - Wrap the wiring in `try/catch`; on failure reveal the on-screen `#boot-error` "failed to load" region so the viewport is never left blank.
    - Invoke `boot()` at module end so the game starts on load (keep it exported for testability).
    - _Requirements: 2.5, 4.1, 4.5, 5.1_

- [x] 9. Create the HTML entry point
  - [x] 9.1 Create `index.html` at the project root
    - Declare `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.
    - Link exactly three stylesheets in order: reset/base → theme → menu.
    - Include a single mount root `<div id="app"></div>` and a static, hidden `<div id="boot-error" hidden>…</div>` region with a "The game failed to load." message.
    - Reference the entry module with exactly one `<script type="module" src="js/main.js"></script>`; include a `<noscript>` message.
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 8.4_

- [x] 10. Author modular CSS
  - [x] 10.1 Create `css/reset.css` (base and reset styles)
    - Reset/normalize defaults, box-sizing, base document rules; contain no theme-specific color or typography definitions.
    - _Requirements: 3.1_

  - [x] 10.2 Create `css/theme.css` (fantasy crystal theme)
    - Define all fantasy crystal theme colors as reusable CSS custom properties (no literal color values elsewhere); include at least one color and at least one typography property (font family/size/weight).
    - Every `var()` usage includes a defined fallback (e.g., `var(--crystal-primary, #4b3f9e)`) so elements remain visible if a property is undefined.
    - _Requirements: 3.2, 3.4, 3.6_

  - [x] 10.3 Create `css/menu.css` (Main Menu layout and button styling)
    - Contain no base, reset, or theme color literal definitions; reference theme custom properties (with fallbacks) for any theme colors applied.
    - Responsive at a 768px breakpoint: ≤768px a single vertical column with each button full width minus 16px side margins; >768px content horizontally centered with max content width 960px.
    - Touch targets minimum 44×44px with ≥8px spacing between adjacent targets; zero horizontal overflow across 320–2560px; enable vertical scroll if content is taller than the viewport while keeping horizontal overflow at zero.
    - _Requirements: 3.3, 3.5, 8.1, 8.2, 8.3, 8.5, 8.6_


- [x] 11. Author the README with run instructions
  - Create `README.md` with exact steps to serve over HTTP from the project root (e.g., `python -m http.server` or `npx serve`, then open `http://localhost:<port>/`).
  - State that ES modules require serving over HTTP and that opening `index.html` directly from `file://` is not supported.
  - _Requirements: 10.5, 10.6_

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional (test-related) and can be skipped for a faster MVP; core implementation tasks are never optional.
- Each task references specific requirement clauses for traceability, and property test tasks reference their design property (Properties 1–6).
- Property tests use fast-check with a minimum of 100 iterations, one property test per correctness property, each tagged `// Feature: gemoria-crystal-quest, Property N: ...`.
- Checkpoints provide incremental validation without being deployment/UAT tasks.
- The build order is additive: the general Router, the single-source registry, and the store scaffold passed through `ScreenContext` let future phases (board, levels, boosters, sound, save) plug in without editing `main.js`, `router.js`, or `main-menu.js`.
- Responsive layout correctness (single column ≤768px, centered ≤960px >768px, no horizontal overflow 320–2560px, title within viewport) is primarily verified by manual/visual checks per the design's Testing Strategy, complemented by the computed-style tests in 10.4.
- All tests and manual verification must be run over HTTP (ES modules do not load from `file://`).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1", "4.1", "10.1", "10.2", "11"] },
    { "id": 1, "tasks": ["2.2", "3.2", "3.3", "4.2", "4.3", "5.1", "10.3"] },
    { "id": 2, "tasks": ["5.2", "5.3", "5.4", "7.1", "10.4"] },
    { "id": 3, "tasks": ["7.2", "8.1"] },
    { "id": 4, "tasks": ["8.2", "9.1"] },
    { "id": 5, "tasks": ["9.2"] }
  ]
}
```

---

# Phase 2 Implementation Plan: Core Match-3 Gameplay

## Phase 2 Overview

This plan implements **Phase 2 only**: the core match-3 gameplay for **SnoopsGem : Crystal** — a playable 8×8 board with six gem types, gem selection, adjacent swapping, match detection, gem removal, gravity, refill, and automatic cascade resolution, playable with mouse click and touch tap.

The build order is strictly bottom-up and additive, matching the Phase 2 design: data config first, then the pure engine (`gem` → `board` cells → `match` → generation → swap → removal → gravity → refill), then the DOM screen that orchestrates cascade and input, then the single registry repoint (`'play'`), then responsive CSS, then tests. Every step is independently testable, and each module is integrated by the time the Game Board screen boots — no orphaned code.

Implementation language: **Vanilla JavaScript (ES modules)**, as in Phase 1. Framework: **Vitest** (existing tests use it). Property tests use **fast-check** with a minimum of 100 iterations. Pure modules (`board.js`, `gem.js`, `match.js`) are tested without a DOM; the Game Board screen is tested under jsdom. All code is served over HTTP.

**Phase 1 architecture is preserved.** The only integration change is repointing the `'play'` entry in `js/config/screens.js` and adding one stylesheet link in `index.html`. No changes to `main.js`, `router.js`, or `main-menu.js` (except the final text-only title rename, which does not alter architecture). The pure engine (`board`/`gem`/`match`) never imports the screen; only the screen imports the engine.

**Implementation boundary (out of scope for Phase 2):** special gems, line crystals, rainbow crystals, bombs, obstacles, levels, world map, score/scoring, coins, lives, boosters, achievements, sound/music, save/load persistence, and swipe/drag gestures. None of these are implemented here. The clean extension points for all of them remain the **screen registry** (`js/config/screens.js`) for new screens and the **store scaffold** (`js/state/game-state.js`) for cross-screen state.

## Phase 2 Tasks

- [x] 13. Create Phase 2 board configuration data
  - [x] 13.1 Create `js/config/board-config.js`
    - **Objective:** Declare board dimensions and the gem-type set as data in one place.
    - **Files/modules affected:** `js/config/board-config.js` (new).
    - **Dependencies:** none (Phase 1 complete).
    - **Expected behavior:** Export `ROWS = 8`, `COLS = 8`, `MIN_MATCH = 3`, and `GEM_TYPES = ['Ruby', 'Sapphire', 'Emerald', 'Topaz', 'Amethyst', 'Amber']` as a readonly data collection. No match/gravity/refill logic may hardcode these; all such logic reads them from here.
    - **Tests required:** none in this task (constants are exercised by later unit tests).
    - _Requirements: 11.3, 12.1, 12.3_

- [x] 14. Implement the gem model and validation (PURE)
  - [x] 14.1 Create `js/gem.js`
    - **Objective:** Own gem creation, random generation, and Gem_Type validation with no DOM.
    - **Files/modules affected:** `js/gem.js` (new); imports `js/config/board-config.js`.
    - **Dependencies:** 13.1.
    - **Expected behavior:** Export `createGem(type, id?)` returning `{ type, id }` for a valid type (rejects/null-signals invalid type per error handling); `randomGem(rng = Math.random)` returning a random valid gem using the injectable RNG; `isValidGemType(type)` returning true iff `type ∈ GEM_TYPES`.
    - **Tests required:** covered in 14.2.
    - _Requirements: 12.1, 12.2, 12.4_

  - [x] 14.2 Write unit tests for the gem model
    - **Objective:** Verify gem creation, random generation validity, and type validation.
    - **Files/modules affected:** `tests/gem.test.js` (new).
    - **Dependencies:** 14.1.
    - **Expected behavior:** `isValidGemType` accepts each of the six types and rejects an unknown type; `randomGem` (with a seeded RNG) always returns a gem whose type is one of the six; `createGem` rejects an invalid type and retains no invalid assignment.
    - **Tests required:** six-valid-types check (Req 12.1/12.2), invalid-type rejection (Req 12.4).
    - _Requirements: 12.1, 12.2, 12.4_

- [x] 15. Implement board representation and cell operations (PURE)
  - [x] 15.1 Create `js/board.js` with structure and cell access
    - **Objective:** Own board creation and bounds/type-safe cell get/set.
    - **Files/modules affected:** `js/board.js` (new); imports `board-config.js` and `gem.js`.
    - **Dependencies:** 13.1, 14.1.
    - **Expected behavior:** Row-major 8×8 array (`board[row][col]`). Export `createBoard()` (all cells `null`); `isValidCell(row, col)` true iff `0 ≤ row < ROWS && 0 ≤ col < COLS`; `getCell(board, row, col)` rejecting out-of-bounds leaving the board unchanged; `setCell(board, row, col, gem)` returning a new board when coords and gem type are valid, otherwise rejecting and returning the prior board unchanged.
    - **Tests required:** covered in 15.2.
    - _Requirements: 11.1, 11.2, 11.4, 11.5, 12.4_

  - [x] 15.2 Write unit tests for board structure and cell validation
    - **Objective:** Verify dimensions and bounds/type rejection semantics.
    - **Files/modules affected:** `tests/board.test.js` (new).
    - **Dependencies:** 15.1.
    - **Expected behavior:** `createBoard` yields exactly 8 rows × 8 columns; `isValidCell` accepts 0–7/0–7 and rejects out-of-range; out-of-bounds `getCell`/`setCell` leave the board unchanged; `setCell` with an invalid gem type is rejected and retains the prior cell.
    - **Tests required:** 8×8 dimensions (Req 11.1), cell validation (Req 11.4/11.5), invalid-type rejection (Req 12.4).
    - _Requirements: 11.1, 11.4, 11.5, 12.4_

- [x] 16. Implement match detection (PURE)
  - [x] 16.1 Add `findMatches` and `hasMatches` to `js/match.js`
    - **Objective:** Own match detection only — horizontal, vertical, all-board, overlap union, deterministic output.
    - **Files/modules affected:** `js/match.js` (new); imports `board-config.js`.
    - **Dependencies:** 13.1, 15.1.
    - **Expected behavior:** `findMatches(board)` scans each row and each column for contiguous runs of `≥ MIN_MATCH` same-type gems, unions overlapping runs, and returns a deterministic list of `{row, col}` sorted by row then col with no duplicates (empty list when no run exists). `hasMatches(board)` returns true iff `findMatches` is non-empty. Complexity O(ROWS × COLS).
    - **Tests required:** covered in 16.2.
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

  - [x] 16.2 Write unit tests for match detection
    - **Objective:** Verify horizontal, vertical, overlap, and empty-case detection.
    - **Files/modules affected:** `tests/match.test.js` (new).
    - **Dependencies:** 16.1.
    - **Expected behavior:** A horizontal run of ≥3 same-type gems is detected (Req 16.1); a vertical run of ≥3 is detected (Req 16.2); an L/T overlap includes every cell of both runs exactly once (Req 16.4); a board with no run reports zero matches (Req 16.5); output is deterministic and sorted.
    - **Tests required:** horizontal match, vertical match, overlapping matches, empty-case, determinism.
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 17. Implement initial no-match board generation (PURE)
  - [x] 17.1 Add `generateStableBoard` to `js/board.js`
    - **Objective:** Produce a full board with zero matches using bounded, safe generation.
    - **Files/modules affected:** `js/board.js`; uses `gem.js` and `match.js`.
    - **Dependencies:** 14.1, 15.1, 16.1.
    - **Expected behavior:** `generateStableBoard(rng = Math.random)` fills cells row-major, excluding any type that would immediately complete a run of `MIN_MATCH` with placed left/above neighbors; bounded per-cell reroll and capped full-board regeneration guard termination; asserts `findMatches` is empty; result is a Stable_Board (64 valid gems, zero matches).
    - **Tests required:** covered in 17.2.
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 17.2 Write unit tests for initial board generation
    - **Objective:** Verify a generated initial board is valid and match-free.
    - **Files/modules affected:** `tests/board.test.js`.
    - **Dependencies:** 17.1, 16.1.
    - **Expected behavior:** A generated board has exactly 8×8 cells; every gem type is one of the six; `findMatches` is empty on the initial board.
    - **Tests required:** 8×8 dimensions (Req 25.1), six valid types (Req 25.2), zero initial matches (Req 25.3).
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 25.1, 25.2, 25.3_

- [x] 18. Implement swap and adjacency validation (PURE)
  - [x] 18.1 Add `isAdjacent` and `swapCells` to `js/board.js`
    - **Objective:** Provide adjacency predicate and a pure swap producing a new board.
    - **Files/modules affected:** `js/board.js`.
    - **Dependencies:** 15.1.
    - **Expected behavior:** `isAdjacent(a, b)` true iff same row with `|Δcol| === 1` or same column with `|Δrow| === 1`. `swapCells(board, a, b)` returns a new board with the two cells' gems exchanged (caller guarantees adjacency). Keep-if-any-match-anywhere vs revert-if-no-match is decided by the screen via `hasMatches` on the swapped board (surfaced, not embedded here).
    - **Tests required:** covered in 18.2.
    - _Requirements: 15.1, 15.2_

  - [x] 18.2 Write unit tests for swap and adjacency
    - **Objective:** Verify adjacent swaps are accepted and non-adjacent are rejected.
    - **Files/modules affected:** `tests/board.test.js`.
    - **Dependencies:** 18.1, 16.1.
    - **Expected behavior:** `isAdjacent` accepts edge-sharing pairs and rejects diagonal/non-adjacent; a swap between adjacent cells is accepted as a valid attempt (Req 25.4); a swap attempt between non-adjacent cells is rejected (Req 25.5).
    - **Tests required:** adjacent swap accepted, non-adjacent swap rejected.
    - _Requirements: 15.1, 15.2, 25.4, 25.5_

- [x] 19. Implement gem removal (PURE)
  - [x] 19.1 Add `removeCells` to `js/board.js`
    - **Objective:** Clear matched cells to `null`, leaving non-matched cells untouched.
    - **Files/modules affected:** `js/board.js`.
    - **Dependencies:** 15.1.
    - **Expected behavior:** `removeCells(board, matchedCells)` returns a new board with each `{row, col}` in `matchedCells` set to `null` and every other cell unchanged.
    - **Tests required:** covered in 19.2.
    - _Requirements: 17.1, 17.2_

  - [x] 19.2 Write unit tests for gem removal
    - **Objective:** Verify matched gems are removed and non-matched retained.
    - **Files/modules affected:** `tests/board.test.js`.
    - **Dependencies:** 19.1.
    - **Expected behavior:** All cells belonging to a detected match become `null`; all other cells keep their gems.
    - **Tests required:** match removal with retention of non-matched gems (Req 25.8).
    - _Requirements: 17.1, 17.2, 25.8_

- [x] 20. Implement gravity (PURE)
  - [x] 20.1 Add `applyGravity` to `js/board.js`
    - **Objective:** Compact each column so gems fall to the lowest cells, empties rise to the top.
    - **Files/modules affected:** `js/board.js`.
    - **Dependencies:** 15.1.
    - **Expected behavior:** For each column independently, non-null gems occupy the lowest cells preserving relative vertical order; remaining top cells become `null`; columns with no empty cell are unchanged. Preserves the per-column multiset of gems.
    - **Tests required:** covered in 20.2.
    - _Requirements: 18.1, 18.2, 18.3_

  - [x] 20.2 Write unit tests for gravity
    - **Objective:** Verify gravity ordering and non-destructiveness.
    - **Files/modules affected:** `tests/board.test.js`.
    - **Dependencies:** 20.1.
    - **Expected behavior:** After gravity, remaining gems in each column occupy the lowest available cells while preserving their relative vertical order; a full column is unchanged.
    - **Tests required:** gravity places gems lowest preserving order (Req 25.9).
    - _Requirements: 18.1, 18.2, 18.3, 25.9_

- [x] 21. Implement refill (PURE)
  - [x] 21.1 Add `refill` to `js/board.js`
    - **Objective:** Fill every empty cell with a fresh valid gem so the board is full.
    - **Files/modules affected:** `js/board.js`; uses `gem.js`.
    - **Dependencies:** 14.1, 15.1, 20.1.
    - **Expected behavior:** `refill(board, rng = Math.random)` generates a fresh valid gem for each `null` cell (all at column tops after gravity); after refill every cell contains exactly one gem of a valid type.
    - **Tests required:** covered in 21.2.
    - _Requirements: 19.1, 19.2_

  - [x] 21.2 Write unit tests for refill
    - **Objective:** Verify the board is fully occupied with valid gems after refill.
    - **Files/modules affected:** `tests/board.test.js`.
    - **Dependencies:** 21.1.
    - **Expected behavior:** After refill, every one of the 64 cells holds exactly one gem whose type is one of the six.
    - **Tests required:** refill fills every cell with a valid gem (Req 25.10).
    - _Requirements: 19.1, 19.2, 25.10_

- [x] 22. Implement stable-board and consistency validation (PURE)
  - [x] 22.1 Add `isStableBoard` and `isDimensionAndTypeValid` to `js/board.js`
    - **Objective:** Provide the ready-to-play and intermediate-state validity checks.
    - **Files/modules affected:** `js/board.js`; uses `match.js`.
    - **Dependencies:** 15.1, 16.1.
    - **Expected behavior:** `isStableBoard(board)` true iff all 64 cells hold exactly one valid gem AND `findMatches` is empty. `isDimensionAndTypeValid(board)` true iff dimensions are 8×8 and every occupied cell has a valid type (transient empties allowed). Operations producing an invalid state reject and retain the prior Stable_Board.
    - **Tests required:** covered in 22.2.
    - _Requirements: 21.1, 21.2, 21.3, 21.5, 21.6_

  - [x] 22.2 Write unit tests for stable-board validation
    - **Objective:** Verify stable vs non-stable detection and dimension/type invariants.
    - **Files/modules affected:** `tests/board.test.js`.
    - **Dependencies:** 22.1.
    - **Expected behavior:** A full, match-free 8×8 board is stable; a board with a match or an empty cell is not stable; `isDimensionAndTypeValid` allows transient empties but rejects wrong dimensions/invalid types.
    - **Tests required:** stable-board invariant checks (Req 21.1, 21.6).
    - _Requirements: 21.1, 21.2, 21.3, 21.5, 21.6_

- [x] 23. Checkpoint — Ensure all pure-engine tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 24. Implement the Game Board screen (ONLY DOM module)
  - [ ] 24.1 Create `js/screens/game-board.js` with structure, selection, and rendering
    - **Objective:** Build the Game_Board_Screen conforming to the Screen Lifecycle Contract; render the 8×8 grid and manage selection state.
    - **Files/modules affected:** `js/screens/game-board.js` (new); imports `board.js`, `match.js`, `gem.js`, `board-config.js`.
    - **Dependencies:** 17.1, 18.1, 22.1.
    - **Expected behavior:** Export `createGameBoardScreen(config?)` returning `{ mount(container, ctx), unmount(), title }`. On mount, generate a Stable_Board and render an 8×8 grid of cells. Hold transient UI state: current board, `Selected_Gem` (or none), and an `isResolving` flag. Selection rules: activating an occupied cell with no selection sets `Selected_Gem` (Req 14.1) with a visual selection indication (Req 14.2); re-activating the selected cell clears selection (Req 14.3); activating a non-adjacent occupied cell re-selects it (Req 15.3); exactly one Selected_Gem retained until cleared or a swap is attempted (Req 14.4). It calls the pure engine for all logic and never embeds match/gravity/refill logic.
    - **Tests required:** covered in 24.2 and the integration tests (task 33).
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 15.3, 22.4_

  - [ ] 24.2 Implement swap orchestration on the Game Board screen
    - **Objective:** Wire selection → swap → keep/revert using the pure engine.
    - **Files/modules affected:** `js/screens/game-board.js`.
    - **Dependencies:** 24.1, 18.1, 16.1.
    - **Expected behavior:** When a Selected_Gem exists and the player activates an adjacent occupied cell, attempt a swap via `swapCells` (Req 15.1/15.2). If the resulting board has any match anywhere, keep the swap and clear selection (Req 15.4); otherwise revert both gems to pre-swap cells and clear selection (Req 15.5). Update the displayed board within the UI budget after a kept or reverted swap (Req 15.6).
    - **Tests required:** covered by integration tests (task 33) and the swap-revert unit test (18.2 / 33).
    - _Requirements: 15.1, 15.2, 15.4, 15.5, 15.6_

- [ ] 25. Implement cascade resolution orchestration
  - [ ] 25.1 Add the bounded cascade loop to `js/screens/game-board.js`
    - **Objective:** Automatically resolve chains until the board is Stable, blocking input meanwhile.
    - **Files/modules affected:** `js/screens/game-board.js`; uses `match.js` + `board.js`.
    - **Dependencies:** 24.2, 19.1, 20.1, 21.1, 16.1.
    - **Expected behavior:** After a kept swap, set `isResolving` (block new swaps, Req 20.4), then loop: detect matches → if none, stop (Stable, Req 20.3); otherwise remove (Req 17) → gravity (Req 18) → refill (Req 19) → repeat automatically (Req 20.1, 20.2). Loop carries an explicit iteration bound (guard, on the order of cell count) that never triggers under correct logic. Re-render after each resolved step and re-enable input on reaching a Stable_Board.
    - **Tests required:** covered in 25.2 and property tests (tasks 31, 32).
    - _Requirements: 20.1, 20.2, 20.3, 20.4_

  - [ ] 25.2 Write unit test for cascade resolution
    - **Objective:** Verify cascades continue until zero matches, yielding a Stable_Board.
    - **Files/modules affected:** `tests/game-board.test.js` (new) or `tests/board.test.js` for the loop helper.
    - **Dependencies:** 25.1.
    - **Expected behavior:** From a board arranged to chain, cascade resolution runs until no matches remain and the final board is a Stable_Board (64 valid gems, zero matches).
    - **Tests required:** cascade continues to Stable_Board (Req 25.12); cascade termination within the bound (design Property 8).
    - _Requirements: 20.1, 20.2, 20.3, 25.12_

- [ ] 26. Checkpoint — Ensure engine + orchestration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 27. Implement mouse and touch input
  - [ ] 27.1 Add click + tap cell activation to `js/screens/game-board.js`
    - **Objective:** Route mouse clicks and touch taps to a single discrete cell activation, no swipe/drag.
    - **Files/modules affected:** `js/screens/game-board.js`.
    - **Dependencies:** 24.1.
    - **Expected behavior:** A mouse click on a cell routes as a cell activation (Req 22.1); a touch tap routes identically (Req 22.2); activation is treated as a discrete click/tap on one cell — NO swipe/drag handlers are registered (Req 22.3). A visible change occurs within 100 ms of activation (Req 22.5). Input is ignored while `isResolving` (Req 20.4).
    - **Tests required:** covered in task 33 (click + tap route; no drag/swipe handlers).
    - _Requirements: 22.1, 22.2, 22.3, 22.5_

- [ ] 28. Add the return-to-menu control on the Game Board screen
  - [ ] 28.1 Add a return control to `js/screens/game-board.js`
    - **Objective:** Provide a control that returns the player to the Main_Menu.
    - **Files/modules affected:** `js/screens/game-board.js`.
    - **Dependencies:** 24.1.
    - **Expected behavior:** Render a control that, when activated, calls `ctx.navigate('main-menu')`, returning to the Main_Menu within the budget (Req 23.5, 24.3).
    - **Tests required:** covered in task 33 (return control navigates to `'main-menu'`).
    - _Requirements: 23.5, 24.3_

- [ ] 29. Integrate the Game Board screen into the registry
  - [ ] 29.1 Repoint the `'play'` entry in `js/config/screens.js`
    - **Objective:** Route the Play button to the Game Board screen with zero Phase 1 architecture changes.
    - **Files/modules affected:** `js/config/screens.js` (edit ONLY the `'play'` entry); imports `createGameBoardScreen`.
    - **Dependencies:** 24.1, 27.1, 28.1.
    - **Expected behavior:** Change `'play'`'s factory from the placeholder to `() => createGameBoardScreen()`. World Map, Boosters, Achievements, Settings entries remain placeholder screens unchanged (Req 24.2). No edits to `main.js`, `router.js`, or `main-menu.js`. `navigate('play')` mounts the Game_Board_Screen (Req 24.1); the return control navigates back (Req 24.3); gameplay modules integrate without modifying the Main_Menu UI_Module (Req 24.4).
    - **Tests required:** covered in task 33 (Play → Game Board, Game Board → Main Menu).
    - _Requirements: 24.1, 24.2, 24.3, 24.4_

- [ ] 30. Implement responsive board layout
  - [ ] 30.1 Create `css/game-board.css` and link it from `index.html`
    - **Objective:** Render a square 8×8 board that fits all viewports with no horizontal overflow.
    - **Files/modules affected:** `css/game-board.css` (new); `index.html` (add ONE stylesheet link only — the sole Phase 1 markup change, must not alter Phase 1 menu layout).
    - **Dependencies:** 24.1.
    - **Expected behavior:** The complete 8×8 board fits within the horizontal bounds across 320–2560px with zero horizontal overflow / no horizontal scrollbar (Req 23.1); every cell is square, width == height (Req 23.2); board centered horizontally when viewport > 768px (Req 23.3); vertical scroll permitted when content exceeds viewport height while horizontal overflow stays zero (Req 23.4); each cell is a Touch_Target ≥ 44×44px (Req 22.4). Reference theme custom properties (with fallbacks); no theme color literals.
    - **Tests required:** covered in task 33 (responsive layout across 320–2560px; cell squareness); manual/visual verification for pixel-exact breakpoints.
    - _Requirements: 22.4, 23.1, 23.2, 23.3, 23.4_

- [ ] 31. Write the required property test — Stable_Board invariant after cascade
  - [ ] 31.1 Add property test P1 (Stable_Board invariant)
    - **Objective:** Verify the board is always a Stable_Board when presented as ready after cascade resolution.
    - **Files/modules affected:** `tests/board.property.test.js` (new).
    - **Dependencies:** 25.1, 17.1, 22.1.
    - **Expected behavior:** Using fast-check with Vitest, minimum 100 iterations, seeded/injectable RNG: for many randomly generated boards and randomly chosen valid adjacent swaps resolved to completion, the resulting board is a Stable_Board — 64 cells, exactly one valid gem each, zero matches, 8×8. Tagged `// Feature: gemoria-crystal-quest, Property 1: Stable_Board when playable`.
    - **Tests required:** this property test (design Property 1).
    - _Requirements: 11.2, 19.2, 21.1, 21.6, 25.13 (design Property 1)_

- [ ] 32. Write the required property test — Gravity preserves per-column multiset
  - [ ] 32.1 Add property test P5 (gravity multiset/order preservation)
    - **Objective:** Verify gravity neither creates nor destroys gems within any column.
    - **Files/modules affected:** `tests/board.property.test.js`.
    - **Dependencies:** 20.1.
    - **Expected behavior:** Using fast-check with Vitest, minimum 100 iterations: for many randomly generated boards (including transient empties), applying gravity preserves, within each column, the multiset of non-empty gems and their relative vertical order. Tagged `// Feature: gemoria-crystal-quest, Property 5: Gravity preserves the gem multiset (and order)`.
    - **Tests required:** this property test (design Property 5).
    - _Requirements: 18.2, 18.3, 25.14 (design Property 5)_

- [ ] 33. Write integration / end-to-end tests for the Game Board screen (jsdom)
  - [ ] 33.1 Add jsdom UI/navigation integration tests
    - **Objective:** Verify input routing, swap behavior, navigation, and layout under jsdom with a spy `navigate`.
    - **Files/modules affected:** `tests/game-board.test.js`.
    - **Dependencies:** 27.1, 28.1, 29.1, 30.1.
    - **Expected behavior:** Mouse click routes as cell activation (Req 22.1); touch tap routes identically (Req 22.2); no drag/swipe handlers registered (Req 22.3); selecting an adjacent cell attempts a swap (Req 15.1); re-activating the selected cell deselects (Req 14.3); a swap producing no match reverts to pre-swap positions (Req 15.5 / Req 25.11); `navigate('play')` mounts the Game_Board_Screen (Req 24.1); the return control calls `navigate('main-menu')` (Req 23.5, 24.3); the rendered board has 8×8 cells with square, ≥44px touch targets and no horizontal overflow (Req 23.1, 23.2, 22.4).
    - **Tests required:** mouse input, touch input, adjacent swap attempt, swap revert (Req 25.11), deselect, Play→Game Board nav, Game Board→Main Menu nav, responsive/square cell checks.
    - _Requirements: 14.3, 15.1, 15.5, 22.1, 22.2, 22.3, 22.4, 23.1, 23.2, 23.5, 24.1, 24.3, 25.11_

- [ ] 34. Final cleanup — rename user-visible game title to "SnoopsGem : Crystal"
  - [ ] 34.1 Update user-visible title text only
    - **Objective:** Align the on-screen game name with the official title; text-only, no architecture change.
    - **Files/modules affected:** `js/screens/main-menu.js` (the hardcoded `TITLE_TEXT` constant); `README.md` and `index.html` user-visible title text if they show the old name.
    - **Dependencies:** none (independent, text-only).
    - **Expected behavior:** Every remaining user-visible "Gemoria: Crystal Quest" reference reads "SnoopsGem : Crystal". This changes only naming/text — it MUST NOT alter gameplay, Phase 1 module structure, the Router, or the registry. The Main_Menu still renders exactly one title (Req 5.1).
    - **Tests required:** update/confirm the existing title-text assertion equals "SnoopsGem : Crystal".
    - _Requirements: 5.1 (title display)_

- [ ] 35. Final checkpoint — Ensure all Phase 2 tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2 Notes

- Tasks marked with `*` would be optional; none are marked optional here because Req 25 makes the listed tests mandatory Phase 2 deliverables, and they are grouped as sub-tasks under their parents rather than standalone tasks.
- Each task references specific Requirement clauses (11–25) for traceability; property/test tasks additionally reference their design Correctness Property (P1, P5, P8).
- Property tests use **fast-check** with Vitest, a minimum of **100 iterations**, one property test per correctness property, each tagged `// Feature: gemoria-crystal-quest, Property N: ...`.
- Pure modules (`board.js`, `gem.js`, `match.js`) are tested without a DOM; the Game Board screen is tested under jsdom. All tests and manual verification run over HTTP (ES modules do not load from `file://`).
- **Phase 1 preserved:** the only integration touchpoints are the `'play'` registry repoint (29.1) and one added stylesheet link in `index.html` (30.1). `main.js`, `router.js`, and `main-menu.js` are otherwise untouched; task 34 changes only title text.
- **Extension points (out of Phase 2 scope):** special gems, line/rainbow crystals, bombs, obstacles, levels, world map, score/scoring, coins, lives, boosters, achievements, sound/music, save/load, and swipe/drag are NOT implemented. Future systems plug in via the **screen registry** (`js/config/screens.js`) and the **store scaffold** (`js/state/game-state.js`), following the pure-logic-decoupled-from-UI pattern established here.

### Phase 2 Requirements coverage (11–25)

- 11 → 13.1, 15.1/15.2, 17.2; 12 → 13.1, 14.1/14.2, 15.1/15.2; 13 → 17.1/17.2; 14 → 24.1; 15 → 18.1/18.2, 24.2, 33.1; 16 → 16.1/16.2; 17 → 19.1/19.2; 18 → 20.1/20.2, 32.1; 19 → 21.1/21.2; 20 → 25.1/25.2; 21 → 22.1/22.2, 31.1; 22 → 24.1, 27.1, 30.1, 33.1; 23 → 28.1, 30.1, 33.1; 24 → 29.1, 33.1; 25 → 14.2, 16.2, 17.2, 18.2, 19.2, 20.2, 21.2, 22.2, 25.2, 31.1, 32.1, 33.1.
- Every Requirement 11–25 is covered by at least one task. No mandatory test from Req 25 is missing.

## Phase 2 Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["13.1"] },
    { "id": 1, "tasks": ["14.1"] },
    { "id": 2, "tasks": ["14.2", "15.1"] },
    { "id": 3, "tasks": ["15.2", "16.1"] },
    { "id": 4, "tasks": ["16.2", "17.1", "18.1", "19.1", "20.1"] },
    { "id": 5, "tasks": ["17.2", "18.2", "19.2", "20.2", "21.1", "22.1", "32.1"] },
    { "id": 6, "tasks": ["21.2", "22.2", "24.1"] },
    { "id": 7, "tasks": ["24.2", "27.1", "28.1"] },
    { "id": 8, "tasks": ["25.1"] },
    { "id": 9, "tasks": ["25.2", "29.1", "30.1", "31.1"] },
    { "id": 10, "tasks": ["33.1", "34.1"] }
  ]
}
```
