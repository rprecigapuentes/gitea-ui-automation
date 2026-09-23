import { BasePage } from "@gitea-automation/core-page-objects/base.page";
import { IInteractionStrategy } from "@gitea-automation/core-page-objects/interaction-strategy.interface";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";

type Visibility = "public" | "limited" | "private";

export class CreateOrganizationPage extends BasePage {
  private readonly locators = {
    // form container
    formContainer: ".ui.container.medium-width",
    // title
    formTitle: '[role="main"] h3',
    // Organization Name
    orgNameLabel: '[for="org_name"]',
    orgNameInput: "#org_name",
    orgNameHelpText: ".help",
    errorMessage: ".tw-text-center",
    // Visibility
    visibilityLabel: '[for="visibility"]',
    publicVisibilityRadio: "#_aria_label_input_1",
    publicVisibilityRadioLabel: '[for="_aria_label_input_1"]',
    limitedVisibilityRadio: "#_aria_label_input_2",
    limitedVisibilityRadioLabel: '[for="_aria_label_input_2"]',
    privateVisibilityRadio: "#_aria_label_input_3",
    privateVisibilityRadioLabel: '[for="_aria_label_input_3"]',
    //Permissions
    permissionsLabel: "#permission_box > label",
    adminPermissionsCheckInput: "#_aria_label_input_4",
    adminPermissionsCheckLabel: '[for="_aria_label_input_4"]',
    // Create Organization Button
    createOrganizationButton: "[role='main'] button",
  };

  private readonly visibilityRadioLocators: Record<Visibility, string> = {
    public: this.locators.publicVisibilityRadio,
    limited: this.locators.limitedVisibilityRadio,
    private: this.locators.privateVisibilityRadio,
  };

  constructor(strategy: IInteractionStrategy) {
    super(strategy);
  }

  getUrl(): string {
    return `${baseUrl}/org/create`;
  }

  async open(): Promise<void> {
    await super.open([this.locators.formTitle]);
  }

  async enterOrganizationName(name: string): Promise<void> {
    await this.type(this.locators.orgNameInput, name);
  }

  async selectVisibility(option: Visibility): Promise<void> {
    await this.click(this.visibilityRadioLocators[option]);
  }

  async clickCreateOrganizationButton(): Promise<void> {
    await this.click(this.locators.createOrganizationButton);
  }

  async hasExpectedFormElements(): Promise<boolean> {
    return this.isVisible([
      this.locators.formTitle,
      this.locators.orgNameLabel,
      this.locators.orgNameInput,
      this.locators.orgNameHelpText,
      this.locators.visibilityLabel,
      this.locators.publicVisibilityRadio,
      this.locators.publicVisibilityRadioLabel,
      this.locators.limitedVisibilityRadio,
      this.locators.limitedVisibilityRadioLabel,
      this.locators.privateVisibilityRadio,
      this.locators.privateVisibilityRadioLabel,
      this.locators.permissionsLabel,
      this.locators.adminPermissionsCheckInput,
      this.locators.adminPermissionsCheckLabel,
      this.locators.createOrganizationButton,
    ]);
  }

  async getFormTitleText(): Promise<string> {
    return this.getText(this.locators.formTitle);
  }

  async getOrgNameLabelText(): Promise<string> {
    return this.getText(this.locators.orgNameLabel);
  }

  async getOrgNameHelpText(): Promise<string> {
    return this.getText(this.locators.orgNameHelpText);
  }

  async getVisibilityLabelText(): Promise<string> {
    return this.getText(this.locators.visibilityLabel);
  }

  async getPublicVisibilityLabelText(): Promise<string> {
    return this.getText(this.locators.publicVisibilityRadioLabel);
  }

  async getLimitedVisibilityLabelText(): Promise<string> {
    return this.getText(this.locators.limitedVisibilityRadioLabel);
  }

  async getPrivateVisibilityLabelText(): Promise<string> {
    return this.getText(this.locators.privateVisibilityRadioLabel);
  }

  async getPermissionsLabelText(): Promise<string> {
    return this.getText(this.locators.permissionsLabel);
  }

  async getAdminPermissionsLabelText(): Promise<string> {
    return this.getText(this.locators.adminPermissionsCheckLabel);
  }

  async getCreateOrganizationButtonText(): Promise<string> {
    return this.getText(this.locators.createOrganizationButton);
  }

  async isOrganizationNameEmpty(): Promise<boolean> {
    const input = await this.findElement(this.locators.orgNameInput);
    return (await input.getAttribute("value")) === "";
  }

  async isRadioSelected(option: Visibility): Promise<boolean> {
    const radio = await this.findElement(this.visibilityRadioLocators[option]);
    return radio.isSelected();
  }

  async isAdminPermissionsChecked(): Promise<boolean> {
    const checkbox = await this.findElement(this.locators.adminPermissionsCheckInput);
    return checkbox.isSelected();
  }

  async hasDefaultFormState(): Promise<boolean> {
    const conditions = await Promise.all([
      this.isOrganizationNameEmpty(),
      this.isRadioSelected("public"),
      this.isAdminPermissionsChecked(),
    ]);
    return conditions.every(Boolean);
  }

  async waitForElements(): Promise<void> {
    await this.isVisible(this.locators.formContainer);
  }

  async setPermissions(permissions: boolean): Promise<void> {
    const isChecked = await this.isAdminPermissionsChecked();
    if (permissions !== isChecked) {
      await this.click(this.locators.adminPermissionsCheckInput);
    }
  }

  async createOrganization(
    name: string,
    visibility: Visibility,
    permissions: boolean,
  ): Promise<void> {
    await this.enterOrganizationName(name);
    await this.selectVisibility(visibility);
    await this.setPermissions(permissions);
    await this.clickCreateOrganizationButton();
  }

  getVolatileRegions(): string[] {
    return [this.locators.errorMessage, this.locators.orgNameInput];
  }
}
