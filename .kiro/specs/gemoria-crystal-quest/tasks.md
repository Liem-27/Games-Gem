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

- [ ] 2. Implement the central game-state store scaffold
  - [ ] 2.1 Create `js/state/game-state.js`
    - Export `createStore(initialState = {})` returning `{ getState, setState, subscribe }`.
    - `getState` returns current state; `setState(patch)` merges the patch and notifies subscribers; `subscribe(fn)` registers a listener and returns an unsubscribe function.
    - Keep it minimal; add a comment marking it a Phase 1 scaffold / extension point (no progression, coins, lives, boosters, or level logic).
    - _Requirements: 1.3, 1.4, 1.6_

- [ ] 3. Implement the general screen Router and lifecycle contract
  - [ ] 3.1 Create `js/router.js`
    - Export `createRouter(container)` returning `{ register(id, factory), navigate(id), getCurrentScreenId(), hasScreen(id) }`.
    - Define the Screen Lifecycle Contract in JSDoc: `mount(container, ctx)` required, `unmount()` optional, optional `title`; screens are produced by factories so each navigation yields a fresh instance.
    - `navigate(id)` on a registered id: call `unmount()` on the current screen (if any), instantiate and `mount()` the target into the container with a `ctx` exposing a `navigate` callback (and the store), and record it as current.
    - `navigate(id)` on an unregistered id: leave current screen unchanged (no unmount, no new mount), `console.warn` a "screen not found: <id>" message, and return `false`. Never throw.
    - `register` must let new screens be added without modifying Router internals.
    - _Requirements: 4.2, 4.3, 9.4_

- [ ] 4. Implement the placeholder screen factory
  - [ ] 4.1 Create `js/screens/placeholder.js`
    - Export `createPlaceholderScreen({ title, message })` returning a `Screen`.
    - `mount(container, ctx)` renders the feature title, the "not yet available" message, and a **Back** control whose activation calls `ctx.navigate('main-menu')`.
    - Style the container with a solid theme background so controls remain visible/interactive even if artwork fails.
    - _Requirements: 6.4, 6.5, 9.3, 9.5, 1.4_

- [ ] 5. Implement the Main Menu UI module
  - [ ] 5.1 Create `js/screens/main-menu.js`
    - Export `mainMenuScreen()` returning a `Screen`.
    - Render the title text exactly "Gemoria: Crystal Quest".
    - Render the five buttons from a data-driven `MenuItem` list (`{ label, screenId }`): Play→`play`, World Map→`world-map`, Boosters→`boosters`, Achievements→`achievements`, Settings→`settings`; one enabled, activatable button per item with a matching label.
    - Render inline-SVG Placeholder_Artwork containing at least one crystal/gem shape; reference no external image files.
    - On activation: toggle an active-state CSS class (visual change) then call `ctx.navigate(targetId)` for that item.
    - _Requirements: 4.4, 5.1, 5.3, 6.1, 6.2, 6.6, 7.1, 7.2, 7.3, 10.3, 10.4_

- [ ] 6. Checkpoint — Ensure all module tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Wire the screen registry
  - [ ] 7.1 Create `js/config/screens.js`
    - Import `mainMenuScreen` and `createPlaceholderScreen`.
    - Export `screenRegistry` declaring `main-menu` plus the five placeholder screens (`play`, `world-map`, `boosters`, `achievements`, `settings`), each with an `id` and a `factory`, and per-feature `title`/`message` for placeholders.
    - This is the single place screens are declared; future screens are added here without editing menu/router/bootstrap.
    - _Requirements: 1.3, 1.4, 1.6, 6.1_

- [ ] 8. Implement the application bootstrap
  - [ ] 8.1 Create `js/main.js`
    - Import `createRouter`, `screenRegistry`, and `createStore`.
    - Export `boot(rootSelector = '#app')` that: resolves `#app` (reveal `#boot-error` if missing); creates the store scaffold; creates the Router over the container; registers each screen from the registry; navigates to the initial screen `'main-menu'`.
    - Wrap the wiring in `try/catch`; on failure reveal the on-screen `#boot-error` "failed to load" region so the viewport is never left blank.
    - Invoke `boot()` at module end so the game starts on load (keep it exported for testability).
    - _Requirements: 2.5, 4.1, 4.5, 5.1_

- [ ] 9. Create the HTML entry point
  - [ ] 9.1 Create `index.html` at the project root
    - Declare `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.
    - Link exactly three stylesheets in order: reset/base → theme → menu.
    - Include a single mount root `<div id="app"></div>` and a static, hidden `<div id="boot-error" hidden>…</div>` region with a "The game failed to load." message.
    - Reference the entry module with exactly one `<script type="module" src="js/main.js"></script>`; include a `<noscript>` message.
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 8.4_

- [ ] 10. Author modular CSS
  - [ ] 10.1 Create `css/reset.css` (base and reset styles)
    - Reset/normalize defaults, box-sizing, base document rules; contain no theme-specific color or typography definitions.
    - _Requirements: 3.1_

  - [ ] 10.2 Create `css/theme.css` (fantasy crystal theme)
    - Define all fantasy crystal theme colors as reusable CSS custom properties (no literal color values elsewhere); include at least one color and at least one typography property (font family/size/weight).
    - Every `var()` usage includes a defined fallback (e.g., `var(--crystal-primary, #4b3f9e)`) so elements remain visible if a property is undefined.
    - _Requirements: 3.2, 3.4, 3.6_

  - [ ] 10.3 Create `css/menu.css` (Main Menu layout and button styling)
    - Contain no base, reset, or theme color literal definitions; reference theme custom properties (with fallbacks) for any theme colors applied.
    - Responsive at a 768px breakpoint: ≤768px a single vertical column with each button full width minus 16px side margins; >768px content horizontally centered with max content width 960px.
    - Touch targets minimum 44×44px with ≥8px spacing between adjacent targets; zero horizontal overflow across 320–2560px; enable vertical scroll if content is taller than the viewport while keeping horizontal overflow at zero.
    - _Requirements: 3.3, 3.5, 8.1, 8.2, 8.3, 8.5, 8.6_


- [ ] 11. Author the README with run instructions
  - Create `README.md` with exact steps to serve over HTTP from the project root (e.g., `python -m http.server` or `npx serve`, then open `http://localhost:<port>/`).
  - State that ES modules require serving over HTTP and that opening `index.html` directly from `file://` is not supported.
  - _Requirements: 10.5, 10.6_

- [ ] 12. Final checkpoint — Ensure all tests pass
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
