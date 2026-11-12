import type {
  DemoMarketScenario,
  DemoMarketScenarioId,
  ExchangeRateQuote,
  HistoricalPricePoint,
  HistoricalRange,
  HistoricalSeries,
  InstrumentAssetType,
  InstrumentMetadata,
  MarketAsset,
  MarketQuote,
  SupportedCurrency,
} from './market-types';

export const DEMO_STATUS_LABEL =
  'Demowert aus der Ausgangsversion, kein aktueller Börsenkurs.';

export const FALLBACK_PRICE_DATE = '2026-10-23';

export const UNLOCK_NOTIFICATION_TEXT = 'Neue Anlageklasse freigeschaltet';

export const DEMO_SCENARIOS: DemoMarketScenario[] = [
  {
    id: 'baseline',
    label: 'Ausgangskurse (Basis)',
    description: 'Referenz-Beispielkurse ohne zusätzliche Tagesschwankung.',
    educationalTakeaway:
      'Ausgangspunkt deiner Simulation: Vergleiche von hier aus, wie breit gestreute ETFs und einzelne Branchen-Aktien unterschiedlich stark auf Marktereignisse reagieren.',
  },
  {
    id: 'normal_day',
    label: 'Normaler Handelstag (±1,5 %)',
    description: 'Leichte, alltägliche Kursschwankungen in verschiedene Richtungen.',
    educationalTakeaway:
      'An einem normalen Börsentag bewegen sich Kurse oft um 0,5 % bis 2 %. Während einzelne Aktien spürbar ausschlagen, mitteln sich viele Bewegungen in einem Welt-ETF gegenseitig aus.',
  },
  {
    id: 'market_dip',
    label: 'Marktrücksetzer (−4 % bis −10 %)',
    description: 'Simuliert eine unruhige Börsenwoche mit spürbaren Kursrückgängen.',
    educationalTakeaway:
      'In Korrekturphasen fallen fast alle Aktienwerte zeitweise. Hochspekulative Einzelaktien verlieren dabei oft deutlich stärker als breit gestreute Index-ETFs oder Staatsanleihen.',
  },
  {
    id: 'tech_rally',
    label: 'Wachstums- & Tech-Aufschwung (+3 % bis +7 %)',
    description:
      'Freundliches Marktumfeld mit besonderem Rückenwind für Technologie & Gesundheit.',
    educationalTakeaway:
      'In Aufschwungphasen steigen Wachstumsaktien oft überdurchschnittlich. Wer jedoch nur auf eine Branche setzt, trägt beim nächsten Stimmungsumschwung auch das volle Rückschlagsrisiko.',
  },
  {
    id: 'sector_rotation',
    label: 'Branchen-Rotation (Energie/Industrie ↑, Biotech/Tech ↓)',
    description:
      'Gegenläufige Entwicklung zwischen verschiedenen Wirtschaftssektoren.',
    educationalTakeaway:
      'Verschiedene Branchen entwickeln sich selten im Gleichschritt. Ein über mehrere Sektoren und Regionen gestreutes Depot fängt Schwächen einzelner Branchen besser auf.',
  },
];

export interface DemoInstrumentRecord extends InstrumentMetadata {
  basePrice: number;
  previousClose: number;
  /** Scenario multipliers relative to basePrice for deterministic educational testing */
  scenarioMultipliers: Record<DemoMarketScenarioId, number>;
  /** 12 monthly historical close anchor values ending at basePrice */
  monthlyHistoryAnchors: number[];
}

