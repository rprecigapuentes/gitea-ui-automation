import { By } from "selenium-webdriver";
import { BasePage } from "@gitea-automation/core-selenium/ui/base-pages/base.page";
import { baseUrl } from "@gitea-automation/core-config/gitea.config";

const WAIT_TIMEOUT_MS = 10000;
const PROJECT_LIST_URL = /\/-\/projects$/;
const form = 'form.ui.form:has(input[name="template_type"])';
// The form holds two dropdowns with the same classes; the hidden input tells them apart.
const templateDropdown = `${form} .ui.selection.dropdown:has(input[name="template_type"])`;

export class CreateProjectPage extends BasePage {
  private readonly locators = {
    title: By.css(`${form} input[name="title"]`),
    templateDropdown: By.css(templateDropdown),
    // Gitea numbers its project templates: 1 is Basic Kanban.
    basicKanbanOption: By.css(`${templateDropdown} .menu .item[data-id="1"]`),
    createButton: By.css(`${form} button.ui.primary.button`),
  };

  override getUrl(owner: string): string {
    return `${baseUrl}/${owner}/-/projects/new`;
  }

  async openFor(owner: string): Promise<void> {
    await super.open([this.locators.title, this.locators.templateDropdown], owner);
  }

  async createFromBasicKanban(title: string): Promise<void> {
    await this.type(this.locators.title, title);
    await this.click(this.locators.templateDropdown);
    await this.click(this.locators.basicKanbanOption);
    await this.clickAndWaitForUrl(
      this.locators.createButton,
      PROJECT_LIST_URL,
      this.driver,
      WAIT_TIMEOUT_MS,
    );
  }
}
