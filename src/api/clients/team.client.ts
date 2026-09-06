import { GiteaApiClient } from "../../../core/api/base-clients/gitea-client.client";
import type { Response } from "got";
import type { NewTeam, Team } from "../../entities/team.entity";

/**
 * An organization project is governed by the Projects unit of an organization team, not by
 * repository collaboration, so a user who may write on every repository of an organization still
 * cannot move a card on its board until a team grants them that unit.
 */
export class TeamClient extends GiteaApiClient {
  async createTeam(organization: string, team: NewTeam): Promise<Response<Team>> {
    return this.client.post<Team>(`orgs/${organization}/teams`, { json: team });
  }

  async addTeamMember(teamId: number, username: string): Promise<Response> {
    return this.client.put(`teams/${teamId}/members/${username}`);
  }
}
