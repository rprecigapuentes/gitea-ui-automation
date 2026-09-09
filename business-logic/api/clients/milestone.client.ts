import { GiteaApiClient } from "@gitea-automation/core/api/gitea-client.client";
import type { Response } from "got";
import type { Milestone, NewMilestone } from "../entities/milestone.entity";

export class MilestoneClient extends GiteaApiClient {
  async createMilestone(
    owner: string,
    repository: string,
    milestone: NewMilestone,
  ): Promise<Response<Milestone>> {
    return this.client.post<Milestone>(`repos/${owner}/${repository}/milestones`, {
      json: milestone,
    });
  }
}
