import { GiteaApiClient } from "@gitea-automation/core-api-client/gitea-api-client";
import type { Organization, OrganizationVisibility } from "../entities/organization.entity";

export class OrganizationClient extends GiteaApiClient {
  async createOrganization(
    name: string,
    visibility: OrganizationVisibility = "private",
  ): Promise<Organization> {
    return this.post<Organization>("orgs", { username: name, visibility });
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return this.get<Organization[]>("orgs");
  }

  async getUserOrganizations(): Promise<Organization[]> {
    return this.get<Organization[]>("user/orgs");
  }

  async getOrganizationsForUser(username: string): Promise<Organization[]> {
    return this.get<Organization[]>(`users/${username}/orgs`);
  }

  async removeMember(organizationName: string, username: string): Promise<void> {
    return this.delete(`orgs/${organizationName}/members/${username}`);
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
