import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  buildPortfolioSnapshot,
  type DepotPortfolioState,
  type DepotTransaction,
  type DeterministicWeeklyReport,
  evaluatePortfolioValuation,
  executeVirtualBuy,
  executeVirtualSell,
  generateDeterministicWeeklyReport,
  type PortfolioValuationSummary,
  type VirtualBuyInput,
} from './depot-calculations';
import {
  DEFAULT_INITIAL_CAPITAL_EUR,
  initializeVirtualPortfolio,
  loadDepotState,
  resetDepotStorage,
  saveDepotState,
} from './depot-storage';
import {
  DEMO_STATUS_LABEL,
  getActiveDemoScenario,
  getDemoInstrumentMetadata,
  getUnlockedAssetIds,
  isAssetUnlocked,
  setActiveDemoScenario,
  UNLOCK_NOTIFICATION_TEXT,
} from './market-demo-adapter';
import {
  clearMarketClientCache,
  MARKET_DATA_SIMULATION_NOTICE,
  marketDataService,
  MarketServiceException,
} from './market-service';
import type {
  DemoMarketScenario,
  DemoMarketScenarioId,
  InstrumentMetadata,
  MarketQuote,
  MarketServiceError,
  ProviderStatusInfo,
  SharedQuoteCache,
} from './market-types';
import { loadProgress } from './storage';

interface DepotContextValue {
  portfolio: DepotPortfolioState;
  valuation: PortfolioValuationSummary;
  weeklyReport: DeterministicWeeklyReport;
  providerStatus: ProviderStatusInfo;
  activeScenario: DemoMarketScenario;
  catalogueQuotes: Record<string, MarketQuote>;
  usdToEurRate: number;
  fxReferenceDate: string | null;
  unlockedAssets: string[];
  newlyUnlockedNotice: string | null;
  isInstrumentUnlocked: (symbol: string) => boolean;
  isRefreshing: boolean;
  marketError: MarketServiceError | null;
  lastRefreshedAt: string | null;
  createPortfolio: (startingCashEur?: number, portfolioName?: string) => void;
  buyInstrumentVirtually: (params: {
    instrument: InstrumentMetadata;
    quote: MarketQuote;
    input: VirtualBuyInput;
    fxRateToEur?: number;
    fxTimestamp?: string;
  }) => DepotTransaction;
  sellInstrumentVirtually: (params: {
    symbol: string;
    quantityToSell: number;
    quote: MarketQuote;
    fxRateToEur?: number;
  }) => DepotTransaction;
  refreshPortfolioQuotes: (demoScenarioId?: DemoMarketScenarioId) => Promise<void>;
  syncUnlockedAssetsFromLessons: (
    completedLessons?: string[] | Record<string, boolean>,
  ) => void;
  dismissUnlockedNotice: () => void;
  resetDepot: () => void;
  clearMarketError: () => void;
}

const DEFAULT_PROVIDER_STATUS: ProviderStatusInfo = {
  mode: 'live_provider',
  configured: true,
  providerName: 'Börse Frankfurt & Nasdaq (Prototyp-Marktdaten)',
  defaultStatus: 'delayed',
  statusLabel: 'Verzögerte Börsenkurse (Börse Frankfurt / Nasdaq / EZB-Wechselkurs)',
  disclaimerLabel: MARKET_DATA_SIMULATION_NOTICE,
  lastCheckedAt: new Date().toISOString(),
};

const DepotContext = createContext<DepotContextValue | null>(null);

