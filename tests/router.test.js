import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { createRouter } from '../js/router.js';

/**
 * The Router is exercised with SYNTHETIC screen descriptors whose mount/unmount
 * record calls. Each factory produces a fresh screen that appends a marker to
 * the shared call log on mount and on unmount, so we can assert lifecycle order
 * and current-screen state without any concrete screen modules.
 */

/**
 * Build a router pre-populated with synthetic screens for the given ids.
 * Returns the router plus a shared `calls` log recording mount/unmount events.
 *
 * @param {string[]} ids
 */
function makeRouterWithScreens(ids) {
  const container = { cleared: false };
  const calls = [];
  const router = createRouter(container);

  for (const id of ids) {
    router.register(id, () => ({
      title: id,
      mount(_container, _ctx) {
        calls.push({ type: 'mount', id });
      },
      unmount() {
        calls.push({ type: 'unmount', id });
      },
    }));
  }

  return { router, calls };
}

describe('createRouter — navigation lifecycle', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  // Feature: gemoria-crystal-quest, Property 1: Navigating to a registered screen unmounts the previously mounted screen (if any), mounts the target, and makes the target current — from any prior state.
  it('Property 1: navigating to a registered screen unmounts prior, mounts target, makes it current', () => {
    fc.assert(
      fc.property(
        // A non-empty set of unique registered screen ids.
        fc.uniqueArray(fc.string({ minLength: 1, maxLength: 8 }), {
          minLength: 1,
          maxLength: 6,
        }),
        // A sequence of indices into the id set, driving successive navigations.
        fc.array(fc.nat(), { minLength: 1, maxLength: 10 }),
        (ids, indexSeq) => {
          const { router, calls } = makeRouterWithScreens(ids);

          let previousId = null;
          for (const rawIndex of indexSeq) {
            const targetId = ids[rawIndex % ids.length];
            calls.length = 0;

            const result = router.navigate(targetId);

            // Registered id → navigation succeeds.
            expect(result).toBe(true);

            // If a screen was previously mounted, it is unmounted first, then
            // the target is mounted — in that order.
            if (previousId !== null) {
              expect(calls).toEqual([
                { type: 'unmount', id: previousId },
                { type: 'mount', id: targetId },
              ]);
            } else {
              expect(calls).toEqual([{ type: 'mount', id: targetId }]);
            }

            // The target is now the current screen.
            expect(router.getCurrentScreenId()).toBe(targetId);

            previousId = targetId;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: gemoria-crystal-quest, Property 2: Navigating to an unregistered id leaves current screen unchanged (no unmount, no new mount) and produces a "screen not found" indication.
  it('Property 2: navigating to an unregistered id leaves state unchanged and reports not-found', () => {
    fc.assert(
      fc.property(
        // Registered screen ids.
        fc.uniqueArray(fc.string({ minLength: 1, maxLength: 8 }), {
          minLength: 1,
          maxLength: 6,
        }),
        // An index selecting which registered id to start on.
        fc.nat(),
        // An arbitrary target id that we force to be unregistered.
        fc.string({ maxLength: 10 }),
        (ids, startIndex, rawUnknownId) => {
          // Ensure the "unknown" id is genuinely not in the registry.
          const unknownId = ids.includes(rawUnknownId)
            ? `${rawUnknownId}__unregistered__${ids.length}`
            : rawUnknownId;
          if (ids.includes(unknownId)) return; // extremely unlikely; skip

          const { router, calls } = makeRouterWithScreens(ids);

          // Establish a current screen.
          const startId = ids[startIndex % ids.length];
          router.navigate(startId);
          expect(router.getCurrentScreenId()).toBe(startId);

          // Now navigate to the unregistered id.
          calls.length = 0;
          const warnBefore = console.warn.mock.calls.length;
          const result = router.navigate(unknownId);

          // No change: falsy result, no mount/unmount, current screen intact.
          expect(result).toBe(false);
          expect(calls).toEqual([]);
          expect(router.getCurrentScreenId()).toBe(startId);

          // "screen not found" indication was produced.
          const warnAfter = console.warn.mock.calls.length;
          expect(warnAfter).toBe(warnBefore + 1);
          const lastWarn = console.warn.mock.calls[warnAfter - 1].join(' ');
          expect(lastWarn).toContain('screen not found');
          expect(lastWarn).toContain(unknownId);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 2 edge case: unregistered navigation from the initial (no-screen) state.
  it('Property 2 (edge): unregistered navigation with no current screen stays null and returns false', () => {
    const { router, calls } = makeRouterWithScreens(['a', 'b']);
    const result = router.navigate('does-not-exist');
    expect(result).toBe(false);
    expect(calls).toEqual([]);
    expect(router.getCurrentScreenId()).toBe(null);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
