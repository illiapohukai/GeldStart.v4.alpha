/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BASIC_ALLOWANCE_REFERENCE_POINTS,
  calculateBasicAllowance,
  calculateBudgetSplit,
  calculateCareerStarterBonus,
  calculateChildAllowance,
  calculateCompoundInterest,
  calculateEffectiveAnnualCostRate,
  calculateInflationPurchasingPower,
  calculateRetirementProjection,
} from '../lib/calculator';
import {
  calculatePortfolioMarketValueEur,
  calculatePositionValueEur,
  calculateTotalPerformanceEur,
  calculateTotalPortfolioValueEur,
  calculateUnrealizedProfitLossEur,
  calculateUnrealizedReturnPercent,
  executeVirtualBuy,
  executeVirtualSell,
  previewVirtualBuy,
  previewVirtualSell,
} from '../lib/depot-calculations';
import {
  createUninitializedDepotState,
  DEFAULT_INITIAL_CAPITAL_EUR,
  initializeVirtualPortfolio,
  STARTING_CASH_PRESETS,
  sanitizeDepotState,
} from '../lib/depot-storage';
import {
  ALTERSVORSORGEDEPOT_PROVIDERS,
  ANONYMIZED_PROVIDER_EXAMPLES,
  BONUS_LESSONS,
  CORE_LESSONS,
  getLessonById,
  getLessonByRoute,
  getNextLesson,
  LESSONS,
  STATE_SUPPORT_PROGRAMS,
} from '../lib/lessons';
import {
  buildFallbackMarketQuote,
  CURATED_MARKET_ASSETS,
  DEMO_INSTRUMENTS,
  getDemoQuote,
  getSourceQualifiedAssetKey,
  getUnlockedAssetIds,
  isAssetUnlocked,
} from '../lib/market-demo-adapter';
import {
  fetchBoerseFrankfurtPrototypeQuote,
  fetchFrankfurterUsdToEurRate,
  fetchNasdaqPrototypeQuote,
  InMemoryMarketPriceRepository,
  parseBoerseFrankfurtSseEvent,
  parseNasdaqPrice,
  parseNasdaqQuotePayload,
  SharedDailyQuoteCoordinator,
} from '../lib/market-providers';
import {
  FALLBACK_QUOTE_NOTICE,
  formatMarketDataStatusBadge,
  formatStaleQuoteNotice,
  MARKET_DATA_SIMULATION_NOTICE,
  VIRTUAL_DEPOT_NOTICE,
} from '../lib/market-service';
import type { MarketAsset, MarketQuote } from '../lib/market-types';
import { computeProgressStats } from '../lib/progress-context';
import {
  createInitialProgressState,
  dismissOnboardingState,
  getLessonResumeInfo,
  markLessonCompletedState,
  markLessonOpenedState,
  recordQuizResultState,
  recordStepAnswerState,
  sanitizeProgressState,
  saveLessonStepState,
} from '../lib/storage';
import { resolveViteBasePath } from '../../vite.config';

describe('Compound Interest & Inflation Calculator (Pure Math)', () => {
  it('computes zero-return savings accurately without compounding errors', () => {
    const res = calculateCompoundInterest({
      initialAmount: 500,
      monthlyContribution: 50,
      years: 10,
      annualRatePercent: 0,
    });

    assert.equal(res.totalContributions, 500 + 50 * 120);
    assert.equal(res.estimatedFinalValue, 6500);
    assert.equal(res.estimatedGrowth, 0);
    assert.equal(res.yearlyRows.length, 10);
  });

  it('computes positive compound growth with monthly contributions', () => {
    const res = calculateCompoundInterest({
      initialAmount: 0,
      monthlyContribution: 50,
      years: 18,
      annualRatePercent: 6,
    });

    assert.equal(res.totalContributions, 10800);
    assert.ok(res.estimatedFinalValue > 18500 && res.estimatedFinalValue < 20000);
    assert.ok(res.estimatedGrowth > 7500);
    assert.equal(
      Math.round((res.totalContributions + res.estimatedGrowth) * 100),
      Math.round(res.estimatedFinalValue * 100),
    );
  });

  it('clamps negative or out-of-range inputs safely', () => {
    const res = calculateCompoundInterest({
      initialAmount: -1000,
      monthlyContribution: -50,
      years: 0,
      annualRatePercent: -5,
    });

    assert.equal(res.totalContributions, 0);
    assert.equal(res.estimatedFinalValue, 0);
    assert.equal(res.yearlyRows.length, 1);
  });

  it('computes purchasing power erosion under inflation', () => {
    const powerAfter10Years = calculateInflationPurchasingPower(1000, 3, 10);
    assert.ok(powerAfter10Years > 735 && powerAfter10Years < 750);
  });

  it('generates a concise 2-sentence German summary sentence', () => {
    const res = calculateCompoundInterest({
      initialAmount: 100,
      monthlyContribution: 25,
      years: 10,
      annualRatePercent: 5,
    });
    assert.ok(res.summarySentence.includes('Du zahlst insgesamt'));
    assert.ok(res.summarySentence.includes('unverbindlichen Annahme'));
  });

  it('calculates 50/30/20 budget splits accurately', () => {
    const split = calculateBudgetSplit(400, 50, 30, 20);
    assert.equal(split.needsAmount, 200);
    assert.equal(split.wantsAmount, 120);
    assert.equal(split.savingsAmount, 80);
  });
});

