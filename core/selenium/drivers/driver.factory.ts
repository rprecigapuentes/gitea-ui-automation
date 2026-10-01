import { Builder, Browser as SeleniumBrowser, WebDriver } from "selenium-webdriver";
import { bstackOptions, hubUrl, isBrowserStack } from "../browserstack-config/browserstack.config";

import chrome from "selenium-webdriver/chrome";
import firefox from "selenium-webdriver/firefox";
import edge from "selenium-webdriver/edge";

export type Browser = "chrome" | "firefox" | "edge";

const HEADLESS = process.env.HEADLESS === "true";
// Points Selenium at a remote grid (e.g. the "selenium/standalone-all-browsers" container used by
// the CT pipeline) instead of spawning a local browser binary on the machine running the tests.
const seleniumRemoteUrl = process.env.SELENIUM_REMOTE_URL;

// A headless browser opens at 800x600, which leaves the further board columns out of the viewport,
// and a pointer gesture cannot reach a point that is not in view.
const WINDOW_SIZE = { width: 1920, height: 1080 };

// Chromium throttles timers and rendering for a window it thinks is covered, which is what happens
// to two of three browser windows run side by side; a throttled fade-in never finishes, so a modal
// stays "not visible" forever. These flags make every window count as on top.
const CHROMIUM_NO_OCCLUSION_THROTTLING_FLAGS = [
  "--disable-backgrounding-occluded-windows",
  "--disable-renderer-backgrounding",
  "--disable-background-timer-throttling",
  // Windows' own occlusion detection is what marks the window covered; the flags above only stop
  // the throttling that follows, so without this one a covered window can still get stuck.
  "--disable-features=CalculateNativeWinOcclusion",
];

export class DriverFactory {
  // One driver per worker process; the fixture or hook that asked for it quits it.
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
          ...CHROMIUM_NO_OCCLUSION_THROTTLING_FLAGS,
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
        options.addArguments(...CHROMIUM_NO_OCCLUSION_THROTTLING_FLAGS);

        builder.forBrowser(SeleniumBrowser.EDGE).setEdgeOptions(options);
        break;
      }

      default:
        throw new Error(`Navegador no soportado: ${String(browser)}`);
    }

    if (isBrowserStack) {
      builder.usingServer(hubUrl).disableEnvironmentOverrides();
      builder.getCapabilities().set("bstack:options", bstackOptions());
    } else if (seleniumRemoteUrl) {
      builder.usingServer(seleniumRemoteUrl);
    }

    DriverFactory.instance = await builder.build();
    await DriverFactory.instance.manage().window().setRect(WINDOW_SIZE);
    // Every lookup already polls explicitly. An implicit wait on top makes a findElements that
    // matches nothing block for its full duration before returning [] (SeleniumHQ/selenium#12278),
    // so every absence check and failed poll pays it again and no timeout measures real time.
    await DriverFactory.instance.manage().setTimeouts({ implicit: 0 });
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
