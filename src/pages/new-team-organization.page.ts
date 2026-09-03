import { baseUrl } from "../../core/config/config";
import { OrganizationBasePage } from "./organization-base.page";
//import { By } from "selenium-webdriver";

export class NewTeamPage extends OrganizationBasePage {
  /*private readonly locators = {
    createTeamButton: By.css(
      "body > div > div.page-content.organization.teams > div:nth-child(3) > div.flex-text-block > a",
    ),
    privateVisibilityRadio: By.css("#_aria_label_input_1"),
    limitedVisibilityRadio: By.css("#_aria_label_input_2"),
    publicVisibilityRadio: By.css("#_aria_label_input_3"),
    createTeamButton: By.css("#body > div > div.page-content.organization.new.team > div:nth-child(3) > div > div > form > div > div:nth-child(8) > buttoncreate_team"),
  };*/

  override getUrl(): string {
    return `${baseUrl}/org/${this.organization.name}/teams/new`;
  }

  /*async selectVisibility(option: "public" | "limited" | "private"): Promise<void> {
    let radio;
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
  }*/
}
