import { BaseComponent } from "@gitea-automation/core-page-objects/base-component";

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
    navBarContainer: ".secondary-nav",
    // reponame
    repoName: ".flex-text-block.tw-flex-wrap.tw-text-18",
    organizationLink: ".flex-text-block.tw-flex-wrap.tw-text-18 a:first-child",
    // tabs
    codeTab: "[data-text=Code]",
    projectsTab: "[data-text=Projects]",
    packagesTab: "[data-text=Packages]",
    issuesTab: "[data-text=Issues]",
    wikiTab: "[data-text=Wiki]",
    activeIssuesTab: "a.active.item span[data-text=Issues]",
  };

  private readonly tabLocators: Record<RepoTab, string> = {
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
    return this.isVisible(this.locators.codeTab, undefined, 0);
  }

  async isIssuesTabActiveByDefault(): Promise<boolean> {
    return this.isVisible(this.locators.activeIssuesTab, undefined, 0);
  }
}
