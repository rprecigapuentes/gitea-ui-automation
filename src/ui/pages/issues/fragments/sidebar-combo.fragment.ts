import { By, Key, WebDriver } from "selenium-webdriver";
import { BaseComponent } from "../../../../../core/ui/base-pages/base-component";
import { labelIdFromHref } from "./label-chip.fragment";

const WAIT_TIMEOUT_MS = 10000;
const CLICK_TIMEOUT_MS = 3000;
const OPEN_TIMEOUT_MS = 4000;
const OPEN_ATTEMPTS = 3;
const POLL_INTERVAL_MS = 100;

const ANY_OPEN_DROPDOWN = By.css(".issue-sidebar-combo > .ui.dropdown.active.visible");

/**
 * Whether a combo's menu is up, answered in the page. Reading it through `findElements` instead
 * would cost the driver's 3000 ms implicit wait on every miss, and these polls run dozens of times
 * per test; mixing the two kinds of wait is also what the Selenium documentation warns against.
 */
const MENU_IS_OPEN = `
  const root = document.querySelector(arguments[0]);
  if (!root) return false;
  const menu = root.querySelector(":scope > .ui.dropdown > .menu");
  return Boolean(menu) && getComputedStyle(menu).display !== "none";
`;

const OPEN_MENU_COUNT = `
  return Array.from(document.querySelectorAll(".issue-sidebar-combo > .ui.dropdown"))
    .filter((dropdown) => {
      const menu = dropdown.querySelector(":scope > .menu");
      return Boolean(menu) && getComputedStyle(menu).display !== "none";
    }).length;
`;

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
    return (await this.driver.executeScript<boolean>(MENU_IS_OPEN, this.root)) === true;
  }

  private async countOpenMenus(): Promise<number> {
    return this.driver.executeScript<number>(OPEN_MENU_COUNT);
  }

  /**
   * An open menu is laid out over the combos beneath it, so the click meant for the next one lands
   * on that menu and is lost, and the combo it covers then never opens. Every menu still up is
   * therefore dismissed before one is opened, whichever combo left it there. The page is asked
   * first and the driver only when there is something to dismiss, so the common case costs one
   * script call.
   */
  private async dismissOpenMenus(): Promise<void> {
    if ((await this.countOpenMenus()) === 0) return;

    for (const dropdown of await this.driver.findElements(ANY_OPEN_DROPDOWN)) {
      try {
        await dropdown.sendKeys(Key.ESCAPE);
      } catch {
        continue;
      }
    }

    await this.driver.wait(
      async () => (await this.countOpenMenus()) === 0,
      WAIT_TIMEOUT_MS,
      "a sidebar combo menu stayed open over the rest of the sidebar",
      POLL_INTERVAL_MS,
    );
  }

  /**
   * Fomantic opens and closes the menu through a transition, and applying a selection re-renders
   * the list under the trigger, which moves every combo below it. A click computed just before
   * that reflow lands beside the trigger and is lost, so opening is retried. Each attempt gives
   * the menu its own window to appear before another click is sent, because the trigger toggles:
   * re-clicking it while the menu is still on its way in closes it again.
   */
  private async open(): Promise<void> {
    for (let attempt = 0; attempt < OPEN_ATTEMPTS; attempt++) {
      if (await this.isOpen()) return;

      await this.dismissOpenMenus();

      try {
        await this.click(this.locators.trigger, this.driver, CLICK_TIMEOUT_MS);
        await this.driver.wait(async () => this.isOpen(), OPEN_TIMEOUT_MS, "", POLL_INTERVAL_MS);

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
   * swallowed and left covering the combo below. Escape is a dismissal the widget handles itself,
   * and it runs the same `onHide` the apply depends on.
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
      POLL_INTERVAL_MS,
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
