// organization-base.page.ts
import { By } from "selenium-webdriver";
import { BaseComponent } from "@gitea-automation/core-selenium/ui/base-pages/base-component";

export class RepoCodeTabFragment extends BaseComponent {
  private organizationName?: string;
  private repositoryName?: string;

  private readonly locators = {
    // code tab container
    codeTabContainer: By.css(".sixteen.wide.column.content"),
  };

  // The button's only real identifier is its href (/{org}/{repo}/_new/{branch}/) - its class
  // is too generic to select on its own.
  private newFileButtonLocator(): By {
    return By.css(`a[href^="/${this.organizationName}/${this.repositoryName}/_new/"]`);
  }

  async waitForElements(organizationName: string, repositoryName: string): Promise<boolean> {
    this.organizationName = organizationName;
    this.repositoryName = repositoryName;
    return this.isVisible([this.locators.codeTabContainer, this.newFileButtonLocator()]);
  }
}
