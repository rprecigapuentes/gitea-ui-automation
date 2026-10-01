# @gitea-automation/core-selenium

> The Selenium driver: which browser to open, with which options, local or remote.

## Usage

```ts
import { DriverFactory } from "@gitea-automation/core-selenium/drivers/driver.factory";

const driver = await DriverFactory.getDriver(); // the browser named by BROWSER, chrome by default
await DriverFactory.quitDriver();
```

## Structure

```
core/selenium/
├── drivers/driver.factory.ts                    DriverFactory: build and quit the WebDriver
└── browserstack-config/browserstack.config.ts   credentials, capabilities, session status
```

## What `DriverFactory` decides

| Setting                    | Value                          | Why                                                           |
| -------------------------- | ------------------------------ | ------------------------------------------------------------- |
| Browsers                   | `chrome`, `firefox`, `edge`    | the matrix every suite covers                                 |
| Window                     | 1920 × 1080                    | a headless browser opens at 800 × 600 and hides board columns |
| Implicit wait              | `0`                            | every lookup waits explicitly; see `core-page-objects`        |
| Occlusion flags (Chromium) | background throttling disabled | three windows side by side would freeze each other's fades    |
| Instances                  | one per process                | each browser runs in its own process with its own account     |

## Environment

| Variable                                           | Effect                                                   |
| -------------------------------------------------- | -------------------------------------------------------- |
| `BROWSER`                                          | `chrome`, `firefox` or `edge`                            |
| `HEADLESS=true`                                    | no browser windows                                       |
| `SELENIUM_REMOTE_URL`                              | use a Selenium grid instead of a local browser (CI does) |
| `BROWSERSTACK=true`                                | use BrowserStack Automate, through BrowserStack Local    |
| `BROWSERSTACK_USERNAME`, `BROWSERSTACK_ACCESS_KEY` | BrowserStack credentials                                 |
