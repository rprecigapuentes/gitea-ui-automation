import "dotenv/config";
import { Local } from "browserstack-local";
import { credentials, localIdentifier } from "./browserstack.config";

export default async function setup(): Promise<() => Promise<void>> {
  const tunnel = new Local();

  await new Promise<void>((resolve, reject) => {
    tunnel.start(
      { key: credentials().accessKey, localIdentifier, force: true, onlyAutomate: true },
      (error?: Error) => (error ? reject(error) : resolve()),
    );
  });

  console.log(`BrowserStack Local started: ${localIdentifier}`);

  return async () => {
    await new Promise<void>((resolve) => tunnel.stop(() => resolve()));
    console.log("BrowserStack Local stopped");
  };
}
