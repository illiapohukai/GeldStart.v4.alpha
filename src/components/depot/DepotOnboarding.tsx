import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  HelpCircle,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';
import { formatEuro } from '@/lib/calculator';
import { useDepot } from '@/lib/depot-context';
import { STARTING_CASH_PRESETS } from '@/lib/depot-storage';

export function DepotOnboarding() {
  const { createPortfolio, providerStatus } = useDepot();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCash, setSelectedCash] = useState<number>(5000);
  const [portfolioName, setPortfolioName] = useState<string>('Mein Übungsdepot');
  const [showRulesInfo, setShowRulesInfo] = useState<boolean>(false);

  const handleComplete = () => {
    createPortfolio(selectedCash, portfolioName);
  };

  return (
    <div className="mx-auto max-w-xl space-y-5 py-2">
      {/* Compact Progress Header */}
      <section aria-labelledby="depot-onboarding-heading" className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#A8B8AE]">
          <span className="font-mono font-semibold text-[#F4F7F3]">
            Übungsdepot · Schritt {step} / 3
          </span>
          <span>Simulation · Beispieldaten</span>
        </div>

        {/* 3-Step Indicator Bar */}
        <div
          className="grid grid-cols-3 gap-2"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label={`Einrichtung Schritt ${step} von 3`}
        >
          {[1, 2, 3].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setStep(idx as 1 | 2 | 3)}
              aria-label={`Zu Schritt ${idx} wechseln`}
              className={`h-2 rounded-full transition-colors depot-focus ${
                idx <= step
                  ? 'bg-[#B7F34A]'
                  : 'bg-[#182820] hover:bg-[#26382E]'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Main Step Card */}
      <div className="depot-card p-5 sm:p-7 space-y-6">
        {step === 1 && (
          <div className="space-y-5">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl depot-bg-lime-subtle depot-text-lime border border-[#B7F34A]/25">
              <Layers className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold depot-text-lime">
                Schritt 1 · Simulation
              </p>
              <h1
                id="depot-onboarding-heading"
                className="text-2xl font-extrabold tracking-tight text-[#F4F7F3] sm:text-3xl"
              >
                Testen ohne echtes Geld
              </h1>
              <p className="text-sm text-[#A8B8AE] leading-relaxed">
                Erprobe im Markt-Labor, wie sich Wertpapiere, Streuung und Gewichtungen verhalten.
              </p>
            </div>

            <ul className="grid gap-2.5 sm:grid-cols-2 text-xs sm:text-sm">
              <li className="depot-card-secondary p-3.5 space-y-0.5">
                <strong className="text-[#F4F7F3] block">Virtuelles Spielgeld</strong>
                <span className="text-xs text-[#A8B8AE]">
                  Du investierst ausschließlich fiktives Übungsgeld.
                </span>
              </li>
              <li className="depot-card-secondary p-3.5 space-y-0.5">
                <strong className="text-[#F4F7F3] block">Keine echten Orders</strong>
                <span className="text-xs text-[#A8B8AE]">
                  Es werden niemals echte Börsenaufträge ausgeführt.
                </span>
              </li>
              <li className="depot-card-secondary p-3.5 space-y-0.5">
                <strong className="text-[#F4F7F3] block">Lokale Speicherung</strong>
                <span className="text-xs text-[#A8B8AE]">
                  Dein Depot bleibt ohne Konto direkt auf deinem Gerät.
                </span>
              </li>
              <li className="depot-card-secondary p-3.5 space-y-0.5">
                <strong className="text-[#F4F7F3] block">Lern-Simulation</strong>
                <span className="text-xs text-[#A8B8AE]">
                  Beobachte ETFs und Einzelaktien im ruhigen Vergleich.
                </span>
              </li>
            </ul>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl depot-bg-lime-subtle depot-text-lime border border-[#B7F34A]/25">
              <Coins className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold depot-text-lime">
                Schritt 2 · Startguthaben
              </p>
              <h1
                id="depot-onboarding-heading"
                className="text-2xl font-extrabold tracking-tight text-[#F4F7F3] sm:text-3xl"
              >
                Startguthaben wählen
              </h1>
              <p className="text-sm text-[#A8B8AE]">
                Dieser virtuelle Betrag bildet die Basis für deine Wertentwicklung.
              </p>
            </div>

            <div
              className="grid grid-cols-2 gap-3"
              role="radiogroup"
              aria-label="Virtuelles Startguthaben auswählen"
            >
              {STARTING_CASH_PRESETS.map((preset) => {
                const isSelected = selectedCash === preset.amount;
                return (
                  <button
                    key={preset.amount}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedCash(preset.amount)}
                    className={`rounded-xl border p-3.5 text-left transition-colors flex flex-col justify-between gap-1.5 min-h-[82px] depot-focus ${
                      isSelected
                        ? 'border-[#B7F34A] bg-[#182820] text-[#F4F7F3]'
                        : 'border-[#26382E] bg-[#0D1812] hover:bg-[#182820] text-[#F4F7F3]'
                    }`}
                  >
                    <span className="font-mono text-lg sm:text-xl font-extrabold tabular-nums">
                      {preset.label}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        isSelected ? 'depot-text-lime' : 'text-[#A8B8AE]'
                      }`}
                    >
                      {preset.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5 pt-1">
              <label
                htmlFor="depot-name-input"
                className="block text-xs font-semibold text-[#A8B8AE]"
              >
                Depotname
              </label>
              <input
                id="depot-name-input"
                type="text"
                maxLength={40}
                value={portfolioName}
                onChange={(e) => setPortfolioName(e.target.value)}
                placeholder="Mein Übungsdepot"
                className="w-full min-h-[44px] rounded-xl border border-[#26382E] bg-[#0D1812] px-3.5 py-2 text-sm font-medium text-[#F4F7F3] placeholder:text-[#84968C] depot-focus"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl depot-bg-lime-subtle depot-text-lime border border-[#B7F34A]/25">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold depot-text-lime">
                Schritt 3 · Bereit
              </p>
              <h1
                id="depot-onboarding-heading"
                className="text-2xl font-extrabold tracking-tight text-[#F4F7F3] sm:text-3xl"
              >
                Dein Übungsdepot ist startklar
              </h1>
              <p className="text-sm text-[#A8B8AE]">
                Prüfe kurz deine Einstellungen vor dem Start.
              </p>
            </div>

            <div className="depot-card-secondary p-4 space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between border-b border-[#26382E] pb-2">
                <span className="text-[#A8B8AE]">Depotname</span>
                <span className="font-bold text-[#F4F7F3]">
                  {portfolioName.trim() || 'Mein Übungsdepot'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#26382E] pb-2">
                <span className="text-[#A8B8AE]">Startguthaben</span>
                <span className="font-mono font-bold tabular-nums depot-text-lime">
                  {formatEuro(selectedCash, 2)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#26382E] pb-2">
                <span className="text-[#A8B8AE]">Basiswährung</span>
                <span className="font-mono font-semibold text-[#F4F7F3]">EUR</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#A8B8AE]">Datenmodus</span>
                <span className="font-medium text-[#F4F7F3] text-right">
                  {providerStatus.statusLabel}
                </span>
              </div>
            </div>

            {/* Concise Risk Note */}
            <div className="rounded-xl border border-[#26382E] bg-[#0D1812] p-3.5 flex items-start gap-2.5 text-xs text-[#A8B8AE]">
              <ShieldAlert
                className="h-4 w-4 depot-text-lime shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="leading-relaxed">
                <strong className="font-semibold text-[#F4F7F3]">
                  Nur zu Bildungszwecken – keine Anlageberatung.
                </strong>{' '}
                Alle Transaktionen sind Simulationen. Echte Geldanlagen können im Wert schwanken.
              </p>
            </div>

            {/* Expandable "Was sollte ich wissen?" */}
            <div className="border-t border-[#26382E] pt-3">
              <button
                type="button"
                onClick={() => setShowRulesInfo((v) => !v)}
                aria-expanded={showRulesInfo}
                className="flex w-full min-h-[40px] items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#A8B8AE] hover:text-[#F4F7F3] depot-focus"
              >
                <span className="inline-flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 depot-text-lime" aria-hidden="true" />
                  <span>Was sollte ich wissen?</span>
                </span>
                {showRulesInfo ? (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                )}
              </button>

              {showRulesInfo && (
                <ul className="mt-2.5 space-y-2 rounded-xl border border-[#26382E] bg-[#0D1812] p-3.5 text-xs text-[#A8B8AE] leading-relaxed">
                  <li>
                    <strong className="text-[#F4F7F3]">Kursschwankungen sind normal:</strong>{' '}
                    Zwischenzeitliche Rückgänge gehören an der Börse dazu.
                  </li>
                  <li>
                    <strong className="text-[#F4F7F3]">Streuung schützt:</strong>{' '}
                    Einzelne Aktien schwanken meist stärker als breit gestreute Welt-ETFs.
                  </li>
                  <li>
                    <strong className="text-[#F4F7F3]">Feste Beispieldaten:</strong>{' '}
                    Ohne Live-Anbindung nutzt das Depot stabile Referenzkurse ({providerStatus.statusLabel}).
                  </li>
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#26382E]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3)}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm depot-btn-secondary depot-focus"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Zurück</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex min-h-[44px] items-center px-2 py-2 text-xs font-semibold text-[#A8B8AE] hover:text-[#F4F7F3] depot-focus rounded-lg"
            >
              Überspringen →
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(3, s + 1) as 1 | 2 | 3)}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm depot-btn-primary depot-focus"
            >
              <span>Weiter</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              data-testid="depot-create-confirm-btn"
              onClick={handleComplete}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 px-6 py-2.5 text-sm depot-btn-primary depot-focus"
            >
              <span>Übungsdepot starten</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
