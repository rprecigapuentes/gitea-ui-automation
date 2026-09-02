import got, { Got, Response } from "got";

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
    });
  }

  async get(endpoint: string): Promise<Response> {
    return this.client.get(endpoint);
  }
}
