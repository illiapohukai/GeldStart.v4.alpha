import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  DEMO_STATUS_LABEL,
  getDemoHistoricalSeries,
  searchDemoInstruments,
} from './src/lib/market-demo-adapter';
import {
  getCuratedAssetByIdentifier,
  sharedQuoteCoordinator,
} from './src/lib/market-providers';
import type {
  ExchangeRateQuote,
  HistoricalRange,
  MarketDataStatus,
  ProviderStatusInfo,
  SharedQuoteCache,
} from './src/lib/market-types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

export const PROTOTYPE_MARKET_NOTICE =
  'Kursstand: letzter verfügbarer Börsenkurs. Die Kurse sind nicht zwingend in Echtzeit und dienen ausschließlich der Simulation.';

function buildProviderStatusFromCache(
  cache: SharedQuoteCache,
): ProviderStatusInfo {
  const nonCashQuotes = cache.quoteList.filter((q) => q.assetId !== 'EUR-CASH');
  const hasLiveOrDelayed = nonCashQuotes.some(
    (q) => q.status === 'available' || q.status === 'delayed',
  );
  const hasStale = nonCashQuotes.some((q) => q.status === 'stale');
  const hasFallback = nonCashQuotes.some((q) => q.status === 'fallback');

  const allFallback =
    nonCashQuotes.length > 0 &&
    nonCashQuotes.every((q) => q.status === 'fallback');

  const defaultStatus: MarketDataStatus = allFallback
    ? 'fallback'
    : hasStale && !hasLiveOrDelayed
      ? 'stale'
      : 'delayed';

  return {
    mode: allFallback ? 'demo' : 'live_provider',
    configured: !allFallback,
    providerName: allFallback
      ? DEMO_STATUS_LABEL
      : 'Prototyp-Kursdaten (Nasdaq / Börse Frankfurt / Frankfurter)',
    defaultStatus,
    statusLabel: allFallback ? DEMO_STATUS_LABEL : PROTOTYPE_MARKET_NOTICE,
    disclaimerLabel:
      'Virtuelles Übungsdepot – keine echten Käufe. Nur zu Bildungszwecken, keine Anlageberatung.',
    lastCheckedAt: cache.fetchedAt,
    fxRateUsdToEur: cache.fxRateUsdToEur,
    fxReferenceDate: cache.fxReferenceDate,
    hasStaleQuotes: hasStale,
    hasFallbackQuotes: hasFallback,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Shared Daily Catalogue Quotes Endpoint (One Shared Refresh for All Users)
  app.get('/api/market/quotes', async (_req, res) => {
    try {
      const cache = await sharedQuoteCoordinator.getSharedQuotes();
      const providerStatus = buildProviderStatusFromCache(cache);
      res.json({
        quotes: cache.quotes,
        quoteList: cache.quoteList,
        records: cache.records,
        fxRateUsdToEur: cache.fxRateUsdToEur,
        fxReferenceDate: cache.fxReferenceDate,
        fxStatus: cache.fxStatus,
        fetchedAt: cache.fetchedAt,
        cacheDateKey: cache.cacheDateKey,
        providerStatus,
      });
    } catch {
      res.status(502).json({
        error: 'Marktdaten-Cache konnte nicht geladen werden.',
      });
    }
  });

  // 2. Provider Status Endpoint
  app.get('/api/market/status', async (_req, res) => {
    try {
      const cache = await sharedQuoteCoordinator.getSharedQuotes();
      res.json(buildProviderStatusFromCache(cache));
    } catch {
      const fallbackPayload: ProviderStatusInfo = {
        mode: 'demo',
        configured: false,
        providerName: DEMO_STATUS_LABEL,
        defaultStatus: 'fallback',
        statusLabel: DEMO_STATUS_LABEL,
        disclaimerLabel:
          'Virtuelles Übungsdepot – keine echten Käufe. Nur zu Bildungszwecken.',
        lastCheckedAt: new Date().toISOString(),
      };
      res.json(fallbackPayload);
    }
  });

  // 3. Curated Instrument Search Endpoint (No unrestricted external directory search)
  app.get('/api/market/search', (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const filter =
      typeof req.query.type === 'string'
        ? (req.query.type as
            | 'ALL'
            | 'ETF'
            | 'Aktie'
            | 'Anleihen-ETF'
            | 'Rohstoff-ETC')
        : 'ALL';
    const instruments = searchDemoInstruments(q, filter);
    res.json({ instruments });
  });

  // 4. Single Curated Quote Endpoint (Served from the shared daily cache)
  app.get('/api/market/quote', async (req, res) => {
    const symbol =
      typeof req.query.symbol === 'string'
        ? req.query.symbol.trim().toUpperCase()
        : '';
    if (!symbol) {
      res.status(400).json({ error: 'Missing symbol parameter' });
      return;
    }

    const curatedAsset = getCuratedAssetByIdentifier(symbol);
    if (!curatedAsset) {
      res.status(404).json({
        error: `Symbol „${symbol}“ ist nicht Teil des kuratierten Bildungskatalogs.`,
      });
      return;
    }

    try {
      const cache = await sharedQuoteCoordinator.getSharedQuotes();
      const quote =
        cache.quotes[curatedAsset.id.toUpperCase()] ??
        (curatedAsset.symbol
          ? cache.quotes[curatedAsset.symbol.toUpperCase()]
          : undefined);

      if (!quote) {
        res.status(404).json({ error: 'Quote not found in shared cache' });
        return;
      }

      res.json(quote);
    } catch {
      res.status(502).json({ error: 'Shared market cache unavailable' });
    }
  });

  // 5. Historical Series Endpoint (Anchored to cached quote)
  app.get('/api/market/history', async (req, res) => {
    const symbol =
      typeof req.query.symbol === 'string'
        ? req.query.symbol.trim().toUpperCase()
        : '';
    const range: HistoricalRange =
      req.query.range === '1M' ||
      req.query.range === '6M' ||
      req.query.range === '1Y'
        ? req.query.range
        : '1Y';

    const curatedAsset = getCuratedAssetByIdentifier(symbol);
    if (!curatedAsset) {
      res.status(404).json({ error: 'Symbol not in curated catalogue' });
      return;
    }

    const cache = await sharedQuoteCoordinator.getSharedQuotes();
    const quote = cache.quotes[curatedAsset.id.toUpperCase()];
    const series = getDemoHistoricalSeries(
      curatedAsset.id,
      range,
      quote?.price,
    );
    if (!series) {
      res.status(404).json({ error: 'No historical series available' });
      return;
    }

    res.json({
      ...series,
      status: quote?.status ?? 'fallback',
      isDemo: quote?.status === 'fallback',
    });
  });

  // 6. Exchange Rate Endpoint (Served from the shared daily cache)
  app.get('/api/market/fx', async (req, res) => {
    const from = req.query.from === 'USD' ? 'USD' : 'EUR';
    const to = req.query.to === 'USD' ? 'USD' : 'EUR';

    try {
      const cache = await sharedQuoteCoordinator.getSharedQuotes();
      const rate =
        from === to
          ? 1
          : from === 'USD' && to === 'EUR'
            ? cache.fxRateUsdToEur
            : Math.round((1 / cache.fxRateUsdToEur) * 10000) / 10000;

      const fx: ExchangeRateQuote = {
        from,
        to,
        rate,
        date: cache.fxReferenceDate,
        timestamp: cache.fetchedAt,
        source:
          cache.fxStatus === 'fallback'
            ? DEMO_STATUS_LABEL
            : 'Frankfurter EZB-Referenzkurs (USD/EUR)',
        status: cache.fxStatus,
        isDemo: cache.fxStatus === 'fallback',
      };
      res.json(fx);
    } catch {
      res.status(502).json({ error: 'FX cache unavailable' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Geldstart server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
