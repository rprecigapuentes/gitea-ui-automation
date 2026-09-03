import { GiteaApiClient } from "./gitea-client.client";
import type { Response } from "got";

export interface Issue {
  id: number;
  number: number;
  title: string;
}

export class IssueClient extends GiteaApiClient {
  async createIssue(owner: string, repository: string, title: string): Promise<Response<Issue>> {
    return this.client.post<Issue>(`repos/${owner}/${repository}/issues`, { json: { title } });
  }
}
