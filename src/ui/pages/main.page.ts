import { By, WebDriver } from "selenium-webdriver";
import { BasePage } from "../../../core/ui/base-pages/base.page";
import { baseUrl } from "../../../core/config/config";

export class MainPage extends BasePage {
  private readonly locators = {
    loggedInUsername: By.css(".text span.gt-ellipsis"),
    addNewElementDropdown: By.css("[aria-label='Create…']"),
    addNewElementMenu: By.css("[id='_aria_dropdown_menu_1']"),
    addNewElementMenuItems: By.css("[class='item']"),
    newOrganization: By.id("_aria_dropdown_item_4"),
  };

  override getUrl(): string {
    return `${baseUrl}/`;
  }

  constructor(driver: WebDriver) {
    super(driver);
  }

  async getLoggedInUsername(): Promise<string> {
    return (await this.findElement(this.locators.loggedInUsername)).getText();
  }

  async navigateToCreateOrganization(): Promise<void> {
    await this.click(this.locators.addNewElementDropdown);
    await this.click(this.locators.newOrganization);
  }

  async clickAddNewElementDropdown(): Promise<void> {
    await this.click(this.locators.addNewElementDropdown);
  }

  async clickNewOrganizationItem(): Promise<void> {
    await this.click(this.locators.newOrganization);
  }

  //Find elements methods
  async isAddNewElementMenuVisible(): Promise<boolean> {
    const element = await this.findElement(this.locators.addNewElementMenu);
    const classes = ((await element.getAttribute("class")) ?? "").split(/\s+/);
    const isVisible = classes.includes("visible");
    return isVisible;
  }

  /*async AreAddNewElementMenuItemsVisible(): Promise<boolean> {
    const menu = await this.find(this.locators.addNewElementMenu);
    const menuItems = await menu.findElements(this.locators.addNewElementMenuItems);
    for (const element of menuItems) {
      const classes = (await element.getAttribute("class") ?? "").split(/\s+/);
      if (!classes.includes("visible")) {
        return false;
      }
    }
    return true;
  }*/
}
