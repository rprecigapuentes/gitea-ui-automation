import { setWorldConstructor, World } from "@cucumber/cucumber";
import type { WebDriver } from "selenium-webdriver";
import type { LoginPage } from "../pages/login.page";

export class GiteaWorld extends World {
  driver!: WebDriver;
  loginPage!: LoginPage;
}

setWorldConstructor(GiteaWorld);
