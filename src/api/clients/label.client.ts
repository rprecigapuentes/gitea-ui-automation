import { GiteaApiClient } from "./gitea-client.client";
import type { Response } from "got";

export interface Label {
  id: number;
  name: string;
  exclusive: boolean;
}

export interface NewLabel {
  name: string;
  color: string;
  exclusive: boolean;
}

export class LabelClient extends GiteaApiClient {
  async createLabel(owner: string, repository: string, label: NewLabel): Promise<Response<Label>> {
    return this.client.post<Label>(`repos/${owner}/${repository}/labels`, { json: label });
  }
}
