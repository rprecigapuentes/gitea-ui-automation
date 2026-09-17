import { request, APIRequestContext, APIResponse } from "@playwright/test";
import { IRequestStrategy } from "./request-strategy.interface";

async function parseBody<T>(response: APIResponse): Promise<T> {
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export class PlaywrightRequestStrategy implements IRequestStrategy {
  private contextPromise: Promise<APIRequestContext> | undefined;

  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  private context(): Promise<APIRequestContext> {
    if (!this.contextPromise) {
      this.contextPromise = request.newContext({
        baseURL: `${this.baseUrl}/api/v1/`,
        extraHTTPHeaders: {
          Authorization: `token ${this.token}`,
          Accept: "application/json",
        },
      });
    }
    return this.contextPromise;
  }

  async get<T>(endpoint: string): Promise<T> {
    const context = await this.context();
    const response = await context.get(endpoint);
    return parseBody<T>(response);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const context = await this.context();
    const response = await context.post(endpoint, { data: body });
    return parseBody<T>(response);
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    const context = await this.context();
    const response = await context.put(endpoint, { data: body });
    return parseBody<T>(response);
  }

  async delete<T = void>(endpoint: string): Promise<T> {
    const context = await this.context();
    const response = await context.delete(endpoint);
    return parseBody<T>(response);
  }
}

export function createPlaywrightStrategy(baseUrl: string, token: string): IRequestStrategy {
  return new PlaywrightRequestStrategy(baseUrl, token);
}
