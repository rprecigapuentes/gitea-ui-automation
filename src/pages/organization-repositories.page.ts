import { OrganizationBasePage } from "./organization-base.page";

export class OrganizationRepositoriesPage extends OrganizationBasePage {
  override getUrl(): string {
    return `${this.organization.name}`;
  }
}
