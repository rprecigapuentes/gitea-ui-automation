import { GiteaApiClient } from "@gitea-automation/core-selenium/api/gitea-client.client";
import type { Response } from "got";
import type { User } from "../entities/user.entity";

export class UserClient extends GiteaApiClient {
  async getUser(): Promise<Response<User>> {
    return this.client.get<User>("user");
  }

  // Requires a token with the write:admin scope, unlike every other call this client makes.
  async createUser(username: string, email: string, password: string): Promise<Response<User>> {
    return this.client.post<User>("admin/users", {
      json: { username, email, password, must_change_password: false },
    });
  }

  async deleteUser(username: string): Promise<Response> {
    return this.client.delete(`admin/users/${username}`);
  }
}
