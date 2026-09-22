import { test, expect } from "../fixtures/issues-fixtures";
import { testDataName } from "@gitea-automation/core-data-handler/data-handler.util";

const body = {
  heading: "Acceptance criteria",
  paragraph: "The issue has to carry every piece of metadata it was created with.",
};

const description = `## ${body.heading}\n\n${body.paragraph}\n`;

test.describe("Issue metadata", () => {
  test("AT-ISS-01 Verify that an issue created with a Markdown description, an assignee, a label and a milestone is returned by both list filters and drives its milestone to 100 percent when it is closed", async ({
    owner,
    repository,
    maintainer,
    classificationLabel,
    milestone,
    pageObjects,
    sessionManager,
  }) => {
    const title = testDataName("ISS-01", "Issue");

    await sessionManager.loginAsOwner();

    await pageObjects.createIssuePage.openFor(owner, repository);
    await pageObjects.createIssuePage.fillTitle(title);
    await pageObjects.createIssuePage.fillDescription(description);

    await pageObjects.createIssuePage.openPreview();
    expect(await pageObjects.createIssuePage.getPreviewHeadings()).toContain(body.heading);
    expect(await pageObjects.createIssuePage.getPreviewText()).toContain(body.paragraph);

    await pageObjects.createIssuePage.selectLabel(classificationLabel.id);
    await pageObjects.createIssuePage.selectMilestone(milestone.id);
    await pageObjects.createIssuePage.selectAssignee(maintainer.id);

    expect(await pageObjects.createIssuePage.getSelectedLabelIds()).toEqual([
      classificationLabel.id,
    ]);
    expect(await pageObjects.createIssuePage.getSelectedMilestoneNames()).toEqual([
      milestone.title,
    ]);
    expect(await pageObjects.createIssuePage.getSelectedAssigneeNames()).toContain(
      maintainer.login,
    );

    await pageObjects.createIssuePage.submit();

    const issueNumber = await pageObjects.issuePage.getIssueNumber();
    expect(await pageObjects.issuePage.getTitle()).toBe(title);
    expect(await pageObjects.issuePage.getState()).toBe("Open");
    expect(await pageObjects.issuePage.getRenderedBody()).toContain(body.paragraph);
    expect(await pageObjects.issuePage.getAppliedLabelIds()).toEqual([classificationLabel.id]);
    expect(await pageObjects.issuePage.getMilestoneName()).toBe(milestone.title);
    expect(await pageObjects.issuePage.getAssigneeNames()).toContain(maintainer.login);

    await pageObjects.issuePage.setDueDate(milestone.dueDate);
    const renderedDueDate = await pageObjects.issuePage.getDueDate();
    expect(renderedDueDate).toContain(String(milestone.dueDate.getUTCFullYear()));
    expect(renderedDueDate).toContain(String(milestone.dueDate.getUTCDate()));

    await pageObjects.issueListPage.openFor(owner, repository);
    await pageObjects.issueListPage.filterByLabel(classificationLabel.id);
    expect(await pageObjects.issueListPage.getIssueTitles()).toContain(title);
    expect(await pageObjects.issueListPage.getLabelIdsOf(title)).toEqual([classificationLabel.id]);

    await pageObjects.issueListPage.openFor(owner, repository);
    await pageObjects.issueListPage.filterByMilestone(milestone.id);
    expect(await pageObjects.issueListPage.getIssueTitles()).toContain(title);

    await pageObjects.issueListPage.openFor(owner, repository);
    await pageObjects.issueListPage.filterByNoMilestone();
    expect(await pageObjects.issueListPage.getIssueTitles()).not.toContain(title);

    await pageObjects.milestoneListPage.openFor(owner, repository);
    const beforeClosing = await pageObjects.milestoneListPage.waitForRow(milestone.title);
    expect(beforeClosing.openIssues).toBe(1);
    expect(beforeClosing.closedIssues).toBe(0);
    expect(beforeClosing.completeness).toBe(0);

    await pageObjects.issuePage.openFor(owner, repository, issueNumber);
    await pageObjects.issuePage.close();
    expect(await pageObjects.issuePage.getState()).toBe("Closed");

    await pageObjects.milestoneListPage.openFor(owner, repository);
    const afterClosing = await pageObjects.milestoneListPage.waitForRow(milestone.title);
    expect(afterClosing.openIssues).toBe(0);
    expect(afterClosing.closedIssues).toBe(1);
    expect(afterClosing.completeness).toBe(100);
  });
});
