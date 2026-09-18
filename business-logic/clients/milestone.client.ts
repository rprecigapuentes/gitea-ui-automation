import { GiteaApiClient } from "@gitea-automation/core-api-client/gitea-api-client";
import type { Milestone, NewMilestone } from "../entities/milestone.entity";

export class MilestoneClient extends GiteaApiClient {
  async createMilestone(
    owner: string,
    repository: string,
    milestone: NewMilestone,
  ): Promise<Milestone> {
    return this.post<Milestone>(`repos/${owner}/${repository}/milestones`, milestone);
  }
}
