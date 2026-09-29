import { test } from "./agent-fixtures";

/* The world `issue-metadata.feature` runs in: a repository carrying the classification label and
   the milestone the scenario selects, and the maintainer it assigns the issue to, on the new issue
   form. A plan names this file by path. */
test.describe("Agent starting state", () => {
  test("issue metadata", async ({
    owner,
    repository,
    classificationLabel,
    milestone,
    maintainer,
    sessionManager,
    pageObjects,
  }) => {
    await sessionManager.loginAsOwner();
    await pageObjects.createIssuePage.openFor(owner, repository);
  });
});
