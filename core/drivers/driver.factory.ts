import { Builder, Browser as SeleniumBrowser, WebDriver } from "selenium-webdriver";

import chrome from "selenium-webdriver/chrome";
import firefox from "selenium-webdriver/firefox";
import edge from "selenium-webdriver/edge";

export type Browser = "chrome" | "firefox" | "edge";

const HEADLESS = process.env.HEADLESS === "true";

export async function createDriver(
  browser: Browser = (process.env.BROWSER as Browser) || "chrome",
): Promise<WebDriver> {
  console.log(`Starting browser: ${browser}`);

  const builder = new Builder();

  switch (browser) {
    case "chrome": {
      const options = new chrome.Options();
      if (HEADLESS) options.addArguments("--headless=new");

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

  const driver = await builder.build();
  console.log(`WebDriver started: ${browser}`);

  return driver;
}
