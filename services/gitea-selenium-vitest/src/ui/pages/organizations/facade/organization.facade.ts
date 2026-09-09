import { WebDriver } from "selenium-webdriver";
import { OrgNavigationFragment, OrgTab } from "../fragments/org-navigation.fragment";
import { OrgRepositoriesFragment } from "../fragments/org-repositories.fragment";
import { OrgTeamsFragment } from "../fragments/org-teams.fragment";
import { NewTeamFragment } from "../fragments/new-team.fragment";
import { SpecificTeamFragment } from "../fragments/specific-team.fragment";
import { Navigable } from "@gitea-automation/core/ui/base-pages/base.page";
import { baseUrl } from "@gitea-automation/core/config/gitea.config";
import { Organization } from "@gitea-automation/core/api/entities/organization.entity";

export class OrganizationFacade implements Navigable {
  private readonly organization: Organization;
  private currentUrl: string;
  private readonly navigation: OrgNavigationFragment;
  private readonly reposFragment: OrgRepositoriesFragment;
  private readonly teamsFragment: OrgTeamsFragment;
  private readonly newTeamFragment: NewTeamFragment;
  private readonly specificTeamFragment: SpecificTeamFragment;

  constructor(
    private readonly driver: WebDriver,
    organization: Organization,
    navigation: OrgNavigationFragment,
    reposFragment: OrgRepositoriesFragment,
    teamsFragment: OrgTeamsFragment,
    newTeamFragment: NewTeamFragment,
    specificTeamFragment: SpecificTeamFragment,
  ) {
    this.organization = organization;
    this.currentUrl = `${baseUrl}/${organization.name}`;
    this.navigation = navigation;
    this.reposFragment = reposFragment;
    this.teamsFragment = teamsFragment;
    this.newTeamFragment = newTeamFragment;
    this.specificTeamFragment = specificTeamFragment;
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
    await this.navigation.navigateToTab(OrgTab.Teams);
    await this.teamsFragment.waitUntilDisplayed();
    this.currentUrl = `${baseUrl}/org/${this.organization.name}/teams`;
    return this.teamsFragment;
  }

  async navigateToNewTeam(): Promise<NewTeamFragment> {
    await this.teamsFragment.clickNewTeamButton();
    await this.newTeamFragment.waitUntilDisplayed();
    return this.newTeamFragment;
  }

  async createTeam(teamName: string): Promise<SpecificTeamFragment> {
    await this.newTeamFragment.clickCreateTeamButton();
    await this.specificTeamFragment.waitUntilTeamDisplayed(teamName);
    return this.specificTeamFragment;
  }

  async navigateToSpecificTeam(teamName: string): Promise<SpecificTeamFragment> {
    await this.teamsFragment.clickTeamName(teamName);
    await this.specificTeamFragment.waitUntilTeamDisplayed(teamName);
    return this.specificTeamFragment;
  }
}
