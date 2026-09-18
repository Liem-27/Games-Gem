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

- [x] 24. Implement the Game Board screen (ONLY DOM module)
  - [x] 24.1 Create `js/screens/game-board.js` with structure, selection, and rendering
    - **Objective:** Build the Game_Board_Screen conforming to the Screen Lifecycle Contract; render the 8×8 grid and manage selection state.
    - **Files/modules affected:** `js/screens/game-board.js` (new); imports `board.js`, `match.js`, `gem.js`, `board-config.js`.
    - **Dependencies:** 17.1, 18.1, 22.1.
    - **Expected behavior:** Export `createGameBoardScreen(config?)` returning `{ mount(container, ctx), unmount(), title }`. On mount, generate a Stable_Board and render an 8×8 grid of cells. Hold transient UI state: current board, `Selected_Gem` (or none), and an `isResolving` flag. Selection rules: activating an occupied cell with no selection sets `Selected_Gem` (Req 14.1) with a visual selection indication (Req 14.2); re-activating the selected cell clears selection (Req 14.3); activating a non-adjacent occupied cell re-selects it (Req 15.3); exactly one Selected_Gem retained until cleared or a swap is attempted (Req 14.4). It calls the pure engine for all logic and never embeds match/gravity/refill logic.
    - **Tests required:** covered in 24.2 and the integration tests (task 33).
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 15.3, 22.4_

  - [x] 24.2 Implement swap orchestration on the Game Board screen
    - **Objective:** Wire selection → swap → keep/revert using the pure engine.
    - **Files/modules affected:** `js/screens/game-board.js`.
    - **Dependencies:** 24.1, 18.1, 16.1.
    - **Expected behavior:** When a Selected_Gem exists and the player activates an adjacent occupied cell, attempt a swap via `swapCells` (Req 15.1/15.2). If the resulting board has any match anywhere, keep the swap and clear selection (Req 15.4); otherwise revert both gems to pre-swap cells and clear selection (Req 15.5). Update the displayed board within the UI budget after a kept or reverted swap (Req 15.6).
    - **Tests required:** covered by integration tests (task 33) and the swap-revert unit test (18.2 / 33).
    - _Requirements: 15.1, 15.2, 15.4, 15.5, 15.6_

- [x] 25. Implement cascade resolution orchestration
  - [x] 25.1 Add the bounded cascade loop to `js/screens/game-board.js`
    - **Objective:** Automatically resolve chains until the board is Stable, blocking input meanwhile.
    - **Files/modules affected:** `js/screens/game-board.js`; uses `match.js` + `board.js`.
    - **Dependencies:** 24.2, 19.1, 20.1, 21.1, 16.1.
    - **Expected behavior:** After a kept swap, set `isResolving` (block new swaps, Req 20.4), then loop: detect matches → if none, stop (Stable, Req 20.3); otherwise remove (Req 17) → gravity (Req 18) → refill (Req 19) → repeat automatically (Req 20.1, 20.2). Loop carries an explicit iteration bound (guard, on the order of cell count) that never triggers under correct logic. Re-render after each resolved step and re-enable input on reaching a Stable_Board.
    - **Tests required:** covered in 25.2 and property tests (tasks 31, 32).
    - _Requirements: 20.1, 20.2, 20.3, 20.4_

  - [x] 25.2 Write unit test for cascade resolution
    - **Objective:** Verify cascades continue until zero matches, yielding a Stable_Board.
    - **Files/modules affected:** `tests/game-board.test.js` (new) or `tests/board.test.js` for the loop helper.
    - **Dependencies:** 25.1.
    - **Expected behavior:** From a board arranged to chain, cascade resolution runs until no matches remain and the final board is a Stable_Board (64 valid gems, zero matches).
    - **Tests required:** cascade continues to Stable_Board (Req 25.12); cascade termination within the bound (design Property 8).
    - _Requirements: 20.1, 20.2, 20.3, 25.12_

- [x] 26. Checkpoint — Ensure engine + orchestration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 27. Implement mouse and touch input
  - [x] 27.1 Add click + tap cell activation to `js/screens/game-board.js`
    - **Objective:** Route mouse clicks and touch taps to a single discrete cell activation, no swipe/drag.
    - **Files/modules affected:** `js/screens/game-board.js`.
    - **Dependencies:** 24.1.
    - **Expected behavior:** A mouse click on a cell routes as a cell activation (Req 22.1); a touch tap routes identically (Req 22.2); activation is treated as a discrete click/tap on one cell — NO swipe/drag handlers are registered (Req 22.3). A visible change occurs within 100 ms of activation (Req 22.5). Input is ignored while `isResolving` (Req 20.4).
    - **Tests required:** covered in task 33 (click + tap route; no drag/swipe handlers).
    - _Requirements: 22.1, 22.2, 22.3, 22.5_

- [x] 28. Add the return-to-menu control on the Game Board screen
  - [x] 28.1 Add a return control to `js/screens/game-board.js`
    - **Objective:** Provide a control that returns the player to the Main_Menu.
    - **Files/modules affected:** `js/screens/game-board.js`.
    - **Dependencies:** 24.1.
    - **Expected behavior:** Render a control that, when activated, calls `ctx.navigate('main-menu')`, returning to the Main_Menu within the budget (Req 23.5, 24.3).
    - **Tests required:** covered in task 33 (return control navigates to `'main-menu'`).
    - _Requirements: 23.5, 24.3_

- [x] 29. Integrate the Game Board screen into the registry
  - [x] 29.1 Repoint the `'play'` entry in `js/config/screens.js`
    - **Objective:** Route the Play button to the Game Board screen with zero Phase 1 architecture changes.
    - **Files/modules affected:** `js/config/screens.js` (edit ONLY the `'play'` entry); imports `createGameBoardScreen`.
    - **Dependencies:** 24.1, 27.1, 28.1.
    - **Expected behavior:** Change `'play'`'s factory from the placeholder to `() => createGameBoardScreen()`. World Map, Boosters, Achievements, Settings entries remain placeholder screens unchanged (Req 24.2). No edits to `main.js`, `router.js`, or `main-menu.js`. `navigate('play')` mounts the Game_Board_Screen (Req 24.1); the return control navigates back (Req 24.3); gameplay modules integrate without modifying the Main_Menu UI_Module (Req 24.4).
    - **Tests required:** covered in task 33 (Play → Game Board, Game Board → Main Menu).
    - _Requirements: 24.1, 24.2, 24.3, 24.4_

- [x] 30. Implement responsive board layout
  - [x] 30.1 Create `css/game-board.css` and link it from `index.html`
    - **Objective:** Render a square 8×8 board that fits all viewports with no horizontal overflow.
    - **Files/modules affected:** `css/game-board.css` (new); `index.html` (add ONE stylesheet link only — the sole Phase 1 markup change, must not alter Phase 1 menu layout).
    - **Dependencies:** 24.1.
    - **Expected behavior:** The complete 8×8 board fits within the horizontal bounds across 320–2560px with zero horizontal overflow / no horizontal scrollbar (Req 23.1); every cell is square, width == height (Req 23.2); board centered horizontally when viewport > 768px (Req 23.3); vertical scroll permitted when content exceeds viewport height while horizontal overflow stays zero (Req 23.4); each cell is a Touch_Target ≥ 44×44px (Req 22.4). Reference theme custom properties (with fallbacks); no theme color literals.
    - **Tests required:** covered in task 33 (responsive layout across 320–2560px; cell squareness); manual/visual verification for pixel-exact breakpoints.
    - _Requirements: 22.4, 23.1, 23.2, 23.3, 23.4_

- [x] 31. Write the required property test — Stable_Board invariant after cascade
  - [x] 31.1 Add property test P1 (Stable_Board invariant)
    - **Objective:** Verify the board is always a Stable_Board when presented as ready after cascade resolution.
    - **Files/modules affected:** `tests/board.property.test.js` (new).
    - **Dependencies:** 25.1, 17.1, 22.1.
    - **Expected behavior:** Using fast-check with Vitest, minimum 100 iterations, seeded/injectable RNG: for many randomly generated boards and randomly chosen valid adjacent swaps resolved to completion, the resulting board is a Stable_Board — 64 cells, exactly one valid gem each, zero matches, 8×8. Tagged `// Feature: gemoria-crystal-quest, Property 1: Stable_Board when playable`.
    - **Tests required:** this property test (design Property 1).
    - _Requirements: 11.2, 19.2, 21.1, 21.6, 25.13 (design Property 1)_

