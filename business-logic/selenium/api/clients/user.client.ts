import { GiteaApiClient } from "@gitea-automation/core-api-client/gitea-api-client";
import type { User } from "../entities/user.entity";

export class UserClient extends GiteaApiClient {
  async getUser(): Promise<User> {
    return this.get<User>("user");
  }

  async createUser(username: string, email: string, password: string): Promise<User> {
    return this.post<User>("admin/users", {
      username,
      email,
      password,
      must_change_password: false,
    });
  }

  async deleteUser(username: string): Promise<void> {
    return this.delete(`admin/users/${username}`);
  }
}
