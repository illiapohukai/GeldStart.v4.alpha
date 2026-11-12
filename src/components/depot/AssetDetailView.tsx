import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
  Lock,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { formatEuro, formatPercent } from '@/lib/calculator';
import {
  formatOriginalCurrency,
  formatSignedEuro,
  formatSignedPercent,
  type ValuedPosition,
} from '@/lib/depot-calculations';
import { useDepot } from '@/lib/depot-context';
import { computeHistoricalSummaryStats } from '@/lib/market-providers';
import {
  FALLBACK_QUOTE_NOTICE,
  formatGermanDateLabel,
  formatMarketDataStatusBadge,
  formatStaleQuoteNotice,
  HISTORICAL_NO_FORECAST_NOTICE,
  MARKET_DATA_SIMULATION_NOTICE,
  marketDataService,
  UNAVAILABLE_HISTORY_NOTICE,
} from '@/lib/market-service';
import type {
  AssetHistory,
  HistoricalCandle,
  InstrumentMetadata,
  MarketQuote,
} from '@/lib/market-types';
import { AppLink } from '@/lib/router';

export type ChartDisplayMode = 'line' | 'candles';

const CHART_MODE_STORAGE_KEY = 'geldstart_depot_chart_mode_v1';

export function prefersReducedMotionEnabled(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function scrollToDetailTop(options?: {
  prefersReducedMotion?: boolean;
  scrollFn?: (opts: ScrollToOptions) => void;
}): ScrollToOptions {
  const reduced =
    options?.prefersReducedMotion ?? prefersReducedMotionEnabled();
  const scrollOpts: ScrollToOptions = {
    top: 0,
    left: 0,
    behavior: reduced ? 'auto' : 'smooth',
  };
  if (options?.scrollFn) {
    options.scrollFn(scrollOpts);
  } else if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
    try {
      window.scrollTo(scrollOpts);
    } catch {
      window.scrollTo(0, 0);
    }
  }
  return scrollOpts;
}

