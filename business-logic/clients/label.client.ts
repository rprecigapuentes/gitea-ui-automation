import { GiteaApiClient } from "@gitea-automation/core-api-client/gitea-api-client";
import type { Label, NewLabel } from "../entities/label.entity";

export class LabelClient extends GiteaApiClient {
  async createLabel(owner: string, repository: string, label: NewLabel): Promise<Label> {
    return this.post<Label>(`repos/${owner}/${repository}/labels`, label);
  }
}
