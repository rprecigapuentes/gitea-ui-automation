import { baseUrl } from "../../core/config/config";
import { OrganizationBasePage } from "./organization-base.page";
import { By } from "selenium-webdriver";

export class NewTeamPage extends OrganizationBasePage {
  private readonly locators = {
    teamNameInput: By.css("#team_name"),
    privateVisibilityRadio: By.css("#_aria_label_input_1"),
    limitedVisibilityRadio: By.css("#_aria_label_input_2"),
    publicVisibilityRadio: By.css("#_aria_label_input_3"),
    createTeamButton: By.css(
      "body > div > div.page-content.organization.new.team > div:nth-child(3) > div > div > form > div > div:nth-child(8) > button",
    ),
  };

  override getUrl(): string {
    return `${baseUrl}/org/${this.organization.name}/teams/new`;
  }

  async enterTeamName(name: string): Promise<void> {
    await this.type(this.locators.teamNameInput, name);
  }

  async selectVisibility(option: string): Promise<void> {
    switch (option) {
      case "public":
        await this.click(this.locators.publicVisibilityRadio);
        break;
      case "limited":
        await this.click(this.locators.limitedVisibilityRadio);
        break;
      case "private":
        await this.click(this.locators.privateVisibilityRadio);
        break;
    }
  }

  async clickCreateTeamButton() {
    await this.click(this.locators.createTeamButton);
  }
}
