import { Clock } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { formatEuro, formatPercent } from '@/lib/calculator';
import {
  type DepotSnapshot,
  formatSignedEuro,
  formatSignedPercent,
  type PortfolioValuationSummary,
} from '@/lib/depot-calculations';

type ChartPeriod = 'TODAY' | '1W' | '1M' | 'ALL';

const PERIOD_OPTIONS: { id: ChartPeriod; label: string }[] = [
  { id: 'TODAY', label: 'Heute' },
  { id: '1W', label: '1W' },
  { id: '1M', label: '1M' },
  { id: 'ALL', label: 'Gesamt' },
];

export function DepotDevelopmentChart({
  snapshots,
  valuation,
}: {
  snapshots: DepotSnapshot[];
  valuation: PortfolioValuationSummary;
}) {
  const gradientId = useId();
  const [period, setPeriod] = useState<ChartPeriod>('ALL');
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  const hasEnoughHistory = snapshots.length >= 2;

  const periodAvailability = useMemo(() => {
    if (snapshots.length < 2) {
      return {
        TODAY: false,
        '1W': false,
        '1M': false,
        ALL: false,
      };
    }
    const firstMs = new Date(snapshots[0]!.timestamp).getTime();
    const lastMs = new Date(snapshots[snapshots.length - 1]!.timestamp).getTime();
    const spanMs = Math.max(0, lastMs - firstMs);

    const todayStr = new Date(lastMs).toISOString().slice(0, 10);
    const todaySnaps = snapshots.filter(
      (s) => s.timestamp.slice(0, 10) === todayStr,
    );

    return {
      TODAY: todaySnaps.length >= 2,
      '1W': spanMs >= 24 * 60 * 60 * 1000 && snapshots.length >= 2,
      '1M': spanMs >= 7 * 24 * 60 * 60 * 1000 && snapshots.length >= 2,
      ALL: snapshots.length >= 2,
    };
  }, [snapshots]);

  const effectivePeriod: ChartPeriod = periodAvailability[period]
    ? period
    : 'ALL';

  const filteredSnapshots = useMemo(() => {
    if (!hasEnoughHistory) return [];
    const lastMs = new Date(
      snapshots[snapshots.length - 1]!.timestamp,
    ).getTime();

    if (effectivePeriod === 'TODAY') {
      const todayStr = new Date(lastMs).toISOString().slice(0, 10);
      const list = snapshots.filter((s) => s.timestamp.slice(0, 10) === todayStr);
      return list.length >= 2 ? list : snapshots;
    }
    if (effectivePeriod === '1W') {
      const cutoff = lastMs - 7 * 24 * 60 * 60 * 1000;
      const list = snapshots.filter(
        (s) => new Date(s.timestamp).getTime() >= cutoff,
      );
      return list.length >= 2 ? list : snapshots;
    }
    if (effectivePeriod === '1M') {
      const cutoff = lastMs - 30 * 24 * 60 * 60 * 1000;
      const list = snapshots.filter(
        (s) => new Date(s.timestamp).getTime() >= cutoff,
      );
      return list.length >= 2 ? list : snapshots;
    }
    return snapshots;
  }, [effectivePeriod, hasEnoughHistory, snapshots]);

  const firstSnap = filteredSnapshots[0];
  const lastSnap = filteredSnapshots[filteredSnapshots.length - 1];

  const minVal = hasEnoughHistory
    ? Math.min(
        ...filteredSnapshots.map((s) => s.totalValueEur),
        valuation.startingCashEur,
      ) * 0.992
    : 0;
  const maxVal = hasEnoughHistory
    ? Math.max(
        ...filteredSnapshots.map((s) => s.totalValueEur),
        valuation.startingCashEur,
      ) * 1.008
    : 1;
  const range = Math.max(1, maxVal - minVal);

  const coords = useMemo(() => {
    if (!hasEnoughHistory || filteredSnapshots.length < 2) return [];
    return filteredSnapshots.map((s, idx) => {
      const x = (idx / (filteredSnapshots.length - 1)) * 100;
      const y = 88 - ((s.totalValueEur - minVal) / range) * 76;
      return { x, y, snapshot: s };
    });
  }, [filteredSnapshots, hasEnoughHistory, minVal, range]);

  const svgPoints = coords
    .map((pt) => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`)
    .join(' ');

  const areaPath =
    coords.length >= 2
      ? `M ${coords[0]!.x.toFixed(2)},94 L ${coords
          .map((pt) => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`)
          .join(' L ')} L ${coords[coords.length - 1]!.x.toFixed(2)},94 Z`
      : '';

  const baselineY = hasEnoughHistory
    ? 88 - ((valuation.startingCashEur - minVal) / range) * 76
    : 50;

  const inspectedPoint =
    activePointIndex !== null && coords[activePointIndex]
      ? coords[activePointIndex]!
      : coords[coords.length - 1] ?? null;

  const accessibleHistorySummary = hasEnoughHistory
    ? `Depotverlauf (${filteredSnapshots.length} Messpunkte): Startwert ${formatEuro(firstSnap?.totalValueEur ?? valuation.startingCashEur, 2)}, aktueller Wert ${formatEuro(valuation.totalPortfolioValueEur, 2)} (${formatSignedEuro(valuation.totalGainLossEur, 2)} · ${formatSignedPercent(valuation.totalPerformancePercent, 2)}).`
    : 'Noch nicht genügend Daten für einen Verlauf. Der Verlauf entsteht erst durch Käufe, Verkäufe und gespeicherte Kursaktualisierungen.';

  return (
    <section
      aria-labelledby="depot-history-chart-heading"
      className="depot-card p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2
            id="depot-history-chart-heading"
            className="text-sm sm:text-base font-bold text-[#F4F7F3]"
          >
            Depotverlauf
          </h2>
          <p className="text-xs text-[#A8B8AE]">
            Startwert: <span className="font-mono">{formatEuro(valuation.startingCashEur, 2)}</span>
          </p>
        </div>

        {/* Period Controls: only enabled when valid history exists */}
        <div
          className="inline-flex rounded-xl border border-[#26382E] bg-[#0D1812] p-1"
          role="tablist"
          aria-label="Zeitraum für Depotverlauf"
        >
          {PERIOD_OPTIONS.map((opt) => {
            const enabled = periodAvailability[opt.id];
            const isSelected = hasEnoughHistory && effectivePeriod === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                disabled={!enabled}
                aria-selected={isSelected}
                aria-disabled={!enabled}
                onClick={() => {
                  if (enabled) {
                    setPeriod(opt.id);
                    setActivePointIndex(null);
                  }
                }}
                className={`min-h-[32px] rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap depot-focus ${
                  isSelected
                    ? 'bg-[#B7F34A] text-[#07100C] font-bold'
                    : enabled
                      ? 'text-[#A8B8AE] hover:text-[#F4F7F3]'
                      : 'text-[#84968C]/50 cursor-not-allowed'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {!hasEnoughHistory ? (
        <div
          data-testid="depot-history-empty-state"
          className="rounded-xl border border-[#26382E] bg-[#0D1812] p-5 sm:p-6 text-center space-y-2"
        >
          <Clock
            className="h-5 w-5 depot-text-lime mx-auto"
            aria-hidden="true"
          />
          <p className="text-sm font-bold text-[#F4F7F3]">
            Noch nicht genügend Daten für einen Verlauf.
          </p>
          <p className="text-xs text-[#A8B8AE] max-w-md mx-auto leading-relaxed">
            Der Verlauf entsteht erst durch Käufe, Verkäufe und gespeicherte Kursaktualisierungen.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Interactive Tooltip / Active Point Readout */}
          {inspectedPoint && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#0D1812] border border-[#26382E] px-3 py-2 text-xs">
              <span className="text-[#A8B8AE]">
                Messpunkt:{' '}
                <strong className="font-mono text-[#F4F7F3]">
                  {new Date(inspectedPoint.snapshot.timestamp).toLocaleString(
                    'de-DE',
                    {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    },
                  )}
                </strong>
              </span>
              <span className="font-mono font-bold text-[#B7F34A] tabular-nums">
                {formatEuro(inspectedPoint.snapshot.totalValueEur, 2)}
              </span>
            </div>
          )}

          {/* Dark Market Chart Canvas */}
          <div
            className="rounded-xl border border-[#26382E] bg-[#0D1812] p-3.5 sm:p-4"
            role="img"
            aria-label={accessibleHistorySummary}
          >
            <div className="relative h-36 sm:h-44 w-full">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="h-full w-full overflow-visible"
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B7F34A" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#B7F34A" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Subtle Horizontal Grid Lines */}
                {[20, 50, 80].map((gridY) => (
                  <line
                    key={gridY}
                    x1="0"
                    y1={gridY}
                    x2="100"
                    y2={gridY}
                    stroke="#26382E"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}

                {/* Starting Cash Baseline */}
                <line
                  x1="0"
                  y1={baselineY}
                  x2="100"
                  y2={baselineY}
                  stroke="#84968C"
                  strokeDasharray="3,3"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />

                {/* Restrained Lime Fill */}
                {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

                {/* Primary Lime Line */}
                <polyline
                  fill="none"
                  stroke="#B7F34A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  points={svgPoints}
                />
              </svg>

              {/* True Circular Active Point Highlight */}
              {inspectedPoint && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#07100C] bg-[#B7F34A] shadow-sm"
                  style={{
                    left: `${inspectedPoint.x}%`,
                    top: `${inspectedPoint.y}%`,
                  }}
                />
              )}
            </div>

            {/* Touch-friendly Point Selector Scrubber when >= 2 points */}
            {coords.length >= 2 && (
              <div className="mt-2 flex items-center justify-between gap-1">
                {coords.map((pt, idx) => (
                  <button
                    key={pt.snapshot.id}
                    type="button"
                    onClick={() => setActivePointIndex(idx)}
                    aria-label={`Messpunkt ${idx + 1}: ${formatEuro(pt.snapshot.totalValueEur, 2)}`}
                    className={`h-2 flex-1 rounded-full transition-colors depot-focus ${
                      (activePointIndex ?? coords.length - 1) === idx
                        ? 'bg-[#B7F34A]'
                        : 'bg-[#182820] hover:bg-[#26382E]'
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[#A8B8AE] font-mono tabular-nums">
              <span className="truncate">
                Start:{' '}
                {formatEuro(
                  firstSnap?.totalValueEur ?? valuation.startingCashEur,
                  2,
                )}
              </span>
              <span className="truncate text-right">
                Aktuell:{' '}
                {formatEuro(
                  lastSnap?.totalValueEur ?? valuation.totalPortfolioValueEur,
                  2,
                )}
              </span>
            </div>
          </div>

          <p className="sr-only">{accessibleHistorySummary}</p>
        </div>
      )}
    </section>
  );
}

export function DepotAllocationCard({
  valuation,
}: {
  valuation: PortfolioValuationSummary;
}) {
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const bucket of valuation.assetAllocation) {
      map.set(bucket.key, bucket.shareOfPortfolioPercent);
    }

    const baseRows = [
      {
        key: 'CASH',
        label: 'Cash',
        pct: map.get('CASH') ?? valuation.cashSharePercent,
        isCash: true,
      },
      {
        key: 'ETF',
        label: 'ETFs',
        pct: map.get('ETF') ?? 0,
        isCash: false,
      },
      {
        key: 'Aktie',
        label: 'Aktien',
        pct: map.get('Aktie') ?? 0,
        isCash: false,
      },
      {
        key: 'Anleihen-ETF',
        label: 'Anleihen',
        pct: map.get('Anleihen-ETF') ?? 0,
        isCash: false,
      },
      {
        key: 'Rohstoff-ETC',
        label: 'Gold',
        pct: map.get('Rohstoff-ETC') ?? 0,
        isCash: false,
      },
    ];

    // Always show Cash, ETFs, Aktien; include Anleihen/Gold when non-zero
    return baseRows.filter(
      (r) =>
        r.key === 'CASH' ||
        r.key === 'ETF' ||
        r.key === 'Aktie' ||
        r.pct > 0,
    );
  }, [valuation.assetAllocation, valuation.cashSharePercent]);

  return (
    <section
      aria-labelledby="depot-allocation-heading"
      className="depot-card p-4 sm:p-5 space-y-3.5"
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id="depot-allocation-heading"
          className="text-sm sm:text-base font-bold text-[#F4F7F3]"
        >
          Aufteilung
        </h2>
        <span className="text-xs text-[#A8B8AE] font-mono tabular-nums">
          {valuation.valuedPositions.length === 0
            ? '100 % Cash'
            : `${formatPercent(valuation.investedSharePercent, 0)} investiert`}
        </span>
      </div>

      <div className="space-y-2.5">
        {categories.map((row) => (
          <div key={row.key} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-[#F4F7F3]">{row.label}</span>
              <span className="font-mono font-semibold tabular-nums text-[#A8B8AE]">
                {formatPercent(row.pct, 1)}
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-[#0D1812] border border-[#26382E]"
              role="progressbar"
              aria-valuenow={Math.round(row.pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${row.label}: ${formatPercent(row.pct, 1)}`}
            >
              <div
                className={`h-full transition-all duration-200 ${
                  row.pct === 0
                    ? 'bg-transparent'
                    : row.isCash
                      ? 'bg-[#84968C]'
                      : 'bg-[#B7F34A]'
                }`}
                style={{ width: `${row.pct > 0 ? Math.max(3, Math.min(100, row.pct)) : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DepotCharts({
  snapshots,
  valuation,
}: {
  snapshots: DepotSnapshot[];
  valuation: PortfolioValuationSummary;
}) {
  return (
    <div className="space-y-5">
      <DepotDevelopmentChart snapshots={snapshots} valuation={valuation} />
      <DepotAllocationCard valuation={valuation} />
    </div>
  );
}
