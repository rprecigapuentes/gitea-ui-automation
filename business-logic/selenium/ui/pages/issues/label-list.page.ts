import { By, WebDriver, WebElement } from "selenium-webdriver";
import { BasePage } from "@gitea-automation/core-selenium/ui/base-pages/base.page";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";
import { LabelRow, NewScopedLabel } from "../../../api/entities/label.entity";
import { LabelChipFragment } from "./fragments/label-chip.fragment";

const modal = "#issue-label-edit-modal";
// The modal's fade-in animation can outlast 10s when the machine is busy running the other
// browsers in parallel, so it gets the same generous budget as the other Fomantic UI modals.
const WAIT_TIMEOUT_MS = 15000;
const EDIT_BUTTON_CLASS = "edit-label-button";

export class LabelListPage extends BasePage {
  private readonly locators = {
    newLabelButton: By.css(".ui.button.new-label"),
    modal: By.css(modal),
    nameInput: By.css(`${modal} .label-name-input`),
    descriptionInput: By.css(`${modal} .label-desc-input`),
    colorInput: By.css(`${modal} .color-picker-combo input[name="color"]`),
    exclusiveField: By.css(`${modal} .label-exclusive-input-field`),
    exclusiveCheckbox: By.css(`${modal} .label-exclusive-input-field .ui.checkbox label`),
    submitButton: By.css(`${modal} .ui.primary.approve.button`),
    rows: By.css("ul.issue-label-list > li.item"),
    editButton: By.css(`.${EDIT_BUTTON_CLASS}`),
    chip: By.css(".label-title .ui.label"),
  };

  constructor(driver: WebDriver) {
    super(driver);
  }

  override getUrl(owner: string, repository: string): string {
    return `${baseUrl}/${owner}/${repository}/labels`;
  }

  async openFor(owner: string, repository: string): Promise<void> {
    await super.open([this.locators.newLabelButton], owner, repository);
  }

  async openNewLabelForm(): Promise<void> {
    await this.click(this.locators.newLabelButton);

    // Chrome's WebElement.isDisplayed() can report false for this modal even while Fomantic UI
    // has genuinely opened it (its dimmer already intercepts clicks), so the real DOM/CSS state
    // is checked directly instead of trusting Selenium's visibility atom.
    await this.driver.wait(
      async () => {
        const isActive = await this.driver.executeScript<boolean>(
          `const el = document.querySelector(${JSON.stringify(modal)});
         return !!el && el.classList.contains("active") && getComputedStyle(el).display !== "none";`,
        );
        return isActive;
      },
      WAIT_TIMEOUT_MS,
      "the new label modal never became active",
    );
  }

  async isExclusiveFieldEnabled(): Promise<boolean> {
    const field = await this.findElement(
      this.locators.exclusiveField,
      this.driver,
      WAIT_TIMEOUT_MS,
    );
    const classes = (await field.getAttribute("class")) ?? "";

    return !classes.split(/\s+/).includes("disabled");
  }

  async fillName(name: string): Promise<void> {
    await this.type(this.locators.nameInput, name, this.driver, WAIT_TIMEOUT_MS);
  }

  async markExclusive(): Promise<void> {
    await this.click(this.locators.exclusiveCheckbox, this.driver, WAIT_TIMEOUT_MS);
  }

  async fillDescription(description: string): Promise<void> {
    await this.type(this.locators.descriptionInput, description, this.driver, WAIT_TIMEOUT_MS);
  }

  async fillColor(color: string): Promise<void> {
    const input = await this.findElement(this.locators.colorInput, this.driver, WAIT_TIMEOUT_MS);
    await input.clear();
    await input.sendKeys(color);
  }

  async submitLabelForm(): Promise<void> {
    await this.click(this.locators.submitButton, this.driver, WAIT_TIMEOUT_MS);
  }

  async createScopedLabel(label: NewScopedLabel): Promise<LabelRow> {
    await this.openNewLabelForm();
    await this.fillName(label.name);
    await this.markExclusive();
    await this.fillDescription(label.description);
    await this.fillColor(label.color);
    await this.submitLabelForm();

    return this.waitForLabel(label.name);
  }

  /** Simulates the application renaming the class the edit buttons are located by. */
  async driftEditButtons(): Promise<void> {
    await this.renameClass(this.locators.editButton, EDIT_BUTTON_CLASS, "edit-label-btn");
  }

  private async readRow(row: WebElement): Promise<LabelRow> {
    const button = await row.findElement(this.locators.editButton);
    const attribute = async (name: string): Promise<string> =>
      (await button.getAttribute(name)) ?? "";

    return {
      id: Number(await attribute("data-label-id")),
      name: await attribute("data-label-name"),
      color: (await attribute("data-label-color")).replace("#", "").toLowerCase(),
      description: await attribute("data-label-description"),
      exclusive: (await attribute("data-label-exclusive")) === "true",
      issueCount: Number(await attribute("data-label-num-issues")),
    };
  }

  async findRow(name: string): Promise<LabelRow | null> {
    try {
      for (const row of await this.driver.findElements(this.locators.rows)) {
        const read = await this.readRow(row);

        if (read.name === name) return read;
      }
    } catch {
      return null;
    }

    return null;
  }

  async waitForLabel(name: string): Promise<LabelRow> {
    await this.driver.wait(
      async () => (await this.findRow(name)) !== null,
      WAIT_TIMEOUT_MS,
      `the label "${name}" never appeared in the label list`,
    );

    const row = await this.findRow(name);

    if (!row) throw new Error(`the label "${name}" left the list while it was being read`);

    return row;
  }

  async getChip(name: string): Promise<LabelChipFragment> {
    for (const row of await this.driver.findElements(this.locators.rows)) {
      if ((await this.readRow(row)).name === name) {
        return new LabelChipFragment(this.driver, await row.findElement(this.locators.chip));
      }
    }

    throw new Error(`no label named "${name}" in the label list`);
  }
}
