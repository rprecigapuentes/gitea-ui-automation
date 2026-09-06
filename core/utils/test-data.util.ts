/**
 * Builds the visible identifier of a resource a test creates, per the repository conventions:
 * `AT-<tc_ID>-<object>-<YYYYMMDD>-<HHMMSS>`. The browser is appended as a fourth part because the
 * suite runs the same file on three browsers at once and two of them can reach this line inside the
 * same second.
 */
export function testDataName(testCaseId: string, object: string, at: Date = new Date()): string {
  const pad = (value: number): string => String(value).padStart(2, "0");
  const date = `${at.getUTCFullYear()}${pad(at.getUTCMonth() + 1)}${pad(at.getUTCDate())}`;
  const time = `${pad(at.getUTCHours())}${pad(at.getUTCMinutes())}${pad(at.getUTCSeconds())}`;

  return `AT-${testCaseId}-${object}-${date}-${time}-${process.env.BROWSER ?? "local"}`;
}
