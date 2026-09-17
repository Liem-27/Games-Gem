# Design Document

## Overview

Gemoria: Crystal Quest is an original HTML5 match-3 puzzle game with a fantasy crystal theme. This design covers **Phase 1 only**: the project foundation and a responsive, touch-friendly main menu with fully wired navigation and original placeholder artwork.

The guiding principle is *maintainability and extensibility over premature complexity*. Phase 1 ships a small, honest amount of code — an application bootstrap, a general-purpose screen Router, a Main Menu UI module, a placeholder-screen factory, a screen registry (config), and a minimal game-state scaffold. Everything else (the match-3 board, match detection, special gems, obstacles, boosters logic, levels, sound, animation, save/persistence) is deliberately **not implemented**. Instead, the architecture is shaped so those systems drop in later as new modules and new registered screens, without rewriting the Main Menu, the Router, or the bootstrap.

No framework, no backend, no database, no external runtime dependencies. Everything is HTML5, CSS3, and Vanilla JavaScript ES modules. All visual identity is original — no assets, layouts, characters, branding, sounds, or artwork from any existing commercial match-3 product are copied or imitated.

### Design Goals

- **General navigation, not menu-only.** The Router is a reusable screen-navigation system with a screen registry and a lifecycle contract (`mount` / `unmount`), so future screens (World Map, Level Select, Game Board, Boosters, Achievements, Settings, Results) plug in without touching Router internals.
- **Extension points, clearly marked.** A central game-state concept (pub/sub + `getState` / `setState` / `subscribe`) and a data-driven level system are described so future systems have a home, while Phase 1 implements only a minimal scaffold (or none) as noted per part.
- **Additive future phases.** Adding the game board later means registering a new screen and adding a new module — no edits to `main-menu.js`, `router.js`, or `main.js`.

### Interpretation Note on Requirements 1.4, 4.2, and 4.4 (Pragmatic Modularity)

Requirements 1.4 / 4.2 / 4.4 are read with a **relaxed, pragmatic interpretation**: each ES module has **one clearly defined primary responsibility**, and **all of its exports relate to that one concern**. This does **not** mean "exactly one export per module." A module MAY expose multiple related exports when technically appropriate (for example, the Router module may export a `createRouter` factory alongside a small `SCREENS` symbol/enum or a type-like constant that belongs to the routing concern). The single-responsibility rule is about cohesion of concern, not export count.

## Architecture

Phase 1 uses a thin layered architecture with one-directional dependencies. The bootstrap wires everything together at startup; nothing below the bootstrap imports the bootstrap.

```
index.html
  └─ loads css (reset/base, theme, menu)  +  <script type="module" src="js/main.js">

js/main.js  (bootstrap / entry point)
  ├─ imports screen registry (config/screens.js)
  ├─ imports createRouter (router.js)
  ├─ imports createStore (state/game-state.js)   ← Phase 1: minimal scaffold
  ├─ registers screens, mounts router into #app
  └─ navigates to the initial screen (main-menu)

router.js  (general screen navigation)
  ├─ holds a screen registry (id → screen factory/descriptor)
  ├─ navigate(screenId): unmount current, mount target
  └─ unknown id → no change + reports "screen not found"

config/screens.js  (screen registry data)
  └─ declares which screen ids exist and how to build them
     (main-menu → mainMenuScreen; play/world-map/boosters/
      achievements/settings → placeholder screens)

screens/main-menu.js       (UI module: renders the Main Menu)
screens/placeholder.js     (factory: builds a Placeholder screen for any feature)
state/game-state.js        (extension-point scaffold: store/pub-sub)
```

### Dependency Rule

```mermaid
graph TD
    HTML[index.html] --> MAIN[js/main.js — bootstrap]
    MAIN --> REG[config/screens.js — registry]
    MAIN --> ROUTER[js/router.js]
    MAIN --> STORE[state/game-state.js — scaffold]
    REG --> MENU[screens/main-menu.js]
    REG --> PH[screens/placeholder.js — factory]
    ROUTER -->|mount/unmount| MENU
    ROUTER -->|mount/unmount| PH
    MENU -.->|navigate id| ROUTER
    PH -.->|navigate 'main-menu'| ROUTER

    style STORE stroke-dasharray: 5 5
    style ROUTER fill:#2b2b4a,color:#fff
```

Screens never import each other. Screens receive the ability to navigate through their lifecycle context (a `navigate` callback and, later, the store), so the Router remains the only thing that knows the set of screens.

### Navigation Flow (Phase 1)

```mermaid
sequenceDiagram
    participant P as Player
    participant M as Main Menu
    participant R as Router
    participant PH as Placeholder Screen

    P->>M: click "Play" (or any Menu_Button)
    M->>M: apply active visual state (<100ms)
    M->>R: navigate("play")
    R->>M: unmount()
    R->>PH: mount(container, ctx) → "coming soon" + Back
    Note over R,PH: target rendered within 500ms

    P->>PH: click "Back"
    PH->>R: navigate("main-menu")
    R->>PH: unmount()
    R->>M: mount(container, ctx) → Main Menu restored

    P->>M: click "Settings" while placeholder shown
    Note over R: replace current placeholder with new one
```

## Components and Interfaces

### 1. `index.html` (entry point markup)

- Single HTML entry point at the **project root**.
- Declares `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.
- Links three stylesheets in order: reset/base → theme → menu.
- Contains a single mount root: `<div id="app"></div>`.
- Contains a static, no-JS fallback error region (hidden by default) used if the module fails to load: `<div id="boot-error" hidden>…</div>`.
- References the entry module with exactly one `<script type="module" src="js/main.js"></script>`.
- Includes a `<noscript>` message and, to satisfy the "failed to load" requirement without JS, an inline `window.addEventListener('error', …)` guard is avoided in favor of a bootstrap `try/catch` (see Error Handling).

### 2. `js/main.js` — Bootstrap / Application Entry Point

**Primary responsibility:** initialize the application and wire modules together. It owns startup, nothing else.

```js
// main.js (shape, not final code)
import { createRouter } from './router.js';
import { screenRegistry } from './config/screens.js';
import { createStore } from './state/game-state.js';

export function boot(rootSelector = '#app') { /* ... */ }
```

Behavior:
1. Resolve the `#app` container; if missing, reveal `#boot-error`.
2. Create the store scaffold (Phase 1: minimal).
3. Create the Router with the container and `screenRegistry`.
4. Register each screen from the registry.
5. Navigate to the initial screen (`'main-menu'`).
6. Wrap 1–5 in `try/catch`; on failure, reveal the on-screen "failed to load" message (Requirement 2.5).

`boot()` is exported (for testability) and also invoked at module end so the game starts on load.

### 3. `js/router.js` — General Screen Navigation

**Primary responsibility:** switch the visible screen. It is the only module aware of the full screen set at runtime.

```js
// router.js (shape)
export function createRouter(container) {
  // registry: Map<string, ScreenDescriptor>
  return {
    register(id, screenFactory),      // add a screen; future screens plug in here
    navigate(id),                     // switch to screen id (single operation, Req 4.2)
    getCurrentScreenId(),             // introspection for tests
    hasScreen(id),                    // registry query
  };
}
```

