import { GiteaApiClient } from "@gitea-automation/core-api-client/gitea-api-client";
import type { Team } from "../entities/team.entity";

export class TeamClient extends GiteaApiClient {
  async createTeam(
    organizationName: string,
    name: string,
    permission: "read" | "write" = "write",
  ): Promise<Team> {
    return this.post<Team>(`orgs/${organizationName}/teams`, {
      name,
      permission,
      units: ["repo.code"],
      includes_all_repositories: false,
    });
  }
}
