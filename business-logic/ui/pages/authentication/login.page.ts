import { WebDriver, By } from "selenium-webdriver";
import { BasePage } from "@gitea-automation/core/ui/base-pages/base.page";
import { baseUrl } from "@gitea-automation/core/config/gitea.config";

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

  async login(username: string, password: string): Promise<void> {
    await this.type(this.locators.usernameInput, username);
    await this.type(this.locators.passwordInput, password);
    await this.click(this.locators.loginButton);
  }
}
