/**
 * Thrown by the Selenium strategy's `click` when another element covered the target, such as a
 * dimmer mid-transition. A page catches it to tell "blocked by an overlay" from a real failure
 * without importing Selenium's error type. Playwright's click waits out an overlay on its own.
 */
export class InteractionInterceptedError extends Error {
  constructor(locator: string, cause?: unknown) {
    super(`Interaction with "${locator}" was intercepted by another element`);
    this.name = "InteractionInterceptedError";
    if (cause !== undefined) this.cause = cause;
  }
}
