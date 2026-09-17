import { IRequestStrategy } from "./request-strategy.interface";
import { createGotStrategy } from "./got-request-strategy";

export abstract class GiteaApiClient {
  private readonly strategy: IRequestStrategy;

  constructor(baseUrl: string, token: string) {
    this.strategy = createGotStrategy(baseUrl, token);
  }

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
