import type { IRequestStrategy } from "./request-strategy.interface";
import { GotRequestStrategy } from "./strategies/got-request-strategy";
import { PlaywrightRequestStrategy } from "./strategies/playwright-request-strategy";

/** The HTTP counterpart of `InteractionStrategyFactory`: whoever builds a client picks the tool. */
export class RequestStrategyFactory {
  static got(baseUrl: string, token: string): IRequestStrategy {
    return new GotRequestStrategy(baseUrl, token);
  }

  static playwright(baseUrl: string, token: string): IRequestStrategy {
    return new PlaywrightRequestStrategy(baseUrl, token);
  }
}
