import { By, WebDriver } from "selenium-webdriver";
import { BaseComponent } from "../../../../../core/ui/base-pages/base-component";
import { labelIdFromHref } from "./label-chip.fragment";

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
   * A combo in `multiple` selection mode defers its apply to `onHide`, so closing the menu is part
   * of the action rather than cleanup after it.
   */
  async toggle(value: number): Promise<void> {
    await this.click(this.locators.trigger);
    await this.click(this.locators.menuItem(value));
    await this.click(this.locators.trigger);
  }

  /**
   * A combo in `single` selection mode applies on click and hides itself, so clicking the trigger
   * again would reopen the menu and leave it covering the sidebar.
   */
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
