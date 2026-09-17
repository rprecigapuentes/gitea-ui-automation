import { GiteaApiClient } from "@gitea-automation/core-api-client/gitea-api-client";
import type { OrganizationVisibility } from "../entities/organization.entity";

export interface OrganizationSummary {
  id: number;
  name: string;
}

export class OrganizationClient extends GiteaApiClient {
  async createOrganization(
    name: string,
    visibility: OrganizationVisibility = "private",
  ): Promise<OrganizationSummary> {
    return this.post<OrganizationSummary>("orgs", { username: name, visibility });
  }

  async getAllOrganizations(): Promise<OrganizationSummary[]> {
    return this.get<OrganizationSummary[]>("orgs");
  }

  async getUserOrganizations(): Promise<OrganizationSummary[]> {
    return this.get<OrganizationSummary[]>("user/orgs");
  }

  async deleteOrganization(organizationName: string): Promise<void> {
    return this.delete(`orgs/${organizationName}`);
  }

  async deleteAllOrganizations(): Promise<void> {
    const organizations = await this.getUserOrganizations();

    for (const organization of organizations) {
      try {
        await this.deleteOrganization(organization.name);
      } catch (error) {
        console.error(`Could not delete organization "${organization.name}":`, error);
      }
    }
  }
}
