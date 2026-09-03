import { baseUrl } from "../../core/config/config";
import { OrganizationBasePage } from "./organization-base.page";

export class OrganizationTeamsPage extends OrganizationBasePage {
  override getUrl(): string {
    return `${baseUrl}/org/${this.organization.name}/teams`;
  }
}