export const DEMO_INSTRUMENTS: DemoInstrumentRecord[] = [
  {
    id: 'EUNL.DE',
    symbol: 'EUNL.DE',
    name: 'iShares Core MSCI World UCITS ETF',
    isin: 'IE00B4L5Y983',
    assetType: 'ETF',
    category: 'etf',
    source: 'boerse-frankfurt-prototype',
    venue: 'XETR',
    exchange: 'XETRA',
    currency: 'EUR',
    quoteCurrency: 'EUR',
    sector: 'Breit gestreut (Welt-Index)',
    region: 'Weltweit (23 Industrieländer)',
    riskCategory: 'Mittel bis hoch',
    riskLabel: 'Mittel bis hoch · Breit gestreuter Basis-ETF',
    unlockedByLesson: undefined,
    unlockReasonLabel: 'Sofort verfügbar als breit gestreutes Basis-Lernwertpapier',
    fallbackPriceEur: 98.4,
    fallbackPriceDate: FALLBACK_PRICE_DATE,
    supportsFractional: true,
    shortExplanation:
      'Börsengehandelter Indexfonds (ETF), der rund 1.400 große und mittlere Unternehmen aus 23 Industrieländern weltweit in einem einzigen Wertpapier bündelt.',
    educationalNotes: [
      'Automatische Streuung über viele Branchen (Technologie, Finanzen, Gesundheit, Industrie, Konsum).',
      'Geringes Einzelunternehmensrisiko, schwankt aber trotzdem mit der allgemeinen Weltwirtschaft.',
      'Typischer Basis-Baustein für langfristige Sparpläne ab 10+ Jahren Anlagehorizont.',
    ],
    basePrice: 98.4,
    previousClose: 97.85,
    scenarioMultipliers: {
      baseline: 1.0,
      normal_day: 1.008,
      market_dip: 0.955,
      tech_rally: 1.032,
      sector_rotation: 1.004,
    },
    monthlyHistoryAnchors: [
      86.2, 87.9, 89.1, 88.4, 90.5, 92.0, 91.2, 93.8, 95.1, 94.6, 96.9, 98.4,
    ],
  },
  {
    id: 'VWCE.DE',
    symbol: 'VWCE.DE',
    name: 'Vanguard FTSE All-World UCITS ETF',
    isin: 'IE00BK5BQT80',
    assetType: 'ETF',
    category: 'etf',
    source: 'boerse-frankfurt-prototype',
    venue: 'XETR',
    exchange: 'XETRA',
    currency: 'EUR',
    quoteCurrency: 'EUR',
    sector: 'Breit gestreut (Welt-Index)',
    region: 'Weltweit (Industrie- & Schwellenländer)',
    riskCategory: 'Mittel bis hoch',
    riskLabel: 'Mittel bis hoch · Weltweiter Aktien-ETF',
    unlockedByLesson: 'grundlagen',
    unlockReasonLabel: 'Freigeschaltet nach Lektion 1 „Grundlagen“',
    fallbackPriceEur: 129.6,
    fallbackPriceDate: FALLBACK_PRICE_DATE,
    supportsFractional: true,
    shortExplanation:
      'Weltweiter Aktien-ETF, der über 3.600 Unternehmen aus Industrie- und Schwellenländern (z. B. USA, Europa, Japan, Indien, China) abbildet.',
    educationalNotes: [
      'Noch breitere Länderstreuung als ein reiner Industrieländer-Index, da Schwellenländer enthalten sind.',
      'Erträge (Dividenden) werden bei dieser thesaurierenden Variante automatisch wieder angelegt (Zinseszins-Effekt).',
      'Kursschwankungen von 20–35 % in weltweiten Krisenjahren sind dennoch normal.',
    ],
    basePrice: 129.6,
    previousClose: 128.9,
    scenarioMultipliers: {
      baseline: 1.0,
      normal_day: 1.007,
      market_dip: 0.958,
      tech_rally: 1.028,
      sector_rotation: 1.006,
    },
    monthlyHistoryAnchors: [
      114.5, 116.0, 117.8, 116.9, 119.4, 121.2, 120.5, 123.1, 125.0, 124.2,
      127.4, 129.6,
    ],
  },
  {
    id: 'IEGA.DE',
    symbol: 'IEGA.DE',
    name: 'iShares Core Euro Government Bond UCITS ETF',
    isin: 'IE00B4WXJJ64',
    assetType: 'Anleihen-ETF',
    category: 'etf',
    source: 'boerse-frankfurt-prototype',
    venue: 'XETR',
    exchange: 'XETRA',
    currency: 'EUR',
    quoteCurrency: 'EUR',
    sector: 'Staatsanleihen Eurozone',
    region: 'Eurozone',
    riskCategory: 'Niedrig bis mittel',
    riskLabel: 'Niedrig bis mittel · Euro-Staatsanleihen-ETF',
    unlockedByLesson: 'grundlagen',
    unlockReasonLabel: 'Freigeschaltet nach Lektion 1 „Grundlagen“',
    fallbackPriceEur: 112.2,
    fallbackPriceDate: FALLBACK_PRICE_DATE,
    supportsFractional: true,
    shortExplanation:
      'Bündelt festverzinsliche Staatsanleihen aus Ländern der Eurozone (z. B. Deutschland, Frankreich, Italien, Spanien). Dient oft als schwankungsärmerer Depotbaustein.',
    educationalNotes: [
      'Geringere Kursschwankungen als reine Aktien-ETFs, dafür langfristig meist niedrigere Renditechancen.',
      'Reagiert empfindlich auf Zinsentscheidungen der Europäischen Zentralbank (EZB).',
      'Zeigt im Übungsdepot gut den Unterschied zwischen Anleihen und Aktien.',
    ],
    basePrice: 112.2,
    previousClose: 112.05,
    scenarioMultipliers: {
      baseline: 1.0,
      normal_day: 1.002,
      market_dip: 1.009,
      tech_rally: 0.996,
      sector_rotation: 1.005,
    },
    monthlyHistoryAnchors: [
      109.8, 110.2, 109.5, 110.4, 111.0, 110.7, 111.3, 111.8, 111.2, 111.9,
      112.0, 112.2,
    ],
  },
  {
    id: '4GLD.DE',
    symbol: '4GLD.DE',
    name: 'Xetra-Gold ETC',
    isin: 'DE000A0S9GB0',
    assetType: 'Rohstoff-ETC',
    category: 'etf',
    source: 'boerse-frankfurt-prototype',
    venue: 'XETR',
    exchange: 'XETRA',
    currency: 'EUR',
    quoteCurrency: 'EUR',
    sector: 'Edelmetalle & Rohstoffe',
    region: 'Global (Rohstoffmarkt)',
    riskCategory: 'Mittel bis hoch',
    riskLabel: 'Mittel bis hoch · Edelmetall-ETC ohne Zinsertrag',
    unlockedByLesson: 'anlageklassen',
    unlockReasonLabel: 'Freigeschaltet nach Lektion 3 „Anlageklassen“',
    fallbackPriceEur: 79.5,
    fallbackPriceDate: FALLBACK_PRICE_DATE,
    supportsFractional: true,
    shortExplanation:
      'Börsengehandeltes Wertpapier, das den Preis für 1 Gramm Gold in Euro abbildet. Zahlt keine Zinsen oder Dividenden.',
    educationalNotes: [
      'Gold erwirtschaftet keinen laufenden Unternehmensgewinn – der Wert hängt allein vom Goldpreis und US-Dollar-Wechselkurs ab.',
      'Wird oft nur als kleine Beimischung (z. B. 5–10 %) genutzt.',
      'Kann sich in Börsenkrisen anders entwickeln als Aktien, schwankt aber ebenfalls deutlich.',
    ],
    basePrice: 79.5,
    previousClose: 78.9,
    scenarioMultipliers: {
      baseline: 1.0,
      normal_day: 1.005,
      market_dip: 1.022,
      tech_rally: 0.991,
      sector_rotation: 1.014,
    },
    monthlyHistoryAnchors: [
      68.4, 69.8, 71.2, 72.5, 71.9, 73.6, 75.0, 74.2, 76.4, 77.8, 78.5, 79.5,
    ],
  },
  {
    id: 'SAP.DE',
    symbol: 'SAP.DE',
    name: 'SAP SE',
    isin: 'DE0007164600',
    assetType: 'Aktie',
    category: 'stock',
    source: 'boerse-frankfurt-prototype',
    venue: 'XETR',
    exchange: 'XETRA',
    currency: 'EUR',
    quoteCurrency: 'EUR',
    sector: 'Technologie & Software',
    region: 'Deutschland / Europa',
    riskCategory: 'Hoch',
    riskLabel: 'Hoch · Einzelaktie Technologie (DAX)',
    unlockedByLesson: 'anlageklassen',
    unlockReasonLabel: 'Freigeschaltet nach Lektion 3 „Anlageklassen“',
    fallbackPriceEur: 214.8,
    fallbackPriceDate: FALLBACK_PRICE_DATE,
    supportsFractional: true,
    shortExplanation:
      'Größter europäischer Softwarekonzern mit Schwerpunkt auf Unternehmens- und Cloud-Software. Einzelaktie aus dem deutschen Leitindex DAX.',
    educationalNotes: [
      'Als Einzelaktie hängt die Entwicklung stark vom Erfolg eines einzelnen Unternehmens ab (Klumpenrisiko).',
      'Im Vergleich zu einem Welt-ETF schwankt eine einzelne Aktie bei Quartalszahlen oft deutlich stärker.',
    ],
    basePrice: 214.8,
    previousClose: 212.4,
    scenarioMultipliers: {
      baseline: 1.0,
      normal_day: 1.014,
      market_dip: 0.935,
      tech_rally: 1.055,
      sector_rotation: 0.968,
    },
    monthlyHistoryAnchors: [
      168.0, 174.5, 179.2, 176.8, 184.0, 191.5, 189.0, 197.4, 203.2, 201.5,
      209.6, 214.8,
    ],
  },
  {
    id: 'SIE.DE',
    symbol: 'SIE.DE',
    name: 'Siemens AG',
    isin: 'DE0007236101',
    assetType: 'Aktie',
    category: 'stock',
    source: 'boerse-frankfurt-prototype',
    venue: 'XETR',
    exchange: 'XETRA',
    currency: 'EUR',
    quoteCurrency: 'EUR',
    sector: 'Industrie & Automatisierung',
    region: 'Deutschland / Europa',
    riskCategory: 'Hoch',
    riskLabel: 'Hoch · Zyklische Industrie-Einzelaktie (DAX)',
    unlockedByLesson: 'anlageklassen',
    unlockReasonLabel: 'Freigeschaltet nach Lektion 3 „Anlageklassen“',
    fallbackPriceEur: 182.3,
    fallbackPriceDate: FALLBACK_PRICE_DATE,
    supportsFractional: true,
    shortExplanation:
      'Internationaler Industriekonzern für Automatisierung, Digitalisierung, Energietechnik und Schienenverkehr.',
    educationalNotes: [
      'Zyklische Industrieaktie: Läuft die Weltkonjunktur gut, profitieren Auftragseingänge; in Wirtschaftsflauten sinkt oft die Nachfrage.',
      'Einzelaktien ersetzen keine breite Grundstreuung.',
    ],
    basePrice: 182.3,
    previousClose: 183.1,
    scenarioMultipliers: {
      baseline: 1.0,
      normal_day: 0.994,
      market_dip: 0.942,
      tech_rally: 1.029,
      sector_rotation: 1.038,
    },
    monthlyHistoryAnchors: [
      162.0, 165.4, 169.8, 167.2, 173.5, 171.0, 175.6, 172.8, 177.9, 179.4,
      184.0, 182.3,
    ],
  },
  {
    id: 'MRK.DE',
    symbol: 'MRK.DE',
    name: 'Merck KGaA',
    isin: 'DE0006599905',
    assetType: 'Aktie',
    category: 'stock',
    source: 'boerse-frankfurt-prototype',
    venue: 'XETR',
    exchange: 'XETRA',
    currency: 'EUR',
    quoteCurrency: 'EUR',
    sector: 'Gesundheit, Labor & Halbleitermaterialien',
    region: 'Deutschland / Europa',
    riskCategory: 'Hoch',
    riskLabel: 'Hoch · Einzelaktie Pharma & Spezialchemie (DAX)',
    unlockedByLesson: 'anlageklassen',
    unlockReasonLabel: 'Freigeschaltet nach Lektion 3 „Anlageklassen“',
    fallbackPriceEur: 144.35,
    fallbackPriceDate: FALLBACK_PRICE_DATE,
    supportsFractional: true,
    shortExplanation:
      'Deutscher Wissenschafts- und Technologiekonzern in den Bereichen Healthcare, Life Science und Electronics (aus dem Zukunftsdepot-Vergleich).',
    educationalNotes: [
      'Obwohl Merck drei Sparten besitzt, bleibt es eine einzelne Unternehmensaktie mit entsprechendem Einzelrisiko.',
      'Forschungsergebnisse und die Nachfrage in der Halbleiterindustrie beeinflussen den Kurs spürbar.',
    ],
    basePrice: 144.35,
    previousClose: 143.5,
    scenarioMultipliers: {
      baseline: 1.0,
      normal_day: 1.006,
      market_dip: 0.945,
      tech_rally: 1.031,
      sector_rotation: 0.992,
    },
    monthlyHistoryAnchors: [
      138.0, 140.2, 139.5, 141.0, 143.8, 142.1, 145.0, 146.4, 144.9, 143.2,
      144.0, 144.35,
    ],
  },
  {
    id: 'KWS.DE',
    symbol: 'KWS.DE',
    name: 'KWS Saat SE & Co. KGaA',
    isin: 'DE0007074007',
    assetType: 'Aktie',
    category: 'stock',
    source: 'boerse-frankfurt-prototype',
    venue: 'XETR',
    exchange: 'XETRA',
    currency: 'EUR',
    quoteCurrency: 'EUR',
    sector: 'Agrar & Ernährung',
    region: 'Deutschland / Europa',
    riskCategory: 'Hoch',
    riskLabel: 'Hoch · Spezialisierte Nebenwerte-Aktie Agrar',
    unlockedByLesson: 'anlageklassen',
    unlockReasonLabel: 'Freigeschaltet nach Lektion 3 „Anlageklassen“',
    fallbackPriceEur: 67.9,
    fallbackPriceDate: FALLBACK_PRICE_DATE,
    supportsFractional: true,
    shortExplanation:
      'Auf Pflanzenzüchtung und Saatgut spezialisiertes Unternehmen aus Deutschland (bekannt aus dem früheren Zukunftsdepot-Vergleich).',
    educationalNotes: [
      'Spezialisierte mittelgroße Einzelaktie (Mid-Cap) aus dem Agrarsektor.',
      'Wetterbedingungen, Agrarpreise und regulatorische Vorgaben beeinflussen das Geschäft direkt.',
    ],
    basePrice: 67.9,
    previousClose: 67.2,
    scenarioMultipliers: {
      baseline: 1.0,
      normal_day: 0.996,
      market_dip: 0.962,
      tech_rally: 1.008,
      sector_rotation: 1.029,
    },
    monthlyHistoryAnchors: [
      58.0, 59.2, 60.1, 61.4, 62.0, 63.2, 64.5, 65.8, 66.4, 67.0, 67.4, 67.9,
    ],
  },
  {
    id: 'AAPL',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    isin: 'US0378331005',
    assetType: 'Aktie',
    category: 'stock',
    source: 'nasdaq-prototype',
    exchange: 'NASDAQ',
    currency: 'USD',
    quoteCurrency: 'USD',
    sector: 'Technologie & Konsumgüter',
    region: 'USA / Nordamerika',
    riskCategory: 'Hoch',
    riskLabel: 'Hoch · Große US-Technologieaktie (Fremdwährung USD)',
    unlockedByLesson: 'anlageklassen',
    unlockReasonLabel: 'Freigeschaltet nach Lektion 3 „Anlageklassen“',
    fallbackPriceEur: 215.4,
    fallbackPriceDate: FALLBACK_PRICE_DATE,
    supportsFractional: true,
    shortExplanation:
      'Weltbekannter US-Hersteller von Smartphones, Computern und digitalen Diensten. Wird an der US-Börse Nasdaq in US-Dollar (USD) gehandelt.',
    educationalNotes: [
      'Bekannte Alltagsmarken sind in großen Welt-ETFs oft schon mit mehreren Prozent Gewicht enthalten.',
      'Durch die Notierung in US-Dollar wirkt sich neben dem Aktienkurs auch der USD/EUR-Wechselkurs auf deinen Euro-Depotwert aus.',
    ],
    basePrice: 233.8,
    previousClose: 231.9,
    scenarioMultipliers: {
      baseline: 1.0,
      normal_day: 1.011,
      market_dip: 0.938,
      tech_rally: 1.045,
      sector_rotation: 0.972,
    },
    monthlyHistoryAnchors: [
      188.0, 192.5, 196.0, 201.4, 208.0, 212.5, 218.0, 221.4, 225.0, 228.5,
      231.0, 233.8,
    ],
  },
  {
    id: 'MSFT',
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    isin: 'US5949181045',
    assetType: 'Aktie',
    category: 'stock',
    source: 'nasdaq-prototype',
    exchange: 'NASDAQ',
    currency: 'USD',
    quoteCurrency: 'USD',
    sector: 'Technologie & Software',
    region: 'USA / Nordamerika',
    riskCategory: 'Hoch',
    riskLabel: 'Hoch · Große US-Softwareaktie (Fremdwährung USD)',
    unlockedByLesson: 'anlageklassen',
    unlockReasonLabel: 'Freigeschaltet nach Lektion 3 „Anlageklassen“',
    fallbackPriceEur: 394.5,
    fallbackPriceDate: FALLBACK_PRICE_DATE,
    supportsFractional: true,
    shortExplanation:
      'Internationaler US-Software- und Cloud-Konzern (Windows, Office, Azure). Handel in US-Dollar an der Nasdaq.',
    educationalNotes: [
      'Wer zusätzlich zu einem MSCI-World-ETF große US-Tech-Aktien kauft, erhöht den Technologie-Anteil im Depot deutlich.',
      'Notiert in USD – Wechselkursschwankungen zwischen US-Dollar und Euro beeinflussen das Ergebnis.',
    ],
    basePrice: 428.1,
    previousClose: 425.0,
    scenarioMultipliers: {
      baseline: 1.0,
      normal_day: 1.009,
      market_dip: 0.941,
      tech_rally: 1.048,
      sector_rotation: 0.969,
    },
    monthlyHistoryAnchors: [
      375.0, 382.0, 389.5, 395.0, 402.0, 408.5, 412.0, 415.8, 419.0, 422.4,
      425.0, 428.1,
    ],
  },
  {
    id: 'ISRG',
    symbol: 'ISRG',
    name: 'Intuitive Surgical Inc.',
    isin: 'US46120E6023',
    assetType: 'Aktie',
    category: 'stock',
    source: 'nasdaq-prototype',
    exchange: 'NASDAQ',
    currency: 'USD',
    quoteCurrency: 'USD',
    sector: 'Medizintechnik & Robotik',
    region: 'USA / Nordamerika',
    riskCategory: 'Hoch',
    riskLabel: 'Hoch · US-Spezialaktie Medizintechnik & Robotik',
    unlockedByLesson: 'anlageklassen',
    unlockReasonLabel: 'Freigeschaltet nach Lektion 3 „Anlageklassen“',
    fallbackPriceEur: 384.45,
    fallbackPriceDate: FALLBACK_PRICE_DATE,
    supportsFractional: true,
    shortExplanation:
      'US-Hersteller von robotergestützten Operationssystemen für Krankenhäuser (bekannt aus dem Zukunftsdepot-Referenzbeispiel). Handel in US-Dollar.',
    educationalNotes: [
      'Verbindet zwei Spezialthemen: Medizintechnik und Robotik.',
      'Wenn ein Depot viele Aktien aus Robotik, Halbleitern und Biotech enthält, entsteht trotz mehrerer Firmen eine thematische Überschneidung.',
    ],
    basePrice: 456.03,
    previousClose: 442.0,
    scenarioMultipliers: {
      baseline: 1.0,
      normal_day: 1.015,
      market_dip: 0.938,
      tech_rally: 1.044,
      sector_rotation: 0.975,
    },
    monthlyHistoryAnchors: [
      382.0, 391.5, 398.0, 405.2, 412.8, 409.4, 421.0, 429.6, 435.1, 441.8,
      448.2, 456.03,
    ],
  },
  {
    id: 'VRTX',
    symbol: 'VRTX',
    name: 'Vertex Pharmaceuticals Inc.',
    isin: 'US92532F1003',
    assetType: 'Aktie',
    category: 'stock',
    source: 'nasdaq-prototype',
    exchange: 'NASDAQ',
    currency: 'USD',
    quoteCurrency: 'USD',
    sector: 'Biotechnologie & Gesundheit',
    region: 'USA / Nordamerika',
    riskCategory: 'Hoch',
    riskLabel: 'Hoch · US-Biotechnologie-Einzelaktie',
    unlockedByLesson: 'anlageklassen',
    unlockReasonLabel: 'Freigeschaltet nach Lektion 3 „Anlageklassen“',
    fallbackPriceEur: 446.25,
    fallbackPriceDate: FALLBACK_PRICE_DATE,
    supportsFractional: true,
    shortExplanation:
      'US-Biotechnologieunternehmen, das Medikamente für schwere genetische Erkrankungen erforscht und vertreibt (Referenzwert aus dem Zukunftsdepot).',
    educationalNotes: [
      'In der Biotechnologie hängen Aktienkurse stark von klinischen Studienergebnissen und Zulassungen ab.',
      'Fehlgeschlagene Studien können selbst bei großen Firmen zu plötzlichen Kursverlusten führen.',
    ],
    basePrice: 478.2,
    previousClose: 454.6,
    scenarioMultipliers: {
      baseline: 1.0,
      normal_day: 1.012,
      market_dip: 0.948,
      tech_rally: 1.036,
      sector_rotation: 0.982,
    },
    monthlyHistoryAnchors: [
      418.0, 425.5, 419.8, 432.0, 441.2, 448.9, 455.0, 462.4, 458.1, 466.5,
      471.0, 478.2,
    ],
  },
  {
    id: 'NEE',
    symbol: 'NEE',
    name: 'NextEra Energy Inc.',
    isin: 'US65339F1012',
    assetType: 'Aktie',
    category: 'stock',
    source: 'nasdaq-prototype',
    exchange: 'NASDAQ',
    currency: 'USD',
    quoteCurrency: 'USD',
    sector: 'Energie & Versorgung',
    region: 'USA / Nordamerika',
    riskCategory: 'Hoch',
    riskLabel: 'Hoch · US-Energieversorger (Zins- & Währungseinfluss)',
    unlockedByLesson: 'anlageklassen',
    unlockReasonLabel: 'Freigeschaltet nach Lektion 3 „Anlageklassen“',
    fallbackPriceEur: 69.89,
    fallbackPriceDate: FALLBACK_PRICE_DATE,
    supportsFractional: true,
    shortExplanation:
      'Großer nordamerikanischer Stromversorger und Betreiber von Wind- und Solarparks (Referenzwert aus dem Zukunftsdepot). Handel in US-Dollar.',
    educationalNotes: [
      'Energieversorger benötigen viel Kapital für Kraftwerke und Netze und reagieren daher spürbar auf steigende oder fallende Zinsen.',
      'Zusätzlicher Wechselkurseinfluss durch Notierung in USD.',
    ],
    basePrice: 81.63,
    previousClose: 80.5,
    scenarioMultipliers: {
      baseline: 1.0,
      normal_day: 1.009,
      market_dip: 0.964,
      tech_rally: 1.012,
      sector_rotation: 1.045,
    },
    monthlyHistoryAnchors: [
      66.5, 68.2, 70.1, 72.4, 74.0, 73.1, 75.8, 77.2, 79.0, 80.4, 80.9, 81.63,
    ],
  },
  {
    id: 'DE',
    symbol: 'DE',
    name: 'Deere & Co.',
    isin: 'US2441991054',
    assetType: 'Aktie',
    category: 'stock',
    source: 'nasdaq-prototype',
    exchange: 'NASDAQ',
    currency: 'USD',
    quoteCurrency: 'USD',
    sector: 'Industrie & Landtechnik',
    region: 'USA / Global',
    riskCategory: 'Hoch',
    riskLabel: 'Hoch · Zyklische US-Industrie- & Agrartechnik-Aktie',
    unlockedByLesson: 'anlageklassen',
    unlockReasonLabel: 'Freigeschaltet nach Lektion 3 „Anlageklassen“',
    fallbackPriceEur: 563.2,
    fallbackPriceDate: FALLBACK_PRICE_DATE,
    supportsFractional: true,
    shortExplanation:
      'Weltweit führender US-Hersteller von Land-, Forst- und Baumaschinen (bekannt unter der Marke John Deere, aus dem Zukunftsdepot-Vergleich).',
    educationalNotes: [
      'Konjunktur- und rohstoffabhängiges Geschäftsmodell: Investitionsbereitschaft von Landwirten schwankt mit Erntepreisen und Kreditzinsen.',
      'Als US-Einzelaktie sowohl vom Unternehmensverlauf als auch vom USD/EUR-Kurs abhängig.',
    ],
    basePrice: 611.2,
    previousClose: 605.0,
    scenarioMultipliers: {
      baseline: 1.0,
      normal_day: 1.005,
      market_dip: 0.946,
      tech_rally: 1.018,
      sector_rotation: 1.034,
    },
    monthlyHistoryAnchors: [
      510.0, 522.0, 535.0, 548.0, 555.0, 562.0, 574.0, 581.0, 590.0, 598.0,
      605.0, 611.2,
    ],
  },
  {
    id: 'NVDA',
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    isin: 'US67066G1040',
    assetType: 'Aktie',
    category: 'stock',
    source: 'nasdaq-prototype',
    exchange: 'NASDAQ',
    currency: 'USD',
    quoteCurrency: 'USD',
    sector: 'Technologie & Halbleiter',
    region: 'USA / Nordamerika',
    riskCategory: 'Sehr hoch',
    riskLabel: 'Sehr hoch · Stark schwankende Halbleiter-Wachstumsaktie',
    unlockedByLesson: 'zinseszins',
    unlockReasonLabel:
      'Freigeschaltet nach Lektion 2 „Zinseszins“ & Schwankungsrisiko-Inhalten',
    fallbackPriceEur: 127.72,
    fallbackPriceDate: FALLBACK_PRICE_DATE,
    supportsFractional: true,
    shortExplanation:
      'US-Entwickler von Grafikprozessoren und Chipsystemen für Rechenzentren und Künstliche Intelligenz. Notiert in US-Dollar (USD).',
    educationalNotes: [
      'Sehr hohe Schwankungsbreite (Volatilität): Nach starken Kursanstiegen kam es in der Vergangenheit mehrfach zu Rücksetzern von 30–50 %.',
      'Währungsrisiko: Da die Aktie in USD gehandelt wird, beeinflusst auch der EUR/USD-Wechselkurs deinen Depotwert in Euro.',
    ],
    basePrice: 138.6,
    previousClose: 135.2,
    scenarioMultipliers: {
      baseline: 1.0,
      normal_day: 1.021,
      market_dip: 0.902,
      tech_rally: 1.068,
      sector_rotation: 0.945,
    },
    monthlyHistoryAnchors: [
      92.4, 98.0, 106.5, 102.1, 114.8, 123.5, 118.2, 126.9, 121.4, 130.8, 134.9,
      138.6,
    ],
  },
  {
    id: 'BNTX',
    symbol: 'BNTX',
    name: 'BioNTech SE (ADR)',
    isin: 'US09075V1026',
    assetType: 'Aktie',
    category: 'stock',
    source: 'nasdaq-prototype',
    exchange: 'NASDAQ',
    currency: 'USD',
    quoteCurrency: 'USD',
    sector: 'Biotechnologie & Gesundheit',
    region: 'Deutschland / Handel USA',
    riskCategory: 'Sehr hoch',
    riskLabel: 'Sehr hoch · Stark schwankende Forschungs- & Biotech-Aktie',
    unlockedByLesson: 'zinseszins',
    unlockReasonLabel:
      'Freigeschaltet nach Lektion 2 „Zinseszins“ & Schwankungsrisiko-Inhalten',
    fallbackPriceEur: 78.6,
    fallbackPriceDate: FALLBACK_PRICE_DATE,
    supportsFractional: true,
    shortExplanation:
      'Mainzer Biotechnologieunternehmen mit Schwerpunkt auf mRNA-Forschung und Onkologie (an der US-Börse Nasdaq in USD gehandelt, aus dem Zukunftsdepot-Vergleich).',
    educationalNotes: [
      'Biotech-Unternehmen investieren hohe Summen in langjährige klinische Studien, deren Ausgang ungewiss ist.',
      'Hohe Kursausschläge nach Studiendaten sind typisch.',
    ],
    basePrice: 85.3,
    previousClose: 84.1,
    scenarioMultipliers: {
      baseline: 1.0,
      normal_day: 0.985,
      market_dip: 0.895,
      tech_rally: 1.049,
      sector_rotation: 0.935,
    },
    monthlyHistoryAnchors: [
      91.0, 89.5, 88.0, 86.4, 85.0, 87.2, 86.0, 84.5, 83.8, 84.9, 84.1, 85.3,
    ],
  },
  {
    id: 'ABCL',
    symbol: 'ABCL',
    name: 'AbCellera Biologics Inc.',
    isin: 'CA00288U1066',
    assetType: 'Aktie',
    category: 'stock',
    source: 'nasdaq-prototype',
    exchange: 'NASDAQ',
    currency: 'USD',
    quoteCurrency: 'USD',
    sector: 'Biotechnologie & Gesundheit',
    region: 'Nordamerika',
    riskCategory: 'Sehr hoch',
    riskLabel: 'Sehr hoch · Hochspekulative Biotech-Einzelaktie',
    unlockedByLesson: 'zinseszins',
    unlockReasonLabel:
      'Freigeschaltet nach Lektion 2 „Zinseszins“ & Schwankungsrisiko-Inhalten',
    fallbackPriceEur: 10.52,
    fallbackPriceDate: FALLBACK_PRICE_DATE,
    supportsFractional: true,
    shortExplanation:
      'Spezialisiertes Biotechnologie-Unternehmen für Antikörper-Forschung (im früheren Zukunftsdepot-Bericht als stark schwankender Einzelwert aufgefallen).',
    educationalNotes: [
      'Lehrbeispiel für hohes Einzelaktien-Risiko: Junge Forschungsunternehmen ohne stabile Gewinne können innerhalb weniger Tage zweistellig im Kurs fallen.',
      'Zeigt deutlich, warum eine einzelne Forschungsaktie viel riskanter ist als ein breit gestreuter ETF.',
    ],
    basePrice: 3.12,
    previousClose: 3.48,
    scenarioMultipliers: {
      baseline: 1.0,
      normal_day: 0.972,
      market_dip: 0.875,
      tech_rally: 1.052,
      sector_rotation: 0.912,
    },
    monthlyHistoryAnchors: [
      5.1, 4.85, 4.6, 4.35, 4.1, 3.95, 3.8, 3.65, 3.55, 3.42, 3.3, 3.12,
    ],
  },
];

