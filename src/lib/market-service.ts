import {
  CURATED_MARKET_ASSETS,
  DEMO_STATUS_LABEL,
  getDemoExchangeRate,
  getDemoInstrumentMetadata,
  getDemoQuote,
  searchDemoInstruments,
} from './market-demo-adapter';
import {
  normalizeAndValidateCandles,
  parseMarketHistorySnapshot,
  parseStaticMarketSnapshot,
} from './market-providers';
import type {
  AssetHistory,
  ExchangeRateQuote,
  HistoricalRange,
  HistoricalSeries,
  InstrumentAssetType,
  InstrumentMetadata,
  MarketDataService,
  MarketDataStatus,
  MarketHistorySnapshot,
  MarketQuote,
  MarketServiceErrorCode,
  NormalizedQuoteStatus,
  ProviderStatusInfo,
  SharedQuoteCache,
  SupportedCurrency,
} from './market-types';

export const VIRTUAL_DEPOT_NOTICE = 'Virtuelles Übungsdepot – keine echten Käufe.';

export const MARKET_DATA_SIMULATION_NOTICE =
  'Kursstand: letzter verfügbarer Börsenkurs. Die Kurse sind nicht zwingend in Echtzeit und dienen ausschließlich der Simulation.';

export const FALLBACK_QUOTE_NOTICE =
  'Demowert aus der Ausgangsversion, kein aktueller Börsenkurs.';

export const UNAVAILABLE_HISTORY_NOTICE =
  'Für dieses Wertpapier stehen in der Prototyp-Version keine verlässlichen historischen Kursdaten zur Verfügung.';

export const HISTORICAL_NO_FORECAST_NOTICE =
  'Historische Kursentwicklung, keine Prognose.';

export function getDefaultStaticSnapshotUrl(): string {
  const baseUrl =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    typeof import.meta.env.BASE_URL === 'string'
      ? import.meta.env.BASE_URL
      : '/';
  return `${baseUrl}market-prices.json`;
}

export function resolveStaticSnapshotUrl(baseUrl?: string): string {
  if (typeof baseUrl === 'string' && baseUrl.length > 0) {
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return `${normalizedBase}market-prices.json`;
  }
  return getDefaultStaticSnapshotUrl();
}

export function getDefaultStaticHistorySnapshotUrl(): string {
  const baseUrl =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    typeof import.meta.env.BASE_URL === 'string'
      ? import.meta.env.BASE_URL
      : '/';
  return `${baseUrl}market-history.json`;
}

export function resolveStaticHistorySnapshotUrl(baseUrl?: string): string {
  if (typeof baseUrl === 'string' && baseUrl.length > 0) {
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return `${normalizedBase}market-history.json`;
  }
  return getDefaultStaticHistorySnapshotUrl();
}

export function formatStaleQuoteNotice(marketTimeOrDate?: string | null): string {
  const formattedDate = formatGermanDateLabel(marketTimeOrDate);
  return `Letzter verfügbarer Kurs vom ${formattedDate}. Die heutige Aktualisierung war nicht möglich.`;
}

