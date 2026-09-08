import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { LoginPage } from "../pages/login.page";
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
  const url = await this.driver.getCurrentUrl();
  assert.ok(!url.endsWith("/user/login"), `expected to leave the login page, still on ${url}`);
});