export const VIRTUAL_CASH_ASSET: MarketAsset = {
  id: 'EUR-CASH',
  name: 'Virtuelles Bargeld (EUR)',
  assetType: 'cash',
  source: 'manual-demo',
  symbol: 'EUR-CASH',
  quoteCurrency: 'EUR',
  riskLabel: 'Niedrig · Unverzinste virtuelle Barreserve',
  unlockedByLesson: undefined,
  fallbackPriceEur: 1,
  fallbackPriceDate: FALLBACK_PRICE_DATE,
};

export const CURATED_MARKET_ASSETS: MarketAsset[] = [
  VIRTUAL_CASH_ASSET,
  ...DEMO_INSTRUMENTS.map(
    (inst): MarketAsset => ({
      id: inst.id,
      name: inst.name,
      assetType: inst.category,
      source: inst.source,
      symbol: inst.symbol,
      isin: inst.isin,
      venue: inst.venue,
      quoteCurrency: inst.quoteCurrency,
      riskLabel: inst.riskLabel,
      unlockedByLesson: inst.unlockedByLesson,
      fallbackPriceEur: inst.fallbackPriceEur,
      fallbackPriceDate: inst.fallbackPriceDate,
    }),
  ),
];

/**
 * Source-qualified quote key (adapted from Lovable market.ts `quoteKey`)
 * Prevents ticker collisions across trading venues and deduplicates refreshes.
 */
