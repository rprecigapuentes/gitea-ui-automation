// import { By, Key, until, WebDriver } from "selenium-webdriver";
// import { BasePage } from "./base.page";

// export class GooglePage extends BasePage {
//   private readonly locators = {
//     searchInput: By.name("q"),
//   };

//   protected get baseUrl(): string {
//     return "https://www.google.com";
//   }

//   constructor(driver: WebDriver) {
//     super(driver);
//   }

//   async searchFor(query: string): Promise<void> {
//     await this.type(this.locators.searchInput, query);
//     await this.pressKey(this.locators.searchInput, Key.ENTER);
//     await this.waitFor(until.urlContains("/search"));
//   }
// }
