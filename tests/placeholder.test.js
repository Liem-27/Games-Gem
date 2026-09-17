import { describe, it, expect, vi, afterEach } from 'vitest';
import fc from 'fast-check';
import { createPlaceholderScreen } from '../js/screens/placeholder.js';

/**
 * Placeholder screens are tested against the jsdom DOM and a spy `navigate`.
 * Each factory call yields a fresh screen instance, mounted into a throwaway
 * container so tests remain isolated.
 */

/**
 * Mount a fresh placeholder screen into a detached container.
 *
 * @param {{ title: string, message: string }} config
 * @param {(id: string) => boolean} navigate  Spy navigate callback.
 * @returns {{ screen: object, container: HTMLElement }}
 */
function mountPlaceholder(config, navigate) {
  const container = document.createElement('div');
  const screen = createPlaceholderScreen(config);
  screen.mount(container, { navigate });
  return { screen, container };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createPlaceholderScreen — rendering and Back control', () => {
  // Feature: gemoria-crystal-quest, Property 5: A placeholder screen renders its title and not-yet-available message for any inputs.
  it('Property 5: renders text containing the given title and message', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 60 }),
        fc.string({ minLength: 1, maxLength: 120 }),
        (title, message) => {
          const navigate = vi.fn(() => true);
          const { screen, container } = mountPlaceholder(
            { title, message },
            navigate
          );

          const text = container.textContent;
          expect(text).toContain(title);
          expect(text).toContain(message);

          screen.unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: gemoria-crystal-quest, Property 6: A placeholder's Back control returns to the Main Menu.
  it("Property 6: activating Back calls navigate('main-menu')", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 60 }),
        fc.string({ minLength: 1, maxLength: 120 }),
        (title, message) => {
          const navigate = vi.fn(() => true);
          const { screen, container } = mountPlaceholder(
            { title, message },
            navigate
          );

          const backButton = container.querySelector('button');
          expect(backButton).not.toBeNull();

          backButton.click();

          expect(navigate).toHaveBeenCalledWith('main-menu');

          screen.unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
