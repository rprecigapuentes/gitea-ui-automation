import { GiteaApiClient } from "../../../core/api/base-clients/gitea-client.client";
import type { Response } from "got";
import type { NewUser, User } from "../../entities/user.entity";

export class UserClient extends GiteaApiClient {
  async getUser(): Promise<Response<User>> {
    return this.client.get<User>("user");
  }

  /**
   * Creating and purging an account is administrator surface. The account the suite runs as is an
   * administrator on the disposable instance, being the first one registered on it.
   */
  async createUser(user: NewUser): Promise<Response<User>> {
    return this.client.post<User>("admin/users", {
      json: { ...user, must_change_password: false },
    });
  }

  async deleteUser(username: string): Promise<Response> {
    return this.client.delete(`admin/users/${username}`, { searchParams: { purge: true } });
  }
}
