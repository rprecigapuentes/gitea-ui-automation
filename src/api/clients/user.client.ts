import { GiteaApiClient } from "./gitea-client.client";
import type { Response } from "got";

export class UserClient extends GiteaApiClient {
  async getUser(): Promise<Response> {
    return this.client.get("user");
  }
}
