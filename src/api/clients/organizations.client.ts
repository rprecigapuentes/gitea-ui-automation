import { GiteaApiClient } from "../../../core/api/base-clients/gitea-client.client";
import type { Response } from "got";
import type { Organization as NewOrganization } from "../../entities/organization.entity";

export interface Organization {
  id: number;
  name: string;
}

export class OrganizationClient extends GiteaApiClient {
  async getAllOrganizations(): Promise<Response<Organization[]>> {
    return this.client.get<Organization[]>("orgs");
  }

  async createOrganization(organization: NewOrganization): Promise<Response<Organization>> {
    return this.client.post<Organization>("orgs", {
      json: { username: organization.name, visibility: organization.visibility },
    });
  }

  async deleteOrganization(organizationName: string): Promise<Response> {
    return this.client.delete(`orgs/${organizationName}`);
  }
}
