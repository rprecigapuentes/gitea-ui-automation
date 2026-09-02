import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "../../core/base-pages/base.page";
import { baseUrl } from "../../core/config/config";

export class OrganizationPage extends BasePage {
  private readonly locators = {
    formTitle: By.css("body > div > div > div > h3"),
    organizationNameInput: By.id("org_name"),
    publicVisibilityRadio: By.id("_aria_label_input_1"),
    limitedVisibilityRadio: By.id("_aria_label_input_2"),
    privateVisibilityRadio: By.id("_aria_label_input_3"),
    createOrganizationButton: By.css(
      "body > div > div > div > div > form > div:nth-child(4) > button",
    ),
  };

  override getUrl(organizationName: string): string {
    return `${baseUrl}/org/${organizationName}/dashboard`;
  }

  constructor(driver: WebDriver) {
    super(driver);
  }
}
