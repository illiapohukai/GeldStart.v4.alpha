/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
  HelpCircle,
  Info,
  ShieldCheck,
} from 'lucide-react';
import {
  BASIC_ALLOWANCE_REFERENCE_POINTS,
  calculateBasicAllowance,
  calculateBudgetSplit,
  calculateCompoundInterest,
  calculateEffectiveAnnualCostRate,
  calculateInflationPurchasingPower,
  calculateRetirementProjection,
  formatEuro,
  formatEuroExact,
  RETIREMENT_RETURN_PRESETS,
} from '@/lib/calculator';
import {
  ALTERSVORSORGEDEPOT_PROVIDERS,
  ANONYMIZED_PROVIDER_EXAMPLES,
  type InteractiveStepWidget,
  STATE_SUPPORT_PROGRAMS,
  type StateSupportProgram,
} from '@/lib/lessons';

/**
 * Step-level compact interactive widgets for the LessonPlayer.
 * Each widget focuses on one single interactive lever so the user sees immediate cause-and-effect.
 */
export function LessonStepInteractiveWidget({
  widget,
}: {
  widget: InteractiveStepWidget;
}) {
  switch (widget) {
    case 'inflation-slider':
      return <InflationStepWidget />;
    case 'compound-slider':
      return <CompoundStepWidget />;
    case 'asset-inspector':
      return <AssetInspectorStepWidget />;
    case 'small-amounts-slider':
      return <SmallAmountsStepWidget />;
    case 'retirement-slider':
      return <RetirementHorizonStepWidget />;
    case 'allowance-slider':
      return <AllowanceSliderStepWidget />;
    case 'retirement-breakdown':
      return <RetirementBreakdownInteractive compact />;
    case 'state-status-checker':
      return <StateSupportStepWidget />;
    case 'cost-impact-slider':
      return <CostImpactStepWidget />;
    case 'provider-comparison':
      return <ProviderComparisonWidget />;
    case 'budget-mini':
      return <BudgetMiniStepWidget />;
    default:
      return null;
  }
}

