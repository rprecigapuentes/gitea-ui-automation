import { By, WebDriver } from "selenium-webdriver";
import { BaseComponent } from "@gitea-automation/core-selenium/ui/base-pages/base-component";
import { labelIdFromHref } from "./label-chip.fragment";

const INSTANT = 0;
const SELECTION_TIMEOUT_MS = 10000;

export class SidebarComboFragment extends BaseComponent {
  private readonly locators: {
    trigger: By;
    menu: By;
    menuItem: (value: number) => By;
    selectedItems: By;
  };

  private constructor(
    driver: WebDriver,
    private readonly root: string,
  ) {
    super(driver);
    this.locators = {
      trigger: By.css(`${root} .ui.dropdown a.fixed-text`),
      // The dropdown holds a scrolling menu inside its own menu, so only the outer one is "the menu".
      menu: By.css(`${root} .ui.dropdown > .menu`),
      menuItem: (value: number) => By.css(`${root} .menu a.item[data-value="${value}"]`),
      selectedItems: By.css(`${root} .ui.list .item:not(.empty-list)`),
    };
  }

  static onIssue(driver: WebDriver, updateUrlFragment: string): SidebarComboFragment {
    return new SidebarComboFragment(
      driver,
      `.issue-sidebar-combo[data-update-url*="${updateUrlFragment}"]`,
    );
  }

  static byField(driver: WebDriver, fieldName: string): SidebarComboFragment {
    return new SidebarComboFragment(
      driver,
      `.issue-sidebar-combo:has(> input.combo-value[name="${fieldName}"])`,
    );
  }

  /**
   * The options are only on screen while the menu is open, so an option that is genuinely not
   * offered and one whose menu is shut look the same until the menu has been opened.
   */
  async offers(value: number): Promise<boolean> {
    await this.openMenu();

    return this.isVisible(this.locators.menuItem(value), this.driver, INSTANT);
  }

  private async openMenu(): Promise<void> {
    if (await this.isVisible(this.locators.menu, this.driver, INSTANT)) return;

    await this.clickAndWaitFor(this.locators.trigger, [this.locators.menu]);
  }

  async toggle(value: number): Promise<void> {
    await this.click(this.locators.trigger);
    await this.click(this.locators.menuItem(value));
    await this.click(this.locators.trigger);
  }

  /**
   * Closing the menu is what sends the choice to the server, so the list of what is selected is
   * the only thing that says the choice was actually saved rather than only clicked.
   */
  async toggleAndWaitForSelection(value: number): Promise<void> {
    await this.actAndWaitUntil(
      () => this.toggle(value),
      async () => (await this.getSelectedTexts()).length > 0,
      SELECTION_TIMEOUT_MS,
    );
  }

  async select(value: number): Promise<void> {
    await this.click(this.locators.trigger);
    await this.click(this.locators.menuItem(value));
  }

  async getSelectedTexts(): Promise<string[]> {
    try {
      const items = await this.driver.findElements(this.locators.selectedItems);

      return await Promise.all(items.map((item) => item.getText()));
    } catch {
      return [];
    }
  }

  async getSelectedIds(): Promise<number[]> {
    try {
      const links = await this.driver.findElements(this.locators.selectedItems);
      const hrefs = await Promise.all(links.map((link) => link.getAttribute("href")));

      return hrefs.map(labelIdFromHref).filter((id): id is number => id !== null);
    } catch {
      return [];
    }
  }
}