- [x] 32. Write the required property test — Gravity preserves per-column multiset
  - [x] 32.1 Add property test P5 (gravity multiset/order preservation)
    - **Objective:** Verify gravity neither creates nor destroys gems within any column.
    - **Files/modules affected:** `tests/board.property.test.js`.
    - **Dependencies:** 20.1.
    - **Expected behavior:** Using fast-check with Vitest, minimum 100 iterations: for many randomly generated boards (including transient empties), applying gravity preserves, within each column, the multiset of non-empty gems and their relative vertical order. Tagged `// Feature: gemoria-crystal-quest, Property 5: Gravity preserves the gem multiset (and order)`.
    - **Tests required:** this property test (design Property 5).
    - _Requirements: 18.2, 18.3, 25.14 (design Property 5)_

- [x] 33. Write integration / end-to-end tests for the Game Board screen (jsdom)
  - [x] 33.1 Add jsdom UI/navigation integration tests
    - **Objective:** Verify input routing, swap behavior, navigation, and layout under jsdom with a spy `navigate`.
    - **Files/modules affected:** `tests/game-board.test.js`.
    - **Dependencies:** 27.1, 28.1, 29.1, 30.1.
    - **Expected behavior:** Mouse click routes as cell activation (Req 22.1); touch tap routes identically (Req 22.2); no drag/swipe handlers registered (Req 22.3); selecting an adjacent cell attempts a swap (Req 15.1); re-activating the selected cell deselects (Req 14.3); a swap producing no match reverts to pre-swap positions (Req 15.5 / Req 25.11); `navigate('play')` mounts the Game_Board_Screen (Req 24.1); the return control calls `navigate('main-menu')` (Req 23.5, 24.3); the rendered board has 8×8 cells with square, ≥44px touch targets and no horizontal overflow (Req 23.1, 23.2, 22.4).
    - **Tests required:** mouse input, touch input, adjacent swap attempt, swap revert (Req 25.11), deselect, Play→Game Board nav, Game Board→Main Menu nav, responsive/square cell checks.
    - _Requirements: 14.3, 15.1, 15.5, 22.1, 22.2, 22.3, 22.4, 23.1, 23.2, 23.5, 24.1, 24.3, 25.11_

- [x] 34. Final cleanup — rename user-visible game title to "SnoopsGem : Crystal"
  - [x] 34.1 Update user-visible title text only
    - **Objective:** Align the on-screen game name with the official title; text-only, no architecture change.
    - **Files/modules affected:** `js/screens/main-menu.js` (the hardcoded `TITLE_TEXT` constant); `README.md` and `index.html` user-visible title text if they show the old name.
    - **Dependencies:** none (independent, text-only).
    - **Expected behavior:** Every remaining user-visible "Gemoria: Crystal Quest" reference reads "SnoopsGem : Crystal". This changes only naming/text — it MUST NOT alter gameplay, Phase 1 module structure, the Router, or the registry. The Main_Menu still renders exactly one title (Req 5.1).
    - **Tests required:** update/confirm the existing title-text assertion equals "SnoopsGem : Crystal".
    - _Requirements: 5.1 (title display)_

- [x] 35. Final checkpoint — Ensure all Phase 2 tests pass
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

---

# Phase 3 Implementation Plan: Special Gems, Scoring, and Data-Driven Levels

## Phase 3 Overview

This plan implements **Phase 3 only**: special gems, special activation and combinations, a deterministic scoring system, and a data-driven single-level system (move limit, objective, win/lose, restart) for **SnoopsGem : Crystal**, built strictly **additively** on the completed, 106/106-passing Phase 2 engine.

The build order follows the Phase 3 design bottom-up and additive: extend the gem model first, then match classification, then special-gem creation, then activation, then the seven combinations, then the pure `resolveMove` orchestrator, then scoring, then the Level_Engine, then the DOM screen (HUD/specials/restart/input gating), and finally the full test matrix (unit, combination, classification, cascade, score, level, jsdom integration, deterministic-RNG, and property tests P2/P3/P4/P6 plus explicit preservation of P1/P5). Every step is independently testable, and each module is integrated by the time the Game Board screen drives it — no orphaned code.

**Design keystone.** The entire per-move resolution (classify → create specials → activate → remove → gravity → refill → cascade → repeat) is a **pure** `resolveMove(board, action, { rng, idSource })` returning a board plus a `ResolutionReport`. The DOM screen calls it and renders the result; it never re-implements any rule. This keeps cascade + special + score logic unit- and property-testable without a DOM.

Implementation language: **Vanilla JavaScript (ES modules)**, as in Phases 1–2. Framework: **Vitest** with **fast-check** (minimum 100 iterations per property). Pure modules (`gem.js`, `match.js`, `special-gems.js`, `resolution.js`, `level.js`, both configs) are tested without a DOM; the Game Board screen is tested under jsdom. Every place randomness affects assertions uses an **injectable RNG** plus a **deterministic id source**; `Math.random` is never used where determinism is asserted. All code is served over HTTP.

**Phase 1 and Phase 2 architecture is preserved.** `js/main.js` and `js/router.js` are **not modified** (no Phase 3 requirement forces it). The `'play'` registry entry already points at `createGameBoardScreen` from Phase 2 and stays that way; the four other placeholder entries are unchanged. All Phase 2 pure APIs remain callable exactly as before — a board of only normal gems behaves identically to Phase 2. The only Phase 2 file touched is `js/screens/game-board.js` (the DOM screen), which grows to render the HUD/specials and drive `resolveMove` + `Level_Engine`.

**Implementation boundary (out of scope for Phase 3):** world map, lives/hearts, coins/economy, shop/store, boosters beyond special gems, achievements, audio/music, persistence/save/load, backend, authentication/accounts, multiplayer, ads/social features, advanced obstacles (ice/chain/stone/portals/blockers), full 100-level content production, swipe/drag gestures, and animation-heavy effects beyond what correctness needs. None of these are implemented here.

## Phase 3 Tasks

### Group 1 — Foundation / Gem Model

- [x] 36. Extend the gem model for special gems and unique ids (PURE, backward-compatible)
  - [x] 36.1 Extend `js/gem.js` with baseType/specialType/id and a `type` alias
    - **Objective:** Extend the gem to carry `baseType`, `specialType`, and a guaranteed unique `id`, while keeping `type` as a read alias for `baseType` so all Phase 2 logic works unchanged.
    - **Files/modules affected:** `js/gem.js` (extended); imports `js/config/board-config.js`.
    - **Dependencies:** none (Phase 2 complete).
    - **Expected behavior:** A gem is `{ baseType, specialType, id }` with `type` an own read alias equal to `baseType`. `createGem(baseType, { specialType = 'normal', id } = {})` returns a full gem or a `null`-signal if `baseType` is not a valid base type or `specialType` is not one of the five defined special types; the Phase 2 2-arg form `createGem(type, id)` (second arg a string/number) is preserved as an overload with `specialType` defaulting to `'normal'`. A `rainbow` gem still carries a valid `baseType` (never `null`); its base type is not used to decide its own effect. Add `isSpecial(gem)` (true iff `specialType !== 'normal'`) and `isValidSpecialType(specialType)` (true iff one of the five). A board of only normal gems (`specialType === 'normal'`, `type === baseType`) is behaviorally identical to Phase 2.
    - **Tests required:** covered in 36.3.
    - _Requirements: 26.1, 26.2, 26.3, 26.5, 26.6, 26.7, 26.8, 44.3_

  - [x] 36.2 Add a monotonic id source and thread it through `randomGem`
    - **Objective:** Guarantee Gem_ID uniqueness via a deterministic monotonic counter (not `Math.random`) and make refill/generation assign ids.
    - **Files/modules affected:** `js/gem.js`.
    - **Dependencies:** 36.1.
    - **Expected behavior:** Export `createIdSource(start = 1)` returning `{ next() }` that yields `start, start+1, …` (deterministic, reproducible). Change `randomGem(rng = Math.random, idSource)` to assign `id = idSource.next()` when an id source is provided, and preserve exact Phase 2 behavior (no/undefined id) when `idSource` is omitted, so existing Phase 2 `randomGem` tests are unaffected.
    - **Tests required:** covered in 36.3.
    - _Requirements: 26.4, 26.5_

  - [x] 36.3 Write unit tests for the extended gem model
    - **Objective:** Verify the extended model, backward-compatibility, id uniqueness, and validation.
    - **Files/modules affected:** `tests/gem.test.js` (extended).
    - **Dependencies:** 36.1, 36.2.
    - **Expected behavior:** `createGem` accepts each of the six base types with each of the five special types; rejects an invalid `baseType` and an invalid `specialType` (null-signal, no assignment); `type === baseType` for every gem including specials; a normal gem produced by the Phase 2 2-arg form is unchanged in shape/behavior; `isSpecial` and `isValidSpecialType` classify correctly; `createIdSource` yields strictly increasing unique ids; `randomGem` with an id source assigns unique ids and without one preserves Phase 2 behavior.
    - **Tests required:** five special-type validation, invalid-specialType rejection, `type` alias equality, backward-compat normal-gem shape, monotonic-unique ids.
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.7, 26.8_

