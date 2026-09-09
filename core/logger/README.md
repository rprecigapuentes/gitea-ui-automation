# @gitea-automation/core-logger

Logging — 100% generic, no Gitea or Selenium knowledge.

## Structure

```
core/logger/
├── logger.adapter.ts   # Logger/LogLevel/LogContext interface (adapter pattern)
└── pino.logger.ts       # Pino implementation of Logger, ANSI-colorized console output
```

The adapter interface exists so consumers depend on `Logger`, not on Pino directly — swapping the implementation later doesn't touch any call site.

## Imports

```ts
import { logger } from "@gitea-automation/core-logger/pino.logger";
import type { Logger, LogLevel, LogContext } from "@gitea-automation/core-logger/logger.adapter";
```
