import { By } from "selenium-webdriver";
import { BaseComponent } from "@gitea-automation/core-selenium/ui/base-pages/base-component";
import { TeamVisibility } from "@gitea-automation/business-logic-selenium/api/entities/team.entity";

export class NewTeamFragment extends BaseComponent {
  private readonly locators = {
    // Main form displayed when creating an organization team.
    newTeamForm: By.css("form[action$='/teams/new']"),
    // Team name and description inputs.
    teamNameInput: By.css("input[name='team_name']"),
    // Visibility and repository access options use stable form names and values.
    publicVisibilityRadio: By.css("input[name='visibility'][value='public']"),
    privateVisibilityRadio: By.css("input[name='visibility'][value='private']"),
    specificRepositoryAccessRadio: By.css("input[name='repo_access'][value='specific']"),
    createRepositoriesCheckbox: By.css("input[name='can_create_org_repo']"),
    generalPermissionsRadio: By.css("input[name='permission'][value='read']"),
    // Form submit button.
    createTeamButton: By.css("form[action$='/teams/new'] button.ui.primary.button"),
    // The edit-team page reuses this same form, scoped to "/edit" instead.
    updateTeamButton: By.css("form[action$='/edit'] .ui.primary.button"),
  };

  private readonly visibilityLocators: Record<TeamVisibility, By> = {
    public: this.locators.publicVisibilityRadio,
    private: this.locators.privateVisibilityRadio,
  };

  private readonly repoCodeAccessLocators: Record<"none" | "read" | "write", By> = {
    none: By.css("[name='unit_1'][value='0']"),
    read: By.css("[name='unit_1'][value='1']"),
    write: By.css("[name='unit_1'][value='2']"),
  };

  async waitUntilDisplayed(): Promise<void> {
    await this.findElement(this.locators.newTeamForm);
  }

  async waitForElements(): Promise<boolean> {
    return this.isVisible([
      this.locators.newTeamForm,
      this.locators.teamNameInput,
      this.locators.createTeamButton,
    ]);
  }

  async waitForEditElements(): Promise<boolean> {
    return this.isVisible([this.locators.teamNameInput, this.locators.updateTeamButton]);
  }

  async hasDefaultFormState(): Promise<boolean> {
    const conditions = await Promise.all([
      this.isInputEmpty(this.locators.teamNameInput),
      this.isRadioSelected(this.locators.publicVisibilityRadio),
      this.isRadioSelected(this.locators.specificRepositoryAccessRadio),
      this.isCheckboxChecked(this.locators.createRepositoriesCheckbox).then(
        (isChecked) => !isChecked,
      ),
      this.isRadioSelected(this.locators.generalPermissionsRadio),
    ]);
    return conditions.every(Boolean);
  }

  async enterTeamName(teamName: string): Promise<void> {
    await this.type(this.locators.teamNameInput, teamName);
  }

  async selectVisibility(visibility: TeamVisibility): Promise<void> {
    await this.click(this.visibilityLocators[visibility]);
  }

  async selectRepoCodeAccess(repoCodeAccess: "none" | "read" | "write"): Promise<void> {
    await this.click(this.repoCodeAccessLocators[repoCodeAccess]);
  }

  async enableCreateRepositories(): Promise<void> {
    const checkbox = await this.findElement(this.locators.createRepositoriesCheckbox);
    if (!(await checkbox.isSelected())) {
      await checkbox.click();
    }
  }

  async clickCreateTeamButton(): Promise<void> {
    await this.click(this.locators.createTeamButton);
  }

  async clickUpdateTeamButton(): Promise<void> {
    await this.click(this.locators.updateTeamButton);
  }

  private async isInputEmpty(locator: By): Promise<boolean> {
    const input = await this.findElement(locator);
    return (await input.getAttribute("value")) === "";
  }

  private async isRadioSelected(locator: By): Promise<boolean> {
    return (await this.findElement(locator)).isSelected();
  }

  private async isCheckboxChecked(locator: By): Promise<boolean> {
    return (await this.findElement(locator)).isSelected();
  }

  async createTeam(
    teamName: string,
    visibility: TeamVisibility,
    repoCodeAccess: "none" | "read" | "write",
    createRepositories: boolean,
  ): Promise<void> {
    await this.enterTeamName(teamName);
    await this.selectVisibility(visibility);
    await this.selectRepoCodeAccess(repoCodeAccess);
    if (createRepositories) {
      await this.enableCreateRepositories();
    }
    await this.clickCreateTeamButton();
  }
}
