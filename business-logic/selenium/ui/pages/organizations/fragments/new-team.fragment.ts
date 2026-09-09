import { By } from "selenium-webdriver";
import { BaseComponent } from "@gitea-automation/core-selenium/ui/base-pages/base-component";
import { TeamVisibility } from "../../../../api/entities/team.entity";

export class NewTeamFragment extends BaseComponent {
  private readonly locators = {
    // Main form displayed when creating an organization team.
    newTeamForm: By.css("form[action$='/teams/new']"),
    // Team name and description inputs.
    teamNameInput: By.css("input[name='team_name']"),
    descriptionInput: By.css("input[name='description']"),
    // Visibility and repository access options use stable form names and values.
    publicVisibilityRadio: By.css("input[name='visibility'][value='public']"),
    privateVisibilityRadio: By.css("input[name='visibility'][value='private']"),
    specificRepositoryAccessRadio: By.css("input[name='repo_access'][value='specific']"),
    createRepositoriesCheckbox: By.css("input[name='can_create_org_repo']"),
    generalPermissionsRadio: By.css("input[name='permission'][value='read']"),
    // Form submit button.
    createTeamButton: By.css("form[action$='/teams/new'] button.ui.primary.button"),
  };

  private readonly visibilityLocators: Record<TeamVisibility, By> = {
    public: this.locators.publicVisibilityRadio,
    private: this.locators.privateVisibilityRadio,
  };

  async waitUntilDisplayed(): Promise<void> {
    await this.findElement(this.locators.newTeamForm);
  }

  async hasExpectedElementsDisplayed(): Promise<boolean> {
    const elements = await Promise.all([
      this.exists(this.locators.newTeamForm),
      this.exists(this.locators.teamNameInput),
      this.exists(this.locators.descriptionInput),
      this.exists(this.locators.publicVisibilityRadio),
      this.exists(this.locators.privateVisibilityRadio),
      this.exists(this.locators.specificRepositoryAccessRadio),
      this.exists(this.locators.createRepositoriesCheckbox),
      this.exists(this.locators.generalPermissionsRadio),
      this.exists(this.locators.createTeamButton),
    ]);
    return elements.every(Boolean);
  }

  async hasDefaultFormState(): Promise<boolean> {
    const conditions = await Promise.all([
      this.isInputEmpty(this.locators.teamNameInput),
      this.isInputEmpty(this.locators.descriptionInput),
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

  async enableCreateRepositories(): Promise<void> {
    const checkbox = await this.findElement(this.locators.createRepositoriesCheckbox);
    if (!(await checkbox.isSelected())) {
      await checkbox.click();
    }
  }

  async clickCreateTeamButton(): Promise<void> {
    await this.click(this.locators.createTeamButton);
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
}
