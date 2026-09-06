import "dotenv/config";
import { describe, expect } from "vitest";
import { test as it } from "../src/fixtures/fixture";
import { testDataName } from "../core/utils/test-data.util";

const username = process.env.GITEA_USERNAME;

const body = {
  heading: "Acceptance criteria",
  paragraph: "The issue has to carry every piece of metadata it was created with.",
};

const description = `## ${body.heading}\n\n${body.paragraph}\n`;

describe("Issue metadata test", () => {
  it("AT-ISS-01 Verify that an issue created with a Markdown description, an assignee, a label and a milestone is returned by both list filters and drives its milestone to 100 percent when it is closed", async ({
    driver,
    repository,
    maintainer,
    classificationLabel,
    milestone,
    createIssuePage,
    issuePage,
    issueListPage,
    milestoneListPage,
  }) => {
    const owner = username!;
    const title = testDataName("ISS-01", "Issue");

    await driver.get(createIssuePage.getUrl(owner, repository));

    await createIssuePage.fillTitle(title);
    await createIssuePage.fillDescription(description);

    await createIssuePage.openPreview();
    expect(await createIssuePage.getPreviewHeadings()).toContain(body.heading);
    expect(await createIssuePage.getPreviewText()).toContain(body.paragraph);

    await createIssuePage.selectLabel(classificationLabel.id);
    await createIssuePage.selectMilestone(milestone.id);
    await createIssuePage.selectAssignee(maintainer.id);

    expect(await createIssuePage.getSelectedLabelIds()).toEqual([classificationLabel.id]);
    expect(await createIssuePage.getSelectedMilestoneNames()).toEqual([milestone.title]);
    expect(await createIssuePage.getSelectedAssigneeNames()).toContain(maintainer.login);

    await createIssuePage.submit();

    const issueNumber = await issuePage.getIssueNumber();
    expect(await issuePage.getTitle()).toBe(title);
    expect(await issuePage.getState()).toBe("Open");
    expect(await issuePage.getRenderedBody()).toContain(body.paragraph);
    expect(await issuePage.getAppliedLabelIds()).toEqual([classificationLabel.id]);
    expect(await issuePage.getMilestoneName()).toBe(milestone.title);
    expect(await issuePage.getAssigneeNames()).toContain(maintainer.login);

    await issuePage.setDueDate(milestone.dueDate);
    const renderedDueDate = await issuePage.getDueDate();
    expect(renderedDueDate).toContain(String(milestone.dueDate.getUTCFullYear()));
    expect(renderedDueDate).toContain(String(milestone.dueDate.getUTCDate()));

    await driver.get(issueListPage.getUrl(owner, repository));
    await issueListPage.filterByLabel(classificationLabel.id);
    expect(await issueListPage.getIssueTitles()).toContain(title);
    expect(await issueListPage.getLabelIdsOf(title)).toEqual([classificationLabel.id]);

    await driver.get(issueListPage.getUrl(owner, repository));
    await issueListPage.filterByMilestone(milestone.id);
    expect(await issueListPage.getIssueTitles()).toContain(title);

    await driver.get(issueListPage.getUrl(owner, repository));
    await issueListPage.filterByNoMilestone();
    expect(await issueListPage.getIssueTitles()).not.toContain(title);

    await driver.get(milestoneListPage.getUrl(owner, repository));
    const beforeClosing = await milestoneListPage.waitForRow(milestone.title);
    expect(beforeClosing.openIssues).toBe(1);
    expect(beforeClosing.closedIssues).toBe(0);
    expect(beforeClosing.completeness).toBe(0);

    await driver.get(issuePage.getUrl(owner, repository, issueNumber));
    await issuePage.close();
    expect(await issuePage.getState()).toBe("Closed");

    await driver.get(milestoneListPage.getUrl(owner, repository));
    const afterClosing = await milestoneListPage.waitForRow(milestone.title);
    expect(afterClosing.openIssues).toBe(0);
    expect(afterClosing.closedIssues).toBe(1);
    expect(afterClosing.completeness).toBe(100);
  });
});