### Group 2 — Match Classification

- [x] 37. Add match classification alongside unchanged `findMatches` (PURE)
  - [x] 37.1 Add `classifyMatches` to `js/match.js`
    - **Objective:** Distinguish match shapes and combined H/V structures deterministically while leaving `findMatches`/`hasMatches` unchanged.
    - **Files/modules affected:** `js/match.js` (extended); imports `js/config/board-config.js`.
    - **Dependencies:** 36.1.
    - **Expected behavior:** `findMatches(board)` and `hasMatches(board)` are byte-for-byte unchanged (same signatures, same sorted-deduped `{row,col}[]`). New `classifyMatches(board)` returns `{ structures, allCells }` where each `MatchStructure` is `{ kind, cells, pivot, baseType }` with `kind ∈ {'three','line_h4','line_v4','rainbow5','bomb_T','bomb_L'}`. It collects horizontal runs per row and vertical runs per column (length ≥ MIN_MATCH), unions runs that share any cell into one crossing structure, computes the shared cell as `pivot`, and classifies: `bomb_T` when the pivot is an interior cell of at least one run (not simultaneously an endpoint of both), `bomb_L` when the pivot is an endpoint of both runs; independent straight runs classify as `three` (len 3), `line_h4`/`line_v4` (len 4 by orientation), or `rainbow5` (len ≥ 5). Precedence assigns exactly one kind per structure: T/L bomb > rainbow5 > line4 > three. Structures and cells are emitted in reading order; repeated calls are identical; `allCells` equals `findMatches(board)` exactly.
    - **Tests required:** covered in 37.2.
    - _Requirements: 33.1, 33.2, 33.3_

  - [x] 37.2 Write unit tests for match classification
    - **Objective:** Verify shape classification, overlap analysis, precedence, determinism, and `allCells` agreement.
    - **Files/modules affected:** `tests/match.test.js` (extended).
    - **Dependencies:** 37.1.
    - **Expected behavior:** A plain 3-match classifies as `three`; a horizontal run of exactly 4 as `line_h4`; a vertical run of exactly 4 as `line_v4`; a straight run of 5+ as `rainbow5`; a T intersection as `bomb_T` (interior pivot); an L intersection as `bomb_L` (both-endpoint pivot); overlapping H/V runs are analyzed as one combined structure with the correct pivot; precedence yields exactly one kind per structure (T/L > rainbow5 > line4 > three); repeated calls return identical results; `classifyMatches(board).allCells === findMatches(board)`; a board with no run produces zero structures and empty `allCells`.
    - **Tests required:** 3-match, horizontal 4, vertical 4, 5+, T, L, overlapping runs, precedence, determinism, `allCells` agreement, no accidental classification for a plain 3-match.
    - _Requirements: 33.1, 33.2, 33.3_

### Group 3 — Special Gem Creation

- [ ] 38. Implement deterministic special-gem creation from structures (PURE)
  - [ ] 38.1 Add `createSpecialForStructure` and the Creation_Cell policy to `js/special-gems.js`
    - **Objective:** Mint the correct special gem for each qualifying structure at a deterministic Creation_Cell.
    - **Files/modules affected:** `js/special-gems.js` (new); imports `js/gem.js`, `js/config/board-config.js`.
    - **Dependencies:** 36.1, 36.2, 37.1.
    - **Expected behavior:** `createSpecialForStructure(structure, creationCell, idSource)` returns a special gem retaining the structure's shared `baseType` with `specialType` per the structure→special map: `line_h4`→`line_horizontal`, `line_v4`→`line_vertical`, `rainbow5`→`rainbow`, `bomb_T`/`bomb_L`→`bomb`, `three`→none. The Creation_Cell policy is a single deterministic rule, independent of DOM ordering: (1) if the structure has a pivot (T/L), use the pivot; (2) else if the move's triggering swapped/pivot cell belongs to the structure's cells, use that swapped cell; (3) else use the structure cell with the smallest `(row, col)` in reading order. Each minted special gets a unique id from `idSource`. Also export `isSpecial(gem)` and `isValidSpecialType(specialType)` (re-exported/aligned with `gem.js`).
    - **Tests required:** covered in 38.3 and 40.x.
    - _Requirements: 27.1, 27.2, 27.3, 28.1, 28.2, 29.1, 29.2_

  - [ ] 38.2 Implement creation-before-removal with preservation of the created special
    - **Objective:** Provide the per-round helper that creates specials on a working copy before removing the rest of a matched structure.
    - **Files/modules affected:** `js/special-gems.js`.
    - **Dependencies:** 38.1.
    - **Expected behavior:** For each qualifying structure in a round, mint its special via `createSpecialForStructure` and write it at its Creation_Cell **before** removal; the round's removal set is all matched cells **minus** the Creation_Cells that now hold a freshly created special (those are preserved). A structure classified as `three` creates no special (Req 27.5). A straight run of fewer than five creates no rainbow (Req 28.4); a simple straight match with no T/L intersection creates no bomb (Req 29.4). Exactly one special is created per independent matched structure. This helper is pure and DOM-free; it is consumed by `resolveMove` in Group 6.
    - **Tests required:** covered in 38.3.
    - _Requirements: 27.4, 27.5, 28.3, 28.4, 29.3, 29.4, 33.4_

  - [ ] 38.3 Write unit tests for special-gem creation
    - **Objective:** Verify created special types, deterministic Creation_Cell, preservation, and absence of accidental creation.
    - **Files/modules affected:** `tests/special-gems.test.js` (new).
    - **Dependencies:** 38.1, 38.2.
    - **Expected behavior:** A `line_h4` creates a `line_horizontal`, `line_v4` a `line_vertical`, `rainbow5` a `rainbow`, and T/L a `bomb`, each retaining the structure's base type; Creation_Cell follows the pivot / swapped-cell / reading-order rules deterministically (same board+action ⇒ same cell); the created special is preserved at its Creation_Cell while the structure's other matched gems are removed; a plain 3-match creates no special; a <5 straight creates no rainbow; a straight non-intersection creates no bomb; created specials get unique ids from the injected id source.
    - **Tests required:** each creation type, deterministic Creation_Cell (all three rule branches), preservation, no accidental creation (3-match/<5/straight-no-bomb).
    - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 28.1, 28.2, 28.3, 28.4, 29.1, 29.2, 29.3, 29.4, 33.4_

### Group 4 — Special Activation

- [ ] 39. Implement special-gem activation with clipping, chaining, and cascade integration (PURE)
  - [ ] 39.1 Add `effectCells` for each single-special effect to `js/special-gems.js`
    - **Objective:** Compute the exact affected-cell set for one special, boundary-clipped, with rainbow base-type captured pre-removal.
    - **Files/modules affected:** `js/special-gems.js`; imports `js/config/board-config.js`.
    - **Dependencies:** 38.1.
    - **Expected behavior:** For a special at `(r, c)`: `line_horizontal` → every cell in row `r`; `line_vertical` → every cell in column `c`; `bomb` → the clipped 3×3 block centered on `(r, c)` (intersected with `0..ROWS-1`/`0..COLS-1`, so 2×3 / 3×2 / 2×2 at edges/corners, never out-of-range); `rainbow` + normal partner → every cell whose gem `baseType` equals the partner normal gem's `baseType`, captured **before** any removal (a rainbow with no normal partner clears only itself). Signature `effectCells(board, specialGem, context)` where `context` carries the rainbow partner base type when applicable. Every returned coordinate satisfies `0 ≤ row ≤ 7` and `0 ≤ col ≤ 7`.
    - **Tests required:** covered in 39.4.
    - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5, 44.3_

  - [ ] 39.2 Add the chain-activation worklist `activateSpecials`
    - **Objective:** Fire chained specials deterministically, once each, bounded, deduping affected cells.
    - **Files/modules affected:** `js/special-gems.js`.
    - **Dependencies:** 39.1.
    - **Expected behavior:** `activateSpecials(board, triggerCells)` returns `{ affected, activations }`. It runs a worklist keyed by Gem_ID with a visited (`processed`) set: process specials in reading order; for each unprocessed special add its `effectCells` to the `affected` set; when an affected cell holds another special not yet processed, enqueue it (kept in reading order). Each special fires at most once (single activation per trigger), the `affected` set dedupes cells so no duplicate removal occurs, and the loop is bounded by the 64 cells with an explicit `MAX_ACTIVATION_STEPS = ROWS * COLS` safety guard so it always terminates.
    - **Tests required:** covered in 39.4.
    - _Requirements: 30.6, 30.7, 43.5, 44.1, 44.2_

  - [ ] 39.3 Handle pre-existing specials inside a matched structure (activate, not convert)
    - **Objective:** Ensure a special caught within a matched structure is activated within the same resolution rather than silently converted to a normal gem.
    - **Files/modules affected:** `js/special-gems.js` (worklist entry hook), consumed by `js/resolution.js` in Group 6.
    - **Dependencies:** 39.2.
    - **Expected behavior:** When a matched structure's cells include a cell already holding a special gem, that special's cell is added to the activation worklist so its clearing effect fires in the same round; the structure may still create a new special at its Creation_Cell per the creation rules, and the pre-existing special is never converted to a normal gem.
    - **Tests required:** covered in 39.4.
    - _Requirements: 33.5_

  - [ ] 39.4 Write unit tests for special activation
    - **Objective:** Verify per-type effects, edge/corner clipping, chaining, dedup, single-fire, and pre-existing-special handling.
    - **Files/modules affected:** `tests/special-gems.test.js`.
    - **Dependencies:** 39.1, 39.2, 39.3.
    - **Expected behavior:** `line_horizontal` clears exactly its row; `line_vertical` clears exactly its column; `rainbow` + normal clears exactly the cells matching the partner's pre-captured base type; `bomb` clears the clipped 3×3 (verify 2×3, 3×2, 2×2 at edges/corners with no out-of-range access); a chain of specials fires each special exactly once, terminates, and the affected set contains each cell once (no duplicate removal); a pre-existing special within a matched structure is activated (its effect appears) and not converted to normal.
    - **Tests required:** line_horizontal, line_vertical, rainbow (pre-capture), bomb 3×3, edge/corner clipping, chain termination + single-fire, no duplicate removal, pre-existing-special activation.
    - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5, 30.6, 30.7, 33.5, 43.5, 44.1, 44.2_

