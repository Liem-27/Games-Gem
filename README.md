# SnoopsGem : Crystal

An original HTML5 match-3 puzzle game with a fantasy crystal visual theme, built with vanilla JavaScript ES modules (no framework).

This repository currently contains **Phase 1**: the project foundation and the main menu, including a modular architecture, responsive main menu, wired navigation buttons, and original placeholder artwork. Gameplay systems (the match-3 board, match detection, special gems, obstacles, levels, boosters logic, sound, animation, and save/persistence) are deferred to later phases.

## Requirements

- A modern web browser that supports ES modules (recent Chrome, Firefox, Edge, or Safari).
- One of the following to serve files over HTTP:
  - [Node.js](https://nodejs.org/) (provides `npx`), or
  - [Python 3](https://www.python.org/).

## Running the game

> **Important:** This project uses JavaScript ES modules (`<script type="module">`). Browsers enforce CORS restrictions on modules, so ES modules must be served over **HTTP**. Opening `index.html` directly from the file system (a `file://` URL) is **not supported** and will fail to load the game. You must start a local HTTP server from the project root and open the game via an `http://` URL.

Run one of the commands below **from the project root** (the directory that contains `index.html`), then open the printed URL in your browser.

### Option A — npm script (recommended)

```bash
npm run serve
```

This runs `npx serve .`. On first run it may prompt to install the `serve` package. Once running, it prints a local URL (typically `http://localhost:3000/`). Open that URL in your browser.

### Option B — npx serve directly

```bash
npx serve .
```

Then open the printed URL, for example `http://localhost:3000/`.

### Option C — Python's built-in HTTP server

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/` in your browser.

> If port `8000` (or `3000`) is already in use, choose a different port (for example `python -m http.server 8080`) and open `http://localhost:<port>/` instead.

## Running the tests

Unit and property-based tests use [Vitest](https://vitest.dev/).

```bash
# Install dev dependencies first (once):
npm install

# Run the test suite once:
npm test

# Run tests in watch mode:
npm run test:watch
```

## Project structure

```
.
├── index.html            # Single HTML entry point (loads js/main.js as a module)
├── css/
│   ├── reset.css         # Base and reset styles
│   ├── theme.css         # Fantasy crystal theme (colors, typography)
│   └── menu.css          # Main menu layout and button styling
├── js/
│   ├── main.js           # Application entry point ES module
│   ├── router.js         # Screen router
│   ├── config/           # Screen configuration
│   ├── screens/          # Main menu and placeholder screens
│   └── state/            # Game state
└── tests/                # Vitest unit and property-based tests
```

## License

UNLICENSED — all rights reserved. All visual identity in this project is original; no copyrighted assets, UI layouts, characters, branding, sounds, or artwork from any existing commercial match-3 product are used.
