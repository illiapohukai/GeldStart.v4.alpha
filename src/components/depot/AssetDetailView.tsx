import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Clock,
  Info,
} from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { formatEuro, formatPercent } from '@/lib/calculator';
import {
  formatOriginalCurrency,
  formatSignedEuro,
  formatSignedPercent,
  type ValuedPosition,
} from '@/lib/depot-calculations';
import {
  formatMarketDataStatusBadge,
  marketDataService,
} from '@/lib/market-service';
import type {
  HistoricalRange,
  HistoricalSeries,
  InstrumentMetadata,
  MarketQuote,
} from '@/lib/market-types';
import { AppLink } from '@/lib/router';

export function AssetDetailView({
  instrument,
  quote,
  holding,
  onBack,
  onStartBuy,
  onStartSell,
}: {
  instrument: InstrumentMetadata;
  quote: MarketQuote | null;
  holding: ValuedPosition | null;
  onBack: () => void;
  onStartBuy: (instrument: InstrumentMetadata) => void;
  onStartSell: (symbol: string) => void;
}) {
  const gradientId = useId();
  const [range, setRange] = useState<HistoricalRange>('1Y');
  const [history, setHistory] = useState<HistoricalSeries | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showScenarioChart, setShowScenarioChart] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingHistory(true);
    marketDataService
      .getHistoricalPrices(instrument.symbol, range)
      .then((res) => {
        if (active) setHistory(res);
      })
      .catch(() => {
        if (active) setHistory(null);
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });
    return () => {
      active = false;
    };
  }, [instrument.symbol, range]);

  const statusBadge = formatMarketDataStatusBadge(
    quote?.status ?? 'unavailable',
    quote?.isDemo,
  );

  const isDemoMode = Boolean(quote?.isDemo ?? history?.isDemo ?? true);
  const histPoints = history?.points ?? [];
  const minClose =
    histPoints.length > 0
      ? Math.min(...histPoints.map((p) => p.close)) * 0.985
      : 0;
  const maxClose =
    histPoints.length > 0
      ? Math.max(...histPoints.map((p) => p.close)) * 1.015
      : 1;
  const closeSpan = Math.max(0.01, maxClose - minClose);

  const coords =
    histPoints.length > 1
      ? histPoints.map((pt, idx) => {
          const x = (idx / (histPoints.length - 1)) * 100;
          const y = 88 - ((pt.close - minClose) / closeSpan) * 76;
          return { x, y, pt };
        })
      : [];

  const svgPolyline = coords
    .map((c) => `${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join(' ');

  const areaPath =
    coords.length >= 2
      ? `M ${coords[0]!.x.toFixed(2)},94 L ${coords
          .map((c) => `${c.x.toFixed(2)},${c.y.toFixed(2)}`)
          .join(' L ')} L ${coords[coords.length - 1]!.x.toFixed(2)},94 Z`
      : '';

  const holdingPositive = (holding?.unrealizedGainLossEur ?? 0) > 0;
  const holdingNegative = (holding?.unrealizedGainLossEur ?? 0) < 0;

  return (
    <div className="space-y-5">
      {/* Top Navigation Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[42px] items-center gap-1.5 px-3.5 py-2 text-xs depot-btn-secondary depot-focus"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Zurück</span>
        </button>

        <span className="text-xs text-[#A8B8AE] font-medium">
          {statusBadge.shortText}
        </span>
      </div>

      {/* 1. Asset Hero & Price */}
      <section
        aria-labelledby="asset-detail-title"
        className="depot-card p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#A8B8AE]">
              <span className="font-mono text-sm font-extrabold text-[#B7F34A]">
                {instrument.symbol}
              </span>
              <span aria-hidden="true">·</span>
              <span>{instrument.assetType}</span>
              <span aria-hidden="true">·</span>
              <span>
                {instrument.exchange} · {instrument.currency}
              </span>
            </div>

            <h1
              id="asset-detail-title"
              className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#F4F7F3]"
            >
              {instrument.name}
            </h1>
          </div>

          {quote ? (
            <div className="sm:text-right space-y-0.5 shrink-0">
              <div
                data-testid="asset-detail-price"
                className="font-mono text-2xl sm:text-3xl font-extrabold tabular-nums text-[#F4F7F3]"
              >
                {formatOriginalCurrency(quote.price, quote.currency, 2)}
              </div>
              <div className="text-xs text-[#A8B8AE]">
                {quote.isDemo
                  ? 'Beispieldaten – keine aktuellen Marktdaten'
                  : statusBadge.shortText}{' '}
                · Stand{' '}
                {new Date(quote.timestamp).toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ) : (
            <div className="depot-card-secondary p-3 text-xs text-[#A8B8AE]">
              Referenzkurs derzeit nicht verfügbar
            </div>
          )}
        </div>

        {/* Chart or Valid Empty State */}
        <div className="space-y-3 border-t border-[#26382E] pt-4">
          {isDemoMode && !showScenarioChart ? (
            <div className="rounded-xl border border-[#26382E] bg-[#0D1812] p-4 sm:p-5 text-center space-y-2">
              <Clock
                className="h-5 w-5 depot-text-lime mx-auto"
                aria-hidden="true"
              />
              <p className="text-sm font-bold text-[#F4F7F3]">
                Noch nicht genügend Daten für einen Verlauf.
              </p>
              <p className="text-xs text-[#A8B8AE] max-w-md mx-auto leading-relaxed">
                Im Modus „Beispieldaten – keine aktuellen Marktdaten“ wird ein stabiler Referenzkurs ohne erfundene Markthistorie verwendet.
              </p>
              {histPoints.length >= 2 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowScenarioChart(true)}
                    className="min-h-[36px] rounded-lg border border-[#26382E] bg-[#182820] px-3 py-1.5 text-xs font-semibold text-[#F4F7F3] hover:border-[#B7F34A]/50 depot-focus"
                  >
                    Lernszenario-Kurve ansehen
                  </button>
                </div>
              )}
            </div>
          ) : loadingHistory ? (
            <div className="rounded-xl border border-[#26382E] bg-[#0D1812] p-6 text-center text-xs text-[#A8B8AE]">
              Verlauf wird geladen …
            </div>
          ) : histPoints.length < 2 ? (
            <div className="rounded-xl border border-[#26382E] bg-[#0D1812] p-5 text-center text-xs text-[#A8B8AE]">
              Noch nicht genügend Daten für einen Verlauf.
            </div>
          ) : (
            <div className="rounded-xl border border-[#26382E] bg-[#0D1812] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold text-[#F4F7F3]">
                  {isDemoMode
                    ? 'Lernszenario – keine echte Kursentwicklung'
                    : `Kursverlauf (${instrument.currency})`}
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="inline-flex rounded-lg border border-[#26382E] bg-[#122019] p-0.5"
                    role="tablist"
                    aria-label="Zeitraum wählen"
                  >
                    {(['1M', '6M', '1Y'] as HistoricalRange[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        role="tab"
                        aria-selected={range === r}
                        onClick={() => setRange(r)}
                        className={`min-h-[28px] rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors depot-focus ${
                          range === r
                            ? 'bg-[#B7F34A] text-[#07100C] font-bold'
                            : 'text-[#A8B8AE] hover:text-[#F4F7F3]'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  {isDemoMode && (
                    <button
                      type="button"
                      onClick={() => setShowScenarioChart(false)}
                      className="text-xs text-[#A8B8AE] hover:text-[#F4F7F3] underline depot-focus rounded px-1"
                    >
                      Ausblenden
                    </button>
                  )}
                </div>
              </div>

              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="h-32 sm:h-36 w-full overflow-visible"
                role="img"
                aria-label={`${isDemoMode ? 'Lernszenario – keine echte Kursentwicklung' : 'Kursverlauf'} für ${instrument.name} (${range}): von ${formatOriginalCurrency(histPoints[0]!.close, instrument.currency)} auf ${formatOriginalCurrency(histPoints[histPoints.length - 1]!.close, instrument.currency)}.`}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B7F34A" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#B7F34A" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {[25, 50, 75].map((gy) => (
                  <line
                    key={gy}
                    x1="0"
                    y1={gy}
                    x2="100"
                    y2={gy}
                    stroke="#26382E"
                    strokeWidth="0.4"
                  />
                ))}
                {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
                <polyline
                  fill="none"
                  stroke="#B7F34A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={svgPolyline}
                />
              </svg>

              <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[#A8B8AE]">
                <span>
                  {formatOriginalCurrency(
                    histPoints[0]!.close,
                    instrument.currency,
                    2,
                  )}
                </span>
                <span>
                  {formatOriginalCurrency(
                    histPoints[histPoints.length - 1]!.close,
                    instrument.currency,
                    2,
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Primary Actions: Kaufen & Verkaufen (only when owned) */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            data-testid="asset-detail-buy-btn"
            onClick={() => onStartBuy(instrument)}
            className="inline-flex min-h-[46px] flex-1 sm:flex-initial items-center justify-center gap-2 px-6 py-2.5 text-sm depot-btn-primary depot-focus whitespace-nowrap"
          >
            <span>Kaufen</span>
          </button>

          {holding && holding.quantity > 0 && (
            <button
              type="button"
              data-testid="asset-detail-sell-btn"
              onClick={() => onStartSell(instrument.symbol)}
              className="inline-flex min-h-[46px] flex-1 sm:flex-initial items-center justify-center gap-2 px-6 py-2.5 text-sm depot-btn-secondary depot-focus whitespace-nowrap"
            >
              <span>Verkaufen</span>
            </button>
          )}
        </div>
      </section>

      {/* 2. Deine Position */}
      <section
        aria-labelledby="asset-holding-heading"
        className="depot-card p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <h2
            id="asset-holding-heading"
            className="text-base font-bold text-[#F4F7F3]"
          >
            Deine Position
          </h2>
          {holding && (
            <span className="text-xs font-mono text-[#A8B8AE]">
              Depotgewicht: {formatPercent(holding.weightOfPortfolioPercent, 1)}
            </span>
          )}
        </div>

        {holding ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div className="depot-card-secondary p-3">
              <div className="text-xs text-[#A8B8AE]">Positionswert</div>
              <div className="mt-0.5 font-mono text-base font-extrabold tabular-nums text-[#F4F7F3]">
                {formatEuro(holding.currentValueEur, 2)}
              </div>
            </div>

            <div className="depot-card-secondary p-3">
              <div className="text-xs text-[#A8B8AE]">Gewinn / Verlust</div>
              <div
                className={`mt-0.5 font-mono text-sm font-bold tabular-nums inline-flex items-center gap-1 ${
                  holdingPositive
                    ? 'depot-text-positive'
                    : holdingNegative
                      ? 'depot-text-negative'
                      : 'text-[#A8B8AE]'
                }`}
              >
                {holdingPositive && (
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                {holdingNegative && (
                  <ArrowDownRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                <span>
                  {formatSignedEuro(holding.unrealizedGainLossEur, 2)} (
                  {formatSignedPercent(holding.unrealizedGainLossPercent, 2)})
                </span>
              </div>
            </div>

            <div className="depot-card-secondary p-3">
              <div className="text-xs text-[#A8B8AE]">Stückzahl</div>
              <div className="mt-0.5 font-mono font-bold tabular-nums text-[#F4F7F3]">
                {holding.quantity.toLocaleString('de-DE', {
                  maximumFractionDigits: 4,
                })}{' '}
                Anteile
              </div>
            </div>

            <div className="depot-card-secondary p-3">
              <div className="text-xs text-[#A8B8AE]">Ø Kaufkurs</div>
              <div className="mt-0.5 font-mono font-semibold tabular-nums text-[#F4F7F3]">
                {formatEuro(holding.averagePurchasePriceEur, 2)}
              </div>
            </div>

            <div className="depot-card-secondary p-3">
              <div className="text-xs text-[#A8B8AE]">Referenzkurs</div>
              <div className="mt-0.5 font-mono font-semibold tabular-nums text-[#F4F7F3]">
                {formatEuro(holding.currentPriceEur, 2)}
              </div>
            </div>

            <div className="depot-card-secondary p-3">
              <div className="text-xs text-[#A8B8AE]">Depotgewicht</div>
              <div className="mt-0.5 font-mono font-semibold tabular-nums text-[#F4F7F3]">
                {formatPercent(holding.weightOfPortfolioPercent, 1)}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-[#A8B8AE]">
            Noch nicht im Depot enthalten. Über „Kaufen“ kannst du eine virtuelle Position eröffnen.
          </p>
        )}
      </section>

      {/* 3. Einordnung & Risikoprofil */}
      <section
        aria-labelledby="asset-explanation-heading"
        className="depot-card p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center gap-2 text-xs font-semibold depot-text-lime">
          <Info className="h-4 w-4" aria-hidden="true" />
          <span>Einordnung & Risikoprofil</span>
        </div>

        <h2
          id="asset-explanation-heading"
          className="text-base font-bold text-[#F4F7F3]"
        >
          {instrument.name}
        </h2>

        <p className="text-xs sm:text-sm text-[#A8B8AE] leading-relaxed">
          {instrument.shortExplanation}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="depot-card-secondary p-3">
            <span className="text-[#84968C] block">Risikostufe</span>
            <strong className="text-[#F4F7F3] mt-0.5 block">
              {instrument.riskCategory}
            </strong>
          </div>
          <div className="depot-card-secondary p-3">
            <span className="text-[#84968C] block">Anlageklasse</span>
            <strong className="text-[#F4F7F3] mt-0.5 block">
              {instrument.assetType}
            </strong>
          </div>
          <div className="depot-card-secondary p-3">
            <span className="text-[#84968C] block">Handelsplatz</span>
            <strong className="text-[#F4F7F3] mt-0.5 block font-mono">
              {instrument.exchange} ({instrument.currency})
            </strong>
          </div>
          <div className="depot-card-secondary p-3">
            <span className="text-[#84968C] block">Branche / Fokus</span>
            <strong className="text-[#F4F7F3] mt-0.5 block truncate" title={instrument.sector}>
              {instrument.sector}
            </strong>
          </div>
        </div>

        <ul className="space-y-1.5 text-xs text-[#A8B8AE] list-disc pl-4 leading-relaxed">
          {instrument.educationalNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>

        <div className="pt-2 border-t border-[#26382E] flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[#84968C]">
            Datenstatus: {statusBadge.shortText}
          </span>
          <AppLink
            to="/anlageklassen"
            className="inline-flex items-center gap-1.5 font-semibold depot-text-lime hover:underline depot-focus rounded"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Lektion Anlageklassen →</span>
          </AppLink>
        </div>
      </section>
    </div>
  );
}
