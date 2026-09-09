import { Given, When, Then } from "@cucumber/cucumber";
import { LoginPage } from "@gitea-automation/business-logic-selenium/ui/pages/authentication/login.page";
import { MainPage } from "@gitea-automation/business-logic-selenium/ui/pages/common/main.page";
import { resolveOwnerCredentials } from "../support/credentials";
import type { GiteaWorld } from "../support/world";

Given("I am on the Gitea login page", async function (this: GiteaWorld) {
  this.loginPage = new LoginPage(this.driver);
  await this.loginPage.open();
});

When("I log in with valid credentials", async function (this: GiteaWorld) {
  const { username, password } = resolveOwnerCredentials();
  await this.loginPage.login(username, password);
});

Then("I should land on the Gitea dashboard", async function (this: GiteaWorld) {
  await new MainPage(this.driver).waitUntilLoaded();
});
