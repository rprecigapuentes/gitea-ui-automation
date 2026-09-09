import { setWorldConstructor, World } from "@cucumber/cucumber";
import type { WebDriver } from "selenium-webdriver";
import type { LoginPage } from "@gitea-automation/business-logic-selenium/ui/pages/authentication/login.page";

export class GiteaWorld extends World {
  driver!: WebDriver;
  loginPage!: LoginPage;
}

setWorldConstructor(GiteaWorld);
