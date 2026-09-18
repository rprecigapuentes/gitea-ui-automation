# @gitea-automation/core-api-client

The Strategy pattern that lets a Gitea API client run against either `got` or Playwright's `APIRequestContext`: `IRequestStrategy`, its two implementations, `GiteaApiClient` — the base class every concrete client extends — and the Factory that picks between them.

## Why this package, and why it isn't split by tool

`core/selenium/` is split by tool so a file with a real dependency on one tool's types never sits somewhere that's supposed to be tool-agnostic. This package is the same deliberate exception `core/page-objects/` already is: its whole purpose is to hold code that talks to the underlying HTTP mechanism behind one interface, so a concrete client never has to import `got` or a Playwright request context directly. The two concrete strategies still live apart from the shared abstraction, in their own `strategies/` subfolder, since they _are_ tool-specific — only the interface, `GiteaApiClient`, and the Factory stay at the top level.

## Structure

```
core/api-client/
├── request-strategy.interface.ts     # IRequestStrategy — get/post/put/delete, returning the parsed body
├── gitea-api-client.ts               # GiteaApiClient — the base class every concrete client extends
├── request-strategy.factory.ts       # RequestStrategyFactory — the one place that picks a concrete strategy
└── strategies/
    ├── got-request-strategy.ts           # GotRequestStrategy
    └── playwright-request-strategy.ts    # PlaywrightRequestStrategy
```

## The pattern

A concrete client (in `@gitea-automation/business-logic`) extends `GiteaApiClient` and only ever calls its inherited `get`/`post`/`put`/`delete` methods. It never imports `got` or `@playwright/test`, and never decides what's making the request underneath:

```ts
export class IssueClient extends GiteaApiClient {
  async createIssue(owner: string, repository: string, title: string): Promise<Issue> {
    return this.post<Issue>(`repos/${owner}/${repository}/issues`, { title });
  }
}
```

The choice of strategy is made where the client is constructed, through the Factory:

```ts
import { RequestStrategyFactory } from "@gitea-automation/core-api-client/request-strategy.factory";

new IssueClient(RequestStrategyFactory.got(baseUrl, token));
new IssueClient(RequestStrategyFactory.playwright(baseUrl, token));
```

`RequestStrategyFactory`'s two static methods are one-line delegates to `new GotRequestStrategy(...)`/`new PlaywrightRequestStrategy(...)` — the only public construction path for either.

## Dependencies

`got`, `@playwright/test`.
