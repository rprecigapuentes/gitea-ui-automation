import "dotenv/config";
import { describe, expect } from "vitest";
import { test as it } from "../src/fixtures/fixture";
import { testDataName } from "../core/utils/test-data.util";
import { BASIC_KANBAN_COLUMNS, ProjectTemplate } from "../src/entities/project.entity";

const [BACKLOG, , IN_PROGRESS] = BASIC_KANBAN_COLUMNS;

describe("Organization project board test", () => {
  it("AT-ISS-03 Verify that an organization project created from the Basic Kanban template tracks issues from two repositories and that a collaborator dragging a card updates the column of the card and the issue count of both columns", async ({
    driver,
    session,
    organization,
    organizationRepositories,
    organizationIssues,
    collaborator,
    teamClient,
    createProjectPage,
    projectListPage,
    projectBoardPage,
    issuePage,
  }) => {
    const project = {
      title: testDataName("ISS-03", "Project"),
      description: "Board tracking the issues of both repositories of the organization",
      template: ProjectTemplate.BasicKanban,
    };

    const team = await teamClient.createTeam(organization, {
      name: "board-writers",
      description: "Write access on every repository and on the projects of the organization",
      permission: "write",
      units: ["repo.code", "repo.issues", "repo.pulls", "repo.projects"],
      includes_all_repositories: true,
    });
    await teamClient.addTeamMember(team.body.id, collaborator.username);

    await driver.get(createProjectPage.getUrl(organization));
    await createProjectPage.createProject(project);

    const projectId = await projectListPage.openProject(project.title);

    expect(await projectBoardPage.getColumnTitles()).toEqual([...BASIC_KANBAN_COLUMNS]);
    expect(await (await projectBoardPage.column(BACKLOG)).getIssueCount()).toBe(0);
    expect(await (await projectBoardPage.column(IN_PROGRESS)).getIssueCount()).toBe(0);

    for (const [index, issue] of organizationIssues.entries()) {
      await driver.get(
        issuePage.getUrl(organization, organizationRepositories[index], issue.number),
      );
      await issuePage.attachProject(projectId);
      expect(await issuePage.getAttachedProjectTitles()).toEqual([project.title]);
      expect(await issuePage.getProjectColumnName()).toBe(BACKLOG);
    }

    await driver.get(projectBoardPage.getUrl(organization, projectId));

    const backlog = await projectBoardPage.column(BACKLOG);
    expect(await backlog.getIssueCount()).toBe(2);
    expect(await backlog.getCardIssueIds()).toEqual(
      expect.arrayContaining(organizationIssues.map((issue) => issue.id)),
    );

    const repositoriesOnTheBoard = await Promise.all(
      (await backlog.getCards()).map((card) => card.getRepositoryRef()),
    );
    expect(new Set(repositoriesOnTheBoard)).toEqual(
      new Set(organizationRepositories.map((repository) => `${organization}/${repository}`)),
    );

    await session.loginAs(collaborator.username, collaborator.password);
    await driver.get(projectBoardPage.getUrl(organization, projectId));
    expect(await projectBoardPage.isWritable()).toBe(true);

    const movedIssue = organizationIssues[0];
    await projectBoardPage.moveCard(movedIssue.id, IN_PROGRESS);

    const inProgressAfterMove = await projectBoardPage.column(IN_PROGRESS);
    const backlogAfterMove = await projectBoardPage.column(BACKLOG);
    expect(await inProgressAfterMove.getCardIssueIds()).toEqual([movedIssue.id]);
    expect(await inProgressAfterMove.getIssueCount()).toBe(1);
    expect(await backlogAfterMove.getIssueCount()).toBe(1);
    expect(await backlogAfterMove.getCardIssueIds()).toEqual([organizationIssues[1].id]);
  });
});
