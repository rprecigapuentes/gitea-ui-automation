# @gitea-automation/core-logger

> Structured logs, coloured by level, behind an interface the framework owns.

```ts
import { logger } from "@gitea-automation/core-logger/pino.logger";

logger.warn({ locator, url }, "Locator never became visible");
```

| File                | Holds                                                               |
| ------------------- | ------------------------------------------------------------------- |
| `logger.adapter.ts` | `Logger`, `LogLevel`, `LogContext`: the interface every caller uses |
| `pino.logger.ts`    | the Pino implementation: JSON lines, coloured by level, synchronous |

Each line carries the browser and the process id. `LOG_LEVEL` sets the threshold (`info` by
default); `debug` shows every absence check and every retried element read.