export function DepotProvider({ children }: { children: ReactNode }) {
  const [portfolio, setPortfolio] = useState<DepotPortfolioState>(() => {
    const loaded = loadDepotState();
    const progress = loadProgress();
    const unlockedFromLessons = getUnlockedAssetIds(progress.completedLessons);

    if (!loaded.isInitialized) {
      const autoCreated = initializeVirtualPortfolio({
        startingCashEur: DEFAULT_INITIAL_CAPITAL_EUR,
        portfolioName: 'Mein Übungsdepot',
        unlockedAssets: unlockedFromLessons,
      });
      saveDepotState(autoCreated);
      return autoCreated;
    }

    const mergedUnlocked = Array.from(
      new Set([...(loaded.unlockedAssets ?? []), ...unlockedFromLessons]),
    );
    if (mergedUnlocked.length !== (loaded.unlockedAssets ?? []).length) {
      const updated = { ...loaded, unlockedAssets: mergedUnlocked };
      saveDepotState(updated);
      return updated;
    }
    return loaded;
  });

  const [providerStatus, setProviderStatus] = useState<ProviderStatusInfo>(
    DEFAULT_PROVIDER_STATUS,
  );
  const [activeScenario, setActiveScenario] = useState<DemoMarketScenario>(() =>
    getActiveDemoScenario(),
  );
  const [catalogueCache, setCatalogueCache] = useState<SharedQuoteCache | null>(null);
  const [newlyUnlockedNotice, setNewlyUnlockedNotice] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [marketError, setMarketError] = useState<MarketServiceError | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(
    portfolio.isInitialized ? portfolio.lastUpdatedAt : null,
  );

  const persistPortfolio = useCallback(
    (updater: (prev: DepotPortfolioState) => DepotPortfolioState) => {
      setPortfolio((prev) => {
        const next = updater(prev);
        saveDepotState(next);
        return next;
      });
    },
    [],
  );

  // Load shared catalogue quotes ONCE on mount (no per-position or per-render requests)
  useEffect(() => {
    let mounted = true;
    setIsRefreshing(true);

    Promise.all([
      marketDataService.getProviderStatus(),
      marketDataService.getCatalogueSnapshot({ forceRefresh: false }),
    ])
      .then(([statusInfo, sharedCatalogue]) => {
        if (!mounted) return;
        setProviderStatus(statusInfo);
        setCatalogueCache(sharedCatalogue);
        setLastRefreshedAt(sharedCatalogue.fetchedAt);
      })
      .catch(() => {
        // Fallback already handled inside marketDataService
      })
      .finally(() => {
        if (mounted) {
          setIsRefreshing(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const syncUnlockedAssetsFromLessons = useCallback(
    (completedLessons?: string[] | Record<string, boolean>) => {
      const completed = completedLessons ?? loadProgress().completedLessons;
      const computedUnlocked = getUnlockedAssetIds(completed);

      setPortfolio((prev) => {
        const currentSet = new Set(prev.unlockedAssets ?? getUnlockedAssetIds([]));
        const newlyAdded = computedUnlocked.filter((id) => !currentSet.has(id));
        if (newlyAdded.length === 0) {
          return prev;
        }
        setNewlyUnlockedNotice(UNLOCK_NOTIFICATION_TEXT);
        const merged = Array.from(new Set([...currentSet, ...computedUnlocked]));
        const next: DepotPortfolioState = {
          ...prev,
          unlockedAssets: merged,
        };
        saveDepotState(next);
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    const handleCheckProgress = () => {
      syncUnlockedAssetsFromLessons();
    };
    window.addEventListener('storage', handleCheckProgress);
    window.addEventListener('focus', handleCheckProgress);
    const interval = window.setInterval(handleCheckProgress, 1500);
    return () => {
      window.removeEventListener('storage', handleCheckProgress);
      window.removeEventListener('focus', handleCheckProgress);
      window.clearInterval(interval);
    };
  }, [syncUnlockedAssetsFromLessons]);

  const dismissUnlockedNotice = useCallback(() => {
    setNewlyUnlockedNotice(null);
  }, []);

  const createPortfolio = useCallback(
    (startingCashEur = DEFAULT_INITIAL_CAPITAL_EUR, portfolioName?: string) => {
      const progress = loadProgress();
      const unlockedAssets = getUnlockedAssetIds(progress.completedLessons);
      const created = initializeVirtualPortfolio({
        startingCashEur,
        portfolioName,
        unlockedAssets,
      });
      saveDepotState(created);
      setPortfolio(created);
      setLastRefreshedAt(created.lastUpdatedAt);
      setMarketError(null);
    },
    [],
  );

  const isInstrumentUnlocked = useCallback(
    (symbol: string): boolean => {
      const meta = getDemoInstrumentMetadata(symbol);
      if (!meta) return false;
      const progress = loadProgress();
      return isAssetUnlocked(meta, progress.completedLessons, portfolio.unlockedAssets);
    },
    [portfolio.unlockedAssets],
  );

  const buyInstrumentVirtually = useCallback(
    (params: {
      instrument: InstrumentMetadata;
      quote: MarketQuote;
      input: VirtualBuyInput;
      fxRateToEur?: number;
      fxTimestamp?: string;
    }): DepotTransaction => {
      let createdTx: DepotTransaction | null = null;
      const progress = loadProgress();
      const completedMap: Record<string, boolean> = {};
      for (const id of progress.completedLessons) {
        completedMap[id] = true;
      }
      persistPortfolio((prev) => {
        const res = executeVirtualBuy({
          portfolio: prev,
          instrument: params.instrument,
          quote: params.quote,
          input: params.input,
          fxRateToEur: params.fxRateToEur,
          fxTimestamp: params.fxTimestamp,
          completedLessons: completedMap,
          enforceUnlock: true,
        });
        createdTx = res.transaction;
        setLastRefreshedAt(res.portfolio.lastUpdatedAt);
        return res.portfolio;
      });
      if (!createdTx) {
        throw new Error('Virtueller Kauf konnte nicht ausgeführt werden.');
      }
      return createdTx;
    },
    [persistPortfolio],
  );

  const sellInstrumentVirtually = useCallback(
    (params: {
      symbol: string;
      quantityToSell: number;
      quote: MarketQuote;
      fxRateToEur?: number;
    }): DepotTransaction => {
      let createdTx: DepotTransaction | null = null;
      persistPortfolio((prev) => {
        const res = executeVirtualSell({
          portfolio: prev,
          symbol: params.symbol,
          quantityToSell: params.quantityToSell,
          quote: params.quote,
          fxRateToEur: params.fxRateToEur,
        });
        createdTx = res.transaction;
        setLastRefreshedAt(res.portfolio.lastUpdatedAt);
        return res.portfolio;
      });
      if (!createdTx) {
        throw new Error('Virtueller Verkauf konnte nicht ausgeführt werden.');
      }
      return createdTx;
    },
    [persistPortfolio],
  );

  const refreshPortfolioQuotes = useCallback(
    async (demoScenarioId?: DemoMarketScenarioId) => {
      setIsRefreshing(true);
      setMarketError(null);

      try {
        const nowIso = new Date().toISOString();
        if (demoScenarioId) {
          const nextScen = setActiveDemoScenario(demoScenarioId, nowIso);
          setActiveScenario(nextScen);
          clearMarketClientCache();
        }

        const sharedCatalogue = await marketDataService.getCatalogueSnapshot({
          forceRefresh: true,
        });
        setCatalogueCache(sharedCatalogue);

        const heldSymbols = portfolio.positions.map((p) => p.symbol.toUpperCase());
        const heldQuotesMap: Record<string, MarketQuote> = {};
        for (const sym of heldSymbols) {
          const q = sharedCatalogue.quotes[sym];
          if (q) {
            heldQuotesMap[sym] = q;
          }
        }

        const usdFx = await marketDataService.getExchangeRate('USD', 'EUR', {
          forceRefresh: false,
        });

        persistPortfolio((prev) => {
          const mergedQuotes = {
            ...prev.lastKnownQuotes,
            ...heldQuotesMap,
          };
          const mergedFx = {
            ...prev.lastKnownFxRates,
            USD_EUR: usdFx,
          };

          const draft: DepotPortfolioState = {
            ...prev,
            lastKnownQuotes: mergedQuotes,
            lastKnownFxRates: mergedFx,
            lastUpdatedAt: nowIso,
            updatedAt: nowIso,
          };

          if (prev.positions.length === 0) {
            return draft;
          }
          const snap = buildPortfolioSnapshot(draft, 'refresh', nowIso);
          return {
            ...draft,
            snapshots: [...draft.snapshots, snap],
          };
        });
        setLastRefreshedAt(sharedCatalogue.fetchedAt ?? nowIso);
      } catch (err) {
        if (err instanceof MarketServiceException) {
          setMarketError({
            code: err.code,
            message: err.message,
            retryAfterSeconds: err.retryAfterSeconds,
          });
        } else {
          setMarketError({
            code: 'PROVIDER_ERROR',
            message:
              'Kursaktualisierung fehlgeschlagen. Es werden weiterhin die zuletzt bekannten Kurse angezeigt.',
          });
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [persistPortfolio, portfolio.positions],
  );

  const resetDepot = useCallback(() => {
    resetDepotStorage();
    const baseline = setActiveDemoScenario('baseline');
    setActiveScenario(baseline);
    const progress = loadProgress();
    const unlockedAssets = getUnlockedAssetIds(progress.completedLessons);
    const fresh = initializeVirtualPortfolio({
      startingCashEur: DEFAULT_INITIAL_CAPITAL_EUR,
      portfolioName: 'Mein Übungsdepot',
      unlockedAssets,
    });
    saveDepotState(fresh);
    setPortfolio(fresh);
    setMarketError(null);
    setLastRefreshedAt(fresh.lastUpdatedAt);
  }, []);

  const clearMarketError = useCallback(() => {
    setMarketError(null);
  }, []);

  const catalogueQuotes = useMemo(
    () => catalogueCache?.quotes ?? {},
    [catalogueCache],
  );

  const usdToEurRate = useMemo(
    () => catalogueCache?.fxRateUsdToEur ?? 0.9215,
    [catalogueCache],
  );

  const fxReferenceDate = useMemo(
    () => catalogueCache?.fxReferenceDate ?? null,
    [catalogueCache],
  );

  const unlockedAssets = useMemo(
    () => portfolio.unlockedAssets ?? getUnlockedAssetIds([]),
    [portfolio.unlockedAssets],
  );

  const valuation = useMemo(() => {
    const isFallback = catalogueCache?.fxStatus === 'fallback';
    const fxOverride = catalogueCache
      ? {
          USD_EUR: {
            from: 'USD' as const,
            to: 'EUR' as const,
            rate: catalogueCache.fxRateUsdToEur,
            date: catalogueCache.fxReferenceDate,
            timestamp: catalogueCache.fetchedAt ?? new Date().toISOString(),
            source: isFallback
              ? DEMO_STATUS_LABEL
              : 'Frankfurter EZB-Referenzkurs (USD/EUR)',
            status: (isFallback ? 'fallback' : 'delayed') as 'fallback' | 'delayed',
            isDemo: isFallback,
          },
        }
      : undefined;
    return evaluatePortfolioValuation(portfolio, catalogueQuotes, fxOverride);
  }, [portfolio, catalogueQuotes, catalogueCache]);

  const weeklyReport = useMemo(
    () => generateDeterministicWeeklyReport(portfolio, valuation),
    [portfolio, valuation],
  );

  const value = useMemo<DepotContextValue>(
    () => ({
      portfolio,
      valuation,
      weeklyReport,
      providerStatus,
      activeScenario,
      catalogueQuotes,
      usdToEurRate,
      fxReferenceDate,
      unlockedAssets,
      newlyUnlockedNotice,
      isInstrumentUnlocked,
      isRefreshing,
      marketError,
      lastRefreshedAt,
      createPortfolio,
      buyInstrumentVirtually,
      sellInstrumentVirtually,
      refreshPortfolioQuotes,
      syncUnlockedAssetsFromLessons,
      dismissUnlockedNotice,
      resetDepot,
      clearMarketError,
    }),
    [
      portfolio,
      valuation,
      weeklyReport,
      providerStatus,
      activeScenario,
      catalogueQuotes,
      usdToEurRate,
      fxReferenceDate,
      unlockedAssets,
      newlyUnlockedNotice,
      isInstrumentUnlocked,
      isRefreshing,
      marketError,
      lastRefreshedAt,
      createPortfolio,
      buyInstrumentVirtually,
      sellInstrumentVirtually,
      refreshPortfolioQuotes,
      syncUnlockedAssetsFromLessons,
      dismissUnlockedNotice,
      resetDepot,
      clearMarketError,
    ],
  );

  return <DepotContext.Provider value={value}>{children}</DepotContext.Provider>;
}

export function useDepot(): DepotContextValue {
  const ctx = useContext(DepotContext);
  if (!ctx) {
    throw new Error('useDepot must be used within a DepotProvider');
  }
  return ctx;
}
