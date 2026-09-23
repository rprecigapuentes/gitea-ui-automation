import { resolveOwnerCredentials } from "../../../../fixtures/credentials";
import { test } from "../../../../fixtures/visual.fixture";

const INVALID_NAME_BASELINE = "organization-create-form-invalid.png";

type InvalidNameCase =
  | { kind: "static"; name: string; reason: string }
  | { kind: "username"; reason: string }
  | { kind: "existing"; reason: string };

const invalidNameCases: InvalidNameCase[] = [
  { kind: "static", name: "test@org", reason: "has a disallowed character" },
  { kind: "static", name: "-test-org", reason: "starts with a non-alphanumeric character" },
  { kind: "static", name: "test-org-", reason: "ends with a non-alphanumeric character" },
  {
    kind: "static",
    name: "test--org",
    reason: "has consecutive non-alphanumeric characters",
  },
  { kind: "static", name: "test org", reason: "has spaces" },
  { kind: "username", reason: "matches the username" },
  { kind: "existing", reason: "already exists" },
];

for (const invalidNameCase of invalidNameCases) {
  test(`Organizations smoke: create organization rejects a name that ${invalidNameCase.reason}`, async ({
    page,
    pageObjects,
    clients,
    scenarioState,
    sessionManager,
    visualTester,
  }, testInfo) => {
    let name: string;
    switch (invalidNameCase.kind) {
      case "static":
        name = invalidNameCase.name;
        break;
      case "username":
        name = resolveOwnerCredentials(testInfo.project.name).username;
        break;
      case "existing":
        name = `existing-org-${testInfo.project.name}`;
        await clients.organizations.createOrganization(name);
        scenarioState.organization = { name, visibility: "private" };
        break;
    }

    await sessionManager.loginAsOwner();

    await pageObjects.createOrganizationPage.open();
    await pageObjects.createOrganizationPage.enterOrganizationName(name);
    await pageObjects.createOrganizationPage.clickCreateOrganizationButton();
    await pageObjects.createOrganizationPage.waitForElements();

    await visualTester.verifyPage(page, INVALID_NAME_BASELINE, {
      mask: pageObjects.createOrganizationPage.getVolatileRegions(),
    });
  });
}