- [ ] 40. Checkpoint — Ensure gem/classification/creation/activation tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Group 5 — Special Combinations (all seven)

- [ ] 41. Implement the combination dispatcher and consumption rules (PURE)
  - [ ] 41.1 Add `combine` dispatch, precedence, and consumption to `js/special-gems.js`
    - **Objective:** Provide the combination entry point that fires only on a player swap of two adjacent specials, consuming both once and taking precedence over individual activation.
    - **Files/modules affected:** `js/special-gems.js`.
    - **Dependencies:** 39.1, 39.2.
    - **Expected behavior:** `combine(board, aCell, bCell)` returns `{ affected, kind }` or `null` when the pair is not a valid special+special combination. It fires **only** when two special gems are swapped into adjacency (the combination cell `X` is where the moved gem lands; `Y` is the swapped-with neighbor). Both participating specials are consumed exactly once (their cells are in `affected`), the combination effect takes precedence over each gem's individual activation, and two specials merely co-existing without a swap never auto-combine. Any *third* special caught in the cleared set is activated once via the Group 4 chain worklist. `CombinationKind ∈ {'line_line','rainbow_normal','rainbow_line','rainbow_rainbow','bomb_line','bomb_rainbow','bomb_bomb'}`. All returned coordinates are clipped to the board.
    - **Tests required:** covered per-combination in 41.3–41.9 and the shared 41.10.
    - _Requirements: 31.8, 31.9, 32.1, 32.2, 32.3_

  - [ ] 41.2 Implement line+line combination
    - **Objective:** Clear the full row and full column intersecting at the combination cell.
    - **Files/modules affected:** `js/special-gems.js`.
    - **Dependencies:** 41.1.
    - **Expected behavior:** For two line crystals combined at `X = (r, c)`, `affected = row(r) ∪ col(c)`; `kind = 'line_line'`. Both participants consumed once; overlapping cell counted once.
    - **Tests required:** covered in 41.3.
    - _Requirements: 31.1_

  - [ ] 41.3 Write unit test for line+line combination
    - **Objective:** Verify the row∪column clear at the combination cell.
    - **Files/modules affected:** `tests/special-gems.test.js`.
    - **Dependencies:** 41.2.
    - **Expected behavior:** Combining two line crystals at `(r, c)` clears exactly every cell in row `r` and column `c` (deduped), both participants consumed once, edge cases (combination at an edge/corner) covered by row/column membership.
    - **Tests required:** line+line affected-set correctness, both consumed once.
    - _Requirements: 31.1_

  - [ ] 41.4 Implement and test rainbow+normal combination
    - **Objective:** Clear every cell whose base type equals the normal partner's base type, captured pre-removal.
    - **Files/modules affected:** `js/special-gems.js`; `tests/special-gems.test.js`.
    - **Dependencies:** 41.1.
    - **Expected behavior:** Implementation: capture the normal partner's `baseType` `B` before any removal; `affected` = every cell whose gem `baseType === B` plus the participants; rainbow consumed; `kind = 'rainbow_normal'`. Test: verify all and only base-type-`B` cells are cleared, the base type is captured before removal, and both participants are consumed once.
    - **Tests required:** rainbow+normal affected-set correctness, pre-removal capture, participants consumed once.
    - _Requirements: 31.2_

  - [ ] 41.5 Implement and test rainbow+line combination
    - **Objective:** Clear the full row and column of every cell holding the line partner's base type.
    - **Files/modules affected:** `js/special-gems.js`; `tests/special-gems.test.js`.
    - **Dependencies:** 41.1.
    - **Expected behavior:** Implementation: `B` = the line partner's `baseType`; `affected = ⋃_{cells g with g.baseType === B} (row(g.row) ∪ col(g.col))`, clipped; `kind = 'rainbow_line'`. Test: verify the affected set equals the union of full rows and columns of all base-type-`B` cells (deduped), deterministic, both participants consumed once.
    - **Tests required:** rainbow+line affected-set correctness, determinism, participants consumed once.
    - _Requirements: 31.3_

  - [ ] 41.6 Implement and test rainbow+rainbow combination
    - **Objective:** Clear the entire board.
    - **Files/modules affected:** `js/special-gems.js`; `tests/special-gems.test.js`.
    - **Dependencies:** 41.1.
    - **Expected behavior:** Implementation: `affected` = all `ROWS*COLS` (64) cells; `kind = 'rainbow_rainbow'`. Test: verify all 64 cells are in the affected set, both participants consumed once.
    - **Tests required:** rainbow+rainbow full-board clear, participants consumed once.
    - _Requirements: 31.4_

  - [ ] 41.7 Implement and test bomb+line combination
    - **Objective:** Clear a clipped 3-wide band (row-band or column-band) centered on the combination cell by line orientation.
    - **Files/modules affected:** `js/special-gems.js`; `tests/special-gems.test.js`.
    - **Dependencies:** 41.1.
    - **Expected behavior:** Implementation: if the line partner is horizontal, `affected` = the clipped 3-row band `rows r-1..r+1` across all columns; if vertical, the clipped 3-col band `cols c-1..c+1` across all rows; centered on `X = (r, c)`; `kind = 'bomb_line'`. Test: verify the correct band per orientation with edge/corner clipping (no out-of-range), both participants consumed once.
    - **Tests required:** bomb+line horizontal band, vertical band, edge/corner clipping, participants consumed once.
    - _Requirements: 31.5_

  - [ ] 41.8 Implement and test bomb+rainbow combination
    - **Objective:** Clear all cells of the bomb's base type plus the clipped 3×3 around the combination cell.
    - **Files/modules affected:** `js/special-gems.js`; `tests/special-gems.test.js`.
    - **Dependencies:** 41.1.
    - **Expected behavior:** Implementation: `B` = the bomb's `baseType`; `affected = { g : g.baseType === B } ∪ bomb3x3(X)` (3×3 clipped); `kind = 'bomb_rainbow'`. Test: verify all base-type-`B` cells plus the clipped 3×3 are cleared (deduped), edge/corner clipping, both participants consumed once.
    - **Tests required:** bomb+rainbow affected-set correctness, clipping, participants consumed once.
    - _Requirements: 31.6_

  - [ ] 41.9 Implement and test bomb+bomb combination
    - **Objective:** Clear a clipped 5×5 block centered on the combination cell.
    - **Files/modules affected:** `js/special-gems.js`; `tests/special-gems.test.js`.
    - **Dependencies:** 41.1.
    - **Expected behavior:** Implementation: `affected` = the clipped 5×5 block `max(0,r-2)..min(ROWS-1,r+2) × max(0,c-2)..min(COLS-1,c+2)`; `kind = 'bomb_bomb'`. Test: verify the 5×5 block with edge/corner clipping (no out-of-range), both participants consumed once.
    - **Tests required:** bomb+bomb 5×5 clear, edge/corner clipping, participants consumed once.
    - _Requirements: 31.7_

  - [ ] 41.10 Write shared combination-rules tests (precedence, consumption, no auto-combine)
    - **Objective:** Verify combination precedence over individual activation, single consumption of both participants, and that co-existing specials never auto-combine.
    - **Files/modules affected:** `tests/special-gems.test.js`.
    - **Dependencies:** 41.2, 41.4, 41.5, 41.6, 41.7, 41.8, 41.9.
    - **Expected behavior:** For each combination kind, the combination effect replaces the two participants' individual activations; each participant is consumed exactly once; two specials present on the board without being swapped into adjacency do not trigger a combination; a third special caught in the cleared set is activated exactly once via the chain worklist.
    - **Tests required:** precedence over individual activation, both-consumed-once (all seven), non-adjacent no auto-combine, third-special single chain activation.
    - _Requirements: 31.8, 31.9, 32.1, 32.2, 32.3_

