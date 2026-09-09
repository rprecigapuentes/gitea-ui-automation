import type { WebDriver } from "selenium-webdriver";
import { LoginPage } from "@gitea-automation/business-logic-selenium/ui/pages/authentication/login.page";
import { MainPage } from "@gitea-automation/business-logic-selenium/ui/pages/common/main.page";
import { NavBarFragment } from "@gitea-automation/business-logic-selenium/ui/pages/common/fragments/nav-bar.fragment";

export class PageFactory {
  #loginPage?: LoginPage;
  #mainPage?: MainPage;
  #navBar?: NavBarFragment;

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
}
