import { GiteaApiClient } from "@gitea-automation/core-api-client/gitea-api-client";
import type { Issue } from "../entities/issue.entity";

export class IssueClient extends GiteaApiClient {
  async createIssue(owner: string, repository: string, title: string): Promise<Issue> {
    return this.post<Issue>(`repos/${owner}/${repository}/issues`, { title });
  }
}
