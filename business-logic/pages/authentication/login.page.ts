import { BasePage } from "@gitea-automation/core-page-objects/base.page";
import { IInteractionStrategy } from "@gitea-automation/core-page-objects/interaction-strategy.interface";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";

export class LoginPage extends BasePage {
  private readonly locators = {
    usernameInput: "#user_name",
    passwordInput: "#password",
    loginButton: "form button",
  };

  override getUrl(): string {
    return `${baseUrl}/user/login`;
  }

  constructor(strategy: IInteractionStrategy) {
    super(strategy);
  }

  // A rejected login re-renders /user/login, so waiting for anything but the destination would
  // let a failed sign-in pass as a slow one.
  private readonly signedIn = /^https?:\/\/[^/]+\/(\?.*)?$/;

  override async open(): Promise<void> {
    await super.open([this.locators.usernameInput]);
  }

  async hasExpectedFormElements(): Promise<boolean> {
    return this.isVisible([
      this.locators.usernameInput,
      this.locators.passwordInput,
      this.locators.loginButton,
    ]);
  }

  async login(username: string, password: string): Promise<void> {
    await this.type(this.locators.usernameInput, username);
    await this.type(this.locators.passwordInput, password);
    await this.clickAndWaitForUrl(this.locators.loginButton, this.signedIn);
  }
}
