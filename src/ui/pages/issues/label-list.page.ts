import { By, WebDriver, WebElement } from "selenium-webdriver";
import { BasePage } from "../../../../core/ui/base-pages/base.page";
import { baseUrl } from "../../../../core/config/config";
import { LabelRow, NewScopedLabel } from "../../../entities/label.entity";
import { LabelChipFragment } from "./fragments/label-chip.fragment";

const modal = "#issue-label-edit-modal";
const WAIT_TIMEOUT_MS = 10000;

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
    editButton: By.css(".edit-label-button"),
    chip: By.css(".label-title .ui.label"),
  };

  constructor(driver: WebDriver) {
    super(driver);
  }

  override getUrl(owner: string, repository: string): string {
    return `${baseUrl}/${owner}/${repository}/labels`;
  }

  async openNewLabelForm(): Promise<void> {
    await this.click(this.locators.newLabelButton);
    await this.findElement(this.locators.modal, this.driver, WAIT_TIMEOUT_MS);
  }

  async isExclusiveFieldEnabled(): Promise<boolean> {
    const field = await this.findElement(this.locators.exclusiveField);
    const classes = (await field.getAttribute("class")) ?? "";

    return !classes.split(/\s+/).includes("disabled");
  }

  async fillName(name: string): Promise<void> {
    await this.type(this.locators.nameInput, name);
  }

  async markExclusive(): Promise<void> {
    await this.click(this.locators.exclusiveCheckbox);
  }

  async fillDescription(description: string): Promise<void> {
    await this.type(this.locators.descriptionInput, description);
  }

  async fillColor(color: string): Promise<void> {
    const input = await this.findElement(this.locators.colorInput);
    await input.clear();
    await input.sendKeys(color);
  }

  async submitLabelForm(): Promise<void> {
    await this.click(this.locators.submitButton);
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