export function getInitialChartDisplayMode(viewportWidth?: number): ChartDisplayMode {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(CHART_MODE_STORAGE_KEY);
      if (saved === 'line' || saved === 'candles') {
        return saved;
      }
    } catch {
      // Ignore storage access errors
    }
  }
  const width =
    viewportWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1024);
  return width < 380 ? 'line' : 'line';
}

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
  const { isInstrumentUnlocked } = useDepot();
  const unlocked = isInstrumentUnlocked(instrument.symbol);
  const gradientId = useId();
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  const [assetHistory, setAssetHistory] = useState<AssetHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [chartMode, setChartMode] = useState<ChartDisplayMode>(() =>
    getInitialChartDisplayMode(),
  );
  const [selectedCandleIndex, setSelectedCandleIndex] = useState<number | null>(
    null,
  );
  const [lockedCandleIndex, setLockedCandleIndex] = useState<number | null>(
    null,
  );

  // Phase 7: Scroll active scroll container to top when AssetDetailView mounts or switches asset
  useLayoutEffect(() => {
    scrollToDetailTop();
    if (headingRef.current) {
      headingRef.current.focus({ preventScroll: true });
    }
  }, [instrument.symbol]);

  useEffect(() => {
    let active = true;
    setLoadingHistory(true);
    setSelectedCandleIndex(null);
    setLockedCandleIndex(null);

    marketDataService
      .getAssetHistory(instrument.symbol)
      .then((res) => {
        if (!active) return;
        setAssetHistory(res);
        if (res && res.candles.length > 0) {
          setSelectedCandleIndex(res.candles.length - 1);
        }
      })
      .catch(() => {
        if (active) setAssetHistory(null);
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });

    return () => {
      active = false;
    };
  }, [instrument.symbol]);

  const handleSelectChartMode = (nextMode: ChartDisplayMode) => {
    setChartMode(nextMode);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(CHART_MODE_STORAGE_KEY, nextMode);
      } catch {
        // Ignore storage write errors
      }
    }
  };

  const statusBadge = formatMarketDataStatusBadge(
    quote?.status ?? 'unavailable',
    quote?.isDemo,
    quote?.marketTime ?? quote?.timestamp,
  );

  const candles: HistoricalCandle[] =
    assetHistory && assetHistory.status !== 'unavailable'
      ? assetHistory.candles
      : [];
  const hasValidHistory = candles.length >= 2;
  const priceCurrency = assetHistory?.priceCurrency ?? instrument.currency;
  const summaryStats = hasValidHistory
    ? computeHistoricalSummaryStats(candles)
    : null;

  const activeCandleIdx =
    lockedCandleIndex ??
    selectedCandleIndex ??
    (candles.length > 0 ? candles.length - 1 : null);
  const activeCandle: HistoricalCandle | null =
    activeCandleIdx !== null && candles[activeCandleIdx]
      ? candles[activeCandleIdx]!
      : null;

  // Compute SVG coordinate domain across full OHLC range
  const rawMinLow = summaryStats ? summaryStats.minLow : 0;
  const rawMaxHigh = summaryStats ? summaryStats.maxHigh : 1;
  const padding = Math.max(0.05, (rawMaxHigh - rawMinLow) * 0.04);
  const yMin = Math.max(0.01, rawMinLow - padding);
  const yMax = rawMaxHigh + padding;
  const ySpan = Math.max(0.01, yMax - yMin);

  const toSvgY = (priceVal: number): number => {
    const ratio = (priceVal - yMin) / ySpan;
    return 92 - Math.max(0, Math.min(1, ratio)) * 84;
  };

  const lineCoords = hasValidHistory
    ? candles.map((c, idx) => {
        const x = (idx / Math.max(1, candles.length - 1)) * 100;
        const y = toSvgY(c.close);
        return { x, y, candle: c, index: idx };
      })
    : [];

  const svgPolyline = lineCoords
    .map((pt) => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`)
    .join(' ');

  const areaPath =
    lineCoords.length >= 2
      ? `M ${lineCoords[0]!.x.toFixed(2)},94 L ${lineCoords
          .map((pt) => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`)
          .join(' L ')} L ${lineCoords[lineCoords.length - 1]!.x.toFixed(2)},94 Z`
      : '';

  const holdingPositive = (holding?.unrealizedGainLossEur ?? 0) > 0;
  const holdingNegative = (holding?.unrealizedGainLossEur ?? 0) < 0;

  const yearChangePositive = (summaryStats?.changeAbsolute ?? 0) > 0;
  const yearChangeNegative = (summaryStats?.changeAbsolute ?? 0) < 0;

  return (
    <div className="space-y-5" data-testid="asset-detail-view">
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

      {/* 1. Asset Hero, Price & 1-Year Historical Chart */}
      <section
        aria-labelledby="asset-detail-title"
        className="depot-card p-4 sm:p-6 space-y-5 overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1 min-w-0">
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
              ref={headingRef}
              tabIndex={-1}
              className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#F4F7F3] focus:outline-none"
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
              {quote.currency !== 'EUR' && quote.priceEur && (
                <div className="font-mono text-xs text-[#B7F34A]">
                  ≈ {formatEuro(quote.priceEur, 2)}
                </div>
              )}
              <div className="text-xs text-[#A8B8AE]">
                {quote.isDemo || quote.status === 'fallback'
                  ? FALLBACK_QUOTE_NOTICE
                  : quote.status === 'stale'
                    ? formatStaleQuoteNotice(quote.marketTime ?? quote.timestamp)
                    : `${statusBadge.shortText} · Stand ${formatGermanDateLabel(quote.marketTime ?? quote.timestamp)}`}
              </div>
            </div>
          ) : (
            <div className="depot-card-secondary p-3 text-xs text-[#A8B8AE]">
              Referenzkurs derzeit nicht verfügbar
            </div>
          )}
        </div>

        {/* Real 1-Year Historical Chart or Honest Unavailable State */}
        <div className="space-y-3.5 border-t border-[#26382E] pt-4">
          {loadingHistory ? (
            <div
              data-testid="asset-history-loading"
              className="rounded-xl border border-[#26382E] bg-[#0D1812] p-6 text-center text-xs text-[#A8B8AE]"
            >
              Historische Tageskurse (1 Jahr) werden geladen …
            </div>
          ) : !hasValidHistory || !summaryStats ? (
            <div
              data-testid="asset-history-unavailable"
              className="rounded-xl border border-[#26382E] bg-[#0D1812] p-4 sm:p-5 text-center space-y-2"
            >
              <Calendar
                className="h-5 w-5 depot-text-lime mx-auto"
                aria-hidden="true"
              />
              <p className="text-xs sm:text-sm font-semibold text-[#F4F7F3] max-w-lg mx-auto leading-relaxed">
                {UNAVAILABLE_HISTORY_NOTICE}
              </p>
            </div>
          ) : (
            <div
              data-testid="asset-history-chart-card"
              className="rounded-xl border border-[#26382E] bg-[#0D1812] p-3.5 sm:p-4 space-y-3.5 overflow-hidden"
            >
              {/* Chart Header: Range Badge & Mode Toggle Buttons ("Linie" / "Kerzen") */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[#F4F7F3]">
                      Kursverlauf · 1 Jahr ({priceCurrency})
                    </span>
                    <span className="rounded-md border border-[#26382E] bg-[#122019] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#B7F34A]">
                      1 Jahr · Täglich (1D)
                    </span>
                    {assetHistory?.status === 'stale' && (
                      <span
                        data-testid="asset-history-stale-badge"
                        className="rounded-md border border-[#E6B84D]/40 bg-[#E6B84D]/15 px-2 py-0.5 text-[10px] font-semibold text-[#E6B84D]"
                      >
                        Veralteter Verlauf
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#A8B8AE]">
                    Datenstand: {formatGermanDateLabel(summaryStats.endDate)} ·{' '}
                    {summaryStats.candleCount} Handelstage
                  </p>
                </div>

                <div
                  className="inline-flex rounded-xl border border-[#26382E] bg-[#122019] p-0.5"
                  role="group"
                  aria-label="Darstellungsart des Kursdiagramms wählen"
                >
                  <button
                    type="button"
                    data-testid="chart-mode-line"
                    aria-pressed={chartMode === 'line'}
                    onClick={() => handleSelectChartMode('line')}
                    className={`min-h-[32px] rounded-lg px-3 py-1 text-xs font-semibold transition-colors depot-focus ${
                      chartMode === 'line'
                        ? 'bg-[#B7F34A] text-[#07100C] font-bold'
                        : 'text-[#A8B8AE] hover:text-[#F4F7F3]'
                    }`}
                  >
                    Linie
                  </button>
                  <button
                    type="button"
                    data-testid="chart-mode-candles"
                    aria-pressed={chartMode === 'candles'}
                    onClick={() => handleSelectChartMode('candles')}
                    className={`min-h-[32px] rounded-lg px-3 py-1 text-xs font-semibold transition-colors depot-focus ${
                      chartMode === 'candles'
                        ? 'bg-[#B7F34A] text-[#07100C] font-bold'
                        : 'text-[#A8B8AE] hover:text-[#F4F7F3]'
                    }`}
                  >
                    Kerzen
                  </button>
                </div>
              </div>

              {/* 1-Year Summary Metrics Grid */}
              <div
                data-testid="asset-history-summary-grid"
                className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs"
              >
                <div className="rounded-lg border border-[#26382E] bg-[#122019] p-2.5">
                  <span className="text-[10px] text-[#84968C] block">
                    Jahrestief
                  </span>
                  <strong
                    data-testid="summary-year-low"
                    className="font-mono text-xs sm:text-sm font-bold tabular-nums text-[#F4F7F3] mt-0.5 block"
                  >
                    {formatOriginalCurrency(summaryStats.minLow, priceCurrency, 2)}
                  </strong>
                </div>

                <div className="rounded-lg border border-[#26382E] bg-[#122019] p-2.5">
                  <span className="text-[10px] text-[#84968C] block">
                    Jahreshoch
                  </span>
                  <strong
                    data-testid="summary-year-high"
                    className="font-mono text-xs sm:text-sm font-bold tabular-nums text-[#F4F7F3] mt-0.5 block"
                  >
                    {formatOriginalCurrency(summaryStats.maxHigh, priceCurrency, 2)}
                  </strong>
                </div>

                <div className="rounded-lg border border-[#26382E] bg-[#122019] p-2.5">
                  <span className="text-[10px] text-[#84968C] block">
                    Startwert ({formatGermanDateLabel(summaryStats.startDate)})
                  </span>
                  <strong
                    data-testid="summary-start-close"
                    className="font-mono text-xs sm:text-sm font-bold tabular-nums text-[#F4F7F3] mt-0.5 block"
                  >
                    {formatOriginalCurrency(
                      summaryStats.firstClose,
                      priceCurrency,
                      2,
                    )}
                  </strong>
                </div>

                <div className="rounded-lg border border-[#26382E] bg-[#122019] p-2.5">
                  <span className="text-[10px] text-[#84968C] block">
                    Letzter Schlusskurs
                  </span>
                  <strong
                    data-testid="summary-latest-close"
                    className="font-mono text-xs sm:text-sm font-bold tabular-nums text-[#F4F7F3] mt-0.5 block"
                  >
                    {formatOriginalCurrency(
                      summaryStats.latestClose,
                      priceCurrency,
                      2,
                    )}
                  </strong>
                </div>

                <div className="col-span-2 sm:col-span-1 rounded-lg border border-[#26382E] bg-[#122019] p-2.5">
                  <span className="text-[10px] text-[#84968C] block">
                    Veränderung in 1 Jahr
                  </span>
                  <strong
                    data-testid="summary-year-change"
                    className={`font-mono text-xs sm:text-sm font-bold tabular-nums mt-0.5 inline-flex items-center gap-1 ${
                      yearChangePositive
                        ? 'text-[#B7F34A]'
                        : yearChangeNegative
                          ? 'text-[#F26D6D]'
                          : 'text-[#F4F7F3]'
                    }`}
                  >
                    {yearChangePositive && (
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    )}
                    {yearChangeNegative && (
                      <ArrowDownRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    )}
                    <span>
                      {summaryStats.changeAbsolute > 0 ? '+' : ''}
                      {formatOriginalCurrency(
                        summaryStats.changeAbsolute,
                        priceCurrency,
                        2,
                      )}{' '}
                      ({formatSignedPercent(summaryStats.changePercent, 2)})
                    </span>
                  </strong>
                </div>
              </div>

              {/* SVG Chart Surface (Line or Candlesticks) */}
              <div className="relative w-full overflow-hidden rounded-lg border border-[#26382E]/80 bg-[#09120D] p-2 sm:p-3">
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  data-testid={
                    chartMode === 'candles'
                      ? 'asset-candlestick-svg'
                      : 'asset-line-svg'
                  }
                  className="h-44 sm:h-52 w-full block select-none touch-manipulation"
                  role="img"
                  aria-label={`${
                    chartMode === 'candles'
                      ? 'Ein-Jahres-Kerzendiagramm (OHLC)'
                      : 'Ein-Jahres-Liniendiagramm'
                  } für ${instrument.name}: Startwert ${formatOriginalCurrency(
                    summaryStats.firstClose,
                    priceCurrency,
                    2,
                  )}, Jahrestief ${formatOriginalCurrency(
                    summaryStats.minLow,
                    priceCurrency,
                    2,
                  )}, Jahreshoch ${formatOriginalCurrency(
                    summaryStats.maxHigh,
                    priceCurrency,
                    2,
                  )}, Letzter Schlusskurs ${formatOriginalCurrency(
                    summaryStats.latestClose,
                    priceCurrency,
                    2,
                  )}.`}
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#B7F34A" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#B7F34A" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Muted neutral horizontal grid lines */}
                  {[20, 45, 70, 90].map((gy) => (
                    <line
                      key={gy}
                      x1="0"
                      y1={gy}
                      x2="100"
                      y2={gy}
                      stroke="#1E3026"
                      strokeWidth="0.35"
                    />
                  ))}

                  {/* Vertical guide line for active/selected candle */}
                  {activeCandleIdx !== null && candles.length > 1 && (
                    <line
                      x1={
                        (activeCandleIdx / Math.max(1, candles.length - 1)) * 100
                      }
                      y1="4"
                      x2={
                        (activeCandleIdx / Math.max(1, candles.length - 1)) * 100
                      }
                      y2="96"
                      stroke="#B7F34A"
                      strokeOpacity="0.45"
                      strokeWidth="0.4"
                      strokeDasharray="1.5 1.5"
                    />
                  )}

                  {chartMode === 'line' ? (
                    <>
                      {areaPath && (
                        <path d={areaPath} fill={`url(#${gradientId})`} />
                      )}
                      <polyline
                        fill="none"
                        stroke="#B7F34A"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={svgPolyline}
                      />
                      {activeCandleIdx !== null &&
                        lineCoords[activeCandleIdx] && (
                          <circle
                            cx={lineCoords[activeCandleIdx]!.x}
                            cy={lineCoords[activeCandleIdx]!.y}
                            r="1.4"
                            fill="#B7F34A"
                            stroke="#07100C"
                            strokeWidth="0.5"
                          />
                        )}
                    </>
                  ) : (
                    /* Candlestick OHLC rendering */
                    candles.map((c, idx) => {
                      const count = candles.length;
                      const stepX = 100 / Math.max(1, count);
                      const cx =
                        count > 1
                          ? (idx / (count - 1)) * 98 + 1
                          : 50;
                      const bodyWidth = Math.max(0.28, Math.min(1.6, stepX * 0.68));
                      const rising = c.close >= c.open;
                      const color = rising ? '#B7F34A' : '#F26D6D';
                      const yHigh = toSvgY(c.high);
                      const yLow = toSvgY(c.low);
                      const yOpen = toSvgY(c.open);
                      const yClose = toSvgY(c.close);
                      const bodyTop = Math.min(yOpen, yClose);
                      const bodyBottom = Math.max(yOpen, yClose);
                      const bodyHeight = Math.max(0.9, bodyBottom - bodyTop);
                      const isSelected = activeCandleIdx === idx;

                      return (
                        <g
                          key={c.date}
                          data-candle-dir={rising ? 'up' : 'down'}
                        >
                          {/* Wick: low to high */}
                          <line
                            x1={cx}
                            y1={yHigh}
                            x2={cx}
                            y2={yLow}
                            stroke={color}
                            strokeWidth={isSelected ? '0.55' : '0.32'}
                          />
                          {/* Body: open to close (falling candles use hollow/darker fill + border so direction isn't color-only) */}
                          <rect
                            x={cx - bodyWidth / 2}
                            y={bodyTop}
                            width={bodyWidth}
                            height={bodyHeight}
                            fill={rising ? color : '#2B1416'}
                            stroke={color}
                            strokeWidth={rising ? '0.15' : '0.32'}
                            rx="0.1"
                          />
                        </g>
                      );
                    })
                  )}

                  {/* Interactive hit columns for tap, click, and hover across all trading days */}
                  {candles.map((c, idx) => {
                    const count = candles.length;
                    const stepX = 100 / Math.max(1, count);
                    const xStart = Math.max(0, idx * stepX);
                    return (
                      <rect
                        key={`hit-${c.date}`}
                        x={xStart}
                        y="0"
                        width={Math.max(0.4, stepX)}
                        height="100"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => {
                          if (lockedCandleIndex === null) {
                            setSelectedCandleIndex(idx);
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCandleIndex(idx);
                          setLockedCandleIndex((prev) =>
                            prev === idx ? null : idx,
                          );
                        }}
                      />
                    );
                  })}
                </svg>

                {/* X-axis Start & End Dates */}
                <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] font-mono tabular-nums text-[#84968C]">
                  <span className="shrink-0">{formatGermanDateLabel(summaryStats.startDate)}</span>
                  <span className="text-center font-sans leading-tight">
                    {lockedCandleIndex !== null
                      ? 'Auswahl fixiert (Antippen zum Lösen)'
                      : 'Tageskerze antippen'}
                  </span>
                  <span className="shrink-0">{formatGermanDateLabel(summaryStats.endDate)}</span>
                </div>
              </div>

              {/* Accessible Candle Inspector / Tooltip (Hover, Tap-Lock, and Keyboard Day Stepper) */}
              {activeCandle && (
                <div
                  data-testid="asset-candle-tooltip"
                  className="rounded-xl border border-[#26382E] bg-[#122019] p-3 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#26382E] pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-[#F4F7F3]">
                        Datum: {formatGermanDateLabel(activeCandle.date)}
                      </span>
                      {activeCandle.close >= activeCandle.open ? (
                        <span
                          data-testid="candle-direction-indicator"
                          className="inline-flex items-center gap-1 rounded-md bg-[#B7F34A]/15 px-2 py-0.5 text-[11px] font-bold text-[#B7F34A]"
                        >
                          <TrendingUp className="h-3 w-3" aria-hidden="true" />
                          <span>▲ Steigend</span>
                        </span>
                      ) : (
                        <span
                          data-testid="candle-direction-indicator"
                          className="inline-flex items-center gap-1 rounded-md bg-[#F26D6D]/15 px-2 py-0.5 text-[11px] font-bold text-[#F26D6D]"
                        >
                          <TrendingDown className="h-3 w-3" aria-hidden="true" />
                          <span>▼ Fallend</span>
                        </span>
                      )}
                      {assetHistory?.status === 'stale' && (
                        <span className="text-[11px] text-[#E6B84D]">
                          (Veralteter Kursstand)
                        </span>
                      )}
                    </div>

                    {/* Accessible keyboard / tap day stepper */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        data-testid="candle-prev-day-btn"
                        aria-label="Vorheriger Handelstag"
                        disabled={(activeCandleIdx ?? 0) <= 0}
                        onClick={() => {
                          const nextIdx = Math.max(0, (activeCandleIdx ?? 0) - 1);
                          setSelectedCandleIndex(nextIdx);
                          setLockedCandleIndex(nextIdx);
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#26382E] bg-[#0D1812] text-[#A8B8AE] hover:text-[#F4F7F3] disabled:opacity-40 depot-focus"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        data-testid="candle-next-day-btn"
                        aria-label="Nächster Handelstag"
                        disabled={(activeCandleIdx ?? 0) >= candles.length - 1}
                        onClick={() => {
                          const nextIdx = Math.min(
                            candles.length - 1,
                            (activeCandleIdx ?? 0) + 1,
                          );
                          setSelectedCandleIndex(nextIdx);
                          setLockedCandleIndex(nextIdx);
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#26382E] bg-[#0D1812] text-[#A8B8AE] hover:text-[#F4F7F3] disabled:opacity-40 depot-focus"
                      >
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      {lockedCandleIndex !== null && (
                        <button
                          type="button"
                          data-testid="candle-unlock-btn"
                          onClick={() => {
                            setLockedCandleIndex(null);
                            setSelectedCandleIndex(candles.length - 1);
                          }}
                          className="ml-1 rounded-lg border border-[#26382E] bg-[#0D1812] px-2 py-1 text-[10px] font-semibold text-[#A8B8AE] hover:text-[#F4F7F3] depot-focus"
                        >
                          Letzter Tag
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs tabular-nums">
                    <div>
                      <span className="font-sans text-[10px] text-[#84968C] block">
                        Eröffnung
                      </span>
                      <strong className="text-[#F4F7F3]">
                        {formatOriginalCurrency(
                          activeCandle.open,
                          priceCurrency,
                          2,
                        )}
                      </strong>
                    </div>
                    <div>
                      <span className="font-sans text-[10px] text-[#84968C] block">
                        Hoch
                      </span>
                      <strong className="text-[#F4F7F3]">
                        {formatOriginalCurrency(
                          activeCandle.high,
                          priceCurrency,
                          2,
                        )}
                      </strong>
                    </div>
                    <div>
                      <span className="font-sans text-[10px] text-[#84968C] block">
                        Tief
                      </span>
                      <strong className="text-[#F4F7F3]">
                        {formatOriginalCurrency(
                          activeCandle.low,
                          priceCurrency,
                          2,
                        )}
                      </strong>
                    </div>
                    <div>
                      <span className="font-sans text-[10px] text-[#84968C] block">
                        Schluss
                      </span>
                      <strong className="text-[#B7F34A]">
                        {formatOriginalCurrency(
                          activeCandle.close,
                          priceCurrency,
                          2,
                        )}
                      </strong>
                    </div>
                    {typeof activeCandle.volume === 'number' &&
                      activeCandle.volume > 0 && (
                        <div className="col-span-2 sm:col-span-1">
                          <span className="font-sans text-[10px] text-[#84968C] block">
                            Volumen
                          </span>
                          <strong className="text-[#A8B8AE]">
                            {activeCandle.volume.toLocaleString('de-DE')}
                          </strong>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Required Non-Forecast Notice */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#A8B8AE] pt-0.5">
                <span data-testid="asset-history-no-forecast-notice">
                  {HISTORICAL_NO_FORECAST_NOTICE}
                </span>
                <span>{MARKET_DATA_SIMULATION_NOTICE}</span>
              </div>
            </div>
          )}
        </div>

        {/* Primary Actions: Kaufen & Verkaufen (only when owned) */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {unlocked ? (
            <button
              type="button"
              data-testid="asset-detail-buy-btn"
              onClick={() => onStartBuy(instrument)}
              className="inline-flex min-h-[46px] flex-1 sm:flex-initial items-center justify-center gap-2 px-6 py-2.5 text-sm depot-btn-primary depot-focus whitespace-nowrap"
            >
              <span>Kaufen</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3 w-full">
              <button
                type="button"
                disabled
                data-testid="asset-detail-buy-btn"
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[#26382E] bg-[#0D1812] px-5 py-2.5 text-xs font-semibold text-[#84968C] cursor-not-allowed"
              >
                <Lock className="h-4 w-4" aria-hidden="true" />
                <span>Gesperrt ({instrument.unlockRequirementText})</span>
              </button>
              <AppLink
                to="/lernen"
                className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl border border-[#B7F34A]/40 px-4 py-2.5 text-xs font-bold text-[#B7F34A] hover:underline"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <span>Lektion zum Freischalten öffnen →</span>
              </AppLink>
            </div>
          )}

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
              <div className="text-xs text-[#A8B8AE]">
                Virtueller Gewinn oder Verlust
              </div>
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
              <div className="text-xs text-[#A8B8AE]">Aktueller Kurs</div>
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
            <span className="text-[#84968C] block">Freischaltung</span>
            <strong
              className="text-[#F4F7F3] mt-0.5 block"
              title={instrument.unlockRequirementText}
            >
              {instrument.unlockRequirementText ?? 'Direkt freigeschaltet'}
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
