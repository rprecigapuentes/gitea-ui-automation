import { WebDriver } from "selenium-webdriver";
import { OrgNavigationFragment, OrgTab } from "../fragments/org-navigation.fragment";
import { OrgRepositoriesFragment } from "../fragments/org-repositories.fragment";
import { OrgTeamsFragment } from "../fragments/org-teams.fragment";
import { Navigable } from "../../../../../core/ui/base-pages/base.page";
import { baseUrl } from "../../../../../core/config/config";
import { Organization } from "../../../../entities/organization.entity";

export class OrganizationFacade implements Navigable {
  private readonly organization: Organization;
  private currentUrl: string;
  private readonly navigation: OrgNavigationFragment;
  private readonly reposFragment: OrgRepositoriesFragment;
  private readonly teamsFragment: OrgTeamsFragment;

  constructor(
    private readonly driver: WebDriver,
    organization: Organization,
    navigation: OrgNavigationFragment,
    reposFragment: OrgRepositoriesFragment,
    teamsFragment: OrgTeamsFragment,
  ) {
    this.organization = organization;
    this.currentUrl = `${baseUrl}/${organization.name}`;
    this.navigation = navigation;
    this.reposFragment = reposFragment;
    this.teamsFragment = teamsFragment;
  }

  getUrl(): string {
    return this.currentUrl;
  }

  async open(): Promise<void> {
    await this.driver.get(this.getUrl());
  }

  async navigateToRepositoriesTab(): Promise<OrgRepositoriesFragment> {
    await this.navigation.navigateToTab(OrgTab.Repos);
    this.currentUrl = `${baseUrl}/${this.organization.name}`;
    return this.reposFragment;
  }

  async navigateToTeamsTab(): Promise<OrgTeamsFragment> {
    console.log("Navigating to Teams tab");
    await this.navigation.navigateToTab(OrgTab.Teams);
    this.currentUrl = `${baseUrl}/org/${this.organization.name}/teams`;
    console.log("URL after navigating to Teams tab: ", this.currentUrl);
    return this.teamsFragment;
  }
}
