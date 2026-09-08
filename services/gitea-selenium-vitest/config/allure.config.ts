import { beforeEach } from "vitest";
import { parameter } from "allure-js-commons";

beforeEach(async () => {
  const browser = process.env.BROWSER;

  if (browser) {
    await parameter("browser", browser);
  }
});
