import "dotenv/config";
import { describe, expect } from "vitest";
import { test as it } from "../fixtures/fixture";

const username = process.env.GITEA_USERNAME;
const password = process.env.GITEA_PASSWORD;

describe("Scoped labels test", () => {
  it("should replace the label of the same scope and keep labels of other scopes", async ({
    driver,
    repository,
    scopedLabels,
    issue,
    loginPage,
    mainPage,
    issuePage,
    issueListPage,
  }) => {
    const owner = username!;

    await driver.get(loginPage.getUrl());
    await loginPage.login(username!, password!);
    expect(await mainPage.getLoggedInUsername()).toBe(username);

    await driver.get(issuePage.getUrl(owner, repository, issue.number));

    await issuePage.applyLabel(scopedLabels.priorityHigh);
    await issuePage.waitForAppliedLabels([scopedLabels.priorityHigh]);

    await issuePage.applyLabel(scopedLabels.priorityLow);
    await issuePage.waitForAppliedLabels([scopedLabels.priorityLow]);

    await issuePage.applyLabel(scopedLabels.kindBug);
    await issuePage.waitForAppliedLabels([scopedLabels.priorityLow, scopedLabels.kindBug]);

    await driver.get(issueListPage.getUrl(owner, repository, scopedLabels.priorityLow));
    expect(await issueListPage.getIssueTitles()).toContain(issue.title);

    await driver.get(issueListPage.getUrl(owner, repository, scopedLabels.kindBug));
    expect(await issueListPage.getIssueTitles()).toContain(issue.title);

    await driver.get(issueListPage.getUrl(owner, repository, scopedLabels.priorityHigh));
    expect(await issueListPage.getIssueTitles()).not.toContain(issue.title);
  });
});
