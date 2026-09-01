import { WebDriver, By } from "selenium-webdriver";
import { BasePage } from "../../core/base-pages/base.page";
import { MainPage } from "./main.page";

export class LoginPage extends BasePage {
  private readonly locators = {
    usernameInput: By.id("user_name"),
    passwordInput: By.id("password"),
    loginButton: By.css(
      "body > div > div > div > div > div:nth-child(1) > div > form > div:nth-child(4) > button",
    ),
  };

  get baseUrl(): string {
    return "https://git.estiberz.online/user/login";
  }

  constructor(driver: WebDriver) {
    super(driver);
  }

  async login(username: string, password: string): Promise<MainPage> {
    await this.type(this.locators.usernameInput, username);
    await this.type(this.locators.passwordInput, password);
    await this.click(this.locators.loginButton);

    return new MainPage(this.driver);
  }
}
