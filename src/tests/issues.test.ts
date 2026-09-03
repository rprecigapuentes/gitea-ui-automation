import "dotenv/config";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { TestContext } from "../context";
import { DriverFactory } from "../../core/drivers/driver.factory";

const username = process.env.GITEA_USERNAME;
const password = process.env.GITEA_PASSWORD;

describe("Scoped labels test", () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await TestContext.create();
    const response = await context.userClient.getUser();
    expect(response.statusCode).toBe(200);
  });

  afterEach(async (ctx) => {
    await context.dispose(ctx.task.name);
  });

  afterAll(async () => {
    await DriverFactory.quitDriver();
  });

  it("should replace the label of the same scope and keep labels of other scopes", async () => {
    const owner = username!;
    const repository = `test-issues-${Date.now()}-${process.env.BROWSER ?? "local"}`;
    const issueTitle = "Scoped labels acceptance";

    await context.createRepository(repository);
    const priorityHigh = await context.labelClient.createLabel(owner, repository, {
      name: "priority/high",
      color: "#d73a4a",
      exclusive: true,
    });
    const priorityLow = await context.labelClient.createLabel(owner, repository, {
      name: "priority/low",
      color: "#0e8a16",
      exclusive: true,
    });
    const kindBug = await context.labelClient.createLabel(owner, repository, {
      name: "kind/bug",
      color: "#1d76db",
      exclusive: true,
    });
    const issue = await context.issueClient.createIssue(owner, repository, issueTitle);

    await context.driver.get(context.loginPage.baseUrl);
    const mainPage = await context.loginPage.login(username!, password!);
    expect(await mainPage.getLoggedInUsername()).toBe(username);

    await context.driver.get(context.issuePage.getUrl(owner, repository, issue.body.number));

    await context.issuePage.applyLabel(priorityHigh.body.id);
    await context.issuePage.waitForAppliedLabels([priorityHigh.body.id]);

    await context.issuePage.applyLabel(priorityLow.body.id);
    await context.issuePage.waitForAppliedLabels([priorityLow.body.id]);

    await context.issuePage.applyLabel(kindBug.body.id);
    await context.issuePage.waitForAppliedLabels([priorityLow.body.id, kindBug.body.id]);

    await context.driver.get(context.issueListPage.getUrl(owner, repository, priorityLow.body.id));
    expect(await context.issueListPage.getIssueTitles()).toContain(issueTitle);

    await context.driver.get(context.issueListPage.getUrl(owner, repository, kindBug.body.id));
    expect(await context.issueListPage.getIssueTitles()).toContain(issueTitle);

    await context.driver.get(context.issueListPage.getUrl(owner, repository, priorityHigh.body.id));
    expect(await context.issueListPage.getIssueTitles()).not.toContain(issueTitle);
  });
});
