import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  generateMarketHistorySnapshot,
  type GenerateMarketHistorySnapshotOptions,
  generateStaticMarketSnapshot,
  type GenerateStaticSnapshotOptions,
  parseMarketHistorySnapshot,
  parseStaticMarketSnapshot,
} from '../src/lib/market-providers';
import type {
  MarketHistorySnapshot,
  StaticMarketSnapshot,
} from '../src/lib/market-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DEFAULT_SNAPSHOT_PATH = path.resolve(
  __dirname,
  '../public/market-prices.json',
);
export const DEFAULT_HISTORY_SNAPSHOT_PATH = path.resolve(
  __dirname,
  '../public/market-history.json',
);

export async function loadExistingMarketSnapshot(
  snapshotPath: string = DEFAULT_SNAPSHOT_PATH,
): Promise<StaticMarketSnapshot | null> {
  try {
    const rawText = await readFile(snapshotPath, 'utf-8');
    const parsedJson = JSON.parse(rawText) as unknown;
    return parseStaticMarketSnapshot(parsedJson);
  } catch {
    return null;
  }
}

export async function loadExistingMarketHistorySnapshot(
  historyPath: string = DEFAULT_HISTORY_SNAPSHOT_PATH,
): Promise<MarketHistorySnapshot | null> {
  try {
    const rawText = await readFile(historyPath, 'utf-8');
    const parsedJson = JSON.parse(rawText) as unknown;
    return parseMarketHistorySnapshot(parsedJson);
  } catch {
    return null;
  }
}

export async function updateMarketSnapshotFile(
  options: GenerateStaticSnapshotOptions & {
    outputPath?: string;
  } = {},
): Promise<StaticMarketSnapshot> {
  const outputPath = options.outputPath ?? DEFAULT_SNAPSHOT_PATH;
  const existingSnapshot =
    options.previousSnapshot !== undefined
      ? (options.previousSnapshot as StaticMarketSnapshot | null)
      : await loadExistingMarketSnapshot(outputPath);

  let nextSnapshot: StaticMarketSnapshot;
  try {
    nextSnapshot = await generateStaticMarketSnapshot({
      ...options,
      previousSnapshot: existingSnapshot,
      concurrency: options.concurrency ?? 5,
    });
  } catch (err) {
    if (existingSnapshot) {
      console.warn(
        '[market:snapshot] Complete provider failure — preserving previous snapshot as stale:',
        err instanceof Error ? err.message : String(err),
      );
      nextSnapshot = {
        ...existingSnapshot,
        status: 'stale',
      };
    } else {
      throw err;
    }
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(nextSnapshot, null, 2)}\n`,
    'utf-8',
  );
  return nextSnapshot;
}

export async function updateMarketHistorySnapshotFile(
  options: GenerateMarketHistorySnapshotOptions & {
    outputPath?: string;
  } = {},
): Promise<MarketHistorySnapshot> {
  const outputPath = options.outputPath ?? DEFAULT_HISTORY_SNAPSHOT_PATH;
  const existingHistory =
    options.previousHistorySnapshot !== undefined
      ? options.previousHistorySnapshot
      : await loadExistingMarketHistorySnapshot(outputPath);

  let nextHistory: MarketHistorySnapshot;
  try {
    nextHistory = await generateMarketHistorySnapshot({
      ...options,
      previousHistorySnapshot: existingHistory,
      concurrency: options.concurrency ?? 4,
    });
  } catch (err) {
    if (existingHistory) {
      console.warn(
        '[market:snapshot] History refresh failure — preserving previous history as stale:',
        err instanceof Error ? err.message : String(err),
      );
      nextHistory = {
        generatedAt: new Date().toISOString(),
        histories: existingHistory.histories.map((h) => ({
          ...h,
          status: h.candles.length > 0 ? 'stale' : 'unavailable',
        })),
      };
    } else {
      throw err;
    }
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(nextHistory, null, 2)}\n`,
    'utf-8',
  );
  return nextHistory;
}

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule) {
  (async () => {
    const snapshot = await updateMarketSnapshotFile();
    const delayedCount = snapshot.quoteList.filter(
      (q) =>
        q.status === 'delayed' ||
        q.status === 'available' ||
        q.status === 'live',
    ).length;
    const staleCount = snapshot.quoteList.filter(
      (q) => q.status === 'stale',
    ).length;
    const fallbackCount = snapshot.quoteList.filter(
      (q) => q.status === 'fallback',
    ).length;

    console.log(
      `[market:snapshot] Wrote ${snapshot.quoteList.length} quotes to public/market-prices.json`,
    );
    console.log(
      `[market:snapshot] generatedAt=${snapshot.generatedAt} fxReferenceDate=${snapshot.fxReferenceDate} fxRateUsdToEur=${snapshot.fxRateUsdToEur} status=${snapshot.status} (fresh=${delayedCount}, stale=${staleCount}, fallback=${fallbackCount})`,
    );

    const historySnapshot = await updateMarketHistorySnapshotFile({
      referenceEndDate: snapshot.fxReferenceDate,
    });
    const availHist = historySnapshot.histories.filter(
      (h) => h.status === 'available',
    ).length;
    const staleHist = historySnapshot.histories.filter(
      (h) => h.status === 'stale',
    ).length;
    const unavailHist = historySnapshot.histories.filter(
      (h) => h.status === 'unavailable',
    ).length;
    console.log(
      `[market:snapshot] Wrote ${historySnapshot.histories.length} asset histories to public/market-history.json (available=${availHist}, stale=${staleHist}, unavailable=${unavailHist})`,
    );
  })().catch((err) => {
    console.error(
      '[market:snapshot] Fatal error generating snapshot:',
      err instanceof Error ? err.message : String(err),
    );
    process.exitCode = 1;
  });
}

