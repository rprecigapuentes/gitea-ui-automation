import got, { Got, Response } from "got";
import { logger } from "../logger/pino.logger";

export abstract class GiteaApiClient {
  protected readonly client: Got;

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

  async get(endpoint: string): Promise<Response> {
    return this.client.get(endpoint);
  }
}
