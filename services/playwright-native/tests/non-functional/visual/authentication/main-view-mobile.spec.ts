import { resolveOwnerCredentials } from "../../../../fixtures/credentials";
import { expect, test } from "../../../../fixtures/visual.fixture";

test.use({ viewport: { width: 390, height: 844 } });

test("Main view smoke: the main view looks right at a phone width", async ({
  page,
  pageObjects,
  visualTester,
}, testInfo) => {
  const owner = resolveOwnerCredentials(testInfo.project.name);

  await pageObjects.loginPage.open();
  await pageObjects.loginPage.login(owner.username, owner.password);
  expect(await pageObjects.mainPage.hasExpectedElementsDisplayed()).toBe(true);
  await visualTester.verifyPage(page, "main-mobile.png");
});
