import {
  buildFallbackMarketQuote,
  CURATED_MARKET_ASSETS,
  DEMO_INSTRUMENTS,
  FALLBACK_PRICE_DATE,
  getSourceQualifiedAssetKey,
} from './market-demo-adapter';
import type {
  AssetHistory,
  HistoricalCandle,
  HistoricalDataSource,
  HistoricalSummaryStats,
  MarketAsset,
  MarketDataProvider,
  MarketHistorySnapshot,
  MarketPriceRecord,
  MarketPriceRepository,
  MarketQuote,
  NormalizedQuoteStatus,
  SharedQuoteCache,
  StaticMarketSnapshot,
  SupportedCurrency,
  TradingVenue,
} from './market-types';

export type MarketProviderErrorCode =
  | 'UNCURATED_ASSET'
  | 'INVALID_SYMBOL'
  | 'INVALID_ISIN'
  | 'NASDAQ_FORBIDDEN'
  | 'NASDAQ_RATE_LIMIT'
  | 'NASDAQ_HTTP_ERROR'
  | 'BOERSE_FRANKFURT_HTTP_ERROR'
  | 'MALFORMED_JSON'
  | 'INVALID_QUOTE_DATA'
  | 'STREAM_LIMIT_EXCEEDED'
  | 'EMPTY_STREAM'
  | 'FX_UNAVAILABLE'
  | 'TIMEOUT';

export class MarketProviderError extends Error {
  readonly code: MarketProviderErrorCode;
  readonly statusCode?: number;

  constructor(
    code: MarketProviderErrorCode,
    message: string,
    statusCode?: number,
  ) {
    super(message);
    this.name = 'MarketProviderError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

const CURATED_SYMBOL_SET = new Set(
  CURATED_MARKET_ASSETS.filter((a) => a.symbol).map((a) =>
    a.symbol!.trim().toUpperCase(),
  ),
);

const CURATED_ISIN_SET = new Set(
  CURATED_MARKET_ASSETS.filter((a) => a.isin).map((a) =>
    a.isin!.trim().toUpperCase(),
  ),
);

export function isCuratedNasdaqSymbol(
  symbol: string,
  allowedSymbols: ReadonlySet<string> = CURATED_SYMBOL_SET,
): boolean {
  const normalized = symbol.trim().toUpperCase();
  if (!/^[A-Z.\-^]{1,10}$/.test(normalized)) {
    return false;
  }
  return allowedSymbols.has(normalized);
}

export function isCuratedBoerseIsin(
  isin: string,
  allowedIsins: ReadonlySet<string> = CURATED_ISIN_SET,
): boolean {
  const normalized = isin.trim().toUpperCase();
  if (!/^[A-Z]{2}[A-Z0-9]{10}$/.test(normalized)) {
    return false;
  }
  return allowedIsins.has(normalized);
}

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Safely parses Nasdaq currency strings like "$173.73" or "$1,234.50".
 * Rejects percentages, negative numbers, zero, or malformed strings.
 */
export function parseNasdaqPrice(raw: unknown): number | null {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw > 0 ? roundMoney(raw) : null;
  }
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.includes('%')) return null;
  const cleaned = trimmed.replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const parsed = Number.parseFloat(cleaned);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return roundMoney(parsed);
}

export function normalizeMarketTimestamp(
  rawTime: unknown,
  fallbackIso: string,
): string | null {
  if (typeof rawTime !== 'string' || !rawTime.trim()) {
    return null;
  }
  const cleaned = rawTime
    .trim()
    .replace(/^DATA\s+AS\s+OF\s+/i, '')
    .replace(/\s+ET$/i, '')
    .trim();

  const parsedMs = Date.parse(cleaned);
  if (Number.isFinite(parsedMs)) {
    return new Date(parsedMs).toISOString();
  }
  return fallbackIso;
}

export interface ParsedNasdaqQuotePayload {
  symbol: string;
  companyName: string | null;
  price: number;
  previousClose: number;
  changeAbsolute: number;
  changePercent: number;
  marketTime: string | null;
}

export function parseNasdaqQuotePayload(
  payload: unknown,
  expectedSymbol: string,
  fetchedAtIso = new Date().toISOString(),
): ParsedNasdaqQuotePayload {
  if (!payload || typeof payload !== 'object') {
    throw new MarketProviderError(
      'INVALID_QUOTE_DATA',
      `Ungültige Nasdaq-Antwort für ${expectedSymbol}.`,
    );
  }

  const root = payload as {
    data?: {
      symbol?: string;
      companyName?: string;
      primaryData?: {
        lastSalePrice?: unknown;
        netChange?: unknown;
        percentageChange?: unknown;
        lastTradeTimestamp?: unknown;
      };
    } | null;
  };

  const data = root.data;
  if (!data || typeof data !== 'object' || !data.primaryData) {
    throw new MarketProviderError(
      'INVALID_QUOTE_DATA',
      `Keine Kursdaten in der Nasdaq-Antwort für ${expectedSymbol}.`,
    );
  }

  const price = parseNasdaqPrice(data.primaryData.lastSalePrice);
  if (price === null) {
    throw new MarketProviderError(
      'INVALID_QUOTE_DATA',
      `Kein gültiger Verkaufspreis (lastSalePrice) für ${expectedSymbol}.`,
    );
  }

  const netChangeRaw =
    typeof data.primaryData.netChange === 'string'
      ? Number.parseFloat(data.primaryData.netChange.replace(/[$,+\s]/g, ''))
      : typeof data.primaryData.netChange === 'number'
        ? data.primaryData.netChange
        : 0;
  const changeAbsolute = Number.isFinite(netChangeRaw)
    ? roundMoney(netChangeRaw)
    : 0;
  const previousClose =
    price - changeAbsolute > 0 ? roundMoney(price - changeAbsolute) : price;
  const changePercent =
    previousClose > 0
      ? roundMoney(((price - previousClose) / previousClose) * 100)
      : 0;

  const companyName =
    typeof data.companyName === 'string' && data.companyName.trim().length > 0
      ? data.companyName
          .replace(
            /\s+(Common Stock|Class [A-Z] Common Stock|American Depositary Shares).*$/i,
            '',
          )
          .trim()
      : null;

  const marketTime = normalizeMarketTimestamp(
    data.primaryData.lastTradeTimestamp,
    fetchedAtIso,
  );

  return {
    symbol: expectedSymbol.toUpperCase(),
    companyName,
    price,
    previousClose,
    changeAbsolute,
    changePercent,
    marketTime,
  };
}

