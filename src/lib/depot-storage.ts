import {
  buildPortfolioSnapshot,
  type DepotPortfolioState,
  type DepotPosition,
  type DepotSnapshot,
  type DepotTransaction,
  roundCurrency,
  roundQuantity,
} from './depot-calculations';
import { getUnlockedAssetIds } from './market-demo-adapter';
import type { ExchangeRateQuote, MarketQuote } from './market-types';
import type { StorageLike } from './storage';

export const DEPOT_STORAGE_KEY = 'geldstart_depot_v1';
export const DEFAULT_INITIAL_CAPITAL_EUR = 5000;

export const STARTING_CASH_PRESETS = [
  {
    amount: 1000,
    label: '1.000 €',
    subtitle: 'Kompakter Einstieg',
    description: 'Ideal, um mit ersten Sparplan-Beträgen (z. B. 50 € bis 250 €) zu üben.',
  },
  {
    amount: 5000,
    label: '5.000 €',
    subtitle: 'Empfohlener Standard',
    description: 'Gute Größe, um ein ausgewogenes Depot aus Welt-ETF und 2–3 Einzelwerten zu testen.',
  },
  {
    amount: 10000,
    label: '10.000 €',
    subtitle: 'Größeres Übungsbudget',
    description: 'Viel Spielraum zum Vergleichen verschiedener Anlageklassen, Branchen und Währungen.',
  },
  {
    amount: 25000,
    label: '25.000 €',
    subtitle: 'Zukunftsdepot-Referenz',
    description: 'Entspricht dem früheren 25.000-Startwert für umfangreichere Diversifikations-Tests.',
  },
] as const;

export function createUninitializedDepotState(): DepotPortfolioState {
  const nowIso = new Date().toISOString();
  const starterUnlocked = getUnlockedAssetIds({});
  return {
    version: 2,
    isInitialized: false,
    portfolioName: 'Mein Übungsdepot',
    baseCurrency: 'EUR',
    startingCashEur: DEFAULT_INITIAL_CAPITAL_EUR,
    initialCapitalEur: DEFAULT_INITIAL_CAPITAL_EUR,
    cashEur: DEFAULT_INITIAL_CAPITAL_EUR,
    realizedGainLossTotalEur: 0,
    positions: [],
    transactions: [],
    unlockedAssets: starterUnlocked,
    lastKnownQuotes: {},
    lastKnownFxRates: {},
    snapshots: [],
    createdAt: nowIso,
    lastUpdatedAt: nowIso,
    updatedAt: nowIso,
  };
}

export function initializeVirtualPortfolio(params?: {
  startingCashEur?: number;
  portfolioName?: string;
  createdAt?: string;
  unlockedAssets?: string[];
}): DepotPortfolioState {
  const rawCash = params?.startingCashEur ?? DEFAULT_INITIAL_CAPITAL_EUR;
  const safeStart = roundCurrency(
    Number.isFinite(rawCash) && rawCash >= 100
      ? Math.min(1000000, rawCash)
      : DEFAULT_INITIAL_CAPITAL_EUR,
  );
  const name =
    params?.portfolioName && params.portfolioName.trim().length > 0
      ? params.portfolioName.trim().slice(0, 50)
      : 'Mein Übungsdepot';
  const nowIso = params?.createdAt ?? new Date().toISOString();
  const unlockedAssets =
    params?.unlockedAssets && params.unlockedAssets.length > 0
      ? Array.from(new Set(params.unlockedAssets))
      : getUnlockedAssetIds({});

  const initial: DepotPortfolioState = {
    version: 2,
    isInitialized: true,
    portfolioName: name,
    baseCurrency: 'EUR',
    startingCashEur: safeStart,
    initialCapitalEur: safeStart,
    cashEur: safeStart,
    realizedGainLossTotalEur: 0,
    positions: [],
    transactions: [],
    unlockedAssets,
    lastKnownQuotes: {},
    lastKnownFxRates: {},
    snapshots: [],
    createdAt: nowIso,
    lastUpdatedAt: nowIso,
    updatedAt: nowIso,
  };

  const firstSnapshot = buildPortfolioSnapshot(initial, 'creation', nowIso);
  return {
    ...initial,
    snapshots: [firstSnapshot],
  };
}