describe('Altersvorsorgedepot (2027) Allowance & Retirement Projection Math', () => {
  it('calculates basic allowance (Grundzulage) across all 6 reference points and caps at 540 €', () => {
    assert.equal(calculateBasicAllowance(-50), 0);
    assert.equal(calculateBasicAllowance(0), 0);
    assert.equal(calculateBasicAllowance(120), 60);
    assert.equal(calculateBasicAllowance(300), 150);
    assert.equal(calculateBasicAllowance(360), 180);
    assert.equal(calculateBasicAllowance(600), 240);
    assert.equal(calculateBasicAllowance(1200), 390);
    assert.equal(calculateBasicAllowance(1800), 540);
    assert.equal(calculateBasicAllowance(2400), 540);

    for (const ref of BASIC_ALLOWANCE_REFERENCE_POINTS) {
      assert.equal(calculateBasicAllowance(ref.annualContribution), ref.basicAllowance);
      assert.equal(ref.annualContribution + ref.basicAllowance, ref.totalInvestedPerYear);
    }
  });

  it('calculates child allowance (Kinderzulage) at 1 € per 1 € capped at 300 € per child', () => {
    assert.equal(calculateChildAllowance(1200, 0), 0);
    assert.equal(calculateChildAllowance(200, 1), 200);
    assert.equal(calculateChildAllowance(300, 1), 300);
    assert.equal(calculateChildAllowance(360, 1), 300);
    assert.equal(calculateChildAllowance(1800, 1), 300);
    assert.equal(calculateChildAllowance(300, 2), 600);
  });

  it('calculates one-time career starter bonus (Berufseinsteigerbonus) only under age 25', () => {
    assert.equal(calculateCareerStarterBonus(18, true), 200);
    assert.equal(calculateCareerStarterBonus(24, true), 200);
    assert.equal(calculateCareerStarterBonus(25, true), 0);
    assert.equal(calculateCareerStarterBonus(19, false), 0);
  });

  it('projects retirement components separately and handles edge cases safely', () => {
    const proj = calculateRetirementProjection({
      startAge: 19,
      retirementAge: 67,
      monthlyContribution: 30,
      assumedGrossAnnualReturnPercent: 5,
      estimatedAnnualCostPercent: 0.35,
      eligibleChildren: 0,
      careerStarterBonusEligible: true,
    });

    assert.equal(proj.years, 48);
    assert.equal(proj.annualPersonalContribution, 360);
    assert.equal(proj.annualBasicAllowance, 180);
    assert.equal(proj.personalContributions, 360 * 48);
    assert.equal(proj.basicAllowances, 180 * 48);
    assert.equal(proj.childAllowances, 0);
    assert.equal(proj.careerStarterBonus, 200);
    assert.ok(proj.assumedMarketGrowth > 0);
    assert.ok(proj.estimatedCosts > 0);
    assert.ok(proj.projectedValueBeforeTax > proj.personalContributions + proj.basicAllowances);

    const edge = calculateRetirementProjection({
      startAge: 30,
      retirementAge: 20,
      monthlyContribution: 0,
      assumedGrossAnnualReturnPercent: 0,
      estimatedAnnualCostPercent: 1.5,
      eligibleChildren: -2,
      careerStarterBonusEligible: true,
    });
    assert.equal(edge.years, 0);
    assert.equal(edge.personalContributions, 0);
    assert.equal(edge.basicAllowances, 0);
    assert.equal(edge.careerStarterBonus, 0);
    assert.equal(edge.projectedValueBeforeTax, 0);

    const costAt2000 = calculateEffectiveAnnualCostRate(2000, 12, 0.35);
    assert.equal(costAt2000.fixedFeePercentOfPortfolio, 0.6);
    assert.equal(costAt2000.totalEffectiveCostPercent, 0.95);
    assert.equal(costAt2000.totalAnnualCostEur, 19);
  });
});

describe('Step-Based Lesson Architecture, State Support & Provider Overview', () => {
  it('exposes 6 core modules in order 1..6 and 1 bonus module', () => {
    assert.equal(CORE_LESSONS.length, 6);
    assert.equal(BONUS_LESSONS.length, 1);
    assert.equal(LESSONS.length, 7);
    assert.deepEqual(
      CORE_LESSONS.map((l) => l.order),
      [1, 2, 3, 4, 5, 6],
    );
  });

  it('ensures every lesson has a valid step sequence ending with a completion step', () => {
    for (const lesson of LESSONS) {
      assert.ok(
        lesson.steps.length >= 6 && lesson.steps.length <= 12,
        `Lesson ${lesson.id} should have 6-12 steps, got ${lesson.steps.length}`,
      );
      assert.equal(lesson.steps[0]?.type, 'intro');
      assert.equal(lesson.steps[lesson.steps.length - 1]?.type, 'completion');

      const hasInteractiveOrChoice = lesson.steps.some(
        (s) =>
          s.type === 'question' ||
          s.type === 'scenario' ||
          s.type === 'visual_choice' ||
          s.type === 'interactive',
      );
      assert.ok(hasInteractiveOrChoice, `Lesson ${lesson.id} must have interactive/question steps`);
    }
  });

  it('separates Altersvorsorgedepot (available-soon), Riester (legacy), and Frühstart-Rente (planned)', () => {
    const depot = STATE_SUPPORT_PROGRAMS.find((p) => p.id === 'altersvorsorgedepot-2027');
    const riester = STATE_SUPPORT_PROGRAMS.find((p) => p.id === 'riester');
    const fruehstart = STATE_SUPPORT_PROGRAMS.find((p) => p.id === 'fruehstart-rente');

    assert.ok(depot);
    assert.equal(depot.status, 'available-soon');
    assert.ok(riester);
    assert.equal(riester.status, 'legacy');
    assert.ok(fruehstart);
    assert.equal(fruehstart.status, 'planned');

    for (const prog of STATE_SUPPORT_PROGRAMS) {
      assert.equal(prog.standNote, 'Rechts- und Informationsstand: November 2026');
    }
  });

  it('provides 11 alphabetically sorted providers and 5 anonymized educational examples with sources', () => {
    assert.equal(ALTERSVORSORGEDEPOT_PROVIDERS.length, 11);
    const names = ALTERSVORSORGEDEPOT_PROVIDERS.map((p) => p.providerName);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, 'de'));
    assert.deepEqual(names, sorted);

    for (const provider of ALTERSVORSORGEDEPOT_PROVIDERS) {
      assert.equal(provider.informationDate, 'November 2026');
      assert.ok(provider.sources.length >= 1);
    }

    assert.equal(ANONYMIZED_PROVIDER_EXAMPLES.length, 5);
    for (const example of ANONYMIZED_PROVIDER_EXAMPLES) {
      assert.ok(example.internalSources.length >= 1);
    }
  });

  it('resolves routes and next-lesson pointers accurately', () => {
    const first = getLessonByRoute('/grundlagen');
    assert.ok(first);
    assert.equal(first.id, 'grundlagen');

    const second = getNextLesson('grundlagen');
    assert.ok(second);
    assert.equal(second.id, 'zinseszins');

    const bonus = getNextLesson('staat');
    assert.ok(bonus);
    assert.equal(bonus.id, 'taschengeld');

    const afterBonus = getNextLesson('taschengeld');
    assert.equal(afterBonus, null);
    assert.equal(getLessonById('unknown-id'), undefined);
  });
});

