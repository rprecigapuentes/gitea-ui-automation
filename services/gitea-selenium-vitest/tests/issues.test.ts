import "dotenv/config";
import { describe, expect } from "vitest";
import { test as it } from "../src/fixtures/fixture";
import { resolveOwnerCredentials } from "../src/utils/session-credentials.util";

const labels = {
  priorityHigh: { name: "priority/high", description: "Blocks the release", color: "#d73a4a" },
  priorityLow: { name: "priority/low", description: "Can wait", color: "#0e8a16" },
  kindBug: { name: "kind/bug", description: "Something is broken", color: "#1d76db" },
};

describe("Scoped labels test", () => {
  it("AT-ISS-02 Verify that a scoped label replaces the label of its own scope, coexists with labels of other scopes, and leaves the issue when it is removed", async ({
    driver,
    repository,
    issue,
    labelListPage,
    issuePage,
    issueListPage,
  }) => {
    const { username: owner } = resolveOwnerCredentials();

    await driver.get(labelListPage.getUrl(owner, repository));

    await labelListPage.openNewLabelForm();
    expect(await labelListPage.isExclusiveFieldEnabled()).toBe(false);
    await labelListPage.fillName(labels.priorityHigh.name);
    expect(await labelListPage.isExclusiveFieldEnabled()).toBe(true);
    await labelListPage.markExclusive();
    await labelListPage.fillDescription(labels.priorityHigh.description);
    await labelListPage.fillColor(labels.priorityHigh.color);
    await labelListPage.submitLabelForm();

    const highRow = await labelListPage.waitForLabel(labels.priorityHigh.name);
    expect(highRow.exclusive).toBe(true);
    expect(highRow.color).toBe("d73a4a");
    expect(highRow.description).toBe(labels.priorityHigh.description);
    expect(await (await labelListPage.getChip(labels.priorityHigh.name)).getScopeAndItem()).toEqual(
      ["priority", "high"],
    );

    const lowRow = await labelListPage.createScopedLabel(labels.priorityLow);
    const bugRow = await labelListPage.createScopedLabel(labels.kindBug);

    const high = highRow.id;
    const low = lowRow.id;
    const bug = bugRow.id;

    await driver.get(issuePage.getUrl(owner, repository, issue.number));

    await issuePage.applyLabel(high);
    await issuePage.waitForAppliedLabels([high]);
    expect(await issuePage.getLastLabelEvent()).toContain(high);

    await issuePage.applyLabel(low);
    await issuePage.waitForAppliedLabels([low]);
    expect(await issuePage.getLastLabelEvent()).toContain(low);

    await issuePage.applyLabel(bug);
    await issuePage.waitForAppliedLabels([low, bug]);

    await driver.get(issueListPage.getUrl(owner, repository));
    await issueListPage.filterByLabel(low);
    expect(await issueListPage.getIssueTitles()).toContain(issue.title);
    expect(await issueListPage.getLabelIdsOf(issue.title)).toEqual(
      expect.arrayContaining([low, bug]),
    );

    await driver.get(issueListPage.getUrl(owner, repository));
    await issueListPage.filterByLabel(bug);
    expect(await issueListPage.getIssueTitles()).toContain(issue.title);

    await driver.get(issueListPage.getUrl(owner, repository));
    await issueListPage.filterByLabel(high);
    expect(await issueListPage.getIssueTitles()).not.toContain(issue.title);

    await driver.get(issuePage.getUrl(owner, repository, issue.number));
    await issuePage.removeLabel(bug);
    await issuePage.waitForAppliedLabels([low]);

    await driver.get(issueListPage.getUrl(owner, repository));
    await issueListPage.filterByLabel(bug);
    expect(await issueListPage.getIssueTitles()).not.toContain(issue.title);

    await driver.get(labelListPage.getUrl(owner, repository));
    expect((await labelListPage.waitForLabel(labels.priorityLow.name)).issueCount).toBe(1);
    expect((await labelListPage.waitForLabel(labels.kindBug.name)).issueCount).toBe(0);
  });
});