- `navigate(id)`:
  - If `id` is **not** registered → leave current screen unchanged, and report "screen not found" (console warning + return a falsy/`false` result) per Requirements 4.3 and 3-of-Req-6 handling. No throw.
  - If registered → call `unmount()` on the current screen (if any), instantiate/`mount()` the target into the container, and record it as current.
- `register(id, factory)` is how the registry and future phases add screens **without modifying Router internals**.
- The Router depends only on the **Screen Lifecycle Contract**, never on concrete screen modules.

### 4. Screen Lifecycle Contract

Every screen — Main Menu, placeholders, and every future screen — conforms to this contract. This is the seam that keeps the Router general.

```js
/**
 * @typedef {Object} ScreenContext
 * @property {(id: string) => boolean} navigate  // request a screen switch
 * @property {Store} [store]                       // central state (future: read/update)
 *
 * @typedef {Object} Screen
 * @property {(container: HTMLElement, ctx: ScreenContext) => void} mount    // render into container
 * @property {() => void} [unmount]                                          // tear down / cleanup
 * @property {string} [title]                                                // optional display name
 */
```

- `mount(container, ctx)`: build DOM into `container`, wire event listeners, use `ctx.navigate(id)` for transitions.
- `unmount()`: remove listeners and clear its DOM. Optional; Router clears the container if absent.
- Screens are produced by **factories** (`() => Screen`) so each navigation gets a fresh, isolated instance.

### 5. `js/screens/main-menu.js` — Main Menu UI Module

**Primary responsibility:** render and manage the Main Menu (title, five buttons, artwork). Distinct from bootstrap and Router (Requirement 4.4).

- Renders the title text **"Gemoria: Crystal Quest"**.
- Renders exactly **five** `Menu_Button`s: `Play`, `World Map`, `Boosters`, `Achievements`, `Settings`, each mapped to a target screen id.
- Renders inline-SVG Placeholder_Artwork containing at least one crystal/gem shape.
- On button activation: apply an active visual state (`<100ms`, via CSS class toggle) then call `ctx.navigate(targetId)`.
- Button → screen id map (data, not hardcoded control flow):

  | Label | Screen id |
  |---|---|
  | Play | `play` |
  | World Map | `world-map` |
  | Boosters | `boosters` |
  | Achievements | `achievements` |
  | Settings | `settings` |

### 6. `js/screens/placeholder.js` — Placeholder Screen Factory

**Primary responsibility:** produce a "coming-soon" screen for any not-yet-built feature.

```js
export function createPlaceholderScreen({ title, message }) { /* returns Screen */ }
```

- `mount` renders the feature title, a "not yet available" message (Requirement 6.4 / 9.3), and a **Back** control that calls `ctx.navigate('main-menu')` (Requirements 6.5, 9.5).
- One factory serves all five placeholder destinations; the registry supplies per-feature `title`/`message`.

### 7. `js/config/screens.js` — Screen Registry

**Primary responsibility:** declare the set of screens and how to build each one. This is the single place that lists screens; adding a future screen is a registry entry plus a module.

```js
import { mainMenuScreen } from '../screens/main-menu.js';
import { createPlaceholderScreen } from '../screens/placeholder.js';

export const screenRegistry = [
  { id: 'main-menu', factory: () => mainMenuScreen() },
  { id: 'play',         factory: () => createPlaceholderScreen({ title: 'Play',         message: 'Crystal matching is coming soon.' }) },
  { id: 'world-map',    factory: () => createPlaceholderScreen({ title: 'World Map',    message: 'The realm map is coming soon.' }) },
  { id: 'boosters',     factory: () => createPlaceholderScreen({ title: 'Boosters',     message: 'Boosters are coming soon.' }) },
  { id: 'achievements', factory: () => createPlaceholderScreen({ title: 'Achievements', message: 'Achievements are coming soon.' }) },
  { id: 'settings',     factory: () => createPlaceholderScreen({ title: 'Settings',     message: 'Settings are coming soon.' }) },
];
```

