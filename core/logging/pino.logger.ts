import pino from "pino";
import type { Logger, LogLevel } from "./logger.adapter";

const level = (process.env.LOG_LEVEL as LogLevel | undefined) ?? "info";

export const logger: Logger = pino(
  {
    level,
    base: { browser: process.env.BROWSER ?? "local", pid: process.pid },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.destination({ fd: 1, sync: true }),
);