### Group 6 — Resolution / Cascade Orchestrator

- [ ] 42. Implement the pure `resolveMove` orchestrator (PURE)
  - [ ] 42.1 Create `js/resolution.js` with move-kind determination and commit/revert
    - **Objective:** Determine the move kind on the swapped board and decide commit vs revert before resolving.
    - **Files/modules affected:** `js/resolution.js` (new); imports `js/board.js`, `js/match.js`, `js/special-gems.js`, `js/gem.js`.
    - **Dependencies:** 37.1, 38.2, 39.2, 41.1.
    - **Expected behavior:** `resolveMove(board, action, { rng, idSource })` with `action = { type: 'swap', from, to }`. Step 1: require `isAdjacent(from, to)`; build `swapped = swapCells(board, from, to)`. Step 2 move kind on `swapped`: both gems special → **combination**; exactly one special → **special activation** of that special; neither special → **normal match** path (keep iff `hasMatches(swapped)`). Step 3 commit test: the move is a Committed_Move iff it produces at least one match OR a valid special activation OR a valid combination; if none, revert — return the original board with `committed: false` and empty event arrays. The returned `ResolutionReport` shape is `{ board, committed, removedGems, createdSpecials, activations, combination, cascadeSteps, scoreDelta }`.
    - **Tests required:** covered in 42.4 and the cascade tests (task 52).
    - _Requirements: 32.1, 32.2, 32.3, 32.4_

  - [ ] 42.2 Implement the bounded resolution/cascade loop
    - **Objective:** Resolve one move to a Stable_Board via creation-before-removal, activation, removal, gravity, refill, and reclassification, bounded and reporting events.
    - **Files/modules affected:** `js/resolution.js`.
    - **Dependencies:** 42.1, 38.2, 39.2, 39.3, 41.1.
    - **Expected behavior:** Starting `cascadeSteps = 0`, loop bounded by `MAX_CASCADE_ITERATIONS = ROWS * COLS`: compute the round's removal set — first round of a combination move via `combine`, first round of a special-activation move via `activateSpecials`, otherwise `classifyMatches` then create specials at Creation_Cells (creation-before-removal) with the removal set = matched cells minus preserved Creation_Cells plus chain-activation of any pre-existing specials in matched cells (Req 33.5). If the removal set is empty, stop. Otherwise `cascadeSteps += 1`; record `removedGems` (baseType/specialType/id captured before removal), `createdSpecials`, and `activations`; then `removeCells` → `applyGravity` → `refill(board, rng, idSource)`; loop.
    - **Tests required:** covered in 42.4 and the cascade tests (task 52).
    - _Requirements: 33.4, 33.5, 44.1_

  - [ ] 42.3 Finalize resolution to a Stable_Board with reject-and-retain safety
    - **Objective:** Guarantee the resolved board is a Stable_Board when playable, or reject and retain the prior valid state on defect.
    - **Files/modules affected:** `js/resolution.js`.
    - **Dependencies:** 42.2.
    - **Expected behavior:** After the loop, assert `isStableBoard(board)`; if the invariant fails (guard hit / defect), reject the move and retain the prior Stable_Board, returning a report reflecting no committed change. On success, populate and return the full report; the board is 8×8 with every occupied cell carrying a valid `baseType` and valid `specialType`, and match resolution and all cascades leave a Stable_Board (unless the level status intentionally ends the move first, handled by the Level_Engine).
    - **Tests required:** covered in 42.4 and property tests (tasks 55, 56).
    - _Requirements: 33.6, 44.4, 44.5_

  - [ ] 42.4 Write unit tests for `resolveMove` orchestration
    - **Objective:** Verify move-kind branching, commit/revert, event reporting, and Stable_Board finalize.
    - **Files/modules affected:** `tests/resolution.test.js` (new).
    - **Dependencies:** 42.1, 42.2, 42.3.
    - **Expected behavior:** A normal swap producing a match commits and resolves to a Stable_Board; a swap producing no match/activation/combination reverts (`committed: false`, board unchanged); a special+normal swap activates that special; a special+special swap resolves via combination; the report's `removedGems`/`createdSpecials`/`activations`/`combination`/`cascadeSteps` reflect the resolution; a special activation enters the cascade and continues until no matches; the final board is a Stable_Board; the loop is bounded and never hangs.
    - **Tests required:** commit (match), revert (no effect), activation branch, combination branch, cascade-to-Stable, bounded termination, report contents.
    - _Requirements: 32.4, 33.6, 44.1, 44.4, 44.5_

- [ ] 43. Checkpoint — Ensure resolution/cascade tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Group 7 — Scoring

- [ ] 44. Implement deterministic scoring from resolution events (PURE)
  - [ ] 44.1 Add pure score computation to `js/level.js`
    - **Objective:** Compute a deterministic, non-negative integer score delta from a resolution report using the fixed constants.
    - **Files/modules affected:** `js/level.js` (new); consumes the `ResolutionReport` from `js/resolution.js`.
    - **Dependencies:** 42.2.
    - **Expected behavior:** A pure scoring helper computes, per cascade round of depth `d`: base `10` per gem removed; larger-match bonus `+20` per gem beyond `MIN_MATCH` in a matched structure (`20 * (n - 3)`); special-creation bonus (`line_horizontal`/`line_vertical` `+50`, `bomb` `+75`, `rainbow` `+100`); special-activation bonus `+5` per gem cleared by an activation; then the round's summed points are multiplied by `d` (first round `d=1`, next `d=2`, …). A combination bonus is added once (at `d=1`): line_line `+150`, rainbow_normal `+200`, rainbow_line `+250`, rainbow_rainbow `+500`, bomb_line `+200`, bomb_rainbow `+300`, bomb_bomb `+300`. `scoreDelta = Σ_d roundScore_d * d` is a non-negative integer; identical board/actions/config/RNG-seed yield identical scores; the DOM never computes any score.
    - **Tests required:** covered in 44.2.
    - _Requirements: 34.1, 34.2, 34.3, 34.4, 34.5, 34.6, 34.7, 34.8, 34.9, 34.10_

  - [ ] 44.2 Write unit tests for scoring
    - **Objective:** Verify each scoring term, cascade-depth multiplier, determinism, and non-negativity.
    - **Files/modules affected:** `tests/level.test.js` (new).
    - **Dependencies:** 44.1.
    - **Expected behavior:** A normal 3-match scores base removals; a larger match adds the per-extra-gem bonus; each special creation adds its correct bonus; a special activation adds `+5` per cleared gem; each combination kind adds its flat bonus once; a two-round cascade multiplies the second round's points by 2; identical seeded inputs produce identical scores; the score is always `>= 0`.
    - **Tests required:** normal match score, larger-match bonus, special-creation bonus (each type), special-activation score, combination bonus (each kind), cascade-depth bonus, determinism, non-negative score.
    - _Requirements: 34.2, 34.3, 34.4, 34.5, 34.6, 34.7, 34.8, 34.9_

### Group 8 — Level Engine

