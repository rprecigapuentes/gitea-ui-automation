import { GiteaApiClient } from "./gitea-client.client";
import type { Response } from "got";
import type { Issue } from "../entities/issue.entity";

export class IssueClient extends GiteaApiClient {
  async createIssue(owner: string, repository: string, title: string): Promise<Response<Issue>> {
    return this.client.post<Issue>(`repos/${owner}/${repository}/issues`, { json: { title } });
  }
}
