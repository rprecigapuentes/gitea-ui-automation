// organization-base.page.ts
import { By } from "selenium-webdriver";
import { BaseComponent } from "@gitea-automation/core-selenium/ui/base-pages/base-component";

export enum RepoTab {
  Code = "Code",
  Issues = "Issues",
  Packages = "Packages",
  Projects = "Projects",
  Wiki = "Wiki",
}

export class RepoNavBarFragment extends BaseComponent {
  protected currentTab: RepoTab | null = null;

  private readonly locators = {
    // navBar container
    navBarContainer: By.css(".secondary-nav"),
    // reponame
    repoName: By.css(".flex-text-block.tw-flex-wrap.tw-text-18"),
    organizationLink: By.css(".flex-text-block.tw-flex-wrap.tw-text-18 a:first-child"),
    // tabs
    codeTab: By.css("[data-text=Code]"),
    projectsTab: By.css("[data-text=Projects]"),
    packagesTab: By.css("[data-text=Packages]"),
    issuesTab: By.css("[data-text=Issues]"),
    wikiTab: By.css("[data-text=Wiki]"),
    activeIssuesTab: By.css("a.active.item span[data-text=Issues]"),
  };

  private readonly tabLocators: Record<RepoTab, By> = {
    [RepoTab.Code]: this.locators.codeTab,
    [RepoTab.Projects]: this.locators.projectsTab,
    [RepoTab.Packages]: this.locators.packagesTab,
    [RepoTab.Issues]: this.locators.issuesTab,
    [RepoTab.Wiki]: this.locators.wikiTab,
  };

  async waitForElements(): Promise<boolean> {
    return this.isVisible([this.locators.navBarContainer, this.locators.repoName]);
  }

  async getRepoTitle(): Promise<string> {
    return this.getText(this.locators.repoName);
  }

  async clickOrganizationLink(): Promise<void> {
    await this.click(this.locators.organizationLink);
  }

  async navigateToTab(tab: RepoTab): Promise<void> {
    await this.click(this.tabLocators[tab]);
    this.currentTab = tab;
  }

  async isCodeTabVisible(): Promise<boolean> {
    return this.isVisible(this.locators.codeTab, this.driver, 0);
  }

  async isIssuesTabActiveByDefault(): Promise<boolean> {
    return this.isVisible(this.locators.activeIssuesTab, this.driver, 0);
  }
}