- [ ] 45. Implement level configuration data and validation (PURE)
  - [ ] 45.1 Create `js/config/levels.js` with default 8×8 level configurations
    - **Objective:** Provide data-driven default levels (a score-target and a collect-target sample), 8×8.
    - **Files/modules affected:** `js/config/levels.js` (new); references `GEM_TYPES` from `js/config/board-config.js`.
    - **Dependencies:** none (data).
    - **Expected behavior:** Export at least one valid `LevelConfiguration` for a score objective and one for a collect objective, each with `id`, `rows: 8`, `cols: 8`, a non-empty `availableBaseTypes` subset of the six with length `>= 3`, a positive integer `moveLimit`, `objectiveType ∈ {'score','collect'}`, a positive integer `objectiveTarget`, and `collectType` (a member of `availableBaseTypes`) for the collect level. Pure data, no logic.
    - **Tests required:** covered in 45.3.
    - _Requirements: 35.1, 35.2, 35.3, 35.5, 35.6_

  - [ ] 45.2 Add `validateLevelConfig` to `js/level.js`
    - **Objective:** Reject invalid level configurations before any board is generated.
    - **Files/modules affected:** `js/level.js`.
    - **Dependencies:** 45.1.
    - **Expected behavior:** `validateLevelConfig(config)` returns true iff: `id` is a non-empty string; `rows === 8 && cols === 8`; `availableBaseTypes` is a non-empty subset of `GEM_TYPES` with length `>= 3`; `moveLimit` is a positive integer; `objectiveType ∈ {'score','collect'}`; `objectiveTarget` is a positive integer; and, when `objectiveType === 'collect'`, `collectType` is present and a member of `availableBaseTypes`. An invalid config is rejected (null-signal / documented reject) before generation, producing no playable board.
    - **Tests required:** covered in 45.3.
    - _Requirements: 35.1, 35.2, 35.3, 35.4, 35.5, 35.6, 35.7_

  - [ ] 45.3 Write unit tests for level configuration and validation
    - **Objective:** Verify valid configs accepted and invalid configs rejected without producing a board.
    - **Files/modules affected:** `tests/level.test.js`.
    - **Dependencies:** 45.1, 45.2.
    - **Expected behavior:** The default score and collect configs validate; configs with a non-8×8 dimension, an out-of-set/too-small `availableBaseTypes`, a non-positive `moveLimit`, an unknown `objectiveType`, a non-positive `objectiveTarget`, or a missing/invalid `collectType` for a collect objective are all rejected; a rejected config yields no playable board.
    - **Tests required:** valid config accepted (score + collect), each invalid-config rejection, no-board-on-reject.
    - _Requirements: 35.1, 35.2, 35.3, 35.4, 35.5, 35.6, 35.7_

- [ ] 46. Implement the Level_Engine state, moves, objectives, and status (PURE)
  - [ ] 46.1 Add `createLevel` with subset-restricted stable-board generation
    - **Objective:** Create a validated level with a fresh Stable_Board drawn only from the configured base types.
    - **Files/modules affected:** `js/level.js`; adds a subset-restricted `generateStableBoard` variant in `js/board.js` (public Phase 2 APIs unchanged).
    - **Dependencies:** 45.2, 44.1.
    - **Expected behavior:** Add a subset-restricted generation variant in `js/board.js` that draws only from `availableBaseTypes` (equal to the Phase 2 generator when the subset is all six). `createLevel(config, { rng, idSource })` validates the config, generates a Stable_Board from the subset, and returns a `LevelState` `{ config, board, score: 0, remainingMoves: config.moveLimit, objectiveProgress: 0, status: 'playing', idSource }`. The board is always a Stable_Board before play.
    - **Tests required:** covered in 46.4.
    - _Requirements: 35.7, 36.1, 41.1, 41.2, 41.3_

  - [ ] 46.2 Add `applyResolution` for move, score, objective, and status updates
    - **Objective:** Turn a resolution report into a new pure LevelState with correct move accounting, scoring, objective progress, and status.
    - **Files/modules affected:** `js/level.js`.
    - **Dependencies:** 46.1, 42.2, 44.1.
    - **Expected behavior:** `applyResolution(state, report)` returns a NEW state: decrement `remainingMoves` by exactly 1 iff `report.committed` (unchanged if reverted; never changed for cascade rounds within a move; a valid combination counts as one; clamped `>= 0`); add `report.scoreDelta` to `score` (`>= 0`); update `objectiveProgress` — for `score` mirror the score, for `collect` add the count of removed gems whose `baseType === collectType` across all rounds (cascade and special-effect removals both count); then evaluate status **after** the full resolution reached a Stable_Board with WIN-PRIORITY: if the objective is satisfied → `won` (checked before the lose check, so a final move satisfying the objective while dropping moves to 0 yields `won`); else if `remainingMoves === 0` → `lost`; else `playing`. Pure and DOM-free.
    - **Tests required:** covered in 46.4.
    - _Requirements: 34.1, 36.2, 36.3, 36.4, 36.5, 36.6, 37.1, 37.2, 37.3, 37.4, 37.5, 38.1, 38.2, 38.3, 39.1, 39.2, 39.4, 41.2_

  - [ ] 46.3 Add `restart` and `isInputBlocked`
    - **Objective:** Fully reset a level and expose input-blocking state.
    - **Files/modules affected:** `js/level.js`.
    - **Dependencies:** 46.1.
    - **Expected behavior:** `restart(state, { rng, idSource })` returns a fresh `LevelState` from the same config: new Stable_Board, `score = 0`, `remainingMoves = moveLimit`, `objectiveProgress = 0`, `status = 'playing'`, no carried-over state. `isInputBlocked(state, isResolving)` returns true iff `state.status !== 'playing'` OR `isResolving` (so input is blocked while resolving and after the level ends).
    - **Tests required:** covered in 46.4.
    - _Requirements: 38.4, 39.3, 40.2, 40.3, 40.4, 41.4, 43.3, 43.4_

  - [ ] 46.4 Write unit tests for the Level_Engine
    - **Objective:** Verify move accounting, objective tracking, status transitions with win-priority, and restart reset.
    - **Files/modules affected:** `tests/level.test.js`.
    - **Dependencies:** 46.1, 46.2, 46.3.
    - **Expected behavior:** `createLevel` initializes `remainingMoves` to `moveLimit` and produces a Stable_Board; a committed move decrements moves by exactly 1; a reverted move leaves moves unchanged; cascade rounds within a move do not change moves; a valid combination counts as one move; a score objective is satisfied at `score >= target`; a collect objective counts applicable removed gems across cascade and special removals and is satisfied at progress `>= target`; the level transitions to `won` when the objective is met and to `lost` when moves reach 0 unmet; a final move that both meets the objective and drops moves to 0 yields `won` (win-priority); `isInputBlocked` is true while resolving and when ended; `restart` clears all fields to initial with a fresh Stable_Board and no carryover.
    - **Tests required:** move-limit init, valid decrement, no decrement on revert, no decrement during cascades, combination-as-one-move, objective tracking (score + collect), win state, lose state, win-priority on final move, input-blocked when resolving/ended, restart reset.
    - _Requirements: 36.1, 36.2, 36.3, 36.4, 36.5, 36.6, 37.1, 37.2, 37.3, 37.4, 38.1, 38.2, 38.3, 38.4, 39.1, 39.2, 39.3, 39.4, 40.2, 40.3, 40.4, 41.4_

- [ ] 47. Checkpoint — Ensure scoring and level-engine tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Group 9 — Game Board UI Integration (DOM only)

- [ ] 48. Extend the Game Board screen to drive the engine and render specials/HUD (DOM ONLY)
  - [ ] 48.1 Wire the screen to `resolveMove` + `Level_Engine` and add input gating
    - **Objective:** Drive per-move resolution and level state from the screen without duplicating any engine logic.
    - **Files/modules affected:** `js/screens/game-board.js` (extended); imports `js/resolution.js`, `js/level.js`, `js/board.js`, `js/gem.js`.
    - **Dependencies:** 42.3, 46.3.
    - **Expected behavior:** On mount, create a level via `Level_Engine.createLevel` (seeded RNG + id source usable in tests) and render its board. On a valid adjacent activation, build `action = { type: 'swap', from, to }`, call `resolveMove`, then `Level_Engine.applyResolution`, then re-render board + HUD + status. Ignore activations while `isResolving` is true or `Level_Engine.isInputBlocked` returns true (status ended). Click and touch tap both route to the same discrete activation; no swipe/drag handlers are registered. The screen contains no match/gravity/refill/special-effect/score/objective formula.
    - **Tests required:** covered in task 53 (jsdom integration).
    - _Requirements: 43.1, 43.2, 43.3, 43.4, 43.5, 46.1, 46.2_

  - [ ] 48.2 Render the HUD, status display, and restart control
    - **Objective:** Display score, remaining moves, objective + progress, level status, and a restart control.
    - **Files/modules affected:** `js/screens/game-board.js`.
    - **Dependencies:** 48.1.
    - **Expected behavior:** Render a HUD showing the current Score, Remaining_Moves, and the active Objective with Objective_Progress, all read from `LevelState` and updated after each resolved move. A status region visibly communicates `playing` / `won` / `lost` with text (e.g., "You won!" / "Out of moves"). A restart control is always present and available in all statuses (including after `won` and `lost`); activating it calls `Level_Engine.restart` and re-renders. No value shown here is computed in the screen — all come from the engine.
    - **Tests required:** covered in task 53 (jsdom integration).
    - _Requirements: 40.1, 40.5, 42.1, 42.2, 42.3, 42.4, 42.5_

  - [ ] 48.3 Render special gems with non-color distinction and accessible labels
    - **Objective:** Make each special visually distinguishable without relying on color and provide accessible labels, preserving Phase 2 responsive constraints.
    - **Files/modules affected:** `js/screens/game-board.js`; `css/game-board.css` (special-gem cues only; keep Phase 2 responsive rules intact).
    - **Dependencies:** 48.1.
    - **Expected behavior:** Each special renders a non-color cue (a glyph/shape overlay — e.g., a horizontal bar for line_horizontal, vertical bar for line_vertical, a starburst for rainbow, a ring for bomb) plus a text label, so distinction never relies on color alone. Each special cell carries a meaningful `aria-label` describing its state (e.g., "Ruby line crystal (clears row)"). The Phase 2 responsive constraints are maintained: zero horizontal overflow, square cells, ≥44×44px touch targets, content centered when viewport > 768px.
    - **Tests required:** covered in task 53 (jsdom integration).
    - _Requirements: 42.6, 42.7, 42.8_

