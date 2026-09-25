/**
 * Vitest Setup File
 * 
 * Configures testing environment for React components with Vitest
 */

import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// ponytail: jsdom lacks IntersectionObserver (framer-motion whileInView needs it).
// No-op mock so component tests mount instead of throwing.
if (typeof IntersectionObserver === 'undefined') {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
}

// Extend Vitest's expect with jest-dom matchers
expect.extend({});

export {};
