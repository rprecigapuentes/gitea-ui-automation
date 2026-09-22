import { test, expect } from "../fixtures/issues-fixtures";

const labels = {
  priorityHigh: { name: "priority/high", description: "Blocks the release", color: "#d73a4a" },
  priorityLow: { name: "priority/low", description: "Can wait", color: "#0e8a16" },
  kindBug: { name: "kind/bug", description: "Something is broken", color: "#1d76db" },
};

test.describe("Scoped labels", () => {
  test("AT-ISS-02 Verify that a scoped label replaces the label of its own scope, coexists with labels of other scopes, and leaves the issue when it is removed", async ({
    owner,
    repository,
    issue,
    pageObjects,
    sessionManager,
  }) => {
    await sessionManager.loginAsOwner();

    await pageObjects.labelListPage.openFor(owner, repository);

    await pageObjects.labelListPage.openNewLabelForm();
    expect(await pageObjects.labelListPage.isExclusiveFieldEnabled()).toBe(false);
    await pageObjects.labelListPage.fillName(labels.priorityHigh.name);
    expect(await pageObjects.labelListPage.isExclusiveFieldEnabled()).toBe(true);
    await pageObjects.labelListPage.markExclusive();
    await pageObjects.labelListPage.fillDescription(labels.priorityHigh.description);
    await pageObjects.labelListPage.fillColor(labels.priorityHigh.color);
    await pageObjects.labelListPage.submitLabelForm();

    const highRow = await pageObjects.labelListPage.waitForLabel(labels.priorityHigh.name);
    expect(highRow.exclusive).toBe(true);
    expect(highRow.color).toBe("d73a4a");
    expect(highRow.description).toBe(labels.priorityHigh.description);
    expect(
      await (await pageObjects.labelListPage.getChip(labels.priorityHigh.name)).getScopeAndItem(),
    ).toEqual(["priority", "high"]);

    const lowRow = await pageObjects.labelListPage.createScopedLabel(labels.priorityLow);
    const bugRow = await pageObjects.labelListPage.createScopedLabel(labels.kindBug);

    const high = highRow.id;
    const low = lowRow.id;
    const bug = bugRow.id;

    await pageObjects.issuePage.openFor(owner, repository, issue.number);

    await pageObjects.issuePage.applyLabel(high);
    await pageObjects.issuePage.waitForAppliedLabels([high]);
    expect(await pageObjects.issuePage.getLastLabelEvent()).toContain(high);

    await pageObjects.issuePage.applyLabel(low);
    await pageObjects.issuePage.waitForAppliedLabels([low]);
    expect(await pageObjects.issuePage.getLastLabelEvent()).toContain(low);

    await pageObjects.issuePage.applyLabel(bug);
    await pageObjects.issuePage.waitForAppliedLabels([low, bug]);

    await pageObjects.issueListPage.openFor(owner, repository);
    await pageObjects.issueListPage.filterByLabel(low);
    expect(await pageObjects.issueListPage.getIssueTitles()).toContain(issue.title);
    expect(await pageObjects.issueListPage.getLabelIdsOf(issue.title)).toEqual(
      expect.arrayContaining([low, bug]),
    );

    await pageObjects.issueListPage.openFor(owner, repository);
    await pageObjects.issueListPage.filterByLabel(bug);
    expect(await pageObjects.issueListPage.getIssueTitles()).toContain(issue.title);

    await pageObjects.issueListPage.openFor(owner, repository);
    await pageObjects.issueListPage.filterByLabel(high);
    expect(await pageObjects.issueListPage.getIssueTitles()).not.toContain(issue.title);

    await pageObjects.issuePage.openFor(owner, repository, issue.number);
    await pageObjects.issuePage.removeLabel(bug);
    await pageObjects.issuePage.waitForAppliedLabels([low]);

    await pageObjects.issueListPage.openFor(owner, repository);
    await pageObjects.issueListPage.filterByLabel(bug);
    expect(await pageObjects.issueListPage.getIssueTitles()).not.toContain(issue.title);

    await pageObjects.labelListPage.openFor(owner, repository);
    expect((await pageObjects.labelListPage.waitForLabel(labels.priorityLow.name)).issueCount).toBe(
      1,
    );
    expect((await pageObjects.labelListPage.waitForLabel(labels.kindBug.name)).issueCount).toBe(0);
  });
});
