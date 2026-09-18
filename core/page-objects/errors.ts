/**
 * Thrown by a strategy's `click` when the target was covered by another element (e.g. a dimmer
 * mid-transition) rather than genuinely missing or unclickable. A page catches this to tell
 * "blocked by a transitioning overlay" apart from a real failure, without depending on Selenium's
 * or Playwright's own click-intercepted error type.
 */
export class InteractionInterceptedError extends Error {
  constructor(locator: string, cause?: unknown) {
    super(`Interaction with "${locator}" was intercepted by another element`);
    this.name = "InteractionInterceptedError";
    if (cause !== undefined) this.cause = cause;
  }
}
