import { OrganizationBasePage } from "./organization-base.page";

export class OrganizationTeamsPage extends OrganizationBasePage {
  override getUrl(): string {
    return `org/${this.organization.name}/teams`;
  }
}