export function getSourceQualifiedAssetKey(asset: MarketAsset): string {
  if (asset.source === 'boerse-frankfurt-prototype') {
    return `BF:${asset.isin ?? asset.id}:${asset.venue ?? 'XETR'}`;
  }
  if (asset.source === 'nasdaq-prototype') {
    return `NASDAQ:${(asset.symbol ?? asset.id).toUpperCase()}`;
  }
  return `MANUAL:${asset.id.toUpperCase()}`;
}

export function getLessonUnlockTitle(lessonId?: string): string {
  switch (lessonId) {
    case 'grundlagen':
      return 'Modul 1: Grundlagen';
    case 'zinseszins':
      return 'Modul 2: Zinseszins & Schwankungsrisiko';
    case 'anlageklassen':
      return 'Modul 3: Anlageklassen';
    default:
      return 'Sofort freigeschaltet';
  }
}

/**
 * Determines which curated assets are unlocked given completed lessons and any persisted unlocked asset IDs.
 * Rules (Phase 15):
 * - Virtual cash ('EUR-CASH') and one simple diversified learning asset ('EUNL.DE') available immediately;
 * - Additional broad ETFs ('VWCE.DE', 'IEGA.DE') unlocked after 'grundlagen';
 * - ETF/ETC category & established individual stocks unlocked after 'anlageklassen';
 * - Higher-volatility stocks ('NVDA', 'BNTX', 'ABCL') unlocked after 'zinseszins' (and 'anlageklassen').
 */