function InflationStepWidget() {
  const [inflationRate, setInflationRate] = useState(3);
  const [years, setYears] = useState(10);
  const purchasingPower = calculateInflationPurchasingPower(1000, inflationRate, years);
  const loss = Math.max(0, 1000 - purchasingPower);

  return (
    <div className="rounded-2xl border border-border bg-secondary/45 p-4 sm:p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <label htmlFor="step-inflation-rate" className="font-semibold text-foreground">
              Inflation pro Jahr
            </label>
            <span className="font-mono font-bold text-primary">{inflationRate} %</span>
          </div>
          <input
            id="step-inflation-rate"
            type="range"
            min={1}
            max={6}
            step={0.5}
            value={inflationRate}
            onChange={(e) => setInflationRate(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <label htmlFor="step-inflation-years" className="font-semibold text-foreground">
              Zeitraum
            </label>
            <span className="font-mono font-bold text-primary">{years} Jahre</span>
          </div>
          <input
            id="step-inflation-years"
            type="range"
            min={5}
            max={25}
            step={5}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-muted-foreground">
            Kaufkraft von 1.000 € (unverzinst):
          </span>
          <span className="font-mono text-xl font-extrabold text-primary">
            {formatEuro(purchasingPower)}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-secondary flex">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${Math.round((purchasingPower / 1000) * 100)}%` }}
          />
          <div
            className="h-full bg-warning/70 transition-all duration-300"
            style={{ width: `${Math.max(0, 100 - Math.round((purchasingPower / 1000) * 100))}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Rechnerischer Kaufkraftverlust ohne Zinsen:{' '}
          <strong className="font-mono text-foreground">−{formatEuro(loss)}</strong>
        </p>
      </div>
    </div>
  );
}

function CompoundStepWidget() {
  const [years, setYears] = useState(15);
  const monthly = 50;
  const rate = 6;
  const result = calculateCompoundInterest({
    initialAmount: 0,
    monthlyContribution: monthly,
    years,
    annualRatePercent: rate,
  });

  return (
    <div className="rounded-2xl border border-border bg-secondary/45 p-4 sm:p-5 space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor="step-compound-years" className="font-semibold text-foreground">
            Laufzeit bei 50 € / Monat (Annahme: 6 % p. a.)
          </label>
          <span className="font-mono font-bold text-primary">{years} Jahre</span>
        </div>
        <input
          id="step-compound-years"
          type="range"
          min={5}
          max={35}
          step={5}
          value={years}
          onChange={(e) => setYears(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-semibold text-muted-foreground">Eingezahlt</p>
          <p className="font-mono text-base font-bold text-foreground mt-0.5">
            {formatEuro(result.totalContributions)}
          </p>
        </div>
        <div className="rounded-xl border border-primary/25 bg-accent/20 p-3">
          <p className="text-xs font-semibold text-accent-foreground">Ertrag</p>
          <p className="font-mono text-base font-bold text-primary mt-0.5">
            +{formatEuro(result.estimatedGrowth)}
          </p>
        </div>
        <div className="rounded-xl bg-primary p-3 text-primary-foreground">
          <p className="text-xs font-semibold text-primary-foreground/80">Endwert</p>
          <p className="font-mono text-base font-extrabold mt-0.5">
            {formatEuro(result.estimatedFinalValue)}
          </p>
        </div>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-secondary flex">
        <div
          className="h-full bg-primary/45 transition-all duration-300"
          style={{ width: `${result.contributionSharePercent}%` }}
        />
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${result.growthSharePercent}%` }}
        />
      </div>
    </div>
  );
}

const ASSET_PROFILES = [
  {
    id: 'tagesgeld',
    title: 'Tagesgeld / Festgeld',
    fluctuation: 'Keine Kursschwankung',
    horizon: 'Kurzfristig (Notgroschen, 0–2 Jahre)',
    summary: 'Guthaben ist bis 100.000 € pro Bank gesetzlich geschützt. Dafür meist nur begrenzter Zins.',
  },
  {
    id: 'etf',
    title: 'Breit gestreuter Aktien-ETF',
    fluctuation: 'Mittlere bis höhere Schwankung',
    horizon: 'Langfristig (ab 10–15 Jahren)',
    summary: 'Bündelt hunderte Unternehmen weltweit in einem Baustein. Einzelrisiken sinken deutlich.',
  },
  {
    id: 'einzelaktie',
    title: 'Einzelne Aktie',
    fluctuation: 'Hohe Kursschwankung möglich',
    horizon: 'Langfristig & nur als Beimischung',
    summary: 'Du hängst direkt vom Erfolg einer einzigen Firma ab. Hohe Chancen, aber auch hohes Rückschlagsrisiko.',
  },
];

function AssetInspectorStepWidget() {
  const [selectedId, setSelectedId] = useState('etf');
  const active = ASSET_PROFILES.find((a) => a.id === selectedId) ?? ASSET_PROFILES[1]!;

  return (
    <div className="rounded-2xl border border-border bg-secondary/45 p-4 sm:p-5 space-y-4">
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Anlageklassen vergleichen">
        {ASSET_PROFILES.map((item) => {
          const isSelected = item.id === active.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedId(item.id)}
              className={`min-h-[44px] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold transition-all ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'border border-border bg-card text-foreground hover:bg-secondary'
              }`}
            >
              {item.id === 'tagesgeld'
                ? 'Tagesgeld'
                : item.id === 'etf'
                  ? 'Welt-ETF'
                  : 'Einzelaktie'}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <p className="text-base font-extrabold text-foreground">{active.title}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-secondary/60 px-3 py-2">
            <span className="text-xs font-semibold text-muted-foreground block">Schwankung</span>
            <span className="font-bold text-foreground">{active.fluctuation}</span>
          </div>
          <div className="rounded-lg bg-secondary/60 px-3 py-2">
            <span className="text-xs font-semibold text-muted-foreground block">Zeithorizont</span>
            <span className="font-bold text-foreground">{active.horizon}</span>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground pt-1">{active.summary}</p>
      </div>
    </div>
  );
}

function SmallAmountsStepWidget() {
  const [monthly, setMonthly] = useState(25);
  const res18 = calculateCompoundInterest({
    initialAmount: 0,
    monthlyContribution: monthly,
    years: 18,
    annualRatePercent: 6,
  });

  return (
    <div className="rounded-2xl border border-border bg-secondary/45 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">Monatliche Sparrate wählen:</span>
        <div className="flex gap-1.5">
          {[15, 25, 50].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setMonthly(val)}
              className={`min-h-[40px] rounded-xl px-3.5 py-1.5 font-mono text-sm font-bold transition-all ${
                monthly === val
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-foreground hover:bg-secondary'
              }`}
            >
              {val} €
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">
            Nach 18 Jahren (unverbindliche Annahme: 6 % p. a.)
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Eingezahlt: <strong className="font-mono text-foreground">{formatEuro(res18.totalContributions)}</strong> · Ertrag:{' '}
            <strong className="font-mono text-primary">+{formatEuro(res18.estimatedGrowth)}</strong>
          </p>
        </div>
        <p className="font-mono text-xl font-extrabold text-primary shrink-0">
          {formatEuro(res18.estimatedFinalValue)}
        </p>
      </div>
    </div>
  );
}

function RetirementHorizonStepWidget() {
  const [startAge, setStartAge] = useState<18 | 28>(18);
  const years = 67 - startAge;
  const result = calculateCompoundInterest({
    initialAmount: 0,
    monthlyContribution: 50,
    years,
    annualRatePercent: 6,
  });

  return (
    <div className="rounded-2xl border border-border bg-secondary/45 p-4 sm:p-5 space-y-4">
      <div className="grid grid-cols-2 gap-2.5">
        {([18, 28] as const).map((age) => (
          <button
            key={age}
            type="button"
            onClick={() => setStartAge(age)}
            className={`min-h-[48px] rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              startAge === age
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'border border-border bg-card text-foreground hover:bg-secondary'
            }`}
          >
            Start mit {age} Jahren ({67 - age} J.)
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Eigene Einzahlung (50 €/Monat)</p>
          <p className="font-mono text-lg font-bold text-foreground mt-0.5">
            {formatEuro(result.totalContributions)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Beispiel-Endwert mit 67 (6 % p. a.)</p>
          <p className="font-mono text-lg font-extrabold text-primary mt-0.5">
            {formatEuro(result.estimatedFinalValue)}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Interactive Allowance Slider for Modul 05 Step 4 ('allowance-slider').
 * Teaches the exact 2026 Altersvorsorgedepot basic allowance (Grundzulage) formula:
 * - 0.50 € per 1 € up to 360 €/year (max 180 €)
 * - 0.25 € per 1 € from 361 € to 1,800 €/year (max +360 €)
 * - Maximum basic allowance: 540 €/year at 1,800 €/year (150 €/month) own contribution.
 */
function AllowanceSliderStepWidget() {
  const [monthlyContribution, setMonthlyContribution] = useState(30);
  const annualContribution = monthlyContribution * 12;
  const basicAllowance = calculateBasicAllowance(annualContribution);
  const totalInvestedPerYear = annualContribution + basicAllowance;
  const allowanceRatioPercent =
    annualContribution > 0
      ? Math.round((basicAllowance / annualContribution) * 100)
      : 0;

  return (
    <div
      data-testid="allowance-slider-widget"
      className="rounded-2xl border border-border bg-secondary/45 p-4 sm:p-5 space-y-4"
    >
      {/* Slider & Reference Quick Buttons */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <label
            htmlFor="allowance-monthly-range"
            className="text-sm sm:text-base font-bold text-foreground"
          >
            Dein Monatsbeitrag
          </label>
          <span
            data-testid="allowance-monthly-value"
            className="font-mono text-xl font-extrabold text-primary"
          >
            {formatEuro(monthlyContribution)} / Monat
          </span>
        </div>

        <input
          id="allowance-monthly-range"
          data-testid="allowance-monthly-range"
          type="range"
          min={0}
          max={200}
          step={5}
          value={monthlyContribution}
          onChange={(e) => setMonthlyContribution(Number(e.target.value))}
          className="w-full"
        />

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground mr-1">
            Stufen testen:
          </span>
          {BASIC_ALLOWANCE_REFERENCE_POINTS.map((ref) => {
            const active = monthlyContribution === ref.monthlyContribution;
            return (
              <button
                key={ref.monthlyContribution}
                type="button"
                data-testid={`allowance-preset-${ref.monthlyContribution}`}
                onClick={() => setMonthlyContribution(ref.monthlyContribution)}
                className={`min-h-[36px] rounded-xl px-2.5 py-1 font-mono text-xs font-bold transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'border border-border bg-card text-foreground hover:bg-secondary'
                }`}
              >
                {ref.monthlyContribution} €
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Key Output Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-semibold text-muted-foreground">
            Jahresbeitrag
          </p>
          <p
            data-testid="allowance-annual-own"
            className="font-mono text-base sm:text-lg font-extrabold text-foreground mt-0.5"
          >
            {formatEuro(annualContribution)}
          </p>
        </div>

        <div className="rounded-xl border border-primary/30 bg-accent/20 p-3">
          <p className="text-xs font-semibold text-accent-foreground">
            Grundzulage
          </p>
          <p
            data-testid="allowance-basic-amount"
            className="font-mono text-base sm:text-lg font-extrabold text-primary mt-0.5"
          >
            +{formatEuro(basicAllowance)}
          </p>
        </div>

        <div className="rounded-xl bg-primary p-3 text-primary-foreground">
          <p className="text-xs font-semibold text-primary-foreground/85">
            Zusammen investiert
          </p>
          <p
            data-testid="allowance-total-invested"
            className="font-mono text-base sm:text-lg font-extrabold mt-0.5"
          >
            {formatEuro(totalInvestedPerYear)}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-semibold text-muted-foreground">
            Förderanteil zum Eigenbeitrag
          </p>
          <p
            data-testid="allowance-ratio-percent"
            className="font-mono text-base sm:text-lg font-extrabold text-primary mt-0.5"
          >
            {allowanceRatioPercent} %
          </p>
        </div>
      </div>

      {annualContribution > 1800 && (
        <p className="rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-muted-foreground">
          Hinweis zur Fördergrenze: Ab 1.800 € Eigenbeitrag pro Jahr (150 € / Monat) ist die maximale Grundzulage von 540 € pro Jahr erreicht. Höhere Eigenbeiträge werden mitinvestiert, erhöhen die Grundzulage aber nicht weiter.
        </p>
      )}

      {/* 6 Reference Points Overview */}
      <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Orientierungstabelle: Eigenbeitrag & jährliche Grundzulage
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {BASIC_ALLOWANCE_REFERENCE_POINTS.map((ref) => {
            const isCurrent = monthlyContribution === ref.monthlyContribution;
            return (
              <div
                key={ref.monthlyContribution}
                className={`rounded-lg border px-2.5 py-2 ${
                  isCurrent
                    ? 'border-primary bg-accent/20 font-bold'
                    : 'border-border bg-secondary/35'
                }`}
              >
                <p className="font-mono text-foreground">
                  {ref.monthlyContribution} €/Monat ({ref.annualContribution} €/J.)
                </p>
                <p className="font-mono text-primary mt-0.5">
                  +{ref.basicAllowance} € Zulage → {ref.totalInvestedPerYear} €
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Required Pedagogical Note */}
      <p className="rounded-xl border border-primary/25 bg-accent/15 px-3.5 py-2.5 text-sm font-semibold text-foreground leading-snug">
        Die Zulage steigt mit deinem Eigenbeitrag. Wie viel du selbst einzahlst, muss aber zu deinem Budget und deiner langfristigen Planung passen.
      </p>
    </div>
  );
}

/**
 * Interactive Retirement Breakdown Widget used in Modul 05 Step 6 AND as the 3rd tab on /rechner.
 * Separates Own Contributions, Basic Allowances, Child Allowances, Career Starter Bonus,
 * Potential Market Growth, and Estimated Costs cleanly.
 */
export function RetirementBreakdownInteractive({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [startAge, setStartAge] = useState(18);
  const [retirementAge, setRetirementAge] = useState(67);
  const [monthlyContribution, setMonthlyContribution] = useState(50);
  const [annualReturnPercent, setAnnualReturnPercent] = useState(5);
  const [annualCostPercent, setAnnualCostPercent] = useState(0.35);
  const [eligibleChildrenCount, setEligibleChildrenCount] = useState(0);
  const [includeCareerStarterBonus, setIncludeCareerStarterBonus] = useState(true);
  const [showFullLegalNotice, setShowFullLegalNotice] = useState(false);

  const isUnder25 = startAge < 25;

  const projection = calculateRetirementProjection({
    startAge,
    retirementAge,
    monthlyContribution,
    assumedGrossAnnualReturnPercent: annualReturnPercent,
    estimatedAnnualCostPercent: annualCostPercent,
    eligibleChildren: eligibleChildrenCount,
    careerStarterBonusEligible: isUnder25 && includeCareerStarterBonus,
  });

  return (
    <div
      data-testid="retirement-breakdown-widget"
      className={
        compact
          ? 'rounded-2xl border border-border bg-secondary/45 p-4 sm:p-5 space-y-5'
          : 'surface-card p-6 sm:p-7 space-y-6'
      }
    >
      {!compact && (
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-accent/25 px-2.5 py-1 text-xs font-bold text-accent-foreground">
              Altersvorsorgedepot-Modellrechner (ab 2027)
            </span>
            <span className="inline-flex items-center rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              Rechts- und Informationsstand: November 2026
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">
            Eigenbeitrag, staatliche Zulagen, Rendite & Kosten getrennt prüfen
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Die gesetzliche Grundlage wurde 2026 beschlossen. Zertifizierte Produkte sollen ab dem 1. Januar 2027 angeboten werden. Konkrete Anbieterbedingungen können sich bis zur endgültigen Zertifizierung und Veröffentlichung der Produktunterlagen noch ändern.
          </p>
        </div>
      )}

      {/* Return Presets (vorsichtig 2 %, mittel 5 %, chancenorientiert 7 %) */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          Rendite-Szenario wählen (unverbindliche Modellannahme vor Kosten):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {RETIREMENT_RETURN_PRESETS.map((preset) => {
            const active = annualReturnPercent === preset.ratePercent;
            return (
              <button
                key={preset.id}
                type="button"
                data-testid={`retirement-preset-${preset.id}`}
                onClick={() => setAnnualReturnPercent(preset.ratePercent)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                    : 'border-border bg-card text-foreground hover:bg-secondary'
                }`}
              >
                <p className="text-xs sm:text-sm font-extrabold">{preset.label}</p>
                <p
                  className={`text-[11px] mt-0.5 ${
                    active ? 'text-primary-foreground/85' : 'text-muted-foreground'
                  }`}
                >
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Monthly contribution */}
        <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="ret-monthly-range"
              className="text-sm font-bold text-foreground"
            >
              Monatlicher Eigenbeitrag
            </label>
            <span className="font-mono text-base font-extrabold text-primary">
              {formatEuro(monthlyContribution)}
            </span>
          </div>
          <input
            id="ret-monthly-range"
            data-testid="ret-monthly-range"
            type="range"
            min={0}
            max={250}
            step={5}
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Jahresbeitrag: <strong className="font-mono">{formatEuro(projection.annualPersonalContribution)}</strong> → Grundzulage:{' '}
            <strong className="font-mono text-primary">+{formatEuro(projection.annualBasicAllowance)}/J.</strong>
          </p>
        </div>

        {/* Start Age & Retirement Age */}
        <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="ret-start-age-range"
              className="text-sm font-bold text-foreground"
            >
              Startalter (bis Rentenbeginn {retirementAge} J.)
            </label>
            <span className="font-mono text-base font-extrabold text-primary">
              {startAge} J. ({projection.years} J. Laufzeit)
            </span>
          </div>
          <input
            id="ret-start-age-range"
            data-testid="ret-start-age-range"
            type="range"
            min={16}
            max={60}
            step={1}
            value={startAge}
            onChange={(e) => setStartAge(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
            <label htmlFor="ret-end-age-select" className="font-semibold">
              Geplanter Rentenbeginn:
            </label>
            <select
              id="ret-end-age-select"
              value={retirementAge}
              onChange={(e) => setRetirementAge(Number(e.target.value))}
              className="rounded-lg border border-border bg-secondary px-2 py-0.5 font-mono text-xs font-bold text-foreground"
            >
              <option value={65}>65 Jahre</option>
              <option value={67}>67 Jahre (Regelgrenze)</option>
              <option value={68}>68 Jahre</option>
              <option value={70}>70 Jahre</option>
            </select>
          </div>
        </div>

        {/* Gross return & Annual cost */}
        <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="ret-cost-range"
              className="text-sm font-bold text-foreground"
            >
              Geschätzte Kosten p. a. (ETF + Depot)
            </label>
            <span className="font-mono text-base font-extrabold text-foreground">
              {annualCostPercent.toLocaleString('de-DE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              %
            </span>
          </div>
          <input
            id="ret-cost-range"
            data-testid="ret-cost-range"
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={annualCostPercent}
            onChange={(e) => setAnnualCostPercent(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Referenzwert Standarddepot: max. 1,50 % Effektivkosten (günstige ETF-Lösungen oft 0,10–0,50 % p. a.)
          </p>
        </div>

        {/* Children & Career Starter Bonus */}
        <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="ret-children-select"
              className="text-sm font-bold text-foreground"
            >
              Förderberechtigte Kinder
            </label>
            <select
              id="ret-children-select"
              data-testid="ret-children-select"
              value={eligibleChildrenCount}
              onChange={(e) => setEligibleChildrenCount(Number(e.target.value))}
              className="rounded-lg border border-border bg-secondary px-2.5 py-1 font-mono text-xs font-bold text-foreground"
            >
              <option value={0}>0 Kinder</option>
              <option value={1}>1 Kind (+{formatEuro(projection.annualChildAllowance)}/J.)</option>
              <option value={2}>2 Kinder</option>
              <option value={3}>3 Kinder</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
            <label
              htmlFor="ret-starter-bonus-check"
              className="text-xs font-semibold text-foreground"
            >
              Berufseinsteigerbonus (einmalig 200 € unter 25 J.)
            </label>
            <input
              id="ret-starter-bonus-check"
              type="checkbox"
              checked={isUnder25 && includeCareerStarterBonus}
              disabled={!isUnder25}
              onChange={(e) => setIncludeCareerStarterBonus(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {isUnder25
              ? 'Aktiv: Startalter liegt vor dem 25. Geburtstag (+200 € einmalig im 1. Jahr).'
              : 'Nicht aktiv: Ab 25 Jahren entfällt der einmalige Berufseinsteigerbonus.'}
          </p>
        </div>
      </div>

      {/* Separate Component Breakdown (Visual Hierarchy) */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Aufschlüsselung zum Rentenbeginn ({projection.years} Jahre)
            </p>
            <h3 className="text-lg font-extrabold text-foreground">
              Woraus sich der Modellwert zusammensetzt
            </h3>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-muted-foreground block">
              Modellwert vor Steuern
            </span>
            <span
              data-testid="ret-final-value"
              className="font-mono text-2xl font-extrabold text-primary"
            >
              {formatEuro(projection.projectedValueBeforeTax)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-border bg-secondary/40 p-3">
            <p className="text-xs font-semibold text-muted-foreground">
              Eigene Einzahlungen
            </p>
            <p
              data-testid="ret-own-contributions"
              className="font-mono text-base font-extrabold text-foreground mt-0.5"
            >
              {formatEuro(projection.personalContributions)}
            </p>
          </div>

          <div className="rounded-xl border border-primary/25 bg-accent/20 p-3">
            <p className="text-xs font-semibold text-accent-foreground">
              Grundzulagen
            </p>
            <p
              data-testid="ret-basic-allowances"
              className="font-mono text-base font-extrabold text-primary mt-0.5"
            >
              +{formatEuro(projection.basicAllowances)}
            </p>
          </div>

          <div className="rounded-xl border border-primary/25 bg-accent/20 p-3">
            <p className="text-xs font-semibold text-accent-foreground">
              Kinderzulagen
            </p>
            <p
              data-testid="ret-child-allowances"
              className="font-mono text-base font-extrabold text-primary mt-0.5"
            >
              +{formatEuro(projection.childAllowances)}
            </p>
          </div>

          <div className="rounded-xl border border-primary/25 bg-accent/20 p-3">
            <p className="text-xs font-semibold text-accent-foreground">
              Berufseinsteigerbonus
            </p>
            <p
              data-testid="ret-starter-bonus"
              className="font-mono text-base font-extrabold text-primary mt-0.5"
            >
              +{formatEuro(projection.careerStarterBonus)}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-secondary/40 p-3">
            <p className="text-xs font-semibold text-muted-foreground">
              Mögliche Wertentwicklung
            </p>
            <p
              data-testid="ret-investment-growth"
              className="font-mono text-base font-extrabold text-foreground mt-0.5"
            >
              +{formatEuro(projection.assumedMarketGrowth)}
            </p>
          </div>

          <div className="rounded-xl border border-warning/40 bg-warning/10 p-3">
            <p className="text-xs font-semibold text-foreground">
              Geschätzte Kosten
            </p>
            <p
              data-testid="ret-estimated-costs"
              className="font-mono text-base font-extrabold text-foreground mt-0.5"
            >
              −{formatEuro(projection.estimatedCosts)}
            </p>
          </div>
        </div>

        {/* Short Mandatory Model Notice directly below the result */}
        <div className="rounded-xl border border-border bg-secondary/35 px-3.5 py-2.5 space-y-2">
          <p
            data-testid="ret-short-disclaimer"
            className="text-xs sm:text-sm font-semibold text-foreground"
          >
            Modellrechnung, keine garantierte Rendite. Der tatsächliche Wert kann höher oder niedriger ausfallen.
          </p>

          <button
            type="button"
            onClick={() => setShowFullLegalNotice((prev) => !prev)}
            aria-expanded={showFullLegalNotice}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <Info className="h-3.5 w-3.5" />
            <span>
              {showFullLegalNotice
                ? 'Rechtlichen Bildungshinweis ausblenden'
                : 'Rechtlicher Bildungshinweis & Modellannahmen'}
            </span>
          </button>

          {showFullLegalNotice && (
            <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border">
              Diese Inhalte dienen ausschließlich der Finanzbildung und stellen keine Anlage-, Steuer- oder Rechtsberatung dar. Modellrechnungen beruhen auf Annahmen. Renditen, Kosten, Steuern und gesetzliche Regeln können sich verändern. Auszahlungen aus einem geförderten Altersvorsorgedepot im Rentenalter unterliegen nachgelagert der individuellen Einkommensteuer.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Updated State Support Status Checker ('state-status-checker').
 * Separates active programs (VL, Arbeitnehmersparzulage, Wohnungsbauprämie),
 * adopted 2027 Altersvorsorgedepot ('available-soon'), legacy Riester ('legacy'),
 * and planned Frühstart-Rente ('planned') with Stand: November 2026.
 */
function StateSupportStepWidget() {
  const [filterStatus, setFilterStatus] = useState<
    'all' | StateSupportProgram['status']
  >('all');

  const filteredPrograms =
    filterStatus === 'all'
      ? STATE_SUPPORT_PROGRAMS
      : STATE_SUPPORT_PROGRAMS.filter((p) => p.status === filterStatus);

  return (
    <div
      data-testid="state-status-checker-widget"
      className="rounded-2xl border border-border bg-secondary/45 p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Programme nach Rechtsstatus filtern (Stand: November 2026):
        </span>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Förderstatus filtern">
          {(
            [
              { id: 'all', label: 'Alle (6)' },
              { id: 'active', label: 'Aktiv heute' },
              { id: 'available-soon', label: 'Ab 01.01.2027' },
              { id: 'legacy', label: 'Altverträge' },
              { id: 'planned', label: 'Geplant' },
            ] as const
          ).map((tab) => {
            const active = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`state-filter-${tab.id}`}
                onClick={() => setFilterStatus(tab.id)}
                className={`min-h-[36px] rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'border border-border bg-card text-foreground hover:bg-secondary'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {filteredPrograms.map((program) => {
          const badgeStyle =
            program.status === 'active'
              ? 'bg-accent/30 text-accent-foreground border-primary/30'
              : program.status === 'available-soon'
                ? 'bg-primary text-primary-foreground border-primary'
                : program.status === 'legacy'
                  ? 'bg-secondary text-secondary-foreground border-border'
                  : 'bg-warning/20 text-foreground border-warning/50';

          return (
            <div
              key={program.id}
              data-testid={`state-program-${program.id}`}
              className="rounded-xl border border-border bg-card p-4 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-base font-extrabold text-foreground">
                  {program.name}
                </p>
                <span
                  className={`rounded-lg border px-2.5 py-0.5 text-xs font-bold ${badgeStyle}`}
                >
                  {program.statusBadgeText}
                </span>
              </div>

              <p className="text-sm text-foreground/90 leading-relaxed">
                {program.summary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-secondary/50 p-2.5 space-y-1">
                  <span className="font-bold text-foreground block">
                    Für wen & wie funktioniert es?
                  </span>
                  <p className="text-muted-foreground">{program.whoIsItFor}</p>
                  <ul className="space-y-1 text-muted-foreground pt-1">
                    {program.howItWorks.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-primary font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg bg-secondary/50 p-2.5 space-y-1">
                  <span className="font-bold text-foreground block">
                    Wichtige Bedingungen & Quelle:
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    {program.importantConditions}
                  </p>
                  <p className="text-[11px] text-muted-foreground/80 pt-1">
                    Prüf-Orientierung: {program.verificationSource}
                  </p>
                </div>
              </div>

              <p className="text-[11px] font-semibold text-muted-foreground">
                {program.standNote}
              </p>
            </div>
          );
        })}
      </div>

      {/* 4 Verification Questions Box */}
      <div className="rounded-xl border border-primary/25 bg-accent/15 p-3.5 space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          Deine 4 Prüf-Fragen vor jedem Fördervertrag:
        </p>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs sm:text-sm font-semibold text-foreground list-decimal list-inside">
          <li>Bin ich förderberechtigt?</li>
          <li>Wie viel muss ich selbst einzahlen?</li>
          <li>Welche Kosten und Bindungsfristen gelten?</li>
          <li>Wann und wie kann ich über das Geld verfügen?</li>
        </ol>
      </div>
    </div>
  );
}

/**
 * Interactive Cost-Impact & Anonymized Real-Provider Learning Examples ('cost-impact-slider').
 * Teaches fixed vs percentage fees on small balances and walks through all 5 anonymized examples.
 */
function CostImpactStepWidget() {
  const [balanceEur, setBalanceEur] = useState(2000);
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);

  // Angebot A: 1 €/month (12 €/year) fixed fee + 0.35% p.a. product cost
  const costBreakdownA = calculateEffectiveAnnualCostRate(balanceEur, 12, 0.35);

  // Angebot B: 0 € depot fee + 0.10% p.a. product cost
  const costBreakdownB = calculateEffectiveAnnualCostRate(balanceEur, 0, 0.1);

  const activeExample =
    ANONYMIZED_PROVIDER_EXAMPLES[selectedExampleIndex] ??
    ANONYMIZED_PROVIDER_EXAMPLES[0]!;

  return (
    <div
      data-testid="cost-impact-widget"
      className="rounded-2xl border border-border bg-secondary/45 p-4 sm:p-5 space-y-5"
    >
      {/* Part 1: Interactive Small-Pot Fee Calculator */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label
            htmlFor="cost-balance-range"
            className="text-sm sm:text-base font-bold text-foreground"
          >
            Depotwert im Aufbau testen
          </label>
          <span
            data-testid="cost-balance-value"
            className="font-mono text-xl font-extrabold text-primary"
          >
            {formatEuro(balanceEur)}
          </span>
        </div>

        <input
          id="cost-balance-range"
          data-testid="cost-balance-range"
          type="range"
          min={500}
          max={20000}
          step={500}
          value={balanceEur}
          onChange={(e) => setBalanceEur(Number(e.target.value))}
          className="w-full"
        />

        <div className="flex flex-wrap gap-1.5">
          {[1000, 2000, 5000, 10000].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setBalanceEur(val)}
              className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition-all ${
                balanceEur === val
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-secondary/60 text-foreground hover:bg-secondary'
              }`}
            >
              {formatEuro(val)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Angebot A (Fixgebühr + ETF)
              </span>
              <span className="font-mono text-xs font-bold text-foreground">
                12 €/J. + 0,35 %
              </span>
            </div>
            <p
              data-testid="cost-rate-angebot-a"
              className="font-mono text-lg font-extrabold text-foreground"
            >
              {costBreakdownA.totalEffectiveCostPercent.toLocaleString('de-DE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              % p. a. ({formatEuroExact(costBreakdownA.totalAnnualCostEur)}/J.)
            </p>
            <p className="text-xs text-muted-foreground">
              Allein die 12 € Fixgebühr wirken bei {formatEuro(balanceEur)} wie{' '}
              <strong className="font-mono">
                {costBreakdownA.fixedFeePercentOfPortfolio.toLocaleString('de-DE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                % p. a.
              </strong>
            </p>
          </div>

          <div className="rounded-xl border border-primary/30 bg-accent/20 p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-accent-foreground">
                Angebot B (0 € Depot + ETF)
              </span>
              <span className="font-mono text-xs font-bold text-primary">
                0 €/J. + 0,10 %
              </span>
            </div>
            <p
              data-testid="cost-rate-angebot-b"
              className="font-mono text-lg font-extrabold text-primary"
            >
              {costBreakdownB.totalEffectiveCostPercent.toLocaleString('de-DE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              % p. a. ({formatEuroExact(costBreakdownB.totalAnnualCostEur)}/J.)
            </p>
            <p className="text-xs text-muted-foreground">
              Keine fixe Grundgebühr – die prozentuale Belastung bleibt auch bei kleinem Startdepot konstant niedrig.
            </p>
          </div>
        </div>
      </div>

      {/* Part 2: 5 Anonymized Real-Provider Learning Examples */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            5 anonymisierte Praxis-Vergleiche (Angebot A vs. Angebot B):
          </p>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Praxis-Beispiele auswählen">
            {ANONYMIZED_PROVIDER_EXAMPLES.map((ex, idx) => {
              const active = idx === selectedExampleIndex;
              return (
                <button
                  key={ex.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-testid={`anon-example-tab-${idx + 1}`}
                  onClick={() => setSelectedExampleIndex(idx)}
                  className={`min-h-[34px] rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'border border-border bg-card text-foreground hover:bg-secondary'
                  }`}
                >
                  Beispiel {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div
          data-testid="anon-example-card"
          className="rounded-xl border border-border bg-card p-4 space-y-3"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              {activeExample.kicker}
            </span>
            <p className="text-base font-extrabold text-foreground mt-0.5">
              {activeExample.title}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="rounded-lg border border-border bg-secondary/45 p-3 space-y-1.5">
              <span className="font-bold text-foreground block">
                {activeExample.offerALabel}
              </span>
              <ul className="space-y-1 text-muted-foreground leading-relaxed">
                {activeExample.offerASummary.map((pt, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-primary font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-primary/25 bg-accent/15 p-3 space-y-1.5">
              <span className="font-bold text-foreground block">
                {activeExample.offerBLabel}
              </span>
              <ul className="space-y-1 text-muted-foreground leading-relaxed">
                {activeExample.offerBSummary.map((pt, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-primary font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-lg bg-secondary/35 p-3 text-xs space-y-1.5">
            <p className="text-foreground">
              <strong>Prüf-Frage:</strong> {activeExample.question}
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Worauf es ankommt:</strong>{' '}
              {activeExample.expectedConcept}
            </p>
            <p className="text-primary font-bold">
              Merksatz: {activeExample.takeaway}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type ProviderFilterId =
  | 'all'
  | 'standard'
  | 'free-choice'
  | 'guarantee'
  | 'published-costs'
  | 'costs-pending';

/**
 * Full Neutral 11-Provider Comparison Widget ('provider-comparison').
 * Sorted strictly alphabetically, objective filters, no winner rankings,
 * clear distinction between confirmed facts, preliminary announcements, and missing final pricing.
 */
export function ProviderComparisonWidget() {
  const [activeFilter, setActiveFilter] = useState<ProviderFilterId>('all');
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);

  const filteredProviders = ALTERSVORSORGEDEPOT_PROVIDERS.filter((provider) => {
    switch (activeFilter) {
      case 'standard':
        return provider.hasStandardProduct;
      case 'free-choice':
        return provider.hasFreeChoice;
      case 'guarantee':
        return provider.hasGuarantee;
      case 'published-costs':
        return provider.hasPublishedCosts;
      case 'costs-pending':
        return provider.hasMissingFinalPricing;
      case 'all':
      default:
        return true;
    }
  });

  const filters: { id: ProviderFilterId; label: string }[] = [
    { id: 'all', label: `Alle (${ALTERSVORSORGEDEPOT_PROVIDERS.length})` },
    { id: 'standard', label: 'Standardprodukt' },
    { id: 'free-choice', label: 'Freie Auswahl' },
    { id: 'guarantee', label: 'Garantie' },
    { id: 'published-costs', label: 'Veröffentlichte Kosten' },
    { id: 'costs-pending', label: 'Kosten noch nicht vollständig veröffentlicht' },
  ];

  return (
    <section
      data-testid="provider-comparison-widget"
      aria-label="Anbieterübersicht zum Altersvorsorgedepot"
      className="rounded-2xl border border-border bg-secondary/45 p-4 sm:p-5 space-y-4"
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg sm:text-xl font-extrabold text-foreground">
            Anbieterübersicht zum Altersvorsorgedepot
          </h3>
          <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>Alphabetisch sortiert · Stand: November 2026</span>
          </span>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Diese Übersicht zeigt veröffentlichte Anbieterinformationen mit Stand November 2026. Sie ist keine Empfehlung und ersetzt keine Prüfung der späteren Produktinformationsblätter, Effektivkostenquoten sowie Preis- und Leistungsverzeichnisse. Bedingungen können sich bis zur Zertifizierung und Markteinführung ändern.
        </p>
      </div>

      {/* Objective Filters */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Filter className="h-3.5 w-3.5 text-primary" />
          <span>Sachlich filtern ({filteredProviders.length} Treffer):</span>
        </div>
        <div
          role="tablist"
          aria-label="Anbieter nach objektiven Merkmalen filtern"
          className="flex flex-wrap gap-1.5"
        >
          {filters.map((f) => {
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`provider-filter-${f.id}`}
                onClick={() => setActiveFilter(f.id)}
                className={`min-h-[36px] rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'border border-border bg-card text-foreground hover:bg-secondary'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Provider Cards (Alphabetical, Responsive on Mobile & Desktop) */}
      <div className="space-y-3">
        {filteredProviders.map((provider) => {
          const isExpanded = expandedProviderId === provider.id;
          const officialSources = provider.sources.filter((s) => s.isOfficial);
          const secondarySources = provider.sources.filter((s) => !s.isOfficial);
          const orderedSources = [...officialSources, ...secondarySources];

          return (
            <article
              key={provider.id}
              data-testid={`provider-card-${provider.id}`}
              className="rounded-xl border border-border bg-card p-4 space-y-3"
            >
              {/* Card Header: Name, Access Note, Info Status Badge, Stand */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base sm:text-lg font-extrabold text-foreground">
                      {provider.providerName}
                    </h4>
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {provider.accessNote}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-lg border px-2.5 py-0.5 text-xs font-bold ${
                      provider.hasPublishedCosts
                        ? 'border-primary/35 bg-accent/20 text-accent-foreground'
                        : 'border-border bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {provider.hasPublishedCosts
                      ? 'Konkrete Kostenangaben veröffentlicht'
                      : 'Finale Gesamtkosten noch offen'}
                  </span>
                  <span className="rounded-lg border border-border bg-secondary/40 px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
                    Stand: {provider.informationDate}
                  </span>
                </div>
              </div>

              {/* 4 Core Comparison Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div className="rounded-lg bg-secondary/45 p-2.5 space-y-1">
                  <span className="font-bold text-foreground block">
                    Einfachster bestätigter Einstieg
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    {provider.simplestConfirmedEntry}
                  </p>
                </div>

                <div className="rounded-lg bg-secondary/45 p-2.5 space-y-1">
                  <span className="font-bold text-foreground block">
                    Freie Auswahl
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    {provider.freeChoice}
                  </p>
                </div>

                <div className="rounded-lg bg-secondary/45 p-2.5 space-y-1">
                  <span className="font-bold text-foreground block">
                    Garantie (80 % / 100 %)
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    {provider.guarantee}
                  </p>
                </div>

                <div className="rounded-lg border border-warning/35 bg-warning/10 p-2.5 space-y-1">
                  <span className="font-bold text-foreground block">
                    Wichtige Einschränkung
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    {provider.importantLimitation}
                  </p>
                </div>
              </div>

              {/* Expandable Details & Sources */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedProviderId(isExpanded ? null : provider.id)
                  }
                  aria-expanded={isExpanded}
                  data-testid={`provider-details-toggle-${provider.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>
                    {isExpanded
                      ? 'Details & Quellen ausblenden'
                      : `Informationsstand & Quellen (${orderedSources.length})`}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {orderedSources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:bg-secondary"
                    >
                      <span>{src.label}</span>
                      <ExternalLink className="h-3 w-3 text-primary shrink-0" />
                    </a>
                  ))}
                </div>
              </div>

              {isExpanded && (
                <div className="rounded-lg bg-secondary/35 p-3 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                  <p>
                    <strong className="text-foreground">
                      Einordnung des Informationsstands (Stand: {provider.informationDate}):
                    </strong>{' '}
                    {provider.informationStatusText}
                  </p>
                  <p>
                    <strong className="text-foreground">Quellen-Hinweis:</strong>{' '}
                    Offizielle Anbieterinformationen werden zuerst genannt, ergänzende Fach- und Medienberichte an zweiter Stelle. Maßgeblich sind ab 2027 allein die zertifizierten Produktinformationsblätter.
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BudgetMiniStepWidget() {
  const [income, setIncome] = useState(250);
  const split = calculateBudgetSplit(income, 50, 30, 20);

  return (
    <div className="rounded-2xl border border-border bg-secondary/45 p-4 sm:p-5 space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor="step-budget-income" className="font-semibold text-foreground">
            Monatliches Budget (Taschengeld / Nebenjob)
          </label>
          <span className="font-mono font-bold text-primary">{formatEuro(income)}</span>
        </div>
        <input
          id="step-budget-income"
          type="range"
          min={50}
          max={800}
          step={25}
          value={income}
          onChange={(e) => setIncome(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Eine mögliche Lernaufteilung (50 / 30 / 20 Orientierung)
      </p>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-semibold text-muted-foreground">Alltag (50 %)</p>
          <p className="font-mono text-base font-bold text-foreground mt-0.5">
            {formatEuro(split.needsAmount)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-semibold text-muted-foreground">Freizeit (30 %)</p>
          <p className="font-mono text-base font-bold text-foreground mt-0.5">
            {formatEuro(split.wantsAmount)}
          </p>
        </div>
        <div className="rounded-xl border border-primary/25 bg-accent/20 p-3">
          <p className="text-xs font-semibold text-accent-foreground">Zukunft (20 %)</p>
          <p className="font-mono text-base font-bold text-primary mt-0.5">
            {formatEuro(split.savingsAmount)}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Full progressive Budget Calculator used on the Rechner page (/rechner).
 * Emphasizes income, fixed expenses, remaining amount, and "Eine mögliche Lernaufteilung".
 */
export function BudgetPlannerInteractive() {
  const [monthlyIncome, setMonthlyIncome] = useState(450);
  const [fixedExpenses, setFixedExpenses] = useState(180);
  const [futurePercent, setFuturePercent] = useState(20);
  const [showDetailedCategories, setShowDetailedCategories] = useState(false);

  const [catAbo, setCatAbo] = useState(35);
  const [catMobility, setCatMobility] = useState(49);
  const [catFood, setCatFood] = useState(96);

  const effectiveFixed = showDetailedCategories
    ? catAbo + catMobility + catFood
    : fixedExpenses;

  const remainingTotal = Math.max(0, monthlyIncome - effectiveFixed);
  const suggestedFutureAmount = Math.round(((monthlyIncome * futurePercent) / 100) * 100) / 100;
  const actualFutureAmount = Math.min(remainingTotal, suggestedFutureAmount);
  const freeForWantsAmount = Math.max(0, remainingTotal - actualFutureAmount);

  return (
    <div className="surface-card p-6 sm:p-7 space-y-6">
      <div className="space-y-1.5">
        <span className="inline-flex items-center rounded-lg bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">
          Monats-Überblick
        </span>
        <h2 className="text-2xl font-extrabold text-foreground">
          Budget- & Taschengeld-Planer
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Trage deine monatlichen Einnahmen und festen Ausgaben ein, um zu sehen, wie viel frei verfügbar bleibt.
        </p>
      </div>

      {/* Primary Inputs: Einnahmen & Feste Ausgaben */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-border bg-secondary/35 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="budget-income-range" className="text-base font-bold text-foreground">
              Monatliche Einnahmen
            </label>
            <span className="font-mono text-lg font-extrabold text-primary">
              {formatEuro(monthlyIncome)}
            </span>
          </div>
          <input
            id="budget-income-range"
            type="range"
            min={50}
            max={2000}
            step={25}
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Taschengeld, Nebenjob oder Ausbildungsvergütung (netto)
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/35 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="budget-fixed-range" className="text-base font-bold text-foreground">
              Feste monatliche Ausgaben
            </label>
            <span className="font-mono text-lg font-extrabold text-foreground">
              {formatEuro(effectiveFixed)}
            </span>
          </div>
          {!showDetailedCategories ? (
            <>
              <input
                id="budget-fixed-range"
                type="range"
                min={0}
                max={Math.max(100, monthlyIncome)}
                step={10}
                value={Math.min(fixedExpenses, monthlyIncome)}
                onChange={(e) => setFixedExpenses(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Handy, Ticket, Abos, feste Verpflichtungen
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Summe aus deinen unten aufgeschlüsselten Fixkosten-Kategorien.
            </p>
          )}
        </div>
      </div>

      {/* Progressive Disclosure for detailed expense categories */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <button
          type="button"
          onClick={() => setShowDetailedCategories((prev) => !prev)}
          aria-expanded={showDetailedCategories}
          className="flex w-full items-center justify-between text-left text-base font-bold text-foreground"
        >
          <span>Ausgaben nach Kategorien aufschlüsseln (optional)</span>
          <span className="text-sm font-semibold text-primary">
            {showDetailedCategories ? 'Ausblenden' : 'Aufklappen'}
          </span>
        </button>

        {showDetailedCategories && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-border">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <label htmlFor="cat-abo" className="font-semibold">Handy & Abos</label>
                <span className="font-mono font-bold">{formatEuro(catAbo)}</span>
              </div>
              <input
                id="cat-abo"
                type="range"
                min={0}
                max={200}
                step={5}
                value={catAbo}
                onChange={(e) => setCatAbo(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <label htmlFor="cat-mob" className="font-semibold">Mobilität / Ticket</label>
                <span className="font-mono font-bold">{formatEuro(catMobility)}</span>
              </div>
              <input
                id="cat-mob"
                type="range"
                min={0}
                max={300}
                step={5}
                value={catMobility}
                onChange={(e) => setCatMobility(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <label htmlFor="cat-food" className="font-semibold">Alltag & Verpflegung</label>
                <span className="font-mono font-bold">{formatEuro(catFood)}</span>
              </div>
              <input
                id="cat-food"
                type="range"
                min={0}
                max={600}
                step={10}
                value={catFood}
                onChange={(e) => setCatFood(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Possible Learning Allocation ("Eine mögliche Lernaufteilung") */}
      <div className="rounded-2xl border border-primary/20 bg-secondary/45 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Eine mögliche Lernaufteilung
            </p>
            <h3 className="text-lg font-extrabold text-foreground">
              Frei verfügbar nach Fixkosten: {formatEuroExact(remainingTotal)}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="future-pct" className="text-sm font-semibold text-muted-foreground">
              Sparquote-Idee:
            </label>
            <select
              id="future-pct"
              value={futurePercent}
              onChange={(e) => setFuturePercent(Number(e.target.value))}
              className="rounded-xl border border-border bg-card px-3 py-1.5 font-mono text-sm font-bold text-foreground"
            >
              <option value={10}>10 %</option>
              <option value={15}>15 %</option>
              <option value={20}>20 % (50/30/20)</option>
              <option value={25}>25 %</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground">1. Feste Ausgaben</p>
            <p className="font-mono text-xl font-extrabold text-foreground mt-1">
              {formatEuroExact(effectiveFixed)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Laufende Fixkosten im Monat</p>
          </div>

          <div className="rounded-xl border border-primary/30 bg-accent/20 p-4">
            <p className="text-xs font-semibold text-accent-foreground">
              2. Notgroschen & Zukunft ({futurePercent} %)
            </p>
            <p className="font-mono text-xl font-extrabold text-primary mt-1">
              {formatEuroExact(actualFutureAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Am Monatsanfang zuerst beiseitelegen</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground">3. Frei für Freizeit & Wünsche</p>
            <p className="font-mono text-xl font-extrabold text-foreground mt-1">
              {formatEuroExact(freeForWantsAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Ohne schlechtes Gewissen nutzbar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
