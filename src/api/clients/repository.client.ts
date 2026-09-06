import { GiteaApiClient } from "../../../core/api/base-clients/gitea-client.client";
import type { Response } from "got";
import type { Repository } from "../../entities/repository.entity";

export type CollaboratorPermission = "read" | "write" | "admin";

export class RepositoryClient extends GiteaApiClient {
  async createRepository(name: string): Promise<Response<Repository>> {
    return this.client.post<Repository>("user/repos", { json: { name, auto_init: true } });
  }

  async createOrgRepository(organization: string, name: string): Promise<Response<Repository>> {
    return this.client.post<Repository>(`orgs/${organization}/repos`, {
      json: { name, auto_init: true },
    });
  }

  async addCollaborator(
    owner: string,
    name: string,
    collaborator: string,
    permission: CollaboratorPermission,
  ): Promise<Response> {
    return this.client.put(`repos/${owner}/${name}/collaborators/${collaborator}`, {
      json: { permission },
    });
  }

  async deleteRepository(owner: string, name: string): Promise<Response> {
    return this.client.delete(`repos/${owner}/${name}`);
  }
}
