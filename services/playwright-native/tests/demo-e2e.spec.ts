import { test, expect } from "../fixtures/project-board-fixtures";
import { testDataName } from "@gitea-automation/core-data-handler/data-handler.util";
import { logger } from "@gitea-automation/core-logger/pino.logger";

const TEAM = "qa-team";
const ISSUE_HEADING = "Demo work item";
const ISSUE_DESCRIPTION = `# ${ISSUE_HEADING}\n\nThe item the demo follows from assignment to close.`;
const SCOPED_LABEL = {
  name: "priority/high",
  description: "Set by the demo end to end",
  color: "#e11d48",
};
const TEMPLATE_COLUMNS = ["Backlog", "To Do", "In Progress", "Done"];
const DEFAULT_COLUMN = "Backlog";
const ADDED_COLUMN = "Review";
const IN_PROGRESS_COLUMN = "In Progress";

test.describe("Organization work item lifecycle", () => {
  test("a work item travels from the team that may be assigned it to the board that tracks it", async ({
    pageObjects,
    sessionManager,
    seededOrganizationWithRepositories,
    seededMilestone,
    seededUsers,
  }) => {
    const { organizationName, repositories } = seededOrganizationWithRepositories;
    const [firstRepository] = repositories;
    const [userOne, userTwo] = seededUsers;

    await test.step("The owner opens the seeded organization", async () => {
      await sessionManager.loginAsOwner();
      await pageObjects.orgFacade.open();
      await pageObjects.orgFacade.waitForElements();
    });

    await test.step("The owner creates the team", async () => {
      await pageObjects.orgFacade.navigateToTeamsTab();
      await pageObjects.orgTeams.clickNewTeamButton();
      await pageObjects.orgNewTeam.waitForElements();
      await pageObjects.orgNewTeam.createTeam(TEAM, "private", "write", false);
      await pageObjects.orgSpecificTeam.waitForElements();
      await pageObjects.orgNavigation.waitForElements();

      await pageObjects.orgFacade.navigateToTeamsTab();
      expect(await pageObjects.orgTeams.hasTeamContainer(TEAM)).toBe(true);
      // The organization's own Owners team is the other one.
      expect(await pageObjects.orgTeams.getTeamContainersCount()).toBe(2);
    });

    await test.step("The team holds no members yet", async () => {
      await pageObjects.orgFacade.navigateToTeamsTab();
      await pageObjects.orgFacade.navigateToSpecificTeam(TEAM);

      expect(await pageObjects.orgSpecificTeam.hasEmptyMembersMessage()).toBe(true);
    });

    await test.step("A repository joins the team, which nobody can be assigned from yet", async () => {
      await pageObjects.orgFacade.navigateToTeamsTab();
      await pageObjects.orgFacade.navigateToSpecificTeam(TEAM);
      await pageObjects.orgSpecificTeam.navigateToRepositoriesTab();
      await pageObjects.orgSpecificTeam.addRepository(firstRepository.name);

      await pageObjects.createIssuePage.openFor(organizationName, firstRepository.name);
      expect(await pageObjects.createIssuePage.offersAssignee(userOne.id)).toBe(false);
    });

    await test.step("The first user joins the team", async () => {
      await pageObjects.orgFacade.open();
      await pageObjects.orgFacade.waitForElements();
      await pageObjects.orgFacade.navigateToTeamsTab();
      await pageObjects.orgFacade.navigateToSpecificTeam(TEAM);
      await pageObjects.orgSpecificTeam.addMemberByUsername(userOne.username);
      expect(await pageObjects.orgSpecificTeam.hasMember(userOne.username)).toBe(true);

      await pageObjects.orgFacade.navigateToTeamsTab();
      expect(await pageObjects.orgTeams.getTeamMembersCount(TEAM)).toBe("1 members");
      expect(await pageObjects.orgTeams.getTeamAvatarUsernames(TEAM)).toEqual([userOne.username]);
    });

    await test.step("Membership is what the assignee list answers to", async () => {
      await pageObjects.createIssuePage.openFor(organizationName, firstRepository.name);

      expect(await pageObjects.createIssuePage.offersAssignee(userOne.id)).toBe(true);
      expect(await pageObjects.createIssuePage.offersAssignee(userTwo.id)).toBe(false);
    });

    const label = await test.step("A scoped label is created for the repository", async () => {
      await pageObjects.labelListPage.openFor(organizationName, firstRepository.name);

      return pageObjects.labelListPage.createScopedLabel(SCOPED_LABEL);
    });

    const issueTitle = testDataName("S2-DEMO-ISS", ISSUE_HEADING);

    await test.step("The issue form previews the description it was given", async () => {
      await pageObjects.createIssuePage.openFor(organizationName, firstRepository.name);
      await pageObjects.createIssuePage.fillTitle(issueTitle);
      await pageObjects.createIssuePage.fillDescription(ISSUE_DESCRIPTION);
      await pageObjects.createIssuePage.openPreview();

      expect(await pageObjects.createIssuePage.getPreviewHeadings()).toContain(ISSUE_HEADING);
    });

    const issueNumber = await test.step("The issue is created with its metadata", async () => {
      await pageObjects.createIssuePage.selectLabel(label.id);
      await pageObjects.createIssuePage.selectMilestone(seededMilestone.id);
      await pageObjects.createIssuePage.selectAssignee(userOne.id);
      await pageObjects.createIssuePage.submit();

      expect(await pageObjects.issuePage.getAppliedLabelIds()).toEqual([label.id]);
      expect(await pageObjects.issuePage.getMilestoneName()).toBe(seededMilestone.title);
      expect(await pageObjects.issuePage.getAssigneeNames()).toEqual([userOne.username]);

      return pageObjects.issuePage.getIssueNumber();
    });

    await test.step("The label filter returns only that issue", async () => {
      await pageObjects.issueListPage.openFor(organizationName, firstRepository.name);
      await pageObjects.issueListPage.filterByLabel(label.id);

      expect(await pageObjects.issueListPage.getIssueTitles()).toEqual([issueTitle]);
    });

    const projectId =
      await test.step("A Basic Kanban project takes in the three issues", async () => {
        await pageObjects.createProjectPage.openFor(organizationName);
        await pageObjects.createProjectPage.createFromBasicKanban(
          testDataName("S2-DEMO-ISS", "Project"),
        );
        await pageObjects.projectListPage.openFor(organizationName);
        const id = await pageObjects.projectListPage.getOnlyProjectId();

        for (const repository of repositories) {
          await pageObjects.issuePage.openFor(
            organizationName,
            repository.name,
            repository.issue.number,
          );
          await pageObjects.issuePage.assignProject(id);
        }
        await pageObjects.issuePage.openFor(organizationName, firstRepository.name, issueNumber);
        await pageObjects.issuePage.assignProject(id);

        await pageObjects.projectBoardPage.openFor(organizationName, id);
        expect(await pageObjects.projectBoardPage.getColumnTitles()).toEqual(TEMPLATE_COLUMNS);
        expect(await pageObjects.projectBoardPage.getDefaultColumnTitle()).toBe(DEFAULT_COLUMN);
        expect(await pageObjects.projectBoardPage.getDefaultColumnIssueCount()).toBe(3);
        expect(await pageObjects.projectBoardPage.getColumnIssueCount(IN_PROGRESS_COLUMN)).toBe(0);

        return id;
      });

    // The ids a failed run is read by: every later phase addresses the board and the issue by them.
    logger.info(
      { organizationName, projectId, issueNumber, labelId: label.id },
      "The demo scenario reached the board",
    );

    await test.step("A column added from the board appears on it", async () => {
      await pageObjects.projectBoardPage.addColumn(ADDED_COLUMN);
      await pageObjects.projectBoardPage.openFor(organizationName, projectId);

      expect(await pageObjects.projectBoardPage.isColumnVisible(ADDED_COLUMN)).toBe(true);
    });
  });
});
