import { vi } from 'vitest';

// Global setup for tests
global.describe = describe;
global.it = it;
global.expect = expect;
global.vi = vi;

// Mock console.log for tests
const originalConsoleLog = console.log;
console.log = vi.fn();

// Cleanup after all tests
afterAll(() => {
  console.log = originalConsoleLog;
});