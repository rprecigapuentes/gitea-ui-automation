import { baseUrl } from "../../core/config/config";
import { OrganizationBasePage } from "./organization-base.page";

export class OrganizationRepositoriesPage extends OrganizationBasePage {
  override getUrl(): string {
    return `${baseUrl}/${this.organization.name}`;
  }
}
