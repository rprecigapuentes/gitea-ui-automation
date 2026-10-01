import { request, APIRequestContext, APIResponse } from "@playwright/test";
import { IRequestStrategy } from "../request-strategy.interface";

// An empty body (a 204 on DELETE) has nothing to parse, so it becomes undefined.
async function parseBody<T>(response: APIResponse): Promise<T> {
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/**
 * Unlike got, Playwright's request context does not throw on a 4xx or 5xx: the error body is
 * parsed and returned as if it were the answer. The context is created once and reused.
 */
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
