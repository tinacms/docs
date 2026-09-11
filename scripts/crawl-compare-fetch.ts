import type { CrawlOutcome } from "./crawl-compare-comparator";

export interface FetchOptions {
  bypassSecret?: string;
}

function buildHeaders(options: FetchOptions): HeadersInit | undefined {
  return options.bypassSecret
    ? { "x-vercel-protection-bypass": options.bypassSecret }
    : undefined;
}

export async function fetchPage(
  url: string,
  options: FetchOptions = {}
): Promise<CrawlOutcome> {
  const response = await fetch(url, { headers: buildHeaders(options) });
  return {
    status: response.status,
    finalPath: new URL(response.url).pathname,
    html: await response.text(),
  };
}

export async function headStatus(
  url: string,
  options: FetchOptions = {}
): Promise<number> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: buildHeaders(options),
    });
    return response.status;
  } catch {
    return 0;
  }
}

// Runs `worker` over `items` with at most `concurrency` in flight at once,
// so a large urls.txt doesn't open hundreds of simultaneous connections.
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function runWorker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, runWorker));
  return results;
}
