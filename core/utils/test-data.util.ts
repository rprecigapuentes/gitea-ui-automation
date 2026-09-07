import { randomUUID } from "node:crypto";

export function testDataName(testCaseId: string, object: string, at: Date = new Date()): string {
  const pad = (value: number): string => String(value).padStart(2, "0");
  const date = `${at.getUTCFullYear()}${pad(at.getUTCMonth() + 1)}${pad(at.getUTCDate())}`;
  const time = `${pad(at.getUTCHours())}${pad(at.getUTCMinutes())}${pad(at.getUTCSeconds())}`;

  return `AT-${testCaseId}-${object}-${date}-${time}-${process.env.BROWSER ?? "local"}-${uniqueSuffix()}`;
}

/**
 * Millisecond timestamps collide when multiple test files for the same browser (or,
 * for globally-namespaced resources like organizations, different browsers) create
 * resources within the same tick, so every generated Gitea resource name needs this
 * to stay unique under concurrent execution.
 */
export function uniqueSuffix(): string {
  return randomUUID().slice(0, 8);
}