export async function fetchNasdaqPrototypeQuote(
  asset: MarketAsset,
  fxInfo: {
    rateUsdToEur: number;
    date: string;
    status: 'available' | 'stale' | 'fallback';
  },
  options?: {
    fetchFn?: typeof fetch;
    timeoutMs?: number;
    nowIso?: string;
    allowedSymbols?: ReadonlySet<string>;
  },
): Promise<MarketQuote> {
  const symbol = (asset.symbol ?? asset.id).trim().toUpperCase();
  if (!/^[A-Z.\-^]{1,10}$/.test(symbol)) {
    throw new MarketProviderError(
      'INVALID_SYMBOL',
      `Ungültiges US-Tickersymbol: ${symbol}`,
    );
  }
  if (!isCuratedNasdaqSymbol(symbol, options?.allowedSymbols)) {
    throw new MarketProviderError(
      'UNCURATED_ASSET',
      `Symbol ${symbol} ist nicht Teil des kuratierten Bildungskatalogs.`,
    );
  }

  const fetchImpl = options?.fetchFn ?? fetch;
  const timeoutMs = options?.timeoutMs ?? 10000;
  const fetchedAt = options?.nowIso ?? new Date().toISOString();

  const url = `https://api.nasdaq.com/api/quote/${encodeURIComponent(symbol)}/info?assetclass=stocks`;
  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new MarketProviderError(
      'TIMEOUT',
      err instanceof Error
        ? `Nasdaq-Anfrage fehlgeschlagen: ${err.message}`
        : 'Nasdaq-Anfrage durch Zeitüberschreitung abgebrochen.',
    );
  }

  if (response.status === 403) {
    throw new MarketProviderError(
      'NASDAQ_FORBIDDEN',
      `Nasdaq-Zugriff verweigert (HTTP 403) für ${symbol}.`,
      403,
    );
  }
  if (response.status === 429) {
    throw new MarketProviderError(
      'NASDAQ_RATE_LIMIT',
      `Nasdaq-Abfragelimit erreicht (HTTP 429) für ${symbol}.`,
      429,
    );
  }
  if (!response.ok) {
    throw new MarketProviderError(
      'NASDAQ_HTTP_ERROR',
      `Nasdaq-Abruf fehlgeschlagen (HTTP ${response.status}) für ${symbol}.`,
      response.status,
    );
  }

  let jsonPayload: unknown;
  try {
    jsonPayload = await response.json();
  } catch {
    throw new MarketProviderError(
      'MALFORMED_JSON',
      `Ungültiges JSON von Nasdaq für ${symbol}.`,
    );
  }

  const parsed = parseNasdaqQuotePayload(jsonPayload, symbol, fetchedAt);
  if (!Number.isFinite(fxInfo.rateUsdToEur) || fxInfo.rateUsdToEur <= 0) {
    throw new MarketProviderError(
      'FX_UNAVAILABLE',
      'Kein gültiger USD/EUR-Wechselkurs für die Umrechnung verfügbar.',
    );
  }

  const priceEur = roundMoney(parsed.price * fxInfo.rateUsdToEur);
  const quoteStatus: NormalizedQuoteStatus =
    fxInfo.status === 'fallback'
      ? 'fallback'
      : fxInfo.status === 'stale'
        ? 'stale'
        : 'delayed';

  return {
    assetId: asset.id,
    symbol: parsed.symbol,
    price: parsed.price,
    currency: 'USD',
    priceEur,
    fxRateToEur: fxInfo.rateUsdToEur,
    fxReferenceDate: fxInfo.date,
    marketTime: parsed.marketTime,
    fetchedAt,
    source: 'nasdaq-prototype',
    status: quoteStatus,
    previousClose: parsed.previousClose,
    changeAbsolute: parsed.changeAbsolute,
    changePercent: parsed.changePercent,
    exchange: 'NASDAQ',
    timestamp: parsed.marketTime ?? fetchedAt,
    providerName:
      quoteStatus === 'fallback'
        ? 'Demowert aus der Ausgangsversion, kein aktueller Börsenkurs.'
        : 'Nasdaq Prototyp-Kurs (verzögert)',
    isDemo: quoteStatus === 'fallback',
    fallbackPriceDate:
      quoteStatus === 'fallback'
        ? (asset.fallbackPriceDate ?? FALLBACK_PRICE_DATE)
        : undefined,
  };
}

export interface ParsedBoerseQuoteEvent {
  price: number;
  currency: SupportedCurrency;
  time: string | null;
  previousClose: number;
  changeAbsolute: number;
  changePercent: number;
}

/**
 * Parses text/event-stream chunks from Börse Frankfurt price_information.
 * Adapted from Lovable `boerse.server.ts`:
 * - ignores heartbeats and incomplete events;
 * - rejects non-positive or percentage-quoted (`tradedInPercent`) instruments;
 * - extracts `lastPrice`, `currency.originalValue`, `timestampLastPrice`.
 */
export function parseBoerseFrankfurtSseEvent(
  text: string,
): ParsedBoerseQuoteEvent | null {
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith('data:')) continue;
    const rawJson = line.slice(5).trim();
    if (!rawJson) continue;
    try {
      const data = JSON.parse(rawJson) as {
        lastPrice?: unknown;
        closingPricePrevTradingDay?: unknown;
        changeToPrevDayAbsolute?: unknown;
        changeToPrevDayInPercent?: unknown;
        currency?: { originalValue?: unknown };
        timestampLastPrice?: unknown;
        tradedInPercent?: unknown;
      };

      if (
        typeof data.lastPrice !== 'number' ||
        !Number.isFinite(data.lastPrice) ||
        data.lastPrice <= 0 ||
        Boolean(data.tradedInPercent)
      ) {
        continue;
      }

      const rawCurrency =
        typeof data.currency?.originalValue === 'string'
          ? data.currency.originalValue.trim().toUpperCase()
          : '';
      if (rawCurrency !== 'EUR' && rawCurrency !== 'USD') {
        continue;
      }

      const price = roundMoney(data.lastPrice);
      const prevClose =
        typeof data.closingPricePrevTradingDay === 'number' &&
        Number.isFinite(data.closingPricePrevTradingDay) &&
        data.closingPricePrevTradingDay > 0
          ? roundMoney(data.closingPricePrevTradingDay)
          : price;
      const changeAbsolute =
        typeof data.changeToPrevDayAbsolute === 'number' &&
        Number.isFinite(data.changeToPrevDayAbsolute)
          ? roundMoney(data.changeToPrevDayAbsolute)
          : roundMoney(price - prevClose);
      const changePercent =
        typeof data.changeToPrevDayInPercent === 'number' &&
        Number.isFinite(data.changeToPrevDayInPercent)
          ? roundMoney(data.changeToPrevDayInPercent)
          : prevClose > 0
            ? roundMoney(((price - prevClose) / prevClose) * 100)
            : 0;

      const time =
        typeof data.timestampLastPrice === 'string' &&
        data.timestampLastPrice.trim().length > 0
          ? data.timestampLastPrice.trim()
          : null;

      return {
        price,
        currency: rawCurrency,
        time,
        previousClose: prevClose,
        changeAbsolute,
        changePercent,
      };
    } catch {
      // Ignore heartbeat or incomplete SSE frame
    }
  }
  return null;
}

const MAX_BOERSE_STREAM_CHARS = 100_000;

