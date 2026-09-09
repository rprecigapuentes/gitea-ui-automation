import { GiteaApiClient } from "@gitea-automation/core-selenium/api/gitea-client.client";
import type { Response } from "got";
import type { Label, NewLabel } from "../entities/label.entity";

export class LabelClient extends GiteaApiClient {
  async createLabel(owner: string, repository: string, label: NewLabel): Promise<Response<Label>> {
    return this.client.post<Label>(`repos/${owner}/${repository}/labels`, { json: label });
  }
}
