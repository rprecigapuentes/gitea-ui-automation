import { GiteaApiClient } from "@gitea-automation/core-selenium/api/gitea-client.client";
import type { Response } from "got";
import type { OrganizationVisibility } from "../entities/organization.entity";

export interface Organization {
  id: number;
  name: string;
}

export class OrganizationClient extends GiteaApiClient {
  // Gitea takes the organization name in 'username'.
  async createOrganization(
    name: string,
    visibility: OrganizationVisibility = "private",
  ): Promise<Response<Organization>> {
    return this.client.post<Organization>("orgs", { json: { username: name, visibility } });
  }

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
