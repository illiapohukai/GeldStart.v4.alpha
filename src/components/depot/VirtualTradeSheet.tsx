import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Info,
  Lock,
  Search,
  ShieldAlert,
  Unlock,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatEuro, formatPercent } from '@/lib/calculator';
import {
  type DepotTransaction,
  formatOriginalCurrency,
  formatSignedEuro,
  formatSignedPercent,
  previewVirtualBuy,
  previewVirtualSell,
  roundCurrency,
  roundQuantity,
} from '@/lib/depot-calculations';
import { useDepot } from '@/lib/depot-context';
import { getDemoQuote } from '@/lib/market-demo-adapter';
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
  ExchangeRateQuote,
  InstrumentAssetType,
  InstrumentMetadata,
  MarketQuote,
} from '@/lib/market-types';
import { AppLink } from '@/lib/router';

function getCompactBadgeCode(assetType: InstrumentAssetType): string {
  switch (assetType) {
    case 'ETF':
      return 'ETF';
    case 'Aktie':
      return 'AKT';
    case 'Anleihen-ETF':
      return 'ANL';
    case 'Rohstoff-ETC':
      return 'GLD';
  }
}

export function VirtualBuyFlowView({
  initialInstrument,
  onClose,
  onOpenAssetDetail,
}: {
  initialInstrument?: InstrumentMetadata | null;
  onClose: () => void;
  onOpenAssetDetail: (instrument: InstrumentMetadata, quote: MarketQuote | null) => void;
}) {
  const {
    portfolio,
    catalogueQuotes,
    usdToEurRate,
    fxReferenceDate,
    isInstrumentUnlocked,
    buyInstrumentVirtually,
  } = useDepot();
  const [step, setStep] = useState<'select' | 'configure' | 'preview' | 'success'>(
    initialInstrument ? 'configure' : 'select',
  );

  // Step 1 state: Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<InstrumentAssetType | 'ALL'>('ALL');
  const [instruments, setInstruments] = useState<InstrumentMetadata[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [previewDrawerInstrument, setPreviewDrawerInstrument] =
    useState<InstrumentMetadata | null>(null);

  // Selected instrument & quote state
  const [selectedInstrument, setSelectedInstrument] =
    useState<InstrumentMetadata | null>(initialInstrument ?? null);
  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [fxQuote, setFxQuote] = useState<ExchangeRateQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  // Step 2 state: Order input
  const [inputMode, setInputMode] = useState<'amount_eur' | 'quantity'>('amount_eur');
  const [rawInputValue, setRawInputValue] = useState<string>('500');

  // Step 4 state: Completed transaction & reflection
  const [completedTx, setCompletedTx] = useState<DepotTransaction | null>(null);
  const [completedWeightPct, setCompletedWeightPct] = useState<number>(0);
  const [reflectionChoice, setReflectionChoice] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoadingSearch(true);
    setSearchError(null);
    marketDataService
      .searchInstruments(searchQuery, filterType)
      .then((list) => {
        if (active) setInstruments(list);
      })
      .catch((err: unknown) => {
        if (active) {
          setSearchError(
            err instanceof Error
              ? err.message
              : 'Wertpapiersuche fehlgeschlagen.',
          );
        }
      })
      .finally(() => {
        if (active) setLoadingSearch(false);
      });
    return () => {
      active = false;
    };
  }, [searchQuery, filterType]);

  useEffect(() => {
    if (!selectedInstrument) return;
    const upper = selectedInstrument.symbol.toUpperCase();
    const sharedQ =
      catalogueQuotes[upper] ?? portfolio.lastKnownQuotes[upper];

    if (sharedQ) {
      setQuote(sharedQ);
      if (selectedInstrument.currency !== 'EUR') {
        setFxQuote({
          from: selectedInstrument.currency,
          to: 'EUR',
          rate: usdToEurRate,
          timestamp: fxReferenceDate ?? sharedQ.fetchedAt ?? sharedQ.timestamp,
          source: 'Frankfurter / EZB-Referenzkurs',
          status: sharedQ.isDemo ? 'demo' : 'delayed',
          isDemo: sharedQ.isDemo,
        });
      } else {
        setFxQuote(null);
      }
      setLoadingQuote(false);
      return;
    }

    let active = true;
    setLoadingQuote(true);
    Promise.all([
      marketDataService.getQuote(selectedInstrument.symbol),
      selectedInstrument.currency !== 'EUR'
        ? marketDataService.getExchangeRate(selectedInstrument.currency, 'EUR')
        : Promise.resolve(null),
    ])
      .then(([q, fx]) => {
        if (active) {
          setQuote(q);
          setFxQuote(fx);
        }
      })
      .catch(() => {
        if (active) {
          setQuote(getDemoQuote(selectedInstrument.symbol));
        }
      })
      .finally(() => {
        if (active) setLoadingQuote(false);
      });
    return () => {
      active = false;
    };
  }, [selectedInstrument, catalogueQuotes, portfolio.lastKnownQuotes, usdToEurRate, fxReferenceDate]);

  const numericValue = Number(rawInputValue.replace(',', '.'));
  const buyPreview = selectedInstrument
    ? previewVirtualBuy({
        portfolio,
        instrument: selectedInstrument,
        quote,
        input: {
          mode: inputMode,
          value: Number.isFinite(numericValue) ? numericValue : 0,
        },
        fxRateToEur:
          selectedInstrument.currency === 'EUR' ? 1 : (fxQuote?.rate ?? usdToEurRate),
        fxTimestamp: fxQuote?.timestamp ?? quote?.timestamp,
        enforceUnlock: true,
      })
    : null;

  const handleConfirmBuy = () => {
    if (!selectedInstrument || !quote || !buyPreview || !buyPreview.valid) return;
    const tx = buyInstrumentVirtually({
      instrument: selectedInstrument,
      quote,
      input: {
        mode: inputMode,
        value: numericValue,
      },
      fxRateToEur: buyPreview.fxRateToEur,
      fxTimestamp: buyPreview.fxTimestamp,
    });
    setCompletedTx(tx);
    setCompletedWeightPct(buyPreview.resultingPortfolioWeightPercent);
    setStep('success');
  };

  const handleSelectInstrumentToConfigure = (inst: InstrumentMetadata) => {
    if (!isInstrumentUnlocked(inst.symbol)) return;
    setPreviewDrawerInstrument(null);
    setSelectedInstrument(inst);
    if (portfolio.cashEur < 500 && portfolio.cashEur > 0) {
      setRawInputValue(String(Math.floor(portfolio.cashEur)));
    }
    setStep('configure');
  };

  const drawerQuote = previewDrawerInstrument
    ? catalogueQuotes[previewDrawerInstrument.symbol.toUpperCase()] ??
      portfolio.lastKnownQuotes[previewDrawerInstrument.symbol.toUpperCase()] ??
      getDemoQuote(previewDrawerInstrument.symbol)
    : null;

  return (
    <section
      aria-labelledby="virtual-buy-heading"
      className="depot-card p-5 sm:p-6 space-y-5"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--depot-border)] pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--depot-accent-lime)]">
            {VIRTUAL_DEPOT_NOTICE}
          </p>
          <h2
            id="virtual-buy-heading"
            className="text-lg sm:text-xl font-bold text-[var(--depot-text-primary)]"
          >
            {step === 'select' && 'Wertpapier im Bildungskatalog wählen'}
            {step === 'configure' && 'Betrag wählen'}
            {step === 'preview' && 'Order prüfen'}
            {step === 'success' && 'Virtueller Kauf ausgeführt'}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Kaufansicht schließen"
          className="inline-flex min-h-[42px] min-w-[42px] items-center justify-center rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] text-[var(--depot-text-secondary)] hover:text-[var(--depot-text-primary)] transition-colors"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* STEP 1: Search & Select Curated Instrument */}
      {step === 'select' && (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--depot-text-muted)]"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Im kuratierten Katalog suchen"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Im kuratierten Bildungskatalog filtern (z. B. MSCI World, SAP, NVDA) …"
                className="w-full min-h-[46px] rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] pl-10 pr-4 py-2 text-sm text-[var(--depot-text-primary)] placeholder:text-[var(--depot-text-muted)] focus:border-[var(--depot-accent-lime)] focus:outline-none"
              />
            </div>

            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label="Nach Anlageklasse filtern"
            >
              {(
                [
                  { id: 'ALL', label: 'Alle' },
                  { id: 'ETF', label: 'ETF' },
                  { id: 'Aktie', label: 'Aktien' },
                  { id: 'Anleihen-ETF', label: 'Anleihen' },
                  { id: 'Rohstoff-ETC', label: 'Gold' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
                  className={`min-h-[38px] rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    filterType === tab.id
                      ? 'border-[var(--depot-accent-lime)] bg-[var(--depot-accent-lime)] text-[var(--depot-accent-ink)]'
                      : 'border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] text-[var(--depot-text-secondary)] hover:text-[var(--depot-text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loadingSearch ? (
            <div className="rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] p-6 text-center text-xs text-[var(--depot-text-secondary)]">
              Wertpapiere werden geladen …
            </div>
          ) : searchError ? (
            <div
              role="alert"
              className="rounded-xl border border-[var(--depot-negative)]/50 bg-[var(--depot-negative)]/10 p-4 text-xs text-[var(--depot-text-primary)]"
            >
              {searchError}
            </div>
          ) : instruments.length === 0 ? (
            <div className="rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] p-6 text-center space-y-1.5">
              <p className="text-sm font-bold text-[var(--depot-text-primary)]">
                Kein passendes Wertpapier im Bildungskatalog gefunden.
              </p>
              <p className="text-xs text-[var(--depot-text-secondary)]">
                Probiere Begriffe wie „MSCI World“, „SAP“, „NVDA“ oder „Gold“.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--depot-border)] rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] overflow-hidden">
              {instruments.map((inst) => {
                const upper = inst.symbol.toUpperCase();
                const rowQuote =
                  catalogueQuotes[upper] ??
                  portfolio.lastKnownQuotes[upper] ??
                  getDemoQuote(inst.symbol);
                const badgeCode = getCompactBadgeCode(inst.assetType);
                const unlocked = isInstrumentUnlocked(inst.symbol);
                const eurPrice =
                  rowQuote?.priceEur && rowQuote.priceEur > 0
                    ? rowQuote.priceEur
                    : rowQuote
                      ? inst.currency === 'EUR'
                        ? rowQuote.price
                        : roundCurrency(rowQuote.price * usdToEurRate)
                      : 0;

                return (
                  <div
                    key={inst.symbol}
                    data-testid={`instrument-row-${inst.symbol}`}
                    className={`p-3.5 sm:px-4 flex items-center justify-between gap-3 transition-colors ${
                      unlocked
                        ? 'hover:bg-[var(--depot-surface-elevated)]/60'
                        : 'opacity-75 bg-[var(--depot-bg-secondary)]/40'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewDrawerInstrument(inst)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left"
                    >
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--depot-border)] bg-[var(--depot-surface)] font-mono text-[11px] font-bold text-[var(--depot-accent-lime)]">
                        {badgeCode}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold text-[var(--depot-text-primary)]">
                            {inst.symbol}
                          </span>
                          <span className="text-[11px] text-[var(--depot-text-muted)]">
                            {inst.exchange} · {inst.currency}
                          </span>
                          {unlocked ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--depot-accent-lime)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--depot-accent-lime)]">
                              <Unlock className="h-3 w-3" aria-hidden="true" />
                              <span>Freigeschaltet</span>
                            </span>
                          ) : (
                            <span
                              data-testid={`locked-badge-${inst.symbol}`}
                              className="inline-flex items-center gap-1 rounded-md border border-[var(--depot-border)] bg-[var(--depot-surface)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--depot-text-muted)]"
                            >
                              <Lock className="h-3 w-3" aria-hidden="true" />
                              <span>{inst.unlockRequirementText}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-medium text-[var(--depot-text-secondary)] truncate">
                          {inst.name}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewDrawerInstrument(inst)}
                        className="text-right"
                      >
                        <div className="font-mono text-sm font-bold tabular-nums text-[var(--depot-text-primary)]">
                          {eurPrice > 0 ? formatEuro(eurPrice, 2) : '—'}
                        </div>
                        <div className="text-[10px] text-[var(--depot-text-muted)]">
                          {rowQuote?.isDemo === false
                            ? `Stand ${formatGermanDateLabel(rowQuote.marketTime ?? rowQuote.timestamp)}`
                            : 'Demowert'}
                        </div>
                      </button>

                      {unlocked ? (
                        <button
                          type="button"
                          data-testid={`select-instrument-${inst.symbol}`}
                          onClick={() => handleSelectInstrumentToConfigure(inst)}
                          className="depot-btn-lime min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1"
                        >
                          <span>Auswählen</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          data-testid={`select-instrument-${inst.symbol}`}
                          title={inst.unlockRequirementText}
                          className="min-h-[38px] rounded-xl border border-[var(--depot-border)] bg-[var(--depot-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--depot-text-muted)] cursor-not-allowed inline-flex items-center gap-1"
                        >
                          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Gesperrt</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Compact Preview Sheet / Drawer when a search row is clicked */}
          {previewDrawerInstrument && (
            <div
              role="dialog"
              aria-modal="false"
              aria-labelledby="instrument-preview-title"
              className="rounded-2xl border border-[var(--depot-accent-lime)]/40 bg-[var(--depot-surface-elevated)] p-4 sm:p-5 space-y-4 shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--depot-text-secondary)]">
                    <span className="font-mono font-bold text-[var(--depot-accent-lime)]">
                      {previewDrawerInstrument.symbol}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{previewDrawerInstrument.assetType}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {previewDrawerInstrument.exchange} · {previewDrawerInstrument.currency}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Risiko: {previewDrawerInstrument.riskCategory}</span>
                  </div>
                  <h3
                    id="instrument-preview-title"
                    className="mt-1 text-base font-bold text-[var(--depot-text-primary)]"
                  >
                    {previewDrawerInstrument.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewDrawerInstrument(null)}
                  aria-label="Vorschau schließen"
                  className="rounded-lg p-1.5 text-[var(--depot-text-muted)] hover:text-[var(--depot-text-primary)]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[var(--depot-text-secondary)] leading-relaxed">
                {previewDrawerInstrument.shortExplanation}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] px-3.5 py-2.5 text-xs">
                <div>
                  <span className="text-[var(--depot-text-muted)]">Referenzkurs: </span>
                  <strong className="font-mono text-[var(--depot-text-primary)]">
                    {drawerQuote
                      ? formatOriginalCurrency(
                          drawerQuote.price,
                          previewDrawerInstrument.currency,
                          2,
                        )
                      : '—'}
                  </strong>
                </div>
                <span className="text-[11px] text-[var(--depot-text-muted)]">
                  {drawerQuote
                    ? formatMarketDataStatusBadge(
                        drawerQuote.status,
                        drawerQuote.isDemo,
                        drawerQuote.marketTime ?? drawerQuote.timestamp,
                      ).shortText
                    : FALLBACK_QUOTE_NOTICE}
                </span>
              </div>

              {!isInstrumentUnlocked(previewDrawerInstrument.symbol) && (
                <div className="rounded-xl border border-[var(--depot-warning)]/40 bg-[var(--depot-warning)]/10 p-3 text-xs text-[var(--depot-text-primary)] flex items-center justify-between gap-2">
                  <span>
                    Gesperrt: <strong>{previewDrawerInstrument.unlockRequirementText}</strong>
                  </span>
                  <AppLink
                    to="/lernen"
                    className="font-bold text-[var(--depot-accent-lime)] underline shrink-0"
                  >
                    Zu den Lektionen →
                  </AppLink>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenAssetDetail(previewDrawerInstrument, drawerQuote)}
                  className="depot-btn-secondary min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-semibold"
                >
                  Alle Details
                </button>
                {isInstrumentUnlocked(previewDrawerInstrument.symbol) && (
                  <button
                    type="button"
                    onClick={() => handleSelectInstrumentToConfigure(previewDrawerInstrument)}
                    className="depot-btn-lime min-h-[40px] rounded-xl px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <span>Auswählen</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Enter Amount or Quantity */}
      {step === 'configure' && selectedInstrument && (
        <div className="space-y-5">
          <div className="rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-xs text-[var(--depot-text-muted)]">
                {selectedInstrument.symbol} · {selectedInstrument.assetType} ·{' '}
                {selectedInstrument.exchange} · {selectedInstrument.currency}
              </div>
              <h3 className="text-base font-bold text-[var(--depot-text-primary)]">
                {selectedInstrument.name}
              </h3>
            </div>
            <div className="sm:text-right">
              <div className="text-xs text-[var(--depot-text-muted)]">
                Verfügbares Spielgeld
              </div>
              <div className="font-mono text-base font-bold tabular-nums text-[var(--depot-accent-lime)]">
                {formatEuro(portfolio.cashEur, 2)}
              </div>
            </div>
          </div>

          {loadingQuote ? (
            <div className="rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] p-6 text-center text-xs text-[var(--depot-text-secondary)]">
              Referenzkurs wird geladen …
            </div>
          ) : (
            <>
              <div className="space-y-3.5">
                <div
                  className="inline-flex rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] p-1"
                  role="tablist"
                  aria-label="Eingabemodus wählen"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={inputMode === 'amount_eur'}
                    onClick={() => {
                      setInputMode('amount_eur');
                      setRawInputValue('500');
                    }}
                    className={`min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      inputMode === 'amount_eur'
                        ? 'bg-[var(--depot-surface-elevated)] text-[var(--depot-text-primary)]'
                        : 'text-[var(--depot-text-muted)] hover:text-[var(--depot-text-primary)]'
                    }`}
                  >
                    Betrag (€)
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={inputMode === 'quantity'}
                    onClick={() => {
                      setInputMode('quantity');
                      setRawInputValue('2');
                    }}
                    className={`min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      inputMode === 'quantity'
                        ? 'bg-[var(--depot-surface-elevated)] text-[var(--depot-text-primary)]'
                        : 'text-[var(--depot-text-muted)] hover:text-[var(--depot-text-primary)]'
                    }`}
                  >
                    Stückzahl
                  </button>
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="virtual-buy-input"
                    className="block text-sm font-semibold text-[var(--depot-text-primary)]"
                  >
                    {inputMode === 'amount_eur'
                      ? 'Wie viel möchtest du virtuell investieren?'
                      : 'Wie viele Anteile möchtest du virtuell kaufen?'}
                  </label>
                  <div className="flex items-center gap-2.5">
                    <input
                      id="virtual-buy-input"
                      data-testid="virtual-buy-value-input"
                      type="number"
                      min={0}
                      step={inputMode === 'amount_eur' ? 25 : 0.1}
                      value={rawInputValue}
                      onChange={(e) => setRawInputValue(e.target.value)}
                      className="w-full sm:w-60 min-h-[48px] rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] px-4 py-2.5 font-mono text-lg font-bold tabular-nums text-[var(--depot-text-primary)] focus:border-[var(--depot-accent-lime)] focus:outline-none"
                    />
                    <span className="text-sm font-bold text-[var(--depot-text-secondary)]">
                      {inputMode === 'amount_eur' ? 'EUR (€)' : 'Stück'}
                    </span>
                  </div>

                  {inputMode === 'amount_eur' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        { label: '100 €', value: 100 },
                        { label: '250 €', value: 250 },
                        { label: '500 €', value: 500 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setRawInputValue(String(preset.value))}
                          className="min-h-[36px] rounded-lg border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] px-3 py-1 text-xs font-mono font-semibold text-[var(--depot-text-primary)] hover:border-[var(--depot-accent-lime)]/50 transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setRawInputValue(String(roundCurrency(portfolio.cashEur)))
                        }
                        className="min-h-[36px] rounded-lg border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] px-3 py-1 text-xs font-mono font-semibold text-[var(--depot-accent-lime)] hover:border-[var(--depot-accent-lime)]/50 transition-colors"
                      >
                        Max
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {buyPreview && !buyPreview.valid && (
                <div
                  role="alert"
                  data-testid="virtual-buy-error"
                  className="rounded-xl border border-[var(--depot-negative)]/50 bg-[var(--depot-negative)]/10 p-3.5 flex items-start gap-2.5 text-xs text-[var(--depot-text-primary)]"
                >
                  <AlertCircle
                    className="h-4 w-4 text-[var(--depot-negative)] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{buyPreview.errorMessage}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--depot-border)]">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="depot-btn-secondary inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Wertpapier wechseln</span>
                </button>

                <button
                  type="button"
                  data-testid="virtual-buy-to-preview-btn"
                  disabled={!buyPreview?.valid}
                  onClick={() => setStep('preview')}
                  className="depot-btn-lime inline-flex min-h-[46px] items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold disabled:opacity-40"
                >
                  <span>Order prüfen</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 3: Order Preview */}
      {step === 'preview' && selectedInstrument && buyPreview && buyPreview.valid && (
        <div className="space-y-5">
          <div className="rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] p-4 sm:p-5 space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between border-b border-[var(--depot-border)] pb-2.5">
              <span className="text-[var(--depot-text-secondary)]">Wertpapier</span>
              <span className="font-bold text-[var(--depot-text-primary)] text-right">
                {selectedInstrument.name} ({selectedInstrument.symbol})
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-[var(--depot-border)] pb-2.5">
              <span className="text-[var(--depot-text-secondary)]">Kaufbetrag</span>
              <span
                data-testid="virtual-buy-preview-order-value"
                className="font-mono text-base font-extrabold tabular-nums text-[var(--depot-accent-lime)] shrink-0"
              >
                {formatEuro(buyPreview.estimatedOrderValueEur, 2)}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[var(--depot-border)] pb-2.5">
              <span className="text-[var(--depot-text-secondary)]">Referenzkurs</span>
              <span className="font-mono font-semibold tabular-nums text-[var(--depot-text-primary)] text-right">
                {formatOriginalCurrency(
                  buyPreview.marketPriceOriginal,
                  buyPreview.currency,
                  2,
                )}
                {buyPreview.currency !== 'EUR' && (
                  <span className="text-[var(--depot-text-muted)]">
                    {' '}
                    (≈ {formatEuro(buyPreview.marketPriceEur, 2)})
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-[var(--depot-border)] pb-2.5">
              <span className="text-[var(--depot-text-secondary)]">Stückzahl</span>
              <span className="font-mono font-bold tabular-nums text-[var(--depot-text-primary)] shrink-0">
                {buyPreview.quantity.toLocaleString('de-DE', {
                  maximumFractionDigits: 4,
                })}{' '}
                Stück
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-[var(--depot-border)] pb-2.5">
              <span className="text-[var(--depot-text-secondary)]">
                Verfügbares Spielgeld danach
              </span>
              <span className="font-mono font-semibold tabular-nums text-[var(--depot-text-primary)] shrink-0">
                {formatEuro(buyPreview.remainingCashEur, 2)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-[var(--depot-border)] pb-2.5">
              <span className="text-[var(--depot-text-secondary)]">Kursstand</span>
              <span className="font-mono text-xs text-[var(--depot-text-muted)] shrink-0">
                {formatGermanDateLabel(buyPreview.priceTimestamp)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--depot-text-secondary)]">Depotgewicht danach</span>
              <span className="font-mono font-bold tabular-nums text-[var(--depot-text-primary)] shrink-0">
                {formatPercent(buyPreview.resultingPortfolioWeightPercent, 1)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-[var(--depot-text-muted)]">
            {buyPreview.isDemo
              ? FALLBACK_QUOTE_NOTICE
              : buyPreview.dataStatus === 'stale'
                ? formatStaleQuoteNotice(buyPreview.priceTimestamp)
                : MARKET_DATA_SIMULATION_NOTICE}
          </p>

          {/* Short educational note */}
          <div className="rounded-xl border border-[var(--depot-border)] bg-[var(--depot-surface-elevated)] p-4 flex items-start gap-2.5 text-xs leading-relaxed">
            <Info
              className="h-4 w-4 text-[var(--depot-accent-lime)] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <strong className="font-bold text-[var(--depot-text-primary)] block">
                Diese Position macht danach{' '}
                {formatPercent(buyPreview.resultingPortfolioWeightPercent, 1)} deines Depots aus.
              </strong>
              <span className="text-[var(--depot-text-secondary)] block">
                {buyPreview.educationalRiskNote}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--depot-border)]">
            <button
              type="button"
              onClick={() => setStep('configure')}
              className="depot-btn-secondary inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Betrag ändern</span>
            </button>

            <button
              type="button"
              data-testid="virtual-buy-confirm-btn"
              onClick={handleConfirmBuy}
              className="depot-btn-lime inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>Virtuell kaufen</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Calm Post-Purchase Confirmation & Optional 1-Question Reflection */}
      {step === 'success' && completedTx && (
        <div className="space-y-5" data-testid="virtual-buy-success">
          <div className="rounded-xl border border-[var(--depot-accent-lime)]/30 bg-[var(--depot-bg-secondary)] p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2 text-[var(--depot-accent-lime)] font-bold text-sm sm:text-base">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                Position gespeichert: {completedTx.instrumentName} ({completedTx.symbol})
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--depot-text-secondary)] leading-relaxed">
              Du hast virtuell{' '}
              <strong className="font-mono text-[var(--depot-text-primary)]">
                {completedTx.quantity.toLocaleString('de-DE')} Stück
              </strong>{' '}
              zum Kurs von{' '}
              <strong className="font-mono text-[var(--depot-text-primary)]">
                {formatEuro(completedTx.executionPriceEur ?? completedTx.priceEur, 2)}
              </strong>{' '}
              im Gesamtwert von{' '}
              <strong className="font-mono text-[var(--depot-text-primary)]">
                {formatEuro(completedTx.totalAmountEur, 2)}
              </strong>{' '}
              ins Übungsdepot aufgenommen.
            </p>
          </div>

          {/* Optional 1-Question Reflection */}
          <div className="rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <HelpCircle
                className="h-4 w-4 text-[var(--depot-accent-lime)] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold text-[var(--depot-accent-lime)]">
                  Kurzer Denkimpuls (Depotgewicht: {formatPercent(completedWeightPct, 1)})
                </p>
                <h3 className="text-xs sm:text-sm font-bold text-[var(--depot-text-primary)]">
                  Was bedeutet ein hohes Einzelgewicht im Depot?
                </h3>
              </div>
            </div>

            <div className="space-y-2" role="group" aria-label="Reflexionsfrage zum Positionsgewicht">
              {[
                {
                  label:
                    'Klumpenrisiko: Fällt dieses einzelne Wertpapier stark, wirkt sich das direkt spürbar auf das gesamte Depot aus.',
                  isBest: true,
                },
                {
                  label:
                    'Kein Unterschied: Große Einzelpositionen schwanken genauso wenig wie ein breit gestreuter Welt-ETF.',
                  isBest: false,
                },
              ].map((opt, idx) => {
                const chosen = reflectionChoice === idx;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setReflectionChoice(idx)}
                    aria-pressed={chosen}
                    className={`w-full min-h-[42px] rounded-xl border px-3.5 py-2 text-left text-xs transition-colors ${
                      chosen
                        ? opt.isBest
                          ? 'border-[var(--depot-positive)] bg-[var(--depot-positive)]/10 font-semibold text-[var(--depot-text-primary)]'
                          : 'border-[var(--depot-warning)] bg-[var(--depot-warning)]/10 font-semibold text-[var(--depot-text-primary)]'
                        : 'border-[var(--depot-border)] bg-[var(--depot-surface)] hover:bg-[var(--depot-surface-elevated)] text-[var(--depot-text-secondary)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              data-testid="virtual-buy-done-btn"
              onClick={onClose}
              className="depot-btn-lime inline-flex min-h-[46px] items-center justify-center rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold"
            >
              Zurück zum Depot
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export function VirtualSellFlowView({
  initialSymbol,
  onClose,
}: {
  initialSymbol?: string | null;
  onClose: () => void;
}) {
  const { portfolio, valuation, catalogueQuotes, sellInstrumentVirtually } =
    useDepot();
  const [selectedSymbol, setSelectedSymbol] = useState<string>(
    initialSymbol ?? valuation.valuedPositions[0]?.symbol ?? '',
  );

  const selectedPos =
    valuation.valuedPositions.find(
      (p) => p.symbol.toUpperCase() === selectedSymbol.toUpperCase(),
    ) ?? null;

  const [rawQuantity, setRawQuantity] = useState<string>(() =>
    selectedPos ? String(selectedPos.quantity) : '1',
  );
  const [completedSellTx, setCompletedSellTx] = useState<DepotTransaction | null>(
    null,
  );

  useEffect(() => {
    if (selectedPos) {
      setRawQuantity(String(selectedPos.quantity));
    }
  }, [selectedPos?.symbol]);

  const quote: MarketQuote | null = selectedPos
    ? catalogueQuotes[selectedPos.symbol.toUpperCase()] ??
      portfolio.lastKnownQuotes[selectedPos.symbol.toUpperCase()] ?? {
        symbol: selectedPos.symbol,
        price: selectedPos.currentPriceOriginal,
        priceEur: selectedPos.currentPriceEur,
        previousClose: selectedPos.currentPriceOriginal,
        changeAbsolute: 0,
        changePercent: 0,
        currency: selectedPos.currency,
        exchange: selectedPos.exchange,
        marketTime: selectedPos.priceTimestamp,
        fetchedAt: selectedPos.quoteFetchedAt,
        timestamp: selectedPos.priceTimestamp,
        status: selectedPos.dataStatus,
        providerName: 'Referenzkurs',
        isDemo: selectedPos.isDemo,
      }
    : null;

  const numericQty = Number(rawQuantity.replace(',', '.'));
  const sellPreview = previewVirtualSell({
    portfolio,
    symbol: selectedSymbol,
    quantityToSell: Number.isFinite(numericQty) ? numericQty : 0,
    quote,
    fxRateToEur: selectedPos?.currentFxRateToEur ?? 1,
  });

  const handleConfirmSell = () => {
    if (!quote || !sellPreview.valid) return;
    const tx = sellInstrumentVirtually({
      symbol: selectedSymbol,
      quantityToSell: sellPreview.quantitySold,
      quote,
      fxRateToEur: sellPreview.fxRateToEur,
    });
    setCompletedSellTx(tx);
  };

  return (
    <section
      aria-labelledby="virtual-sell-heading"
      className="depot-card p-5 sm:p-6 space-y-5"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--depot-border)] pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--depot-accent-lime)]">
            {VIRTUAL_DEPOT_NOTICE}
          </p>
          <h2
            id="virtual-sell-heading"
            className="text-lg sm:text-xl font-bold text-[var(--depot-text-primary)]"
          >
            {completedSellTx
              ? 'Virtueller Verkauf abgeschlossen'
              : 'Position reduzieren oder verkaufen'}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Verkaufsansicht schließen"
          className="inline-flex min-h-[42px] min-w-[42px] items-center justify-center rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] text-[var(--depot-text-secondary)] hover:text-[var(--depot-text-primary)] transition-colors"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {completedSellTx ? (
        <div className="space-y-4" data-testid="virtual-sell-success">
          <div className="rounded-xl border border-[var(--depot-accent-lime)]/30 bg-[var(--depot-bg-secondary)] p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2 text-[var(--depot-accent-lime)] font-bold text-sm sm:text-base">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                Simulierter Verkauf verbucht: {completedSellTx.instrumentName}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--depot-text-secondary)] leading-relaxed">
              Du hast virtuell{' '}
              <strong className="font-mono text-[var(--depot-text-primary)]">
                {completedSellTx.quantity.toLocaleString('de-DE')} Stück
              </strong>{' '}
              für{' '}
              <strong className="font-mono text-[var(--depot-text-primary)]">
                {formatEuro(completedSellTx.totalAmountEur, 2)}
              </strong>{' '}
              verkauft. Realisiertes Ergebnis:{' '}
              <strong className="font-mono text-[var(--depot-text-primary)]">
                {formatSignedEuro(completedSellTx.realizedGainLossEur ?? 0, 2)}
              </strong>
              .
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              data-testid="virtual-sell-done-btn"
              onClick={onClose}
              className="depot-btn-lime inline-flex min-h-[46px] items-center justify-center rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold"
            >
              Zurück zum Depot
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Position Selector */}
          <div className="space-y-1.5">
            <label
              htmlFor="sell-position-select"
              className="block text-xs font-semibold text-[var(--depot-text-secondary)]"
            >
              Position auswählen
            </label>
            <select
              id="sell-position-select"
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] px-3.5 py-2 text-sm font-semibold text-[var(--depot-text-primary)]"
            >
              {valuation.valuedPositions.map((pos) => (
                <option key={pos.symbol} value={pos.symbol}>
                  {pos.name} ({pos.symbol}) – Bestand:{' '}
                  {pos.quantity.toLocaleString('de-DE')} Stk. ({formatEuro(pos.currentValueEur, 2)})
                </option>
              ))}
            </select>
          </div>

          {selectedPos && (
            <>
              <div className="space-y-2">
                <label
                  htmlFor="virtual-sell-qty-input"
                  className="block text-xs sm:text-sm font-semibold text-[var(--depot-text-primary)]"
                >
                  Stückzahl verkaufen (Bestand: {selectedPos.quantity.toLocaleString('de-DE')} Stück)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="virtual-sell-qty-input"
                    data-testid="virtual-sell-qty-input"
                    type="number"
                    min={0}
                    max={selectedPos.quantity}
                    step={0.01}
                    value={rawQuantity}
                    onChange={(e) => setRawQuantity(e.target.value)}
                    className="w-full sm:w-56 min-h-[46px] rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] px-3.5 py-2 font-mono text-base font-bold tabular-nums text-[var(--depot-text-primary)]"
                  />
                  <span className="text-sm font-bold text-[var(--depot-text-secondary)]">
                    Stück
                  </span>
                </div>

                {/* Quick Fraction Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { label: '25 %', factor: 0.25 },
                    { label: '50 %', factor: 0.5 },
                    { label: 'Max', factor: 1 },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() =>
                        setRawQuantity(
                          String(
                            btn.factor === 1
                              ? selectedPos.quantity
                              : roundQuantity(selectedPos.quantity * btn.factor),
                          ),
                        )
                      }
                      className="min-h-[36px] rounded-lg border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] px-3 py-1 text-xs font-semibold text-[var(--depot-text-primary)] hover:border-[var(--depot-accent-lime)]/50"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {!sellPreview.valid ? (
                <div
                  role="alert"
                  data-testid="virtual-sell-error"
                  className="rounded-xl border border-[var(--depot-negative)]/50 bg-[var(--depot-negative)]/10 p-3.5 flex items-start gap-2.5 text-xs text-[var(--depot-text-primary)]"
                >
                  <AlertCircle
                    className="h-4 w-4 text-[var(--depot-negative)] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{sellPreview.errorMessage}</span>
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] p-4 space-y-2.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-[var(--depot-border)] pb-2">
                    <span className="text-[var(--depot-text-secondary)]">Verkaufte Stückzahl</span>
                    <span className="font-mono font-bold tabular-nums text-[var(--depot-text-primary)] shrink-0">
                      {sellPreview.quantitySold.toLocaleString('de-DE')} Stück
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-[var(--depot-border)] pb-2">
                    <span className="text-[var(--depot-text-secondary)]">Referenzkurs</span>
                    <span className="font-mono font-semibold tabular-nums text-[var(--depot-text-primary)] shrink-0">
                      {formatEuro(sellPreview.referenceMarketPriceEur, 2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-[var(--depot-border)] pb-2">
                    <span className="text-[var(--depot-text-secondary)]">Virtueller Erlös</span>
                    <span className="font-mono font-bold tabular-nums text-[var(--depot-text-primary)] shrink-0">
                      {formatEuro(sellPreview.expectedProceedsEur, 2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-[var(--depot-border)] pb-2">
                    <span className="text-[var(--depot-text-secondary)]">
                      Realisiertes Ergebnis
                    </span>
                    <span
                      className={`font-mono font-bold tabular-nums shrink-0 ${
                        sellPreview.realizedGainLossEur > 0
                          ? 'text-[var(--depot-positive)]'
                          : sellPreview.realizedGainLossEur < 0
                            ? 'text-[var(--depot-negative)]'
                            : 'text-[var(--depot-text-primary)]'
                      }`}
                    >
                      {formatSignedEuro(sellPreview.realizedGainLossEur, 2)} (
                      {formatSignedPercent(sellPreview.realizedGainLossPercent, 2)})
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-[var(--depot-border)] pb-2">
                    <span className="text-[var(--depot-text-secondary)]">Verbleibende Position</span>
                    <span className="font-mono font-semibold tabular-nums text-[var(--depot-text-primary)] shrink-0">
                      {sellPreview.remainingQuantity.toLocaleString('de-DE')} Stück
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[var(--depot-text-secondary)]">
                      Verfügbares Spielgeld danach
                    </span>
                    <span className="font-mono font-bold tabular-nums text-[var(--depot-accent-lime)] shrink-0">
                      {formatEuro(sellPreview.updatedCashEur, 2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-[var(--depot-border)] bg-[var(--depot-bg-secondary)] p-3 text-xs text-[var(--depot-text-muted)] flex items-start gap-2">
                <ShieldAlert
                  className="h-4 w-4 text-[var(--depot-accent-lime)] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>
                  {VIRTUAL_DEPOT_NOTICE} {MARKET_DATA_SIMULATION_NOTICE}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--depot-border)]">
                <button
                  type="button"
                  onClick={onClose}
                  className="depot-btn-secondary inline-flex min-h-[44px] items-center rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  data-testid="virtual-sell-confirm-btn"
                  disabled={!sellPreview.valid}
                  onClick={handleConfirmSell}
                  className="depot-btn-lime inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-40"
                >
                  <span>Virtuell verkaufen</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
