import { GiteaApiClient } from "./gitea-client.client";
import type { Response } from "got";
import type { Repository } from "../../entities/repository.entity";

export class RepositoryClient extends GiteaApiClient {
  async createRepository(name: string): Promise<Response<Repository>> {
    return this.client.post<Repository>("user/repos", { json: { name, auto_init: true } });
  }

  async deleteRepository(owner: string, name: string): Promise<Response> {
    return this.client.delete(`repos/${owner}/${name}`);
  }
}
