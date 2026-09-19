import { logError } from './errors';

/** __DEV__ is declared `const` in RN's ambient types (a source-level guard),
 *  but at runtime it's a plain mutable global jest-expo sets — this cast is
 *  the standard, narrow way to control it for a test. */
function setDev(value: boolean): void {
  (globalThis as unknown as { __DEV__: boolean }).__DEV__ = value;
}

describe('logError', () => {
  const originalDev = __DEV__;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    setDev(originalDev);
  });

  test('logs to the console in dev builds', () => {
    setDev(true);
    logError('test context', new Error('boom'));
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  test('does not log in production builds — raw error detail must not reach release logs', () => {
    setDev(false);
    logError('test context', new Error('boom'));
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
