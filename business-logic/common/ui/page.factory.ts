import type { IInteractionStrategy } from "@gitea-automation/core-page-objects/interaction-strategy.interface";
import { LoginPage } from "./pages/authentication/login.page";
import { MainPage } from "./pages/common/main.page";
import { NavBarFragment } from "./pages/common/fragments/nav-bar.fragment";
import { OrganizationDashboardPage } from "./pages/organizations/organization-dashboard.page";
import { IssuePage } from "./pages/issues/issue.page";
import { CreateIssuePage } from "./pages/issues/create-issue.page";
import { IssueListPage } from "./pages/issues/issue-list.page";
import { LabelListPage } from "./pages/issues/label-list.page";
import { MilestoneListPage } from "./pages/issues/milestone-list.page";
import { CreateProjectPage } from "./pages/projects/create-project.page";
import { ProjectListPage } from "./pages/projects/project-list.page";
import { ProjectBoardPage } from "./pages/projects/project-board.page";
import { CreateOrganizationPage } from "./pages/organizations/create-organization.page";
import { CreateRepositoryPage } from "./pages/repositories/create-repository.page";
import { OrgNavigationFragment } from "./pages/organizations/fragments/org-navigation.fragment";
import { OrgRepositoriesFragment } from "./pages/organizations/fragments/org-repositories.fragment";
import { OrgTeamsFragment } from "./pages/organizations/fragments/org-teams.fragment";
import { NewTeamFragment } from "./pages/organizations/fragments/new-team.fragment";
import { SpecificTeamFragment } from "./pages/organizations/fragments/specific-team.fragment";
import { RepoNavBarFragment } from "./pages/repositories/fragments/repo-nav-bar.fragment";
import { RepoCodeTabFragment } from "./pages/repositories/fragments/repo-code-tab.fragment";
import { CreateRepoFileFragment } from "./pages/repositories/fragments/create-repo-file.fragment";
import { RepoFileFragment } from "./pages/repositories/fragments/repo-file.fragment";
import { ForkPromptFragment } from "./pages/repositories/fragments/fork-prompt.fragment";
import { OrganizationFacade } from "./pages/organizations/facade/organization.facade";
import type { Organization } from "@gitea-automation/business-logic-selenium/api/entities/organization.entity";
import type { ScenarioState } from "@gitea-automation/business-logic-selenium/state/scenario.entity";

export class PageFactory {
  #loginPage?: LoginPage;
  #mainPage?: MainPage;
  #navBar?: NavBarFragment;
  #issuePage?: IssuePage;
  #createIssuePage?: CreateIssuePage;
  #issueListPage?: IssueListPage;
  #labelListPage?: LabelListPage;
  #milestoneListPage?: MilestoneListPage;
  #createProjectPage?: CreateProjectPage;
  #projectListPage?: ProjectListPage;
  #projectBoardPage?: ProjectBoardPage;
  #createOrganizationPage?: CreateOrganizationPage;
  #createRepositoryPage?: CreateRepositoryPage;
  #organizationDashboardPage?: OrganizationDashboardPage;
  #orgNavigation?: OrgNavigationFragment;
  #orgRepositories?: OrgRepositoriesFragment;
  #orgTeams?: OrgTeamsFragment;
  #orgNewTeam?: NewTeamFragment;
  #orgSpecificTeam?: SpecificTeamFragment;
  #repoNavBar?: RepoNavBarFragment;
  #repoCodeTab?: RepoCodeTabFragment;
  #createRepoFile?: CreateRepoFileFragment;
  #repoFile?: RepoFileFragment;
  #forkPrompt?: ForkPromptFragment;
  #orgFacade?: OrganizationFacade;

  constructor(
    private readonly strategy: IInteractionStrategy,
    private readonly scenarioState: ScenarioState,
  ) {}

  private requireOrganization(): Organization {
    if (!this.scenarioState.organization) {
      throw new Error("organization is not set in scenarioState");
    }
    return this.scenarioState.organization;
  }

  get loginPage(): LoginPage {
    return (this.#loginPage ??= new LoginPage(this.strategy));
  }

  get mainPage(): MainPage {
    return (this.#mainPage ??= new MainPage(this.strategy));
  }

  get navBar(): NavBarFragment {
    return (this.#navBar ??= new NavBarFragment(this.strategy));
  }

  get issuePage(): IssuePage {
    return (this.#issuePage ??= new IssuePage(this.strategy));
  }

  get createIssuePage(): CreateIssuePage {
    return (this.#createIssuePage ??= new CreateIssuePage(this.strategy));
  }

  get issueListPage(): IssueListPage {
    return (this.#issueListPage ??= new IssueListPage(this.strategy));
  }

  get labelListPage(): LabelListPage {
    return (this.#labelListPage ??= new LabelListPage(this.strategy));
  }

  get milestoneListPage(): MilestoneListPage {
    return (this.#milestoneListPage ??= new MilestoneListPage(this.strategy));
  }

  get createProjectPage(): CreateProjectPage {
    return (this.#createProjectPage ??= new CreateProjectPage(this.strategy));
  }

  get projectListPage(): ProjectListPage {
    return (this.#projectListPage ??= new ProjectListPage(this.strategy));
  }

  get projectBoardPage(): ProjectBoardPage {
    return (this.#projectBoardPage ??= new ProjectBoardPage(this.strategy));
  }

  get createOrganizationPage(): CreateOrganizationPage {
    return (this.#createOrganizationPage ??= new CreateOrganizationPage(this.strategy));
  }

  get createRepositoryPage(): CreateRepositoryPage {
    return (this.#createRepositoryPage ??= new CreateRepositoryPage(this.strategy));
  }

  get organizationDashboardPage(): OrganizationDashboardPage {
    return (this.#organizationDashboardPage ??= new OrganizationDashboardPage(this.strategy));
  }

  get orgNavigation(): OrgNavigationFragment {
    return (this.#orgNavigation ??= new OrgNavigationFragment(this.strategy));
  }

  get orgRepositories(): OrgRepositoriesFragment {
    return (this.#orgRepositories ??= new OrgRepositoriesFragment(this.strategy));
  }

  get orgTeams(): OrgTeamsFragment {
    return (this.#orgTeams ??= new OrgTeamsFragment(this.strategy));
  }

  get orgNewTeam(): NewTeamFragment {
    return (this.#orgNewTeam ??= new NewTeamFragment(this.strategy));
  }

  get orgSpecificTeam(): SpecificTeamFragment {
    return (this.#orgSpecificTeam ??= new SpecificTeamFragment(this.strategy));
  }

  get repoNavBar(): RepoNavBarFragment {
    return (this.#repoNavBar ??= new RepoNavBarFragment(this.strategy));
  }

  get repoCodeTab(): RepoCodeTabFragment {
    return (this.#repoCodeTab ??= new RepoCodeTabFragment(this.strategy));
  }

  get createRepoFile(): CreateRepoFileFragment {
    return (this.#createRepoFile ??= new CreateRepoFileFragment(this.strategy));
  }

  get repoFile(): RepoFileFragment {
    return (this.#repoFile ??= new RepoFileFragment(this.strategy));
  }

  get forkPrompt(): ForkPromptFragment {
    return (this.#forkPrompt ??= new ForkPromptFragment(this.strategy));
  }

  get orgFacade(): OrganizationFacade {
    return (this.#orgFacade ??= new OrganizationFacade(
      this.strategy,
      this.requireOrganization(),
      this.orgNavigation,
      this.orgRepositories,
      this.orgTeams,
      this.orgNewTeam,
      this.orgSpecificTeam,
    ));
  }
}
