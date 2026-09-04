// organization-base.page.ts
import { By } from "selenium-webdriver";
import { BaseComponent } from "../../../../../core/ui/base-pages/base-component";

export enum OrgTab {
  Repos = "Repos",
  Projects = "Projects",
  Packages = "Packages",
  Members = "Members",
  Teams = "Teams",
  Worktime = "Worktime",
}

export class OrgNavigationFragment extends BaseComponent {
  protected currentTab: OrgTab | null = null;

  private readonly tabLocators: Record<OrgTab, By> = {
    [OrgTab.Repos]: By.css("[data-text='Repositories']"),
    [OrgTab.Projects]: By.css("[data-text='Projects']"),
    [OrgTab.Packages]: By.css("[data-text='Packages']"),
    [OrgTab.Members]: By.css("[data-text='Members']"),
    [OrgTab.Teams]: By.css("[data-text='Teams']"),
    [OrgTab.Worktime]: By.css("[data-text='Worktime']"),
  };

  async navigateToTab(tab: OrgTab): Promise<void> {
    await this.click(this.tabLocators[tab]);
    this.currentTab = tab;
  }
}
