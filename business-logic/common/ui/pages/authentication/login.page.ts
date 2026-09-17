import { WebDriver, By } from "selenium-webdriver";
import { BasePage } from "@gitea-automation/core-selenium/ui/base-pages/base.page";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";

export class LoginPage extends BasePage {
  private readonly locators = {
    usernameInput: By.id("user_name"),
    passwordInput: By.id("password"),
    loginButton: By.css("form button"),
  };

  override getUrl(): string {
    return `${baseUrl}/user/login`;
  }

  constructor(driver: WebDriver) {
    super(driver);
  }

  // A rejected login re-renders /user/login, so waiting for anything but the destination would
  // let a failed sign-in pass as a slow one.
  private readonly signedIn = /^https?:\/\/[^/]+\/(\?.*)?$/;

  async login(username: string, password: string): Promise<void> {
    await this.type(this.locators.usernameInput, username);
    await this.type(this.locators.passwordInput, password);
    await this.clickAndWaitForUrl(this.locators.loginButton, this.signedIn);
  }
}