Future phases replace a placeholder entry with a real screen (e.g., swap `play`'s factory to the game board, add `level-select`, `results`) — the Main Menu and Router remain untouched.

### 8. `js/state/game-state.js` — Central Game State (Extension-Point Scaffold)

**Primary responsibility:** provide a framework-free central store. **Phase 1 status: minimal scaffold only.** No progression, coins, lives, boosters, or level logic is implemented; those are documented shapes for future phases.

```js
// game-state.js (Phase 1 scaffold)
export function createStore(initialState = {}) {
  let state = { ...initialState };
  const subscribers = new Set();
  return {
    getState: () => state,
    setState: (patch) => { state = { ...state, ...patch }; subscribers.forEach(fn => fn(state)); },
    subscribe: (fn) => { subscribers.add(fn); return () => subscribers.delete(fn); },
  };
}
```

The bootstrap may create a store and pass it through `ScreenContext` so future systems read/update it without coupling to each other. In Phase 1 the Main Menu does not depend on store contents.

## Data Models

Phase 1 has almost no runtime data model beyond the screen registry. The models below are split into *Phase 1 (implemented)* and *Future (documented shape only)*.

### Phase 1 — Implemented

**ScreenDescriptor** (registry entry)
```
ScreenDescriptor = {
  id: string,                 // unique screen identifier, e.g. "main-menu"
  factory: () => Screen       // builds a fresh screen instance
}
```

**Screen** (runtime object — see Lifecycle Contract)
```
Screen = {
  mount(container: HTMLElement, ctx: ScreenContext): void,
  unmount?(): void,
  title?: string
}
```

**MenuItem** (Main Menu button data)
```
MenuItem = { label: string, screenId: string }
```

### Future — Documented Shape Only (NOT implemented in Phase 1)

**Central Game State** (future contents of the store)
```
GameState = {
  progression: { currentLevel: number, starsByLevel: Record<number, 0|1|2|3> },
  coins: number,
  lives: number,
  boosters: Record<string, number>,   // boosterId → count owned
  settings: { sound: boolean, music: boolean, reducedMotion: boolean }
}
```

**Data-Driven Level Schema** (future `data/levels/*.json`, loaded by a future level loader)
```
Level = {
  id: number,                 // 1..100+
  goals: Array<{ type: "clear-crystals" | "collect" | "score", target: number, ... }>,
  moves: number,              // move budget
  grid: { rows: number, cols: number },
  layout: string[],           // rows of cell codes: gem colors, blockers, empty
  obstacles?: Array<{ type: string, at: [number, number] }>,
  availableBoosters?: string[]
}
```
The intended loader concept: a future `level-loader.js` reads `levels/index.json` (a manifest of level ids) and fetches each `Level` on demand, so supporting **100+ levels** is a data change, not an engine change. The match-3 engine consumes a validated `Level` object and never hardcodes level content — this keeps the core engine stable as content grows.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

PBT applies to Phase 1's **pure navigation and rendering logic**: the Router's screen resolution over an arbitrary registry, and the data-driven rendering of menu buttons and placeholder screens. Visual/layout, timing, and structural-organization criteria are covered by example, edge-case, and smoke tests in the Testing Strategy rather than by properties (see prework classification). The properties below were consolidated during property reflection to remove redundancy (e.g., the general `navigate` properties subsume the "replace current placeholder", "block deferred invocation", and "respond to activation" criteria).

Screens are tested against a DOM (jsdom or a real browser via a test runner) and a spy `navigate`. The Router is tested with synthetic screen descriptors whose `mount`/`unmount` record calls.

### Property 1: Navigating to a registered screen makes it current from any prior state

*For any* screen registry containing a set of screen ids, *for any* starting current screen (including none), and *for any* target id that IS registered, calling `navigate(targetId)` SHALL unmount the previously mounted screen (if any), mount the target screen, and make the target the current screen.

**Validates: Requirements 4.2, 6.3**

### Property 2: Navigating to an unregistered screen leaves state unchanged and reports not-found

*For any* screen registry, *for any* currently mounted screen, and *for any* target id that is NOT registered, calling `navigate(targetId)` SHALL leave the current screen unchanged (no unmount, no new mount) and SHALL produce a "screen not found" indication.

**Validates: Requirements 4.3, 9.4**

### Property 3: The Main Menu renders one enabled, activatable button per menu item with a matching label

*For any* list of `MenuItem` records, mounting the Main Menu SHALL render exactly one enabled, activatable button per item, and each rendered button's label SHALL equal its item's label. (With the Phase 1 configuration this yields the five buttons Play, World Map, Boosters, Achievements, Settings.)

**Validates: Requirements 6.1, 10.3**

### Property 4: Activating a menu button navigates to that item's mapped screen id

*For any* `MenuItem` in the rendered Main Menu, activating that item's button SHALL call `navigate` exactly once with that item's `screenId`.

**Validates: Requirements 6.2, 9.3, 10.4**

### Property 5: A placeholder screen renders its title and not-yet-available message for any inputs

*For any* `{ title, message }` pair, mounting the placeholder screen produced by the factory SHALL render text containing that title and that message.

**Validates: Requirements 6.4**

### Property 6: A placeholder's Back control returns to the Main Menu

*For any* placeholder screen instance, activating its Back control SHALL call `navigate('main-menu')`.

**Validates: Requirements 6.5, 9.5**

## Error Handling

| Condition | Detection | Handling | Requirement |
|---|---|---|---|
| Entry module fails to load/execute | `boot()` wrapped in `try/catch`; missing `#app` checked explicitly | Reveal static `#boot-error` region with a visible "The game failed to load." message; never leave the viewport blank | 2.5, 10.2 |
| Unknown / unregistered screen id passed to `navigate` | Registry lookup miss | Leave current screen unchanged; `console.warn` a "screen not found: <id>" message and return `false` | 4.3, 9.4 |
| Placeholder artwork (inline SVG) fails to render | Screen renders a themed container that is styled with a solid theme background regardless of SVG success | Menu shows solid-color background fallback; all buttons remain in the DOM and interactive | 7.4 |
| CSS custom property undefined at render time | `var()` usages always include a fallback, e.g. `var(--crystal-primary, #4b3f9e)` | Element stays visible against its background using the fallback color | 3.6 |
| Syntax error / uncaught exception during load | Native browser console; bootstrap `try/catch` for wired code | Error indication surfaces in console; boot-error region shown for fatal startup failures | 10.1, 10.2 |

Design notes:
- The `#boot-error` element is **static markup in `index.html`** (hidden via the `hidden` attribute) so it can be revealed even if JS module loading fails entirely.
- The Router never throws on a bad id; "silent, non-destructive, reported" is the contract, which also serves as the guard for any attempt to reach a deferred (non-existent) Phase 1 target.

## Testing Strategy

The project is Vanilla JS with ES modules and no framework. Tests use a lightweight runner that supports ES modules and a DOM (recommended: a runner with jsdom, or headless-browser tests). Property tests use an established JS property-testing library (recommended: **fast-check**) — property tests are **not** implemented from scratch.

### Dual Approach

- **Property tests** — universal navigation/rendering logic (Properties 1–6). Each property test:
  - Runs a **minimum of 100 iterations** (fast-check default is adequate; set explicitly).
  - Is tagged with a comment referencing its design property, format:
    `// Feature: gemoria-crystal-quest, Property <number>: <property text>`
  - Is implemented as a **single** property test per correctness property.
  - Generators: arbitrary arrays of `MenuItem` (`{ label, screenId }`), arbitrary registries of synthetic screens, arbitrary registered/unregistered id pairs, arbitrary `{ title, message }` strings.

- **Example / unit tests** — specific, non-universal behaviors:
  - Boot renders the Main Menu into `#app` (2.1, 4.5, 5.1).
  - Title text equals "Gemoria: Crystal Quest" and remains present while mounted (5.1, 5.3).
  - Active-state CSS class toggles on button activation (6.6).
  - Menu renders inline `<svg>` with a crystal/gem shape and references **no** external image files (7.1, 7.2, 7.3, 7.5).
  - Touch-target computed styles meet 44×44px and ≥8px spacing (8.3).
  - **No-console-error check:** boot the app with a spy on `console.error` (and an `error`/`unhandledrejection` listener); assert zero errors from parse through initial Main Menu render (2.4, 10.1).

- **Edge-case tests:**
  - Force `boot()` failure (missing `#app` / thrown error) → `#boot-error` becomes visible (2.5, 10.2).
  - Render menu with artwork omitted/failing → buttons still present and activatable (7.4).
  - `var()` fallback presence check in CSS (3.6).

- **Smoke / structural checks** (run once; deterministic, non-input-varying):
  - Directory layout: markup at root, `css/` and `js/` separated by concern (1.1, 1.2, 1.3, 1.5).
  - `index.html` has exactly one `<script type="module">`, three stylesheet links, and the correct viewport meta (2.2, 2.3, 8.4).
  - Theme CSS defines colors + typography; base and menu CSS carry no theme color literals; colors are CSS custom properties (3.1–3.5).
  - Phase-1 scope: no board DOM and no deferred-system modules in the Phase 1 module graph (9.1, 9.2).

- **Manual / visual checks** (responsive layout, hard to assert reliably headless):
  - Single vertical column ≤768px with 16px side margins; centered, max-width 960px >768px (8.1, 8.2).
  - No horizontal overflow across 320–2560px; vertical scroll when content is tall (8.5, 8.6).
  - Title fully within viewport, not clipped, across breakpoints (5.2, 5.4).

### Run-over-HTTP note

ES modules are subject to CORS and will not load from `file://`. All tests and manual verification MUST serve the project over HTTP (for example, `python -m http.server` or `npx serve` from the project root, then open `http://localhost:<port>/`). This constraint, and the exact serve command, are documented in the README run instructions (10.5, 10.6). Opening `index.html` directly from the file system is not supported.

## Phase 1 vs Future Extension Points

| System / Component | Phase 1 status | Notes |
|---|---|---|
| `index.html` entry point | **Implemented** | Root, viewport meta, 3 CSS links, single module script, `#app` + `#boot-error`. |
| `js/main.js` bootstrap | **Implemented** | Wires registry + router + store scaffold; `try/catch` fallback. |
| `js/router.js` (general navigation) | **Implemented** | `register` / `navigate` / lifecycle contract; **general**, not menu-only. |
| Screen Lifecycle Contract (`mount`/`unmount`) | **Implemented** | The seam all future screens conform to. |
| `js/screens/main-menu.js` | **Implemented** | Title, 5 buttons, inline-SVG crystal artwork. |
| `js/screens/placeholder.js` factory | **Implemented** | "Coming-soon" + Back for all five destinations. |
| `js/config/screens.js` registry | **Implemented** | Declares screen ids; the single place new screens are added. |
| `js/state/game-state.js` store | **Minimal scaffold** | `getState`/`setState`/`subscribe` pub-sub only; no real contents used by the menu. |
| Central Game State contents (progression, coins, lives, boosters, settings) | **Future** | Documented `GameState` shape; store scaffold is the home for it. |
| Match-3 board & rendering | **Future** | Registered later by swapping `play`'s factory; no Main Menu/Router edits. |
| Match detection, special gems, obstacles | **Future** | New modules consumed by the future board screen. |
| Boosters logic | **Future** | New module + real `boosters` screen. |
| Levels / data-driven level system | **Future** | `data/levels/*.json` + `level-loader.js`; supports 100+ levels as data, not engine changes. |
| Sound, animation | **Future** | New modules; opt-in via store settings. |
| Save / persistence | **Future** | Future store adapter (e.g., `localStorage`); no schema in Phase 1. |
| World Map, Level Select, Achievements, Settings, Results screens | **Future** | Placeholders now; each becomes a registered screen implementing the contract. |

### How future phases stay additive

Adding the game board (or any screen) later is a two-step, non-invasive change:

1. Add a new screen module (e.g., `js/screens/game-board.js`) implementing `mount(container, ctx)` / `unmount()`.
2. Register it in `js/config/screens.js` — either a new id (`level-select`, `results`) or by replacing a placeholder's `factory` (e.g., point `play` at the board).

Because the bootstrap iterates the registry and the Router depends only on the lifecycle contract, **no changes are required to `main.js`, `router.js`, or `main-menu.js`**. The store scaffold, passed through `ScreenContext`, gives future systems a shared read/update channel without direct coupling between them.
---

# Phase 2 Technical Design: Core Match-3 Gameplay

This section extends the Phase 1 design. All Phase 1 content above is preserved unchanged. Phase 2 adds the core match-3 gameplay for **SnoopsGem : Crystal**, building on the Phase 1 foundation without rewriting it.

> Naming note: the Phase 1 sections above use an older working title. The official game name is **SnoopsGem : Crystal**, used throughout this Phase 2 design. See the *Design Validation* section for a non-blocking later cleanup item regarding the hardcoded title string in `main-menu.js`.

## Phase 2: Overview

Phase 2 delivers a playable 8×8 match-3 board with six gem types: gem selection, adjacent swapping, match detection, gem removal, gravity, refill, and automatic cascade resolution — playable with both mouse click and touch tap on desktop and mobile.

Phase 2 preserves the existing Phase 1 architecture. The general Screen Router (`js/router.js`), the data-driven screen registry (`js/config/screens.js`), the bootstrap (`js/main.js`), the central store scaffold (`js/state/game-state.js`), the Main Menu (`js/screens/main-menu.js`), and the placeholder screens all continue to function unchanged.

**How Phase 2 plugs into Phase 1:** the Main Menu already renders a **Play** button that calls `ctx.navigate('play')`. Today the registry maps `'play'` to a placeholder screen. The **only** integration change in Phase 2 is to repoint the `'play'` entry in `js/config/screens.js` from the placeholder factory to a new `createGameBoardScreen` factory. This requires **zero** changes to `main-menu.js`, `router.js`, or `main.js` — because the bootstrap iterates the registry and the Router depends only on the Screen Lifecycle Contract (Requirement 24).

New modules added in Phase 2 (each single-responsibility; gameplay logic decoupled from UI):

| Module | Concern | DOM? |
|---|---|---|
| `js/config/board-config.js` | Board dimensions and gem-type set as data | No |
| `js/gem.js` | Gem creation, random generation, type validation | No (PURE) |
| `js/board.js` | Board structure, cells, swap, gravity, refill, generation, consistency | No (PURE) |
| `js/match.js` | Match detection only | No (PURE) |
| `js/screens/game-board.js` | Game_Board_Screen: UI, input, selection, orchestration | Yes (ONLY DOM module) |

`board.js`, `gem.js`, and `match.js` are pure — no DOM, no timers, no globals — so they are unit- and property-testable without a browser. Only `js/screens/game-board.js` touches the DOM. Phase 2 does **not** add a JS animation module (see the ownership table).

## Phase 2: Board Architecture

### Board representation

The board is a **row-major 2D array**: `board[row][col]`, where `row` ranges 0–7 top→bottom and `col` ranges 0–7 left→right, origin at the top-left cell `(0,0)`.

Justification: a 2D array mirrors the visual grid directly, makes row scans (horizontal match) and column scans (vertical match) straightforward, and makes gravity a simple per-column compaction. It is the smallest representation that satisfies the requirements without introducing an index-math abstraction that a fixed 8×8 board does not need. Indexing convention is fixed everywhere: **row first, then column** (`board[row][col]`).

### Cell coordinates

A cell is addressed by `(row, col)` with `0 ≤ row ≤ 7` and `0 ≤ col ≤ 7` (Req 11.4). The origin `(0,0)` is the top-left cell; `row` increases downward, `col` increases rightward. Any reference outside this range is invalid (Req 11.5).

### Gem representation

A `Gem` is minimal:

```
Gem = {
  type: GemType,   // one of the six defined Gem_Types
  id: string       // optional: stable unique id for render/animation keying
}
```

The `id` exists only to give the renderer a stable key for a gem as it moves during gravity; it carries no gameplay meaning. There are **no** special-gem fields (no line/rainbow/bomb flags) — those are out of scope (Req 12, Phase 2 scope boundary).

An **empty cell** is represented by `null` (permitted only transiently during removal/gravity/refill — see intermediate states below).

### Gem_Type configuration (data, not scattered literals)

The six gem types — **Ruby, Sapphire, Emerald, Topaz, Amethyst, Amber** — are defined once as a data collection in `js/config/board-config.js` (Req 12.1, 12.3). No match, gravity, or refill logic hardcodes a type literal; all reference the config set.

### Board configuration (all data values)

`js/config/board-config.js` exports the tunable constants as data (Req 11.3, 12.3):

```
ROWS = 8
COLS = 8
MIN_MATCH = 3
GEM_TYPES = ['Ruby', 'Sapphire', 'Emerald', 'Topaz', 'Amethyst', 'Amber']
```

Board dimensions and the gem-type set live only here; match/gravity/refill logic reads them rather than embedding `8` or type strings.

### Board state lifecycle

```
generate → Stable_Board
  → player selects Gem A
  → player selects adjacent Gem B
  → swap A/B
  → detect matches on resulting board
     ├─ match present:  remove → gravity → refill → detect → (cascade until zero matches) → Stable_Board
     └─ no match:       revert swap → prior Stable_Board
  → re-enable input
```

The player may only act when the board is a **Stable_Board**.

### Stable_Board definition

A **Stable_Board** is a board where all 64 cells contain exactly one gem of a valid Gem_Type and the board contains zero Matches (Req 13.3, 21.1). The player is permitted to select/swap **only** when the board is Stable.

### Intermediate states

During removal, gravity, and refill, the board is **not** Stable and the following holds:

- Temporary empty cells (`null`) **are** allowed between removal and the completion of refill (Req 21.2).
- The board dimensions remain exactly 8×8 and every **occupied** cell holds a valid Gem_Type even in intermediate states (Req 21.3).
- The board is **never** presented to the player as ready-to-play while any cell is empty or holds more than one gem (Req 21.6). Input remains blocked until the board returns to Stable (Req 20.4).

## Phase 2: Core Engine — Modules, Responsibilities, and Interfaces

Each module below has a single primary responsibility. Signatures are given with JSDoc-style descriptions and no function bodies. Pure modules take an injectable RNG where randomness is involved, so tests are deterministic.

### `js/config/board-config.js` — configuration data

Owns the data-driven board constants. Config-as-data satisfies Req 11.3 and 12.3: dimensions and the gem-type set are declared in one place, so changing them is a data edit and no logic module hardcodes them.

```
/** @type {number} */ export const ROWS;        // 8
/** @type {number} */ export const COLS;        // 8
/** @type {number} */ export const MIN_MATCH;   // 3
/** @type {ReadonlyArray<string>} */ export const GEM_TYPES; // the six types
```

### `js/gem.js` — gem creation and validation (PURE)

Owns gem creation, random gem generation (with injectable RNG for deterministic tests), and Gem_Type validation (Req 12.1, 12.2, 12.4). No DOM.

```
/**
 * Create a gem of a given valid type.
 * @param {string} type  Must be one of GEM_TYPES.
 * @param {string} [id]  Optional stable id for render keying.
 * @returns {Gem}
 * @throws or returns null-signal if type is invalid (see error handling).
 */
export function createGem(type, id) {}

/**
 * Produce a random valid gem.
 * @param {() => number} rng  Injectable RNG returning [0,1); defaults to Math.random.
 * @returns {Gem}
 */
export function randomGem(rng) {}

/**
 * Validate a Gem_Type against the configured set.
 * @param {string} type
 * @returns {boolean}  true iff type ∈ GEM_TYPES.
 */
export function isValidGemType(type) {}
```

### `js/board.js` — board structure and operations (PURE)

Owns board creation; cell bounds validation (Req 11.4, 11.5); get/set cell; swapping two cells' gems; gravity (Req 18); refill (Req 19); initial no-match board generation (Req 13); and Stable_Board / consistency checks (Req 21). May import `gem.js` and `match.js`. No DOM.

```
/**
 * Create an empty ROWS×COLS board (all cells null).
 * @returns {Board}
 */
export function createBoard() {}

/**
 * @param {number} row @param {number} col
 * @returns {boolean}  true iff 0<=row<ROWS and 0<=col<COLS.  (Req 11.4)
 */
export function isValidCell(row, col) {}

/**
 * Read a cell.
 * @returns {Gem|null}
 * @throws/rejects on out-of-bounds (Req 11.5) leaving board unchanged.
 */
export function getCell(board, row, col) {}

/**
 * Return a new board with a cell set, if the coordinates and gem are valid;
 * otherwise reject and return the prior board unchanged (Req 11.5, 12.4).
 * @returns {Board}
 */
export function setCell(board, row, col, gem) {}

/**
 * Swap the gems in two cells. Caller guarantees adjacency (validated in the
 * screen / adjacency predicate). Returns a new board.
 * @returns {Board}
 */
export function swapCells(board, a, b) {}   // a,b = {row,col}

/**
 * Apply gravity to every column: non-empty gems fall to the lowest cells,
 * empties rise to the top, relative vertical order preserved (Req 18).
 * @returns {Board}
 */
export function applyGravity(board) {}

/**
 * Fill every empty (null) cell at the top of columns with a fresh valid gem
 * (Req 19). RNG injectable for tests.
 * @param {() => number} rng
 * @returns {Board}
 */
export function refill(board, rng) {}

/**
 * Remove all cells in `matchedCells`, setting them to null (Req 17).
 * @param {ReadonlyArray<{row:number,col:number}>} matchedCells
 * @returns {Board}
 */
export function removeCells(board, matchedCells) {}

/**
 * Generate a full Stable_Board containing zero Matches (Req 13). Uses a bounded
 * reroll strategy (see Safety Mechanisms). RNG injectable.
 * @param {() => number} rng
 * @returns {Board}
 */
export function generateStableBoard(rng) {}

/**
 * @returns {boolean}  true iff all 64 cells hold exactly one valid gem AND the
 * board has zero Matches (Req 21.1).
 */
export function isStableBoard(board) {}

/**
 * @returns {boolean}  true iff dimensions are 8×8 and every occupied cell has a
 * valid Gem_Type (Req 21.3). Allows transient empties (Req 21.2).
 */
export function isDimensionAndTypeValid(board) {}
```

### `js/match.js` — match detection only (PURE)

Owns **only** match detection: horizontal runs (Req 16.1), vertical runs (Req 16.2), all matches board-wide (Req 16.3), union of overlapping matches (Req 16.4), and a deterministic matched-cell representation with a defined empty-case result (Req 16.5). No DOM.

```
/**
 * Find every matched cell on the board: the union of all horizontal and
 * vertical runs of MIN_MATCH or more same-type contiguous gems. Overlapping
 * runs are unioned. Result is deterministic: a list of {row,col} sorted by row
 * then col, with no duplicates. Empty when no run exists (Req 16.5).
 * @returns {Array<{row:number,col:number}>}
 */
export function findMatches(board) {}

/**
 * @returns {boolean}  true iff findMatches(board) is non-empty.
 */
export function hasMatches(board) {}
```

### `js/screens/game-board.js` — Game_Board_Screen (ONLY DOM module)

The Game_Board_Screen. The only module that touches the DOM. Conforms to the Screen Lifecycle Contract: a factory returning `{ mount(container, ctx), unmount(), title }` where `ctx = { navigate(id), store }`.

Owns: selection state; adjacent-cell validation for input routing (Req 15.2); orchestrating swap→resolve by calling `board`/`match` (Req 15); cascade orchestration until Stable (Req 20); blocking new input during cascade (Req 20.4); rendering the 8×8 grid; mouse click + touch tap input (Req 22 — click/tap only, **no** swipe/drag); responsive square layout across 320–2560px with no horizontal overflow and vertical scroll allowed (Req 23); and the return-to-Main_Menu control (Req 23.5, Req 24.3).

```
/**
 * Create the Game_Board_Screen.
 * @param {{ rng?: () => number }} [config]  Optional injectable RNG for tests.
 * @returns {Screen}  { mount(container, ctx), unmount(), title }
 */
export function createGameBoardScreen(config) {}
```

Internally it holds transient UI state (current board, current `Selected_Gem` or none, and an `isResolving` flag that gates input during cascades). It calls the pure engine for all logic and re-renders after each resolved step; it never embeds match/gravity/refill logic itself.

### `js/animation.js` — NOT required for Phase 2

Phase 2 does **not** introduce a JS animation module. The 300 ms UI-update budgets (Req 15.6, 17.3, 19.3) and the 100 ms visual-change budget (Req 22.5) are satisfiable by a direct DOM re-render after each resolved step. Any easing/transition is pure CSS (e.g., a CSS transition on the selection highlight or on cell repositioning). Introducing a JS animation engine now would exceed Phase 2 scope.

### Ownership table (each capability owned by exactly one module)

| Capability | Owning module |
|---|---|
| Board creation | `board.js` |
| Random gem generation | `gem.js` |
| Initial no-match generation | `board.js` (uses `gem.js`, `match.js`) |
| Cell (bounds) validation | `board.js` |
| Adjacent-cell validation | `screens/game-board.js` (input) via an adjacency predicate |
| Gem selection | `screens/game-board.js` |
| Swap | `board.js` (`swapCells`); triggered by `screens/game-board.js` |
| Match detection | `match.js` |
| Match removal | `board.js` (`removeCells`) |
| Gravity | `board.js` |
| Refill | `board.js` (uses `gem.js`) |
| Cascade resolution (orchestration) | `screens/game-board.js` |
| Stable-board validation | `board.js` |

There is deliberately **no single god module**: pure logic (`board`/`gem`/`match`) is decoupled from the UI (`screens/game-board.js`), and each capability has exactly one home. The adjacency predicate is a small pure helper used by the screen when routing input (it may live in `board.js` as `isAdjacent(a, b)` or inline in the screen; it belongs to the input-validation concern, Req 15.2).

### Module dependency diagram

```mermaid
graph TD
    REG[config/screens.js — 'play' entry] --> GB[screens/game-board.js]
    GB --> BOARD[board.js]
    GB --> MATCH[match.js]
    GB --> GEM[gem.js]
    GB --> CFG[config/board-config.js]
    BOARD --> MATCH
    BOARD --> GEM
    BOARD --> CFG
    GEM --> CFG
    MATCH --> CFG

    style GB fill:#2b2b4a,color:#fff
    style REG stroke-dasharray: 4 4
```

Pure modules (`board`, `match`, `gem`, `board-config`) never import the screen; only the screen imports them. The screen reaches the app solely through the registry `'play'` entry and the Screen Lifecycle Contract.

## Phase 2: Swap Flow

```mermaid
flowchart TD
    Start([Board is Stable, input enabled]) --> Act{Player activates a cell}
    Act -->|no Selected_Gem, cell has gem| SelA[Set Selected_Gem = cell • Req 14.1]
    SelA --> Wait[Await next activation]
    Wait --> Act2{Player activates a cell}
    Act2 -->|same cell as selected| Deselect[Clear Selected_Gem • Req 14.3] --> Start
    Act2 -->|adjacent occupied cell| Swap[Swap A and B • Req 15.1/15.2]
    Act2 -->|non-adjacent occupied cell| Reselect[Selected_Gem = new cell • Req 15.3] --> Wait
    Swap --> Detect{Resulting board has ANY Match anywhere? • Req 15.4/15.5}
    Detect -->|yes| Keep[Keep swap, clear selection • Req 15.4]
    Keep --> Block[Block input • Req 20.4]
    Block --> Remove[Remove matched gems • Req 17]
    Remove --> Gravity[Apply gravity • Req 18]
    Gravity --> Refill[Refill empties • Req 19]
    Refill --> Detect2{Any Match now? • Req 20.1/20.2}
    Detect2 -->|yes| Remove
    Detect2 -->|no| Stable[Board is Stable_Board • Req 20.3]
    Stable --> Enable[Re-enable input] --> Start
    Detect -->|no| Revert[Revert swap to prior Stable_Board, clear selection • Req 15.5]
    Revert --> Start
```

**Prose.** From a Stable_Board with input enabled: activating an occupied cell when nothing is selected sets it as the `Selected_Gem` (Req 14.1). The next activation branches:

- **Same cell** → deselect and return to the stable idle state (Req 14.3).
- **Adjacent occupied cell** → attempt a swap between the two adjacent gems (Req 15.1, 15.2).
- **Non-adjacent occupied cell** → reject the swap and re-select the newly activated cell as the new `Selected_Gem` (Req 15.3).

On a swap, the engine detects whether the **resulting** board contains **any** Match **anywhere** (Req 15.4/15.5):

- **Match present** → keep the swap and clear the selection (Req 15.4). Input is blocked (Req 20.4) while the resolution loop runs: remove matched gems (Req 17) → gravity (Req 18) → refill (Req 19) → detect again; repeat automatically as a Cascade until the board has zero matches (Req 20.1, 20.2), which is by definition a Stable_Board (Req 20.3). Then re-enable input.
- **No match** → revert both gems to their pre-swap cells, returning to the prior Stable_Board, and clear the selection (Req 15.5). Input stays enabled.

Throughout the cascade the player cannot initiate a new swap until the board is Stable again (Req 20.4).

## Phase 2: Algorithms (design-level pseudocode prose)

**Initial no-match board generation** (Req 13). Fill the board cell by cell in a fixed order (e.g., row-major). For each cell, choose a random valid gem type, but exclude any type that would immediately complete a run of `MIN_MATCH` with the already-placed gems to its left (same row) or above (same column). This "avoid-creating-a-match-while-filling" approach yields a no-match board on the first pass in the common case. As a safeguard, if a cell has no legal choice (rare), reroll that cell within a bounded attempt count, and if still stuck, regenerate the whole board within a capped number of full attempts (see Safety Mechanisms). After filling, assert `findMatches` is empty; the result is a Stable_Board (Req 13.1, 13.3, 13.4).

**Cell validation** (Req 11.4, 11.5). `isValidCell(row, col)` returns true iff `0 ≤ row < ROWS` and `0 ≤ col < COLS`. Any `getCell`/`setCell`/operation given an out-of-range coordinate is rejected and the board is returned unchanged.

**Adjacent-cell validation** (Req 15.2). Two cells `a` and `b` are adjacent iff they are in the same row with columns differing by 1, or the same column with rows differing by 1: `(a.row === b.row && |a.col − b.col| === 1) || (a.col === b.col && |a.row − b.row| === 1)`.

**Swap** (Req 15). Given two adjacent cells, produce a new board with their gems exchanged (`swapCells`). The screen then runs match detection on the result to decide keep-vs-revert.

**Match detection** (Req 16). Scan each **row** left→right tracking the current run of equal-type contiguous gems; whenever a run reaches length `≥ MIN_MATCH`, add all cells of that run to the matched set. Scan each **column** top→bottom identically. Union horizontal and vertical results (overlapping cells appear once — Req 16.4). Return the union as a deterministic list of `{row, col}` **sorted by row then col** (Req 16.5); an empty board or a board with no run ≥ MIN_MATCH returns the empty list. Complexity is `O(ROWS × COLS)` — each cell is visited a constant number of times.

**Match removal** (Req 17). Set every cell in the matched set to `null`, leaving all non-matched cells untouched.

**Gravity** (Req 18). For each column independently, collect the non-null gems from bottom to top preserving their order, then rewrite the column so those gems occupy the lowest cells (bottom-up) and the remaining top cells become `null`. A column with no empty cell is unchanged. This preserves the relative vertical order and the multiset of gems within the column.

**Refill** (Req 19). For each `null` cell (which after gravity are all at the tops of columns), generate a fresh random valid gem via `gem.js`. After refill every cell is occupied.

**Cascade resolution** (Req 20). Loop: run match detection; if empty, stop — the board is Stable. Otherwise remove → gravity → refill, then loop again. The loop is bounded (see Safety Mechanisms) and guaranteed to terminate at a Stable_Board.

**Stable-board validation** (Req 21). `isStableBoard` returns true iff every one of the 64 cells holds exactly one gem of a valid type **and** `findMatches` is empty. The screen only presents the board as ready-to-play when this holds.

## Phase 2: Safety Mechanisms

**(a) Pathological initial generation** (Req 13.4). Generation uses the constraint-aware fill described above so a match is normally never created. Two bounded guards ensure termination: a per-cell reroll cap (a small fixed number of alternative type attempts for a single cell) and, if a cell still cannot be placed legally, a capped number of full-board regeneration attempts. Because there are six gem types and each cell only needs to avoid at most two forbidden types (the type completing a horizontal run and the type completing a vertical run), a legal choice almost always exists, so the caps are generous and generation reliably terminates with a no-match Stable_Board.

**(b) Accidental infinite cascade loops** (Req 20.2, 20.3). The cascade loop carries an explicit iteration bound. Each cascade iteration removes at least `MIN_MATCH` (3) gems from the finite 64-cell board before refill; the number of *distinct* cascade rounds a single move can trigger is therefore small and bounded. A safe upper bound well above any reachable value (e.g., on the order of the total cell count, `ROWS × COLS`) is used purely as a guard: reaching it indicates a logic defect, at which point the loop stops and the board is validated. Under correct logic the loop always exits naturally when `findMatches` is empty, leaving a Stable_Board.

**(c) Invalid board states.** Operations that would produce an invalid result reject and retain the prior Stable_Board (Req 21.5, 21.6). Out-of-bounds cell references are rejected leaving state unchanged (Req 11.5). Assigning a gem of an invalid Gem_Type is rejected, retaining the affected cell's prior gem (Req 12.4). The board is never surfaced as ready-to-play unless `isStableBoard` is true.

## Phase 2: State Management Integration

Gameplay state — the current board, the `Selected_Gem`, and the `isResolving` flag — is owned by `js/board.js` (the board data) and `js/screens/game-board.js` (the transient UI/selection state). It is **not** dumped into the global store. The existing store scaffold (`js/state/game-state.js`) is passed through `ScreenContext` as `ctx.store` and remains available, but Phase 2 keeps coupling minimal and does not push per-move board state into it. The store stays the intended future home for cross-screen concerns such as progression, coins, lives, and settings — all out of scope for Phase 2. This keeps the pure engine independent of the store and testable in isolation.

## Phase 2: Error Handling

| Condition | Detection | Handling | Requirement |
|---|---|---|---|
| Out-of-bounds cell reference | `isValidCell(row, col)` false | Reject the operation; return board unchanged | 11.5 |
| Invalid Gem_Type assignment | `isValidGemType(type)` false | Reject the assignment; retain the cell's prior gem | 12.4 |
| Initial generation produces matches | `findMatches` non-empty after fill | Bounded per-cell reroll, then capped full regenerate, until no-match Stable_Board | 13.4 |
| Non-adjacent occupied cell activated during selection | Adjacency predicate false, target occupied | Re-select the newly activated cell as `Selected_Gem`; no swap | 15.3 |
| Swap yields no match | `hasMatches` false on swapped board | Revert both gems to pre-swap cells; clear selection | 15.5 |
| Cascade fails to reach zero matches | Iteration bound reached | Stop the loop and validate; indicates a defect — guard prevents hang | 20.2, 20.3 |
| Inconsistent board about to be presented as ready | `isStableBoard` false | Reject the ready-state; retain prior Stable_Board | 21.5, 21.6 |
| Unknown screen id passed to Router | Existing Router registry miss | Existing Phase 1 behavior: leave current screen unchanged, warn "screen not found", return `false` | 4.3 (Phase 1) |

## Phase 2: Testing Strategy

The framework is **Vitest** (the existing Phase 1 tests use it). Pure modules (`board.js`, `gem.js`, `match.js`) are tested without a DOM. The Game_Board_Screen is tested with **jsdom** and a spy `navigate`.

### Dual approach

**Unit / example tests** mapping directly to Requirement 25 (one test each):

- 25.1 Generated board has exactly 8 rows and 8 columns.
- 25.2 Every gem on a generated board has a type from the six defined types.
- 25.3 A newly generated initial board contains zero matches.
- 25.4 A swap between two adjacent cells is accepted as a valid swap attempt.
- 25.5 A swap attempt between two non-adjacent cells is rejected.
- 25.6 A horizontal run of three or more same-type gems is detected as a match.
- 25.7 A vertical run of three or more same-type gems is detected as a match.
- 25.8 All gems in a detected match are removed; non-matched gems are retained.
- 25.9 After gravity, remaining gems in each column occupy the lowest cells preserving relative order.
- 25.10 After refill, every cell holds exactly one gem of a valid type.
- 25.11 A swap producing no match is reverted to the pre-swap positions.
- 25.12 Cascade resolution continues until zero matches, yielding a Stable_Board.

Additional example tests (jsdom) for UI/navigation behaviors: cell click and touch tap both route as a cell activation (22.1, 22.2); selecting an adjacent cell attempts a swap (15.1); re-activating the selected cell deselects (14.3); the return control navigates to `'main-menu'` (23.5, 24.3); `navigate('play')` mounts the Game_Board_Screen (24.1); no drag/swipe handlers are registered (22.3).

**Property-based tests** (at least two mandated by Req 25.13, 25.14; more listed under Correctness Properties). Each runs a **minimum of 100 iterations** and is tagged `// Feature: gemoria-crystal-quest, Property <n>: <text>`:

- **(P-a) Stable_Board after resolution** (Req 25.13): for many randomly generated boards and randomly chosen valid swaps, after the swap fully resolves (cascade to completion) the board is a Stable_Board — 64 cells, one valid gem each, zero matches, 8×8.
- **(P-b) Gravity preserves per-column multiset** (Req 25.14): for many randomly generated boards, applying gravity preserves the multiset of non-empty gems within each column (gravity neither creates nor destroys gems).

**Recommendation:** use **fast-check** with Vitest for property generation, or, if adding a dependency is undesirable, a hand-rolled seeded randomized generator loop (a `for` loop over ≥100 seeded random inputs). Either satisfies the "many randomly generated inputs" requirement; fast-check is preferred for shrinking of counterexamples. This is a recommendation, not a hard constraint.

Because `board`/`gem`/`match` are pure and take an injectable RNG, property tests can seed the RNG for reproducibility. The screen is exercised under jsdom for the UI-facing example tests.

## Phase 2: Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

These were consolidated during property reflection to remove redundancy: the Stable_Board invariant subsumes the "one gem per cell", "valid type", "zero matches", and "ready-state guard" criteria; the gravity property combines order- and multiset-preservation; match-detection combines horizontal, vertical, union, and empty-case behavior.

### Property 1: Stable_Board when playable

*For any* randomly generated board and *for any* sequence of valid adjacent swaps each resolved to completion, whenever the game presents the board as ready for a new move, the board SHALL be a Stable_Board: all 64 cells hold exactly one gem of a valid Gem_Type and the board contains zero Matches.

**Validates: Requirements 21.1, 21.6, 11.2, 19.2, 25.13**

### Property 2: Dimensions invariant (8×8)

*For any* board and *for any* completed operation (swap, removal, gravity, refill, or cascade), the resulting board SHALL have exactly 8 rows and 8 columns.

**Validates: Requirements 11.1, 21.3**

### Property 3: Valid Gem_Type invariant

*For any* board produced by any operation, every occupied cell SHALL hold a gem whose type is one of the six defined Gem_Types.

**Validates: Requirements 12.2, 21.3**

### Property 4: No match after cascade

*For any* board reached after cascade resolution completes, match detection SHALL report zero Matches.

**Validates: Requirements 20.2, 20.3**

### Property 5: Gravity preserves the gem multiset (and order)

*For any* board, applying gravity SHALL preserve, within each column, the multiset of non-empty gems and their relative vertical order (gravity neither creates nor destroys gems).

**Validates: Requirements 18.2, 18.3, 25.14**

### Property 6: Swap revert restores the prior state

*For any* Stable_Board and *for any* adjacent swap whose resulting board contains no Match, reverting that swap SHALL restore the board exactly to its pre-swap state.

**Validates: Requirements 15.5**

### Property 7: Match-detection determinism and correctness

*For any* board, match detection SHALL return the same deterministic set of matched cells (sorted by row then column) on repeated calls, comprising exactly the union of all horizontal and vertical runs of `MIN_MATCH` or more contiguous same-type gems, and the empty set when no such run exists.

**Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5**

### Property 8: Cascade termination

*For any* board, cascade resolution SHALL terminate within a bounded number of iterations and end in a Stable_Board.

**Validates: Requirements 20.2, 20.3**

## Phase 2: Design Validation Against Requirements 11–25

### Requirements trace table

| Requirement | Addressed by design element |
|---|---|
| 11 Board structure | Row-major 8×8 array; `board.js` `createBoard`, `isValidCell`, `getCell`/`setCell`; `board-config.js` ROWS/COLS |
| 12 Gem types | `board-config.js` GEM_TYPES (six); `gem.js` `isValidGemType`, validation on assignment |
| 13 Initial no-match generation | `board.js` `generateStableBoard` (constraint-aware fill + bounded reroll); `match.js` verify empty |
| 14 Gem selection | `screens/game-board.js` selection state; select/deselect branches |
| 15 Swap interaction | Adjacency predicate; `board.js` `swapCells`; keep/revert on match/no-match; re-select on non-adjacent |
| 16 Match detection | `match.js` `findMatches` (row/column scans, union, deterministic sorted set) |
| 17 Gem removal | `board.js` `removeCells` |
| 18 Gravity | `board.js` `applyGravity` |
| 19 Refill | `board.js` `refill` using `gem.js` |
| 20 Cascade resolution | `screens/game-board.js` cascade loop; bounded; input blocked until Stable |
| 21 Board state consistency | `board.js` `isStableBoard`, `isDimensionAndTypeValid`; reject-and-retain guards |
| 22 Input support | `screens/game-board.js` click + tap handlers; ≥44px cells; no swipe/drag |
| 23 Responsive board layout | `screens/game-board.js` responsive square CSS; no horizontal overflow; vertical scroll; return control |
| 24 Play navigation integration | Registry `'play'` → `createGameBoardScreen`; other placeholders unchanged; return → Main_Menu |
| 25 Test coverage | Vitest unit tests 25.1–25.12; property tests P-a (25.13), P-b (25.14) |

### Requirement / Design Conflicts

None. Requirements 15.4 and 15.5 evaluate whether the **resulting** board contains **any** Match anywhere (not only at the swapped cells); the design's detection-on-full-board approach matches this exactly. No other conflicts identified.

### Assumptions

- An empty cell is modeled as `null`; empties occur only transiently between removal and refill (consistent with Req 21.2).
- Randomness is supplied via an injectable RNG (defaulting to `Math.random`) so pure modules stay deterministic under test; this is an implementation seam, not a requirement change.
- The optional `Gem.id` is for render/animation keying only and has no gameplay effect.
- "Activation" (Req 22) means a discrete click or tap on a single cell; swipe/drag are explicitly out of scope (Req 22.3).
- The 300 ms/100 ms UI budgets are met by direct DOM re-render plus optional pure-CSS transitions; no JS animation module is added.

### Phase 1 Architecture Preservation

The following Phase 1 files are **untouched** by Phase 2: `js/main.js` (bootstrap), `js/router.js` (Router), `js/screens/main-menu.js` (Main Menu UI_Module), `js/screens/placeholder.js` (placeholder factory), and `js/state/game-state.js` (store scaffold). The **only** integration change is repointing the `'play'` entry in `js/config/screens.js` from the placeholder factory to `createGameBoardScreen`; the World Map, Boosters, Achievements, and Settings entries remain placeholder screens (Req 24.2). Adding the new gameplay modules requires no modification to the Main_Menu UI_Module (Req 24.4).

**Non-blocking later cleanup item:** `js/screens/main-menu.js` still hardcodes the old working title string ("Gemoria: Crystal Quest") in its `TITLE_TEXT` constant. Phase 2 does **not** modify Phase 1 code, so this is intentionally left as-is here and recorded as a future rename cleanup to align the on-screen title with the official name "SnoopsGem : Crystal". It does not affect Phase 2 gameplay.

## Phase 2: Out of Scope & Extension Points

The following are explicitly **excluded** from Phase 2 and are **not** designed here (only clean extension points are left):

- Special gems, line crystals, rainbow crystals, bombs
- Obstacles
- Levels and level progression
- World map
- Score / scoring system
- Coins, lives
- Boosters
- Achievements
- Sound and music
- Save / load persistence

**Extension points for all of the above:** the existing **screen registry** (`js/config/screens.js`) is where future screens (world map, level select, results, achievements, settings) are registered without touching the Router, bootstrap, or Main Menu; and the existing **store scaffold** (`js/state/game-state.js`) is the future home for cross-screen state (progression, coins, lives, boosters owned, settings). Special-gem and obstacle behaviors, when added later, become new pure modules consumed by the board/match layer or a future board screen, following the same pure-logic-decoupled-from-UI pattern established here.
