export type MarketSource =
  | 'nasdaq-prototype'
  | 'boerse-frankfurt-prototype'
  | 'manual-demo';

export type NormalizedQuoteStatus =
  | 'available'
  | 'live'
  | 'delayed'
  | 'stale'
  | 'fallback';

export type MarketDataStatus =
  | NormalizedQuoteStatus
  | 'real-time'
  | 'end-of-day'
  | 'cached'
  | 'demo'
  | 'unavailable';

export type MarketAssetCategory = 'stock' | 'etf' | 'crypto' | 'cash';

export type InstrumentAssetType = 'ETF' | 'Aktie' | 'Anleihen-ETF' | 'Rohstoff-ETC';

export type SupportedCurrency = 'EUR' | 'USD';

export type TradingVenue = 'XETR' | 'XFRA';

export type RiskCategory =
  | 'Niedrig'
  | 'Niedrig bis mittel'
  | 'Mittel'
  | 'Mittel bis hoch'
  | 'Hoch'
  | 'Sehr hoch';

export interface MarketAsset {
  id: string;
  name: string;
  assetType: MarketAssetCategory;
  source: MarketSource;
  symbol?: string;
  isin?: string;
  venue?: TradingVenue;
  quoteCurrency: SupportedCurrency;
  riskLabel?: string;
  unlockedByLesson?: string;
  fallbackPriceEur?: number;
  fallbackPriceDate?: string;
}

export interface InstrumentMetadata {
  id: string;
  symbol: string;
  name: string;
  isin?: string;
  assetType: InstrumentAssetType;
  category: MarketAssetCategory;
  source: MarketSource;
  venue?: TradingVenue;
  exchange: string;
  currency: SupportedCurrency;
  quoteCurrency: SupportedCurrency;
  sector: string;
  region: string;
  riskCategory: RiskCategory;
  riskLabel: string;
  unlockedByLesson?: string;
  unlockReasonLabel?: string;
  unlockRequirementText?: string;
  fallbackPriceEur: number;
  fallbackPriceDate: string;
  shortExplanation: string;
  educationalNotes: string[];
  /** Whether fractional shares (e.g. Sparplan-Bruchstücke) are supported in the simulator */
  supportsFractional: boolean;
}

export interface MarketQuote {
  /** Stable internal asset ID */
  assetId: string;
  /** Display symbol / ticker for UI compatibility */
  symbol: string;
  /** Quote price in native quoteCurrency */
  price: number;
  /** Native currency of the quote ('EUR' | 'USD') */
  currency: SupportedCurrency;
  /** Normalized price in EUR (portfolio base currency) */
  priceEur: number;
  /** Reference FX rate applied to convert currency -> EUR (1 for EUR) */
  fxRateToEur: number;
  /** Reference date of the FX conversion rate */
  fxReferenceDate?: string | null;
  /** Timestamp reported by the market venue, if available */
  marketTime: string | null;
  /** ISO timestamp when this quote was fetched by the server */
  fetchedAt: string;
  /** Internal prototype source identifier */
  source: MarketSource;
  /** Normalized quote status ('available' | 'live' | 'delayed' | 'stale' | 'fallback') */
  status: MarketDataStatus;
  /** Optional legacy status alias */
  legacyStatus?: MarketDataStatus;
  /** Previous trading day close in native currency */
  previousClose: number;
  /** Absolute change vs previous close in native currency */
  changeAbsolute: number;
  /** Percentage change vs previous close */
  changePercent: number;
  /** Human-readable exchange / venue label */
  exchange: string;
  /** Effective display timestamp (marketTime or fetchedAt or fallbackPriceDate) */
  timestamp: string;
  /** Human-readable provider / source label */
  providerName: string;
  /** True when the quote is a demonstration fallback rather than a retrieved market quote */
  isDemo: boolean;
  /** Explicit fallback date when status === 'fallback' */
  fallbackPriceDate?: string;
}

export interface MarketDataProvider {
  getQuotes(assets: MarketAsset[]): Promise<MarketQuote[]>;
}

export interface MarketPriceRecord {
  asset_id: string;
  price: number;
  currency: SupportedCurrency;
  price_eur: number;
  market_time: string | null;
  fetched_at: string;
  source: MarketSource;
  status: NormalizedQuoteStatus;
}

export interface MarketPriceRepository {
  getAll(): Promise<MarketPriceRecord[]>;
  getByAssetId(assetId: string): Promise<MarketPriceRecord | null>;
  saveMany(records: MarketPriceRecord[]): Promise<void>;
  clear(): Promise<void>;
}

