import { describe, expect } from "vitest";
import { OrgTab } from "../src/ui/pages/organizations/fragments/org-navigation.fragment";
import { Organization } from "@gitea-automation/core/api/entities/organization.entity";
import { Team } from "@gitea-automation/core/api/entities/team.entity";
import { test } from "../src/fixtures/fixture";
import * as allure from "allure-js-commons";
import "dotenv/config";
import {
  resolveInvitedCredentials,
  resolveOwnerCredentials,
} from "../src/utils/session-credentials.util";
import { uniqueSuffix } from "@gitea-automation/core/utils/test-data.util";

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
  };
  const team2ToCreate: Team = {
    name: `test-team-2-${Date.now()}-${uniqueSuffix()}`,
    visibility: "private",
    createRepositories: true,
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
      organizationClient,
    }) => {
      await allure.step(
        "Owner: Clean up residual test organizations left over from previous runs",
        async () => {
          const { body: organizations } = await organizationClient.getUserOrganizations();
          const residualOrganizations = organizations.filter((organization) =>
            organization.name.startsWith("test-orgs-"),
          );
          for (const organization of residualOrganizations) {
            await organizationClient.deleteOrganization(organization.name);
          }
        },
      );

      await allure.step("Invited user: Login with user 2 credentials", async () => {
        await sessionManager.loginAsUser2();
        await mainPage.open();
        expect(await mainPage.hasExpectedElementsDisplayed()).toBe(true);
        expect(await navBarFragment.hasExpectedElementsDisplayed(invited.username)).toBe(true);
        await navBarFragment.clickOrganizationsDropdown();
        expect(await navBarFragment.getTotalOrganizations()).toHaveLength(1);
        expect(await navBarFragment.getTotalOrganizations()).toEqual([invited.username]);
      });

      await allure.step("Invited user: Logout user 2", async () => {
        await sessionManager.logout();
      });

      await allure.step("Owner: Login with user 1 credentials", async () => {
        await sessionManager.loginAsOwner();
        await mainPage.open();
        expect(await mainPage.hasExpectedElementsDisplayed()).toBe(true);
        expect(await navBarFragment.hasExpectedElementsDisplayed(owner.username)).toBe(true);
        expect(await navBarFragment.getCurrentOrganization()).toBe(owner.username);
        await navBarFragment.clickOrganizationsDropdown();
        expect(await navBarFragment.getTotalOrganizations()).toHaveLength(1);
        expect(await navBarFragment.getTotalOrganizations()).toEqual([owner.username]);
      });

      await allure.step("Owner: Creates new organization", async () => {
        await navBarFragment.clickNewOrganizationOption();
        expect(await createOrganizationPage.hasAllFormElements()).toBe(true);
        expect(await createOrganizationPage.hasDefaultFormState()).toBe(true);
        await createOrganizationPage.enterOrganizationName(organizationToCreate.name);
        await createOrganizationPage.selectVisibility(organizationToCreate.visibility);
        await createOrganizationPage.clickCreateOrganizationButton();
        scenarioState.organization = organizationToCreate;
        expect(
          await navBarFragment.hasExpectedElementsDisplayed(
            scenarioState.organization.name,
            "organization",
          ),
        ).toBe(true);
        expect(await navBarFragment.getViewOrganizationButtonText()).toContain(
          scenarioState.organization.name,
        );
        await navBarFragment.clickOrganizationsDropdown();
        expect(await navBarFragment.getTotalOrganizations()).toHaveLength(2);
        expect(await navBarFragment.getTotalOrganizations()).toEqual([
          owner.username,
          scenarioState.organization.name,
        ]);
        await navBarFragment.clickOrganizationsDropdown();
      });

      await allure.step("Navigate to created organization", async () => {
        await navBarFragment.clickViewOrganizationButton();
        expect(await organizationPages.navigation().hasExpectedElementsDisplayed(true)).toBe(true);
        expect(
          await organizationPages
            .navigation()
            .hasOrganizationNameDisplayed(scenarioState.organization!.name),
        ).toBe(true);
        expect(await organizationPages.navigation().isTabSelected(OrgTab.Repos)).toBe(true);
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Projects)).toBe(true);
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Packages)).toBe(true);
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Members)).toBe(true);
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Teams)).toBe(true);
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Worktime)).toBe(true);
        expect(await organizationPages.navigation().getTabCount(OrgTab.Members)).toBe("1");
        expect(await organizationPages.navigation().getTabCount(OrgTab.Teams)).toBe("1");
        expect(await organizationPages.repositories().hasExpectedElementsDisplayed(true)).toBe(
          true,
        );
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
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Repos)).toBe(true);
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Projects)).toBe(true);
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Packages)).toBe(true);
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Members)).toBe(true);
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Worktime)).toBe(true);
        expect(await organizationPages.teams().hasExpectedElementsDisplayed(true)).toBe(true);
        expect(await organizationPages.teams().getTeamContainersCount()).toBe(1);
        expect(await organizationPages.teams().hasTeamContainer("Owners")).toBe(true);
        expect(await organizationPages.teams().getTeamMembersCount("Owners")).toBe("1 members");
        expect(await organizationPages.teams().getTeamAvatarsCount("Owners")).toBe(1);
        expect(await organizationPages.teams().hasTeamAvatar("Owners", owner.username)).toBe(true);
      });

      await allure.step("Create private team 1", async () => {
        await organizationPages.orgFacade().navigateToNewTeam();
        expect(await organizationPages.navigation().isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Repos)).toBe(true);
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Projects)).toBe(true);
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Packages)).toBe(true);
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Members)).toBe(true);
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Worktime)).toBe(true);
        expect(await organizationPages.newTeam().hasExpectedElementsDisplayed()).toBe(true);
        expect(await organizationPages.newTeam().hasDefaultFormState()).toBe(true);
        await organizationPages.newTeam().enterTeamName(team1ToCreate.name);
        await organizationPages.newTeam().selectVisibility(team1ToCreate.visibility);
        await organizationPages.newTeam().enableCreateRepositories();
        scenarioState.team1 = team1ToCreate;
        await organizationPages.orgFacade().createTeam(scenarioState.team1.name);
        expect(await organizationPages.navigation().isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Repos)).toBe(true);
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Projects)).toBe(true);
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Packages)).toBe(true);
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Members)).toBe(true);
        expect(await organizationPages.navigation().isTabNotSelected(OrgTab.Worktime)).toBe(true);
        expect(await organizationPages.navigation().getTabCount(OrgTab.Teams)).toBe("2");
        expect(await organizationPages.specificTeam().hasExpectedElementsDisplayed(true)).toBe(
          true,
        );
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
        expect(await organizationPages.teams().getTeamAvatarsCount(scenarioState.team1!.name)).toBe(
          0,
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
        expect(await organizationPages.specificTeam().hasExpectedElementsDisplayed(true)).toBe(
          true,
        );
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
        expect(await organizationPages.teams().hasTeamContainer("Owners")).toBe(true);
        expect(await organizationPages.teams().hasTeamContainer(scenarioState.team1!.name)).toBe(
          true,
        );
        expect(await organizationPages.teams().hasTeamContainer(scenarioState.team2!.name)).toBe(
          true,
        );
        expect(await organizationPages.teams().getTeamMembersCount("Owners")).toBe("1 members");
        expect(await organizationPages.teams().getTeamAvatarsCount("Owners")).toBe(1);
        expect(await organizationPages.teams().hasTeamAvatar("Owners", owner.username)).toBe(true);
        expect(await organizationPages.teams().getTeamMembersCount(scenarioState.team1!.name)).toBe(
          "0 members",
        );
        expect(await organizationPages.teams().getTeamAvatarsCount(scenarioState.team1!.name)).toBe(
          0,
        );
        expect(
          await organizationPages.teams().hasAddTeamMemberLink(scenarioState.team1!.name),
        ).toBe(true);
        expect(await organizationPages.teams().getTeamMembersCount(scenarioState.team2!.name)).toBe(
          "0 members",
        );
        expect(await organizationPages.teams().getTeamAvatarsCount(scenarioState.team2!.name)).toBe(
          0,
        );
        expect(
          await organizationPages.teams().hasAddTeamMemberLink(scenarioState.team2!.name),
        ).toBe(true);
      });

      await allure.step("Open Team 1 to add user 2", async () => {
        await organizationPages.orgFacade().navigateToSpecificTeam(scenarioState.team1!.name);
        expect(await organizationPages.navigation().isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await organizationPages.navigation().getTabCount(OrgTab.Teams)).toBe("3");
        expect(await organizationPages.specificTeam().hasExpectedElementsDisplayed(true)).toBe(
          true,
        );
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
        expect(await organizationPages.specificTeam().hasRemoveTeamMemberButton()).toBe(true);
        expect(await organizationPages.navigation().getTabCount(OrgTab.Members)).toBe("2");
      });

      await allure.step("Return to Teams after adding user 2", async () => {
        await organizationPages.orgFacade().navigateToTeamsTab();
        expect(await organizationPages.navigation().isTabSelected(OrgTab.Teams)).toBe(true);
        expect(await organizationPages.navigation().getTabCount(OrgTab.Teams)).toBe("3");
        expect(await organizationPages.teams().getTeamMembersCount("Owners")).toBe("1 members");
        expect(await organizationPages.teams().getTeamAvatarsCount("Owners")).toBe(1);
        expect(await organizationPages.teams().hasTeamAvatar("Owners", owner.username)).toBe(true);
        expect(await organizationPages.teams().getTeamMembersCount(scenarioState.team1!.name)).toBe(
          "1 members",
        );
        expect(await organizationPages.teams().getTeamAvatarsCount(scenarioState.team1!.name)).toBe(
          1,
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
        expect(await organizationPages.teams().getTeamAvatarsCount(scenarioState.team2!.name)).toBe(
          0,
        );
        expect(
          await organizationPages.teams().hasAddTeamMemberLink(scenarioState.team2!.name),
        ).toBe(true);
      });

      await allure.step("Owner removes user 2 from Team 1", async () => {
        await organizationPages.orgFacade().navigateToSpecificTeam(scenarioState.team1!.name);
        expect(await organizationPages.specificTeam().getMembersCount()).toBe("1");
        expect(await organizationPages.specificTeam().hasMember(invited.username)).toBe(true);
        expect(await organizationPages.specificTeam().hasRemoveTeamMemberButton()).toBe(true);
        await organizationPages.specificTeam().clickRemoveTeamMemberButton();
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
        expect(await organizationPages.teams().getTeamAvatarsCount("Owners")).toBe(1);
        expect(await organizationPages.teams().getTeamMembersCount(scenarioState.team1!.name)).toBe(
          "0 members",
        );
        expect(await organizationPages.teams().getTeamAvatarsCount(scenarioState.team1!.name)).toBe(
          0,
        );
        expect(
          await organizationPages.teams().hasAddTeamMemberLink(scenarioState.team1!.name),
        ).toBe(true);
        expect(await organizationPages.teams().getTeamMembersCount(scenarioState.team2!.name)).toBe(
          "0 members",
        );
        expect(await organizationPages.teams().getTeamAvatarsCount(scenarioState.team2!.name)).toBe(
          0,
        );
        expect(
          await organizationPages.teams().hasAddTeamMemberLink(scenarioState.team2!.name),
        ).toBe(true);
      });

      await allure.step("Owner logs out", async () => {
        await sessionManager.logout();
      });

      await allure.step("User 2 logs in", async () => {
        await sessionManager.loginAsUser2();
      });

      await allure.step("User 2 reviews organization access", async () => {
        await mainPage.open();
        expect(await mainPage.hasExpectedElementsDisplayed()).toBe(true);
        expect(await navBarFragment.hasExpectedElementsDisplayed(invited.username)).toBe(true);
        await navBarFragment.clickOrganizationsDropdown();
        expect(await navBarFragment.getTotalOrganizations()).toHaveLength(1);
        expect(await navBarFragment.getTotalOrganizations()).toEqual([invited.username]);
        await navBarFragment.clickOrganizationsDropdown();
      });
    },
    120_000,
  );
});
