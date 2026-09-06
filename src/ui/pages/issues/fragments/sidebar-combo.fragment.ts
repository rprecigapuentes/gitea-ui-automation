import { By, WebDriver } from "selenium-webdriver";
import { BaseComponent } from "../../../../../core/ui/base-pages/base-component";
import { labelIdFromHref } from "./label-chip.fragment";

export class SidebarComboFragment extends BaseComponent {
  private readonly root: string;

  private readonly locators: {
    trigger: By;
    menuItem: (value: number) => By;
    selectedItems: By;
  };

  constructor(driver: WebDriver, updateUrlFragment: string) {
    super(driver);
    this.root = `.issue-sidebar-combo[data-update-url*="${updateUrlFragment}"]`;
    this.locators = {
      trigger: By.css(`${this.root} .ui.dropdown a.fixed-text`),
      menuItem: (value: number) => By.css(`${this.root} .menu a.item[data-value="${value}"]`),
      selectedItems: By.css(`${this.root} .labels-list a.item`),
    };
  }

  async toggle(value: number): Promise<void> {
    await this.click(this.locators.trigger);
    await this.click(this.locators.menuItem(value));
    await this.click(this.locators.trigger);
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
