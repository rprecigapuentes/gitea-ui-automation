import pino from "pino";
import type { Logger, LogLevel } from "./logger.adapter";

const level = (process.env.LOG_LEVEL as LogLevel | undefined) ?? "info";

const ANSI_RESET = "\x1b[0m";
// pino numeric levels: debug=20, info=30, warn=40, error=50
const LEVEL_COLORS: Record<number, string> = {
  20: "\x1b[36m", // cyan
  30: "\x1b[32m", // green
  40: "\x1b[33m", // yellow
  50: "\x1b[31m", // red
};

const destination = pino.destination({ fd: 1, sync: true });
const colorizedStream = {
  write(chunk: string): boolean {
    let output = chunk;
    try {
      const { level: logLevel } = JSON.parse(chunk) as { level?: number };
      const color = logLevel !== undefined ? LEVEL_COLORS[logLevel] : undefined;
      if (color) output = `${color}${chunk.trimEnd()}${ANSI_RESET}\n`;
    } catch {
      // not JSON, write unchanged
    }
    return destination.write(output);
  },
};

export const logger: Logger = pino(
  {
    level,
    base: { browser: process.env.BROWSER ?? "local", pid: process.pid },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  colorizedStream,
);
