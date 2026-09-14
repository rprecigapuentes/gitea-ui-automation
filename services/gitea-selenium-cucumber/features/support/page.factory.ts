import type { WebDriver } from "selenium-webdriver";
import { LoginPage } from "@gitea-automation/business-logic-selenium/ui/pages/authentication/login.page";
import { MainPage } from "@gitea-automation/business-logic-selenium/ui/pages/common/main.page";
import { NavBarFragment } from "@gitea-automation/business-logic-selenium/ui/pages/common/fragments/nav-bar.fragment";
import { OrganizationDashboardPage } from "@gitea-automation/business-logic-selenium/ui/pages/organizations/organization-dashboard.page";
import { IssuePage } from "@gitea-automation/business-logic-selenium/ui/pages/issues/issue.page";
import { CreateProjectPage } from "@gitea-automation/business-logic-selenium/ui/pages/projects/create-project.page";
import { ProjectListPage } from "@gitea-automation/business-logic-selenium/ui/pages/projects/project-list.page";
import { ProjectBoardPage } from "@gitea-automation/business-logic-selenium/ui/pages/projects/project-board.page";
import { CreateOrganizationPage } from "@gitea-automation/business-logic-selenium/ui/pages/organizations/create-organization.page";
import { CreateRepositoryPage } from "@gitea-automation/business-logic-selenium/ui/pages/repositories/create-repository.page";
import { OrgNavigationFragment } from "@gitea-automation/business-logic-selenium/ui/pages/organizations/fragments/org-navigation.fragment";
import { OrgRepositoriesFragment } from "@gitea-automation/business-logic-selenium/ui/pages/organizations/fragments/org-repositories.fragment";
import { OrgTeamsFragment } from "@gitea-automation/business-logic-selenium/ui/pages/organizations/fragments/org-teams.fragment";
import { NewTeamFragment } from "@gitea-automation/business-logic-selenium/ui/pages/organizations/fragments/new-team.fragment";
import { SpecificTeamFragment } from "@gitea-automation/business-logic-selenium/ui/pages/organizations/fragments/specific-team.fragment";
import { RepoNavBarFragment } from "@gitea-automation/business-logic-selenium/ui/pages/repositories/fragments/repo-nav-bar.fragment";
import { RepoCodeTabFragment } from "@gitea-automation/business-logic-selenium/ui/pages/repositories/fragments/repo-code-tab.fragment";
import { OrganizationFacade } from "@gitea-automation/business-logic-selenium/ui/pages/organizations/facade/organization.facade";
import type { Organization } from "@gitea-automation/business-logic-selenium/api/entities/organization.entity";
import type { ScenarioState } from "@gitea-automation/business-logic-selenium/state/scenario.entity";

export class PageFactory {
  #loginPage?: LoginPage;
  #mainPage?: MainPage;
  #navBar?: NavBarFragment;
  #issuePage?: IssuePage;
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
  #orgFacade?: OrganizationFacade;

  constructor(
    private readonly driver: WebDriver,
    private readonly scenarioState: ScenarioState,
  ) {}

  private requireOrganization(): Organization {
    if (!this.scenarioState.organization) {
      throw new Error("organization is not set in scenarioState");
    }
    return this.scenarioState.organization;
  }

  get loginPage(): LoginPage {
    return (this.#loginPage ??= new LoginPage(this.driver));
  }

  get mainPage(): MainPage {
    return (this.#mainPage ??= new MainPage(this.driver));
  }

  get navBar(): NavBarFragment {
    return (this.#navBar ??= new NavBarFragment(this.driver));
  }

  get issuePage(): IssuePage {
    return (this.#issuePage ??= new IssuePage(this.driver));
  }

  get createProjectPage(): CreateProjectPage {
    return (this.#createProjectPage ??= new CreateProjectPage(this.driver));
  }

  get projectListPage(): ProjectListPage {
    return (this.#projectListPage ??= new ProjectListPage(this.driver));
  }

  get projectBoardPage(): ProjectBoardPage {
    return (this.#projectBoardPage ??= new ProjectBoardPage(this.driver));
  }

  get createOrganizationPage(): CreateOrganizationPage {
    return (this.#createOrganizationPage ??= new CreateOrganizationPage(this.driver));
  }

  get createRepositoryPage(): CreateRepositoryPage {
    return (this.#createRepositoryPage ??= new CreateRepositoryPage(this.driver));
  }

  get organizationDashboardPage(): OrganizationDashboardPage {
    return (this.#organizationDashboardPage ??= new OrganizationDashboardPage(this.driver));
  }

  get orgNavigation(): OrgNavigationFragment {
    return (this.#orgNavigation ??= new OrgNavigationFragment(this.driver));
  }

  get orgRepositories(): OrgRepositoriesFragment {
    return (this.#orgRepositories ??= new OrgRepositoriesFragment(this.driver));
  }

  get orgTeams(): OrgTeamsFragment {
    return (this.#orgTeams ??= new OrgTeamsFragment(this.driver));
  }

  get orgNewTeam(): NewTeamFragment {
    return (this.#orgNewTeam ??= new NewTeamFragment(this.driver));
  }

  get orgSpecificTeam(): SpecificTeamFragment {
    return (this.#orgSpecificTeam ??= new SpecificTeamFragment(this.driver));
  }

  get repoNavBar(): RepoNavBarFragment {
    return (this.#repoNavBar ??= new RepoNavBarFragment(this.driver));
  }

  get repoCodeTab(): RepoCodeTabFragment {
    return (this.#repoCodeTab ??= new RepoCodeTabFragment(this.driver));
  }

  get orgFacade(): OrganizationFacade {
    return (this.#orgFacade ??= new OrganizationFacade(
      this.driver,
      this.requireOrganization(),
      this.orgNavigation,
      this.orgRepositories,
      this.orgTeams,
      this.orgNewTeam,
      this.orgSpecificTeam,
    ));
  }
}
