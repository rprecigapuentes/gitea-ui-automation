import { When, Then, DataTable } from "@cucumber/cucumber";
import { expect } from "vitest";
import type { GiteaWorld } from "../support/world";
import { Organization } from "@gitea-automation/business-logic-selenium/api/entities/organization.entity";
import { uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";

When(
  'I navigate to the "Create Organization" page by "organization dropdown" menu',
  async function (this: GiteaWorld) {
    await this.pages.navBar.clickOrganizationsDropdown();
    await this.pages.navBar.clickNewOrganizationDropdownOption();
    await this.pages.createOrganizationPage.waitForElements();
  },
);

When("I create a new organization using:", async function (this: GiteaWorld, dataTable: DataTable) {
  const row = dataTable.rowsHash();
  const organization: Organization = {
    name: `${row.name}-${process.env.BROWSER ?? "local"}-${uniqueSuffix()}`,
    visibility: row.visibility as Organization["visibility"],
    permissions: row.permissions,
  };

  await this.pages.createOrganizationPage.createOrganization(
    organization.name,
    organization.visibility,
    organization.permissions === "true",
  );
  this.scenarioState.organization = organization;
  await this.pages.organizationDashboardPage.waitForElements(this.scenarioState.organization);
  await this.pages.navBar.waitForElements();
  expect(await this.pages.navBar.areOrgDashboardElementsVisible()).toBe(true);
});

Then("I should see the organization created successfully", async function (this: GiteaWorld) {
  await this.pages.navBar.clickOrganizationsDropdown();
  const actualOrganizations = await this.pages.navBar.getDropdownOrganizationsList();
  expect(actualOrganizations).toContain(this.scenarioState.organization!.name);
  expect(actualOrganizations).toContain(this.scenarioState.organization!.name);
  const currentOrganizationDashboard = await this.pages.navBar.getCurrentOrganization();
  expect(currentOrganizationDashboard).toBe(this.scenarioState.organization!.name);
});