describe('Step-Level Learning Progress State & v1->v2 Migration', () => {
  it('tracks opened, step index, step answers, and completed lessons immutably', () => {
    let state = createInitialProgressState();
    assert.equal(state.onboardingDismissed, false);

    state = markLessonOpenedState(state, 'grundlagen');
    assert.deepEqual(state.openedLessons, ['grundlagen']);
    assert.equal(state.lastVisitedLessonId, 'grundlagen');
    assert.equal(state.onboardingDismissed, true);

    state = saveLessonStepState(state, 'grundlagen', 3, 'grundlagen-3-check1');
    const resumeInfo = getLessonResumeInfo(state, 'grundlagen');
    assert.equal(resumeInfo.currentStepIndex, 3);
    assert.equal(resumeInfo.displayStepNumber, 4);
    assert.equal(resumeInfo.totalSteps, 9);
    assert.equal(resumeInfo.resumeLabel, 'Grundlagen fortsetzen · Schritt 4 von 9');

    state = recordStepAnswerState(state, 'grundlagen', 'grundlagen-3-check1', 0, false);
    assert.equal(state.stepAnswers['grundlagen:grundlagen-3-check1']?.isCorrect, false);
    assert.equal(state.stepAnswers['grundlagen:grundlagen-3-check1']?.attempts, 1);

    state = recordStepAnswerState(state, 'grundlagen', 'grundlagen-3-check1', 1, true);
    assert.equal(state.stepAnswers['grundlagen:grundlagen-3-check1']?.isCorrect, true);
    assert.equal(state.stepAnswers['grundlagen:grundlagen-3-check1']?.attempts, 2);

    state = markLessonCompletedState(state, 'grundlagen');
    assert.ok(state.completedLessons.includes('grundlagen'));

    const stats = computeProgressStats(state);
    assert.equal(stats.completedCoreCount, 1);
    assert.equal(stats.totalCoreCount, 6);
    assert.equal(stats.recommendedLesson.id, 'zinseszins');
  });

  it('migrates v1 progress state cleanly to v2 without losing completed modules', () => {
    const v1Raw = {
      version: 1,
      openedLessons: ['grundlagen', 'zinseszins'],
      completedLessons: ['grundlagen'],
      quizScores: {
        grundlagen: { score: 3, total: 3, updatedAt: '2026-01-01T00:00:00Z' },
      },
      lastVisitedLessonId: 'zinseszins',
    };

    const migrated = sanitizeProgressState(v1Raw);
    assert.equal(migrated.version, 2);
    assert.deepEqual(migrated.completedLessons, ['grundlagen']);
    assert.equal(migrated.completedSteps.grundlagen?.length, 9);
    assert.equal(migrated.onboardingDismissed, true);

    const stats = computeProgressStats(migrated);
    assert.equal(stats.recommendedLesson.id, 'zinseszins');
  });

  it('sanitizes malformed storage payloads without throwing', () => {
    const sanitized = sanitizeProgressState({
      openedLessons: ['grundlagen', 'fake-module', 123],
      completedLessons: ['zinseszins'],
      lessonStepIndex: { grundlagen: 999, zinseszins: -5 },
      quizScores: {
        zinseszins: { score: 99, total: 3, updatedAt: '2025-01-01' },
      },
      lastVisitedLessonId: 'non-existent',
    });

    assert.deepEqual(sanitized.openedLessons, ['grundlagen']);
    assert.deepEqual(sanitized.completedLessons, ['zinseszins']);
    assert.equal(sanitized.lessonStepIndex.grundlagen, 8);
    assert.equal(sanitized.lessonStepIndex.zinseszins, 0);
    assert.equal(sanitized.quizScores.zinseszins?.score, 3);
    assert.equal(sanitized.lastVisitedLessonId, null);
  });

  it('supports legacy recordQuizResultState and dismissOnboardingState', () => {
    let state = createInitialProgressState();
    state = dismissOnboardingState(state);
    assert.equal(state.onboardingDismissed, true);
    state = recordQuizResultState(state, 'anlageklassen', 2, 3);
    assert.ok(state.completedLessons.includes('anlageklassen'));
    assert.equal(state.quizScores.anlageklassen?.score, 2);
  });
});

