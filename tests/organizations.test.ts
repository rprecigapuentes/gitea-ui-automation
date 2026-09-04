import "dotenv/config";
import { describe, expect } from "vitest";
import { Organization } from "../src/entities/organization.entity";
import { test as it } from "../src/fixtures/fixture";

describe("Organization test", () => {
  it("should create an organization and add members", async ({
    driver,
    organizationPages,
    scenarioState,
    mainPage,
    createOrganizationPage,
  }) => {
    const organizationToCreate: Organization = {
      name: `test-orgs-${Date.now()}`,
      visibility: "public",
    };
    await mainPage.open();

    expect(mainPage.getUrl()).toBe(await driver.getCurrentUrl());
    //main page
    await mainPage.navigateCreateOrganization();
    expect(createOrganizationPage.getUrl()).toBe(await driver.getCurrentUrl());
    //Create Organization page
    await createOrganizationPage.enterOrganizationName(organizationToCreate.name);
    await createOrganizationPage.selectVisibility(organizationToCreate.visibility);
    await createOrganizationPage.clickCreateOrganizationButton();
    scenarioState.organization = organizationToCreate;
    expect(organizationPages.dashboard().getUrl()).toBe(await driver.getCurrentUrl());
    //Organization Dashboard Page
    await organizationPages.dashboard().clickViewRepositoryButton();
    expect(organizationPages.orgFacade().getUrl()).toBe(await driver.getCurrentUrl());
    //Organization Repositories Page
    await organizationPages.orgFacade().navigateToTeamsTab();
    console.log("URL after navigating to Teams tab: ", organizationPages.orgFacade().getUrl());
    expect(organizationPages.orgFacade().getUrl()).toBe(await driver.getCurrentUrl());
  });
});