export function getUnlockedAssetIds(
  completedLessons: string[] | Record<string, boolean> = [],
  persistedUnlockedAssets: string[] = [],
): string[] {
  const lessonIds: string[] = Array.isArray(completedLessons)
    ? completedLessons
    : Object.entries(completedLessons)
        .filter(([, done]) => Boolean(done))
        .map(([k]) => k);
  const completedSet = new Set(lessonIds.map((id) => id.toLowerCase()));
  const unlocked = new Set<string>([
    'EUR-CASH',
    'EUNL.DE',
    ...persistedUnlockedAssets.map((a) => a.toUpperCase()),
  ]);

  for (const asset of CURATED_MARKET_ASSETS) {
    const upperId = asset.id.toUpperCase();
    if (!asset.unlockedByLesson) {
      unlocked.add(upperId);
      continue;
    }
    const req = asset.unlockedByLesson.toLowerCase();
    if (req === 'grundlagen' && completedSet.has('grundlagen')) {
      unlocked.add(upperId);
    } else if (req === 'anlageklassen' && completedSet.has('anlageklassen')) {
      unlocked.add(upperId);
    } else if (
      req === 'zinseszins' &&
      completedSet.has('zinseszins') &&
      completedSet.has('anlageklassen')
    ) {
      unlocked.add(upperId);
    } else if (completedSet.has(req)) {
      unlocked.add(upperId);
    }
  }

  return Array.from(unlocked);
}

