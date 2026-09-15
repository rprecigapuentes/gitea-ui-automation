import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "vitest";
import { resolveOwnerCredentials } from "../support/credentials";
import { getSeededUser } from "../support/seeded-users";
import type { GiteaWorld } from "../support/world";

Given("I am on the Gitea login page", async function (this: GiteaWorld) {
  await this.pages.loginPage.open();
});

Given('I login with valid credentials as "owner"', async function (this: GiteaWorld) {
  const { username, password } = resolveOwnerCredentials();
  await this.pages.loginPage.open();
  await this.pages.loginPage.login(username, password);
  expect(await this.pages.mainPage.hasExpectedElementsDisplayed()).toBe(true);
  expect(await this.pages.navBar.waitForElements()).toBe(true);
});

Given(
  "I login with valid credentials as user {int}",
  async function (this: GiteaWorld, userIndex: number) {
    const { username, password } = getSeededUser(userIndex);
    await this.pages.loginPage.open();
    await this.pages.loginPage.login(username, password);
    expect(await this.pages.mainPage.hasExpectedElementsDisplayed()).toBe(true);
    expect(await this.pages.navBar.waitForElements()).toBe(true);
  },
);

When("I logout", async function (this: GiteaWorld) {
  await this.pages.navBar.clickSignOut();
});

When("I log in with valid credentials", async function (this: GiteaWorld) {
  const { username, password } = resolveOwnerCredentials();
  await this.pages.loginPage.login(username, password);
});

Then("I should land on the Gitea dashboard", async function (this: GiteaWorld) {
  expect(await this.pages.mainPage.hasExpectedElementsDisplayed()).toBe(true);
});