export interface SharedQuoteCache {
  quotes: Record<string, MarketQuote>;
  quoteList: MarketQuote[];
  records: MarketPriceRecord[];
  fxRateUsdToEur: number;
  fxReferenceDate: string;
  fxStatus: 'available' | 'stale' | 'fallback';
  fetchedAt: string;
  cacheDateKey: string;
  expiresAt: number;
  refreshCount: number;
}

export interface StaticMarketSnapshot extends SharedQuoteCache {
  generatedAt: string;
  source: string;
  marketTime: string | null;
  status: NormalizedQuoteStatus;
}

export interface HistoricalPricePoint {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number | null;
}

export interface HistoricalCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
}

export type HistoricalDataSource =
  | 'nasdaq-prototype'
  | 'boerse-frankfurt-prototype';

export interface AssetHistory {
  assetId: string;
  currency: 'EUR' | 'USD';
  priceCurrency: 'EUR' | 'USD';
  source: HistoricalDataSource;
  range: '1Y';
  interval: '1D';
  generatedAt: string;
  candles: HistoricalCandle[];
  status: 'available' | 'stale' | 'unavailable';
}

export interface MarketHistorySnapshot {
  generatedAt: string;
  histories: AssetHistory[];
}

export interface HistoricalSummaryStats {
  minLow: number;
  maxHigh: number;
  firstClose: number;
  latestClose: number;
  changeAbsolute: number;
  changePercent: number;
  startDate: string;
  endDate: string;
  candleCount: number;
}

export type HistoricalRange = '1M' | '6M' | '1Y';

export interface HistoricalSeries {
  symbol: string;
  currency: SupportedCurrency;
  range: HistoricalRange;
  points: HistoricalPricePoint[];
  candles?: HistoricalCandle[];
  status: MarketDataStatus;
  providerName: string;
  timestamp: string;
  isDemo: boolean;
}

export interface ExchangeRateQuote {
  from: SupportedCurrency;
  to: SupportedCurrency;
  rate: number;
  date?: string;
  timestamp: string;
  source: string;
  status: MarketDataStatus;
  isDemo: boolean;
}

export type MarketServiceErrorCode =
  | 'RATE_LIMIT'
  | 'PROVIDER_ERROR'
  | 'OFFLINE'
  | 'UNSUPPORTED_SYMBOL'
  | 'STALE_DATA';

export interface MarketServiceError {
  code: MarketServiceErrorCode;
  message: string;
  retryAfterSeconds?: number;
}

export interface ProviderStatusInfo {
  mode: 'live_provider' | 'demo';
  configured: boolean;
  providerName: string;
  defaultStatus: MarketDataStatus;
  statusLabel: string;
  disclaimerLabel: string;
  lastCheckedAt: string;
  fxRateUsdToEur?: number;
  fxReferenceDate?: string;
  hasStaleQuotes?: boolean;
  hasFallbackQuotes?: boolean;
}

export type DemoMarketScenarioId =
  | 'baseline'
  | 'normal_day'
  | 'market_dip'
  | 'tech_rally'
  | 'sector_rotation';

export interface DemoMarketScenario {
  id: DemoMarketScenarioId;
  label: string;
  description: string;
  educationalTakeaway: string;
}

export interface MarketDataService {
  getProviderStatus(): Promise<ProviderStatusInfo>;
  searchInstruments(
    query: string,
    filterType?: InstrumentAssetType | 'ALL',
  ): Promise<InstrumentMetadata[]>;
  getInstrumentDetails(symbol: string): Promise<InstrumentMetadata | null>;
  getQuote(
    symbol: string,
    options?: { forceRefresh?: boolean },
  ): Promise<MarketQuote>;
  getBatchQuotes(
    symbols: string[],
    options?: { forceRefresh?: boolean },
  ): Promise<Record<string, MarketQuote>>;
  getCatalogueQuotes(options?: {
    forceRefresh?: boolean;
  }): Promise<Record<string, MarketQuote>>;
  getCatalogueSnapshot(options?: {
    forceRefresh?: boolean;
  }): Promise<SharedQuoteCache>;
  getHistoricalPrices(
    symbol: string,
    range: HistoricalRange,
  ): Promise<HistoricalSeries>;
  getAssetHistory(symbol: string): Promise<AssetHistory | null>;
  getHistorySnapshot(options?: {
    forceRefresh?: boolean;
  }): Promise<MarketHistorySnapshot | null>;
  getExchangeRate(
    from: SupportedCurrency,
    to: SupportedCurrency,
    options?: { forceRefresh?: boolean },
  ): Promise<ExchangeRateQuote>;
}