export function isAssetUnlocked(
  assetOrSymbol: Pick<MarketAsset, 'id' | 'symbol' | 'unlockedByLesson'> | string,
  completedLessons: string[] | Record<string, boolean> = [],
  persistedUnlockedAssets: string[] = [],
): boolean {
  const unlockedSet = new Set(
    getUnlockedAssetIds(completedLessons, persistedUnlockedAssets).map((s) =>
      s.toUpperCase(),
    ),
  );
  if (typeof assetOrSymbol === 'string') {
    return unlockedSet.has(assetOrSymbol.trim().toUpperCase());
  }
  const id = (assetOrSymbol.symbol ?? assetOrSymbol.id).trim().toUpperCase();
  if (!assetOrSymbol.unlockedByLesson) return true;
  return unlockedSet.has(id);
}

const DEMO_FX_BASE_USD_TO_EUR: Record<DemoMarketScenarioId, number> = {
  baseline: 0.9215,
  normal_day: 0.923,
  market_dip: 0.928,
  tech_rally: 0.918,
  sector_rotation: 0.9215,
};

let activeDemoScenario: DemoMarketScenarioId = 'baseline';
let lastDemoUpdateIso: string = `${FALLBACK_PRICE_DATE}T15:20:00.000Z`;

export function getActiveDemoScenario(): DemoMarketScenario {
  return (
    DEMO_SCENARIOS.find((s) => s.id === activeDemoScenario) ?? DEMO_SCENARIOS[0]!
  );
}

