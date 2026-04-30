import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as vm from 'node:vm';
import { describe, expect, test } from 'vitest';

// Extract the FOUC-prevention theme script from HeadCommon.astro so the test
// exercises the exact code that ships, not a copy.
function extractThemeScript(): string {
  const path = fileURLToPath(new URL('./HeadCommon.astro', import.meta.url));
  const source = readFileSync(path, 'utf-8');
  const match = source.match(
    /<!-- This is intentionally inlined to avoid FOUC -->\s*<script is:inline>([\s\S]*?)<\/script>/
  );
  if (!match) throw new Error('Could not locate theme init script in HeadCommon.astro');
  return match[1];
}

interface FakeRoot {
  classList: {
    add: (c: string) => void;
    remove: (c: string) => void;
    has: (c: string) => boolean;
  };
  classes: Set<string>;
}

function makeRoot(): FakeRoot {
  const classes = new Set<string>();
  return {
    classes,
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      has: (c) => classes.has(c),
    },
  };
}

interface RunOptions {
  storedTheme: string | null;
  prefersDark: boolean;
}

function runScript({ storedTheme, prefersDark }: RunOptions) {
  const root = makeRoot();
  const listeners = new Map<string, (event: unknown) => void>();
  const context: Record<string, unknown> = {
    document: {
      documentElement: root,
      addEventListener: (name: string, fn: (event: unknown) => void) => {
        listeners.set(name, fn);
      },
    },
    localStorage: {
      getItem: (k: string) => (k === 'theme' ? storedTheme : null),
    },
    window: {
      matchMedia: () => ({ matches: prefersDark }),
    },
  };
  vm.createContext(context);
  vm.runInContext(extractThemeScript(), context);
  return { root, listeners };
}

describe('HeadCommon theme init script', () => {
  test('applies theme-dark and dark classes when localStorage="dark"', () => {
    const { root } = runScript({ storedTheme: 'dark', prefersDark: false });
    expect(root.classList.has('theme-dark')).toBe(true);
    expect(root.classList.has('dark')).toBe(true);
  });

  test('removes theme classes when localStorage="light"', () => {
    const { root } = runScript({ storedTheme: 'light', prefersDark: true });
    expect(root.classList.has('theme-dark')).toBe(false);
    expect(root.classList.has('dark')).toBe(false);
  });

  test('falls back to prefers-color-scheme when localStorage is empty', () => {
    const { root } = runScript({ storedTheme: null, prefersDark: true });
    expect(root.classList.has('theme-dark')).toBe(true);
    expect(root.classList.has('dark')).toBe(true);
  });

  // Regression test for the bug where ClientRouter view transitions
  // replaced <html class="initial">, dropping the theme classes — and the
  // inline script never re-ran to restore them on subsequent navigations.
  test('reapplies the theme to the incoming document on astro:before-swap', () => {
    const { listeners } = runScript({ storedTheme: 'dark', prefersDark: false });
    const handler = listeners.get('astro:before-swap');
    expect(handler).toBeDefined();
    const newDocRoot = makeRoot();
    handler?.({ newDocument: { documentElement: newDocRoot } });
    expect(newDocRoot.classList.has('theme-dark')).toBe(true);
    expect(newDocRoot.classList.has('dark')).toBe(true);
  });

  test('astro:before-swap clears theme classes when user switched to light', () => {
    const { listeners } = runScript({ storedTheme: 'light', prefersDark: false });
    const handler = listeners.get('astro:before-swap');
    const newDocRoot = makeRoot();
    newDocRoot.classList.add('theme-dark');
    newDocRoot.classList.add('dark');
    handler?.({ newDocument: { documentElement: newDocRoot } });
    expect(newDocRoot.classList.has('theme-dark')).toBe(false);
    expect(newDocRoot.classList.has('dark')).toBe(false);
  });
});
