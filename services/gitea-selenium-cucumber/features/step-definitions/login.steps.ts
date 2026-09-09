import { Given, When, Then } from "@cucumber/cucumber";
import { resolveOwnerCredentials } from "../support/credentials";
import type { GiteaWorld } from "../support/world";

Given("I am on the Gitea login page", async function (this: GiteaWorld) {
  await this.pages.loginPage.open();
});

When("I log in with valid credentials", async function (this: GiteaWorld) {
  const { username, password } = resolveOwnerCredentials();
  await this.pages.loginPage.login(username, password);
});

Then("I should land on the Gitea dashboard", async function (this: GiteaWorld) {
  await this.pages.mainPage.waitUntilLoaded();
});
