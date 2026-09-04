import { BaseComponent } from "../../../../../core/ui/base-pages/base-component";
import { By } from "selenium-webdriver";

export class OrgRepositoriesFragment extends BaseComponent {
  private readonly locators = {
    searchBar: By.css("[data-text='Search']"),
  };

  async searchRepository(repositoryName: string): Promise<void> {
    await this.type(this.locators.searchBar, repositoryName);
  }
}