function getSafeStorage(customStorage?: StorageLike | null): StorageLike | null {
  if (customStorage !== undefined) return customStorage;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

export function sanitizeDepotState(raw: unknown): DepotPortfolioState {
  const fallback = createUninitializedDepotState();
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const candidate = raw as Record<string, unknown>;
  const isInitialized = Boolean(candidate.isInitialized);
  if (!isInitialized) {
    return fallback;
  }

  const portfolioName =
    typeof candidate.portfolioName === 'string' && candidate.portfolioName.trim().length > 0
      ? candidate.portfolioName.trim().slice(0, 50)
      : 'Mein Übungsdepot';

  const rawInitial =
    typeof candidate.initialCapitalEur === 'number' && Number.isFinite(candidate.initialCapitalEur)
      ? candidate.initialCapitalEur
      : typeof candidate.startingCashEur === 'number' && Number.isFinite(candidate.startingCashEur)
        ? candidate.startingCashEur
        : DEFAULT_INITIAL_CAPITAL_EUR;

  const startingCashEur =
    rawInitial > 0 ? roundCurrency(rawInitial) : DEFAULT_INITIAL_CAPITAL_EUR;

  const cashEur =
    typeof candidate.cashEur === 'number' &&
    Number.isFinite(candidate.cashEur) &&
    candidate.cashEur >= 0
      ? roundCurrency(candidate.cashEur)
      : startingCashEur;

  const realizedGainLossTotalEur =
    typeof candidate.realizedGainLossTotalEur === 'number' &&
    Number.isFinite(candidate.realizedGainLossTotalEur)
      ? roundCurrency(candidate.realizedGainLossTotalEur)
      : 0;

  const positions: DepotPosition[] = [];
  if (Array.isArray(candidate.positions)) {
    for (const rawPos of candidate.positions) {
      if (!rawPos || typeof rawPos !== 'object') continue;
      const p = rawPos as Record<string, unknown>;
      const sym =
        typeof p.symbol === 'string' && p.symbol.trim().length > 0
          ? p.symbol.trim().toUpperCase()
          : typeof p.assetId === 'string' && p.assetId.trim().length > 0
            ? p.assetId.trim().toUpperCase()
            : '';
      if (
        sym.length > 0 &&
        typeof p.name === 'string' &&
        typeof p.quantity === 'number' &&
        Number.isFinite(p.quantity) &&
        p.quantity > 0
      ) {
        const qty = roundQuantity(p.quantity);
        const rawAvgEur =
          typeof p.averagePurchasePriceEur === 'number' && Number.isFinite(p.averagePurchasePriceEur)
            ? p.averagePurchasePriceEur
            : typeof p.averageBuyPriceEur === 'number' && Number.isFinite(p.averageBuyPriceEur)
              ? p.averageBuyPriceEur
              : 1;
        const avgEur = rawAvgEur > 0 ? roundCurrency(rawAvgEur) : 1;
        const avgOrig =
          typeof p.averagePurchasePriceOriginal === 'number' &&
          Number.isFinite(p.averagePurchasePriceOriginal) &&
          p.averagePurchasePriceOriginal > 0
            ? roundCurrency(p.averagePurchasePriceOriginal)
            : avgEur;
        const rawCostBasis =
          typeof p.investedCostBasisEur === 'number' && Number.isFinite(p.investedCostBasisEur)
            ? p.investedCostBasisEur
            : typeof p.investedAmountEur === 'number' && Number.isFinite(p.investedAmountEur)
              ? p.investedAmountEur
              : qty * avgEur;
        const costBasis = rawCostBasis >= 0 ? roundCurrency(rawCostBasis) : roundCurrency(qty * avgEur);

        positions.push({
          assetId: sym,
          symbol: sym,
          name: p.name,
          assetType:
            p.assetType === 'ETF' ||
            p.assetType === 'Aktie' ||
            p.assetType === 'Anleihen-ETF' ||
            p.assetType === 'Rohstoff-ETC'
              ? p.assetType
              : 'Aktie',
          sector: typeof p.sector === 'string' ? p.sector : 'Sonstige',
          region: typeof p.region === 'string' ? p.region : 'Global',
          currency: p.currency === 'USD' ? 'USD' : 'EUR',
          exchange: typeof p.exchange === 'string' ? p.exchange : 'XETRA',
          riskCategory:
            p.riskCategory === 'Niedrig bis mittel' ||
            p.riskCategory === 'Mittel' ||
            p.riskCategory === 'Mittel bis hoch' ||
            p.riskCategory === 'Hoch' ||
            p.riskCategory === 'Sehr hoch'
              ? p.riskCategory
              : 'Hoch',
          quantity: qty,
          averagePurchasePriceOriginal: avgOrig,
          averagePurchasePriceEur: avgEur,
          averageBuyPriceEur: avgEur,
          investedCostBasisEur: costBasis,
          investedAmountEur: costBasis,
          updatedAt:
            typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString(),
        });
      }
    }
  }

  const transactions: DepotTransaction[] = [];
  if (Array.isArray(candidate.transactions)) {
    for (const rawTx of candidate.transactions) {
      if (!rawTx || typeof rawTx !== 'object') continue;
      const t = rawTx as Record<string, unknown>;
      const txType =
        t.type === 'BUY' || t.tradeType === 'buy'
          ? 'BUY'
          : t.type === 'SELL' || t.tradeType === 'sell'
            ? 'SELL'
            : null;
      const sym =
        typeof t.symbol === 'string' && t.symbol.trim().length > 0
          ? t.symbol.trim().toUpperCase()
          : typeof t.assetId === 'string' && t.assetId.trim().length > 0
            ? t.assetId.trim().toUpperCase()
            : '';
      if (
        typeof t.id === 'string' &&
        txType !== null &&
        sym.length > 0 &&
        typeof t.quantity === 'number' &&
        Number.isFinite(t.quantity) &&
        t.quantity > 0
      ) {
        const priceEurVal =
          typeof t.priceEur === 'number' && Number.isFinite(t.priceEur)
            ? roundCurrency(t.priceEur)
            : typeof t.executionPriceEur === 'number' && Number.isFinite(t.executionPriceEur)
              ? roundCurrency(t.executionPriceEur)
              : 0;
        const totalEurVal =
          typeof t.totalAmountEur === 'number' && Number.isFinite(t.totalAmountEur)
            ? roundCurrency(t.totalAmountEur)
            : typeof t.totalEur === 'number' && Number.isFinite(t.totalEur)
              ? roundCurrency(t.totalEur)
              : 0;
        const priceTs =
          typeof t.priceTimestamp === 'string'
            ? t.priceTimestamp
            : typeof t.quoteFetchedAt === 'string'
              ? t.quoteFetchedAt
              : new Date().toISOString();
        const fetchedTs =
          typeof t.quoteFetchedAt === 'string' ? t.quoteFetchedAt : priceTs;

        transactions.push({
          id: t.id,
          type: txType,
          tradeType: txType === 'BUY' ? 'buy' : 'sell',
          assetId: sym,
          symbol: sym,
          instrumentName:
            typeof t.instrumentName === 'string' ? t.instrumentName : sym,
          assetType:
            t.assetType === 'ETF' ||
            t.assetType === 'Aktie' ||
            t.assetType === 'Anleihen-ETF' ||
            t.assetType === 'Rohstoff-ETC'
              ? t.assetType
              : 'Aktie',
          quantity: roundQuantity(t.quantity),
          priceOriginal:
            typeof t.priceOriginal === 'number' && Number.isFinite(t.priceOriginal)
              ? roundCurrency(t.priceOriginal)
              : priceEurVal,
          currency: t.currency === 'USD' ? 'USD' : 'EUR',
          fxRateToEur:
            typeof t.fxRateToEur === 'number' && Number.isFinite(t.fxRateToEur) && t.fxRateToEur > 0
              ? t.fxRateToEur
              : 1,
          priceEur: priceEurVal,
          executionPriceEur: priceEurVal,
          totalAmountEur: totalEurVal,
          totalEur: totalEurVal,
          realizedGainLossEur:
            typeof t.realizedGainLossEur === 'number' &&
            Number.isFinite(t.realizedGainLossEur)
              ? roundCurrency(t.realizedGainLossEur)
              : undefined,
          priceTimestamp: priceTs,
          quoteFetchedAt: fetchedTs,
          dataStatus:
            t.dataStatus === 'live' ||
            t.dataStatus === 'stale' ||
            t.dataStatus === 'fallback' ||
            t.dataStatus === 'real-time' ||
            t.dataStatus === 'delayed' ||
            t.dataStatus === 'end-of-day' ||
            t.dataStatus === 'cached' ||
            t.dataStatus === 'demo' ||
            t.dataStatus === 'unavailable'
              ? t.dataStatus
              : 'demo',
          executedAt:
            typeof t.executedAt === 'string' ? t.executedAt : new Date().toISOString(),
          isSimulated: true,
        });
      }
    }
  }

  // Only keep quotes for held positions to avoid storing a duplicate copy of the entire market catalogue per user
  const heldSymbolSet = new Set(positions.map((p) => p.symbol.toUpperCase()));
  const lastKnownQuotes: Record<string, MarketQuote> = {};
  if (candidate.lastKnownQuotes && typeof candidate.lastKnownQuotes === 'object') {
    for (const [sym, qVal] of Object.entries(
      candidate.lastKnownQuotes as Record<string, unknown>,
    )) {
      const upperSym = sym.toUpperCase();
      if (heldSymbolSet.size > 0 && !heldSymbolSet.has(upperSym)) {
        continue;
      }
      if (qVal && typeof qVal === 'object') {
        const q = qVal as Record<string, unknown>;
        if (typeof q.price === 'number' && Number.isFinite(q.price) && q.price > 0) {
          const ts =
            typeof q.timestamp === 'string'
              ? q.timestamp
              : typeof q.marketTime === 'string'
                ? q.marketTime
                : new Date().toISOString();
          const priceVal = roundCurrency(q.price);
          const priceEurVal =
            typeof q.priceEur === 'number' && Number.isFinite(q.priceEur)
              ? roundCurrency(q.priceEur)
              : priceVal;
          const fxRateVal =
            typeof q.fxRateToEur === 'number' && Number.isFinite(q.fxRateToEur) && q.fxRateToEur > 0
              ? q.fxRateToEur
              : 1;
          lastKnownQuotes[upperSym] = {
            assetId: upperSym,
            symbol: upperSym,
            price: priceVal,
            priceEur: priceEurVal,
            fxRateToEur: fxRateVal,
            previousClose:
              typeof q.previousClose === 'number' && Number.isFinite(q.previousClose)
                ? roundCurrency(q.previousClose)
                : priceVal,
            changeAbsolute:
              typeof q.changeAbsolute === 'number' && Number.isFinite(q.changeAbsolute)
                ? roundCurrency(q.changeAbsolute)
                : 0,
            changePercent:
              typeof q.changePercent === 'number' && Number.isFinite(q.changePercent)
                ? q.changePercent
                : 0,
            currency: q.currency === 'USD' ? 'USD' : 'EUR',
            exchange: typeof q.exchange === 'string' ? q.exchange : 'XETRA',
            marketTime: typeof q.marketTime === 'string' ? q.marketTime : ts,
            fetchedAt: typeof q.fetchedAt === 'string' ? q.fetchedAt : ts,
            timestamp: ts,
            source:
              q.source === 'nasdaq-prototype' ||
              q.source === 'boerse-frankfurt-prototype' ||
              q.source === 'manual-demo'
                ? q.source
                : 'manual-demo',
            status:
              q.status === 'available' ||
              q.status === 'live' ||
              q.status === 'stale' ||
              q.status === 'fallback' ||
              q.status === 'real-time' ||
              q.status === 'delayed' ||
              q.status === 'end-of-day' ||
              q.status === 'cached' ||
              q.status === 'demo' ||
              q.status === 'unavailable'
                ? q.status
                : 'demo',
            providerName:
              typeof q.providerName === 'string'
                ? q.providerName
                : 'Beispieldaten – keine aktuellen Marktdaten',
            isDemo: typeof q.isDemo === 'boolean' ? q.isDemo : true,
          };
        }
      }
    }
  }

  const lastKnownFxRates: Record<string, ExchangeRateQuote> = {};
  if (candidate.lastKnownFxRates && typeof candidate.lastKnownFxRates === 'object') {
    for (const [k, fxVal] of Object.entries(
      candidate.lastKnownFxRates as Record<string, unknown>,
    )) {
      if (fxVal && typeof fxVal === 'object') {
        const fx = fxVal as Record<string, unknown>;
        if (typeof fx.rate === 'number' && Number.isFinite(fx.rate) && fx.rate > 0) {
          lastKnownFxRates[k] = {
            from: fx.from === 'USD' ? 'USD' : 'EUR',
            to: fx.to === 'USD' ? 'USD' : 'EUR',
            rate: fx.rate,
            timestamp:
              typeof fx.timestamp === 'string' ? fx.timestamp : new Date().toISOString(),
            source: typeof fx.source === 'string' ? fx.source : 'Wechselkurs',
            status: 'delayed',
            isDemo: typeof fx.isDemo === 'boolean' ? fx.isDemo : false,
          };
        }
      }
    }
  }

  const snapshots: DepotSnapshot[] = [];
  if (Array.isArray(candidate.snapshots)) {
    for (const rawSnap of candidate.snapshots) {
      if (!rawSnap || typeof rawSnap !== 'object') continue;
      const s = rawSnap as Record<string, unknown>;
      if (
        typeof s.timestamp === 'string' &&
        typeof s.totalValueEur === 'number' &&
        Number.isFinite(s.totalValueEur)
      ) {
        snapshots.push({
          id: typeof s.id === 'string' ? s.id : `snap-${snapshots.length}`,
          timestamp: s.timestamp,
          cashEur:
            typeof s.cashEur === 'number' && Number.isFinite(s.cashEur)
              ? roundCurrency(s.cashEur)
              : cashEur,
          positionsValueEur:
            typeof s.positionsValueEur === 'number' &&
            Number.isFinite(s.positionsValueEur)
              ? roundCurrency(s.positionsValueEur)
              : 0,
          totalValueEur: roundCurrency(s.totalValueEur),
          investedCostBasisEur:
            typeof s.investedCostBasisEur === 'number' &&
            Number.isFinite(s.investedCostBasisEur)
              ? roundCurrency(s.investedCostBasisEur)
              : 0,
          reason:
            s.reason === 'creation' ||
            s.reason === 'buy' ||
            s.reason === 'sell' ||
            s.reason === 'refresh'
              ? s.reason
              : 'refresh',
          dataStatus: 'live',
        });
      }
    }
  }

  const rawUnlocked = Array.isArray(candidate.unlockedAssets)
    ? candidate.unlockedAssets.filter((id): id is string => typeof id === 'string')
    : [];
  const defaultStarter = getUnlockedAssetIds({});
  const unlockedAssets = Array.from(new Set([...defaultStarter, ...rawUnlocked]));

  const createdAt =
    typeof candidate.createdAt === 'string'
      ? candidate.createdAt
      : new Date().toISOString();
  const lastUpdatedAt =
    typeof candidate.lastUpdatedAt === 'string'
      ? candidate.lastUpdatedAt
      : typeof candidate.updatedAt === 'string'
        ? candidate.updatedAt
        : createdAt;

  return {
    version: 2,
    isInitialized: true,
    portfolioName,
    baseCurrency: 'EUR',
    startingCashEur,
    initialCapitalEur: startingCashEur,
    cashEur,
    realizedGainLossTotalEur,
    positions,
    transactions,
    unlockedAssets,
    lastKnownQuotes,
    lastKnownFxRates,
    snapshots,
    createdAt,
    lastUpdatedAt,
    updatedAt: lastUpdatedAt,
  };
}

export function loadDepotState(customStorage?: StorageLike | null): DepotPortfolioState {
  const storage = getSafeStorage(customStorage);
  if (!storage) return createUninitializedDepotState();

  try {
    const raw = storage.getItem(DEPOT_STORAGE_KEY);
    if (!raw) return createUninitializedDepotState();
    const parsed: unknown = JSON.parse(raw);
    return sanitizeDepotState(parsed);
  } catch {
    return createUninitializedDepotState();
  }
}

export function saveDepotState(
  state: DepotPortfolioState,
  customStorage?: StorageLike | null,
): boolean {
  const storage = getSafeStorage(customStorage);
  if (!storage) return false;

  try {
    if (!state.isInitialized) {
      storage.removeItem(DEPOT_STORAGE_KEY);
      return true;
    }
    const sanitized = sanitizeDepotState(state);
    storage.setItem(DEPOT_STORAGE_KEY, JSON.stringify(sanitized));
    return true;
  } catch {
    return false;
  }
}

export function resetDepotStorage(
  customStorage?: StorageLike | null,
): DepotPortfolioState {
  const storage = getSafeStorage(customStorage);
  if (storage) {
    try {
      storage.removeItem(DEPOT_STORAGE_KEY);
    } catch {
      // Ignore in restricted storage environments
    }
  }
  return createUninitializedDepotState();
}
