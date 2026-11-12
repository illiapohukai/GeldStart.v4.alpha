import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  Lock,
  Plus,
  RefreshCw,
  Sparkles,
  Unlock,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AssetDetailView } from '@/components/depot/AssetDetailView';
import {
  DepotAllocationCard,
  DepotDevelopmentChart,
} from '@/components/depot/DepotCharts';
import { DepotOnboarding } from '@/components/depot/DepotOnboarding';
import {
  VirtualBuyFlowView,
  VirtualSellFlowView,
} from '@/components/depot/VirtualTradeSheet';
import { formatEuro, formatPercent } from '@/lib/calculator';
import {
  formatSignedEuro,
  formatSignedPercent,
  roundCurrency,
} from '@/lib/depot-calculations';
import { useDepot } from '@/lib/depot-context';
import {
  DEMO_INSTRUMENTS,
  getDemoInstrumentMetadata,
  getDemoQuote,
  UNLOCK_NOTIFICATION_TEXT,
} from '@/lib/market-demo-adapter';
import {
  FALLBACK_QUOTE_NOTICE,
  formatGermanDateLabel,
  formatMarketDataStatusBadge,
  formatStaleQuoteNotice,
  MARKET_DATA_SIMULATION_NOTICE,
  marketDataService,
  VIRTUAL_DEPOT_NOTICE,
} from '@/lib/market-service';
import type {
  InstrumentMetadata,
  MarketQuote,
} from '@/lib/market-types';
import { AppLink } from '@/lib/router';

type ActiveDepotSubView =
  | { type: 'overview' }
  | { type: 'buy'; instrument?: InstrumentMetadata | null }
  | { type: 'sell'; symbol?: string | null }
  | {
      type: 'asset_detail';
      instrument: InstrumentMetadata;
      quote: MarketQuote | null;
    };

interface EducationalScenarioComparison {
  id: 'calm' | 'volatile' | 'drawdown' | 'recovery';
  label: string;
  summary: string;
  etfMultiplier: number;
  stockMultiplier: number;
  bondMultiplier: number;
  goldMultiplier: number;
  takeaway: string;
}

const EDUCATIONAL_SCENARIO_COMPARISONS: EducationalScenarioComparison[] = [
  {
    id: 'calm',
    label: 'Ruhiger Verlauf',
    summary: 'Normale Marktphase mit moderater positiver Entwicklung.',
    etfMultiplier: 1.03,
    stockMultiplier: 1.05,
    bondMultiplier: 1.01,
    goldMultiplier: 1.01,
    takeaway:
      'In ruhigen Marktphasen schwanken breit gestreute ETFs meist moderat, während einzelne Aktien stärker nach oben oder unten abweichen können.',
  },
  {
    id: 'volatile',
    label: 'Starke Schwankung',
    summary: 'Hektische Nachrichtenlage mit starken Kursausschlägen bei Einzelaktien.',
    etfMultiplier: 0.98,
    stockMultiplier: 0.89,
    bondMultiplier: 1.0,
    goldMultiplier: 1.03,
    takeaway:
      'Einzelaktien reagieren oft deutlich heftiger auf Quartalszahlen oder Branchennachrichten als ein Welt-ETF mit über 1.400 Unternehmen.',
  },
  {
    id: 'drawdown',
    label: 'Marktrückgang',
    summary: 'Breiter Börsenrücksetzer über mehrere Anlageklassen hinweg.',
    etfMultiplier: 0.9,
    stockMultiplier: 0.82,
    bondMultiplier: 0.99,
    goldMultiplier: 1.02,
    takeaway:
      'Bei einem Marktrückgang sinken fast alle Aktienwerte. Cash-Reserven und Anleihen dämpfen den prozentualen Rückgang des Gesamtdepots.',
  },
  {
    id: 'recovery',
    label: 'Erholung',
    summary: 'Langfristige Aufwärtsbewegung nach einer schwächeren Börsenphase.',
    etfMultiplier: 1.08,
    stockMultiplier: 1.12,
    bondMultiplier: 1.02,
    goldMultiplier: 1.03,
    takeaway:
      'Wer breit gestreut investiert bleibt und Rücksetzer nicht aus Panik verkauft, profitiert langfristig von Markterholungen.',
  },
];

