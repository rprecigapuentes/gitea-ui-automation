import { expect, Given, When, Then } from "../../fixtures/fixture";

// Each step calls a page object and nothing else: no selector ever appears in a step definition.

Given("I am on the Gitea login page", async ({ pageObjects }) => {
  await pageObjects.loginPage.open();
});

When("I log in with valid credentials", async ({ pageObjects, ownerCredentials }) => {
  await pageObjects.loginPage.login(ownerCredentials.username, ownerCredentials.password);
});

Then("I should land on the Gitea dashboard", async ({ pageObjects }) => {
  expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
});
