import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "../../../../core/ui/base-pages/base.page";
import { baseUrl } from "../../../../core/config/config";

export class CreateOrganizationPage extends BasePage {
  private readonly locators = {
    formTitle: By.css('[role="main"] h3'),
    organizationNameInput: By.id("org_name"),
    publicVisibilityRadio: By.id("_aria_label_input_1"),
    limitedVisibilityRadio: By.id("_aria_label_input_2"),
    privateVisibilityRadio: By.id("_aria_label_input_3"),
    createOrganizationButton: By.css("[role='main'] button"),
  };

  override getUrl(): string {
    return `${baseUrl}/org/create`;
  }

  constructor(driver: WebDriver) {
    super(driver);
  }

  async enterOrganizationName(name: string): Promise<void> {
    await this.type(this.locators.organizationNameInput, name);
  }

  async selectVisibility(option: "public" | "limited" | "private"): Promise<void> {
    let radio;
    switch (option) {
      case "public":
        radio = await this.find(this.locators.publicVisibilityRadio);
        break;
      case "limited":
        radio = await this.find(this.locators.limitedVisibilityRadio);
        break;
      case "private":
        radio = await this.find(this.locators.privateVisibilityRadio);
        break;
    }
    await radio.click();
  }

  async clickCreateOrganizationButton(): Promise<void> {
    await this.click(this.locators.createOrganizationButton);
  }
}
