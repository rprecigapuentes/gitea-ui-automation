import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "../../core/base-pages/base.page";

export class ViewOrganizationPage extends BasePage {
  private readonly locators = {
    viewOrganizationButton: By.css(
      "body > div > div > div.secondary-nav.tw-border-b.tw-border-b-secondary > div > div.right.menu.tw-flex-wrap.tw-justify-end > div > a",
    ),
  };

  override getUrl(organizationName: string): string {
    return `${organizationName}`;
  }

  constructor(driver: WebDriver) {
    super(driver);
  }
}
