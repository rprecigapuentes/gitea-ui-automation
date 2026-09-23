import type { CDPSession, Page } from "@playwright/test";

/** One load of one page. Null where the browser reported nothing for that metric. */
export interface LoadSample {
  dns: number;
  connect: number;
  ttfb: number;
  response: number;
  domContentLoaded: number;
  load: number;
  firstContentfulPaint: number | null;
  largestContentfulPaint: number | null;
  requests: number;
  transferredBytes: number;
  scriptDuration: number | null;
  layoutDuration: number | null;
  recalcStyleDuration: number | null;
}

export type Metric = keyof LoadSample;

export interface MetricSummary {
  median: number;
  min: number;
  max: number;
  samples: number[];
}

export type Summary = Partial<Record<Metric, MetricSummary>>;

export interface PageMeasurement {
  page: string;
  url: string;
  loads: number;
  cold: Summary;
  warm: Summary;
}

/** Runs in the page. The largest paint is delivered over the life of the document rather than
 *  sitting there to be read, so it is subscribed to with the buffered entries already recorded. */
function readTimings() {
  const [navigation] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  const [contentful] = performance.getEntriesByName("first-contentful-paint");

  const largest = new Promise<number | null>((resolve) => {
    let latest: number | null = null;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) latest = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    requestAnimationFrame(() => resolve(latest));
  });

  return largest.then((largestContentfulPaint) => ({
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    connect: navigation.connectEnd - navigation.connectStart,
    ttfb: navigation.responseStart - navigation.requestStart,
    response: navigation.responseEnd - navigation.responseStart,
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
    load: navigation.loadEventEnd - navigation.startTime,
    firstContentfulPaint: contentful?.startTime ?? null,
    largestContentfulPaint,
    // The document has no resource entry of its own.
    requests: resources.length + 1,
    transferredBytes:
      navigation.transferSize +
      resources.reduce((total, resource) => total + resource.transferSize, 0),
  }));
}

const ENGINE_COUNTERS: Record<string, Metric> = {
  ScriptDuration: "scriptDuration",
  LayoutDuration: "layoutDuration",
  RecalcStyleDuration: "recalcStyleDuration",
};

function median(values: number[]): number {
  const sorted = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function summarise(samples: LoadSample[]): Summary {
  const summary: Summary = {};

  for (const metric of Object.keys(samples[0]) as Metric[]) {
    const values = samples
      .map((sample) => sample[metric])
      .filter((value): value is number => value !== null);

    if (!values.length) continue;

    summary[metric] = {
      median: median(values),
      min: Math.min(...values),
      max: Math.max(...values),
      samples: values,
    };
  }

  return summary;
}

export class PerformanceCollector {
  constructor(
    private readonly page: Page,
    private readonly session: CDPSession,
    private readonly loads: number,
  ) {}

  /** `navigate` is the page object's own open, so the collector never drives the browser itself
   *  and every load waits for the ready locators the functional tests wait for. */
  async measure(name: string, navigate: () => Promise<void>): Promise<PageMeasurement> {
    const cold: LoadSample[] = [];
    const warm: LoadSample[] = [];

    for (let load = 0; load < this.loads; load += 1) {
      await this.session.send("Network.clearBrowserCache");
      cold.push(await this.sample(navigate));
      warm.push(await this.sample(navigate));
    }

    return {
      page: name,
      url: this.page.url(),
      loads: this.loads,
      cold: summarise(cold),
      warm: summarise(warm),
    };
  }

  private async sample(navigate: () => Promise<void>): Promise<LoadSample> {
    const before = await this.counters();
    await navigate();
    const timings = await this.page.evaluate(readTimings);
    const after = await this.counters();

    return { ...timings, ...this.deltaOf(before, after) };
  }

  /** The engine counters accumulate from the moment collection was enabled, so only the
   *  difference across one navigation describes the page rather than the whole session. */
  private async counters(): Promise<Map<string, number>> {
    const { metrics } = await this.session.send("Performance.getMetrics");
    return new Map(metrics.map((metric) => [metric.name, metric.value]));
  }

  private deltaOf(
    before: Map<string, number>,
    after: Map<string, number>,
  ): Pick<LoadSample, "scriptDuration" | "layoutDuration" | "recalcStyleDuration"> {
    const delta = {} as Pick<
      LoadSample,
      "scriptDuration" | "layoutDuration" | "recalcStyleDuration"
    >;

    for (const [counter, metric] of Object.entries(ENGINE_COUNTERS)) {
      const start = before.get(counter);
      const end = after.get(counter);
      delta[metric as keyof typeof delta] =
        start === undefined || end === undefined ? null : end - start;
    }

    return delta;
  }
}
