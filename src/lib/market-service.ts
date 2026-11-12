import {
  CURATED_MARKET_ASSETS,
  DEMO_STATUS_LABEL,
  getDemoExchangeRate,
  getDemoHistoricalSeries,
  getDemoInstrumentMetadata,
  getDemoQuote,
  searchDemoInstruments,
} from './market-demo-adapter';
import type {
  ExchangeRateQuote,
  HistoricalRange,
  HistoricalSeries,
  InstrumentAssetType,
  InstrumentMetadata,
  MarketDataService,
  MarketDataStatus,
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
const quoteCache = new Map<string, { quote: MarketQuote; fetchedAtMs: number }>();
const fxCache = new Map<string, { fx: ExchangeRateQuote; fetchedAtMs: number }>();
let cachedProviderStatus: ProviderStatusInfo | null = null;

export function clearMarketClientCache(): void {
  sharedCatalogueSnapshot = null;
  pendingCataloguePromise = null;
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

class DefaultMarketDataService implements MarketDataService {
  private forcedSimulatedError: MarketServiceErrorCode | null = null;

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

  async getCatalogueSnapshot(options?: { forceRefresh?: boolean }): Promise<SharedQuoteCache> {
    this.checkSimulatedError();
    const now = Date.now();

    if (
      !options?.forceRefresh &&
      sharedCatalogueSnapshot &&
      now - sharedCatalogueSnapshot.fetchedAtMs < CATALOGUE_CACHE_TTL_MS
    ) {
      return sharedCatalogueSnapshot.data;
    }

    if (!options?.forceRefresh && pendingCataloguePromise) {
      return pendingCataloguePromise;
    }

    pendingCataloguePromise = (async () => {
      try {
        const res = await fetch('/api/market/quotes', {
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const payload = (await res.json()) as SharedQuoteCache;
          if (payload && payload.quotes && typeof payload.quotes === 'object') {
            sharedCatalogueSnapshot = { data: payload, fetchedAtMs: Date.now() };
            for (const [key, q] of Object.entries(payload.quotes)) {
              quoteCache.set(key.toUpperCase(), { quote: q, fetchedAtMs: Date.now() });
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
            fxCache.set('USD_EUR', { fx: fxQuote, fetchedAtMs: Date.now() });
            return payload;
          }
        }
      } catch {
        // Fall through to offline fallback
      }

      if (sharedCatalogueSnapshot) {
        return sharedCatalogueSnapshot.data;
      }

      const fallback = buildOfflineCatalogueFallback();
      sharedCatalogueSnapshot = { data: fallback, fetchedAtMs: Date.now() };
      return fallback;
    })();

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
    if (cachedProviderStatus) {
      return cachedProviderStatus;
    }

    try {
      const response = await fetch('/api/market/status', {
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        const data = (await response.json()) as Partial<ProviderStatusInfo>;
        if (data && typeof data.configured === 'boolean') {
          cachedProviderStatus = {
            mode: data.configured ? 'live_provider' : 'demo',
            configured: data.configured,
            providerName:
              data.providerName ||
              (data.configured
                ? 'Börse Frankfurt & Nasdaq (Prototyp-Marktdaten)'
                : DEMO_STATUS_LABEL),
            defaultStatus: data.configured ? (data.defaultStatus ?? 'delayed') : 'demo',
            statusLabel:
              data.statusLabel ||
              (data.configured
                ? 'Verzögerte Börsenkurse (Börse Frankfurt / Nasdaq / EZB-Wechselkurs)'
                : DEMO_STATUS_LABEL),
            disclaimerLabel: MARKET_DATA_SIMULATION_NOTICE,
            lastCheckedAt: new Date().toISOString(),
          };
          return cachedProviderStatus;
        }
      }
    } catch {
      // Static hosting or offline: operate in explicit educational demo mode
    }

    cachedProviderStatus = {
      mode: 'demo',
      configured: false,
      providerName: DEMO_STATUS_LABEL,
      defaultStatus: 'demo',
      statusLabel: DEMO_STATUS_LABEL,
      disclaimerLabel: FALLBACK_QUOTE_NOTICE,
      lastCheckedAt: new Date().toISOString(),
    };
    return cachedProviderStatus;
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

  async getHistoricalPrices(
    symbol: string,
    range: HistoricalRange,
  ): Promise<HistoricalSeries> {
    this.checkSimulatedError();
    const normalized = symbol.trim().toUpperCase();
    const status = await this.getProviderStatus();

    if (status.mode === 'live_provider') {
      try {
        const res = await fetch(
          `/api/market/history?symbol=${encodeURIComponent(normalized)}&range=${encodeURIComponent(range)}`,
        );
        if (res.ok) {
          return (await res.json()) as HistoricalSeries;
        }
      } catch {
        // Fallback to local educational history anchored to current cached quote
      }
    }

    const demoHistory = getDemoHistoricalSeries(normalized, range);
    if (!demoHistory) {
      throw new MarketServiceException(
        'UNSUPPORTED_SYMBOL',
        `Keine Beispiel-Historie für „${normalized}“ verfügbar.`,
      );
    }
    return demoHistory;
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
    if (!options?.forceRefresh) {
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
      fxCache.set(key, { fx, fetchedAtMs: now });
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
      fxCache.set(key, { fx, fetchedAtMs: now });
      return fx;
    }

    const demoFx = getDemoExchangeRate(from, to);
    fxCache.set(key, { fx: demoFx, fetchedAtMs: now });
    return demoFx;
  }
}

export const marketDataService = new DefaultMarketDataService();
