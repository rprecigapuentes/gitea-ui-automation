import { BaseComponent } from "../../../../../core/ui/base-pages/base-component";
import { By } from "selenium-webdriver";

export class OrgTeamsFragment extends BaseComponent {
  private readonly locators = {
    searchBar: By.css("[data-text='Search']"),
  };
  async searchTeam(teamName: string): Promise<void> {
    await this.type(this.locators.searchBar, teamName);
  }
}
