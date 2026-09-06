import { By, Key, WebDriver } from "selenium-webdriver";
import { BaseComponent } from "../../../../../core/ui/base-pages/base-component";
import { labelIdFromHref } from "./label-chip.fragment";

const WAIT_TIMEOUT_MS = 10000;
const CLICK_TIMEOUT_MS = 3000;
const OPEN_TIMEOUT_MS = 4000;
const OPEN_ATTEMPTS = 3;

/**
 * Gitea renders the same combo widget for labels, the milestone, the assignees and the projects.
 * The four differ by the name of their hidden `combo-value` input, and on an existing issue they
 * also differ by `data-update-url`. The creation form has no issue yet, so it renders no update
 * URL at all: `byField` is the scoping that works on both pages, `onIssue` the one that reads as
 * the endpoint the widget writes to.
 */
export class SidebarComboFragment extends BaseComponent {
  private readonly locators: {
    trigger: By;
    dropdown: By;
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
      trigger: By.css(`${root} > .ui.dropdown > a.fixed-text`),
      dropdown: By.css(`${root} > .ui.dropdown`),
      menu: By.css(`${root} > .ui.dropdown > .menu`),
      menuItem: (value: number) =>
        By.css(`${root} > .ui.dropdown .menu a.item[data-value="${value}"]`),
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

  private async isOpen(): Promise<boolean> {
    const [menu] = await this.driver.findElements(this.locators.menu);

    if (!menu) return false;

    try {
      return await menu.isDisplayed();
    } catch {
      return false;
    }
  }

  /**
   * Fomantic opens and closes the menu through a transition, and applying a selection re-renders
   * the list under the trigger, which moves every combo below it. A click computed just before
   * that reflow lands beside the trigger and is lost, so opening is retried. Each attempt gives
   * the menu its own window to appear before another click is sent, because the trigger toggles:
   * re-clicking it while the menu is still on its way in closes it again. Closing is not retried
   * at all, since there the open menu covers the trigger and would intercept the second click.
   */
  private async open(): Promise<void> {
    for (let attempt = 0; attempt < OPEN_ATTEMPTS; attempt++) {
      if (await this.isOpen()) return;

      try {
        await this.click(this.locators.trigger, this.driver, CLICK_TIMEOUT_MS);
        await this.driver.wait(async () => this.isOpen(), OPEN_TIMEOUT_MS);

        return;
      } catch {
        continue;
      }
    }

    throw new Error(`the combo "${this.root}" never opened`);
  }

  /**
   * The menu is dismissed with Escape rather than by clicking the trigger again. An open menu is
   * laid out over its own trigger, so the second click is either intercepted by the menu or, worse,
   * swallowed and left covering the combo below, which then cannot be opened at all. Escape is a
   * dismissal the widget handles itself, and it runs the same `onHide` the apply depends on.
   */
  private async close(): Promise<void> {
    if (!(await this.isOpen())) return;

    const dropdown = await this.findElement(this.locators.dropdown);
    await dropdown.sendKeys(Key.ESCAPE);
    await this.waitUntilClosed();
  }

  private async waitUntilClosed(): Promise<void> {
    await this.driver.wait(
      async () => !(await this.isOpen()),
      WAIT_TIMEOUT_MS,
      `the combo "${this.root}" never closed`,
    );
  }

  /**
   * A combo in `multiple` selection mode defers its apply to `onHide`, so closing the menu is part
   * of the action rather than cleanup after it.
   */
  async toggle(value: number): Promise<void> {
    await this.open();
    await this.click(this.locators.menuItem(value));
    await this.close();
  }

  /**
   * A combo in `single` selection mode applies on click and hides itself, so clicking the trigger
   * again would reopen the menu and leave it covering the sidebar.
   */
  async select(value: number): Promise<void> {
    await this.open();
    await this.click(this.locators.menuItem(value));
    await this.waitUntilClosed();
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
