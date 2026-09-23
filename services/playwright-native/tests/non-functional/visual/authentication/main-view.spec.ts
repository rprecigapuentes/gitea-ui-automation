import {
  resolveInvitedCredentials,
  resolveOwnerCredentials,
} from "../../../../fixtures/credentials";
import { expect, test } from "../../../../fixtures/visual.fixture";

test("Main view smoke: the main view looks the same for two accounts", async ({
  page,
  pageObjects,
  visualTester,
}, testInfo) => {
  const owner = resolveOwnerCredentials(testInfo.project.name);
  const invited = resolveInvitedCredentials(testInfo.project.name);

  await pageObjects.loginPage.open();
  await pageObjects.loginPage.login(owner.username, owner.password);
  expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
  await visualTester.verifyPage(page, "main.png", {
    mask: pageObjects.mainPage.getVolatileRegions(),
    maxDiffPixels: 400,
  });

  await pageObjects.navBar.clickSignOut();

  await pageObjects.loginPage.open();
  await pageObjects.loginPage.login(invited.username, invited.password);
  expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
  await visualTester.verifyPage(page, "main.png", {
    mask: pageObjects.mainPage.getVolatileRegions(),
    maxDiffPixels: 400,
  });
});
