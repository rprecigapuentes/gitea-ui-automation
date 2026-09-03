import { GiteaApiClient } from "../../../core/base-clients/gitea-client.client";
import type { Response } from "got";

export interface Organization {
  id: number;
  name: string;
}

export class OrganizationClient extends GiteaApiClient {
  async getAllOrganizations(): Promise<Response<Organization[]>> {
    return this.client.get<Organization[]>("orgs");
  }

  async deleteOrganization(organizationName: string): Promise<Response> {
    return this.client.delete(`orgs/${organizationName}`);
  }
}
