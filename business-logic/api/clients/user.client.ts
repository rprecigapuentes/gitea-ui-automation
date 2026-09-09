import { GiteaApiClient } from "@gitea-automation/core/api/gitea-client.client";
import type { Response } from "got";
import type { User } from "../entities/user.entity";

export class UserClient extends GiteaApiClient {
  async getUser(): Promise<Response<User>> {
    return this.client.get<User>("user");
  }
}
