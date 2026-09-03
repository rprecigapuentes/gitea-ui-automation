import { Organization } from "../../entities/organization.entity";
import { GiteaApiClient } from "./gitea-client.client";
import type { Response } from "got";

export class OrganizationClient extends GiteaApiClient {
  async getAllOrganizations(): Promise<Response<Organization[]>> {
    return this.client.get<Organization[]>("orgs");
  }

  async deleteOrganization(organizationName: string): Promise<Response> {
    return this.client.delete(`orgs/${organizationName}`);
  }
}
