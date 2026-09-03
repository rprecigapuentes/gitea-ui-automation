import { baseUrl } from "../../core/config/config";
import { By } from "selenium-webdriver";
import { OrganizationBasePage } from "./organization-base.page";

export class OrganizationTeamsPage extends OrganizationBasePage {
  private readonly locators = {
    newTeamButton: By.css(
      "body > div > div.page-content.organization.teams > div:nth-child(3) > div.flex-text-block > a",
    ),
  };

  override getUrl(): string {
    return `${baseUrl}/org/${this.organization.name}/teams`;
  }

  async clickNewTeamButton() {
    await this.click(this.locators.newTeamButton);
  }
}
