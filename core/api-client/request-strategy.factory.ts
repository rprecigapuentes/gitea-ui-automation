import type { IRequestStrategy } from "./request-strategy.interface";
import { GotRequestStrategy } from "./strategies/got-request-strategy";
import { PlaywrightRequestStrategy } from "./strategies/playwright-request-strategy";

export class RequestStrategyFactory {
  static got(baseUrl: string, token: string): IRequestStrategy {
    return new GotRequestStrategy(baseUrl, token);
  }

  static playwright(baseUrl: string, token: string): IRequestStrategy {
    return new PlaywrightRequestStrategy(baseUrl, token);
  }
}
