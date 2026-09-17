import { GiteaApiClient } from "@gitea-automation/core-api-client/gitea-api-client";

interface TeamSummary {
  id: number;
  name: string;
}

export class TeamClient extends GiteaApiClient {
  async createTeam(
    organizationName: string,
    name: string,
    permission: "read" | "write" = "write",
  ): Promise<TeamSummary> {
    return this.post<TeamSummary>(`orgs/${organizationName}/teams`, {
      name,
      permission,
      units: ["repo.code"],
      includes_all_repositories: false,
    });
  }
}
