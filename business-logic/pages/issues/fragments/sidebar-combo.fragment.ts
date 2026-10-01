import { BaseComponent } from "@gitea-automation/core-page-objects/base-component";
import { IInteractionStrategy } from "@gitea-automation/core-page-objects/interaction-strategy.interface";
import { labelIdFromHref } from "./label-chip.fragment";

// A timeout of 0 checks once, now, instead of waiting for the element.
const INSTANT = 0;
const SELECTION_TIMEOUT_MS = 10000;

export class SidebarComboFragment extends BaseComponent {
  private readonly locators: {
    trigger: string;
    menu: string;
    menuItem: (value: number) => string;
    selectedItems: string;
  };

  private constructor(
    strategy: IInteractionStrategy,
    private readonly root: string,
  ) {
    super(strategy);
    this.locators = {
      trigger: `${root} .ui.dropdown a.fixed-text`,
      // The dropdown holds a scrolling menu inside its own, so only the outer one is "the menu".
      menu: `${root} .ui.dropdown > .menu`,
      menuItem: (value: number) => `${root} .menu a.item[data-value="${value}"]`,
      selectedItems: `${root} .ui.list .item:not(.empty-list)`,
    };
  }

  static onIssue(strategy: IInteractionStrategy, updateUrlFragment: string): SidebarComboFragment {
    return new SidebarComboFragment(
      strategy,
      `.issue-sidebar-combo[data-update-url*="${updateUrlFragment}"]`,
    );
  }

  static byField(strategy: IInteractionStrategy, fieldName: string): SidebarComboFragment {
    return new SidebarComboFragment(
      strategy,
      `.issue-sidebar-combo:has(> input.combo-value[name="${fieldName}"])`,
    );
  }

  /**
   * The options are only on screen while the menu is open, so an option that is genuinely not
   * offered and one whose menu is shut look the same until the menu has been opened.
   */
  async offers(value: number): Promise<boolean> {
    await this.openMenu();

    return this.isVisible(this.locators.menuItem(value), undefined, INSTANT);
  }

  private async openMenu(): Promise<void> {
    if (await this.isVisible(this.locators.menu, undefined, INSTANT)) return;

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
      const items = await this.queryAll(this.locators.selectedItems);

      return await Promise.all(items.map((item) => item.getText()));
    } catch {
      // Any read error counts as "nothing selected yet", so the poll in toggleAndWaitForSelection
      // goes on and a dead session surfaces as its timeout.
      return [];
    }
  }

  async getSelectedIds(): Promise<number[]> {
    try {
      const links = await this.queryAll(this.locators.selectedItems);
      const hrefs = await Promise.all(links.map((link) => link.getAttribute("href")));

      return hrefs.map(labelIdFromHref).filter((id): id is number => id !== null);
    } catch {
      // Same as getSelectedTexts: a failed read is an empty selection, not an error.
      return [];
    }
  }
}