export async function fetchBoerseFrankfurtPrototypeQuote(
  asset: MarketAsset,
  fxInfo: {
    rateUsdToEur: number;
    date: string;
    status: 'available' | 'stale' | 'fallback';
  },
  options?: {
    fetchFn?: typeof fetch;
    timeoutMs?: number;
    nowIso?: string;
    allowedIsins?: ReadonlySet<string>;
    maxStreamChars?: number;
  },
): Promise<MarketQuote> {
  const isin = (asset.isin ?? '').trim().toUpperCase();
  const venue: TradingVenue = asset.venue === 'XFRA' ? 'XFRA' : 'XETR';

  if (!/^[A-Z]{2}[A-Z0-9]{10}$/.test(isin)) {
    throw new MarketProviderError(
      'INVALID_ISIN',
      `Ungültige ISIN für Börse Frankfurt: ${isin}`,
    );
  }
  if (!isCuratedBoerseIsin(isin, options?.allowedIsins)) {
    throw new MarketProviderError(
      'UNCURATED_ASSET',
      `ISIN ${isin} ist nicht im kuratierten Bildungskatalog enthalten.`,
    );
  }

  const fetchImpl = options?.fetchFn ?? fetch;
  const timeoutMs = options?.timeoutMs ?? 15000;
  const fetchedAt = options?.nowIso ?? new Date().toISOString();
  const maxStreamChars = options?.maxStreamChars ?? MAX_BOERSE_STREAM_CHARS;

  const url = `https://api.boerse-frankfurt.de/v1/data/price_information?isin=${encodeURIComponent(isin)}&mic=${encodeURIComponent(venue)}`;
  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: { Accept: 'text/event-stream' },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new MarketProviderError(
      'TIMEOUT',
      err instanceof Error
        ? `Börse-Frankfurt-Anfrage fehlgeschlagen: ${err.message}`
        : 'Börse-Frankfurt-Anfrage durch Zeitüberschreitung abgebrochen.',
    );
  }

  if (!response.ok) {
    throw new MarketProviderError(
      'BOERSE_FRANKFURT_HTTP_ERROR',
      `Kurs von Börse Frankfurt nicht verfügbar (HTTP ${response.status}) für ${isin}.`,
      response.status,
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new MarketProviderError(
      'EMPTY_STREAM',
      `Kein SSE-Stream von Börse Frankfurt für ${isin} empfangen.`,
    );
  }

  let text = '';
  const decoder = new TextDecoder();
  let parsedQuote: ParsedBoerseQuoteEvent | null = null;

  try {
    while (text.length < maxStreamChars) {
      const chunk = await reader.read();
      if (chunk.value) {
        text += decoder.decode(chunk.value, { stream: !chunk.done });
      }
      const boundary = text.lastIndexOf('\n');
      const inspectSlice = chunk.done
        ? text
        : boundary >= 0
          ? text.slice(0, boundary)
          : '';
      if (inspectSlice) {
        parsedQuote = parseBoerseFrankfurtSseEvent(inspectSlice);
        if (parsedQuote) {
          break;
        }
      }
      if (chunk.done) {
        parsedQuote = parseBoerseFrankfurtSseEvent(text);
        break;
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  if (!parsedQuote) {
    if (text.length >= maxStreamChars) {
      throw new MarketProviderError(
        'STREAM_LIMIT_EXCEEDED',
        `Maximale Stream-Größe (${maxStreamChars} Zeichen) ohne gültigen Kurs überschritten.`,
      );
    }
    throw new MarketProviderError(
      'INVALID_QUOTE_DATA',
      `Kein gültiger Aktien-/ETF-Kurs von Börse Frankfurt (${venue}) für ${isin} empfangen.`,
    );
  }

  const isUsd = parsedQuote.currency === 'USD';
  const fxRateToEur = isUsd ? fxInfo.rateUsdToEur : 1;
  const priceEur = isUsd
    ? roundMoney(parsedQuote.price * fxRateToEur)
    : parsedQuote.price;

  const quoteStatus: NormalizedQuoteStatus =
    isUsd && fxInfo.status === 'fallback'
      ? 'fallback'
      : isUsd && fxInfo.status === 'stale'
        ? 'stale'
        : 'delayed';

  const marketTimeIso = normalizeMarketTimestamp(parsedQuote.time, fetchedAt);

  return {
    assetId: asset.id,
    symbol: asset.symbol ?? asset.id,
    price: parsedQuote.price,
    currency: parsedQuote.currency,
    priceEur,
    fxRateToEur,
    fxReferenceDate: isUsd ? fxInfo.date : fetchedAt.slice(0, 10),
    marketTime: marketTimeIso ?? parsedQuote.time,
    fetchedAt,
    source: 'boerse-frankfurt-prototype',
    status: quoteStatus,
    previousClose: parsedQuote.previousClose,
    changeAbsolute: parsedQuote.changeAbsolute,
    changePercent: parsedQuote.changePercent,
    exchange: venue === 'XETR' ? 'XETRA' : 'Frankfurt',
    timestamp: marketTimeIso ?? fetchedAt,
    providerName:
      quoteStatus === 'fallback'
        ? 'Demowert aus der Ausgangsversion, kein aktueller Börsenkurs.'
        : `Börse Frankfurt (${venue}) Prototyp-Kurs`,
    isDemo: quoteStatus === 'fallback',
    fallbackPriceDate:
      quoteStatus === 'fallback'
        ? (asset.fallbackPriceDate ?? FALLBACK_PRICE_DATE)
        : undefined,
  };
}

export interface FrankfurterFxResult {
  rateUsdToEur: number;
  date: string;
}

/**
 * Retrieves the USD -> EUR reference exchange rate once per refresh cycle
 * from https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR
 */
export async function fetchFrankfurterUsdToEurRate(options?: {
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}): Promise<FrankfurterFxResult> {
  const fetchImpl = options?.fetchFn ?? fetch;
  const timeoutMs = options?.timeoutMs ?? 12000;
  const url = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR';

  let res: Response;
  try {
    res = await fetchImpl(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new MarketProviderError(
      'FX_UNAVAILABLE',
      err instanceof Error
        ? `Frankfurter-Wechselkursabruf fehlgeschlagen: ${err.message}`
        : 'Frankfurter-Wechselkursabruf fehlgeschlagen.',
    );
  }

  if (!res.ok) {
    throw new MarketProviderError(
      'FX_UNAVAILABLE',
      `USD/EUR-Referenzwechselkurs nicht verfügbar (HTTP ${res.status}).`,
      res.status,
    );
  }

  let data: { rates?: { EUR?: unknown }; date?: unknown };
  try {
    data = (await res.json()) as { rates?: { EUR?: unknown }; date?: unknown };
  } catch {
    throw new MarketProviderError(
      'MALFORMED_JSON',
      'Ungültige JSON-Antwort vom Frankfurter Wechselkursdienst.',
    );
  }

  const rate = data?.rates?.EUR;
  const date = typeof data?.date === 'string' ? data.date.trim() : '';

  if (
    typeof rate !== 'number' ||
    !Number.isFinite(rate) ||
    rate <= 0 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    throw new MarketProviderError(
      'FX_UNAVAILABLE',
      'Kein gültiger USD/EUR-Wechselkurs in der Frankfurter-Antwort enthalten.',
    );
  }

  return {
    rateUsdToEur: Math.round(rate * 100000) / 100000,
    date,
  };
}

/**
 * In-memory prototype implementation of `MarketPriceRepository` (`market_prices` table shape).
 * Note: In-memory cache is lost on server restart and is not shared across serverless instances.
 */
export class InMemoryMarketPriceRepository implements MarketPriceRepository {
  private readonly store = new Map<string, MarketPriceRecord>();

  async getAll(): Promise<MarketPriceRecord[]> {
    return Array.from(this.store.values());
  }

  async getByAssetId(assetId: string): Promise<MarketPriceRecord | null> {
    return this.store.get(assetId.toUpperCase()) ?? null;
  }

  async saveMany(records: MarketPriceRecord[]): Promise<void> {
    for (const rec of records) {
      this.store.set(rec.asset_id.toUpperCase(), { ...rec });
    }
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

export function toMarketPriceRecord(quote: MarketQuote): MarketPriceRecord {
  const normalizedStatus: NormalizedQuoteStatus =
    quote.status === 'available' ||
    quote.status === 'delayed' ||
    quote.status === 'stale' ||
    quote.status === 'fallback'
      ? quote.status
      : quote.isDemo
        ? 'fallback'
        : 'delayed';

  return {
    asset_id: quote.assetId,
    price: quote.price,
    currency: quote.currency,
    price_eur: quote.priceEur,
    market_time: quote.marketTime,
    fetched_at: quote.fetchedAt,
    source: quote.source,
    status: normalizedStatus,
  };
}

async function runWithConcurrencyLimit<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const safeConcurrency = Math.max(1, Math.min(6, concurrency));
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const idx = nextIndex++;
      const item = items[idx]!;
      try {
        const value = await worker(item);
        results[idx] = { status: 'fulfilled', value };
      } catch (reason) {
        results[idx] = { status: 'rejected', reason };
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(safeConcurrency, items.length) },
    () => runWorker(),
  );
  await Promise.all(workers);
  return results;
}

export interface PrototypeProviderOptions {
  fetchFn?: typeof fetch;
  concurrency?: number;
  timeoutMs?: number;
  nowFn?: () => Date;
  allowedSymbols?: ReadonlySet<string>;
  allowedIsins?: ReadonlySet<string>;
  previousCache?: SharedQuoteCache | null;
}

/**
 * Replaceable MarketDataProvider implementation for the school prototype.
 * Deduplicates assets by source-qualified key, fetches USD/EUR once, and fetches
 * each unique asset quote once with bounded concurrency (default 5).
 */
export class PrototypeMarketDataProvider implements MarketDataProvider {
  private readonly options: PrototypeProviderOptions;
  private lastFxResult: {
    rateUsdToEur: number;
    date: string;
    status: 'available' | 'stale' | 'fallback';
  } | null = null;

  constructor(options: PrototypeProviderOptions = {}) {
    this.options = options;
  }

  public getLastFxResult() {
    return this.lastFxResult;
  }

  async getQuotes(
    assets: MarketAsset[],
    previousCache?: SharedQuoteCache | null,
  ): Promise<MarketQuote[]> {
    const now = (this.options.nowFn ?? (() => new Date()))();
    const nowIso = now.toISOString();
    const priorCache = previousCache ?? this.options.previousCache ?? null;

    // 1. Deduplicate assets by source-qualified key
    const uniqueByKey = new Map<string, MarketAsset>();
    const keyToAssets = new Map<string, MarketAsset[]>();
    for (const asset of assets) {
      const key = getSourceQualifiedAssetKey(asset);
      if (!uniqueByKey.has(key)) {
        uniqueByKey.set(key, asset);
      }
      const list = keyToAssets.get(key) ?? [];
      list.push(asset);
      keyToAssets.set(key, list);
    }

    const uniqueAssets = Array.from(uniqueByKey.values());
    const needsUsdFx = uniqueAssets.some((a) => a.quoteCurrency === 'USD');

    // 2. Retrieve USD/EUR once per refresh cycle
    let fxInfo: {
      rateUsdToEur: number;
      date: string;
      status: 'available' | 'stale' | 'fallback';
    } = {
      rateUsdToEur: 0.9215,
      date: FALLBACK_PRICE_DATE,
      status: 'fallback',
    };

    if (needsUsdFx) {
      try {
        const fx = await fetchFrankfurterUsdToEurRate({
          fetchFn: this.options.fetchFn,
          timeoutMs: this.options.timeoutMs,
        });
        fxInfo = {
          rateUsdToEur: fx.rateUsdToEur,
          date: fx.date,
          status: 'available',
        };
      } catch {
        const priorFxFromQuote = priorCache?.quoteList?.find(
          (q) =>
            q.currency === 'USD' &&
            !q.isDemo &&
            q.status !== 'fallback' &&
            Number.isFinite(q.fxRateToEur) &&
            q.fxRateToEur > 0,
        );
        if (
          priorCache &&
          Number.isFinite(priorCache.fxRateUsdToEur) &&
          priorCache.fxRateUsdToEur > 0 &&
          priorCache.fxStatus !== 'fallback'
        ) {
          fxInfo = {
            rateUsdToEur: priorCache.fxRateUsdToEur,
            date: priorCache.fxReferenceDate,
            status: 'stale',
          };
        } else if (priorFxFromQuote) {
          fxInfo = {
            rateUsdToEur: priorFxFromQuote.fxRateToEur,
            date: priorFxFromQuote.fxReferenceDate ?? FALLBACK_PRICE_DATE,
            status: 'stale',
          };
        } else {
          // Fallback FX rate: clearly labelled as fallback/demo data
          fxInfo = {
            rateUsdToEur: 0.9215,
            date: FALLBACK_PRICE_DATE,
            status: 'fallback',
          };
        }
      }
    } else {
      fxInfo = {
        rateUsdToEur: priorCache?.fxRateUsdToEur ?? 0.9215,
        date: priorCache?.fxReferenceDate ?? nowIso.slice(0, 10),
        status: priorCache?.fxStatus ?? 'available',
      };
    }

    this.lastFxResult = fxInfo;

    // 3. Retrieve every unique asset quote once with bounded concurrency (default 5)
    const concurrency = this.options.concurrency ?? 5;
    const settled = await runWithConcurrencyLimit(
      uniqueAssets,
      concurrency,
      async (asset): Promise<MarketQuote> => {
        if (asset.assetType === 'cash' || asset.source === 'manual-demo') {
          return {
            assetId: asset.id,
            symbol: asset.symbol ?? asset.id,
            price: 1,
            currency: 'EUR',
            priceEur: 1,
            fxRateToEur: 1,
            fxReferenceDate: nowIso.slice(0, 10),
            marketTime: nowIso,
            fetchedAt: nowIso,
            source: 'manual-demo',
            status: 'available',
            previousClose: 1,
            changeAbsolute: 0,
            changePercent: 0,
            exchange: 'EUR-Konto',
            timestamp: nowIso,
            providerName: 'Virtuelles Bargeld (EUR)',
            isDemo: false,
          };
        }

        if (asset.source === 'nasdaq-prototype') {
          return fetchNasdaqPrototypeQuote(asset, fxInfo, {
            fetchFn: this.options.fetchFn,
            timeoutMs: this.options.timeoutMs,
            nowIso,
            allowedSymbols: this.options.allowedSymbols,
          });
        }

        if (asset.source === 'boerse-frankfurt-prototype') {
          return fetchBoerseFrankfurtPrototypeQuote(asset, fxInfo, {
            fetchFn: this.options.fetchFn,
            timeoutMs: this.options.timeoutMs,
            nowIso,
            allowedIsins: this.options.allowedIsins,
          });
        }

        return buildFallbackMarketQuote(asset, nowIso);
      },
    );

    // 4. Normalize all results, retaining stale quotes on failure or falling back to demo
    const outputQuotes: MarketQuote[] = [];

    settled.forEach((res, idx) => {
      const canonicalAsset = uniqueAssets[idx]!;
      const key = getSourceQualifiedAssetKey(canonicalAsset);
      const matchingAssets = keyToAssets.get(key) ?? [canonicalAsset];

      for (const targetAsset of matchingAssets) {
        const prevQuote = findPreviousValidQuote(priorCache, targetAsset);

        if (res.status === 'fulfilled') {
          // Never replace a valid previous quote with a PDF fallback
          if (
            (res.value.status === 'fallback' || res.value.isDemo) &&
            prevQuote
          ) {
            const staleDate = (
              prevQuote.marketTime ??
              prevQuote.fetchedAt ??
              nowIso
            ).slice(0, 10);
            outputQuotes.push({
              ...prevQuote,
              assetId: targetAsset.id,
              symbol: targetAsset.symbol ?? targetAsset.id,
              status: 'stale',
              isDemo: false,
              providerName: `Letzter verfügbarer Kurs vom ${staleDate}. Die heutige Aktualisierung war nicht möglich.`,
            });
            continue;
          }

          outputQuotes.push({
            ...res.value,
            assetId: targetAsset.id,
            symbol: targetAsset.symbol ?? targetAsset.id,
          });
          continue;
        }

        // Refresh failed for this asset: retain previous valid quote as stale
        if (prevQuote) {
          const staleDate = (
            prevQuote.marketTime ??
            prevQuote.fetchedAt ??
            nowIso
          ).slice(0, 10);
          outputQuotes.push({
            ...prevQuote,
            assetId: targetAsset.id,
            symbol: targetAsset.symbol ?? targetAsset.id,
            status: 'stale',
            isDemo: false,
            providerName: `Letzter verfügbarer Kurs vom ${staleDate}. Die heutige Aktualisierung war nicht möglich.`,
          });
        } else {
          // No prior successful quote exists -> clearly labelled fallback value
          outputQuotes.push(buildFallbackMarketQuote(targetAsset, nowIso));
        }
      }
    });

    return outputQuotes;
  }
}

export function findPreviousValidQuote(
  priorCache: SharedQuoteCache | null | undefined,
  targetAsset: MarketAsset,
): MarketQuote | null {
  if (!priorCache) return null;
  const idUpper = targetAsset.id.toUpperCase();
  const symUpper = (targetAsset.symbol ?? targetAsset.id).toUpperCase();

  const candidate =
    priorCache.quotes?.[idUpper] ??
    priorCache.quotes?.[targetAsset.id] ??
    priorCache.quotes?.[symUpper] ??
    (targetAsset.symbol ? priorCache.quotes?.[targetAsset.symbol] : undefined) ??
    priorCache.quoteList?.find(
      (q) =>
        q.assetId?.toUpperCase() === idUpper ||
        q.symbol?.toUpperCase() === symUpper,
    );

  if (
    candidate &&
    candidate.status !== 'fallback' &&
    candidate.status !== 'demo' &&
    !candidate.isDemo &&
    Number.isFinite(candidate.priceEur) &&
    candidate.priceEur > 0
  ) {
    return candidate;
  }
  return null;
}

export const DAILY_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface SharedRefreshCoordinatorOptions extends PrototypeProviderOptions {
  repository?: MarketPriceRepository;
  cacheTtlMs?: number;
  assets?: MarketAsset[];
}

/**
 * Centralized Daily Cache & Shared Refresh Coordinator (Phases 8 & 9).
 * Ensures:
 * - Only one refresh runs at a time (`pendingRefresh` lock);
 * - Concurrent callers await the same `pendingRefresh` promise;
 * - Subsequent requests within the daily cache window receive `cachedQuotes` with 0 upstream requests;
 * - Users cannot trigger unlimited external refreshes.
 */
export class SharedDailyQuoteCoordinator {
  private cachedQuotes: SharedQuoteCache | null = null;
  private pendingRefresh: Promise<SharedQuoteCache> | null = null;
  private readonly repository: MarketPriceRepository;
  private readonly cacheTtlMs: number;
  private readonly assets: MarketAsset[];
  private readonly provider: PrototypeMarketDataProvider;
  private readonly nowFn: () => Date;

  constructor(options: SharedRefreshCoordinatorOptions = {}) {
    this.repository = options.repository ?? new InMemoryMarketPriceRepository();
    this.cacheTtlMs = options.cacheTtlMs ?? DAILY_CACHE_TTL_MS;
    this.assets = options.assets ?? CURATED_MARKET_ASSETS;
    this.nowFn = options.nowFn ?? (() => new Date());
    this.provider = new PrototypeMarketDataProvider({
      ...options,
      nowFn: this.nowFn,
    });
  }

  public getRepository(): MarketPriceRepository {
    return this.repository;
  }

  public getCachedSnapshot(): SharedQuoteCache | null {
    return this.cachedQuotes;
  }

  public isCacheValid(nowMs = this.nowFn().getTime()): boolean {
    if (!this.cachedQuotes) return false;
    const currentDateKey = new Date(nowMs).toISOString().slice(0, 10);
    return (
      nowMs < this.cachedQuotes.expiresAt &&
      this.cachedQuotes.cacheDateKey === currentDateKey
    );
  }

  /**
   * Returns shared cached quotes for all users.
   * Performs a lazy daily refresh only when the daily cache is empty or expired.
   */
  public async getSharedQuotes(): Promise<SharedQuoteCache> {
    const nowMs = this.nowFn().getTime();
    if (this.cachedQuotes && this.isCacheValid(nowMs)) {
      return this.cachedQuotes;
    }

    if (this.pendingRefresh) {
      return this.pendingRefresh;
    }

    this.pendingRefresh = this.performSharedRefresh();
    try {
      return await this.pendingRefresh;
    } finally {
      this.pendingRefresh = null;
    }
  }

  /**
   * Internal refresh operation for the complete curated catalogue.
   */
  private async performSharedRefresh(): Promise<SharedQuoteCache> {
    const now = this.nowFn();
    const nowIso = now.toISOString();
    const prior = this.cachedQuotes;

    const quoteList = await this.provider.getQuotes(this.assets, prior);
    const fx = this.provider.getLastFxResult() ?? {
      rateUsdToEur: prior?.fxRateUsdToEur ?? 0.9215,
      date: prior?.fxReferenceDate ?? FALLBACK_PRICE_DATE,
      status: prior?.fxStatus ?? 'fallback',
    };

    const quotesMap: Record<string, MarketQuote> = {};
    const records: MarketPriceRecord[] = [];

    for (const q of quoteList) {
      quotesMap[q.assetId.toUpperCase()] = q;
      quotesMap[q.symbol.toUpperCase()] = q;
      records.push(toMarketPriceRecord(q));
    }

    await this.repository.saveMany(records);

    const nextCache: SharedQuoteCache = {
      quotes: quotesMap,
      quoteList,
      records,
      fxRateUsdToEur: fx.rateUsdToEur,
      fxReferenceDate: fx.date,
      fxStatus: fx.status,
      fetchedAt: nowIso,
      cacheDateKey: nowIso.slice(0, 10),
      expiresAt: now.getTime() + this.cacheTtlMs,
      refreshCount: (prior?.refreshCount ?? 0) + 1,
    };

    this.cachedQuotes = nextCache;
    return nextCache;
  }

  /**
   * Used in unit tests to simulate cache expiry or reset state.
   */
  public expireCacheForTesting(): void {
    if (this.cachedQuotes) {
      this.cachedQuotes = {
        ...this.cachedQuotes,
        expiresAt: 0,
        cacheDateKey: '1970-01-01',
      };
    }
  }
}

export const sharedQuoteCoordinator = new SharedDailyQuoteCoordinator();

export function getCuratedAssetByIdentifier(
  identifier: string,
): MarketAsset | null {
  const norm = identifier.trim().toUpperCase();
  return (
    CURATED_MARKET_ASSETS.find(
      (a) =>
        a.id.toUpperCase() === norm ||
        (a.symbol && a.symbol.toUpperCase() === norm) ||
        (a.isin && a.isin.toUpperCase() === norm),
    ) ?? null
  );
}

export function getCuratedInstrumentMetadataList() {
  return DEMO_INSTRUMENTS;
}

/**
 * Validates and normalizes an existing static market snapshot JSON object
 * loaded from `public/market-prices.json` or fetched by the frontend.
 */
export function parseStaticMarketSnapshot(
  raw: unknown,
): StaticMarketSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const quotesRaw = obj.quotes;
  const quoteListRaw = Array.isArray(obj.quoteList)
    ? (obj.quoteList as MarketQuote[])
    : [];

  if (
    (!quotesRaw || typeof quotesRaw !== 'object') &&
    quoteListRaw.length === 0
  ) {
    return null;
  }

  const quotes: Record<string, MarketQuote> = {};

  for (const item of quoteListRaw) {
    if (
      item &&
      typeof item === 'object' &&
      typeof item.priceEur === 'number' &&
      Number.isFinite(item.priceEur) &&
      item.priceEur > 0
    ) {
      if (item.assetId) {
        quotes[item.assetId] = item;
        quotes[item.assetId.toUpperCase()] = item;
      }
      if (item.symbol) {
        quotes[item.symbol] = item;
        quotes[item.symbol.toUpperCase()] = item;
      }
    }
  }

  if (quotesRaw && typeof quotesRaw === 'object') {
    for (const [key, value] of Object.entries(
      quotesRaw as Record<string, MarketQuote>,
    )) {
      if (
        value &&
        typeof value === 'object' &&
        typeof value.priceEur === 'number' &&
        Number.isFinite(value.priceEur) &&
        value.priceEur > 0
      ) {
        quotes[key] = value;
        quotes[key.toUpperCase()] = value;
        if (value.assetId) quotes[value.assetId.toUpperCase()] = value;
        if (value.symbol) quotes[value.symbol.toUpperCase()] = value;
      }
    }
  }

  const normalizedQuoteList: MarketQuote[] =
    quoteListRaw.length > 0
      ? quoteListRaw
      : Array.from(
          new Map(
            Object.values(quotes).map((q) => [
              (q.assetId ?? q.symbol).toUpperCase(),
              q,
            ]),
          ).values(),
        );

  if (normalizedQuoteList.length === 0) {
    return null;
  }

  const generatedAt =
    typeof obj.generatedAt === 'string' && obj.generatedAt.trim()
      ? obj.generatedAt
      : typeof obj.fetchedAt === 'string' && obj.fetchedAt.trim()
        ? obj.fetchedAt
        : new Date().toISOString();

  const fetchedAt =
    typeof obj.fetchedAt === 'string' && obj.fetchedAt.trim()
      ? obj.fetchedAt
      : generatedAt;

  const fxRateUsdToEur =
    typeof obj.fxRateUsdToEur === 'number' &&
    Number.isFinite(obj.fxRateUsdToEur) &&
    obj.fxRateUsdToEur > 0
      ? obj.fxRateUsdToEur
      : 0.9215;

  const fxReferenceDate =
    typeof obj.fxReferenceDate === 'string' && obj.fxReferenceDate.trim()
      ? obj.fxReferenceDate
      : FALLBACK_PRICE_DATE;

  const fxStatus: 'available' | 'stale' | 'fallback' =
    obj.fxStatus === 'available' ||
    obj.fxStatus === 'stale' ||
    obj.fxStatus === 'fallback'
      ? obj.fxStatus
      : 'available';

  const records: MarketPriceRecord[] = Array.isArray(obj.records)
    ? (obj.records as MarketPriceRecord[])
    : normalizedQuoteList.map(toMarketPriceRecord);

  const nonCashQuotes = normalizedQuoteList.filter(
    (q) => q.assetId !== 'EUR-CASH' && q.symbol !== 'EUR-CASH',
  );
  const allFallback =
    nonCashQuotes.length > 0 &&
    nonCashQuotes.every((q) => q.status === 'fallback' || q.isDemo);
  const hasStale = nonCashQuotes.some((q) => q.status === 'stale');

  const status: NormalizedQuoteStatus =
    obj.status === 'available' ||
    obj.status === 'live' ||
    obj.status === 'delayed' ||
    obj.status === 'stale' ||
    obj.status === 'fallback'
      ? obj.status
      : allFallback
        ? 'fallback'
        : hasStale
          ? 'stale'
          : 'delayed';

  const marketTime =
    typeof obj.marketTime === 'string' && obj.marketTime.trim()
      ? obj.marketTime
      : (nonCashQuotes.find((q) => q.marketTime)?.marketTime ?? fetchedAt);

  const source =
    typeof obj.source === 'string' && obj.source.trim()
      ? obj.source
      : 'boerse-frankfurt-prototype+nasdaq-prototype+frankfurter-fx';

  return {
    generatedAt,
    fetchedAt,
    marketTime,
    fxRateUsdToEur,
    fxReferenceDate,
    fxStatus,
    source,
    status,
    quotes,
    quoteList: normalizedQuoteList,
    records,
    cacheDateKey:
      typeof obj.cacheDateKey === 'string' && obj.cacheDateKey.trim()
        ? obj.cacheDateKey
        : generatedAt.slice(0, 10),
    expiresAt:
      typeof obj.expiresAt === 'number' && Number.isFinite(obj.expiresAt)
        ? obj.expiresAt
        : Date.parse(generatedAt) + DAILY_CACHE_TTL_MS,
    refreshCount:
      typeof obj.refreshCount === 'number' && Number.isFinite(obj.refreshCount)
        ? obj.refreshCount
        : 1,
  };
}

export interface GenerateStaticSnapshotOptions {
  previousSnapshot?: SharedQuoteCache | StaticMarketSnapshot | null;
  fetchFn?: typeof fetch;
  nowFn?: () => Date;
  concurrency?: number;
  timeoutMs?: number;
  assets?: MarketAsset[];
}

/**
 * Generates a complete, fault-tolerant static market snapshot for `public/market-prices.json`.
 * - Retrieves USD/EUR only once;
 * - Retrieves each unique asset only once (concurrency limit 5);
 * - Retains previous valid quote as `stale` if an individual quote fails;
 * - Never replaces a valid previous quote with a PDF fallback.
 */
export async function generateStaticMarketSnapshot(
  options: GenerateStaticSnapshotOptions = {},
): Promise<StaticMarketSnapshot> {
  const nowFn = options.nowFn ?? (() => new Date());
  const now = nowFn();
  const generatedAt = now.toISOString();
  const assets = options.assets ?? CURATED_MARKET_ASSETS;
  const prior = options.previousSnapshot ?? null;

  const provider = new PrototypeMarketDataProvider({
    fetchFn: options.fetchFn,
    nowFn,
    concurrency: options.concurrency ?? 5,
    timeoutMs: options.timeoutMs,
    previousCache: prior,
  });

  const quoteList = await provider.getQuotes(assets, prior);
  const fx = provider.getLastFxResult() ?? {
    rateUsdToEur: prior?.fxRateUsdToEur ?? 0.9215,
    date: prior?.fxReferenceDate ?? FALLBACK_PRICE_DATE,
    status: prior?.fxStatus ?? 'fallback',
  };

  const quotes: Record<string, MarketQuote> = {};
  const records: MarketPriceRecord[] = [];

  for (const q of quoteList) {
    quotes[q.assetId] = q;
    quotes[q.assetId.toUpperCase()] = q;
    quotes[q.symbol] = q;
    quotes[q.symbol.toUpperCase()] = q;
    records.push(toMarketPriceRecord(q));
  }

  const nonCashQuotes = quoteList.filter(
    (q) => q.assetId !== 'EUR-CASH' && q.symbol !== 'EUR-CASH',
  );
  const allFallback =
    nonCashQuotes.length > 0 &&
    nonCashQuotes.every((q) => q.status === 'fallback' || q.isDemo);
  const hasStale = nonCashQuotes.some((q) => q.status === 'stale');

  const overallStatus: NormalizedQuoteStatus = allFallback
    ? 'fallback'
    : hasStale
      ? 'stale'
      : 'delayed';

  const latestMarketTime =
    nonCashQuotes
      .map((q) => q.marketTime)
      .filter((t): t is string => typeof t === 'string' && t.length > 0)
      .sort()
      .pop() ?? generatedAt;

  return {
    generatedAt,
    fetchedAt: generatedAt,
    marketTime: latestMarketTime,
    fxRateUsdToEur: fx.rateUsdToEur,
    fxReferenceDate: fx.date,
    fxStatus: fx.status,
    source: 'boerse-frankfurt-prototype+nasdaq-prototype+frankfurter-fx',
    status: overallStatus,
    quotes,
    quoteList,
    records,
    cacheDateKey: generatedAt.slice(0, 10),
    expiresAt: now.getTime() + DAILY_CACHE_TTL_MS,
    refreshCount: (prior?.refreshCount ?? 0) + 1,
  };
}

/**
 * Normalizes a date string ("MM/DD/YYYY" or "YYYY-MM-DD" or ISO) into "YYYY-MM-DD".
 */
export function normalizeHistoricalDate(rawDate: unknown): string | null {
  if (typeof rawDate !== 'string') return null;
  const trimmed = rawDate.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const ms = Date.parse(`${trimmed}T00:00:00Z`);
    return Number.isFinite(ms) ? trimmed : null;
  }
  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (slashMatch) {
    const mm = slashMatch[1]!.padStart(2, '0');
    const dd = slashMatch[2]!.padStart(2, '0');
    const yyyy = slashMatch[3]!;
    const isoDate = `${yyyy}-${mm}-${dd}`;
    const ms = Date.parse(`${isoDate}T00:00:00Z`);
    return Number.isFinite(ms) ? isoDate : null;
  }
  const parsedMs = Date.parse(trimmed);
  if (Number.isFinite(parsedMs)) {
    return new Date(parsedMs).toISOString().slice(0, 10);
  }
  return null;
}

/**
 * Validates that a daily OHLC candle satisfies all integrity constraints:
 * - valid YYYY-MM-DD date;
 * - open, high, low, close are finite and strictly positive (> 0);
 * - high >= open, high >= close, low <= open, low <= close, high >= low.
 */
export function isValidHistoricalCandle(
  raw: unknown,
): raw is HistoricalCandle {
  if (!raw || typeof raw !== 'object') return false;
  const c = raw as Record<string, unknown>;
  const date = normalizeHistoricalDate(c.date);
  if (!date) return false;

  const open = typeof c.open === 'number' ? c.open : Number.NaN;
  const high = typeof c.high === 'number' ? c.high : Number.NaN;
  const low = typeof c.low === 'number' ? c.low : Number.NaN;
  const close = typeof c.close === 'number' ? c.close : Number.NaN;

  if (
    !Number.isFinite(open) ||
    !Number.isFinite(high) ||
    !Number.isFinite(low) ||
    !Number.isFinite(close) ||
    open <= 0 ||
    high <= 0 ||
    low <= 0 ||
    close <= 0
  ) {
    return false;
  }

  const eps = 1e-6;
  if (
    high + eps < open ||
    high + eps < close ||
    low - eps > open ||
    low - eps > close ||
    high + eps < low
  ) {
    return false;
  }

  if (c.volume !== undefined && c.volume !== null) {
    if (
      typeof c.volume !== 'number' ||
      !Number.isFinite(c.volume) ||
      c.volume < 0
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Normalizes, validates, deduplicates by date, and sorts candles chronologically (ascending).
 * Malformed candles are rejected rather than rendered.
 */
export function normalizeAndValidateCandles(
  candidates: unknown[],
): HistoricalCandle[] {
  const byDate = new Map<string, HistoricalCandle>();

  for (const item of candidates) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as Record<string, unknown>;
    const normalizedDate = normalizeHistoricalDate(raw.date);
    if (!normalizedDate) continue;

    const candidateObj = {
      ...raw,
      date: normalizedDate,
    };

    if (!isValidHistoricalCandle(candidateObj)) {
      continue;
    }

    const open = roundMoney(candidateObj.open);
    const close = roundMoney(candidateObj.close);
    const high = roundMoney(candidateObj.high);
    const low = roundMoney(candidateObj.low);

    if (
      open <= 0 ||
      high <= 0 ||
      low <= 0 ||
      close <= 0 ||
      high < open ||
      high < close ||
      low > open ||
      low > close ||
      high < low
    ) {
      continue;
    }

    const volume =
      typeof candidateObj.volume === 'number' &&
      Number.isFinite(candidateObj.volume) &&
      candidateObj.volume >= 0
        ? Math.round(candidateObj.volume)
        : null;

    byDate.set(normalizedDate, {
      date: normalizedDate,
      open,
      high,
      low,
      close,
      ...(volume !== null ? { volume } : {}),
    });
  }

  return Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

/**
 * Merges existing and incoming daily candles, deduplicating by date, sorting ascending,
 * and retaining approximately the latest 365 calendar days.
 */
export function mergeAndTrimHistoricalCandles(
  existingCandles: HistoricalCandle[],
  incomingCandles: HistoricalCandle[],
  maxCalendarDays = 370,
): HistoricalCandle[] {
  const combined = normalizeAndValidateCandles([
    ...existingCandles,
    ...incomingCandles,
  ]);
  if (combined.length === 0) return [];

  const latestDateStr = combined[combined.length - 1]!.date;
  const latestMs = Date.parse(`${latestDateStr}T00:00:00Z`);
  if (!Number.isFinite(latestMs)) return combined;

  const cutoffMs = latestMs - maxCalendarDays * 24 * 60 * 60 * 1000;
  const cutoffDateStr = new Date(cutoffMs).toISOString().slice(0, 10);

  return combined.filter((c) => c.date >= cutoffDateStr);
}

/**
 * Computes 1-year summary statistics directly from loaded historical candles.
 */
export function computeHistoricalSummaryStats(
  candles: HistoricalCandle[],
): HistoricalSummaryStats | null {
  const valid = normalizeAndValidateCandles(candles);
  if (valid.length === 0) return null;

  let minLow = valid[0]!.low;
  let maxHigh = valid[0]!.high;
  for (const c of valid) {
    if (c.low < minLow) minLow = c.low;
    if (c.high > maxHigh) maxHigh = c.high;
  }

  const firstClose = valid[0]!.close;
  const latestClose = valid[valid.length - 1]!.close;
  const changeAbsolute = roundMoney(latestClose - firstClose);
  const changePercent =
    firstClose > 0
      ? roundMoney(((latestClose - firstClose) / firstClose) * 100)
      : 0;

  return {
    minLow: roundMoney(minLow),
    maxHigh: roundMoney(maxHigh),
    firstClose: roundMoney(firstClose),
    latestClose: roundMoney(latestClose),
    changeAbsolute,
    changePercent,
    startDate: valid[0]!.date,
    endDate: valid[valid.length - 1]!.date,
    candleCount: valid.length,
  };
}

function parseNasdaqVolume(raw: unknown): number | null {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw >= 0 ? Math.round(raw) : null;
  }
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().replace(/[,\s]/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
}

/**
 * Parses daily OHLC rows from Nasdaq's public historical endpoint:
 * https://api.nasdaq.com/api/quote/{SYMBOL}/historical?assetclass=stocks&fromdate=YYYY-MM-DD&limit=365&todate=YYYY-MM-DD
 */
export function parseNasdaqHistoricalPayload(
  payload: unknown,
  expectedSymbol: string,
): HistoricalCandle[] {
  if (!payload || typeof payload !== 'object') {
    throw new MarketProviderError(
      'INVALID_QUOTE_DATA',
      `Ungültige historische Nasdaq-Antwort für ${expectedSymbol}.`,
    );
  }

  const root = payload as {
    data?: {
      tradesTable?: {
        rows?: Array<{
          date?: unknown;
          open?: unknown;
          high?: unknown;
          low?: unknown;
          close?: unknown;
          volume?: unknown;
        }> | null;
      } | null;
    } | null;
  };

  const rows = root.data?.tradesTable?.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new MarketProviderError(
      'INVALID_QUOTE_DATA',
      `Keine historischen Kerzendaten von Nasdaq für ${expectedSymbol}.`,
    );
  }

  const rawCandles: unknown[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const date = normalizeHistoricalDate(row.date);
    const open = parseNasdaqPrice(row.open);
    const high = parseNasdaqPrice(row.high);
    const low = parseNasdaqPrice(row.low);
    const close = parseNasdaqPrice(row.close);
    const volume = parseNasdaqVolume(row.volume);

    if (
      !date ||
      open === null ||
      high === null ||
      low === null ||
      close === null
    ) {
      continue;
    }

    rawCandles.push({
      date,
      open,
      high,
      low,
      close,
      ...(volume !== null ? { volume } : {}),
    });
  }

  const validated = normalizeAndValidateCandles(rawCandles);
  if (validated.length === 0) {
    throw new MarketProviderError(
      'INVALID_QUOTE_DATA',
      `Keine gültigen OHLC-Kerzen in der Nasdaq-Historie für ${expectedSymbol}.`,
    );
  }
  return validated;
}

/**
 * Parses daily OHLC arrays from Börse Frankfurt's public TradingView history endpoint:
 * https://api.boerse-frankfurt.de/v1/tradingview/history?symbol={MIC}:{ISIN}&resolution=1D&from={UNIX_SEC}&to={UNIX_SEC}
 */
export function parseBoerseFrankfurtHistoricalPayload(
  payload: unknown,
  expectedIsin: string,
): HistoricalCandle[] {
  if (!payload || typeof payload !== 'object') {
    throw new MarketProviderError(
      'INVALID_QUOTE_DATA',
      `Ungültige historische Börse-Frankfurt-Antwort für ${expectedIsin}.`,
    );
  }

  const data = payload as {
    s?: unknown;
    t?: unknown[];
    o?: unknown[];
    h?: unknown[];
    l?: unknown[];
    c?: unknown[];
    v?: unknown[];
  };

  if (
    data.s !== 'ok' ||
    !Array.isArray(data.t) ||
    !Array.isArray(data.o) ||
    !Array.isArray(data.h) ||
    !Array.isArray(data.l) ||
    !Array.isArray(data.c) ||
    data.t.length === 0
  ) {
    throw new MarketProviderError(
      'INVALID_QUOTE_DATA',
      `Keine historischen OHLC-Daten von Börse Frankfurt für ${expectedIsin}.`,
    );
  }

  const len = Math.min(
    data.t.length,
    data.o.length,
    data.h.length,
    data.l.length,
    data.c.length,
  );

  const rawCandles: unknown[] = [];
  for (let i = 0; i < len; i++) {
    const tsSec = data.t[i];
    const open = data.o[i];
    const high = data.h[i];
    const low = data.l[i];
    const close = data.c[i];
    const vol = Array.isArray(data.v) ? data.v[i] : undefined;

    if (typeof tsSec !== 'number' || !Number.isFinite(tsSec) || tsSec <= 0) {
      continue;
    }
    const date = new Date(tsSec * 1000).toISOString().slice(0, 10);
    const volume =
      typeof vol === 'number' && Number.isFinite(vol) && vol >= 0
        ? Math.round(vol)
        : null;

    rawCandles.push({
      date,
      open,
      high,
      low,
      close,
      ...(volume !== null ? { volume } : {}),
    });
  }

  const validated = normalizeAndValidateCandles(rawCandles);
  if (validated.length === 0) {
    throw new MarketProviderError(
      'INVALID_QUOTE_DATA',
      `Keine validen OHLC-Kerzen von Börse Frankfurt für ${expectedIsin}.`,
    );
  }
  return validated;
}

export async function fetchNasdaqHistoricalCandles(
  asset: MarketAsset,
  fromDate: string,
  toDate: string,
  options?: {
    fetchFn?: typeof fetch;
    timeoutMs?: number;
    allowedSymbols?: ReadonlySet<string>;
  },
): Promise<HistoricalCandle[]> {
  const symbol = (asset.symbol ?? asset.id).trim().toUpperCase();
  if (!isCuratedNasdaqSymbol(symbol, options?.allowedSymbols)) {
    throw new MarketProviderError(
      'UNCURATED_ASSET',
      `Symbol ${symbol} ist nicht Teil des kuratierten Bildungskatalogs.`,
    );
  }

  const fetchImpl = options?.fetchFn ?? fetch;
  const timeoutMs = options?.timeoutMs ?? 12000;
  const url = `https://api.nasdaq.com/api/quote/${encodeURIComponent(symbol)}/historical?assetclass=stocks&fromdate=${encodeURIComponent(fromDate)}&limit=365&todate=${encodeURIComponent(toDate)}`;

  let res: Response;
  try {
    res = await fetchImpl(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new MarketProviderError(
      'TIMEOUT',
      err instanceof Error
        ? `Nasdaq-Historie fehlgeschlagen: ${err.message}`
        : 'Nasdaq-Historie durch Zeitüberschreitung abgebrochen.',
    );
  }

  if (!res.ok) {
    throw new MarketProviderError(
      'NASDAQ_HTTP_ERROR',
      `Nasdaq-Historie nicht verfügbar (HTTP ${res.status}) für ${symbol}.`,
      res.status,
    );
  }

  let jsonPayload: unknown;
  try {
    jsonPayload = await res.json();
  } catch {
    throw new MarketProviderError(
      'MALFORMED_JSON',
      `Ungültiges JSON in Nasdaq-Historie für ${symbol}.`,
    );
  }

  return parseNasdaqHistoricalPayload(jsonPayload, symbol);
}

export async function fetchBoerseFrankfurtHistoricalCandles(
  asset: MarketAsset,
  fromDate: string,
  toDate: string,
  options?: {
    fetchFn?: typeof fetch;
    timeoutMs?: number;
    allowedIsins?: ReadonlySet<string>;
  },
): Promise<HistoricalCandle[]> {
  const isin = (asset.isin ?? '').trim().toUpperCase();
  const venue: TradingVenue = asset.venue === 'XFRA' ? 'XFRA' : 'XETR';

  if (!isCuratedBoerseIsin(isin, options?.allowedIsins)) {
    throw new MarketProviderError(
      'UNCURATED_ASSET',
      `ISIN ${isin} ist nicht im kuratierten Bildungskatalog enthalten.`,
    );
  }

  const fromSec = Math.floor(Date.parse(`${fromDate}T00:00:00Z`) / 1000);
  const toSec = Math.floor(Date.parse(`${toDate}T23:59:59Z`) / 1000);
  const fetchImpl = options?.fetchFn ?? fetch;
  const timeoutMs = options?.timeoutMs ?? 15000;
  const symbolParam = `${venue}:${isin}`;
  const url = `https://api.boerse-frankfurt.de/v1/tradingview/history?symbol=${encodeURIComponent(symbolParam)}&resolution=1D&from=${fromSec}&to=${toSec}`;

  let res: Response;
  try {
    res = await fetchImpl(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new MarketProviderError(
      'TIMEOUT',
      err instanceof Error
        ? `Börse-Frankfurt-Historie fehlgeschlagen: ${err.message}`
        : 'Börse-Frankfurt-Historie durch Zeitüberschreitung abgebrochen.',
    );
  }

  if (!res.ok) {
    throw new MarketProviderError(
      'BOERSE_FRANKFURT_HTTP_ERROR',
      `Börse-Frankfurt-Historie nicht verfügbar (HTTP ${res.status}) für ${isin}.`,
      res.status,
    );
  }

  let jsonPayload: unknown;
  try {
    jsonPayload = await res.json();
  } catch {
    throw new MarketProviderError(
      'MALFORMED_JSON',
      `Ungültiges JSON in Börse-Frankfurt-Historie für ${isin}.`,
    );
  }

  return parseBoerseFrankfurtHistoricalPayload(jsonPayload, isin);
}

/**
 * Validates and normalizes a loaded `public/market-history.json` snapshot.
 */
export function parseMarketHistorySnapshot(
  raw: unknown,
): MarketHistorySnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.histories)) return null;

  const generatedAt =
    typeof obj.generatedAt === 'string' && obj.generatedAt.trim()
      ? obj.generatedAt
      : new Date().toISOString();

  const histories: AssetHistory[] = [];
  for (const item of obj.histories) {
    if (!item || typeof item !== 'object') continue;
    const h = item as Record<string, unknown>;
    const assetId =
      typeof h.assetId === 'string' ? h.assetId.trim() : '';
    if (!assetId) continue;

    const currency: SupportedCurrency =
      h.currency === 'USD' ? 'USD' : 'EUR';
    const priceCurrency: SupportedCurrency =
      h.priceCurrency === 'USD' ? 'USD' : currency;
    const source: HistoricalDataSource =
      h.source === 'nasdaq-prototype'
        ? 'nasdaq-prototype'
        : 'boerse-frankfurt-prototype';
    const candles = Array.isArray(h.candles)
      ? normalizeAndValidateCandles(h.candles)
      : [];
    const status: 'available' | 'stale' | 'unavailable' =
      candles.length === 0
        ? 'unavailable'
        : h.status === 'stale'
          ? 'stale'
          : 'available';

    histories.push({
      assetId,
      currency,
      priceCurrency,
      source,
      range: '1Y',
      interval: '1D',
      generatedAt:
        typeof h.generatedAt === 'string' && h.generatedAt.trim()
          ? h.generatedAt
          : generatedAt,
      candles,
      status,
    });
  }

  return {
    generatedAt,
    histories,
  };
}

export interface GenerateMarketHistorySnapshotOptions {
  previousHistorySnapshot?: MarketHistorySnapshot | null;
  referenceEndDate?: string;
  fetchFn?: typeof fetch;
  nowFn?: () => Date;
  concurrency?: number;
  timeoutMs?: number;
  assets?: MarketAsset[];
  forceFullRefresh?: boolean;
}

/**
 * Generates or incrementally updates `public/market-history.json`.
 * - Deduplicates assets so each unique upstream instrument is queried at most once;
 * - Uses incremental range requests when a previous valid 1-year history exists (>= 180 candles);
 * - Validates, deduplicates, and sorts every candle chronologically;
 * - Preserves previous valid history as `stale` if the daily update fails;
 * - Never fabricates or substitutes demo candles.
 */
export async function generateMarketHistorySnapshot(
  options: GenerateMarketHistorySnapshotOptions = {},
): Promise<MarketHistorySnapshot> {
  const nowFn = options.nowFn ?? (() => new Date());
  const now = nowFn();
  const generatedAt = now.toISOString();
  const toDate =
    options.referenceEndDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(options.referenceEndDate)
      ? options.referenceEndDate
      : generatedAt.slice(0, 10);
  const toMs = Date.parse(`${toDate}T00:00:00Z`);
  const fullFromDate = new Date(toMs - 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const assets = (options.assets ?? CURATED_MARKET_ASSETS).filter(
    (a) =>
      a.assetType !== 'cash' &&
      (a.source === 'nasdaq-prototype' ||
        a.source === 'boerse-frankfurt-prototype'),
  );
  const priorMap = new Map<string, AssetHistory>();
  for (const h of options.previousHistorySnapshot?.histories ?? []) {
    if (h.candles.length > 0 && h.status !== 'unavailable') {
      priorMap.set(h.assetId.toUpperCase(), h);
    }
  }

  const concurrency = options.concurrency ?? 4;
  const settled = await runWithConcurrencyLimit(
    assets,
    concurrency,
    async (asset): Promise<{ asset: MarketAsset; candles: HistoricalCandle[] }> => {
      const prior = priorMap.get(asset.id.toUpperCase());
      let queryFromDate = fullFromDate;

      if (
        !options.forceFullRefresh &&
        prior &&
        prior.candles.length >= 180
      ) {
        const lastCandleDate = prior.candles[prior.candles.length - 1]!.date;
        const lastMs = Date.parse(`${lastCandleDate}T00:00:00Z`);
        if (Number.isFinite(lastMs)) {
          // Request 7 days overlap to safely cover weekends/holidays and revisions
          const incrementalFrom = new Date(lastMs - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10);
          if (incrementalFrom > fullFromDate && incrementalFrom <= toDate) {
            queryFromDate = incrementalFrom;
          }
        }
      }

      if (asset.source === 'nasdaq-prototype') {
        const fetched = await fetchNasdaqHistoricalCandles(
          asset,
          queryFromDate,
          toDate,
          {
            fetchFn: options.fetchFn,
            timeoutMs: options.timeoutMs,
          },
        );
        return {
          asset,
          candles: prior
            ? mergeAndTrimHistoricalCandles(prior.candles, fetched)
            : mergeAndTrimHistoricalCandles([], fetched),
        };
      }

      const fetched = await fetchBoerseFrankfurtHistoricalCandles(
        asset,
        queryFromDate,
        toDate,
        {
          fetchFn: options.fetchFn,
          timeoutMs: options.timeoutMs,
        },
      );
      return {
        asset,
        candles: prior
          ? mergeAndTrimHistoricalCandles(prior.candles, fetched)
          : mergeAndTrimHistoricalCandles([], fetched),
      };
    },
  );

  const histories: AssetHistory[] = settled.map((res, idx) => {
    const asset = assets[idx]!;
    const prior = priorMap.get(asset.id.toUpperCase());
    const source: HistoricalDataSource =
      asset.source === 'nasdaq-prototype'
        ? 'nasdaq-prototype'
        : 'boerse-frankfurt-prototype';

    if (res.status === 'fulfilled' && res.value.candles.length > 0) {
      return {
        assetId: asset.id,
        currency: asset.quoteCurrency,
        priceCurrency: asset.quoteCurrency,
        source,
        range: '1Y',
        interval: '1D',
        generatedAt,
        candles: res.value.candles,
        status: 'available',
      };
    }

    if (prior && prior.candles.length > 0) {
      return {
        ...prior,
        assetId: asset.id,
        currency: asset.quoteCurrency,
        priceCurrency: asset.quoteCurrency,
        source,
        range: '1Y',
        interval: '1D',
        status: 'stale',
      };
    }

    return {
      assetId: asset.id,
      currency: asset.quoteCurrency,
      priceCurrency: asset.quoteCurrency,
      source,
      range: '1Y',
      interval: '1D',
      generatedAt,
      candles: [],
      status: 'unavailable',
    };
  });

  return {
    generatedAt,
    histories,
  };
}