export function setActiveDemoScenario(
  scenarioId: DemoMarketScenarioId,
  customTimestamp?: string,
): DemoMarketScenario {
  activeDemoScenario = scenarioId;
  lastDemoUpdateIso = customTimestamp ?? new Date().toISOString();
  return getActiveDemoScenario();
}

export function getDemoExchangeRate(
  from: SupportedCurrency,
  to: SupportedCurrency,
): ExchangeRateQuote {
  if (from === to) {
    return {
      from,
      to,
      rate: 1,
      date: FALLBACK_PRICE_DATE,
      timestamp: lastDemoUpdateIso,
      source: `EZB-Referenzkurs-Simulation (${DEMO_STATUS_LABEL})`,
      status: 'fallback',
      isDemo: true,
    };
  }

  const usdToEur = DEMO_FX_BASE_USD_TO_EUR[activeDemoScenario] ?? 0.9215;
  const rate =
    from === 'USD' && to === 'EUR'
      ? usdToEur
      : Math.round((1 / usdToEur) * 10000) / 10000;

  return {
    from,
    to,
    rate,
    date: FALLBACK_PRICE_DATE,
    timestamp: lastDemoUpdateIso,
    source: `EZB-Referenzkurs-Simulation (${DEMO_STATUS_LABEL})`,
    status: 'fallback',
    isDemo: true,
  };
}

export function searchDemoInstruments(
  query: string,
  filterType: InstrumentAssetType | 'ALL' = 'ALL',
): InstrumentMetadata[] {
  const q = query.trim().toLowerCase();
  return DEMO_INSTRUMENTS.filter((item) => {
    if (filterType !== 'ALL' && item.assetType !== filterType) {
      return false;
    }
    if (!q) return true;
    return (
      item.symbol.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.sector.toLowerCase().includes(q) ||
      item.assetType.toLowerCase().includes(q) ||
      (item.isin && item.isin.toLowerCase().includes(q))
    );
  }).map(
    ({
      basePrice: _b,
      previousClose: _p,
      scenarioMultipliers: _s,
      monthlyHistoryAnchors: _m,
      ...meta
    }) => ({
      ...meta,
      unlockRequirementText:
        meta.unlockRequirementText ??
        meta.unlockReasonLabel ??
        getLessonUnlockTitle(meta.unlockedByLesson),
    }),
  );
}