export function formatGermanDateLabel(isoOrDate?: string | null): string {
  if (!isoOrDate) {
    return new Date().toLocaleDateString('de-DE');
  }
  const parsed = new Date(isoOrDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoOrDate;
  }
  return parsed.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export class MarketServiceException extends Error {
  readonly code: MarketServiceErrorCode;
  readonly retryAfterSeconds?: number;

  constructor(code: MarketServiceErrorCode, message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = 'MarketServiceException';
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function formatMarketDataStatusBadge(
  status: MarketDataStatus | NormalizedQuoteStatus,
  isDemo?: boolean,
  marketTimeOrDate?: string | null,
): {
  shortText: string;
  detailText: string;
  tone: 'demo' | 'live' | 'delayed' | 'cached' | 'unavailable';
} {
  if (status === 'fallback' || isDemo || status === 'demo') {
    return {
      shortText: DEMO_STATUS_LABEL,
      detailText: FALLBACK_QUOTE_NOTICE,
      tone: 'demo',
    };
  }

  if (status === 'stale') {
    return {
      shortText: `Veralteter Kurs (${formatGermanDateLabel(marketTimeOrDate)})`,
      detailText: formatStaleQuoteNotice(marketTimeOrDate),
      tone: 'cached',
    };
  }

  switch (status) {
    case 'available':
    case 'live':
    case 'real-time':
      return {
        shortText: 'Aktueller Börsenkurs (verzögert)',
        detailText: MARKET_DATA_SIMULATION_NOTICE,
        tone: 'live',
      };
    case 'delayed':
      return {
        shortText: 'Verzögerte Börsenkurse',
        detailText: MARKET_DATA_SIMULATION_NOTICE,
        tone: 'delayed',
      };
    case 'end-of-day':
      return {
        shortText: 'Tagesschlusskurs (End-of-Day)',
        detailText: MARKET_DATA_SIMULATION_NOTICE,
        tone: 'delayed',
      };
    case 'cached':
      return {
        shortText: 'Zwischengespeicherter Tageskurs',
        detailText: MARKET_DATA_SIMULATION_NOTICE,
        tone: 'cached',
      };
    case 'unavailable':
    default:
      return {
        shortText: 'Kursdaten derzeit nicht verfügbar',
        detailText: 'Für dieses Wertpapier konnte aktuell kein Marktpreis abgerufen werden.',
        tone: 'unavailable',
      };
  }
}

const CATALOGUE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes client-side shared snapshot TTL
let sharedCatalogueSnapshot: { data: SharedQuoteCache; fetchedAtMs: number } | null = null;
let pendingCataloguePromise: Promise<SharedQuoteCache> | null = null;
let sharedHistorySnapshot: { data: MarketHistorySnapshot; fetchedAtMs: number } | null = null;
let pendingHistoryPromise: Promise<MarketHistorySnapshot | null> | null = null;
const quoteCache = new Map<string, { quote: MarketQuote; fetchedAtMs: number }>();
const fxCache = new Map<string, { fx: ExchangeRateQuote; fetchedAtMs: number }>();
let cachedProviderStatus: ProviderStatusInfo | null = null;

export function clearMarketClientCache(): void {
  sharedCatalogueSnapshot = null;
  pendingCataloguePromise = null;
  sharedHistorySnapshot = null;
  pendingHistoryPromise = null;
  quoteCache.clear();
  fxCache.clear();
  cachedProviderStatus = null;
}

function buildOfflineCatalogueFallback(): SharedQuoteCache {
  const nowIso = new Date().toISOString();
  const dateKey = nowIso.slice(0, 10);
  const demoFx = getDemoExchangeRate('USD', 'EUR');
  const quotes: Record<string, MarketQuote> = {};
  const quoteList: MarketQuote[] = [];

  for (const asset of CURATED_MARKET_ASSETS) {
    if (asset.assetType === 'cash') {
      const cashQuote: MarketQuote = {
        assetId: asset.id,
        symbol: asset.id,
        price: 1,
        priceEur: 1,
        fxRateToEur: 1,
        fxReferenceDate: dateKey,
        previousClose: 1,
        changeAbsolute: 0,
        changePercent: 0,
        currency: 'EUR',
        exchange: 'EUR',
        marketTime: nowIso,
        fetchedAt: nowIso,
        timestamp: nowIso,
        source: 'manual-demo',
        status: 'available',
        legacyStatus: 'real-time',
        providerName: 'Virtuelles Bargeld (EUR)',
        isDemo: false,
      };
      quotes[asset.id] = cashQuote;
      quoteList.push(cashQuote);
      continue;
    }

    const q = getDemoQuote(asset.id);
    if (q) {
      quotes[asset.id] = q;
      quotes[asset.id.toUpperCase()] = q;
      quoteList.push(q);
    }
  }

  return {
    quotes,
    quoteList,
    records: [],
    fxRateUsdToEur: demoFx.rate,
    fxReferenceDate: dateKey,
    fxStatus: 'fallback',
    fetchedAt: nowIso,
    cacheDateKey: dateKey,
    expiresAt: Date.now() + CATALOGUE_CACHE_TTL_MS,
    refreshCount: 1,
  };
}

function deriveProviderStatusFromSnapshot(snapshot: SharedQuoteCache): ProviderStatusInfo {
  const nonCashQuotes = (snapshot.quoteList ?? Object.values(snapshot.quotes)).filter(
    (q) => q.assetId !== 'EUR-CASH' && q.symbol !== 'EUR-CASH',
  );
  const hasStaleQuotes = nonCashQuotes.some((q) => q.status === 'stale');
  const hasFallbackQuotes = nonCashQuotes.some((q) => q.status === 'fallback' || q.isDemo);
  const allFallback = nonCashQuotes.length > 0 && nonCashQuotes.every((q) => q.status === 'fallback' || q.isDemo);

  if (allFallback) {
    return {
      mode: 'demo',
      configured: false,
      providerName: DEMO_STATUS_LABEL,
      defaultStatus: 'demo',
      statusLabel: DEMO_STATUS_LABEL,
      disclaimerLabel: FALLBACK_QUOTE_NOTICE,
      lastCheckedAt: snapshot.fetchedAt ?? new Date().toISOString(),
      fxRateUsdToEur: snapshot.fxRateUsdToEur,
      fxReferenceDate: snapshot.fxReferenceDate,
      hasStaleQuotes: false,
      hasFallbackQuotes: true,
    };
  }

  return {
    mode: 'live_provider',
    configured: true,
    providerName: 'Börse Frankfurt & Nasdaq (Prototyp-Marktdaten)',
    defaultStatus: hasStaleQuotes ? 'stale' : 'delayed',
    statusLabel: 'Verzögerte Börsenkurse (Börse Frankfurt / Nasdaq / EZB-Wechselkurs)',
    disclaimerLabel: MARKET_DATA_SIMULATION_NOTICE,
    lastCheckedAt: snapshot.fetchedAt ?? new Date().toISOString(),
    fxRateUsdToEur: snapshot.fxRateUsdToEur,
    fxReferenceDate: snapshot.fxReferenceDate,
    hasStaleQuotes,
    hasFallbackQuotes,
  };
}

export interface MarketServiceConfigOptions {
  fetchFn?: typeof fetch;
  baseUrl?: string;
}

class DefaultMarketDataService implements MarketDataService {
  private forcedSimulatedError: MarketServiceErrorCode | null = null;
  private readonly fetchImpl: typeof fetch;
  private readonly customBaseUrl?: string;
  private readonly usesGlobalCache: boolean;
  private localSnapshot: { data: SharedQuoteCache; fetchedAtMs: number } | null = null;
  private localHistorySnapshot: { data: MarketHistorySnapshot; fetchedAtMs: number } | null = null;
  private localProviderStatus: ProviderStatusInfo | null = null;

  constructor(options?: MarketServiceConfigOptions) {
    this.fetchImpl = options?.fetchFn ?? ((...args) => fetch(...args));
    this.customBaseUrl = options?.baseUrl;
    this.usesGlobalCache = !options;
  }

  private getSnapshotUrl(): string {
    if (typeof this.customBaseUrl === 'string' && this.customBaseUrl.length > 0) {
      return resolveStaticSnapshotUrl(this.customBaseUrl);
    }
    return typeof import.meta !== 'undefined' &&
      import.meta.env &&
      typeof import.meta.env.BASE_URL === 'string'
      ? `${import.meta.env.BASE_URL}market-prices.json`
      : '/market-prices.json';
  }

  private getHistorySnapshotUrl(): string {
    if (typeof this.customBaseUrl === 'string' && this.customBaseUrl.length > 0) {
      return resolveStaticHistorySnapshotUrl(this.customBaseUrl);
    }
    return typeof import.meta !== 'undefined' &&
      import.meta.env &&
      typeof import.meta.env.BASE_URL === 'string'
      ? `${import.meta.env.BASE_URL}market-history.json`
      : '/market-history.json';
  }

  public setSimulatedErrorState(code: MarketServiceErrorCode | null): void {
    this.forcedSimulatedError = code;
  }

  public getSimulatedErrorState(): MarketServiceErrorCode | null {
    return this.forcedSimulatedError;
  }

  private checkSimulatedError(): void {
    if (!this.forcedSimulatedError) return;
    switch (this.forcedSimulatedError) {
      case 'RATE_LIMIT':
        throw new MarketServiceException(
          'RATE_LIMIT',
          'Abfragelimit des Kursdatenanbieters erreicht (Rate-Limit). Bitte warte einen Moment vor der nächsten Aktualisierung.',
          60,
        );
      case 'OFFLINE':
        throw new MarketServiceException(
          'OFFLINE',
          'Keine Internetverbindung erkannt. Es werden die zuletzt lokal gespeicherten Kurse angezeigt.',
        );
      case 'PROVIDER_ERROR':
        throw new MarketServiceException(
          'PROVIDER_ERROR',
          'Der externe Marktdaten-Dienst antwortet derzeit nicht. Es werden keine gefälschten Live-Kurse erzeugt.',
        );
      case 'UNSUPPORTED_SYMBOL':
        throw new MarketServiceException(
          'UNSUPPORTED_SYMBOL',
          'Dieses Wertpapier-Symbol wird vom Kursdatenanbieter im aktuellen Tarif nicht unterstützt.',
        );
      case 'STALE_DATA':
        throw new MarketServiceException(
          'STALE_DATA',
          'Die abgerufenen Marktdaten sind älter als erwartet (veralteter Datenstand).',
        );
    }
  }

  private applyLoadedSnapshot(payload: SharedQuoteCache): SharedQuoteCache {
    const nowMs = Date.now();
    const derivedStatus = deriveProviderStatusFromSnapshot(payload);
    if (this.usesGlobalCache) {
      sharedCatalogueSnapshot = { data: payload, fetchedAtMs: nowMs };
      cachedProviderStatus = derivedStatus;
      for (const [key, q] of Object.entries(payload.quotes)) {
        quoteCache.set(key.toUpperCase(), { quote: q, fetchedAtMs: nowMs });
      }
      const isFallback = payload.fxStatus === 'fallback';
      const fxQuote: ExchangeRateQuote = {
        from: 'USD',
        to: 'EUR',
        rate: payload.fxRateUsdToEur,
        date: payload.fxReferenceDate,
        timestamp: payload.fetchedAt ?? new Date().toISOString(),
        source: isFallback
          ? DEMO_STATUS_LABEL
          : 'Frankfurter EZB-Referenzkurs (USD/EUR)',
        status: isFallback ? 'fallback' : 'delayed',
        isDemo: isFallback,
      };
      fxCache.set('USD_EUR', { fx: fxQuote, fetchedAtMs: nowMs });
    } else {
      this.localSnapshot = { data: payload, fetchedAtMs: nowMs };
      this.localProviderStatus = derivedStatus;
    }
    return payload;
  }

  async getCatalogueSnapshot(options?: { forceRefresh?: boolean }): Promise<SharedQuoteCache> {
    this.checkSimulatedError();
    const now = Date.now();
    const currentCached = this.usesGlobalCache ? sharedCatalogueSnapshot : this.localSnapshot;

    if (
      !options?.forceRefresh &&
      currentCached &&
      now - currentCached.fetchedAtMs < CATALOGUE_CACHE_TTL_MS
    ) {
      return currentCached.data;
    }

    if (this.usesGlobalCache && !options?.forceRefresh && pendingCataloguePromise) {
      return pendingCataloguePromise;
    }

    const loadTask = (async () => {
      // Priority A: Same-origin /api/market/quotes when available in AI Studio or local full-stack dev
      try {
        const res = await this.fetchImpl('/api/market/quotes', {
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const payload = parseStaticMarketSnapshot(await res.json());
          if (payload) {
            return this.applyLoadedSnapshot(payload);
          }
        }
      } catch {
        // Fall through to Priority B (static snapshot)
      }

      // Priority B: Static snapshot generated for GitHub Pages (`${import.meta.env.BASE_URL}market-prices.json`)
      try {
        const snapshotUrl = this.getSnapshotUrl();
        const staticRes = await this.fetchImpl(snapshotUrl, {
          headers: { Accept: 'application/json' },
        });
        if (staticRes.ok) {
          const staticPayload = parseStaticMarketSnapshot(await staticRes.json());
          if (staticPayload) {
            return this.applyLoadedSnapshot(staticPayload);
          }
        }
      } catch {
        // Fall through to Priority C (demo fallback)
      }

      if (currentCached) {
        return currentCached.data;
      }

      // Priority C: Clearly labelled educational demo fallback
      const fallback = buildOfflineCatalogueFallback();
      return this.applyLoadedSnapshot(fallback);
    })();

    if (!this.usesGlobalCache) {
      return loadTask;
    }

    pendingCataloguePromise = loadTask;
    try {
      return await pendingCataloguePromise;
    } finally {
      pendingCataloguePromise = null;
    }
  }

  async getCatalogueQuotes(options?: {
    forceRefresh?: boolean;
  }): Promise<Record<string, MarketQuote>> {
    const snapshot = await this.getCatalogueSnapshot(options);
    return snapshot.quotes;
  }

  async getProviderStatus(): Promise<ProviderStatusInfo> {
    const currentStatus = this.usesGlobalCache ? cachedProviderStatus : this.localProviderStatus;
    if (currentStatus) {
      return currentStatus;
    }

    const snapshot = await this.getCatalogueSnapshot();
    const derived = deriveProviderStatusFromSnapshot(snapshot);
    if (this.usesGlobalCache) {
      cachedProviderStatus = derived;
    } else {
      this.localProviderStatus = derived;
    }
    return derived;
  }

  async searchInstruments(
    query: string,
    filterType: InstrumentAssetType | 'ALL' = 'ALL',
  ): Promise<InstrumentMetadata[]> {
    this.checkSimulatedError();
    return searchDemoInstruments(query, filterType);
  }

  async getInstrumentDetails(symbol: string): Promise<InstrumentMetadata | null> {
    this.checkSimulatedError();
    return getDemoInstrumentMetadata(symbol);
  }

  async getQuote(
    symbol: string,
    options?: { forceRefresh?: boolean },
  ): Promise<MarketQuote> {
    this.checkSimulatedError();
    const normalized = symbol.trim().toUpperCase();
    const now = Date.now();

    if (!options?.forceRefresh) {
      const cached = quoteCache.get(normalized);
      if (cached && now - cached.fetchedAtMs < CATALOGUE_CACHE_TTL_MS) {
        return cached.quote;
      }
    }

    const catalogue = await this.getCatalogueSnapshot(options);
    const quoteFromCatalogue =
      catalogue.quotes[normalized] ??
      Object.values(catalogue.quotes).find(
        (q) => q.symbol.toUpperCase() === normalized || q.assetId.toUpperCase() === normalized,
      );

    if (quoteFromCatalogue) {
      quoteCache.set(normalized, { quote: quoteFromCatalogue, fetchedAtMs: now });
      return quoteFromCatalogue;
    }

    const demoQuote = getDemoQuote(normalized);
    if (!demoQuote) {
      throw new MarketServiceException(
        'UNSUPPORTED_SYMBOL',
        `Das Wertpapier „${normalized}“ ist im kuratierten Bildungskatalog nicht enthalten.`,
      );
    }
    quoteCache.set(normalized, { quote: demoQuote, fetchedAtMs: now });
    return demoQuote;
  }

  async getBatchQuotes(
    symbols: string[],
    options?: { forceRefresh?: boolean },
  ): Promise<Record<string, MarketQuote>> {
    this.checkSimulatedError();
    const unique = Array.from(
      new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean)),
    );
    const catalogue = await this.getCatalogueSnapshot(options);
    const result: Record<string, MarketQuote> = {};

    for (const sym of unique) {
      const found =
        catalogue.quotes[sym] ??
        Object.values(catalogue.quotes).find(
          (q) => q.symbol.toUpperCase() === sym || q.assetId.toUpperCase() === sym,
        ) ??
        getDemoQuote(sym);
      if (found) {
        result[sym] = found;
      }
    }
    return result;
  }

  async getHistorySnapshot(options?: {
    forceRefresh?: boolean;
  }): Promise<MarketHistorySnapshot | null> {
    this.checkSimulatedError();
    const now = Date.now();
    const currentCached = this.usesGlobalCache
      ? sharedHistorySnapshot
      : this.localHistorySnapshot;

    if (
      !options?.forceRefresh &&
      currentCached &&
      now - currentCached.fetchedAtMs < CATALOGUE_CACHE_TTL_MS
    ) {
      return currentCached.data;
    }

    if (this.usesGlobalCache && !options?.forceRefresh && pendingHistoryPromise) {
      return pendingHistoryPromise;
    }

    const loadTask = (async (): Promise<MarketHistorySnapshot | null> => {
      // Priority A: Same-origin /api/market/history when available in AI Studio or local full-stack dev
      try {
        const apiRes = await this.fetchImpl('/api/market/history', {
          headers: { Accept: 'application/json' },
        });
        if (apiRes.ok) {
          const parsed = parseMarketHistorySnapshot(await apiRes.json());
          if (parsed && parsed.histories.length > 0) {
            if (this.usesGlobalCache) {
              sharedHistorySnapshot = { data: parsed, fetchedAtMs: Date.now() };
            } else {
              this.localHistorySnapshot = {
                data: parsed,
                fetchedAtMs: Date.now(),
              };
            }
            return parsed;
          }
        }
      } catch {
        // Fall through to Priority B (static market-history.json)
      }

      // Priority B: Static snapshot (`${import.meta.env.BASE_URL}market-history.json`)
      try {
        const historyUrl = this.getHistorySnapshotUrl();
        const staticRes = await this.fetchImpl(historyUrl, {
          headers: { Accept: 'application/json' },
        });
        if (staticRes.ok) {
          const parsed = parseMarketHistorySnapshot(await staticRes.json());
          if (parsed) {
            if (this.usesGlobalCache) {
              sharedHistorySnapshot = { data: parsed, fetchedAtMs: Date.now() };
            } else {
              this.localHistorySnapshot = {
                data: parsed,
                fetchedAtMs: Date.now(),
              };
            }
            return parsed;
          }
        }
      } catch {
        // Fall through
      }

      if (currentCached) {
        return currentCached.data;
      }

      return null;
    })();

    if (!this.usesGlobalCache) {
      return loadTask;
    }

    pendingHistoryPromise = loadTask;
    try {
      return await pendingHistoryPromise;
    } finally {
      pendingHistoryPromise = null;
    }
  }

  async getAssetHistory(symbol: string): Promise<AssetHistory | null> {
    this.checkSimulatedError();
    const normalized = symbol.trim().toUpperCase();
    const meta = getDemoInstrumentMetadata(normalized);
    if (!meta) return null;

    const snapshot = await this.getHistorySnapshot();
    const found = snapshot?.histories.find(
      (h) => h.assetId.toUpperCase() === normalized || h.assetId.toUpperCase() === meta.id.toUpperCase(),
    );

    if (found) {
      const validCandles = normalizeAndValidateCandles(found.candles);
      return {
        ...found,
        candles: validCandles,
        status:
          validCandles.length === 0
            ? 'unavailable'
            : found.status === 'stale'
              ? 'stale'
              : 'available',
      };
    }

    return {
      assetId: meta.id,
      currency: meta.currency,
      priceCurrency: meta.quoteCurrency,
      source:
        meta.source === 'nasdaq-prototype'
          ? 'nasdaq-prototype'
          : 'boerse-frankfurt-prototype',
      range: '1Y',
      interval: '1D',
      generatedAt: new Date().toISOString(),
      candles: [],
      status: 'unavailable',
    };
  }

  async getHistoricalPrices(
    symbol: string,
    range: HistoricalRange,
  ): Promise<HistoricalSeries> {
    this.checkSimulatedError();
    const normalized = symbol.trim().toUpperCase();
    const meta = getDemoInstrumentMetadata(normalized);
    if (!meta) {
      throw new MarketServiceException(
        'UNSUPPORTED_SYMBOL',
        `Keine Historie für „${normalized}“ verfügbar.`,
      );
    }

    const assetHistory = await this.getAssetHistory(normalized);
    if (
      !assetHistory ||
      assetHistory.status === 'unavailable' ||
      assetHistory.candles.length === 0
    ) {
      return {
        symbol: meta.symbol,
        currency: meta.currency,
        range,
        points: [],
        candles: [],
        status: 'unavailable',
        providerName: UNAVAILABLE_HISTORY_NOTICE,
        timestamp: new Date().toISOString(),
        isDemo: false,
      };
    }

    const allCandles = assetHistory.candles;
    let filteredCandles = allCandles;
    if (allCandles.length > 0 && range !== '1Y') {
      const lastDate = allCandles[allCandles.length - 1]!.date;
      const lastMs = Date.parse(`${lastDate}T00:00:00Z`);
      const daysBack = range === '1M' ? 32 : 185;
      const cutoffDate = new Date(lastMs - daysBack * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      filteredCandles = allCandles.filter((c) => c.date >= cutoffDate);
    }

    return {
      symbol: meta.symbol,
      currency: assetHistory.priceCurrency,
      range,
      points: filteredCandles.map((c) => ({
        date: c.date,
        close: c.close,
        open: c.open,
        high: c.high,
        low: c.low,
        volume: c.volume,
      })),
      candles: filteredCandles,
      status: assetHistory.status === 'stale' ? 'stale' : 'delayed',
      providerName:
        assetHistory.source === 'nasdaq-prototype'
          ? 'Nasdaq Prototyp-Tageskurse (1 Jahr)'
          : 'Börse Frankfurt (XETRA) Prototyp-Tageskurse (1 Jahr)',
      timestamp: assetHistory.generatedAt,
      isDemo: false,
    };
  }

  async getExchangeRate(
    from: SupportedCurrency,
    to: SupportedCurrency,
    options?: { forceRefresh?: boolean },
  ): Promise<ExchangeRateQuote> {
    this.checkSimulatedError();
    if (from === to) {
      return {
        from,
        to,
        rate: 1,
        timestamp: new Date().toISOString(),
        source: 'Identische Währung (1:1)',
        status: 'real-time',
        isDemo: false,
      };
    }

    const key = `${from}_${to}`;
    const now = Date.now();
    if (this.usesGlobalCache && !options?.forceRefresh) {
      const cached = fxCache.get(key);
      if (cached && now - cached.fetchedAtMs < CATALOGUE_CACHE_TTL_MS) {
        return cached.fx;
      }
    }

    const catalogue = await this.getCatalogueSnapshot(options);
    const isFallback = catalogue.fxStatus === 'fallback';
    const fxSource = isFallback
      ? DEMO_STATUS_LABEL
      : 'Frankfurter EZB-Referenzkurs (USD/EUR)';

    if (from === 'USD' && to === 'EUR') {
      const fx: ExchangeRateQuote = {
        from: 'USD',
        to: 'EUR',
        rate: catalogue.fxRateUsdToEur,
        date: catalogue.fxReferenceDate,
        timestamp: catalogue.fetchedAt ?? new Date().toISOString(),
        source: fxSource,
        status: isFallback ? 'fallback' : 'delayed',
        isDemo: isFallback,
      };
      if (this.usesGlobalCache) {
        fxCache.set(key, { fx, fetchedAtMs: now });
      }
      return fx;
    }

    if (from === 'EUR' && to === 'USD') {
      const rate =
        catalogue.fxRateUsdToEur > 0
          ? Math.round((1 / catalogue.fxRateUsdToEur) * 10000) / 10000
          : 1.087;
      const fx: ExchangeRateQuote = {
        from: 'EUR',
        to: 'USD',
        rate,
        date: catalogue.fxReferenceDate,
        timestamp: catalogue.fetchedAt ?? new Date().toISOString(),
        source: fxSource,
        status: isFallback ? 'fallback' : 'delayed',
        isDemo: isFallback,
      };
      if (this.usesGlobalCache) {
        fxCache.set(key, { fx, fetchedAtMs: now });
      }
      return fx;
    }

    const demoFx = getDemoExchangeRate(from, to);
    if (this.usesGlobalCache) {
      fxCache.set(key, { fx: demoFx, fetchedAtMs: now });
    }
    return demoFx;
  }
}

export function createMarketDataService(
  options?: MarketServiceConfigOptions,
): MarketDataService {
  return new DefaultMarketDataService(options);
}

export const marketDataService = new DefaultMarketDataService();

