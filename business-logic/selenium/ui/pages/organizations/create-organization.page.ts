import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "@gitea-automation/core-selenium/ui/base-pages/base.page";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";

type Visibility = "public" | "limited" | "private";

export class CreateOrganizationPage extends BasePage {
  private readonly locators = {
    formTitle: By.css('[role="main"] h3'),
    // Organization Name
    orgNameLabel: By.css('[for="org_name"]'),
    orgNameInput: By.id("org_name"),
    orgNameHelpText: By.css(".help"),
    // Visibility
    visibilityLabel: By.css('[for="visibility"]'),
    publicVisibilityRadio: By.id("_aria_label_input_1"),
    publicVisibilityRadioLabel: By.css('[for="_aria_label_input_1"]'),
    limitedVisibilityRadio: By.id("_aria_label_input_2"),
    limitedVisibilityRadioLabel: By.css('[for="_aria_label_input_2"]'),
    privateVisibilityRadio: By.id("_aria_label_input_3"),
    privateVisibilityRadioLabel: By.css('[for="_aria_label_input_3"]'),
    //Permissions
    permissionsLabel: By.css("#permission_box > label"),
    adminPermissionsCheckInput: By.css('[id="_aria_label_input_4"]'),
    adminPermissionsCheckLabel: By.css('[for="_aria_label_input_4"]'),
    // Create Organization Button
    createOrganizationButton: By.css("[role='main'] button"),
  };

  private readonly visibilityRadioLocators: Record<Visibility, By> = {
    public: this.locators.publicVisibilityRadio,
    limited: this.locators.limitedVisibilityRadio,
    private: this.locators.privateVisibilityRadio,
  };

  constructor(driver: WebDriver) {
    super(driver);
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
}