export function getDemoInstrumentMetadata(
  symbol: string,
): InstrumentMetadata | null {
  const normalized = symbol.trim().toUpperCase();
  const found = DEMO_INSTRUMENTS.find(
    (item) =>
      item.symbol.toUpperCase() === normalized ||
      item.id.toUpperCase() === normalized ||
      (item.isin && item.isin.toUpperCase() === normalized),
  );
  if (!found) return null;
  const {
    basePrice: _b,
    previousClose: _p,
    scenarioMultipliers: _s,
    monthlyHistoryAnchors: _m,
    ...meta
  } = found;
  return {
    ...meta,
    unlockRequirementText:
      meta.unlockRequirementText ??
      meta.unlockReasonLabel ??
      getLessonUnlockTitle(meta.unlockedByLesson),
  };
}

export function buildFallbackMarketQuote(
  asset: MarketAsset,
  fetchedAtIso = new Date().toISOString(),
): MarketQuote {
  const inst = DEMO_INSTRUMENTS.find(
    (i) => i.id.toUpperCase() === asset.id.toUpperCase(),
  );
  const fallbackEur = Math.max(
    0.01,
    asset.fallbackPriceEur ?? inst?.fallbackPriceEur ?? inst?.basePrice ?? 1,
  );
  const fallbackDate = asset.fallbackPriceDate ?? FALLBACK_PRICE_DATE;
  const fxRate = asset.quoteCurrency === 'EUR' ? 1 : 0.9215;
  const nativePrice =
    asset.quoteCurrency === 'EUR'
      ? fallbackEur
      : Math.round((fallbackEur / fxRate) * 100) / 100;
  const prevClose = inst?.previousClose ?? nativePrice;
  const changeAbsolute = Math.round((nativePrice - prevClose) * 100) / 100;
  const changePercent =
    prevClose > 0
      ? Math.round(((nativePrice - prevClose) / prevClose) * 10000) / 100
      : 0;

  return {
    assetId: asset.id,
    symbol: asset.symbol ?? asset.id,
    price: nativePrice,
    currency: asset.quoteCurrency,
    priceEur: Math.round(fallbackEur * 100) / 100,
    fxRateToEur: fxRate,
    fxReferenceDate: fallbackDate,
    marketTime: `${fallbackDate}T15:20:00.000Z`,
    fetchedAt: fetchedAtIso,
    source: asset.source,
    status: 'fallback',
    previousClose: prevClose,
    changeAbsolute,
    changePercent,
    exchange: inst?.exchange ?? (asset.venue ?? 'XETRA'),
    timestamp: `${fallbackDate}T15:20:00.000Z`,
    providerName: DEMO_STATUS_LABEL,
    isDemo: true,
    fallbackPriceDate: fallbackDate,
  };
}

export function getDemoQuote(symbol: string): MarketQuote | null {
  const normalized = symbol.trim().toUpperCase();
  const found = DEMO_INSTRUMENTS.find(
    (item) =>
      item.symbol.toUpperCase() === normalized ||
      item.id.toUpperCase() === normalized,
  );
  if (!found) return null;

  const multiplier = found.scenarioMultipliers[activeDemoScenario] ?? 1.0;
  const price = Math.round(found.basePrice * multiplier * 100) / 100;
  const prev =
    activeDemoScenario === 'baseline' ? found.previousClose : found.basePrice;
  const changeAbsolute = Math.round((price - prev) * 100) / 100;
  const changePercent =
    prev > 0 ? Math.round(((price - prev) / prev) * 10000) / 100 : 0;

  const fxRate =
    found.currency === 'EUR'
      ? 1
      : (DEMO_FX_BASE_USD_TO_EUR[activeDemoScenario] ?? 0.9215);
  const priceEur =
    found.currency === 'EUR'
      ? price
      : Math.round(price * fxRate * 100) / 100;

  return {
    assetId: found.id,
    symbol: found.symbol,
    price,
    currency: found.currency,
    priceEur,
    fxRateToEur: fxRate,
    fxReferenceDate: FALLBACK_PRICE_DATE,
    marketTime: lastDemoUpdateIso,
    fetchedAt: lastDemoUpdateIso,
    source: found.source,
    status: 'fallback',
    previousClose: prev,
    changeAbsolute,
    changePercent,
    exchange: found.exchange,
    timestamp: lastDemoUpdateIso,
    providerName: DEMO_STATUS_LABEL,
    isDemo: true,
    fallbackPriceDate: found.fallbackPriceDate,
  };
}

export function getDemoHistoricalSeries(
  symbol: string,
  range: HistoricalRange,
  latestPriceOverride?: number,
): HistoricalSeries | null {
  const normalized = symbol.trim().toUpperCase();
  const found = DEMO_INSTRUMENTS.find(
    (item) =>
      item.symbol.toUpperCase() === normalized ||
      item.id.toUpperCase() === normalized,
  );
  if (!found) return null;

  const quote = getDemoQuote(symbol)!;
  const endPrice =
    typeof latestPriceOverride === 'number' &&
    Number.isFinite(latestPriceOverride) &&
    latestPriceOverride > 0
      ? latestPriceOverride
      : quote.price;
  const anchors = found.monthlyHistoryAnchors;

  const sliceCount = range === '1M' ? 4 : range === '6M' ? 6 : anchors.length;
  const selectedAnchors = anchors.slice(Math.max(0, anchors.length - sliceCount));

  const baseDate = new Date(`${FALLBACK_PRICE_DATE}T15:20:00.000Z`);
  const scaleFactor = found.basePrice > 0 ? endPrice / found.basePrice : 1;
  const points: HistoricalPricePoint[] = selectedAnchors.map((val, idx) => {
    const d = new Date(baseDate);
    const stepsBack = selectedAnchors.length - 1 - idx;
    if (range === '1M') {
      d.setDate(d.getDate() - stepsBack * 7);
    } else {
      d.setMonth(d.getMonth() - stepsBack);
    }
    const isLast = idx === selectedAnchors.length - 1;
    return {
      date: d.toISOString().slice(0, 10),
      close: isLast ? endPrice : Math.round(val * scaleFactor * 100) / 100,
    };
  });

  return {
    symbol: found.symbol,
    currency: found.currency,
    range,
    points,
    status: 'fallback',
    providerName: DEMO_STATUS_LABEL,
    timestamp: lastDemoUpdateIso,
    isDemo: true,
  };
}
