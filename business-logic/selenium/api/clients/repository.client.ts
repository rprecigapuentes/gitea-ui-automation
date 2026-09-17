import { GiteaApiClient } from "@gitea-automation/core-api-client/gitea-api-client";
import type { Repository } from "../entities/repository.entity";

export class RepositoryClient extends GiteaApiClient {
  async createRepository(name: string): Promise<Repository> {
    return this.post<Repository>("user/repos", { name, auto_init: true });
  }

  async createOrganizationRepository(organizationName: string, name: string): Promise<Repository> {
    return this.post<Repository>(`orgs/${organizationName}/repos`, { name, auto_init: true });
  }

  async deleteRepository(owner: string, name: string): Promise<void> {
    return this.delete(`repos/${owner}/${name}`);
  }
}
