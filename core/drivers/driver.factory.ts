import { Builder, Browser as SeleniumBrowser, WebDriver } from "selenium-webdriver";
import { bstackOptions, hubUrl, isBrowserStack } from "../config/browserstack.config";

import chrome from "selenium-webdriver/chrome";
import firefox from "selenium-webdriver/firefox";
import edge from "selenium-webdriver/edge";

export type Browser = "chrome" | "firefox" | "edge";

const HEADLESS = process.env.HEADLESS === "true";

export class DriverFactory {
  private static instance: WebDriver | null = null;

  private constructor() {}

  static async getDriver(
    browser: Browser = (process.env.BROWSER as Browser) || "chrome",
  ): Promise<WebDriver> {
    if (DriverFactory.instance) {
      return DriverFactory.instance;
    }

    const builder = new Builder();

    switch (browser) {
      case "chrome": {
        const options = new chrome.Options();
        if (HEADLESS) options.addArguments("--headless=new");

        options.addArguments(
          "--lang=en",
          "--no-first-run",
          "--no-default-browser-check",
          "--disable-sync",
          "--disable-background-networking",
          "--disable-notifications",
          "--disable-popup-blocking",
        );

        builder.forBrowser("chrome").setChromeOptions(options);
        break;
      }

      case "firefox": {
        const options = new firefox.Options();
        if (HEADLESS) options.addArguments("-headless");

        builder.forBrowser("firefox").setFirefoxOptions(options);
        break;
      }

      case "edge": {
        const options = new edge.Options();
        if (HEADLESS) options.addArguments("--headless=new");

        builder.forBrowser(SeleniumBrowser.EDGE).setEdgeOptions(options);
        break;
      }

      default:
        throw new Error(`Navegador no soportado: ${String(browser)}`);
    }

    if (isBrowserStack) {
      builder.usingServer(hubUrl).disableEnvironmentOverrides();
      builder.getCapabilities().set("bstack:options", bstackOptions());
    }

    DriverFactory.instance = await builder.build();
    console.log(`WebDriver started: ${browser}`);

    return DriverFactory.instance;
  }

  static async quitDriver(): Promise<void> {
    if (DriverFactory.instance) {
      await DriverFactory.instance.quit();
      DriverFactory.instance = null;
      console.log(`WebDriver quit`);
    }
  }
}
