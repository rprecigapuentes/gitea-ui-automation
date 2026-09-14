import { describe, expect } from "vitest";
import { OrgTab } from "@gitea-automation/business-logic-selenium/ui/pages/organizations/fragments/org-navigation.fragment";
import { Organization } from "@gitea-automation/business-logic-selenium/api/entities/organization.entity";
import { Team } from "@gitea-automation/business-logic-selenium/api/entities/team.entity";
import { test } from "../src/fixtures/fixture";
import * as allure from "allure-js-commons";
import "dotenv/config";
import {
  resolveInvitedCredentials,
  resolveOwnerCredentials,
} from "../src/utils/session-credentials.util";
import { uniqueSuffix } from "@gitea-automation/core-data-handler/data-handler.util";

const baseTest = test.extend({
  skipAutoLogin: async ({}, use) => {
    await use(true);
  },
});

const owner = resolveOwnerCredentials();
const invited = resolveInvitedCredentials();

describe("Organization test", () => {
  const organizationToCreate: Organization = {
    name: `test-orgs-${Date.now()}-${process.env.BROWSER ?? "local"}-${uniqueSuffix()}`,
    visibility: "private",
    permissions: "true",
  };
  const team1ToCreate: Team = {
    name: `test-team-1-${Date.now()}-${uniqueSuffix()}`,
    visibility: "private",
    createRepositories: true,
    permissions: "general",
  };
  const team2ToCreate: Team = {
    name: `test-team-2-${Date.now()}-${uniqueSuffix()}`,
    visibility: "private",
    createRepositories: true,
    permissions: "general",
  };

  baseTest(
    "should create an organization and add members",
    async ({
      driver,
      organizationPages,
      scenarioState,
      mainPage,
      createOrganizationPage,
      navBarFragment,
      sessionManager,
      cleanupOrganizationsBeforeRun,
    }) => {
      // Fixture setup already ran the cleanup; referenced only so vitest includes it.
      void cleanupOrganizationsBeforeRun;

      await allure.step("Owner: Login with user 1 credentials", async () => {
        await sessionManager.loginAsOwner();
        await mainPage.open();
        expect(await mainPage.hasExpectedElementsDisplayed()).toBe(true);
        expect(await navBarFragment.isVisibleOnMainPage(owner.username)).toBe(true);
        expect(await navBarFragment.getCurrentOrganization()).toBe(owner.username);
        await navBarFragment.clickOrganizationsDropdown();
      });

      await allure.step("Owner: Creates new organization", async () => {
        await navBarFragment.clickNewOrganizationDropdownOption();
        expect(await createOrganizationPage.hasExpectedFormElements()).toBe(true);
        expect(await createOrganizationPage.hasDefaultFormState()).toBe(true);
        await createOrganizationPage.enterOrganizationName(organizationToCreate.name);
        await createOrganizationPage.selectVisibility(organizationToCreate.visibility);
        await createOrganizationPage.clickCreateOrganizationButton();
        await navBarFragment.waitForElements();
        scenarioState.organization = organizationToCreate;
        expect(await navBarFragment.areOrgDashboardElementsVisible()).toBe(true);
        expect(await navBarFragment.getViewOrganizationButtonText()).toContain(
          scenarioState.organization.name,
        );
      });

      await allure.step("Navigate to created organization", async () => {
        await navBarFragment.clickViewOrganizationButton();
        expect(await organizationPages.navigation().areOwnerElementsVisible()).toBe(true);
        expect(
          await organizationPages
            .navigation()
            .hasOrganizationNameDisplayed(scenarioState.organization!.name),
        ).toBe(true);
        expect(await organizationPages.navigation().isTabSelected(OrgTab.Repos)).toBe(true);
        expect(await organizationPages.navigation().getTabCount(OrgTab.Members)).toBe("1");
        expect(await organizationPages.navigation().getTabCount(OrgTab.Teams)).toBe("1");
        expect(await organizationPages.repositories().areOwnerElementsVisible()).toBe(true);
        expect(await organizationPages.repositories().getMembersCount()).toBe("1");
        expect(await organizationPages.repositories().getMemberAvatarsCount()).toBe(1);
        expect(await organizationPages.repositories().hasMemberAvatar(owner.username)).toBe(true);
        expect(await organizationPages.repositories().getOwnersMembersCount()).toBe("1");
        expect(await organizationPages.repositories().getOwnersRepositoriesCount()).toBe("0");
        expect(await organizationPages.repositories().hasNewTeamButton()).toBe(true);
      });

      expect(organizationPages.orgFacade().getUrl()).toBe(await driver.getCurrentUrl());

      await allure.step("Navigate to Teams", async () => {
        await organizationPages.orgFacade().navigateToTeamsTab();
        expect(await organizationPages.navigation().isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await organizationPages.teams().areOwnerElementsVisible()).toBe(true);
        expect(await organizationPages.teams().getTeamContainersCount()).toBe(1);
        expect(await organizationPages.teams().hasTeamContainer("Owners")).toBe(true);
        expect(await organizationPages.teams().getTeamMembersCount("Owners")).toBe("1 members");
        expect(await organizationPages.teams().getTeamAvatarsCount("Owners")).toBe(1);
        expect(await organizationPages.teams().hasTeamAvatar("Owners", owner.username)).toBe(true);
      });

      await allure.step("Create private team 1", async () => {
        await organizationPages.orgFacade().navigateToNewTeam();
        expect(await organizationPages.navigation().isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await organizationPages.newTeam().waitForElements()).toBe(true);
        expect(await organizationPages.newTeam().hasDefaultFormState()).toBe(true);
        await organizationPages.newTeam().enterTeamName(team1ToCreate.name);
        await organizationPages.newTeam().selectVisibility(team1ToCreate.visibility);
        await organizationPages.newTeam().enableCreateRepositories();
        scenarioState.team1 = team1ToCreate;
        await organizationPages.orgFacade().createTeam(scenarioState.team1.name);
        expect(await organizationPages.navigation().isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await organizationPages.navigation().getTabCount(OrgTab.Teams)).toBe("2");
        expect(await organizationPages.specificTeam().isVisibleForOwner()).toBe(true);
        expect(
          await organizationPages.specificTeam().hasTeamNameDisplayed(scenarioState.team1.name),
        ).toBe(true);
        expect(await organizationPages.specificTeam().getMembersCount()).toBe("0");
        expect(await organizationPages.specificTeam().getRepositoriesCount()).toBe("0");
      });

      await allure.step("Return to Teams after creating team 1", async () => {
        await organizationPages.orgFacade().navigateToTeamsTab();
        expect(await organizationPages.navigation().isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await organizationPages.navigation().getTabCount(OrgTab.Teams)).toBe("2");
        expect(await organizationPages.teams().getTeamContainersCount()).toBe(2);
        expect(await organizationPages.teams().hasTeamContainer("Owners")).toBe(true);
        expect(await organizationPages.teams().hasTeamContainer(scenarioState.team1!.name)).toBe(
          true,
        );
        expect(await organizationPages.teams().getTeamMembersCount("Owners")).toBe("1 members");
        expect(await organizationPages.teams().getTeamMembersCount(scenarioState.team1!.name)).toBe(
          "0 members",
        );
        expect(
          await organizationPages.teams().hasAddTeamMemberLink(scenarioState.team1!.name),
        ).toBe(true);
      });

      await allure.step("Create private team 2", async () => {
        await organizationPages.orgFacade().navigateToNewTeam();
        expect(await organizationPages.newTeam().hasDefaultFormState()).toBe(true);
        await organizationPages.newTeam().enterTeamName(team2ToCreate.name);
        await organizationPages.newTeam().selectVisibility(team2ToCreate.visibility);
        await organizationPages.newTeam().enableCreateRepositories();
        scenarioState.team2 = team2ToCreate;
        await organizationPages.orgFacade().createTeam(scenarioState.team2.name);
        expect(await organizationPages.navigation().getTabCount(OrgTab.Teams)).toBe("3");
        expect(await organizationPages.specificTeam().isVisibleForOwner()).toBe(true);
        expect(
          await organizationPages.specificTeam().hasTeamNameDisplayed(scenarioState.team2.name),
        ).toBe(true);
        expect(await organizationPages.specificTeam().hasPrivateVisibility()).toBe(true);
        expect(await organizationPages.specificTeam().getMembersCount()).toBe("0");
        expect(await organizationPages.specificTeam().getRepositoriesCount()).toBe("0");
        expect(await organizationPages.specificTeam().hasEmptyMembersMessage()).toBe(true);
      });

      await allure.step("Return to Teams after creating team 2", async () => {
        await organizationPages.orgFacade().navigateToTeamsTab();
        expect(await organizationPages.navigation().isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await organizationPages.navigation().getTabCount(OrgTab.Teams)).toBe("3");
        expect(await organizationPages.teams().getTeamContainersCount()).toBe(3);
        expect(await organizationPages.teams().getTeamMembersCount("Owners")).toBe("1 members");
        expect(await organizationPages.teams().getTeamMembersCount(scenarioState.team1!.name)).toBe(
          "0 members",
        );
        expect(
          await organizationPages.teams().hasAddTeamMemberLink(scenarioState.team1!.name),
        ).toBe(true);
        expect(await organizationPages.teams().getTeamMembersCount(scenarioState.team2!.name)).toBe(
          "0 members",
        );
        expect(
          await organizationPages.teams().hasAddTeamMemberLink(scenarioState.team2!.name),
        ).toBe(true);
      });

      await allure.step("Open Team 1 to add user 2", async () => {
        await organizationPages.orgFacade().navigateToSpecificTeam(scenarioState.team1!.name);
        expect(await organizationPages.navigation().isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await organizationPages.navigation().getTabCount(OrgTab.Teams)).toBe("3");
        expect(await organizationPages.specificTeam().isVisibleForOwner()).toBe(true);
        expect(
          await organizationPages.specificTeam().hasTeamNameDisplayed(scenarioState.team1!.name),
        ).toBe(true);
        expect(await organizationPages.specificTeam().hasPrivateVisibility()).toBe(true);
        expect(await organizationPages.specificTeam().getMembersCount()).toBe("0");
        expect(await organizationPages.specificTeam().getRepositoriesCount()).toBe("0");
        expect(await organizationPages.specificTeam().hasEmptyMembersMessage()).toBe(true);
      });

      await allure.step("Add user 2 to Team 1", async () => {
        const user2SearchQuery = invited.username.slice(0, 2);

        await organizationPages.specificTeam().searchUsers(user2SearchQuery);
        expect(await organizationPages.specificTeam().hasUserSearchResults()).toBe(true);
        expect(
          await organizationPages.specificTeam().hasOnlyMatchingUserSearchResults(user2SearchQuery),
        ).toBe(true);
        expect(await organizationPages.specificTeam().hasUserSearchResult(invited.username)).toBe(
          true,
        );
        await organizationPages.specificTeam().selectUser(invited.username);
        expect(await organizationPages.specificTeam().hasSelectedUser(invited.username)).toBe(true);
        await organizationPages.specificTeam().addSelectedUser();
        expect(await organizationPages.specificTeam().getMembersCount()).toBe("1");
        expect(await organizationPages.specificTeam().hasNoEmptyMembersMessage()).toBe(true);
        expect(await organizationPages.specificTeam().hasMember(invited.username)).toBe(true);
        expect(
          await organizationPages.specificTeam().hasRemoveTeamMemberButton(invited.username),
        ).toBe(true);
        expect(await organizationPages.navigation().getTabCount(OrgTab.Members)).toBe("2");
      });

      await allure.step("Return to Teams after adding user 2", async () => {
        await organizationPages.orgFacade().navigateToTeamsTab();
        expect(await organizationPages.navigation().isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await organizationPages.navigation().getTabCount(OrgTab.Teams)).toBe("3");
        expect(await organizationPages.teams().getTeamMembersCount("Owners")).toBe("1 members");
        expect(await organizationPages.teams().getTeamMembersCount(scenarioState.team1!.name)).toBe(
          "1 members",
        );
        expect(
          await organizationPages
            .teams()
            .hasTeamAvatar(scenarioState.team1!.name, invited.username),
        ).toBe(true);
        expect(
          await organizationPages.teams().doesNotHaveAddTeamMemberLink(scenarioState.team1!.name),
        ).toBe(true);
        expect(await organizationPages.teams().getTeamMembersCount(scenarioState.team2!.name)).toBe(
          "0 members",
        );
        expect(
          await organizationPages.teams().hasAddTeamMemberLink(scenarioState.team2!.name),
        ).toBe(true);
      });

      await allure.step("Owner removes user 2 from Team 1", async () => {
        await organizationPages.orgFacade().navigateToSpecificTeam(scenarioState.team1!.name);
        expect(await organizationPages.specificTeam().getMembersCount()).toBe("1");
        expect(await organizationPages.specificTeam().hasMember(invited.username)).toBe(true);
        expect(
          await organizationPages.specificTeam().hasRemoveTeamMemberButton(invited.username),
        ).toBe(true);
        await organizationPages.specificTeam().clickRemoveTeamMemberButton(invited.username);
        expect(await organizationPages.specificTeam().isRemoveTeamMemberModalDisplayed()).toBe(
          true,
        );
        expect(
          await organizationPages.specificTeam().hasExpectedRemoveTeamMemberModalElements(),
        ).toBe(true);
        await organizationPages.specificTeam().confirmRemoveTeamMember();
        expect(await organizationPages.specificTeam().isRemoveTeamMemberModalHidden()).toBe(true);
        expect(await organizationPages.specificTeam().getMembersCount()).toBe("0");
        expect(await organizationPages.specificTeam().hasEmptyMembersMessage()).toBe(true);
        expect(await organizationPages.navigation().getTabCount(OrgTab.Members)).toBe("1");
        expect(await organizationPages.navigation().getTabCount(OrgTab.Teams)).toBe("3");
      });

      await allure.step("Owner reviews persisted Teams state", async () => {
        await organizationPages.orgFacade().navigateToTeamsTab();
        expect(await organizationPages.navigation().getTabCount(OrgTab.Teams)).toBe("3");
        expect(await organizationPages.teams().getTeamMembersCount("Owners")).toBe("1 members");
        expect(await organizationPages.teams().getTeamMembersCount(scenarioState.team1!.name)).toBe(
          "0 members",
        );
        expect(
          await organizationPages.teams().hasAddTeamMemberLink(scenarioState.team1!.name),
        ).toBe(true);
        expect(await organizationPages.teams().getTeamMembersCount(scenarioState.team2!.name)).toBe(
          "0 members",
        );
        expect(
          await organizationPages.teams().hasAddTeamMemberLink(scenarioState.team2!.name),
        ).toBe(true);
      });

      await allure.step("Owner logs out", async () => {
        await sessionManager.logout();
      });
    },
    120_000,
  );
});
