import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "./base.page";

export class MainPage extends BasePage {
  private readonly locators = {
    navbarLogo: By.id("navbar-logo"),
  };

  constructor(driver: WebDriver) {
    super(driver);
  }

  async isNavbarLogoVisible(): Promise<boolean> {
    return (await this.find(this.locators.navbarLogo)).isDisplayed();
  }
}