- [ ] 49. Checkpoint — Ensure the Game Board screen integrates and renders correctly
  - Ensure all tests pass, ask the user if questions arise.

### Group 10 — Testing (unit, integration, deterministic RNG, and properties)

- [ ] 50. Consolidate special-gem, creation, and activation unit coverage
  - [ ] 50.1 Verify and complete the special-gem unit test matrix
    - **Objective:** Ensure the Req 45.2 / 45.3 unit matrix is fully covered by the Group 3–4 tests, filling any gaps.
    - **Files/modules affected:** `tests/special-gems.test.js`.
    - **Dependencies:** 38.3, 39.4.
    - **Expected behavior:** Confirm coverage of creation, validation, line_horizontal/line_vertical/rainbow/bomb creation, deterministic Creation_Cell, preservation of the created special, rejection of invalid special types, and activation coverage of line_horizontal, line_vertical, rainbow, bomb, edge/corner handling, affected-cell correctness, absence of duplicate removal, and single activation per trigger; add any missing cases.
    - **Tests required:** completeness check + gap-filling for creation and activation matrices.
    - _Requirements: 45.2, 45.3_

- [ ] 51. Consolidate combination and match-classification unit coverage
  - [ ] 51.1 Verify combination and classification test completeness
    - **Objective:** Ensure the Req 45.4 / 45.5 matrices are fully covered by the Group 2 and Group 5 tests, filling any gaps.
    - **Files/modules affected:** `tests/special-gems.test.js`, `tests/match.test.js`.
    - **Dependencies:** 41.10, 37.2.
    - **Expected behavior:** Confirm combination coverage of line+line, rainbow+normal, rainbow+line, rainbow+rainbow, bomb+line, bomb+rainbow, bomb+bomb; confirm classification coverage of 3-match, horizontal 4, vertical 4, 5+, T, L, overlapping runs, deterministic Creation_Cell, and absence of accidental special creation, plus `classifyMatches(board).allCells === findMatches(board)`; add any missing cases.
    - **Tests required:** completeness check + gap-filling for combination and classification matrices.
    - _Requirements: 45.4, 45.5_

- [ ] 52. Write cascade behavior tests
  - [ ] 52.1 Add cascade tests over `resolveMove`
    - **Objective:** Verify special activation enters the cascade, cascades run to Stable_Board, resolving blocks input, resolution is bounded, and special chains terminate.
    - **Files/modules affected:** `tests/resolution.test.js`.
    - **Dependencies:** 42.3.
    - **Expected behavior:** A special activation enters the cascade and continues until no matches remain; the final board is a Stable_Board; while a move is resolving the screen/engine blocks input (verified via `isInputBlocked` and the report); resolution is bounded by `MAX_CASCADE_ITERATIONS` and never hangs; special chains terminate (bounded by `MAX_ACTIVATION_STEPS`).
    - **Tests required:** activation-enters-cascade, cascade-to-Stable, input-blocked-while-resolving, bounded resolution, chain termination.
    - _Requirements: 45.6_

- [ ] 53. Write jsdom integration tests for the Game Board screen
  - [ ] 53.1 Add jsdom UI/interaction integration tests
    - **Objective:** Verify rendering, interaction, HUD/status, restart, input blocking, and navigation compatibility under jsdom.
    - **Files/modules affected:** `tests/game-board.test.js` (extended).
    - **Dependencies:** 48.1, 48.2, 48.3.
    - **Expected behavior:** Special-gem rendering (non-color distinction + `aria-label`); selection; special activation via swap; combination via swap of two specials; Score/Move/Objective display updates; win state and loss state shown; restart control resets and re-renders; input blocked while resolving and after the level ends; navigation compatibility — `navigate('play')` mounts the screen, the return control calls `navigate('main-menu')`, and the World Map/Boosters/Achievements/Settings placeholders are unchanged. Click and touch tap route identically; no swipe/drag handlers registered.
    - **Tests required:** special rendering + aria, selection, activation, combination, score/move/objective display, win, loss, restart, input blocking (resolving + ended), navigation compatibility, click/tap routing, no drag/swipe.
    - _Requirements: 45.10, 46.2, 46.3, 46.4_

- [ ] 54. Write deterministic-RNG tests
  - [ ] 54.1 Add determinism tests across the engine
    - **Objective:** Verify identical board/actions/config/seed/id-source produce identical results with no uncontrolled randomness where determinism is asserted.
    - **Files/modules affected:** `tests/resolution.test.js`, `tests/level.test.js`.
    - **Dependencies:** 42.3, 46.2, 44.1.
    - **Expected behavior:** Running the same sequence of moves on the same initial config with the same seeded RNG and deterministic id source yields identical boards, scores, objective progress, move counts, statuses, and gem ids across repeated runs; assertions never depend on `Math.random`.
    - **Tests required:** end-to-end determinism for board, score, objective, moves, status, and ids.
    - _Requirements: 45.11, 34.8, 47.3_

- [ ] 55. Write property test P2 — special resolution preserves board invariants
  - [ ] 55.1 Add property P2
    - **Objective:** Verify that after any valid action fully resolves, the board holds all invariants.
    - **Files/modules affected:** `tests/board.property.test.js` (extended) or `tests/resolution.property.test.js` (new).
    - **Dependencies:** 42.3.
    - **Expected behavior:** Using fast-check, minimum 100 iterations, seeded RNG + deterministic id source, no DOM: for any Stable_Board (normal and/or special gems) and any valid adjacent action (swap, special activation, or combination), after `resolveMove` fully resolves the board is 8×8, every cell holds exactly one gem with a valid `baseType` and valid `specialType`, there are no invalid cells, and the board is a Stable_Board when the level is still playable. Assert invariants only — do not re-implement the resolution algorithm in the test. Tagged `// Feature: gemoria-crystal-quest, Property 2: Special resolution preserves board invariants`.
    - **Tests required:** property P2 (≥100 iterations, injected RNG + id source).
    - _Requirements: 45.9, 26.5, 26.8, 44.3, 44.4_

- [ ] 56. Write property test P3 — special activation is boundary-safe
  - [ ] 56.1 Add property P3
    - **Objective:** Verify activation (and any chain) only references in-range cells including edges/corners.
    - **Files/modules affected:** `tests/board.property.test.js` or `tests/resolution.property.test.js`.
    - **Dependencies:** 39.2.
    - **Expected behavior:** Using fast-check, minimum 100 iterations, seeded RNG + deterministic id source, no DOM: for any board and any special gem placed at any cell including corners and edges, computing and applying its activation and any triggered chain only references cells with `0 ≤ row ≤ 7` and `0 ≤ col ≤ 7` and produces no out-of-range coordinate. Assert boundary safety only; do not duplicate the effect algorithm. Tagged `// Feature: gemoria-crystal-quest, Property 3: Special activation is boundary-safe`.
    - **Tests required:** property P3 (≥100 iterations, injected RNG + id source).
    - _Requirements: 45.9, 30.5, 44.3_

- [ ] 57. Write property test P4 — score is monotonic and non-negative
  - [ ] 57.1 Add property P4
    - **Objective:** Verify the score never decreases across valid moves and is always non-negative.
    - **Files/modules affected:** `tests/level.property.test.js` (new) or `tests/board.property.test.js`.
    - **Dependencies:** 46.2, 44.1.
    - **Expected behavior:** Using fast-check, minimum 100 iterations, seeded RNG + deterministic id source, no DOM: for any level and any sequence of valid moves, the score after each committed move is `>=` the score before it and is always `>= 0`. Assert the monotonic/non-negative invariant only; do not re-implement the score formula in the test. Tagged `// Feature: gemoria-crystal-quest, Property 4: Score is monotonic`.
    - **Tests required:** property P4 (≥100 iterations, injected RNG + id source).
    - _Requirements: 45.9, 34.8, 34.9_

