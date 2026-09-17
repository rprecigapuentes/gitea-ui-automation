# @gitea-automation/core-api-client

The Strategy pattern that lets a Gitea API client run against either `got` or a future Playwright request context: `IRequestStrategy`, its real `got`-based implementation, and `GiteaApiClient` — the base class every concrete client extends.

## Why this package, and why it isn't split by tool

`core/selenium/` and `core/playwright/` are split by tool so a file with a real dependency on one tool's types never sits somewhere that's supposed to be tool-agnostic. This package is the same deliberate exception `core/page-objects/` already is: its whole purpose is to hold code that talks to the underlying HTTP mechanism behind one interface, so a concrete client never has to import `got` (or, later, a Playwright request context) directly.

## Structure

```
core/api-client/
├── request-strategy.interface.ts   # IRequestStrategy — get/post/put/delete, returning the parsed body
├── got-request-strategy.ts         # GotRequestStrategy — real implementation, plus createGotStrategy(baseUrl, token)
└── gitea-api-client.ts             # GiteaApiClient — the base class every concrete client extends
```

## The pattern

A concrete client (in `@gitea-automation/business-logic-selenium`) extends `GiteaApiClient` and only ever calls its inherited `get`/`post`/`put`/`delete` methods. It never imports `got`, and never decides what's making the request underneath:

```ts
export class IssueClient extends GiteaApiClient {
  async createIssue(owner: string, repository: string, title: string): Promise<Issue> {
    return this.post<Issue>(`repos/${owner}/${repository}/issues`, { title });
  }
}
```

`GiteaApiClient`'s constructor still takes `(baseUrl, token)` — unlike `core/page-objects`' `BaseComponent`, it doesn't take an injected strategy yet, because there's no second implementation to choose between. It builds a `GotRequestStrategy` internally. When a Playwright-based strategy exists, `GiteaApiClient` becomes the injection point the same way `BaseComponent` already is.

## Current limitation

Only `GotRequestStrategy` exists. A Playwright-based `IRequestStrategy` (using `APIRequestContext` or similar) is future work, not started.

## Dependencies

`got`, `@gitea-automation/core-logger` (request/response debug logging, ported unchanged from the previous `GiteaApiClient`).
