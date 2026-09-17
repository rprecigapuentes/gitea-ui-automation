import got, { Got } from "got";
import { logger } from "@gitea-automation/core-logger/pino.logger";
import { IRequestStrategy } from "./request-strategy.interface";

export class GotRequestStrategy implements IRequestStrategy {
  private readonly client: Got;

  constructor(baseUrl: string, token: string) {
    this.client = got.extend({
      prefixUrl: `${baseUrl}/api/v1`,
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/json",
      },
      responseType: "json",
      hooks: {
        beforeRequest: [
          (options) => {
            logger.debug({ method: options.method, url: options.url?.toString() }, "api request");
          },
        ],
        afterResponse: [
          (response) => {
            logger.debug({ url: response.url, status: response.statusCode }, "api response");

            return response;
          },
        ],
      },
    });
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await this.client.get<T>(endpoint);
    return response.body;
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await this.client.post<T>(endpoint, { json: body });
    return response.body;
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await this.client.put<T>(endpoint, { json: body });
    return response.body;
  }

  async delete<T = void>(endpoint: string): Promise<T> {
    const response = await this.client.delete<T>(endpoint);
    return response.body;
  }
}

export function createGotStrategy(baseUrl: string, token: string): IRequestStrategy {
  return new GotRequestStrategy(baseUrl, token);
}