- [ ] 58. Write property test P6 — move accounting is exact
  - [ ] 58.1 Add property P6
    - **Objective:** Verify committed moves consume exactly one move, reverted moves zero, and cascades zero.
    - **Files/modules affected:** `tests/level.property.test.js` or `tests/board.property.test.js`.
    - **Dependencies:** 46.2.
    - **Expected behavior:** Using fast-check, minimum 100 iterations, seeded RNG + deterministic id source, no DOM: for any level and any attempted move, a committed move (match, valid activation, or valid combination) consumes exactly one Remaining_Move, a reverted move consumes zero, and automatic cascade rounds within a move consume zero. Assert the accounting invariant only; do not duplicate the resolution algorithm. Tagged `// Feature: gemoria-crystal-quest, Property 6: Move accounting is exact`.
    - **Tests required:** property P6 (≥100 iterations, injected RNG + id source).
    - _Requirements: 45.9, 36.2, 36.3, 36.4, 36.5_

- [ ] 59. Preserve Phase 2 properties P1 and P5
  - [ ] 59.1 Confirm P1 (Stable_Board invariant) and P5 (gravity multiset+order) stay green
    - **Objective:** Verify the existing Phase 2 property tests still pass unchanged and remain valid under Phase 3.
    - **Files/modules affected:** `tests/board.property.test.js` (existing P1, P5 — not rewritten).
    - **Dependencies:** 55.1, 56.1, 57.1, 58.1.
    - **Expected behavior:** The existing Property 1 (Stable_Board when playable) and Property 5 (gravity preserves per-column multiset and order) tests continue to run at ≥100 iterations and pass without modification to their algorithms; no Phase 3 change breaks them. This task confirms preservation only — it must NOT rewrite the Phase 2 property tests.
    - **Tests required:** confirm P1 and P5 pass unchanged.
    - _Requirements: 45.1, 45.9_

- [ ] 60. Confirm architecture and scope protection
  - [ ] 60.1 Verify Phase 1/Phase 2 preservation and scope boundaries
    - **Objective:** Assert that `main.js`/`router.js` are untouched, Phase 2 APIs remain compatible, the UI duplicates no engine logic, and no out-of-scope system is introduced.
    - **Files/modules affected:** `tests/` (a preservation/scope test), reading `js/main.js`, `js/router.js`, `js/config/screens.js`, `js/screens/game-board.js`.
    - **Dependencies:** 48.3, 53.1.
    - **Expected behavior:** Confirm `js/main.js` and `js/router.js` are not modified by Phase 3; the Main Menu still has exactly the five buttons with only `Play` active; the four non-`play` placeholders are unchanged; Phase 2 pure APIs remain callable with identical behavior (all-normal board parity); the Game Board screen references match/gravity/refill/special/score/objective logic only via imports and duplicates none of them; and none of the excluded systems (world map, lives, coins, shop, boosters beyond specials, achievements, audio, persistence, backend, auth, multiplayer, ads/social, advanced obstacles, full 100-level content, swipe/drag) is implemented or reachable.
    - **Tests required:** preservation assertions + all-normal parity + scope-absence checks.
    - _Requirements: 46.1, 46.2, 46.3, 46.4, 46.5_

- [ ] 61. Final checkpoint — Ensure the full suite passes with zero failures
  - Ensure the complete test suite passes: all Phase 2 tests (106) plus every Phase 3 unit, integration, deterministic-RNG, and property test, with properties P1–P6 green (each property ≥100 iterations). Confirm Phase 3 implements every requirement 26–47, produces deterministic non-negative scores and deterministic combination effects, applies correct move/win/lose accounting and full restart reset, keeps the screen responsive with no swipe/drag and no out-of-scope systems, and the change set is strictly additive plus the documented `game-board.js` and `createGem`/`randomGem` extensions. Ask the user if questions arise.
  - _Requirements: 47.1, 47.2, 47.3, 47.4, 47.5, 47.6_

## Phase 3 Notes

- Every Phase 3 task involves writing, modifying, or testing code; there are no UAT, deployment, metrics, training, or documentation tasks.
- Tasks marked with `*` would be optional; none are marked optional here because Req 45 makes the listed tests mandatory Phase 3 deliverables, and they are grouped as sub-tasks under their parents rather than standalone tasks.
- Each task references specific Requirement clauses (26–47) for traceability; property tasks additionally reference their design Correctness Property (P1–P6).
- Property tests use **fast-check** with Vitest, a minimum of **100 iterations** each, one property test per correctness property, each tagged `// Feature: gemoria-crystal-quest, Property N: ...`, driven by a seeded/injectable RNG plus a deterministic id source, asserting invariants only and never duplicating the implementation algorithm.
- Pure modules (`gem.js`, `match.js`, `special-gems.js`, `resolution.js`, `level.js`, both configs) are tested without a DOM; the Game Board screen is tested under jsdom. All tests and manual verification run over HTTP (ES modules do not load from `file://`).
- **Design keystone:** the pure `resolveMove` orchestrator is the single per-move engine; `js/screens/game-board.js` is a thin driver that captures input, calls `resolveMove` + `Level_Engine`, and renders — it contains no match/gravity/refill/special-effect/score/objective formula.
- **Phase 1 and Phase 2 preserved:** `js/main.js` and `js/router.js` are NOT modified; the `'play'` registry entry remains pointing at `createGameBoardScreen`; the four other placeholder screens are unchanged. Phase 2 pure APIs stay backward-compatible (`createGem`/`randomGem` extended compatibly; `findMatches` unchanged). The only Phase 2 file touched is `js/screens/game-board.js`.
- **Scoring constants and combination effects are fixed by the design** and are cited by task, not re-decided.
- **Extension points / out-of-scope for Phase 3:** world map, lives/hearts, coins/economy, shop/store, boosters beyond special gems, achievements, audio/music, persistence/save/load, backend, authentication/accounts, multiplayer, ads/social, advanced obstacles, full 100-level content production, and swipe/drag are NOT implemented. Future systems continue to plug in via the **screen registry** and the **store scaffold**, following the pure-logic-decoupled-from-UI pattern.

### Phase 3 Requirements coverage (26–47)

- 26 → 36.1, 36.2, 36.3
- 27 → 38.1, 38.2, 38.3
- 28 → 38.1, 38.2, 38.3
- 29 → 38.1, 38.2, 38.3
- 30 → 39.1, 39.2, 39.4
- 31 → 41.1, 41.2, 41.3, 41.4, 41.5, 41.6, 41.7, 41.8, 41.9, 41.10
- 32 → 41.1, 41.10, 42.1, 42.4
- 33 → 37.1, 37.2 (33.1–33.3), 38.2, 38.3 (33.4), 39.3, 39.4 (33.5), 42.3 (33.6)
- 34 → 44.1, 44.2, 46.2, 54.1
- 35 → 45.1, 45.2, 45.3, 46.1
- 36 → 46.2, 46.4, 58.1
- 37 → 46.2, 46.4
- 38 → 46.2, 46.4
- 39 → 46.2, 46.4
- 40 → 46.3, 46.4, 48.2
- 41 → 46.1, 46.2, 46.3, 46.4
- 42 → 48.2, 48.3, 53.1
- 43 → 48.1, 53.1
- 44 → 39.1, 39.2, 42.2, 42.3, 42.4
- 45 → 50.1, 51.1, 52.1, 53.1, 54.1, 55.1, 56.1, 57.1, 58.1, 59.1 (45.1)
- 46 → 48.1, 60.1
- 47 → 54.1, 60.1, 61

Every Requirement 26–47 is covered by at least one task.

## Phase 3 Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["36.1"] },
    { "id": 1, "tasks": ["36.2", "45.1"] },
    { "id": 2, "tasks": ["36.3", "37.1"] },
    { "id": 3, "tasks": ["37.2", "38.1", "45.2"] },
    { "id": 4, "tasks": ["38.2", "39.1", "45.3"] },
    { "id": 5, "tasks": ["38.3", "39.2"] },
    { "id": 6, "tasks": ["39.3", "41.1"] },
    { "id": 7, "tasks": ["39.4", "41.2", "41.4", "41.5", "41.6", "41.7", "41.8", "41.9"] },
    { "id": 8, "tasks": ["41.3", "41.10"] },
    { "id": 9, "tasks": ["42.1"] },
    { "id": 10, "tasks": ["42.2"] },
    { "id": 11, "tasks": ["42.3", "44.1"] },
    { "id": 12, "tasks": ["42.4", "44.2", "46.1"] },
    { "id": 13, "tasks": ["46.2"] },
    { "id": 14, "tasks": ["46.3", "50.1", "51.1", "52.1"] },
    { "id": 15, "tasks": ["46.4", "48.1"] },
    { "id": 16, "tasks": ["48.2", "48.3", "54.1", "55.1", "56.1", "57.1", "58.1"] },
    { "id": 17, "tasks": ["53.1", "59.1"] },
    { "id": 18, "tasks": ["60.1"] }
  ]
}
```
