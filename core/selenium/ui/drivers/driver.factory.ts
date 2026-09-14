import { Builder, Browser as SeleniumBrowser, WebDriver } from "selenium-webdriver";
import { bstackOptions, hubUrl, isBrowserStack } from "../../config/browserstack.config";

import chrome from "selenium-webdriver/chrome";
import firefox from "selenium-webdriver/firefox";
import edge from "selenium-webdriver/edge";

export type Browser = "chrome" | "firefox" | "edge";

const HEADLESS = process.env.HEADLESS === "true";
// Points Selenium at a remote grid (e.g. the "selenium/standalone-all-browsers" container used by
// the CT pipeline) instead of spawning a local browser binary on the machine running the tests.
const seleniumRemoteUrl = process.env.SELENIUM_REMOTE_URL;

// Chromium pauses rendering and throttles timers for a window it considers occluded (fully
// covered by another window), which is exactly what happens to two of the three real, visible
// browser windows launched when chrome/firefox/edge run at the same time. A throttled window's
// CSS animations never finish, so a fading-in modal can stay "not visible" to Selenium forever.
// These flags tell Chromium to treat every window as if it were on top.
// A headless browser opens at 800x600, which leaves the further board columns out of the viewport,
// and a pointer gesture cannot reach a point that is not in view.
const WINDOW_SIZE = { width: 1920, height: 1080 };

const CHROMIUM_NO_OCCLUSION_THROTTLING_FLAGS = [
  "--disable-backgrounding-occluded-windows",
  "--disable-renderer-backgrounding",
  "--disable-background-timer-throttling",
  // Windows' native window-occlusion detection is what actually marks the window as covered in
  // the first place; the flags above only stop Chromium from throttling once it believes that,
  // so without this one a covered window can still get stuck mid fade-in forever.
  "--disable-features=CalculateNativeWinOcclusion",
];

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
    // BaseComponent already polls every lookup explicitly. An implicit wait on top of that makes a
    // findElements that legitimately matches nothing block for its full duration before returning
    // the empty list (SeleniumHQ/selenium#12278), so every absence check and every failed poll
    // inside an explicit wait pays it again, and no timeout in the framework measures real time.
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
