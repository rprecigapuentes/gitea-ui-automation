import { IRequestStrategy } from "./request-strategy.interface";

/**
 * Base of every API client. It only delegates to the `IRequestStrategy` it was given (`got` under
 * Selenium, Playwright's request context elsewhere), so a client never knows which library is used.
 */
export abstract class GiteaApiClient {
  constructor(private readonly strategy: IRequestStrategy) {}

  protected get<T>(endpoint: string): Promise<T> {
    return this.strategy.get<T>(endpoint);
  }

  protected post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.strategy.post<T>(endpoint, body);
  }

  protected put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.strategy.put<T>(endpoint, body);
  }

  protected delete<T = void>(endpoint: string): Promise<T> {
    return this.strategy.delete<T>(endpoint);
  }
}