describe('Phase 18: Prototype Market Providers, FX, Shared Daily Cache & Virtual Depot Tests', () => {
  // 1. Nasdaq price parsing with $, commas, and whitespace
  it('1. parses Nasdaq prices with $, commas, and whitespace and rejects invalid values', () => {
    assert.equal(parseNasdaqPrice(' $1,234.56 '), 1234.56);
    assert.equal(parseNasdaqPrice('$177.39'), 177.39);
    assert.equal(parseNasdaqPrice('  418.20  '), 418.2);
    assert.equal(parseNasdaqPrice(''), null);
    assert.equal(parseNasdaqPrice('$0.00'), null);
    assert.equal(parseNasdaqPrice('-$15.00'), null);
    assert.equal(parseNasdaqPrice('N/A'), null);

    const parsedPayload = parseNasdaqQuotePayload(
      {
        data: {
          primaryData: {
            lastSalePrice: ' $1,420.50 ',
            lastTradeTimestamp: 'Nov 11, 2026 4:00 PM ET',
          },
        },
      },
      'NVDA',
      '2026-11-11T21:00:00.000Z',
    );
    assert.ok(parsedPayload);
    assert.equal(parsedPayload.price, 1420.5);
    assert.equal(parsedPayload.symbol, 'NVDA');
    assert.ok(parsedPayload.marketTime);
  });

  // 2. Nasdaq failure on HTTP 403/429/non-200
  it('2. fails cleanly on Nasdaq HTTP 403, 429, non-200, or malformed JSON', async () => {
    const nvdaAsset = CURATED_MARKET_ASSETS.find((a) => a.id === 'NVDA')!;
    const fxInfo = {
      rateUsdToEur: 0.92,
      date: '2026-11-11',
      status: 'available' as const,
    };

    await assert.rejects(
      () =>
        fetchNasdaqPrototypeQuote(nvdaAsset, fxInfo, {
          fetchFn: async () => new Response('Forbidden', { status: 403 }),
        }),
      /HTTP 403/,
    );

    await assert.rejects(
      () =>
        fetchNasdaqPrototypeQuote(nvdaAsset, fxInfo, {
          fetchFn: async () => new Response('Too Many Requests', { status: 429 }),
        }),
      /HTTP 429/,
    );

    await assert.rejects(
      () =>
        fetchNasdaqPrototypeQuote(nvdaAsset, fxInfo, {
          fetchFn: async () => new Response('Server Error', { status: 500 }),
        }),
      /HTTP 500/,
    );

    await assert.rejects(
      () =>
        fetchNasdaqPrototypeQuote(nvdaAsset, fxInfo, {
          fetchFn: async () => new Response('{"data": null}', { status: 200 }),
        }),
      /Keine Kursdaten/,
    );
  });

  // 3. Börse Frankfurt SSE parsing
  it('3. parses valid Börse Frankfurt SSE events and cancels stream reader after first quote', async () => {
    const sseBlock = [
      'id: 1',
      'event: message',
      'data: {"isin":"IE00B4L5Y983","lastPrice":113.19,"currency":{"originalValue":"EUR"},"timestampLastPrice":"2026-11-11T17:35:00+01:00"}',
    ].join('\n');

    const parsed = parseBoerseFrankfurtSseEvent(sseBlock);
    assert.ok(parsed);
    assert.equal(parsed.price, 113.19);
    assert.equal(parsed.currency, 'EUR');
    assert.equal(parsed.time, '2026-11-11T17:35:00+01:00');

    let cancelCalled = false;
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(`${sseBlock}\n\n`));
      },
      cancel() {
        cancelCalled = true;
      },
    });

    const eunlAsset = CURATED_MARKET_ASSETS.find((a) => a.id === 'EUNL.DE')!;
    const fxInfo = {
      rateUsdToEur: 0.92,
      date: '2026-11-11',
      status: 'available' as const,
    };
    const quote = await fetchBoerseFrankfurtPrototypeQuote(eunlAsset, fxInfo, {
      fetchFn: async () =>
        new Response(stream, {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        }),
    });

    assert.equal(quote.price, 113.19);
    assert.equal(quote.priceEur, 113.19);
    assert.equal(quote.source, 'boerse-frankfurt-prototype');
    assert.equal(quote.status, 'delayed');
    assert.equal(cancelCalled, true);
  });

  // 4. Börse Frankfurt heartbeat and incomplete event handling
  it('4. ignores Börse Frankfurt heartbeats and incomplete SSE events cleanly', () => {
    const heartbeat = parseBoerseFrankfurtSseEvent(': keep-alive\n');
    assert.equal(heartbeat, null);

    const incompleteJson = parseBoerseFrankfurtSseEvent('data: {"isin":"IE00B4L5Y983"');
    assert.equal(incompleteJson, null);

    const emptyData = parseBoerseFrankfurtSseEvent('event: ping\ndata: {}');
    assert.equal(emptyData, null);
  });

  // 5. Börse Frankfurt percentage-quote rejection
  it('5. rejects percentage-quoted or non-positive Börse Frankfurt prices', () => {
    const pctQuote = parseBoerseFrankfurtSseEvent(
      'data: {"lastPrice":99.85,"tradedInPercent":true,"currency":{"originalValue":"EUR"}}',
    );
    assert.equal(pctQuote, null);

    const pctCurrencyQuote = parseBoerseFrankfurtSseEvent(
      'data: {"lastPrice":99.85,"currency":{"originalValue":"%"}}',
    );
    assert.equal(pctCurrencyQuote, null);

    const zeroQuote = parseBoerseFrankfurtSseEvent(
      'data: {"lastPrice":0,"currency":{"originalValue":"EUR"}}',
    );
    assert.equal(zeroQuote, null);
  });

  // 6. Frankfurter USD-to-EUR conversion
  it('6. fetches Frankfurter USD-to-EUR rate and rejects invalid responses', async () => {
    const liveFx = await fetchFrankfurterUsdToEurRate({
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            amount: 1,
            base: 'USD',
            date: '2026-11-11',
            rates: { EUR: 0.915 },
          }),
          { status: 200 },
        ),
    });
    assert.equal(liveFx.rateUsdToEur, 0.915);
    assert.equal(liveFx.date, '2026-11-11');

    await assert.rejects(
      () =>
        fetchFrankfurterUsdToEurRate({
          fetchFn: async () => new Response('Service Unavailable', { status: 503 }),
        }),
      /HTTP 503/,
    );
  });

  // 7. Source-qualified quote deduplication
  it('7. deduplicates curated assets by source-qualified key', () => {
    const sap = CURATED_MARKET_ASSETS.find((a) => a.id === 'SAP.DE')!;
    const aapl = CURATED_MARKET_ASSETS.find((a) => a.id === 'AAPL')!;
    const cash = CURATED_MARKET_ASSETS.find((a) => a.id === 'EUR-CASH')!;

    assert.equal(getSourceQualifiedAssetKey(sap), 'BF:DE0007164600:XETR');
    assert.equal(getSourceQualifiedAssetKey(aapl), 'NASDAQ:AAPL');
    assert.equal(getSourceQualifiedAssetKey(cash), 'MANUAL:EUR-CASH');
  });

  // 8. Shared daily quote cache behavior & 9. Concurrent request protection during refresh
  it('8 & 9. reuses shared daily quote cache and protects against concurrent duplicate refreshes', async () => {
    let fetchCalls = 0;
    let currentNow = new Date('2026-11-12T10:05:00Z');
    const sampleAssets: MarketAsset[] = [
      CURATED_MARKET_ASSETS.find((a) => a.id === 'EUR-CASH')!,
      CURATED_MARKET_ASSETS.find((a) => a.id === 'EUNL.DE')!,
      CURATED_MARKET_ASSETS.find((a) => a.id === 'AAPL')!,
    ];

    const customFetch: typeof fetch = async (input) => {
      fetchCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 15));
      const url = String(input);
      if (url.includes('frankfurter.dev')) {
        return new Response(
          JSON.stringify({ amount: 1, base: 'USD', date: '2026-11-12', rates: { EUR: 0.92 } }),
          { status: 200 },
        );
      }
      if (url.includes('api.nasdaq.com')) {
        return new Response(
          JSON.stringify({
            data: {
              symbol: 'AAPL',
              companyName: 'Apple Inc.',
              primaryData: {
                lastSalePrice: '$200.00',
                netChange: '+2.00',
                lastTradeTimestamp: 'Nov 12, 2026 4:00 PM ET',
              },
            },
          }),
          { status: 200 },
        );
      }
      // Börse Frankfurt SSE
      const encoder = new TextEncoder();
      const sse =
        'data: {"isin":"IE00B4L5Y983","lastPrice":100,"currency":{"originalValue":"EUR"},"timestampLastPrice":"2026-11-12T10:00:00Z"}\n\n';
      const stream = new ReadableStream<Uint8Array>({
        start(c) {
          c.enqueue(encoder.encode(sse));
          c.close();
        },
      });
      return new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });
    };

    const repo = new InMemoryMarketPriceRepository();
    const coordinator = new SharedDailyQuoteCoordinator({
      fetchFn: customFetch,
      nowFn: () => currentNow,
      repository: repo,
      assets: sampleAssets,
    });

    // Fire 4 concurrent requests on the same day
    const [res1, res2, res3, res4] = await Promise.all([
      coordinator.getSharedQuotes(),
      coordinator.getSharedQuotes(),
      coordinator.getSharedQuotes(),
      coordinator.getSharedQuotes(),
    ]);

    // 1 FX call + 1 Nasdaq call + 1 Börse Frankfurt call = 3 total upstream calls across all 4 concurrent callers
    assert.equal(fetchCalls, 3, 'Upstream fetch should run only once for concurrent requests');
    assert.equal(res1.cacheDateKey, '2026-11-12');
    assert.equal(res2.quotes['EUNL.DE']?.priceEur, 100);
    assert.equal(res3.quotes.AAPL?.priceEur, 184);
    assert.equal(res4.quotes['EUR-CASH']?.priceEur, 1);

    // Subsequent call on the same day should reuse cache without calling fetch again
    currentNow = new Date('2026-11-12T16:00:00Z');
    await coordinator.getSharedQuotes();
    assert.equal(fetchCalls, 3);
  });

  // 10. Stale quote retention when today's refresh fails & 11. Fallback quote labeling when no prior quote exists
  it('10 & 11. retains last successful quote as stale when refresh fails and labels fallback when no prior quote exists', async () => {
    const sampleAssets: MarketAsset[] = [
      CURATED_MARKET_ASSETS.find((a) => a.id === 'EUNL.DE')!,
      CURATED_MARKET_ASSETS.find((a) => a.id === 'SAP.DE')!,
    ];

    let shouldFailAll = false;
    let currentNow = new Date('2026-11-11T18:00:00Z');

    const customFetch: typeof fetch = async (input) => {
      if (shouldFailAll) {
        return new Response('Upstream Error', { status: 503 });
      }
      const url = String(input);
      // Day 1: EUNL.DE succeeds, SAP.DE fails so SAP.DE has no prior quote
      if (url.includes('IE00B4L5Y983')) {
        const encoder = new TextEncoder();
        const sse =
          'data: {"isin":"IE00B4L5Y983","lastPrice":111.5,"currency":{"originalValue":"EUR"},"timestampLastPrice":"2026-11-11T17:30:00Z"}\n\n';
        const stream = new ReadableStream<Uint8Array>({
          start(c) {
            c.enqueue(encoder.encode(sse));
            c.close();
          },
        });
        return new Response(stream, {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        });
      }
      return new Response('Not Found', { status: 500 });
    };

    const repo = new InMemoryMarketPriceRepository();
    const coordinator = new SharedDailyQuoteCoordinator({
      fetchFn: customFetch,
      nowFn: () => currentNow,
      repository: repo,
      assets: sampleAssets,
    });

    // Day 1: EUNL.DE succeeds ('delayed'), SAP.DE has no prior quote -> 'fallback'
    const day1 = await coordinator.getSharedQuotes();
    assert.equal(day1.quotes['EUNL.DE']?.status, 'delayed');
    assert.equal(day1.quotes['EUNL.DE']?.priceEur, 111.5);
    assert.equal(day1.quotes['SAP.DE']?.status, 'fallback');
    assert.equal(day1.quotes['SAP.DE']?.isDemo, true);

    // Day 2: Refresh fails for EUNL.DE -> retained as 'stale' with day 1 price
    shouldFailAll = true;
    currentNow = new Date('2026-11-12T10:00:00Z');
    coordinator.expireCacheForTesting();
    const day2 = await coordinator.getSharedQuotes();
    assert.equal(day2.quotes['EUNL.DE']?.status, 'stale');
    assert.equal(day2.quotes['EUNL.DE']?.priceEur, 111.5);
    assert.equal(day2.quotes['SAP.DE']?.status, 'fallback');

    const staleNotice = formatStaleQuoteNotice('2026-11-11T17:30:00Z');
    assert.ok(staleNotice.includes('Letzter verfügbarer Kurs vom'));
    assert.ok(staleNotice.includes('Die heutige Aktualisierung war nicht möglich.'));

    const fallbackBadge = formatMarketDataStatusBadge('fallback', true);
    assert.equal(fallbackBadge.detailText, FALLBACK_QUOTE_NOTICE);
    assert.ok(VIRTUAL_DEPOT_NOTICE.includes('Virtuelles Übungsdepot – keine echten Käufe.'));
    assert.ok(MARKET_DATA_SIMULATION_NOTICE.includes('Kursstand: letzter verfügbarer Börsenkurs.'));
  });

  // 12. Initial virtual wallet creation with 5,000 EUR
  it('12. initializes virtual portfolio with 5,000.00 EUR starting cash by default', () => {
    const uninit = createUninitializedDepotState();
    assert.equal(uninit.startingCashEur, 5000);
    assert.equal(uninit.initialCapitalEur, 5000);
    assert.equal(uninit.cashEur, 5000);

    const initialized = initializeVirtualPortfolio();
    assert.equal(initialized.startingCashEur, DEFAULT_INITIAL_CAPITAL_EUR);
    assert.equal(initialized.initialCapitalEur, 5000);
    assert.equal(initialized.cashEur, 5000);
    assert.equal(initialized.positions.length, 0);
    assert.equal(initialized.transactions.length, 0);
  });

  // 13. Valid virtual buy & 17. Multiple buys updating weighted average buy price
  it('13 & 17. executes valid virtual buys, records immutable executionPriceEur & quoteFetchedAt, and updates weighted average buy price', () => {
    const initial = initializeVirtualPortfolio({ startingCashEur: 5000 });
    const worldEtf = DEMO_INSTRUMENTS.find((i) => i.symbol === 'EUNL.DE')!;
    const eunlAsset = CURATED_MARKET_ASSETS.find((a) => a.id === 'EUNL.DE')!;
    const quote1: MarketQuote = {
      ...buildFallbackMarketQuote(eunlAsset, '2026-11-11T10:00:00Z'),
      price: 100,
      priceEur: 100,
      status: 'delayed',
      isDemo: false,
      marketTime: '2026-11-11T09:45:00Z',
      fetchedAt: '2026-11-11T10:00:00Z',
    };

    const buy1 = executeVirtualBuy({
      portfolio: initial,
      instrument: worldEtf,
      quote: quote1,
      input: { mode: 'amount_eur', value: 1000 },
    });

    assert.equal(buy1.portfolio.cashEur, 4000);
    assert.equal(buy1.portfolio.positions.length, 1);
    assert.equal(buy1.portfolio.positions[0]?.quantity, 10);
    assert.equal(buy1.portfolio.positions[0]?.averagePurchasePriceEur, 100);
    assert.equal(buy1.portfolio.positions[0]?.averageBuyPriceEur, 100);
    assert.equal(buy1.transaction.executionPriceEur, 100);
    assert.equal(buy1.transaction.quoteFetchedAt, '2026-11-11T10:00:00Z');
    assert.equal(buy1.transaction.tradeType, 'buy');

    // Second buy at 150 EUR
    const quote2: MarketQuote = {
      ...quote1,
      price: 150,
      priceEur: 150,
      fetchedAt: '2026-11-12T10:00:00Z',
    };

    const buy2 = executeVirtualBuy({
      portfolio: buy1.portfolio,
      instrument: worldEtf,
      quote: quote2,
      input: { mode: 'amount_eur', value: 1500 },
    });

    assert.equal(buy2.portfolio.cashEur, 2500);
    assert.equal(buy2.portfolio.positions[0]?.quantity, 20);
    assert.equal(buy2.portfolio.positions[0]?.investedCostBasisEur, 2500);
    assert.equal(buy2.portfolio.positions[0]?.averagePurchasePriceEur, 125);
    assert.equal(buy2.portfolio.positions[0]?.averageBuyPriceEur, 125);
    // Past transaction executionPriceEur remains 100
    assert.equal(buy2.portfolio.transactions[1]?.executionPriceEur, 100);
  });

  // 14. Rejecting buy above available virtual cash & 15. Rejecting zero or negative buy amounts
  it('14 & 15. rejects buys above available virtual cash and rejects zero or negative buy amounts', () => {
    const initial = initializeVirtualPortfolio({ startingCashEur: 5000 });
    const worldEtf = DEMO_INSTRUMENTS.find((i) => i.symbol === 'EUNL.DE')!;
    const quote = getDemoQuote('EUNL.DE')!;

    const tooMuch = previewVirtualBuy({
      portfolio: initial,
      instrument: worldEtf,
      quote,
      input: { mode: 'amount_eur', value: 5000.01 },
    });
    assert.equal(tooMuch.valid, false);
    assert.equal(tooMuch.errorCode, 'INSUFFICIENT_CASH');

    const zeroBuy = previewVirtualBuy({
      portfolio: initial,
      instrument: worldEtf,
      quote,
      input: { mode: 'amount_eur', value: 0 },
    });
    assert.equal(zeroBuy.valid, false);
    assert.equal(zeroBuy.errorCode, 'INVALID_AMOUNT');

    const negativeBuy = previewVirtualBuy({
      portfolio: initial,
      instrument: worldEtf,
      quote,
      input: { mode: 'amount_eur', value: -100 },
    });
    assert.equal(negativeBuy.valid, false);
    assert.equal(negativeBuy.errorCode, 'INVALID_AMOUNT');
  });

  // 16. Rejecting locked assets
  it('16. enforces lesson-based asset unlocking and rejects buying locked assets', () => {
    const starterUnlocked = getUnlockedAssetIds({});
    assert.deepEqual(starterUnlocked, ['EUR-CASH', 'EUNL.DE']);

    const afterGrundlagen = getUnlockedAssetIds({ grundlagen: true });
    assert.ok(afterGrundlagen.includes('VWCE.DE'));
    assert.ok(afterGrundlagen.includes('IEGA.DE'));
    assert.ok(!afterGrundlagen.includes('SAP.DE'));

    const afterAnlageklassen = getUnlockedAssetIds({
      grundlagen: true,
      anlageklassen: true,
    });
    assert.ok(afterAnlageklassen.includes('SAP.DE'));
    assert.ok(afterAnlageklassen.includes('AAPL'));
    assert.ok(!afterAnlageklassen.includes('NVDA'));

    const afterZinseszinsAndAnlageklassen = getUnlockedAssetIds({
      grundlagen: true,
      anlageklassen: true,
      zinseszins: true,
    });
    assert.ok(afterZinseszinsAndAnlageklassen.includes('NVDA'));
    assert.ok(afterZinseszinsAndAnlageklassen.includes('BNTX'));
    assert.ok(afterZinseszinsAndAnlageklassen.includes('ABCL'));

    const initial = initializeVirtualPortfolio({
      startingCashEur: 5000,
      unlockedAssets: ['EUR-CASH', 'EUNL.DE'],
    });
    const nvdaMeta = DEMO_INSTRUMENTS.find((i) => i.symbol === 'NVDA')!;
    const nvdaQuote = getDemoQuote('NVDA')!;

    assert.equal(isAssetUnlocked(nvdaMeta, {}, initial.unlockedAssets), false);

    const lockedPreview = previewVirtualBuy({
      portfolio: initial,
      instrument: nvdaMeta,
      quote: nvdaQuote,
      input: { mode: 'amount_eur', value: 500 },
      completedLessons: {},
      enforceUnlock: true,
    });

    assert.equal(lockedPreview.valid, false);
    assert.equal(lockedPreview.errorCode, 'ASSET_LOCKED');
  });

  // 18. Valid partial sell, 19. Valid full sell removing the position, 20. Rejecting sell above owned quantity
  it('18, 19 & 20. handles valid partial sell, valid full sell removing the position, and rejects overselling', () => {
    const initial = initializeVirtualPortfolio({ startingCashEur: 5000 });
    const worldEtf = DEMO_INSTRUMENTS.find((i) => i.symbol === 'EUNL.DE')!;
    const buyQuote: MarketQuote = {
      ...getDemoQuote('EUNL.DE')!,
      price: 100,
      priceEur: 100,
    };

    const bought = executeVirtualBuy({
      portfolio: initial,
      instrument: worldEtf,
      quote: buyQuote,
      input: { mode: 'amount_eur', value: 2000 },
    }).portfolio;

    const sellQuote: MarketQuote = {
      ...buyQuote,
      price: 120,
      priceEur: 120,
    };

    // 20. Reject overselling (> 20 shares)
    const oversellPreview = previewVirtualSell({
      portfolio: bought,
      symbol: 'EUNL.DE',
      quantityToSell: 25,
      quote: sellQuote,
    });
    assert.equal(oversellPreview.valid, false);
    assert.equal(oversellPreview.errorCode, 'OVERSELLING');

    // 18. Valid partial sell (8 shares at 120 EUR = 960 EUR proceeds)
    const partialSell = executeVirtualSell({
      portfolio: bought,
      symbol: 'EUNL.DE',
      quantityToSell: 8,
      quote: sellQuote,
    });
    assert.equal(partialSell.portfolio.cashEur, 3960);
    assert.equal(partialSell.portfolio.positions.length, 1);
    assert.equal(partialSell.portfolio.positions[0]?.quantity, 12);
    assert.equal(partialSell.portfolio.positions[0]?.investedCostBasisEur, 1200);
    assert.equal(partialSell.transaction.realizedGainLossEur, 160);

    // 19. Valid full sell of remaining 12 shares removes position completely
    const fullSell = executeVirtualSell({
      portfolio: partialSell.portfolio,
      symbol: 'EUNL.DE',
      quantityToSell: 12,
      quote: sellQuote,
    });
    assert.equal(fullSell.portfolio.positions.length, 0);
    assert.equal(fullSell.portfolio.cashEur, 5400);
    assert.equal(fullSell.portfolio.realizedGainLossTotalEur, 400);
    assert.equal(fullSell.portfolio.transactions.length, 3);
  });

  // 21. Portfolio value and profit/loss calculations
  it('21. computes pure portfolio value and profit/loss calculations accurately', () => {
    assert.equal(calculatePositionValueEur(10, 113.19), 1131.9);
    assert.equal(calculateUnrealizedProfitLossEur(1131.9, 1000), 131.9);
    assert.equal(calculateUnrealizedReturnPercent(131.9, 1000), 13.19);

    const marketValue = calculatePortfolioMarketValueEur([
      { quantity: 10, currentPriceEur: 110 },
      { quantity: 5, currentPriceEur: 200 },
    ]);
    assert.equal(marketValue, 2100);

    const totalValue = calculateTotalPortfolioValueEur(3000, marketValue);
    assert.equal(totalValue, 5100);

    const perf = calculateTotalPerformanceEur(totalValue, 5000);
    assert.equal(perf.totalPerformanceEur, 100);
    assert.equal(perf.totalPerformancePercent, 2);
  });

  // 22. Local storage migration and corrupted-state recovery
  it('22. migrates v1 depot state to v2, strips unheld catalogue quotes, and recovers from corrupted state', () => {
    const v1State = {
      version: 1,
      isInitialized: true,
      portfolioName: 'Schul-Depot',
      startingCashEur: 5000,
      cashEur: 4000,
      positions: [
        {
          symbol: 'EUNL.DE',
          name: 'iShares Core MSCI World UCITS ETF',
          assetType: 'ETF',
          quantity: 10,
          averagePurchasePriceEur: 100,
          investedCostBasisEur: 1000,
        },
      ],
      transactions: [
        {
          id: 'tx-1',
          type: 'BUY',
          symbol: 'EUNL.DE',
          quantity: 10,
          priceEur: 100,
          totalAmountEur: 1000,
          priceTimestamp: '2026-11-01T10:00:00Z',
        },
      ],
      lastKnownQuotes: {
        'EUNL.DE': { price: 105, currency: 'EUR', timestamp: '2026-11-01T10:00:00Z' },
        NVDA: { price: 140, currency: 'USD', timestamp: '2026-11-01T10:00:00Z' },
      },
    };

    const migrated = sanitizeDepotState(v1State);
    assert.equal(migrated.version, 2);
    assert.equal(migrated.initialCapitalEur, 5000);
    assert.equal(migrated.cashEur, 4000);
    assert.equal(migrated.positions[0]?.assetId, 'EUNL.DE');
    assert.equal(migrated.positions[0]?.averageBuyPriceEur, 100);
    assert.equal(migrated.transactions[0]?.executionPriceEur, 100);
    assert.ok(migrated.lastKnownQuotes['EUNL.DE']);
    assert.equal(migrated.lastKnownQuotes.NVDA, undefined, 'Should not duplicate unheld catalogue quotes per user');

    const recovered = sanitizeDepotState('corrupted-non-object');
    assert.equal(recovered.startingCashEur, 5000);
    assert.equal(recovered.cashEur, 5000);
    assert.equal(STARTING_CASH_PRESETS.length, 4);
  });
});

