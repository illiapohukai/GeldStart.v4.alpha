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
  initializeVirtualPortfolio,
  loadDepotState,
  resetDepotStorage,
  saveDepotState,
} from './depot-storage';
import {
  DEMO_SCENARIOS,
  DEMO_STATUS_LABEL,
  getActiveDemoScenario,
  setActiveDemoScenario,
} from './market-demo-adapter';
import {
  clearMarketClientCache,
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
} from './market-types';

interface DepotContextValue {
  portfolio: DepotPortfolioState;
  valuation: PortfolioValuationSummary;
  weeklyReport: DeterministicWeeklyReport;
  providerStatus: ProviderStatusInfo;
  activeScenario: DemoMarketScenario;
  isRefreshing: boolean;
  marketError: MarketServiceError | null;
  lastRefreshedAt: string | null;
  createPortfolio: (startingCashEur: number, portfolioName?: string) => void;
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
  resetDepot: () => void;
  clearMarketError: () => void;
}

const DEFAULT_PROVIDER_STATUS: ProviderStatusInfo = {
  mode: 'demo',
  configured: false,
  providerName: DEMO_STATUS_LABEL,
  defaultStatus: 'demo',
  statusLabel: DEMO_STATUS_LABEL,
  disclaimerLabel:
    'Nur zu Bildungszwecken – keine Anlageberatung. Alle Käufe und Verkäufe sind Simulationen.',
  lastCheckedAt: new Date().toISOString(),
};

const DepotContext = createContext<DepotContextValue | null>(null);

export function DepotProvider({ children }: { children: ReactNode }) {
  const [portfolio, setPortfolio] = useState<DepotPortfolioState>(() => {
    const loaded = loadDepotState();
    if (!loaded.isInitialized && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        const autoCreated = initializeVirtualPortfolio({
          startingCashEur: 5000,
          portfolioName: 'Mein Übungsdepot',
        });
        saveDepotState(autoCreated);
        return autoCreated;
      }
    }
    return loaded;
  });

  const [providerStatus, setProviderStatus] = useState<ProviderStatusInfo>(
    DEFAULT_PROVIDER_STATUS,
  );
  const [activeScenario, setActiveScenario] = useState<DemoMarketScenario>(() =>
    getActiveDemoScenario(),
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [marketError, setMarketError] = useState<MarketServiceError | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(
    portfolio.isInitialized ? portfolio.lastUpdatedAt : null,
  );

  useEffect(() => {
    let mounted = true;
    marketDataService
      .getProviderStatus()
      .then((info) => {
        if (mounted) {
          setProviderStatus(info);
        }
      })
      .catch(() => {
        // Fallback already in DEFAULT_PROVIDER_STATUS
      });
    return () => {
      mounted = false;
    };
  }, []);

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

  const createPortfolio = useCallback(
    (startingCashEur: number, portfolioName?: string) => {
      const created = initializeVirtualPortfolio({
        startingCashEur,
        portfolioName,
      });
      saveDepotState(created);
      setPortfolio(created);
      setLastRefreshedAt(created.lastUpdatedAt);
      setMarketError(null);
    },
    [],
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
      persistPortfolio((prev) => {
        const res = executeVirtualBuy({
          portfolio: prev,
          instrument: params.instrument,
          quote: params.quote,
          input: params.input,
          fxRateToEur: params.fxRateToEur,
          fxTimestamp: params.fxTimestamp,
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
        } else if (providerStatus.mode === 'demo') {
          // Keep demo prices stable at baseline on refresh; never randomly or automatically shift prices
          const updatedScen = setActiveDemoScenario('baseline', nowIso);
          setActiveScenario(updatedScen);
          clearMarketClientCache();
        }

        const heldSymbols = portfolio.positions.map((p) => p.symbol);
        const quotesMap =
          heldSymbols.length > 0
            ? await marketDataService.getBatchQuotes(heldSymbols, {
                forceRefresh: true,
              })
            : {};

        const hasUsdPosition = portfolio.positions.some(
          (p) => p.currency === 'USD',
        );
        const usdFx = hasUsdPosition
          ? await marketDataService.getExchangeRate('USD', 'EUR', {
              forceRefresh: true,
            })
          : null;

        persistPortfolio((prev) => {
          const mergedQuotes = {
            ...prev.lastKnownQuotes,
            ...quotesMap,
          };
          const mergedFx = {
            ...prev.lastKnownFxRates,
            ...(usdFx ? { USD_EUR: usdFx } : {}),
          };

          const draft: DepotPortfolioState = {
            ...prev,
            lastKnownQuotes: mergedQuotes,
            lastKnownFxRates: mergedFx,
            lastUpdatedAt: nowIso,
          };

          // Only append a new chart snapshot on refresh if positions exist and quotes were updated
          if (prev.positions.length === 0) {
            return draft;
          }
          const snap = buildPortfolioSnapshot(draft, 'refresh', nowIso);
          return {
            ...draft,
            snapshots: [...draft.snapshots, snap],
          };
        });
        setLastRefreshedAt(nowIso);
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
    [activeScenario.id, persistPortfolio, portfolio.positions, providerStatus.mode],
  );

  const resetDepot = useCallback(() => {
    const fresh = resetDepotStorage();
    const baseline = setActiveDemoScenario('baseline');
    setActiveScenario(baseline);
    clearMarketClientCache();
    setPortfolio(fresh);
    setMarketError(null);
    setLastRefreshedAt(null);
  }, []);

  const clearMarketError = useCallback(() => {
    setMarketError(null);
  }, []);

  const valuation = useMemo(
    () => evaluatePortfolioValuation(portfolio),
    [portfolio],
  );

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
      isRefreshing,
      marketError,
      lastRefreshedAt,
      createPortfolio,
      buyInstrumentVirtually,
      sellInstrumentVirtually,
      refreshPortfolioQuotes,
      resetDepot,
      clearMarketError,
    }),
    [
      portfolio,
      valuation,
      weeklyReport,
      providerStatus,
      activeScenario,
      isRefreshing,
      marketError,
      lastRefreshedAt,
      createPortfolio,
      buyInstrumentVirtually,
      sellInstrumentVirtually,
      refreshPortfolioQuotes,
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
