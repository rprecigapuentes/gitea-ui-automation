import { WebDriver, By } from "selenium-webdriver";
import { BasePage } from "./base.page";
import { MainPage } from "./main.page";

export class LoginPage extends BasePage {
  private readonly locators = {
    usernameInput: By.id("user_name"),
    passwordInput: By.id("password"),
    loginButton: By.xpath("/html/body/div/div/div/div/div[1]/div/form/div[4]/button"), //just to test xpath locator
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