describe('GitHub Pages Base Path Resolution', () => {
  it('normalizes root and repository subpaths accurately', () => {
    const origViteBase = process.env.VITE_BASE_PATH;
    const origGhActions = process.env.GITHUB_ACTIONS;
    const origGhRepo = process.env.GITHUB_REPOSITORY;

    try {
      delete process.env.VITE_BASE_PATH;
      delete process.env.GITHUB_ACTIONS;
      delete process.env.GITHUB_REPOSITORY;
      assert.equal(resolveViteBasePath(), '/');

      process.env.VITE_BASE_PATH = 'GeldStart';
      assert.equal(resolveViteBasePath(), '/GeldStart/');

      process.env.VITE_BASE_PATH = '/GeldStart/';
      assert.equal(resolveViteBasePath(), '/GeldStart/');

      delete process.env.VITE_BASE_PATH;
      process.env.GITHUB_ACTIONS = 'true';
      process.env.GITHUB_REPOSITORY = 'owner/GeldStart';
      assert.equal(resolveViteBasePath(), '/GeldStart/');
    } finally {
      if (origViteBase === undefined) delete process.env.VITE_BASE_PATH;
      else process.env.VITE_BASE_PATH = origViteBase;
      if (origGhActions === undefined) delete process.env.GITHUB_ACTIONS;
      else process.env.GITHUB_ACTIONS = origGhActions;
      if (origGhRepo === undefined) delete process.env.GITHUB_REPOSITORY;
      else process.env.GITHUB_REPOSITORY = origGhRepo;
    }
  });
});
