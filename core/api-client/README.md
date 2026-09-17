# @gitea-automation/core-api-client

The Strategy pattern that lets a Gitea API client run against either `got` or Playwright's `APIRequestContext`: `IRequestStrategy`, its two implementations, and `GiteaApiClient` — the base class every concrete client extends.

## Why this package, and why it isn't split by tool

`core/selenium/` and `core/playwright/` are split by tool so a file with a real dependency on one tool's types never sits somewhere that's supposed to be tool-agnostic. This package is the same deliberate exception `core/page-objects/` already is: its whole purpose is to hold code that talks to the underlying HTTP mechanism behind one interface, so a concrete client never has to import `got` (or, later, a Playwright request context) directly.

## Structure

```
core/api-client/
├── request-strategy.interface.ts     # IRequestStrategy — get/post/put/delete, returning the parsed body
├── got-request-strategy.ts           # GotRequestStrategy + createGotStrategy(baseUrl, token)
├── playwright-request-strategy.ts    # PlaywrightRequestStrategy + createPlaywrightStrategy(baseUrl, token)
└── gitea-api-client.ts               # GiteaApiClient — the base class every concrete client extends
```

## The pattern

A concrete client (in `@gitea-automation/business-logic-api`) extends `GiteaApiClient` and only ever calls its inherited `get`/`post`/`put`/`delete` methods. It never imports `got` or `@playwright/test`, and never decides what's making the request underneath:

```ts
export class IssueClient extends GiteaApiClient {
  async createIssue(owner: string, repository: string, title: string): Promise<Issue> {
    return this.post<Issue>(`repos/${owner}/${repository}/issues`, { title });
  }
}
```

The choice of strategy is made where the client is constructed, exactly like `core/page-objects`' `BaseComponent`:

```ts
new IssueClient(createGotStrategy(baseUrl, token));
new IssueClient(createPlaywrightStrategy(baseUrl, token));
```

## Dependencies

`got`, `@playwright/test`.
