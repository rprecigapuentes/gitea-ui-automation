import { GiteaApiClient } from "@gitea-automation/core-selenium/api/gitea-client.client";
import type { Response } from "got";

interface Team {
  id: number;
  name: string;
}

export class TeamClient extends GiteaApiClient {
  async createTeam(
    organizationName: string,
    name: string,
    permission: "read" | "write" = "write",
  ): Promise<Response<Team>> {
    return this.client.post<Team>(`orgs/${organizationName}/teams`, {
      json: { name, permission, units: ["repo.code"], includes_all_repositories: false },
    });
  }
}
