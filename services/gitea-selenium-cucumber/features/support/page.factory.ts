import type { WebDriver } from "selenium-webdriver";
import { LoginPage } from "@gitea-automation/business-logic-selenium/ui/pages/authentication/login.page";
import { MainPage } from "@gitea-automation/business-logic-selenium/ui/pages/common/main.page";
import { NavBarFragment } from "@gitea-automation/business-logic-selenium/ui/pages/common/fragments/nav-bar.fragment";
import { IssuePage } from "@gitea-automation/business-logic-selenium/ui/pages/issues/issue.page";
import { CreateProjectPage } from "@gitea-automation/business-logic-selenium/ui/pages/projects/create-project.page";
import { ProjectListPage } from "@gitea-automation/business-logic-selenium/ui/pages/projects/project-list.page";
import { ProjectBoardPage } from "@gitea-automation/business-logic-selenium/ui/pages/projects/project-board.page";

export class PageFactory {
  #loginPage?: LoginPage;
  #mainPage?: MainPage;
  #navBar?: NavBarFragment;
  #issuePage?: IssuePage;
  #createProjectPage?: CreateProjectPage;
  #projectListPage?: ProjectListPage;
  #projectBoardPage?: ProjectBoardPage;

  constructor(private readonly driver: WebDriver) {}

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
}