export function DepotPage() {
  const {
    portfolio,
    valuation,
    weeklyReport,
    providerStatus,
    catalogueQuotes,
    unlockedAssets,
    newlyUnlockedNotice,
    isInstrumentUnlocked,
    dismissUnlockedNotice,
    isRefreshing,
    marketError,
    lastRefreshedAt,
    refreshPortfolioQuotes,
    clearMarketError,
  } = useDepot();

  const [subView, setSubView] = useState<ActiveDepotSubView>({
    type: 'overview',
  });
  const [showStatusInfo, setShowStatusInfo] = useState(false);
  const [showPortfolioCheckDetails, setShowPortfolioCheckDetails] =
    useState(false);
  const [showEducationalScenarioBox, setShowEducationalScenarioBox] =
    useState(false);
  const [selectedEduScenarioId, setSelectedEduScenarioId] = useState<
    EducationalScenarioComparison['id']
  >('calm');
  const [showTransactions, setShowTransactions] = useState(true);
  const [showCatalogueUnlocks, setShowCatalogueUnlocks] = useState(false);

  // Support URL query parameter ?symbol=EUNL.DE from Learning modules
  useEffect(() => {
    if (!portfolio.isInitialized || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const symbolParam = params.get('symbol');
    if (symbolParam) {
      const meta = getDemoInstrumentMetadata(symbolParam);
      const q =
        catalogueQuotes[symbolParam.toUpperCase()] ??
        portfolio.lastKnownQuotes[symbolParam.toUpperCase()] ??
        getDemoQuote(symbolParam);
      if (meta) {
        setSubView({ type: 'asset_detail', instrument: meta, quote: q });
      }
    }
  }, [portfolio.isInitialized, catalogueQuotes, portfolio.lastKnownQuotes]);

  if (!portfolio.isInitialized) {
    return <DepotOnboarding />;
  }

  const resolveInstrumentQuote = (symbol: string): MarketQuote | null => {
    const upper = symbol.trim().toUpperCase();
    return (
      catalogueQuotes[upper] ??
      portfolio.lastKnownQuotes[upper] ??
      getDemoQuote(upper)
    );
  };

  const handleOpenPositionDetail = async (symbol: string) => {
    const meta = await marketDataService.getInstrumentDetails(symbol);
    if (!meta) return;
    const q = resolveInstrumentQuote(symbol);
    setSubView({ type: 'asset_detail', instrument: meta, quote: q });
  };

  const handleOpenBuyForSymbol = async (symbol: string) => {
    const meta = await marketDataService.getInstrumentDetails(symbol);
    if (meta && !isInstrumentUnlocked(meta.symbol)) {
      return;
    }
    setSubView({ type: 'buy', instrument: meta });
  };

  if (subView.type === 'asset_detail') {
    const holding =
      valuation.valuedPositions.find(
        (p) =>
          p.symbol.toUpperCase() === subView.instrument.symbol.toUpperCase(),
      ) ?? null;

    return (
      <AssetDetailView
        instrument={subView.instrument}
        quote={
          resolveInstrumentQuote(subView.instrument.symbol) ?? subView.quote
        }
        holding={holding}
        onBack={() => setSubView({ type: 'overview' })}
        onStartBuy={(inst) => setSubView({ type: 'buy', instrument: inst })}
        onStartSell={(sym) => setSubView({ type: 'sell', symbol: sym })}
      />
    );
  }

  if (subView.type === 'buy') {
    return (
      <VirtualBuyFlowView
        initialInstrument={subView.instrument}
        onClose={() => setSubView({ type: 'overview' })}
        onOpenAssetDetail={(inst, q) =>
          setSubView({ type: 'asset_detail', instrument: inst, quote: q })
        }
      />
    );
  }

  if (subView.type === 'sell') {
    return (
      <VirtualSellFlowView
        initialSymbol={subView.symbol}
        onClose={() => setSubView({ type: 'overview' })}
      />
    );
  }

  const isPositive = valuation.totalGainLossEur > 0;
  const isNegative = valuation.totalGainLossEur < 0;

  const largestPosition =
    valuation.valuedPositions.length > 0 ? valuation.valuedPositions[0] : null;

  const selectedEduScenario =
    EDUCATIONAL_SCENARIO_COMPARISONS.find(
      (s) => s.id === selectedEduScenarioId,
    ) ?? EDUCATIONAL_SCENARIO_COMPARISONS[0];

  const hypotheticalPositionsValueEur = roundCurrency(
    valuation.valuedPositions.reduce((acc, pos) => {
      const mult =
        pos.assetType === 'ETF'
          ? selectedEduScenario.etfMultiplier
          : pos.assetType === 'Aktie'
            ? selectedEduScenario.stockMultiplier
            : pos.assetType === 'Anleihen-ETF'
              ? selectedEduScenario.bondMultiplier
              : selectedEduScenario.goldMultiplier;
      return acc + pos.currentValueEur * mult;
    }, 0),
  );
  const hypotheticalTotalEur = roundCurrency(
    valuation.cashEur + hypotheticalPositionsValueEur,
  );
  const hypotheticalDeltaEur = roundCurrency(
    hypotheticalTotalEur - valuation.totalPortfolioValueEur,
  );

  // Determine overall catalogue quote status for transparent notices
  const allCatalogueQuotesList = Object.values(catalogueQuotes).filter(
    (q) => q.symbol !== 'EUR-CASH',
  );
  const hasStaleQuotes =
    valuation.valuedPositions.some((p) => p.dataStatus === 'stale') ||
    allCatalogueQuotesList.some((q) => q.status === 'stale');
  const hasFallbackQuotes =
    valuation.valuedPositions.some(
      (p) => p.dataStatus === 'fallback' || p.dataStatus === 'demo' || p.isDemo,
    ) ||
    (allCatalogueQuotesList.length > 0 &&
      allCatalogueQuotesList.every((q) => q.status === 'fallback' || q.isDemo));

  const sampleTimestamp =
    valuation.valuedPositions[0]?.priceTimestamp ??
    allCatalogueQuotesList[0]?.marketTime ??
    lastRefreshedAt ??
    portfolio.lastUpdatedAt;
  const priceDateFormatted = formatGermanDateLabel(sampleTimestamp);

  const unlockedTradableCount = DEMO_INSTRUMENTS.filter((inst) =>
    isInstrumentUnlocked(inst.symbol),
  ).length;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* A. COMPACT STATUS HEADER & VISIBLE EDUCATIONAL NOTICE */}
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span
              data-testid="depot-virtual-notice"
              className="text-xs font-bold uppercase tracking-wider text-[var(--depot-accent-lime)]"
            >
              {VIRTUAL_DEPOT_NOTICE}
            </span>
            <button
              type="button"
              onClick={() => setShowStatusInfo((v) => !v)}
              aria-expanded={showStatusInfo}
              className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--depot-text-secondary)] hover:text-[var(--depot-text-primary)] transition-colors"
            >
              <span data-testid="depot-data-status-label">
                Kursdatum: {priceDateFormatted} ·{' '}
                {hasFallbackQuotes
                  ? 'Demowerte (Ausgangsversion)'
                  : providerStatus.statusLabel}
              </span>
              <Info
                className="h-3.5 w-3.5 text-[var(--depot-accent-lime)] shrink-0"
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="depot-action-refresh"
              disabled={isRefreshing}
              onClick={() => void refreshPortfolioQuotes()}
              aria-label={isRefreshing ? 'Kurse werden aktualisiert' : 'Kurse aktualisieren'}
              title="Kurse aktualisieren"
              className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center gap-1.5 rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] px-2.5 py-1.5 text-xs font-semibold text-[var(--depot-text-secondary)] hover:text-[var(--depot-text-primary)] disabled:opacity-50 transition-colors"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[var(--depot-accent-lime)]' : ''}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">
                {isRefreshing ? 'Aktualisiere …' : 'Aktualisieren'}
              </span>
            </button>
          </div>
        </div>

        {/* Always visible Market-Data Simulation Notice */}
        <p
          data-testid="depot-market-simulation-notice"
          className="text-[11px] sm:text-xs text-[var(--depot-text-secondary)] leading-relaxed"
        >
          {MARKET_DATA_SIMULATION_NOTICE}
        </p>

        {/* Conditional Stale Notice */}
        {hasStaleQuotes && (
          <div
            data-testid="depot-stale-data-notice"
            className="rounded-xl border border-[var(--depot-warning)]/40 bg-[var(--depot-warning)]/10 px-3.5 py-2 text-xs text-[var(--depot-text-primary)]"
          >
            {formatStaleQuoteNotice(sampleTimestamp)}
          </div>
        )}

        {/* Conditional Fallback Notice */}
        {hasFallbackQuotes && (
          <div
            data-testid="depot-fallback-data-notice"
            className="rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] px-3.5 py-2 text-xs text-[var(--depot-text-secondary)]"
          >
            {FALLBACK_QUOTE_NOTICE}
          </div>
        )}

        {/* Expandable Info Disclosure */}
        {showStatusInfo && (
          <div className="rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] p-3.5 text-xs text-[var(--depot-text-secondary)] space-y-1.5">
            <div className="font-bold text-[var(--depot-text-primary)]">
              Hinweis zur Simulation & Datenquelle
            </div>
            <p className="leading-relaxed">
              {VIRTUAL_DEPOT_NOTICE} {MARKET_DATA_SIMULATION_NOTICE}
            </p>
            <p className="text-[11px] text-[var(--depot-text-muted)]">
              Quellen im Schulprototyp: Börse Frankfurt (Xetra-Kurse in EUR), Nasdaq (US-Aktien in USD) sowie EZB-Referenzwechselkurs über Frankfurter API.
            </p>
          </div>
        )}
      </header>

      {/* Newly Unlocked Asset Class Banner */}
      {newlyUnlockedNotice && (
        <div
          role="status"
          data-testid="depot-unlock-banner"
          className="rounded-xl border border-[var(--depot-accent-lime)]/50 bg-[var(--depot-accent-lime)]/10 p-3.5 flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles
              className="h-4 w-4 text-[var(--depot-accent-lime)] shrink-0"
              aria-hidden="true"
            />
            <div>
              <strong className="font-bold text-[var(--depot-text-primary)]">
                {UNLOCK_NOTIFICATION_TEXT}
              </strong>
              <span className="text-[var(--depot-text-secondary)] ml-1.5">
                Durch deinen Lernfortschritt stehen weitere Wertpapiere zur Verfügung.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissUnlockedNotice}
            className="min-h-[30px] px-2 py-1 font-semibold text-[var(--depot-text-primary)] underline shrink-0"
          >
            Ausblenden
          </button>
        </div>
      )}

      {/* Market Error Alert */}
      {marketError && (
        <div
          role="alert"
          className="rounded-xl border border-[var(--depot-warning)]/50 bg-[var(--depot-warning)]/10 p-3.5 flex items-start justify-between gap-3 text-xs"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              className="h-4 w-4 text-[var(--depot-warning)] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="space-y-0.5">
              <strong className="font-bold text-[var(--depot-text-primary)] block">
                Hinweis zum Kursabruf ({marketError.code})
              </strong>
              <p className="text-[var(--depot-text-secondary)] leading-relaxed">
                {marketError.message}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearMarketError}
            className="min-h-[32px] px-2 py-1 font-semibold text-[var(--depot-text-primary)] underline shrink-0"
          >
            Schließen
          </button>
        </div>
      )}

      {/* B. PORTFOLIO HERO */}
      <section
        aria-labelledby="depot-overview-heading"
        className="depot-card p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <h1
              id="depot-overview-heading"
              className="text-xs font-semibold text-[var(--depot-text-secondary)]"
            >
              Virtuelles Gesamtvermögen ({valuation.portfolioName})
            </h1>
            <div
              data-testid="depot-total-value"
              className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-[var(--depot-text-primary)]"
            >
              {formatEuro(valuation.totalPortfolioValueEur, 2)}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--depot-text-muted)]">
                Virtueller Gewinn oder Verlust:
              </span>
              <div
                data-testid="depot-total-gain-loss"
                className={`inline-flex items-center gap-1 font-mono text-xs sm:text-sm font-bold tabular-nums ${
                  isPositive
                    ? 'text-[var(--depot-positive)]'
                    : isNegative
                      ? 'text-[var(--depot-negative)]'
                      : 'text-[var(--depot-text-secondary)]'
                }`}
              >
                {isPositive && (
                  <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                {isNegative && (
                  <ArrowDownRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <span>
                  {formatSignedEuro(valuation.totalGainLossEur, 2)} (
                  {formatSignedPercent(valuation.totalPerformancePercent, 2)})
                </span>
              </div>
            </div>
          </div>

          {/* Primary CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              data-testid="depot-action-invest"
              onClick={() => setSubView({ type: 'buy', instrument: null })}
              className="depot-btn-lime w-full sm:w-auto inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold whitespace-nowrap"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Kaufen / Investieren</span>
            </button>
            {valuation.valuedPositions.length > 0 && (
              <button
                type="button"
                data-testid="depot-action-sell"
                onClick={() => setSubView({ type: 'sell', symbol: null })}
                className="depot-btn-secondary w-full sm:w-auto inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap"
              >
                <span>Verkaufen</span>
              </button>
            )}
          </div>
        </div>

        {/* Overview Key Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[var(--depot-border)] text-xs">
          <div>
            <span className="text-[var(--depot-text-muted)] block">
              Verfügbares Spielgeld
            </span>
            <span
              data-testid="depot-cash-value"
              className="mt-0.5 font-mono text-sm sm:text-base font-bold tabular-nums text-[var(--depot-text-primary)] block"
            >
              {formatEuro(valuation.cashEur, 2)}
            </span>
          </div>
          <div>
            <span className="text-[var(--depot-text-muted)] block">
              Wert der Anlagen
            </span>
            <span
              data-testid="depot-positions-value"
              className="mt-0.5 font-mono text-sm sm:text-base font-bold tabular-nums text-[var(--depot-text-primary)] block"
            >
              {formatEuro(valuation.positionsMarketValueEur, 2)}
            </span>
          </div>
          <div>
            <span className="text-[var(--depot-text-muted)] block">
              Anzahl Positionen
            </span>
            <span
              data-testid="depot-positions-count"
              className="mt-0.5 font-mono text-sm sm:text-base font-bold tabular-nums text-[var(--depot-text-primary)] block"
            >
              {valuation.valuedPositions.length}
            </span>
          </div>
          <div>
            <span className="text-[var(--depot-text-muted)] block">
              Kursstand / Datum
            </span>
            <span
              data-testid="depot-price-date"
              className="mt-0.5 font-mono text-sm sm:text-base font-bold tabular-nums text-[var(--depot-text-primary)] block"
            >
              {priceDateFormatted}
            </span>
          </div>
        </div>
      </section>

      {/* C. PORTFOLIO DEVELOPMENT */}
      <DepotDevelopmentChart
        snapshots={portfolio.snapshots}
        valuation={valuation}
      />

      {/* D. POSITIONS */}
      <section aria-labelledby="depot-positions-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="depot-positions-heading"
            className="text-base sm:text-lg font-bold text-[var(--depot-text-primary)]"
          >
            Positionen ({valuation.valuedPositions.length})
          </h2>
          {valuation.valuedPositions.length > 0 && (
            <button
              type="button"
              onClick={() => setSubView({ type: 'buy', instrument: null })}
              className="inline-flex min-h-[36px] items-center gap-1 text-xs font-bold text-[var(--depot-accent-lime)] hover:underline"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Position hinzufügen</span>
            </button>
          )}
        </div>

        {valuation.valuedPositions.length === 0 ? (
          <div className="depot-card p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--depot-text-primary)]">
                Noch keine Positionen im Übungsdepot
              </h3>
              <p className="text-xs sm:text-sm text-[var(--depot-text-secondary)] leading-relaxed">
                Du startest mit 5.000,00 € virtuellem Spielgeld. Kaufe zum Einstieg den direkt freigeschalteten MSCI World ETF oder schalte durch abgeschlossene Lektionen weitere Anlageklassen frei.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSubView({ type: 'buy', instrument: null })}
                className="depot-btn-lime inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Erste Position hinzufügen</span>
              </button>

              <button
                type="button"
                data-testid="quick-start-etf-btn"
                onClick={() => void handleOpenBuyForSymbol('EUNL.DE')}
                className="depot-btn-secondary inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold"
              >
                <span>MSCI World ETF direkt testen</span>
                <ArrowRight className="h-3.5 w-3.5 text-[var(--depot-accent-lime)]" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {valuation.valuedPositions.map((pos) => {
              const posPositive = pos.unrealizedGainLossEur > 0;
              const posNegative = pos.unrealizedGainLossEur < 0;
              const statusInfo = formatMarketDataStatusBadge(
                pos.dataStatus,
                pos.isDemo,
                pos.priceTimestamp,
              );
              const posDateLabel = formatGermanDateLabel(pos.priceTimestamp);

              return (
                <article
                  key={pos.symbol}
                  data-testid={`position-card-${pos.symbol}`}
                  onClick={() => void handleOpenPositionDetail(pos.symbol)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      void handleOpenPositionDetail(pos.symbol);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${pos.name} (${pos.symbol}) Details öffnen`}
                  className="depot-card p-4 space-y-2.5 cursor-pointer hover:border-[var(--depot-accent-lime)]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--depot-accent-lime)]"
                >
                  {/* Row 1: Symbol & Virtual Profit/Loss */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-sm font-bold text-[var(--depot-text-primary)]">
                        {pos.symbol}
                      </span>
                      <span className="rounded-md border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--depot-text-secondary)]">
                        {pos.assetType}
                      </span>
                    </div>

                    <div
                      data-testid={`position-pnl-${pos.symbol}`}
                      className={`inline-flex items-center gap-0.5 font-mono text-xs font-bold tabular-nums shrink-0 ${
                        posPositive
                          ? 'text-[var(--depot-positive)]'
                          : posNegative
                            ? 'text-[var(--depot-negative)]'
                            : 'text-[var(--depot-text-secondary)]'
                      }`}
                    >
                      {posPositive && (
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {posNegative && (
                        <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>
                        {formatSignedEuro(pos.unrealizedGainLossEur, 2)} (
                        {formatSignedPercent(pos.unrealizedGainLossPercent, 2)})
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Asset Name & Current Position Value */}
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[var(--depot-text-secondary)] truncate">
                      {pos.name}
                    </h3>
                    <div
                      data-testid={`position-value-${pos.symbol}`}
                      className="font-mono text-base font-extrabold tabular-nums text-[var(--depot-text-primary)] shrink-0"
                    >
                      {formatEuro(pos.currentValueEur, 2)}
                    </div>
                  </div>

                  {/* Row 3: Quantity, Avg Purchase Price, Current Cached Price */}
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-2 border-t border-[var(--depot-border)] text-[11px] text-[var(--depot-text-muted)] font-mono tabular-nums">
                    <div>
                      <span data-testid={`position-qty-${pos.symbol}`}>
                        {pos.quantity.toLocaleString('de-DE', {
                          maximumFractionDigits: 4,
                        })}{' '}
                        Stk.
                      </span>{' '}
                      · Ø Kauf{' '}
                      <span data-testid={`position-avg-price-${pos.symbol}`}>
                        {formatEuro(pos.averagePurchasePriceEur, 2)}
                      </span>{' '}
                      · Aktuell{' '}
                      <span data-testid={`position-current-price-${pos.symbol}`}>
                        {formatEuro(pos.currentPriceEur, 2)}
                      </span>
                    </div>
                    <button
                      type="button"
                      data-testid={`position-sell-btn-${pos.symbol}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSubView({ type: 'sell', symbol: pos.symbol });
                      }}
                      className="font-sans text-[11px] font-bold text-[var(--depot-accent-lime)] hover:underline"
                    >
                      Verkaufen
                    </button>
                  </div>

                  {/* Row 4: Price Timestamp & Data Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--depot-text-muted)]">
                    <span data-testid={`position-timestamp-${pos.symbol}`}>
                      Kursstand: {posDateLabel}
                    </span>
                    <span data-testid={`position-status-${pos.symbol}`}>
                      {pos.isDemo || pos.dataStatus === 'fallback'
                        ? FALLBACK_QUOTE_NOTICE
                        : pos.dataStatus === 'stale'
                          ? formatStaleQuoteNotice(pos.priceTimestamp)
                          : statusInfo.shortText}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* D2. LESSON-BASED ASSET UNLOCKING OVERVIEW */}
      <section
        aria-labelledby="depot-unlocks-heading"
        data-testid="depot-unlocks-section"
        className="depot-card p-4 sm:p-5 space-y-3"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--depot-accent-lime)]">
              {UNLOCK_NOTIFICATION_TEXT} · Lernfortschritt
            </div>
            <h2
              id="depot-unlocks-heading"
              className="mt-0.5 text-sm sm:text-base font-bold text-[var(--depot-text-primary)]"
            >
              Freigeschaltete Wertpapiere ({unlockedTradableCount} von{' '}
              {DEMO_INSTRUMENTS.length})
            </h2>
          </div>

          <button
            type="button"
            data-testid="depot-toggle-unlocks-btn"
            onClick={() => setShowCatalogueUnlocks((v) => !v)}
            aria-expanded={showCatalogueUnlocks}
            className="depot-btn-secondary inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold shrink-0"
          >
            <span>{showCatalogueUnlocks ? 'Ausblenden' : 'Katalog & Regeln'}</span>
            {showCatalogueUnlocks ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>

        {showCatalogueUnlocks && (
          <div className="pt-3 border-t border-[var(--depot-border)] space-y-3 text-xs">
            <p className="text-[var(--depot-text-secondary)] leading-relaxed">
              Im Übungsdepot schaltest du neue Anlageklassen schrittweise durch abgeschlossene Lektionen frei:
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {DEMO_INSTRUMENTS.map((inst) => {
                const unlocked = isInstrumentUnlocked(inst.symbol);
                const q = resolveInstrumentQuote(inst.symbol);
                return (
                  <div
                    key={inst.symbol}
                    data-testid={`catalogue-item-${inst.symbol}`}
                    className={`rounded-xl border p-3 flex items-center justify-between gap-2 ${
                      unlocked
                        ? 'border-[var(--depot-border)] bg-[var(--depot-bg-secondary)]'
                        : 'border-[var(--depot-border)]/60 bg-[var(--depot-bg-secondary)]/50 opacity-80'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        {unlocked ? (
                          <Unlock
                            className="h-3.5 w-3.5 text-[var(--depot-accent-lime)] shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <Lock
                            className="h-3.5 w-3.5 text-[var(--depot-text-muted)] shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        <span className="font-mono font-bold text-[var(--depot-text-primary)]">
                          {inst.symbol}
                        </span>
                        <span className="text-[10px] text-[var(--depot-text-muted)]">
                          {inst.assetType}
                        </span>
                      </div>
                      <div className="text-[var(--depot-text-secondary)] font-medium truncate">
                        {inst.name}
                      </div>
                      <div className="text-[10px] text-[var(--depot-text-muted)]">
                        {inst.unlockRequirementText ?? inst.unlockReasonLabel ?? 'Sofort verfügbar'}
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      {q && (
                        <div className="font-mono text-xs font-bold text-[var(--depot-text-primary)]">
                          {formatEuro(
                            q.priceEur && q.priceEur > 0 ? q.priceEur : q.price,
                            2,
                          )}
                        </div>
                      )}
                      {unlocked ? (
                        <button
                          type="button"
                          onClick={() => void handleOpenBuyForSymbol(inst.symbol)}
                          className="text-[11px] font-bold text-[var(--depot-accent-lime)] hover:underline"
                        >
                          Kaufen →
                        </button>
                      ) : (
                        <AppLink
                          to="/lernen"
                          className="text-[11px] font-semibold text-[var(--depot-text-muted)] hover:text-[var(--depot-accent-lime)] underline"
                        >
                          Lektion öffnen
                        </AppLink>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* E. ALLOCATION */}
      <DepotAllocationCard valuation={valuation} />

      {/* F. EDUCATIONAL PORTFOLIO-CHECK (Compact, Expandable) */}
      <section
        aria-label="Portfolio-Check"
        data-testid="depot-educational-insight"
        className="depot-card p-4 sm:p-5 space-y-3"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--depot-accent-lime)]">
              Portfolio-Check
            </div>
            <h2 className="mt-0.5 text-sm sm:text-base font-bold text-[var(--depot-text-primary)] truncate">
              {largestPosition
                ? `Größte Position: ${largestPosition.symbol} · ${formatPercent(largestPosition.weightOfPortfolioPercent, 0)}`
                : '100 % Cash · Noch keine Positionen'}
            </h2>
          </div>

          <button
            type="button"
            data-testid="depot-action-analyze"
            onClick={() => setShowPortfolioCheckDetails((v) => !v)}
            aria-expanded={showPortfolioCheckDetails}
            className="depot-btn-secondary inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold shrink-0"
          >
            <span>{showPortfolioCheckDetails ? 'Weniger' : 'Einordnung'}</span>
            {showPortfolioCheckDetails ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>

        {showPortfolioCheckDetails && (
          <div className="pt-3 border-t border-[var(--depot-border)] space-y-3 text-xs sm:text-sm">
            <div className="space-y-1">
              <div className="font-bold text-[var(--depot-text-primary)]">
                {valuation.primaryInsight.title}
              </div>
              <p className="text-[var(--depot-text-secondary)] leading-relaxed">
                {valuation.primaryInsight.explanation}
              </p>
            </div>

            {weeklyReport.hasEnoughData && (
              <div className="rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] p-3.5 space-y-1.5 text-xs">
                <div className="font-bold text-[var(--depot-text-primary)]">
                  Streuung & Gewichtung
                </div>
                <p className="text-[var(--depot-text-secondary)] leading-relaxed">
                  {weeklyReport.diversificationNotice}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <AppLink
                to={valuation.primaryInsight.relatedLessonRoute}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] px-3 py-1.5 text-xs font-bold text-[var(--depot-accent-lime)] hover:border-[var(--depot-accent-lime)]/50 transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{valuation.primaryInsight.relatedLessonLabel}</span>
              </AppLink>
            </div>
          </div>
        )}
      </section>

      {/* G. OPTIONAL SEPARATED EDUCATIONAL SCENARIO SANDBOX (Read-Only, Never Mutates Portfolio) */}
      {valuation.valuedPositions.length > 0 && (
        <section
          aria-label="Lernszenario-Vergleich"
          className="depot-card p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--depot-warning)]">
                Lernszenario – keine echte Kursentwicklung
              </span>
              <h2 className="text-sm font-bold text-[var(--depot-text-primary)]">
                Was-wäre-wenn-Rechnung für dein Depot
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowEducationalScenarioBox((v) => !v)}
              aria-expanded={showEducationalScenarioBox}
              className="depot-btn-secondary inline-flex min-h-[36px] items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold"
            >
              <span>{showEducationalScenarioBox ? 'Ausblenden' : 'Szenarien'}</span>
              {showEducationalScenarioBox ? (
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </div>

          {showEducationalScenarioBox && (
            <div className="pt-3 border-t border-[var(--depot-border)] space-y-3 text-xs">
              <p className="text-[var(--depot-text-muted)]">
                Dieses Rechenbeispiel verändert deine gespeicherten Depotwerte nicht. Es zeigt, wie deine aktuelle Aufteilung auf typische Marktphasen reagieren würde:
              </p>

              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-label="Lernszenario auswählen"
              >
                {EDUCATIONAL_SCENARIO_COMPARISONS.map((scen) => {
                  const active = scen.id === selectedEduScenario.id;
                  return (
                    <button
                      key={scen.id}
                      type="button"
                      onClick={() => setSelectedEduScenarioId(scen.id)}
                      className={`min-h-[34px] rounded-lg border px-3 py-1 text-xs font-semibold transition-colors ${
                        active
                          ? 'border-[var(--depot-accent-lime)] bg-[var(--depot-accent-lime)] text-[var(--depot-accent-ink)]'
                          : 'border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] text-[var(--depot-text-secondary)] hover:text-[var(--depot-text-primary)]'
                      }`}
                    >
                      {scen.label}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--depot-text-secondary)]">
                    Hypothetischer Depotwert ({selectedEduScenario.label})
                  </span>
                  <span className="font-mono font-bold tabular-nums text-[var(--depot-text-primary)]">
                    {formatEuro(hypotheticalTotalEur, 2)} (
                    {formatSignedEuro(hypotheticalDeltaEur, 2)})
                  </span>
                </div>
                <p className="text-[var(--depot-text-secondary)] leading-relaxed">
                  {selectedEduScenario.takeaway}
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Simulated Transactions History */}
      {portfolio.transactions.length > 0 && (
        <section
          aria-labelledby="depot-transactions-heading"
          data-testid="depot-transactions-section"
          className="depot-card p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText
                className="h-4 w-4 text-[var(--depot-text-muted)]"
                aria-hidden="true"
              />
              <h2
                id="depot-transactions-heading"
                className="text-sm font-bold text-[var(--depot-text-primary)]"
              >
                Transaktionshistorie ({portfolio.transactions.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowTransactions((v) => !v)}
              aria-expanded={showTransactions}
              className="text-xs font-semibold text-[var(--depot-text-secondary)] hover:text-[var(--depot-text-primary)]"
            >
              {showTransactions ? 'Ausblenden' : 'Anzeigen'}
            </button>
          </div>

          {showTransactions && (
            <div className="divide-y divide-[var(--depot-border)] pt-2 border-t border-[var(--depot-border)] text-xs">
              {portfolio.transactions.slice(0, 10).map((tx) => (
                <div
                  key={tx.id}
                  data-testid={`transaction-row-${tx.id}`}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[var(--depot-text-primary)] truncate">
                      {tx.type === 'BUY' ? 'Kauf' : 'Verkauf'} · {tx.instrumentName} ({tx.symbol})
                    </div>
                    <div className="text-[11px] text-[var(--depot-text-muted)] font-mono tabular-nums">
                      {tx.quantity.toLocaleString('de-DE', {
                        maximumFractionDigits: 4,
                      })}{' '}
                      Stk. × {formatEuro(tx.executionPriceEur ?? tx.priceEur, 2)} · Stand{' '}
                      {formatGermanDateLabel(tx.quoteFetchedAt ?? tx.priceTimestamp)}
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold tabular-nums text-[var(--depot-text-primary)] shrink-0">
                    {formatEuro(tx.totalEur ?? tx.totalAmountEur, 2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Compact Legal & Reset Footer */}
      <footer className="px-1 pt-1 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-[var(--depot-text-muted)]">
        <span>
          {VIRTUAL_DEPOT_NOTICE} {MARKET_DATA_SIMULATION_NOTICE}
        </span>
        <AppLink
          to="/mehr"
          className="font-semibold text-[var(--depot-text-secondary)] hover:text-[var(--depot-accent-lime)] underline shrink-0"
        >
          Depot zurücksetzen ({unlockedAssets.length} Werte freigeschaltet)
        </AppLink>
      </footer>
    </div>
  );
}
