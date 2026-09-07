import { GiteaApiClient } from "../../../core/api/base-clients/gitea-client.client";
import type { Response } from "got";

export interface Organization {
  id: number;
  name: string;
}

export class OrganizationClient extends GiteaApiClient {
  async getAllOrganizations(): Promise<Response<Organization[]>> {
    return this.client.get<Organization[]>("orgs");
  }

  // Organizations the authenticated (owner) token belongs to, used to find leftovers from
  // previous runs that failed before their own cleanup could delete them.
  async getUserOrganizations(): Promise<Response<Organization[]>> {
    return this.client.get<Organization[]>("user/orgs");
  }

  async deleteOrganization(organizationName: string): Promise<Response> {
    return this.client.delete(`orgs/${organizationName}`);
  }
}
