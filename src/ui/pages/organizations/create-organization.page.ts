import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "../../../../core/ui/base-pages/base.page";
import { baseUrl } from "../../../../core/config/config";

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

  async enterOrganizationName(name: string): Promise<void> {
    await this.type(this.locators.orgNameInput, name);
  }

  async selectVisibility(option: Visibility): Promise<void> {
    await this.click(this.visibilityRadioLocators[option]);
  }

  async clickCreateOrganizationButton(): Promise<void> {
    await this.click(this.locators.createOrganizationButton);
  }

  async hasAllFormElements(): Promise<boolean> {
    const results = await Promise.all([
      this.exists(this.locators.formTitle),
      this.exists(this.locators.orgNameLabel),
      this.exists(this.locators.orgNameInput),
      this.exists(this.locators.orgNameHelpText),
      this.exists(this.locators.visibilityLabel),
      this.exists(this.locators.publicVisibilityRadio),
      this.exists(this.locators.publicVisibilityRadioLabel),
      this.exists(this.locators.limitedVisibilityRadio),
      this.exists(this.locators.limitedVisibilityRadioLabel),
      this.exists(this.locators.privateVisibilityRadio),
      this.exists(this.locators.privateVisibilityRadioLabel),
      this.exists(this.locators.permissionsLabel),
      this.exists(this.locators.adminPermissionsCheckInput),
      this.exists(this.locators.adminPermissionsCheckLabel),
      this.exists(this.locators.createOrganizationButton),
    ]);

    return results.every(Boolean);
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
