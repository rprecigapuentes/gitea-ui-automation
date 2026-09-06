import "dotenv/config";
import { describe, expect } from "vitest";
import { test as it } from "../src/fixtures/fixture";

const username = process.env.GITEA_USERNAME;

const labels = {
  priorityHigh: { name: "priority/high", description: "Blocks the release", color: "#d73a4a" },
  priorityLow: { name: "priority/low", description: "Can wait", color: "#0e8a16" },
  kindBug: { name: "kind/bug", description: "Something is broken", color: "#1d76db" },
};

describe("Scoped labels test", () => {
  it("should replace the label of the same scope and keep labels of other scopes", async ({
    driver,
    repository,
    issue,
    labelListPage,
    issuePage,
    issueListPage,
  }) => {
    const owner = username!;

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

    await driver.get(issueListPage.getUrl(owner, repository, low));
    expect(await issueListPage.getIssueTitles()).toContain(issue.title);

    await driver.get(issueListPage.getUrl(owner, repository, bug));
    expect(await issueListPage.getIssueTitles()).toContain(issue.title);

    await driver.get(issueListPage.getUrl(owner, repository, high));
    expect(await issueListPage.getIssueTitles()).not.toContain(issue.title);
  });
});
