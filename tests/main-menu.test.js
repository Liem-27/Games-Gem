import { describe, it, expect, afterEach } from 'vitest';
import { mainMenuScreen } from '../js/screens/main-menu.js';

/**
 * Main Menu title-text assertion (Req 5.1 — title display).
 *
 * Verifies the on-screen game name matches the official title and that the
 * Main Menu renders exactly one title element. This is a text-only assertion;
 * it does not exercise navigation, buttons, or architecture.
 */

/**
 * Mount a fresh Main Menu screen into a detached container.
 *
 * @returns {{ screen: object, container: HTMLElement }}
 */
function mountMainMenu() {
  const container = document.createElement('div');
  const screen = mainMenuScreen();
  screen.mount(container, { navigate: () => true });
  return { screen, container };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('mainMenuScreen — title text (Req 5.1)', () => {
  it('renders exactly one title reading "SnoopsGem : Crystal"', () => {
    const { screen, container } = mountMainMenu();

    const titles = container.querySelectorAll('.main-menu__title');
    expect(titles).toHaveLength(1);
    expect(titles[0].textContent).toBe('SnoopsGem : Crystal');

    screen.unmount();
  });
});
