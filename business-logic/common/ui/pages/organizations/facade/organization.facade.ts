import { OrgNavigationFragment, OrgTab } from "../fragments/org-navigation.fragment";
import { OrgRepositoriesFragment } from "../fragments/org-repositories.fragment";
import { OrgTeamsFragment } from "../fragments/org-teams.fragment";
import { NewTeamFragment } from "../fragments/new-team.fragment";
import { SpecificTeamFragment } from "../fragments/specific-team.fragment";
import { BasePage } from "@gitea-automation/core-page-objects/base.page";
import { IInteractionStrategy } from "@gitea-automation/core-page-objects/interaction-strategy.interface";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";
import { Organization } from "@gitea-automation/business-logic-api/api/entities/organization.entity";

export class OrganizationFacade extends BasePage {
  private readonly organization: Organization;
  private readonly navigation: OrgNavigationFragment;
  private readonly reposFragment: OrgRepositoriesFragment;
  private readonly teamsFragment: OrgTeamsFragment;
  private readonly newTeamFragment: NewTeamFragment;
  private readonly specificTeamFragment: SpecificTeamFragment;

  private readonly locators = {
    // Main content region of an organization profile - present once the facade's view has loaded.
    organizationPage: "[role='main'].organization.profile",
  };

  constructor(
    strategy: IInteractionStrategy,
    organization: Organization,
    navigation: OrgNavigationFragment,
    reposFragment: OrgRepositoriesFragment,
    teamsFragment: OrgTeamsFragment,
    newTeamFragment: NewTeamFragment,
    specificTeamFragment: SpecificTeamFragment,
  ) {
    super(strategy);
    this.organization = organization;
    this.navigation = navigation;
    this.reposFragment = reposFragment;
    this.teamsFragment = teamsFragment;
    this.newTeamFragment = newTeamFragment;
    this.specificTeamFragment = specificTeamFragment;
  }

  getUrl(): string {
    return `${baseUrl}/${this.organization.name}`;
  }

  async waitForElements(): Promise<void> {
    await this.isVisible(this.locators.organizationPage);
  }

  async navigateToRepositoriesTab(): Promise<OrgRepositoriesFragment> {
    await this.navigation.navigateToTab(OrgTab.Repos);
    await this.reposFragment.waitForElements();
    return this.reposFragment;
  }

  async navigateToTeamsTab(): Promise<OrgTeamsFragment> {
    await this.navigation.navigateToTab(OrgTab.Teams);
    await this.teamsFragment.waitForElements();
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
