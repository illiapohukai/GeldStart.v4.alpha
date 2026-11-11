export type LessonId =
  | 'grundlagen'
  | 'zinseszins'
  | 'anlageklassen'
  | 'kindergeld'
  | 'altersvorsorgedepot'
  | 'staat'
  | 'taschengeld';

export interface LessonSection {
  heading: string;
  paragraphs: string[];
  bulletPoints?: string[];
  callout?: {
    tone: 'info' | 'warning';
    title: string;
    text: string;
  };
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanationCorrect: string;
  explanationWrong: string;
}

export interface PracticalExample {
  title: string;
  scenario: string;
  takeaway: string;
}

export interface ProviderExampleSource {
  providerId: string;
  providerName: string;
  productName?: string;
  sourceUrls: string[];
  informationStatus: string;
}

export interface StepMoreInfo {
  title: string;
  points: string[];
  sourceNote?: string;
  exampleSources?: ProviderExampleSource[];
}

export type LessonVisualMotif =
  | 'purchasing-power'
  | 'compound-curve'
  | 'asset-blocks'
  | 'three-pots'
  | 'time-horizon'
  | 'state-check'
  | 'budget-balance'
  | 'emergency-shield'
  | 'snowball-effect'
  | 'pay-first'
  | 'pension-balance'
  | 'cost-warning'
  | 'abo-check'
  | 'allowance-stack'
  | 'contribution-breakdown'
  | 'tax-timeline'
  | 'three-product-paths'
  | 'locked-until-retirement'
  | 'provider-check';

export type InteractiveStepWidget =
  | 'inflation-slider'
  | 'compound-slider'
  | 'asset-inspector'
  | 'small-amounts-slider'
  | 'retirement-slider'
  | 'state-status-checker'
  | 'budget-mini'
  | 'allowance-slider'
  | 'retirement-breakdown'
  | 'cost-impact-slider'
  | 'provider-comparison';

export interface IntroStep {
  id: string;
  type: 'intro';
  kicker: string;
  title: string;
  hook: string;
  body: string;
  visual: LessonVisualMotif;
  ctaLabel?: string;
}

export interface ExplanationStep {
  id: string;
  type: 'explanation';
  kicker: string;
  title: string;
  body: string;
  highlightPoint?: string;
  visual?: LessonVisualMotif;
  moreInfo?: StepMoreInfo;
}

export interface ComparisonCardItem {
  label: string;
  title: string;
  points: string[];
  badge: string;
  tone: 'neutral' | 'accent' | 'warning';
}

export interface ComparisonStep {
  id: string;
  type: 'comparison';
  kicker: string;
  title: string;
  body: string;
  leftCard: ComparisonCardItem;
  rightCard: ComparisonCardItem;
  takeaway: string;
  moreInfo?: StepMoreInfo;
}

export interface TripleComparisonStep {
  id: string;
  type: 'triple_comparison';
  kicker: string;
  title: string;
  body: string;
  cards: [
    ComparisonCardItem,
    ComparisonCardItem,
    ComparisonCardItem,
  ];
  takeaway: string;
  moreInfo?: StepMoreInfo;
}

export interface VisualChoiceOption {
  id: string;
  label: string;
  subtitle: string;
  visualType: 'single-concentration' | 'diversified-basket' | 'short-term-safe' | 'long-term-growth';
  metrics: string[];
}

export interface VisualChoiceStep {
  id: string;
  type: 'visual_choice';
  kicker: string;
  title: string;
  question: string;
  options: [VisualChoiceOption, VisualChoiceOption];
  correctIndex: 0 | 1;
  explanationCorrect: string;
  explanationWrong: string;
  moreInfo?: StepMoreInfo;
}

export interface QuestionStep {
  id: string;
  type: 'question';
  kicker: string;
  title: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanationCorrect: string;
  explanationWrong: string;
  moreInfo?: StepMoreInfo;
  exampleSources?: ProviderExampleSource[];
}

export interface ScenarioFact {
  label: string;
  value: string;
}

export interface ScenarioStep {
  id: string;
  type: 'scenario';
  kicker: string;
  title: string;
  personTag: string;
  situation: string;
  contextFacts?: ScenarioFact[];
  question: string;
  options: string[];
  correctIndex: number;
  explanationCorrect: string;
  explanationWrong: string;
  moreInfo?: StepMoreInfo;
  exampleSources?: ProviderExampleSource[];
}

export interface InteractiveStep {
  id: string;
  type: 'interactive';
  kicker: string;
  title: string;
  body: string;
  widget: InteractiveStepWidget;
  moreInfo?: StepMoreInfo;
}

export interface CompletionStep {
  id: string;
  type: 'completion';
  kicker: string;
  title: string;
  body: string;
  summaryPoints: string[];
  depotBridge?: {
    label: string;
    description: string;
    to: '/depot' | '/rechner';
  };
}

export type LessonStep =
  | IntroStep
  | ExplanationStep
  | ComparisonStep
  | TripleComparisonStep
  | VisualChoiceStep
  | QuestionStep
  | ScenarioStep
  | InteractiveStep
  | CompletionStep;

export interface LessonModule {
  id: LessonId;
  route: `/${LessonId}`;
  order: number;
  isCoreTopic: boolean;
  categoryLabel: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  oneLineDescription: string;
  readingMinutes: number;
  hook: string;
  intro: string;
  steps: LessonStep[];
  sections: LessonSection[];
  practicalExample: PracticalExample;
  interactiveType:
    | 'inflation'
    | 'compound-preview'
    | 'asset-classes'
    | 'small-amounts'
    | 'retirement-horizon'
    | 'state-support'
    | 'budget-planner';
  merkeSummary: string[];
  quiz: QuizQuestion[];
  nextRoute?: `/${LessonId}`;
}

export interface AssetClassProfile {
  id: string;
  name: string;
  shortLabel: string;
  explanation: string;
  riskLevel: 'Niedrig' | 'Niedrig bis mittel' | 'Mittel' | 'Mittel bis hoch' | 'Hoch' | 'Sehr hoch';
  riskScore: 1 | 2 | 3 | 4 | 5;
  typicalFluctuation: string;
  accessibility: string;
  liquidity: string;
  beginnerConsideration: string;
  details: string[];
}

export interface StateSupportProgram {
  id: string;
  name: string;
  status: 'active' | 'available-soon' | 'planned' | 'legacy' | 'changing';
  statusBadgeText: string;
  standNote: string;
  summary: string;
  whoIsItFor: string;
  howItWorks: string[];
  importantConditions: string;
  verificationSource: string;
}

export interface ProviderSourceLink {
  label: string;
  url: string;
  isOfficial: boolean;
}

export interface AltersvorsorgedepotProviderEntry {
  id: string;
  providerName: string;
  accessNote: string;
  simplestConfirmedEntry: string;
  freeChoice: string;
  guarantee: string;
  importantLimitation: string;
  informationStatusText: string;
  informationDate: string;
  hasStandardProduct: boolean;
  hasFreeChoice: boolean;
  hasGuarantee: boolean;
  hasPublishedCosts: boolean;
  hasMissingFinalPricing: boolean;
  sources: ProviderSourceLink[];
}

export interface AnonymizedProviderLearningExample {
  id: string;
  title: string;
  kicker: string;
  offerALabel: string;
  offerASummary: string[];
  offerBLabel: string;
  offerBSummary: string[];
  question: string;
  expectedConcept: string;
  takeaway: string;
  internalSources: ProviderExampleSource[];
}

export interface DailyQuestionItem {
  id: string;
  topicId: LessonId;
  topicLabel: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const ASSET_CLASSES: AssetClassProfile[] = [
  {
    id: 'tagesgeld-festgeld',
    name: 'Tagesgeld & Festgeld',
    shortLabel: 'Tages- & Festgeld',
    explanation:
      'Verzinste Bankkonten ohne Kursschwankungen. Beim Tagesgeld kommst du jederzeit an dein Geld, beim Festgeld legst du es für eine feste Laufzeit zu einem vereinbarten Zinssatz fest.',
    riskLevel: 'Niedrig',
    riskScore: 1,
    typicalFluctuation: 'Keine Kursschwankung (0 % nominal), Zins beim Tagesgeld variabel',
    accessibility: 'Sehr einfach – oft ab 1 € bei fast jeder Bank eröffnenbar',
    liquidity: 'Tagesgeld: täglich verfügbar · Festgeld: bis Laufzeitende gebunden',
    beginnerConsideration:
      'Ideal für den Notgroschen und Sparziele in den nächsten 1–3 Jahren. In der EU greift die gesetzliche Einlagensicherung bis 100.000 € pro Person und Bank.',
    details: [
      'Tagesgeld eignet sich als flexibler Sicherheitspuffer für unvorhergesehene Ausgaben.',
      'Festgeld bietet planbarere Zinsen, dafür ist das Geld bis zum Laufzeitende gebunden.',
      'Reicht langfristig oft nur knapp aus, um die Inflation vollständig auszugleichen.',
    ],
  },
  {
    id: 'anleihen',
    name: 'Anleihen (Staats- & Unternehmensanleihen)',
    shortLabel: 'Anleihen',
    explanation:
      'Mit einer Anleihe leihst du einem Staat oder Unternehmen für eine feste Zeit Geld. Dafür erhältst du Zinsen (Kupon) und am Ende den Nennwert zurück – sofern der Schuldner zahlungsfähig bleibt.',
    riskLevel: 'Niedrig bis mittel',
    riskScore: 2,
    typicalFluctuation: 'Gering bis moderat (abhängig von Laufzeit, Zinsniveau und Bonität)',
    accessibility: 'Über ein Wertpapierdepot oder gebündelt als Anleihen-ETF handelbar',
    liquidity: 'Börsentäglich verkaufbar, Kurs kann vor Laufzeitende jedoch schwanken',
    beginnerConsideration:
      'Staatsanleihen stabiler Industrieländer gelten als risikoarm; Anleihen schwächerer Schuldner tragen ein höheres Ausfallrisiko.',
    details: [
      'Steigen die allgemeinen Marktzinsen, sinkt oft der Börsenkurs bereits laufender Anleihen.',
      'Am Ende der Laufzeit wird die Anleihe im Normalfall zu 100 % des Nennwerts zurückgezahlt.',
      'Wird häufig genutzt, um Schwankungen in einem gemischten Portfolio abzufedern.',
    ],
  },
  {
    id: 'aktien',
    name: 'Einzelaktien',
    shortLabel: 'Aktien',
    explanation:
      'Mit einer Aktie kaufst du einen Miteigentumsanteil an einem einzelnen Unternehmen. Läuft das Geschäft gut, kannst du von steigenden Kursen und Dividenden profitieren.',
    riskLevel: 'Hoch',
    riskScore: 4,
    typicalFluctuation: 'Deutlich – einzelne Aktien können stark steigen, aber auch um 50 % oder mehr fallen',
    accessibility: 'Über ein Depot ab wenigen Euro (oder per Sparplan) kaufbar',
    liquidity: 'Hoch – an Börsenhandelstagen jederzeit verkaufbar (zum jeweiligen Tageskurs)',
    beginnerConsideration:
      'Wer nur wenige Einzelaktien kauft, geht ein hohes Klumpenrisiko ein: Gerät genau diese eine Firma in eine Krise, leidet dein gesamter Einsatz.',
    details: [
      'Erfordert Zeit und Wissen, um Geschäftsmodelle einzelner Firmen zu beurteilen.',
      'Bekannte Marken sind nicht automatisch gute oder sichere Geldanlagen.',
      'Nur für Geld geeignet, auf das du mindestens 10 Jahre verzichten kannst.',
    ],
  },
  {
    id: 'etfs',
    name: 'ETFs (Börsengehandelte Indexfonds)',
    shortLabel: 'ETFs',
    explanation:
      'Ein ETF bündelt automatisch hunderte oder tausende Wertpapiere (z. B. aus einem Welt-Index) in einem einzigen Baustein. So verteilst du dein Geld sofort breit über viele Länder und Branchen.',
    riskLevel: 'Mittel bis hoch',
    riskScore: 3,
    typicalFluctuation: 'Marktübliche Kursschwankungen (Zwischentiefs von 20–40 % in Krisenjahren möglich)',
    accessibility: 'Sehr einsteigerfreundlich – per Sparplan oft schon ab 1 € bis 25 € monatlich',
    liquidity: 'Börsentäglich handelbar; sinnvoll jedoch nur mit langem Anlagehorizont',
    beginnerConsideration:
      'Breit gestreute Welt-ETFs gelten als beliebter Einstieg für den langfristigen Vermögensaufbau, können aber zeitweise ebenfalls im Minus stehen.',
    details: [
      'Automatische Risikostreuung (Diversifikation) über viele Unternehmen weltweit.',
      'Geringe laufende Kosten (oft 0,1 % bis 0,3 % pro Jahr).',
      'Funktioniert am besten über viele Jahre hinweg durch geduldiges Durchhalten.',
    ],
  },
  {
    id: 'immobilien',
    name: 'Immobilien',
    shortLabel: 'Immobilien',
    explanation:
      'Eigentumswohnungen oder Häuser zur Eigennutzung oder Vermietung – alternativ indirekt über börsengehandelte Immobilienunternehmen (REITs) oder Immobilienfonds.',
    riskLevel: 'Mittel',
    riskScore: 3,
    typicalFluctuation: 'Wert schwankt langsamer als an der Börse, hängt stark von Lage, Zinsen und Zustand ab',
    accessibility: 'Direktkauf erfordert hohes Eigenkapital & Kredit; indirekt über Fonds ab kleinen Beträgen',
    liquidity: 'Niedrig – ein Haus oder eine Wohnung lässt sich nicht spontan in wenigen Tagen verkaufen',
    beginnerConsideration:
      'Für 16- bis 20-Jährige ist ein direkter Immobilienkauf meist unrealistisch und unflexibel, weil Ausbildung und Wohnort sich noch oft ändern.',
    details: [
      'Hohe Kaufnebenkosten (Grunderwerbsteuer, Notar, Makler) von oft 8–12 % des Kaufpreises.',
      'Laufende Kosten für Instandhaltung und Rücklagen werden leicht unterschätzt.',
      'Offene Immobilienfonds haben gesetzliche Halte- und Kündigungsfristen.',
    ],
  },
  {
    id: 'gold',
    name: 'Gold (Edelmetalle)',
    shortLabel: 'Gold',
    explanation:
      'Physisches Gold (Münzen, Barren) oder besicherte Gold-Wertpapiere. Gold arbeitet nicht wie ein Unternehmen und zahlt weder Zinsen noch Dividenden – der Ertrag hängt allein vom Goldpreis ab.',
    riskLevel: 'Mittel bis hoch',
    riskScore: 3,
    typicalFluctuation: 'Spürbare Preisschwankungen; zudem Wechselkurseinfluss (Handel meist in US-Dollar)',
    accessibility: 'Als kleine Münzen/Barren bei Händlern oder als Wertpapier über das Depot',
    liquidity: 'Mittel bis hoch – jederzeit verkaufbar, bei Münzen/Barren aber mit Händleraufschlag',
    beginnerConsideration:
      'Wird oft als kleine Beimischung (z. B. 5–10 %) gesehen, ersetzt aber keinen breit gestreuten Vermögensaufbau.',
    details: [
      'Kein laufender Ertrag (0 % Zins, 0 % Dividende) – daher kein klassischer Zinseszins-Effekt.',
      'Bei physischem Gold entstehen Kosten für sichere Aufbewahrung.',
      'Der Goldpreis kann über viele Jahre seitwärts laufen oder deutlich schwanken.',
    ],
  },
  {
    id: 'krypto',
    name: 'Kryptowährungen (Krypto-Assets)',
    shortLabel: 'Krypto',
    explanation:
      'Digitale Token auf Basis der Blockchain-Technologie (z. B. Bitcoin oder Ethereum). Ihr Preis richtet sich fast ausschließlich nach Angebot, Nachfrage und Marktstimmung.',
    riskLevel: 'Sehr hoch',
    riskScore: 5,
    typicalFluctuation: 'Extrem – Kurseinbrüche von 50 % bis 90 % oder ein Totalverlust einzelner Coins sind möglich',
    accessibility: 'Über Krypto-Börsen oder Broker (in der Regel erst ab 18 Jahren)',
    liquidity: 'Handel rund um die Uhr möglich, aber mit extremen Kurssprüngen',
    beginnerConsideration:
      'Reine Spekulation, keine sichere Geldanlage. Vorsicht vor Versprechen auf Social Media und „Pump-and-Dump“-Gruppen.',
    details: [
      'Keine Einlagensicherung und kein Unternehmensumsatz hinter den meisten Coins.',
      'Verlust des privaten Schlüssels (Seed Phrase) bedeutet oft den unwiederbringlichen Verlust.',
      'Wenn überhaupt, nur mit Spielgeld ausprobieren, dessen Totalverlust dir nicht schadet.',
    ],
  },
];

export const STATE_SUPPORT_PROGRAMS: StateSupportProgram[] = [
  {
    id: 'vl',
    name: 'Vermögenswirksame Leistungen (VL)',
    status: 'active',
    statusBadgeText: 'Aktiv · Bestehende Regelung',
    standNote: 'Rechts- und Informationsstand: November 2026',
    summary:
      'Viele Arbeitgeber zahlen Auszubildenden und Beschäftigten freiwillig oder per Tarifvertrag bis zu 40 € monatlich zusätzlich zum Gehalt in einen VL-Sparvertrag.',
    whoIsItFor: 'Auszubildende, Angestellte, Beamte und dual Studierende (je nach Tarif- oder Arbeitsvertrag)',
    howItWorks: [
      'Frag in der Personalabteilung oder deinem Ausbildungsvertrag nach, ob dein Betrieb VL zahlt.',
      'Du eröffnest einen VL-fähigen Vertrag (z. B. VL-Fondssparplan, Banksparplan oder Bausparvertrag).',
      'Dein Arbeitgeber überweist den Betrag direkt monatlich in diesen Vertrag.',
    ],
    importantConditions:
      'Typische Laufzeit: 6 Jahre einzahlen plus bis zu 1 Jahr Ruhezeit (ca. 7 Jahre). Höhe hängt vom Tarif-/Arbeitsvertrag ab.',
    verificationSource: 'Verbraucherzentrale & Personalabteilung deines Ausbildungsbetriebs',
  },
  {
    id: 'arbeitnehmersparzulage',
    name: 'Arbeitnehmersparzulage',
    status: 'active',
    statusBadgeText: 'Aktiv · Staatlicher Zuschuss',
    standNote: 'Rechts- und Informationsstand: November 2026',
    summary:
      'Wenn du vermögenswirksame Leistungen (VL) in einen geförderten Vertrag (z. B. Aktienfondssparplan oder Bausparvertrag) anlegst, legt der Staat innerhalb der Einkommensgrenzen jährlich eine Zulage obendrauf.',
    whoIsItFor:
      'Auszubildende und Arbeitnehmer mit einem zu versteuernden Einkommen innerhalb der gesetzlichen Fördergrenzen',
    howItWorks: [
      'Dein Arbeitgeber oder du selbst zahlt VL in einen förderfähigen Vertrag ein.',
      'Du beantragst die Arbeitnehmersparzulage über deine Einkommensteuererklärung.',
      'Nach Ablauf der Sperrfrist wird die gesammelte Zulage in deinen Vertrag ausgezahlt.',
    ],
    importantConditions:
      'Die Einkommensgrenzen wurden deutlich angehoben, sodass fast alle Azubis und Berufseinsteiger darunter liegen. Es gelten feste Sperrfristen.',
    verificationSource: 'Bundesministerium der Finanzen / Finanzamt / Verbraucherzentrale',
  },
  {
    id: 'wohnungsbaupraemie',
    name: 'Wohnungsbauprämie (inkl. U25-Sonderregel)',
    status: 'active',
    statusBadgeText: 'Aktiv · Mit Bedingungen',
    standNote: 'Rechts- und Informationsstand: November 2026',
    summary:
      'Staatlicher Zuschuss auf eigene Einzahlungen in einen Bausparvertrag (ab 16 Jahren). Für unter 25-Jährige gibt es eine gesetzliche Ausnahmeregel bei der Verwendung.',
    whoIsItFor:
      'Sparer ab 16 Jahren innerhalb der Einkommensgrenzen, die mindestens den jährlichen Mindestbetrag in einen Bausparvertrag einzahlen',
    howItWorks: [
      'Normalerweise ist die Wohnungsbauprämie an eine wohnwirtschaftliche Nutzung gebunden.',
      'Sonderregel unter 25 Jahren: Wer bei Abschluss jünger als 25 ist, darf nach 7 Jahren Sparzeit einmalig frei über das Guthaben inkl. Prämie verfügen.',
    ],
    importantConditions:
      'Achte auf Abschlussgebühren (oft 1,0 % bis 1,6 % der Bausparsumme) und niedrige Guthabenzinsen – ein Bausparvertrag lohnt sich nicht automatisch nur wegen der Prämie.',
    verificationSource: 'Verbraucherzentrale & unabhängige Finanzberatung',
  },
  {
    id: 'altersvorsorgedepot-2027',
    name: 'Gefördertes Altersvorsorgedepot',
    status: 'available-soon',
    statusBadgeText: 'Beschlossen · Produkte ab 01.01.2027',
    standNote: 'Rechts- und Informationsstand: November 2026',
    summary:
      'Zertifizierte private Altersvorsorge mit eigenem Beitrag, beitragsabhängiger staatlicher Zulage und möglichen Kapitalmarktanlagen.',
    whoIsItFor:
      'Förderberechtigte Sparerinnen und Sparer, die ab dem 1. Januar 2027 einen zertifizierten Altersvorsorgevertrag abschließen',
    howItWorks: [
      'Die gesetzliche Grundlage wurde 2026 beschlossen. Zertifizierte Produkte sollen ab dem 1. Januar 2027 angeboten werden.',
      'Für die ersten 360 € Jahresbeitrag gibt es in diesem Modell 50 Cent Grundzulage je Euro, für weitere Beiträge bis 1.800 € jährlich 25 Cent je Euro (maximal 540 € Grundzulage pro Jahr).',
      'Zusätzlich sind eine Kinderzulage (bis zu 300 € pro Kind und Jahr) sowie bei Vertragsabschluss vor dem 25. Geburtstag ein einmaliger Berufseinsteigerbonus von 200 € möglich.',
    ],
    importantConditions:
      'Maximal geförderter Eigenbeitrag von 1.800 € pro Jahr in diesem Modell (maximale Grundzulage: 540 € pro Jahr). Eingeschränkte Verfügbarkeit vor dem Rentenbeginn, spätere Auszahlungen sind grundsätzlich steuerpflichtig, und die konkreten Konditionen hängen vom jeweiligen zertifizierten Vertrag ab.',
    verificationSource: 'Bundesministerium der Finanzen, Zertifizierungsstelle & Produktinformationsblatt des Anbieters',
  },
  {
    id: 'riester',
    name: 'Bestehende Riester-Verträge (Bestandsschutz)',
    status: 'legacy',
    statusBadgeText: 'Bestandsschutz · Kein Neugeschäft ab 2027',
    standNote: 'Rechts- und Informationsstand: November 2026',
    summary:
      'Bestehende Riester-Verträge genießen Bestandsschutz und können grundsätzlich weitergeführt werden; neue klassische Riester-Verträge werden ab 2027 durch das neue Fördersystem abgelöst.',
    whoIsItFor:
      'Sparerinnen und Sparer, die bereits einen bestehenden Riester-Vertrag besitzen',
    howItWorks: [
      'Bestehende Verträge laufen grundsätzlich weiter und sollten nicht unüberlegt oder automatisch gekündigt werden.',
      'Ob ein Weiterführen, Beitragsfreistellen oder ein späterer Wechsel in ein neues Altersvorsorgedepot sinnvoll ist, muss individuell anhand des konkreten Vertrags geprüft werden.',
    ],
    importantConditions:
      'Entscheidend sind laufende Kosten, bereits gezahlte Abschlussgebühren, vorhandene Beitragsgarantien, Zulagenansprüche und die konkreten Wechselbedingungen.',
    verificationSource: 'Deutsche Rentenversicherung (Ihre Vorsorge) & Verbraucherzentrale',
  },
  {
    id: 'fruehstart-rente',
    name: 'Frühstart-Rente',
    status: 'planned',
    statusBadgeText: 'Geplant · Noch nicht verfügbar',
    standNote: 'Rechts- und Informationsstand: November 2026',
    summary:
      'Ein separates geplantes Förderkonzept für Kinder und Jugendliche – nicht identisch mit dem ab 2027 startenden Altersvorsorgedepot für eigene Beiträge.',
    whoIsItFor:
      'Geplantes Programm für Kinder und Jugendliche; derzeit noch nicht als abschließbares Produkt verfügbar',
    howItWorks: [
      'Die Frühstart-Rente ist ein eigenständiges Vorhaben und muss klar vom geförderten Altersvorsorgedepot unterschieden werden.',
      'Ob, wann und mit welchen genauen Bedingungen das Programm startet, hängt von der endgültigen gesetzlichen und technischen Umsetzung ab.',
    ],
    importantConditions:
      'Noch nicht verfügbar: Plane nur mit Förderprogrammen, deren gesetzliche Regeln und zertifizierte Angebote tatsächlich verfügbar sind.',
    verificationSource: 'Bundesministerium der Finanzen & Verbraucherzentralen',
  },
];

export const ANONYMIZED_PROVIDER_EXAMPLES: AnonymizedProviderLearningExample[] = [
  {
    id: 'example-1-fixed-vs-percent',
    title: 'Beispiel 1: Feste Grundgebühr vs. prozentuale Kosten',
    kicker: 'Kosten-Mechanik · Kleines vs. größeres Guthaben',
    offerALabel: 'Angebot A (Feste Monatsgebühr + Produktkosten)',
    offerASummary: [
      'Feste Gebühr: 1 € pro Monat (12 € pro Jahr)',
      'Laufende Produktkosten: ca. 0,35 % pro Jahr',
      'Standarddepot mit globalem Aktien-ETF und Euro-Anleihen-ETF',
    ],
    offerBLabel: 'Angebot B (Prozentuale Effektivkosten)',
    offerBSummary: [
      'Keine separate Depot- und Zulagenverwaltungsgebühr',
      'Genannte Effektivkosten im Standardmodell: ca. 0,10 % pro Jahr',
      'Standarddepot mit globalem Aktien-ETF und europäischem Anleihen-ETF',
    ],
    question:
      'Warum kann eine feste Gebühr von 12 € pro Jahr bei einem kleinen Depot besonders stark ins Gewicht fallen?',
    expectedConcept:
      'Bei 2.000 € Guthaben entsprechen 12 € bereits 0,60 % pro Jahr – noch vor den laufenden Produktkosten. Mit wachsendem Depotvolumen sinkt das prozentuale Gewicht der festen Gebühr.',
    takeaway:
      'Kein Gebührenmodell ist pauschal für jede Depotgröße gleich: Feste Euro-Gebühren belasten kleine Startguthaben prozentual stärker, während bei großen Depots die laufenden Prozentkosten dominieren.',
    internalSources: [
      {
        providerId: 'fidelity',
        providerName: 'Fidelity International / FFB',
        productName: 'Fidelity Vorsorgedepot Standard',
        sourceUrls: [
          'https://www.fidelity.de/produkte-services/anlageloesungen/fidelity-vorsorgedepot/',
          'https://partner.fidelity.de/artikel/pressemitteilungen/2026-05-08-fidelity-international-launcht-altersvorsorgedepot-1778245491569',
        ],
        informationStatus: 'Stand November 2026 · Standardmodell angekündigt',
      },
      {
        providerId: 'deka',
        providerName: 'Deka',
        productName: 'Deka Altersvorsorgedepot Standard',
        sourceUrls: [
          'https://www.deka.de/privatkunden/aktuelles-themen/informationen/altersvorsorge-reform',
          'https://altersvorsorgedepot-anbieter-vergleich.de/anbieter-monitor/dekabank/',
        ],
        informationStatus: 'Stand November 2026 · Richtwerte vorbehaltlich endgültiger Freigabe',
      },
    ],
  },
  {
    id: 'example-2-zero-euro-advertising',
    title: 'Beispiel 2: „0 € Depotgebühr“ heißt nicht automatisch 0 € Gesamtkosten',
    kicker: 'Werbebegriffe prüfen · Gesamtkosten verstehen',
    offerALabel: 'Angebot A (Selbstgesteuertes Depot ab 0,03 % Produktkosten)',
    offerASummary: [
      '0 € eigene Depot-, Sparplan-, Order- oder Wechselgebühr des Anbieters',
      'Über 1.000 ETFs und Fonds zur Auswahl',
      'Laufende Produktkosten starten ab ca. 0,03 % p. a. zzgl. Transaktionskosten',
      'Tatsächliche Gesamtkosten hängen von den selbst gewählten Produkten ab',
    ],
    offerBLabel: 'Angebot B (0 € Depot mit Kostenerstattung für ausgewählte ETFs)',
    offerBSummary: [
      '0 € Depotgebühr und 0 € für Sparpläne',
      'Erstattung der Produktkosten gilt nur für ausgewählte förderfähige Partner-ETFs',
      'Produkte außerhalb dieser Auswahl oder einzelne Transaktionen können Kosten verursachen',
    ],
    question:
      'Welche Information fehlt, wenn in der Werbung nur „0 € Depotgebühr“ steht?',
    expectedConcept:
      'Es fehlen Angaben zu laufenden Produktkosten (TER), Fondsauswahl, Börsenspreads, Ordergebühren, Sonderbedingungen und zur Dauer möglicher Kostenerstattungen.',
    takeaway:
      'Prüfe neben der Depotgebühr immer die Effektivkostenquote, mögliche Transaktionskosten, Spreads und ob günstige Konditionen nur für eine eingeschränkte ETF-Liste gelten.',
    internalSources: [
      {
        providerId: 'ing',
        providerName: 'ING',
        productName: 'ING Aktiv',
        sourceUrls: [
          'https://www.ing.de/sparen-anlegen/altersvorsorge-depot/',
          'https://neues-altersvorsorgedepot.de/anbieter/ing',
        ],
        informationStatus: 'Stand November 2026 · Veröffentlichte Konditionen',
      },
      {
        providerId: 'traderepublic',
        providerName: 'Trade Republic',
        productName: 'Trade Republic Altersvorsorgedepot',
        sourceUrls: [
          'https://traderepublic.com/de-de/altersvorsorgedepot',
          'https://finanzfacts.de/wiki/altersvorsorgedepot/anbieter/trade-republic/',
        ],
        informationStatus: 'Stand November 2026 · Vorläufige Ankündigung',
      },
    ],
  },
  {
    id: 'example-3-temporary-promotion',
    title: 'Beispiel 3: Befristete Startaktion vs. dauerhafte Vertragsbedingung',
    kicker: 'Aktionsbedingungen · Laufzeit & Volumen prüfen',
    offerALabel: 'Angebot A (Kostenerstattung mindestens im 1. Jahr)',
    offerASummary: [
      '0 € Depotgebühr zum Marktstart',
      'Erstattung der laufenden ETF-Kosten mindestens im ersten Jahr',
      'Spätere dauerhafte Preisgestaltung ist noch nicht abschließend bestätigt',
    ],
    offerBLabel: 'Angebot B (TER-Erstattung für 3 Jahre bis 25.000 €)',
    offerBSummary: [
      'TER-Erstattung im Standardmodell für mindestens drei Jahre',
      'Begrenzt auf ein Anlagevolumen von bis zu 25.000 €',
      'Spätere Erstattung kann von weiteren Bedingungen abhängen; Spreads fallen weiterhin an',
    ],
    question:
      'Welche drei Fragen musst du bei einem kostenlosen Startangebot stellen?',
    expectedConcept:
      '1. Wie lange gilt die Aktion? 2. Bis zu welchem Anlagevolumen gilt sie? 3. Welche Kosten entstehen danach oder außerhalb der Aktion?',
    takeaway:
      'Ein Altersvorsorgevertrag läuft oft über mehrere Jahrzehnte. Ein Aktionsvorteil für ein bis drei Jahre ersetzt keine transparente langfristige Kostenregelung.',
    internalSources: [
      {
        providerId: 'quirion',
        providerName: 'Quirion / Quirin Privatbank',
        productName: 'Quirion Standard Altersvorsorgedepot',
        sourceUrls: [
          'https://www.quirion.de/vorsorgen',
          'https://www.quirion.de/post/unser-neuer-standard-fuer-die-altersvorsorge',
          'https://neues-altersvorsorgedepot.de/anbieter/quirion',
        ],
        informationStatus: 'Stand November 2026 · Startaktion angekündigt, Folgekosten noch offen',
      },
      {
        providerId: 'smartbroker',
        providerName: 'SMARTBROKER+',
        productName: 'SMARTBROKER+ Standard',
        sourceUrls: [
          'https://www.smartbrokerplus.de/de-de/altersvorsorgedepot/',
          'https://www.wiwo.de/vergleich/altersvorsorgedepot-smartbrokerplus/',
        ],
        informationStatus: 'Stand November 2026 · Befristete TER-Erstattung angekündigt',
      },
    ],
  },
  {
    id: 'example-4-choice-vs-structure',
    title: 'Beispiel 4: Eigene Fondsauswahl vs. automatische Standardstruktur',
    kicker: 'Produkttypen · Auswahl & Eigenverantwortung',
    offerALabel: 'Angebot A (Standardisierte Struktur mit 2 Bausteinen)',
    offerASummary: [
      'Begrenzte, übersichtliche Auswahl mit vordefiniertem Aktien- und Anleihen-ETF',
      'Leichter nachvollziehbar ohne eigene Fondsrecherche',
      'Weniger individuelle Eingriffsmöglichkeiten',
    ],
    offerBLabel: 'Angebot B (Breite freie Auswahl aus 100 bis über 1.000 Produkten)',
    offerBSummary: [
      'Breite oder selbstgesteuerte Auswahl an zulässigen ETFs und Fonds',
      'Mehr eigene Entscheidungsverantwortung für Gewichtung und Risikostreuung',
      'Gesamtkosten hängen stark von den selbst gewählten Produkten ab',
    ],
    question:
      'Mehr Auswahl klingt gut. Welche zusätzliche Verantwortung entsteht dadurch?',
    expectedConcept:
      'Wer frei auswählt, muss Risikostreuung (Diversifikation), Schwankungsrisiko, laufende Produktkosten, Eignung und das spätere Umschichten (Rebalancing) selbst prüfen.',
    takeaway:
      'Eine große Fondsliste ist nur dann ein Vorteil, wenn du Kosten, Streuung und Risikoverlauf über Jahrzehnte selbst überblicken möchtest.',
    internalSources: [
      {
        providerId: 'ing',
        providerName: 'ING',
        productName: 'ING Relax / ING Aktiv',
        sourceUrls: [
          'https://www.ing.de/sparen-anlegen/altersvorsorge-depot/',
          'https://neues-altersvorsorgedepot.de/anbieter/ing',
        ],
        informationStatus: 'Stand November 2026 · Veröffentlichte Produktstruktur',
      },
      {
        providerId: 'dws',
        providerName: 'DWS',
        productName: 'DWS VorsorgeDepot Select',
        sourceUrls: [
          'https://www.dws.de/informieren/altersvorsorge/das-neue-geplante-altersvorsorgedepot/',
          'https://altersvorsorgedepot-anbieter-vergleich.de/anbieter-monitor/dws/',
        ],
        informationStatus: 'Stand November 2026 · Veröffentlichte Produktvarianten',
      },
      {
        providerId: 'scalable',
        providerName: 'Scalable Capital',
        productName: 'Scalable Altersvorsorgedepot',
        sourceUrls: [
          'https://de.scalable.capital/altersvorsorgedepot',
          'https://de.scalable.capital/newsroom/altersvorsorgedepot',
        ],
        informationStatus: 'Stand November 2026 · Vorläufige Produktankündigung',
      },
    ],
  },
  {
    id: 'example-5-guarantee-vs-opportunity',
    title: 'Beispiel 5: Beitragsgarantie vs. offene Marktchance',
    kicker: 'Sicherheitsbaustein · Preis einer Garantie',
    offerALabel: 'Angebot A (Garantieprodukt mit 80 % Absicherung)',
    offerASummary: [
      '80 % Garantie für eingezahlte Beiträge und Zulagen zum vereinbarten Rentenbeginn',
      'Kombination aus Sicherungsvermögen und renditeorientierten Anlagebausteinen',
      'Vollständige endgültige Preisangaben sind noch nicht veröffentlicht',
    ],
    offerBLabel: 'Angebot B (Depot ohne Beitragsgarantie)',
    offerBSummary: [
      'Keine Beitragsgarantie zum Rentenbeginn',
      'Stärkere Wertschwankungen während der Laufzeit möglich',
      'Höherer Anteil kann langfristig in chancenorientierten Sachwerten investiert bleiben (nicht garantiert)',
    ],
    question: 'Was ist der mögliche Preis einer Garantie?',
    expectedConcept:
      'Ein größerer Sicherheitsbaustein verringert den Anteil, der in wachstumsorientierte Anlagen wie Aktien-ETFs fließen kann, und kann dadurch die mögliche langfristige Rendite senken.',
    takeaway:
      'Garantien sind weder automatisch schlecht noch automatisch besser: Sie begrenzen das Verlustrisiko zum Stichtag, kosten aber oft Renditechancen und zusätzliche Gebühren.',
    internalSources: [
      {
        providerId: 'allianz',
        providerName: 'Allianz',
        productName: 'Allianz InvestFlex80',
        sourceUrls: ['https://www.allianz.de/vorsorge/altersvorsorgedepot/'],
        informationStatus: 'Stand November 2026 · Produktstruktur angekündigt, Preisunterlagen noch offen',
      },
      {
        providerId: 'ruv',
        providerName: 'R+V',
        productName: 'R+V Altersvorsorgedepot mit 80 % Garantie',
        sourceUrls: [
          'https://www.ruv.de/altersvorsorge/private-rentenversicherung/altersvorsorgedepot',
        ],
        informationStatus: 'Stand November 2026 · Produktstruktur angekündigt, Preisunterlagen noch offen',
      },
    ],
  },
];

/**
 * Alphabetically sorted list of published provider information (Stand: November 2026).
 * Strictly neutral educational overview without rankings, recommendations, or affiliate parameters.
 */
export const ALTERSVORSORGEDEPOT_PROVIDERS: AltersvorsorgedepotProviderEntry[] = [
  {
    id: 'allianz',
    providerName: 'Allianz',
    accessNote: 'Versicherungs- und Vorsorgeanbieter',
    simplestConfirmedEntry:
      'Standarddepot mit zwei vordefinierten ETFs ohne Kapitalgarantie; Auszahlung als lebenslange Rente oder Auszahlplan je nach Vertrag (bis zu 30 % Einmalauszahlung unter geltenden Bedingungen förderunschädlich möglich).',
    freeChoice:
      'InvestFlex mit Auswahl aus bis zu zehn Fonds oder ETFs.',
    guarantee:
      'InvestFlex80 mit 80 % Garantie zum Rentenbeginn.',
    importantLimitation:
      'Vollständige endgültige Preis- und Leistungsunterlagen (Produktinformationsblatt, Effektivkostenquote) sind noch nicht veröffentlicht.',
    informationStatusText:
      'Vorläufige Produktankündigung · Endgültige Preisunterlagen fehlen noch',
    informationDate: 'November 2026',
    hasStandardProduct: true,
    hasFreeChoice: true,
    hasGuarantee: true,
    hasPublishedCosts: false,
    hasMissingFinalPricing: true,
    sources: [
      {
        label: 'Offizielle Anbieterseite: Allianz Altersvorsorgedepot',
        url: 'https://www.allianz.de/vorsorge/altersvorsorgedepot/',
        isOfficial: true,
      },
    ],
  },
  {
    id: 'deka',
    providerName: 'Deka',
    accessNote: 'Zugang über Sparkassen',
    simplestConfirmedEntry:
      'Standarddepot mit globalem Aktien-ETF und europäischem Anleihen-ETF; automatische Risikoreduzierung oder selbst gesteuerte Aktienquote; 0 € Depot- und Zulagenverwaltung; genannte Effektivkosten ca. 0,10 % p. a.',
    freeChoice:
      'Gemanagte Variante ca. 1,0–1,5 % p. a. je nach Laufzeit.',
    guarantee:
      'Kein Garantieprodukt angekündigt.',
    importantLimitation:
      '0 € bezieht sich auf die Depot- und Zulagenverwaltung, nicht auf laufende Produktkosten; Details stehen noch unter dem Vorbehalt der endgültigen Zertifizierung.',
    informationStatusText:
      'Veröffentlichte Richtwerte · Details vorbehaltlich endgültiger Freigabe',
    informationDate: 'November 2026',
    hasStandardProduct: true,
    hasFreeChoice: true,
    hasGuarantee: false,
    hasPublishedCosts: true,
    hasMissingFinalPricing: false,
    sources: [
      {
        label: 'Offizielle Anbieterseite: Deka Altersvorsorge-Reform',
        url: 'https://www.deka.de/privatkunden/aktuelles-themen/informationen/altersvorsorge-reform',
        isOfficial: true,
      },
      {
        label: 'Ergänzende Kosteneinordnung: Anbieter-Monitor DekaBank',
        url: 'https://altersvorsorgedepot-anbieter-vergleich.de/anbieter-monitor/dekabank/',
        isOfficial: false,
      },
    ],
  },
  {
    id: 'dws',
    providerName: 'DWS',
    accessNote: 'Vertrieb über Deutsche Bank und Postbank',
    simplestConfirmedEntry:
      'DWS VorsorgeDepot ETF ca. 0,42 % p. a. (ca. 0,44 % inkl. ausgewiesener Transaktionskosten); Active ETFs ca. 0,60 % (ca. 0,77 % inkl. Transaktionskosten); Fonds ca. 0,65 % (ca. 0,77 % inkl. Transaktionskosten).',
    freeChoice:
      'Comfort ca. 1,13 % (ca. 1,25 % zzgl. möglicher Abschlusskosten); Select ca. 0,83–1,28 % (potenziell bis 1,54 % zzgl. möglicher Abschlusskosten) mit bis zu zehn Fonds/ETFs aus rund 100 Produkten.',
    guarantee:
      'Kein separates Garantieprodukt angekündigt.',
    importantLimitation:
      'Je nach Tarifvariante (insbesondere Comfort und Select) können Transaktions- und Abschlusskosten hinzukommen; endgültige Produktinformationsblätter vor Vertragsabschluss prüfen.',
    informationStatusText:
      'Veröffentlichte Kostenbandbreiten · Vorläufige Tarifangaben',
    informationDate: 'November 2026',
    hasStandardProduct: true,
    hasFreeChoice: true,
    hasGuarantee: false,
    hasPublishedCosts: true,
    hasMissingFinalPricing: false,
    sources: [
      {
        label: 'Offizielle Anbieterseite: DWS VorsorgeDepot',
        url: 'https://www.dws.de/informieren/altersvorsorge/das-neue-geplante-altersvorsorgedepot/',
        isOfficial: true,
      },
      {
        label: 'Ergänzende Kosteneinordnung: Anbieter-Monitor DWS',
        url: 'https://altersvorsorgedepot-anbieter-vergleich.de/anbieter-monitor/dws/',
        isOfficial: false,
      },
    ],
  },
  {
    id: 'fidelity',
    providerName: 'Fidelity International / FFB',
    accessNote: 'Fondsdepotbank / Direkt- und Partnerzugang',
    simplestConfirmedEntry:
      'Bestätigtes Standarddepot mit globalem Aktien-ETF und Euro-Anleihen-ETF; Aktienquote anfangs bis zu 100 %, Risikoreduzierung ab 10 Jahren vor Rentenbeginn auf maximal 30 % zum Auszahlungsstart; 1 € pro Monat plus ca. 0,35 % jährliche Produktkosten.',
    freeChoice:
      'Vollständige Konditionen für ein freies Altersvorsorgedepot sind noch nicht abschließend bestätigt.',
    guarantee:
      'Kein Garantieprodukt angekündigt.',
    importantLimitation:
      'Die feste Gebühr von 1 € pro Monat (12 € p. a.) fällt bei kleinem Depotwert prozentual stärker ins Gewicht; Konditionen der freien Auswahl sind noch nicht vollständig veröffentlicht.',
    informationStatusText:
      'Standardmodell bestätigt · Freie Auswahl noch nicht vollständig veröffentlicht',
    informationDate: 'November 2026',
    hasStandardProduct: true,
    hasFreeChoice: false,
    hasGuarantee: false,
    hasPublishedCosts: true,
    hasMissingFinalPricing: true,
    sources: [
      {
        label: 'Offizielle Anbieterseite: Fidelity Vorsorgedepot',
        url: 'https://www.fidelity.de/produkte-services/anlageloesungen/fidelity-vorsorgedepot/',
        isOfficial: true,
      },
      {
        label: 'Offizielle Pressemitteilung: Fidelity International zum Altersvorsorgedepot',
        url: 'https://partner.fidelity.de/artikel/pressemitteilungen/2026-05-08-fidelity-international-launcht-altersvorsorgedepot-1778245491569',
        isOfficial: true,
      },
    ],
  },
  {
    id: 'ing',
    providerName: 'ING',
    accessNote: 'Direktbank',
    simplestConfirmedEntry:
      'ING Relax: Zwei vordefinierte ETFs; keine eigenen ING-Gebühren; Produktkosten ca. 0,20 % p. a. zuzüglich Transaktionskosten.',
    freeChoice:
      'ING Aktiv: Selbstgesteuerte Auswahl aus mehr als 1.000 ETFs und Fonds; keine eigene ING-Depot-, Sparplan-, Order- oder Wechselgebühr; Produktkosten ab ca. 0,03 % p. a. zuzüglich Transaktionskosten.',
    guarantee:
      'Kein Garantieprodukt angekündigt.',
    importantLimitation:
      '„Ab 0,03 % p. a.“ ist der Einstiegswert einzelner günstiger ETFs und keine garantierte Gesamtkostenquote für jedes Portfolio; Transaktionskosten und teurere Fonds erhöhen die Gesamtkosten.',
    informationStatusText:
      'Veröffentlichte Konditionen · Endgültige Zertifizierungsunterlagen folgen',
    informationDate: 'November 2026',
    hasStandardProduct: true,
    hasFreeChoice: true,
    hasGuarantee: false,
    hasPublishedCosts: true,
    hasMissingFinalPricing: false,
    sources: [
      {
        label: 'Offizielle Anbieterseite: ING Altersvorsorge-Depot',
        url: 'https://www.ing.de/sparen-anlegen/altersvorsorge-depot/',
        isOfficial: true,
      },
      {
        label: 'Ergänzende Einordnung: Anbieterprofil ING',
        url: 'https://neues-altersvorsorgedepot.de/anbieter/ing',
        isOfficial: false,
      },
    ],
  },
  {
    id: 'quirion',
    providerName: 'Quirion / Quirin Privatbank',
    accessNote: 'Digitaler Vermögensverwalter / Quirin Privatbank',
    simplestConfirmedEntry:
      'Standarddepot auf Basis von Vanguard FTSE Global All-Cap und Vanguard Global Aggregate Bond EUR Hedged (laufende ETF-TER ca. 0,07 % und 0,08 %); 0 € Depotgebühr zum Start und Erstattung der ETF-Kosten mindestens im ersten Jahr.',
    freeChoice:
      'Keine separate freie Einzelauswahl außerhalb des Standardkonzepts bestätigt.',
    guarantee:
      'Kein Garantieprodukt angekündigt.',
    importantLimitation:
      'Die 0-€-Depotgebühr und die ETF-Kostenerstattung gelten laut Ankündigung mindestens für das erste Jahr; die dauerhafte Preisgestaltung für spätere Jahre ist noch nicht abschließend veröffentlicht.',
    informationStatusText:
      'Startaktion bestätigt · Dauerhafte Folgekosten noch nicht endgültig veröffentlicht',
    informationDate: 'November 2026',
    hasStandardProduct: true,
    hasFreeChoice: false,
    hasGuarantee: false,
    hasPublishedCosts: true,
    hasMissingFinalPricing: true,
    sources: [
      {
        label: 'Offizielle Anbieterseite: Quirion Vorsorgen',
        url: 'https://www.quirion.de/vorsorgen',
        isOfficial: true,
      },
      {
        label: 'Offizieller Beitrag: Quirion Standard für die Altersvorsorge',
        url: 'https://www.quirion.de/post/unser-neuer-standard-fuer-die-altersvorsorge',
        isOfficial: true,
      },
      {
        label: 'Ergänzende Einordnung: Anbieterprofil Quirion',
        url: 'https://neues-altersvorsorgedepot.de/anbieter/quirion',
        isOfficial: false,
      },
    ],
  },
  {
    id: 'ruv',
    providerName: 'R+V',
    accessNote: 'Versicherungsanbieter der Genossenschaftlichen FinanzGruppe',
    simplestConfirmedEntry:
      'Angekündigtes Standardprodukt ab 1. Januar 2027 mit vordefinierten ETFs; lebenslange Rente oder Auszahlplan je nach gewähltem Produkt.',
    freeChoice:
      'Freies Produkt mit aktiven und passiven Fonds bzw. ETFs angekündigt.',
    guarantee:
      'Produktvariante mit 80 % Garantie für eingezahlte Beiträge und staatliche Zulagen angekündigt.',
    importantLimitation:
      'Vollständige endgültige öffentliche Preisangaben (Produktinformationsblätter, Effektivkostenquoten und Preis- und Leistungsverzeichnis) liegen noch nicht vor.',
    informationStatusText:
      'Vorläufige Produktankündigung · Endgültige Preisunterlagen fehlen noch',
    informationDate: 'November 2026',
    hasStandardProduct: true,
    hasFreeChoice: true,
    hasGuarantee: true,
    hasPublishedCosts: false,
    hasMissingFinalPricing: true,
    sources: [
      {
        label: 'Offizielle Anbieterseite: R+V Altersvorsorgedepot',
        url: 'https://www.ruv.de/altersvorsorge/private-rentenversicherung/altersvorsorgedepot',
        isOfficial: true,
      },
    ],
  },
  {
    id: 'scalable',
    providerName: 'Scalable Capital',
    accessNote: 'Digitaler Broker & Vermögensverwalter',
    simplestConfirmedEntry:
      '0 € Depotgebühr sowie 0 € für Spar- und Auszahlpläne; automatische altersabhängige Aufteilung im Standardprodukt.',
    freeChoice:
      'Breitere Auswahl in der freien Variante; Erstattung der Produktkosten ausgewählter Scalable-, BlackRock-, DWS- und Vanguard-ETFs über den angekündigten Rentenbonus.',
    guarantee:
      'Kein Garantieprodukt angekündigt.',
    importantLimitation:
      'Einzelkäufe im FREE-Modell können 0,99 € Ordergebühr kosten; zudem gelten marktübliche Spreads, und die Liste der erstattungsfähigen ETFs sowie Sonderbedingungen können sich ändern.',
    informationStatusText:
      'Vorläufige Ankündigung · Endgültige Vertrags- und Preisunterlagen noch offen',
    informationDate: 'November 2026',
    hasStandardProduct: true,
    hasFreeChoice: true,
    hasGuarantee: false,
    hasPublishedCosts: true,
    hasMissingFinalPricing: true,
    sources: [
      {
        label: 'Offizielle Anbieterseite: Scalable Capital Altersvorsorgedepot',
        url: 'https://de.scalable.capital/altersvorsorgedepot',
        isOfficial: true,
      },
      {
        label: 'Offizielle Mitteilung: Scalable Capital Newsroom',
        url: 'https://de.scalable.capital/newsroom/altersvorsorgedepot',
        isOfficial: true,
      },
    ],
  },
  {
    id: 'smartbroker',
    providerName: 'SMARTBROKER+',
    accessNote: 'Online-Broker',
    simplestConfirmedEntry:
      '0 € Depotgebühr und 0 € Sparpläne (exklusive marktüblicher Spreads und möglicher Zuwendungen); 100 % TER-Erstattung im Standardmodell für mindestens die ersten drei Jahre bis 25.000 € Anlagevolumen.',
    freeChoice:
      'Freie Variante angekündigt; gebührenfreie Einzelkäufe über Gettex erfordern in der Regel mindestens 500 € Ordervolumen (darunter kann 1 € Gebühr anfallen).',
    guarantee:
      'Kein Garantieprodukt angekündigt.',
    importantLimitation:
      'Die TER-Erstattung ist zeitlich (mindestens 3 Jahre) und auf 25.000 € Volumen begrenzt; eine spätere Erstattung kann von weiteren Bedingungen abhängen; Börsenspreads fallen weiterhin an.',
    informationStatusText:
      'Befristete Startaktion angekündigt · Dauerhafte Folgekonditionen noch offen',
    informationDate: 'November 2026',
    hasStandardProduct: true,
    hasFreeChoice: true,
    hasGuarantee: false,
    hasPublishedCosts: true,
    hasMissingFinalPricing: true,
    sources: [
      {
        label: 'Offizielle Anbieterseite: SMARTBROKER+ Altersvorsorgedepot',
        url: 'https://www.smartbrokerplus.de/de-de/altersvorsorgedepot/',
        isOfficial: true,
      },
      {
        label: 'Ergänzender Bericht: WirtschaftsWoche zu SMARTBROKER+',
        url: 'https://www.wiwo.de/vergleich/altersvorsorgedepot-smartbrokerplus/',
        isOfficial: false,
      },
    ],
  },
  {
    id: 'traderepublic',
    providerName: 'Trade Republic',
    accessNote: 'Digitaler Broker / Vollbank',
    simplestConfirmedEntry:
      '0 € Depotgebühr und 0 € Sparpläne; Standarddepot nach angekündigter Struktur kostenfrei, endgültige ETF-Zusammensetzung noch zu bestätigen.',
    freeChoice:
      'Auswahl aus ETFs, Staatsanleihen und aktiv verwalteten Fonds im zulässigen Rahmen; Produktkosten ausgewählter BlackRock-, Vanguard- und DWS-ETFs können erstattet und wiederangelegt werden.',
    guarantee:
      'Kein bestätigtes Garantieprodukt.',
    importantLimitation:
      '0 € Depotgebühr bedeutet nicht 0 € für alle Produkte: Die Kostenerstattung gilt nur für ausgewählte Partner-ETFs; andere Produkte, Einzeltransaktionen oder Spreads können Kosten verursachen.',
    informationStatusText:
      'Vorläufige Ankündigung · Endgültige ETF-Auswahl und Preisunterlagen fehlen noch',
    informationDate: 'November 2026',
    hasStandardProduct: true,
    hasFreeChoice: true,
    hasGuarantee: false,
    hasPublishedCosts: false,
    hasMissingFinalPricing: true,
    sources: [
      {
        label: 'Offizielle Anbieterseite: Trade Republic Altersvorsorgedepot',
        url: 'https://traderepublic.com/de-de/altersvorsorgedepot',
        isOfficial: true,
      },
      {
        label: 'Ergänzende Übersicht: Finanzfacts zu Trade Republic',
        url: 'https://finanzfacts.de/wiki/altersvorsorgedepot/anbieter/trade-republic/',
        isOfficial: false,
      },
    ],
  },
  {
    id: 'union-investment',
    providerName: 'Union Investment',
    accessNote: 'Vertrieb über Volksbanken und Raiffeisenbanken',
    simplestConfirmedEntry:
      'UniVorsorge Basis ca. 0,55 % p. a., gegebenenfalls zuzüglich Transaktionskosten.',
    freeChoice:
      'UniVorsorge Pro ca. 1,0 % p. a.',
    guarantee:
      'Geplantes Produkt mit 100 % Beitragsgarantie angekündigt.',
    importantLimitation:
      'Der endgültige Preis für das Garantieprodukt sowie die abschließenden Produktinformationsblätter und Transaktionskosten sind öffentlich noch nicht vollständig bestätigt.',
    informationStatusText:
      'Richtwerte für Basis/Pro bekannt · Endgültiger Preis für Garantieprodukt fehlt noch',
    informationDate: 'November 2026',
    hasStandardProduct: true,
    hasFreeChoice: true,
    hasGuarantee: true,
    hasPublishedCosts: true,
    hasMissingFinalPricing: true,
    sources: [
      {
        label: 'Offizielle Anbieterseite: Union Investment Altersvorsorgedepot',
        url: 'https://www.union-investment.de/familien-und-altersvorsorge/fuers-alter-vorsorgen/altersvorsorgedepot',
        isOfficial: true,
      },
      {
        label: 'Ergänzende Kostenübersicht: Zukunftsrechner zu Union Investment',
        url: 'https://zukunftsrechner.de/anbieter/union-investment',
        isOfficial: false,
      },
    ],
  },
];


export const LESSONS: LessonModule[] = [
  {
    id: 'grundlagen',
    route: '/grundlagen',
    order: 1,
    isCoreTopic: true,
    categoryLabel: 'Modul 01 · Fundament',
    title: 'Grundlagen der Geldanlage',
    shortTitle: 'Grundlagen',
    subtitle: 'Sparen vs. Investieren, Inflation, Notgroschen und Streuung.',
    oneLineDescription: 'Sparen, Inflation, Notgroschen und warum Streuung dich schützt.',
    readingMinutes: 4,
    hook: 'Warum verlieren 100 € mit der Zeit an Wert?',
    intro:
      'Bevor du den ersten Euro anlegst, brauchst du ein stabiles Fundament: Wann sparst du auf dem Konto, wann investierst du langfristig – und wie schützt du dich vor unnötigen Risiken?',
    steps: [
      {
        id: 'grundlagen-1-intro',
        type: 'intro',
        kicker: 'Modul 01 · Grundlagen',
        title: 'Warum verlieren 100 € mit der Zeit an Wert?',
        hook: '100 € auf dem Konto bleiben zwar 100 € – aber im Alltag bekommst du dafür später oft spürbar weniger.',
        body: 'In dieser kurzen Einheit lernst du den Unterschied zwischen Sparen und Investieren, warum du zuerst einen Notgroschen brauchst und wie Risikostreuung funktioniert.',
        visual: 'purchasing-power',
        ctaLabel: 'Lektion starten',
      },
      {
        id: 'grundlagen-2-compare',
        type: 'comparison',
        kicker: 'Konzept 1 · Zwei Werkzeuge',
        title: 'Sparen oder investieren?',
        body: 'Beide Wege sind wichtig – sie erfüllen aber völlig unterschiedliche Aufgaben in deinem Leben.',
        leftCard: {
          label: 'Kurzfristig · 0–3 Jahre',
          title: 'Sparen (Tagesgeld)',
          badge: 'Sicher & verfügbar',
          tone: 'neutral',
          points: [
            'Geld bleibt jederzeit griffbereit',
            'Keine Kursschwankungen (100 € bleiben 100 €)',
            'Für Notgroschen, Urlaub oder Führerschein',
          ],
        },
        rightCard: {
          label: 'Langfristig · ab 10 Jahren',
          title: 'Investieren (z. B. Welt-ETF)',
          badge: 'Wachstumschance',
          tone: 'accent',
          points: [
            'Geld arbeitet langfristig in Unternehmen mit',
            'Höhere Ertragschancen über viele Jahre',
            'Kurse können zwischendurch deutlich schwanken',
          ],
        },
        takeaway: 'Kurzfristige Ziele gehören aufs sichere Konto. Nur langfristig freies Geld gehört an die Börse.',
        moreInfo: {
          title: 'Was bedeutet Einlagensicherung?',
          points: [
            'Auf Giro-, Tagesgeld- und Festgeldkonten sind Guthaben in der EU gesetzlich bis zu 100.000 € pro Person und Bank geschützt.',
            'An der Börse gibt es dagegen keine Kursgarantie: Wertpapiere können im Wert steigen, aber auch fallen.',
          ],
        },
      },
      {
        id: 'grundlagen-3-scenario-1000',
        type: 'scenario',
        kicker: 'Verständnis-Check · Zeithorizont',
        title: 'Wohin mit kurzfristigem Geld?',
        personTag: 'Alltags-Entscheidung',
        situation: 'Du hast 1.000 € gespart, die du in genau sechs Monaten sicher für deinen Führerschein oder eine Reise brauchst.',
        contextFacts: [
          { label: 'Betrag', value: '1.000 €' },
          { label: 'Zeitpunkt', value: 'in 6 Monaten' },
        ],
        question: 'Du brauchst 1.000 € in sechs Monaten. Wo gehört das Geld hin?',
        options: [
          'Auf ein Tagesgeldkonto ohne Kursschwankungen',
          'In eine einzelne bekannte Tech-Aktie',
          'In Kryptowährungen, weil sie rund um die Uhr handelbar sind',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Richtig. Geld, das du bald brauchst, sollte keinen starken Kursschwankungen ausgesetzt sein.',
        explanationWrong:
          'Noch nicht ganz. Eine einzelne Aktie oder Kryptowährung kann genau dann im Minus sein, wenn du das Geld in sechs Monaten brauchst.',
      },
      {
        id: 'grundlagen-4-inflation',
        type: 'interactive',
        kicker: 'Konzept 2 · Kaufkraft',
        title: 'Inflation: Gleiche Zahl, weniger im Einkaufswagen',
        body: '100 € bleiben auf dem Konto 100 €. Wenn Preise steigen, kannst du dir später trotzdem weniger dafür kaufen. Probier es mit dem Regler aus:',
        widget: 'inflation-slider',
        moreInfo: {
          title: 'Warum strebt die Zentralbank ca. 2 % Inflation an?',
          points: [
            'Die Europäische Zentralbank (EZB) hält eine jährliche Preissteigerung von rund 2 % für gesund für die Wirtschaft.',
            'Für unverzinstes Bargeld bedeutet selbst diese normale Inflation nach 10 Jahren rund 18 % weniger reale Kaufkraft.',
          ],
          sourceNote: 'Quelle: Deutsche Bundesbank / EZB',
        },
      },
      {
        id: 'grundlagen-5-inflation-check',
        type: 'question',
        kicker: 'Kurz-Check · Inflation',
        title: 'Was passiert auf dem Girokonto?',
        question: 'Auf deinem Girokonto liegen 100 € zu 0 % Zinsen. Die Inflation beträgt 3 % pro Jahr. Was stimmt?',
        options: [
          'Die Bank bucht jedes Jahr 3 € Gebühr ab.',
          'Auf dem Konto stehen weiter 100 €, aber deine Kaufkraft sinkt.',
          'Deine Kaufkraft steigt automatisch mit den Preisen.',
        ],
        correctIndex: 1,
        explanationCorrect:
          'Genau richtig. Der Kontostand bleibt bei 100 €, aber weil Waren und Tickets teurer werden, bekommst du real weniger dafür.',
        explanationWrong:
          'Nicht ganz: Die Zahl auf dem Konto bleibt zwar 100 €, aber durch steigende Preise sinkt das, was du dir real davon kaufen kannst.',
      },
      {
        id: 'grundlagen-6-notgroschen',
        type: 'explanation',
        kicker: 'Konzept 3 · Sicherheitsreserve',
        title: 'Erst der Notgroschen, dann die Börse',
        body: 'Dein Laptop geht kurz vor den Prüfungen kaputt oder das Handy muss repariert werden. Mit einem Notgroschen auf dem Tagesgeldkonto bezahlst du solche Kosten entspannt – ohne Wertpapiere im Minus verkaufen zu müssen.',
        highlightPoint: 'Orientierung für junge Leute: 500 € bis 1.500 € (ca. 2–3 Monatsausgaben) als eiserne Reserve.',
        visual: 'emergency-shield',
        moreInfo: {
          title: 'Wie baue ich den Notgroschen am besten auf?',
          points: [
            'Nutze ein kostenloses Tagesgeldkonto getrennt von deinem normalen Girokonto, damit du die Reserve nicht aus Versehen im Alltag ausgibst.',
            'Solange dein Notgroschen noch nicht steht, hat er Vorrang vor jedem Börsen-Sparplan.',
          ],
        },
      },
      {
        id: 'grundlagen-7-diversifikation',
        type: 'visual_choice',
        kicker: 'Konzept 4 · Risikostreuung',
        title: 'Diversifikation: Nicht alles auf eine Karte',
        question: 'Welcher Aufbau schützt dich besser, falls ein einzelnes Unternehmen in eine Krise gerät?',
        options: [
          {
            id: 'single',
            label: '1 Einzelposition',
            subtitle: '100 % in eine einzige bekannte Firma',
            visualType: 'single-concentration',
            metrics: ['1 Unternehmen', '1 Branche', 'Hohes Klumpenrisiko'],
          },
          {
            id: 'basket',
            label: 'Breit gestreuter Korb',
            subtitle: 'Verteilt auf hunderte Firmen weltweit',
            visualType: 'diversified-basket',
            metrics: ['Viele Unternehmen', 'Viele Branchen & Länder', 'Einzelrisiko abgefedert'],
          },
        ],
        correctIndex: 1,
        explanationCorrect:
          'Richtig. Wenn dein Geld breit über viele Unternehmen, Branchen und Länder verteilt ist, fängt die Gesamtanlage den Ausfall einzelner Firmen ab.',
        explanationWrong:
          'Vorsicht: Wer alles auf eine einzige Firma setzt, trägt ein hohes Klumpenrisiko. Geht genau diese Firma baden, leidet dein gesamtes Geld.',
        moreInfo: {
          title: 'Warnsignal bei Finanz-Tipps auf Social Media',
          points: [
            'Höhere Renditechancen gibt es an den Finanzmärkten nur mit Kursschwankungen.',
            'Verspricht jemand „hohe Gewinne ohne jedes Risiko in kurzer Zeit“, handelt es sich fast immer um unseriöse Werbung oder Betrug.',
          ],
          sourceNote: 'Quelle: BaFin Verbraucherwarnungen',
        },
      },
      {
        id: 'grundlagen-8-leonie',
        type: 'scenario',
        kicker: 'Praxis-Entscheidung · Leonie (17)',
        title: 'Wie sollte Leonie ihr Geld aufteilen?',
        personTag: 'Leonie · 17 Jahre · Schülerin mit Ferienjob',
        situation: 'Leonie hat durch Ferienjobs 1.800 € angespart. In 8 Monaten muss sie ihren Führerschein bezahlen (ca. 1.400 €). Die übrigen 400 € sind ihre einzige Reserve.',
        contextFacts: [
          { label: 'Erspartes', value: '1.800 €' },
          { label: 'Führerschein (in 8 Mon.)', value: '1.400 €' },
          { label: 'Rest-Reserve', value: '400 €' },
        ],
        question: 'Welche Entscheidung ist für Leonie jetzt am sinnvollsten?',
        options: [
          'Die gesamten 1.800 € sicher auf dem Tagesgeldkonto lassen, bis der Führerschein bezahlt ist',
          'Die 1.800 € sofort für 8 Monate in einen Aktien-ETF investieren',
          'Die 400 € Reserve in Einzelaktien stecken, um schneller mehr Geld zu haben',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Perfekt entschieden! Weil Leonie die 1.400 € schon in 8 Monaten sicher braucht und die 400 € ihr Notgroschen sind, bleibt das Geld auf dem Tagesgeldkonto. Einen kleinen ETF-Sparplan startet sie erst später mit neuem, langfristig freiem Geld.',
        explanationWrong:
          'Denk an den Zeithorizont: In 8 Monaten kann auch ein ETF im Minus stehen, und die 400 € braucht Leonie als Notgroschen. Kurzfristig geplantes Geld bleibt auf dem Tagesgeldkonto.',
      },
      {
        id: 'grundlagen-9-completion',
        type: 'completion',
        kicker: 'Modul 01 abgeschlossen',
        title: 'Stark! Dein Fundament steht.',
        body: 'Du kennst jetzt die vier wichtigsten Grundregeln jeder soliden Finanzplanung.',
        summaryPoints: [
          'Sparen (Tagesgeld) sichert kurzfristige Ziele; Investieren braucht Zeit (10+ Jahre).',
          'Inflation senkt über die Jahre die reale Kaufkraft von unverzinstem Geld.',
          'Ein Notgroschen (ca. 2–3 Monatsausgaben) schützt dich vor ungeplanten Kosten.',
          'Breite Streuung (Diversifikation) vermeidet gefährliche Klumpenrisiken.',
        ],
        depotBridge: {
          label: 'Streuung im Depot ansehen',
          description: 'Schau dir im virtuellen Übungsdepot an, wie sich eine Einzelaktie und ein Welt-ETF im Gewicht unterscheiden.',
          to: '/depot',
        },
      },
    ],
    sections: [
      {
        heading: '1. Der Unterschied zwischen Sparen und Investieren',
        paragraphs: [
          'Beim klassischen Sparen legst du Geld auf ein sicheres Konto (z. B. Girokonto oder Tagesgeld). Der Betrag schwankt nicht – 500 € bleiben genau 500 € plus eventuelle Zinsen.',
          'Beim Investieren kaufst du Werte wie Unternehmensanteile (Aktien/ETFs) oder Anleihen. Langfristig bietet das höhere Ertragschancen, kurzfristig kann der Wert aber spürbar schwanken.',
        ],
      },
      {
        heading: '2. Inflation und Notgroschen',
        paragraphs: [
          'Steigen die Preise im Alltag (Inflation), bekommst du für denselben Euro-Betrag später weniger. Bei 2 % Inflation haben 100 € nach 10 Jahren nur noch rund 82 € Kaufkraft.',
          'Bevor du langfristig investierst, brauchst du einen jederzeit verfügbaren Notgroschen auf dem Tagesgeldkonto, und an der Börse streust du dein Geld breit (Diversifikation).',
        ],
      },
    ],
    practicalExample: {
      title: 'Praxisbeispiel: Leonie (17) plant Führerschein und Zukunft',
      scenario:
        'Leonie hat durch Ferienjobs 1.800 € angespart. In 8 Monaten möchte sie ihren Führerschein bezahlen (ca. 1.400 €). Die restlichen 400 € sind ihre Reserve.',
      takeaway:
        'Weil Leonie das Geld schon in wenigen Monaten sicher braucht, gehört es auf ein Tagesgeldkonto – nicht in Aktien oder ETFs.',
    },
    interactiveType: 'inflation',
    merkeSummary: [
      'Sparen sichert kurzfristige Ziele; Investieren dient dem langfristigen Vermögensaufbau.',
      'Inflation verringert über die Jahre die Kaufkraft von unverzinstem Bargeld.',
      'Geld für die nächsten 3–5 Jahre gehört auf ein sicheres Konto (Notgroschen), nicht an die Börse.',
      'Breite Streuung (Diversifikation) senkt das Risiko einzelner Fehlgriffe deutlich.',
    ],
    quiz: [
      {
        id: 'grundlagen-q1',
        question: 'Was passiert bei einer jährlichen Inflation von 3 %, wenn dein Geld zu 0 % Zinsen auf dem Girokonto liegt?',
        options: [
          'Der Euro-Betrag auf dem Konto wird jedes Jahr automatisch um 3 % abgebucht.',
          'Der Betrag auf dem Konto bleibt gleich, aber du kannst dir davon im Alltag weniger kaufen.',
          'Dein Geld gewinnt an Kaufkraft, weil Preise sinken.',
        ],
        correctIndex: 1,
        explanationCorrect:
          'Genau richtig! Die Zahl auf dem Konto bleibt identisch, aber durch steigende Preise sinkt die reale Kaufkraft.',
        explanationWrong:
          'Nicht ganz: Die Bank zieht dir kein Geld ab, aber weil Waren teurer werden, bekommst du für denselben Betrag weniger.',
      },
      {
        id: 'grundlagen-q2',
        question: 'Du brauchst 1.000 € in sechs Monaten. Wo gehört das Geld hin?',
        options: [
          'In eine einzelne Tech-Aktie, damit es sich schnell verdoppelt.',
          'In Kryptowährungen, weil man die jederzeit verkaufen kann.',
          'Auf ein sicheres Tagesgeldkonto ohne Kursschwankungen.',
        ],
        correctIndex: 2,
        explanationCorrect:
          'Richtig. Geld, das du bald brauchst, sollte keinen starken Kursschwankungen ausgesetzt sein.',
        explanationWrong:
          'Noch nicht ganz. Eine einzelne Aktie kann genau dann im Minus sein, wenn du das Geld brauchst.',
      },
      {
        id: 'grundlagen-q3',
        question: 'Was bedeutet „Diversifikation“ (Risikostreuung) bei der Geldanlage?',
        options: [
          'Man verteilt sein Geld auf viele verschiedene Unternehmen, Branchen und Länder.',
          'Man wechselt jeden Tag die Bank, um Bonusprämien mitzunehmen.',
          'Man investiert sein gesamtes Geld in das aktuell bekannteste Unternehmen.',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Perfekt! Durch breite Streuung fängt die Gesamtanlage es auf, falls einzelne Unternehmen schlecht laufen.',
        explanationWrong:
          'Diversifikation heißt „nicht alles auf eine Karte setzen“: Du verteilst dein Geld breit auf viele Unternehmen und Regionen.',
      },
    ],
    nextRoute: '/zinseszins',
  },
  {
    id: 'zinseszins',
    route: '/zinseszins',
    order: 2,
    isCoreTopic: true,
    categoryLabel: 'Modul 02 · Zeit & Wachstum',
    title: 'Der Zinseszins-Effekt',
    shortTitle: 'Zinseszins',
    subtitle: 'Warum Zeit dein größter Verbündeter ist – und wie Erträge mitwachsen.',
    oneLineDescription: 'Warum Zeit wichtiger ist als ein hoher Startbetrag.',
    readingMinutes: 4,
    hook: 'Wie werden aus kleinen Monatsraten über Jahrzehnte große Summen?',
    intro:
      'Der Zinseszins ist der stärkste Hebel beim langfristigen Sparen: Wenn deine Erträge angelegt bleiben, erwirtschaften sie in den Folgejahren selbst wieder neue Erträge.',
    steps: [
      {
        id: 'zinseszins-1-intro',
        type: 'intro',
        kicker: 'Modul 02 · Zinseszins',
        title: 'Wenn Erträge eigene Erträge verdienen',
        hook: 'Nicht die Höhe deiner ersten Sparrate ist entscheidend – sondern wie lange dein Geld Zeit hat zu arbeiten.',
        body: 'In dieser Lektion siehst du, wie aus 25 Cent im zweiten Jahr über Jahrzehnte ein kräftiger Wachstumsmotor wird.',
        visual: 'compound-curve',
        ctaLabel: 'Lektion starten',
      },
      {
        id: 'zinseszins-2-prinzip',
        type: 'explanation',
        kicker: 'Konzept 1 · Das Prinzip',
        title: 'Zinsen auf deine Zinsen',
        body: 'Legst du 100 € zu 5 % Rendite pro Jahr an, hast du nach einem Jahr 105 €. Im zweiten Jahr bekommst du 5 % auf die vollen 105 € – also 5,25 € dazu (Endstand: 110,25 €).',
        highlightPoint: 'Diese zusätzlichen 0,25 € wirken winzig – sind aber der Beginn des Zinseszins-Effekts.',
        visual: 'snowball-effect',
        moreInfo: {
          title: 'Wann entsteht ein Zinseszins-Effekt?',
          points: [
            'Auf einem Tagesgeldkonto, wenn gutgeschriebene Zinsen auf dem Konto bleiben.',
            'Bei breit gestreuten ETFs oder Aktien, wenn Dividenden wieder angelegt werden (thesaurierend) und Unternehmensgewinne über Jahre weiterwachsen.',
          ],
        },
      },
      {
        id: 'zinseszins-3-check1',
        type: 'question',
        kicker: 'Verständnis-Check · Jahr 2',
        title: 'Rechne kurz nach',
        question: 'Du legst 100 € zu 5 % pro Jahr an und lässt die Erträge liegen. Wie viel hast du nach 2 Jahren?',
        options: [
          'Genau 110,00 € (jedes Jahr 5,00 €)',
          '110,25 €, weil im zweiten Jahr auch die 5 € Ertrag mitwachsen',
          '105,00 €, weil Zinsen nur einmal gezahlt werden',
        ],
        correctIndex: 1,
        explanationCorrect:
          'Richtig. Im zweiten Jahr werden die vollen 105 € verzinst (5 % von 105 € = 5,25 €).',
        explanationWrong:
          'Noch nicht ganz: Nach Jahr 1 hast du 105 €. Im zweiten Jahr gibt es 5 % auf die 105 €, also 5,25 € dazu – zusammen 110,25 €.',
      },
      {
        id: 'zinseszins-4-interactive',
        type: 'interactive',
        kicker: 'Konzept 2 · Selbst ausprobieren',
        title: 'Erst flach, später steil',
        body: 'In den ersten 5 Jahren besteht dein Guthaben fast nur aus deinen Einzahlungen. Verschiebe die Anlagedauer auf 25 oder 35 Jahre und beobachte den dunkelgrünen Ertragsbalken:',
        widget: 'compound-slider',
        moreInfo: {
          title: 'Modellrechnung vs. echte Börsenkurse',
          points: [
            'Ein Zinseszins-Rechner rechnet mit einer glatten Durchschnittsrendite pro Jahr (z. B. 6 % p.a.).',
            'An der Börse verlaufen Kurse niemals geradlinig: Es gibt Jahre mit +15 % und Jahre mit −10 %. Die Rendite ist eine unverbindliche Annahme, keine Garantie.',
          ],
        },
      },
      {
        id: 'zinseszins-5-compare-noah',
        type: 'comparison',
        kicker: 'Konzept 3 · Der Faktor Zeit',
        title: 'Früh starten schlägt später viel einzahlen',
        body: 'Noah legt monatlich 40 € an (angenommene 6 % Rendite p.a.). Schau dir den Unterschied bis zum 47. Geburtstag an:',
        leftCard: {
          label: 'Start mit 17 Jahren (30 Jahre)',
          title: 'Rund 40.180 € Endwert',
          badge: '10 Jahre Vorsprung',
          tone: 'accent',
          points: [
            'Eigene Einzahlung: 14.400 €',
            'Rechnerischer Ertrag: +25.780 €',
            'Der Ertrag übersteigt die Einzahlung deutlich',
          ],
        },
        rightCard: {
          label: 'Start erst mit 27 Jahren (20 Jahre)',
          title: 'Rund 18.480 € Endwert',
          badge: 'Halbierter Endwert',
          tone: 'neutral',
          points: [
            'Eigene Einzahlung: 9.600 € (nur 4.800 € weniger)',
            'Rechnerischer Ertrag: +8.880 €',
            'Es fehlen 10 entscheidende Wachstumsjahre',
          ],
        },
        takeaway: 'Wer 10 Jahre früher mit kleinen Beträgen startet, zahlt nur wenig mehr ein, hat am Ende aber oft mehr als doppelt so viel.',
      },
      {
        id: 'zinseszins-6-scenario',
        type: 'scenario',
        kicker: 'Praxis-Szenario · Erwartungscheck',
        title: 'Geduld in den ersten Jahren',
        personTag: 'Lukas · 18 Jahre · 18 Monate Sparplan',
        situation: 'Lukas spart seit anderthalb Jahren jeden Monat 30 € in einen Welt-ETF. Er schaut ins Depot und sagt: „Der Zinseszins bringt ja kaum etwas, bisher ist fast alles nur mein eigenes eingezahltes Geld.“',
        contextFacts: [
          { label: 'Laufzeit bisher', value: '1,5 Jahre' },
          { label: 'Sparrate', value: '30 € / Monat' },
        ],
        question: 'Was erklärst du Lukas?',
        options: [
          'Das ist völlig normal: Der Zinseszins wirkt exponentiell und wird erst nach 10 bis 20 Jahren richtig stark.',
          'Er sollte den Sparplan sofort abbrechen, weil Zinseszins schon im ersten Monat das Geld verdoppeln müsste.',
          'Er muss jeden Monat das Wertpapier wechseln, damit der Zinseszins startet.',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Richtig. In den ersten Jahren legst du die Basis. Erst wenn über viele Jahre Erträge auf Erträge wachsen, wird die Kurve steil.',
        explanationWrong:
          'Geduld ist der Schlüssel: Nach 18 Monaten ist die Basis noch klein. Der Zinseszins entfaltet seine Kraft erst über 10, 20 und mehr Jahre.',
      },
      {
        id: 'zinseszins-7-check2',
        type: 'question',
        kicker: 'Wissens-Check · Rechner verstehen',
        title: 'Annahme statt Garantie',
        question: 'Warum zeigt der Zinseszins-Rechner bei 6 % Rendite p.a. eine Schätzung und kein festes Versprechen?',
        options: [
          'Weil Börsenkurse in der Realität schwanken und zukünftige Renditen nicht garantiert sind.',
          'Weil Banken Zinsen jedes Jahr auswürfeln.',
          'Weil der Rechner keine großen Zahlen addieren kann.',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Genau richtig. Der Rechner zeigt eine gleichmäßige Modellrechnung zur Orientierung – an der Börse schwanken Kurse von Jahr zu Jahr.',
        explanationWrong:
          'Merke dir: Ein Rechner nutzt eine geglättete Durchschnittsannahme. Echte Marktrenditen schwanken und sind niemals garantiert.',
      },
      {
        id: 'zinseszins-8-completion',
        type: 'completion',
        kicker: 'Modul 02 abgeschlossen',
        title: 'Du hast den Faktor Zeit gemeistert!',
        body: 'Du weißt jetzt, warum frühes Anfangen mit kleinen Beträgen langfristig den größten Unterschied macht. Im Altersvorsorgedepot können neben deinen eigenen Beiträgen auch staatliche Zulagen langfristig mitinvestiert werden. Die tatsächliche Entwicklung hängt von Rendite, Kosten und Laufzeit ab.',
        summaryPoints: [
          'Zinseszins entsteht, wenn Erträge angelegt bleiben und selbst neue Erträge erwirtschaften.',
          'Zeit ist der wichtigste Hebel: Die Kurve startet flach und wird nach 10–25 Jahren steil.',
          'Im Altersvorsorgedepot können neben deinen eigenen Beiträgen auch staatliche Zulagen langfristig mitinvestiert werden. Die tatsächliche Entwicklung hängt von Rendite, Kosten und Laufzeit ab.',
          'Rechner zeigen geglättete Modellwerte vor Steuern, Kosten und Kursschwankungen.',
        ],
        depotBridge: {
          label: 'Im Zinseszins- & Vorsorgedepot-Rechner testen',
          description: 'Probiere deine eigene Wunschrate sowie den Altersvorsorgedepot-Modus mit Zulagen und Kosten im Rechner aus.',
          to: '/rechner',
        },
      },
    ],
    sections: [
      {
        heading: '1. Zinsen auf deine Zinsen – das Grundprinzip',
        paragraphs: [
          'Legst du 100 € zu 5 % jährlicher Rendite an, hast du nach dem ersten Jahr 105 €. Im zweiten Jahr werden die 5 % auf die gesamten 105 € berechnet (= 110,25 €).',
          'Nach 15 oder 25 Jahren wird der angesammelte Ertrag so groß, dass er jedes Jahr mehr neues Wachstum erzeugt als deine eigenen Einzahlungen.',
        ],
      },
      {
        heading: '2. Eigene Einzahlungen, Zulagen & Wertzuwachs',
        paragraphs: [
          'Unterscheide immer deine eigenen Einzahlungen vom geschätzten Ertrag. An der Börse verläuft Wachstum wellenförmig – ein Rechner nutzt einen geglätteten Durchschnittswert.',
          'Im Altersvorsorgedepot können neben deinen eigenen Beiträgen auch staatliche Zulagen langfristig mitinvestiert werden. Die tatsächliche Entwicklung hängt von Rendite, Kosten und Laufzeit ab.',
        ],
      },
    ],
    practicalExample: {
      title: 'Praxisbeispiel: Früh starten (mit 17) vs. später starten (mit 27)',
      scenario:
        'Noah startet mit 17 Jahren einen Sparplan über 40 € im Monat (6 % p.a.). Bis 47 (30 Jahre) zahlt er 14.400 € ein und erreicht rechnerisch rund 40.180 €.',
      takeaway:
        'Startet er erst mit 27 (20 Jahre), zahlt er 9.600 € ein, kommt aber nur auf rund 18.480 €.',
    },
    interactiveType: 'compound-preview',
    merkeSummary: [
      'Zinseszins entsteht, wenn erwirtschaftete Zinsen oder Erträge direkt weiter angelegt bleiben.',
      'Zeit ist wichtiger als die Höhe der ersten Sparrate.',
      'Im Altersvorsorgedepot können neben deinen eigenen Beiträgen auch staatliche Zulagen langfristig mitinvestiert werden. Die tatsächliche Entwicklung hängt von Rendite, Kosten und Laufzeit ab.',
      'Rechenmodelle zeigen glatte Durchschnittskurven – an der Börse schwanken reale Kurse.',
    ],
    quiz: [
      {
        id: 'zinseszins-q1',
        question: 'Du legst 100 € zu 5 % Zinsen pro Jahr an und lässt die Zinsen auf dem Konto. Wie viel hast du nach genau 2 Jahren?',
        options: [
          'Genau 110,00 € (jedes Jahr 5,00 €).',
          '110,25 €, weil im zweiten Jahr auch die 5 € Zinsen aus dem ersten Jahr mitverzinst werden.',
          '105,00 €, weil Zinsen nur einmalig gezahlt werden.',
        ],
        correctIndex: 1,
        explanationCorrect:
          'Exakt! Im 2. Jahr gibt es 5 % auf 105 € (= 5,25 €). Die zusätzlichen 25 Cent sind der Zinseszins.',
        explanationWrong:
          'Schau genau hin: Nach Jahr 1 hast du 105 €. Im 2. Jahr bekommst du 5 % auf die vollen 105 €, also 5,25 € dazu.',
      },
      {
        id: 'zinseszins-q2',
        question: 'Welcher Faktor verstärkt den Zinseszins-Effekt auf lange Sicht am stärksten?',
        options: [
          'Eine möglichst lange Anlagedauer (Zeit), in der die Erträge ungestört weiterarbeiten können.',
          'Das ständige Ein- und Auszahlen des Geldes jeden Monat.',
          'Ein möglichst häufiger Wechsel zwischen verschiedenen Konten.',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Richtig! Je länger das Geld angelegt bleibt, desto stärker wächst der Anteil der Zinseszinsen.',
        explanationWrong:
          'Der entscheidende Hebel beim Zinseszins ist die Zeit.',
      },
      {
        id: 'zinseszins-q3',
        question: 'Warum zeigt ein Zinseszins-Rechner bei 6 % angenommener ETF-Rendite nur eine Schätzung und keine Garantie?',
        options: [
          'Weil Taschenrechner keine Prozentrechnung beherrschen.',
          'Weil Börsenkurse in der Realität schwanken und zukünftige Renditen nicht feststehen.',
          'Weil Banken die Zinsen jedes Jahr zufällig auswürfeln.',
        ],
        correctIndex: 1,
        explanationCorrect:
          'Vollkommen richtig! Ein Rechner rechnet mit einem konstanten Durchschnittswert.',
        explanationWrong:
          'Der Rechner nutzt eine gleichmäßige Durchschnittsannahme. Echte Börsenrenditen schwanken.',
      },
    ],
    nextRoute: '/anlageklassen',
  },
  {
    id: 'anlageklassen',
    route: '/anlageklassen',
    order: 3,
    isCoreTopic: true,
    categoryLabel: 'Modul 03 · Bausteine',
    title: 'Anlageklassen im Überblick',
    shortTitle: 'Anlageklassen',
    subtitle: 'Tagesgeld, Anleihen, Aktien, ETFs, Immobilien, Gold & Krypto vergleichen.',
    oneLineDescription: 'Tagesgeld, ETFs, Aktien, Anleihen, Gold & Krypto sachlich einordnen.',
    readingMinutes: 5,
    hook: 'Worin unterscheiden sich Tagesgeld, ein Welt-ETF und eine Einzelaktie?',
    intro:
      'Nicht jede Geldanlage funktioniert gleich: Manche Bausteine halten dein Geld stabil, andere schwanken stärker, bieten dafür aber langfristige Wachstumschancen.',
    steps: [
      {
        id: 'anlageklassen-1-intro',
        type: 'intro',
        kicker: 'Modul 03 · Anlageklassen',
        title: 'Sieben Bausteine – klare Unterschiede',
        hook: 'Wer die Spielregeln von Tagesgeld, ETFs, Aktien und Krypto kennt, fällt nicht auf falsche Versprechen herein.',
        body: 'Hier lernst du, wie du jede Anlageform anhand von Risiko, Schwankung und Verfügbarkeit (Liquidität) einordnest.',
        visual: 'asset-blocks',
        ctaLabel: 'Lektion starten',
      },
      {
        id: 'anlageklassen-2-compare-etf-stock',
        type: 'comparison',
        kicker: 'Konzept 1 · Börsen-Bausteine',
        title: 'Einzelaktie vs. breit gestreuter ETF',
        body: 'An der Börse kannst du entweder einzelne Firmen auswählen oder mit einem ETF gleich einen ganzen Marktindex kaufen.',
        leftCard: {
          label: 'Einzelaktie',
          title: '1 einzelnes Unternehmen',
          badge: 'Hohes Einzelrisiko',
          tone: 'warning',
          points: [
            'Du bist Miteigentümer einer einzigen Firma',
            'Starke Kursausschläge nach oben und unten',
            'Gerät diese Firma in Not, leidet dein Einsatz',
          ],
        },
        rightCard: {
          label: 'Welt-ETF (Indexfonds)',
          title: 'Hunderte Firmen im Paket',
          badge: 'Breite Streuung',
          tone: 'accent',
          points: [
            'Bündelt z. B. über 1.000 Unternehmen weltweit',
            'Sehr niedrige laufende Kosten (ca. 0,1–0,3 % p.a.)',
            'Schwankt mit dem Gesamtmarkt, aber ohne Einzelpleite-Schock',
          ],
        },
        takeaway: 'Ein breit gestreuter ETF nimmt dir das Risiko ab, auf die falsche Einzelfirma zu setzen – braucht aber trotzdem 10+ Jahre Zeit.',
      },
      {
        id: 'anlageklassen-3-inspector',
        type: 'interactive',
        kicker: 'Konzept 2 · Direktvergleich',
        title: 'Alle 7 Anlageklassen prüfen',
        body: 'Tippe auf die Anlageklassen, um Risikostufe (1 bis 5), typische Wertschwankung und Verfügbarkeit zu vergleichen:',
        widget: 'asset-inspector',
        moreInfo: {
          title: 'Anlageklassen im geförderten Altersvorsorgedepot',
          points: [
            'Nicht jede Anlageklasse ist automatisch in einem geförderten Altersvorsorgedepot zulässig. Entscheidend sind die gesetzlichen Vorgaben, die Zertifizierung und die Produktauswahl des Anbieters.',
            'Spekulative Krypto-Assets oder physisches Gold im eigenen Tresor gehören beispielsweise nicht zu den typischen zertifizierten Standardbausteinen.',
          ],
        },
      },
      {
        id: 'anlageklassen-4-check-etf',
        type: 'question',
        kicker: 'Verständnis-Check · ETF',
        title: 'Was leistet ein Welt-ETF?',
        question: 'Was ist der wichtigste Vorteil eines breit gestreuten Welt-ETFs gegenüber einer einzelnen Aktie?',
        options: [
          'Ein ETF darf gesetzlich niemals im Kurs fallen.',
          'Dein Geld wird automatisch auf viele Unternehmen verteilt, sodass eine einzelne Firmenkrise nicht alles gefährdet.',
          'Ein ETF verdoppelt dein Geld garantiert jedes Jahr.',
        ],
        correctIndex: 1,
        explanationCorrect:
          'Richtig. Ein ETF schwankt zwar mit dem Gesamtmarkt, verteilt dein Risiko aber sofort auf hunderte Unternehmen.',
        explanationWrong:
          'Achtung: Auch ETFs schwanken und bieten keine Gewinn-Garantie. Ihr Vorteil gegenüber einer Einzelaktie ist die breite Risikostreuung.',
      },
      {
        id: 'anlageklassen-5-sachwerte',
        type: 'explanation',
        kicker: 'Konzept 3 · Gold, Immobilien & Krypto',
        title: 'Warum nicht alles glänzt',
        body: 'Immobilien binden viel Geld und sind unflexibel. Gold zahlt weder Zinsen noch Dividenden. Und Kryptowährungen wie Bitcoin schwanken extrem (oft −50 % bis −90 %) und sind reine Spekulation. Nicht jede Anlageklasse ist automatisch in einem geförderten Altersvorsorgedepot zulässig. Entscheidend sind die gesetzlichen Vorgaben, die Zertifizierung und die Produktauswahl des Anbieters.',
        highlightPoint: 'Liquidität heißt: Wie schnell kommst du ohne hohe Abschläge wieder an dein Geld?',
        moreInfo: {
          title: 'Detaillierte Einordnung für 16- bis 20-Jährige',
          points: [
            'Immobilien: Beim Direktkauf fallen oft 8–12 % Kaufnebenkosten (Steuer, Notar, Makler) an, und ein Verkauf dauert Monate.',
            'Gold: Kein laufender Zinseszins-Effekt, da Gold keine Zinsen oder Dividenden ausschüttet.',
            'Krypto: Keine Einlagensicherung. Verlust des Zugangs-Schlüssels (Seed Phrase) bedeutet Totalverlust.',
            'Nicht jede Anlageklasse ist automatisch in einem geförderten Altersvorsorgedepot zulässig. Entscheidend sind die gesetzlichen Vorgaben, die Zertifizierung und die Produktauswahl des Anbieters.',
          ],
        },
      },
      {
        id: 'anlageklassen-6-check-gold',
        type: 'question',
        kicker: 'Kurz-Check · Eigenschaften',
        title: 'Gold & Liquidität verstehen',
        question: 'Welche Aussage über Gold und Tagesgeld ist zutreffend?',
        options: [
          'Gold zahlt jedes Quartal feste Zinsen auf dein Konto.',
          'Gold zahlt keine Zinsen oder Dividenden; Tagesgeld ist dagegen täglich verfügbar (hohe Liquidität).',
          'Tagesgeld ist mindestens 10 Jahre fest gesperrt.',
        ],
        correctIndex: 1,
        explanationCorrect:
          'Genau richtig. Gold erwirtschaftet keine laufenden Zinsen, während Tagesgeld jederzeit flexibel verfügbar ist.',
        explanationWrong:
          'Merke: Gold zahlt weder Zinsen noch Dividenden. Tagesgeld hat dagegen eine sehr hohe Liquidität (täglich verfügbar).',
      },
      {
        id: 'anlageklassen-7-scenario-samira',
        type: 'scenario',
        kicker: 'Praxis-Entscheidung · Samira (19)',
        title: 'Zwei Töpfe für zwei Ziele',
        personTag: 'Samira · 19 Jahre · Studentin',
        situation: 'Samira hat 1.000 € als Sicherheitsreserve angespart. Zusätzlich möchte sie jeden Monat 35 € für ihre Zukunft in 15+ Jahren zurücklegen.',
        contextFacts: [
          { label: 'Notgroschen', value: '1.000 €' },
          { label: 'Monatlich frei', value: '35 € (15+ Jahre)' },
        ],
        question: 'Wie kombiniert Samira die Anlageklassen sinnvoll?',
        options: [
          '1.000 € Notgroschen auf dem Tagesgeldkonto lassen und die 35 € monatlich in einen weltweit gestreuten ETF-Sparplan investieren',
          'Die 1.000 € und die 35 € komplett in eine einzige Mode-Aktie stecken',
          'Alles für 10 Jahre in einem unflexiblen Vertrag festschließen',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Richtig! Topf 1 (Sicherheit) bleibt schwankungsfrei auf dem Tagesgeld. Topf 2 (Langfrist-Wachstum) nutzt die breite Streuung eines Welt-ETFs.',
        explanationWrong:
          'Ihr Notgroschen (1.000 €) darf nicht schwanken und gehört aufs Tagesgeld. Für die langfristigen 35 € pro Monat bietet ein breit gestreuter ETF das bessere Verhältnis aus Chance und Streuung.',
      },
      {
        id: 'anlageklassen-8-completion',
        type: 'completion',
        kicker: 'Modul 03 abgeschlossen',
        title: 'Alle 7 Anlageklassen im Griff!',
        body: 'Du kannst Finanzbausteine jetzt sachlich nach Risiko, Schwankung und Verfügbarkeit einordnen.',
        summaryPoints: [
          'Tagesgeld sichert deine kurzfristige Liquidität ohne Kursschwankung.',
          'Breit gestreute ETFs verteilen das Marktrisiko auf hunderte Firmen weltweit.',
          'Einzelaktien und Krypto-Assets haben hohe bis sehr hohe Verlustrisiken.',
          'Nicht jede Anlageklasse ist automatisch in einem geförderten Altersvorsorgedepot zulässig. Entscheidend sind die gesetzlichen Vorgaben, die Zertifizierung und die Produktauswahl des Anbieters.',
        ],
        depotBridge: {
          label: 'ETF und Einzelaktie vergleichen',
          description: 'Teste im Übungsdepot mit virtuellem Spielgeld den Unterschied zwischen Welt-ETF und Einzelaktie.',
          to: '/depot',
        },
      },
    ],
    sections: [
      {
        heading: '1. Sicherheitsbausteine: Tagesgeld, Festgeld & Anleihen',
        paragraphs: [
          'Tagesgeld ist täglich verfügbar und ideal für deinen Notgroschen. Festgeld bietet feste Zinsen für eine feste Laufzeit.',
          'Mit Anleihen leihst du Staaten oder Unternehmen Geld gegen Zinsen.',
        ],
      },
      {
        heading: '2. Wachstumsbausteine, Sachwerte & Altersvorsorgedepot',
        paragraphs: [
          'Einzelaktien beteiligen dich an einer einzelnen Firma (Klumpenrisiko). Ein Welt-ETF bündelt hunderte Unternehmen in einem Baustein.',
          'Immobilien sind unflexibel, Gold zahlt keine Zinsen, und Kryptowährungen sind hochspekulativ.',
          'Nicht jede Anlageklasse ist automatisch in einem geförderten Altersvorsorgedepot zulässig. Entscheidend sind die gesetzlichen Vorgaben, die Zertifizierung und die Produktauswahl des Anbieters.',
        ],
      },
    ],
    practicalExample: {
      title: 'Praxisbeispiel: Zwei Töpfe für zwei Ziele',
      scenario:
        'Samira (19) hat 1.000 € Rücklage und möchte zusätzlich jeden Monat 35 € für ihre Zukunft in 15+ Jahren anlegen.',
      takeaway:
        'Topf 1 (Sicherheit): 1.000 € aufs Tagesgeldkonto. Topf 2 (Wachstum): 35 € monatlich in einen weltweit gestreuten Aktien-ETF.',
    },
    interactiveType: 'asset-classes',
    merkeSummary: [
      'Prüfe bei jeder Anlageklasse Risiko, Wertschwankung, Verfügbarkeit (Liquidität) und Kosten.',
      'Einzelaktien und Krypto-Assets bergen hohe bis sehr hohe Verlustrisiken.',
      'Breit gestreute ETFs verteilen das Risiko auf hunderte Unternehmen, schwanken aber ebenfalls mit dem Gesamtmarkt.',
      'Nicht jede Anlageklasse ist automatisch in einem geförderten Altersvorsorgedepot zulässig. Entscheidend sind die gesetzlichen Vorgaben, die Zertifizierung und die Produktauswahl des Anbieters.',
    ],
    quiz: [
      {
        id: 'anlageklassen-q1',
        question: 'Was ist der wichtigste Vorteil eines breit gestreuten Welt-ETFs gegenüber einer einzelnen Aktie?',
        options: [
          'Ein ETF kann gesetzlich niemals im Kurs schwanken.',
          'Das Geld wird automatisch auf hunderte oder tausende Unternehmen verteilt, sodass die Krise einer einzelnen Firma nicht alles gefährdet.',
          'Man verdoppelt sein Geld mit einem ETF garantiert jedes Jahr.',
        ],
        correctIndex: 1,
        explanationCorrect:
          'Richtig! Durch die breite Streuung sinkt das Risiko einzelner Firmenabstürze.',
        explanationWrong:
          'Auch ETFs schwanken mit dem Markt. Ihr Vorteil gegenüber einer Einzelaktie ist die breite Risikostreuung.',
      },
      {
        id: 'anlageklassen-q2',
        question: 'Welche Eigenschaft trifft auf Gold als Anlageklasse zu?',
        options: [
          'Gold zahlt jedes Quartal feste Zinsen auf dein Konto.',
          'Gold erwirtschaftet keine laufenden Zinsen oder Dividenden; der Wert hängt allein vom Marktpreis ab.',
          'Gold hat einen staatlich garantierten Mindestpreis, der nie sinken kann.',
        ],
        correctIndex: 1,
        explanationCorrect:
          'Genau! Gold zahlt weder Zinsen noch Dividenden.',
        explanationWrong:
          'Gold zahlt keine laufenden Erträge aus, und der Preis kann schwanken.',
      },
      {
        id: 'anlageklassen-q3',
        question: 'Was bedeutet „hohe Liquidität“ bei einer Geldanlage?',
        options: [
          'Dass du dein angelegtes Geld schnell und unkompliziert wieder in verfügbares Guthaben umwandeln kannst.',
          'Dass die Geldanlage besonders hohe Gewinne verspricht.',
          'Dass das Geld mindestens 10 Jahre fest eingeschlossen ist.',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Stimmt genau! Tagesgeld hat z. B. eine sehr hohe Liquidität.',
        explanationWrong:
          'Liquidität beschreibt, wie schnell verfügbar dein Geld ist.',
      },
    ],
    nextRoute: '/kindergeld',
  },
  {
    id: 'kindergeld',
    route: '/kindergeld',
    order: 4,
    isCoreTopic: true,
    categoryLabel: 'Modul 04 · Alltag & Sparrate',
    title: 'Sparen mit kleinen Beträgen',
    shortTitle: 'Kleine Beträge',
    subtitle: 'Wie du kleine Monatsbeträge zwischen Alltag, Reserve und Zukunft aufteilst.',
    oneLineDescription: 'Mit 15–25 € im Monat starten und Alltag, Reserve & Sparplan trennen.',
    readingMinutes: 4,
    hook: 'Lohnt sich ein Sparplan überhaupt schon mit 15 € oder 25 € im Monat?',
    intro:
      'Du musst nicht reich sein, um anzufangen. Entscheidend ist die feste Gewohnheit – und dass dein Alltag sowie deine Rücklage immer Vorrang behalten.',
    steps: [
      {
        id: 'kindergeld-1-intro',
        type: 'intro',
        kicker: 'Modul 04 · Kleine Beträge',
        title: 'Gewohnheit schlägt große Startsummen',
        hook: 'Schon 15 € oder 25 € monatlich bauen über die Jahre ein echtes Polster auf – ohne dass dein Alltag zu kurz kommt.',
        body: 'Hier lernst du die 3-Töpfe-Trennung kennen, unterscheidest Kindergeld von der Kinderzulage und siehst, warum niemals das gesamte freie Geld in einen Börsen-Sparplan fließen darf.',
        visual: 'three-pots',
        ctaLabel: 'Lektion starten',
      },
      {
        id: 'kindergeld-2-dreitoepfe',
        type: 'explanation',
        kicker: 'Konzept 1 · Saubere Trennung',
        title: 'Das 3-Töpfe-Prinzip für dein Geld',
        body: 'Damit du nie in Geldnot gerätst, trennst du dein Geld klar: 1. Girokonto für laufende Alltagskosten, 2. Tagesgeld für Notgroschen & kurzfristige Wünsche, 3. Sparplan nur für den kleinen Betrag, den du jahrelang nicht brauchst.',
        highlightPoint: 'Wichtig: Kindergeld unterstützt den laufenden Lebensunterhalt einer Familie (Rechts- und Informationsstand: November 2026). Die Kinderzulage gehört dagegen zur Förderung eines berechtigten Altersvorsorgevertrags.',
        visual: 'three-pots',
        moreInfo: {
          title: 'Kindergeld vs. Kinderzulage & Junior-Depot',
          points: [
            'Kindergeld dient laufenden Kosten für Wohnen, Ernährung, Schule oder Ausbildung.',
            'Die Kinderzulage im Altersvorsorgedepot ist dagegen eine staatliche Zulage, die direkt in einen geförderten Altersvorsorgevertrag fließt.',
            'Jugendliche unter 18 Jahren können ein Wertpapierdepot nur mit Zustimmung der Eltern eröffnen.',
          ],
        },
      },
      {
        id: 'kindergeld-3-check1',
        type: 'question',
        kicker: 'Verständnis-Check · Prioritäten',
        title: 'Warum nicht alles investieren?',
        question: 'Warum solltest du niemals dein gesamtes übriges Monatsgeld oder das komplette Kindergeld in Aktien/ETFs stecken?',
        options: [
          'Weil Banken maximal 50 € pro Monat annehmen dürfen.',
          'Weil laufende Alltagskosten und ein sicherer Notgroschen Vorrang haben, damit du bei spontanen Kosten nicht im Minus verkaufen musst.',
          'Weil kleine Beträge prozentual höhere Zinsen bekommen als große.',
        ],
        correctIndex: 1,
        explanationCorrect:
          'Richtig. Wenn dein Alltag und dein Notgroschen gesichert sind, musst du deinen Sparplan bei einer unerwarteten Rechnung nicht im Minus antasten.',
        explanationWrong:
          'Denk daran: Ohne Puffer auf dem Konto fehlt dir schon bei der nächsten kaputten Handydisplay-Reparatur das Geld.',
      },
      {
        id: 'kindergeld-4-interactive',
        type: 'interactive',
        kicker: 'Konzept 2 · Kleinbetrags-Rechner',
        title: 'Was wird aus 15 € bis 50 € im Monat?',
        body: 'Teste selbst, wie sich ein kleiner Monatsbetrag (z. B. 15 € oder 25 €) über viele Jahre entwickeln kann:',
        widget: 'small-amounts-slider',
      },
      {
        id: 'kindergeld-5-routine',
        type: 'explanation',
        kicker: 'Konzept 3 · Alltags-Trick',
        title: 'Bezahle dich am Monatsanfang zuerst',
        body: 'Wer wartet, was am Monatsende zufällig übrig bleibt, spart meistens gar nichts. Geht dein kleiner Sparbetrag gleich am Tag nach Geldeingang automatisch weg, merkst du ihn im Alltag kaum.',
        highlightPoint: 'Regelmäßigkeit am Monatsanfang nimmt dir jede Willenskraft-Entscheidung ab.',
        visual: 'pay-first',
      },
      {
        id: 'kindergeld-6-scenario-jonas',
        type: 'scenario',
        kicker: 'Praxis-Entscheidung · Jonas (18)',
        title: '60 € am Monatsende übrig – wie aufteilen?',
        personTag: 'Jonas · 18 Jahre · Nebenjob & Taschengeld',
        situation: 'Jonas hat 220 € monatlich zur Verfügung. Nach Fixkosten (65 €) und Freizeit (95 €) bleiben ihm jeden Monat 60 € übrig. Sein Notgroschen ist noch im Aufbau.',
        contextFacts: [
          { label: 'Einnahmen', value: '220 €' },
          { label: 'Ausgaben', value: '160 €' },
          { label: 'Übrig pro Monat', value: '60 €' },
        ],
        question: 'Welche Aufteilung der 60 € ist für Jonas am vernünftigsten?',
        options: [
          'Aufteilen: 35 € aufs Tagesgeld für Notgroschen & Urlaub, 25 € in einen langfristigen ETF-Sparplan',
          'Die vollen 60 € in eine riskante Einzelaktie stecken',
          'Einen festen Vertrag über 80 € monatlich unterschreiben',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Stark gelöst! Durch die Aufteilung (35 € Tagesgeld-Puffer + 25 € Langfrist-Sparplan) baut Jonas seinen Notgroschen weiter aus und startet gleichzeitig seine Sparroutine.',
        explanationWrong:
          'Solange der Notgroschen noch wächst, sollte Jonas niemals seine gesamten 60 € an der Börse binden. Eine Teilung zwischen Tagesgeld und kleinem Sparplan hält ihn flexibel.',
      },
      {
        id: 'kindergeld-7-check2',
        type: 'question',
        kicker: 'Kurz-Check · Begriffe trennen',
        title: 'Kindergeld vs. Kinderzulage',
        question: 'Worin liegt der Unterschied zwischen Kindergeld und der Kinderzulage im Altersvorsorgedepot?',
        options: [
          'Kindergeld unterstützt den laufenden Lebensunterhalt einer Familie; die Kinderzulage fließt als staatliche Förderung in einen berechtigten Altersvorsorgevertrag.',
          'Beides ist exakt dasselbe und wird jeden Monat bar ausgezahlt.',
          'Die Kinderzulage ersetzt das Kindergeld ab dem 16. Geburtstag vollständig.',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Genau richtig. Kindergeld ist für den laufenden Lebensunterhalt gedacht, während die Kinderzulage zur Förderung eines zertifizierten Altersvorsorgevertrags gehört.',
        explanationWrong:
          'Wichtig zu trennen: Kindergeld unterstützt den Alltag einer Familie. Die Kinderzulage ist dagegen eine Zulage innerhalb eines geförderten Altersvorsorgevertrags.',
      },
      {
        id: 'kindergeld-8-completion',
        type: 'completion',
        kicker: 'Modul 04 abgeschlossen',
        title: 'Kleine Beträge, große Routine!',
        body: 'Du weißt jetzt, wie du schon mit 15 € oder 25 € monatlich sinnvoll startest, ohne deinen Alltag einzuschränken.',
        summaryPoints: [
          'Alltagskosten und Notgroschen kommen immer zuerst.',
          'Kindergeld unterstützt den laufenden Lebensunterhalt; die Kinderzulage gehört zur Förderung eines Altersvorsorgevertrags.',
          'Schon ein kleiner Teilbetrag (z. B. 25 € / Monat) hat über viele Jahre große Wirkung.',
          'Automatische Abbuchung am Monatsanfang schafft mühelose Gewohnheit.',
        ],
        depotBridge: {
          label: 'Im Zinseszins-Rechner testen',
          description: 'Spiele verschiedene Monatsraten zwischen 15 € und 50 € im Rechner durch.',
          to: '/rechner',
        },
      },
    ],
    sections: [
      {
        heading: '1. Erst das Monatsbudget prüfen, dann sparen',
        paragraphs: [
          'Investiere niemals dein gesamtes verfügbares Geld. Kindergeld unterstützt den laufenden Lebensunterhalt einer Familie (Rechts- und Informationsstand: November 2026), während die Kinderzulage zur Förderung eines berechtigten Altersvorsorgevertrags gehört.',
          'Trenne dein Geld in Alltagskonto (Girokonto), Rücklage (Tagesgeld) und langfristigen Zukunfts-Sparplan.',
        ],
      },
      {
        heading: '2. Regelmäßigkeit schlägt Startsumme',
        paragraphs: [
          'Wer am Monatsanfang automatisch 15 € oder 25 € zur Seite legt, baut ohne Stress eine feste Routine auf.',
        ],
      },
    ],
    practicalExample: {
      title: 'Praxisbeispiel: Jonas (18) teilt 60 € Überschuss auf',
      scenario:
        'Jonas hat nach Fixkosten und Freizeit monatlich 60 € übrig.',
      takeaway:
        '35 € wandern aufs Tagesgeldkonto für Urlaub & Notgroschen, 25 € in einen langfristigen ETF-Sparplan.',
    },
    interactiveType: 'small-amounts',
    merkeSummary: [
      'Erst laufende Lebenshaltungskosten und Notgroschen sichern – erst danach langfristig investieren.',
      'Kindergeld unterstützt den laufenden Lebensunterhalt einer Familie; die Kinderzulage gehört zur Förderung eines berechtigten Altersvorsorgevertrags.',
      'Ein guter Sparplan lässt sich jederzeit reduzieren oder pausieren.',
    ],
    quiz: [
      {
        id: 'kindergeld-q1',
        question: 'Warum sollte man niemals sein gesamtes übriges Monatsgeld oder das komplette Kindergeld in Aktien/ETFs stecken?',
        options: [
          'Weil Banken nur maximal 50 € pro Monat annehmen dürfen.',
          'Weil laufende Alltagskosten und ein sicherer Notgroschen Vorrang haben, damit man bei spontanen Ausgaben nicht im Minus verkaufen muss.',
          'Weil kleine Beträge an der Börse mehr Rendite bringen als große.',
        ],
        correctIndex: 1,
        explanationCorrect:
          'Richtig! Alltagskosten und eine sichere Rücklage stehen immer an erster Stelle.',
        explanationWrong:
          'Ohne Rücklage fehlt dir schon bei der nächsten unerwarteten Ausgabe das Bargeld.',
      },
      {
        id: 'kindergeld-q2',
        question: 'Worin unterscheiden sich Kindergeld und Kinderzulage?',
        options: [
          'Kindergeld unterstützt den laufenden Lebensunterhalt einer Familie; die Kinderzulage gehört zur staatlichen Förderung eines berechtigten Altersvorsorgevertrags.',
          'Beides sind identische Barüberweisungen aufs Girokonto.',
          'Die Kinderzulage gibt es nur für Einzelaktien.',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Genau! Kindergeld ist für den laufenden Familienalltag da, die Kinderzulage fließt in einen geförderten Altersvorsorgevertrag.',
        explanationWrong:
          'Kindergeld dient dem laufenden Lebensunterhalt, während die Kinderzulage zu einem geförderten Altersvorsorgevertrag gehört.',
      },
    ],
    nextRoute: '/altersvorsorgedepot',
  },
  {
    id: 'altersvorsorgedepot',
    route: '/altersvorsorgedepot',
    order: 5,
    isCoreTopic: true,
    categoryLabel: 'Modul 05 · Altersvorsorge ab 2027',
    title: 'Das neue Altersvorsorgedepot',
    shortTitle: 'Vorsorgedepot',
    subtitle:
      'Eigener Beitrag, staatliche Zulage, mögliche Wertentwicklung, Kosten und Steuern.',
    oneLineDescription:
      'Wie das neue Altersvorsorgedepot funktioniert und aus welchen Teilen ein möglicher Endwert besteht.',
    readingMinutes: 7,
    hook: 'Du sparst – der Staat legt etwas dazu: Wie funktioniert das Altersvorsorgedepot ab 2027?',
    intro:
      'Die gesetzliche Grundlage wurde 2026 beschlossen. Zertifizierte Produkte sollen ab dem 1. Januar 2027 angeboten werden. Konkrete Anbieterbedingungen können sich bis zur endgültigen Zertifizierung und Veröffentlichung der Produktunterlagen noch ändern.',
    steps: [
      {
        id: 'altersvorsorge-1-intro',
        type: 'intro',
        kicker: 'Modul 05 · Altersvorsorge ab 2027',
        title: 'Du sparst – der Staat legt etwas dazu',
        hook: 'Ab 2027 können zertifizierte Altersvorsorgedepots angeboten werden. Du zahlst einen eigenen Beitrag ein, der Staat kann eine Zulage ergänzen und das Geld kann langfristig investiert werden.',
        body: 'Wichtig zur Einordnung: Der Staat zahlt damit nicht deine gesamte spätere Rente und garantiert auch keinen Börsengewinn. Das Altersvorsorgedepot ist ein zusätzlicher privater Vorsorgebaustein (Rechts- und Informationsstand: November 2026).',
        visual: 'allowance-stack',
        ctaLabel: 'Lektion starten',
      },
      {
        id: 'altersvorsorge-2-three-pillars',
        type: 'explanation',
        kicker: 'Schritt 2 · Drei Säulen & Zweck',
        title: 'Wo das Altersvorsorgedepot eingeordnet wird',
        body: 'In Deutschland besteht die Altersvorsorge aus drei Säulen: 1. der gesetzlichen Altersvorsorge (Umlageverfahren über Pflichtbeiträge), 2. der betrieblichen Altersvorsorge (über den Arbeitgeber) und 3. der privaten Altersvorsorge mit eigenem Kapitalaufbau.',
        highlightPoint:
          'Ein privates Altersvorsorgedepot kann die gesetzliche und betriebliche Altersvorsorge ergänzen.',
        visual: 'pension-balance',
        moreInfo: {
          title: 'Rechts- und Informationsstand: November 2026',
          points: [
            'Die gesetzliche Grundlage wurde 2026 beschlossen. Zertifizierte Produkte sollen ab dem 1. Januar 2027 angeboten werden. Konkrete Anbieterbedingungen können sich bis zur endgültigen Zertifizierung und Veröffentlichung der Produktunterlagen noch ändern.',
            'Ob und in welcher Höhe eine zusätzliche private Vorsorge zu dir passt, hängt von deiner Lebenssituation, deinem Budget und deiner bestehenden Absicherung ab.',
          ],
          sourceNote: 'Rechts- und Informationsstand: November 2026',
        },
      },
      {
        id: 'altersvorsorge-3-grundzulage-interactive',
        type: 'interactive',
        kicker: 'Schritt 3 · Grundzulage ausprobieren',
        title: 'Wie dein Eigenbeitrag und die Grundzulage zusammenhängen',
        body: 'Für die ersten 360 € Jahresbeitrag gibt es in diesem Modell 50 Cent Grundzulage je Euro, für den Teil darüber bis 1.800 € jährlich 25 Cent je Euro (maximal 540 € Grundzulage pro Jahr). Beiträge über 1.800 € pro Jahr lösen keine zusätzliche Grundzulage aus.',
        widget: 'allowance-slider',
        moreInfo: {
          title: 'Zwei Förderstufen einfach nachgerechnet',
          points: [
            'Stufe 1 (bis 360 € Eigenbeitrag im Jahr, also bis 30 € / Monat): Grundzulage = Jahresbeitrag × 0,50 (maximal 180 €).',
            'Stufe 2 (für den Teil über 360 € bis 1.800 € im Jahr, also bis 150 € / Monat): zusätzlich 0,25 € je Euro (maximal weitere 360 €).',
            'Höchstbetrag der Grundzulage in diesem Modell: 180 € + 360 € = 540 € pro Jahr.',
          ],
          sourceNote: 'Rechts- und Informationsstand: November 2026',
        },
      },
      {
        id: 'altersvorsorge-4-check-grundzulage',
        type: 'question',
        kicker: 'Schritt 4 · Verständnis-Check',
        title: 'Grundzulage bei 30 € im Monat',
        question:
          'Du zahlst 30 € pro Monat ein, also 360 € im Jahr. Wie hoch ist die Grundzulage in diesem Modell?',
        options: ['30 €', '180 €', '360 €', '540 €'],
        correctIndex: 1,
        explanationCorrect:
          'Für die ersten 360 € Eigenbeitrag werden 50 Cent Grundzulage je eingezahltem Euro berücksichtigt.',
        explanationWrong:
          'Rechne nach: Für die ersten 360 € Eigenbeitrag werden 50 Cent Grundzulage je eingezahltem Euro berücksichtigt (360 € × 0,50 = 180 €).',
      },
      {
        id: 'altersvorsorge-5-zusatzfoerderung',
        type: 'explanation',
        kicker: 'Schritt 5 · Weitere Zulagen',
        title: 'Berufseinsteigerbonus (einmalig) und Kinderzulage (jährlich)',
        body: 'Neben der jährlichen Grundzulage gibt es zwei besondere Förderbausteine: Wer vor dem 25. Geburtstag einen förderberechtigten Vertrag abschließt, kann einen einmaligen Berufseinsteigerbonus von 200 € erhalten. Für jedes förderberechtigte Kind gibt es zudem 1 € Kinderzulage je 1 € Eigenbeitrag – bis zu maximal 300 € pro Kind und Jahr.',
        highlightPoint:
          'Kindergeld unterstützt den laufenden Lebensunterhalt einer Familie. Die Kinderzulage gehört dagegen zur Förderung eines berechtigten Altersvorsorgevertrags.',
        visual: 'allowance-stack',
        moreInfo: {
          title: 'Unterschied: Jährlich, einmalig und pro Kind',
          points: [
            'Grundzulage: jährlich wiederkehrend (abhängig vom jährlichen Eigenbeitrag, bis zu 540 € pro Jahr).',
            'Berufseinsteigerbonus: einmalig 200 € bei Vertragsabschluss vor dem 25. Geburtstag.',
            'Kinderzulage: jährlich pro förderberechtigtem Kind (1 € je 1 € Eigenbeitrag, maximal 300 € pro Kind und Jahr).',
          ],
        },
      },
      {
        id: 'altersvorsorge-6-breakdown-interactive',
        type: 'interactive',
        kicker: 'Schritt 6 · Modellrechnung zerlegen',
        title: 'Woraus besteht ein möglicher Endwert?',
        body: 'Schau dir getrennt an, welcher Teil aus deinen eigenen Einzahlungen, aus staatlichen Zulagen und aus einer angenommenen Wertentwicklung stammt – und wie laufende Kosten das Ergebnis mindern:',
        widget: 'retirement-breakdown',
      },
      {
        id: 'altersvorsorge-7-check-model',
        type: 'question',
        kicker: 'Schritt 7 · Modell vs. Garantie',
        title: 'Modellrechnung richtig einordnen',
        question: 'Warum zeigt der Rechner mehrere mögliche Ergebnisse?',
        options: [
          'Rendite, Kosten und Kapitalmarktentwicklung stehen nicht im Voraus fest.',
          'Weil die staatliche Grundzulage jeden Tag an der Börse neu ausgelost wird.',
          'Weil der Staat in jedem Modell denselben Endwert garantiert.',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Genau richtig: Rendite, Kosten und Kapitalmarktentwicklung stehen nicht im Voraus fest. Während sich die Zulage nach den gesetzlichen Förderregeln richtet, schwankt die Marktentwicklung, Vertragskosten mindern den Wert und spätere Auszahlungen unterliegen der Besteuerung.',
        explanationWrong:
          'Wichtig zu unterscheiden: Rendite, Kosten und Kapitalmarktentwicklung stehen nicht im Voraus fest. Eine Modellrechnung ist daher niemals eine garantierte Prognose.',
        moreInfo: {
          title: 'Vier Einflussfaktoren sauber trennen',
          points: [
            '1. Staatliche Zulage: richtet sich nach den gesetzlichen Fördervoraussetzungen und deinem Eigenbeitrag.',
            '2. Marktentwicklung: nicht garantiert; Kurse können steigen, aber auch schwanken oder fallen.',
            '3. Vertragskosten: Depot-, Verwaltungs-, Produkt- und Transaktionskosten schmälern das Ergebnis direkt.',
            '4. Spätere Besteuerung: der angezeigte Modellwert ist ein Wert vor Steuern in der Auszahlungsphase.',
          ],
        },
      },
      {
        id: 'altersvorsorge-8-three-products',
        type: 'triple_comparison',
        kicker: 'Schritt 8 · Drei Produktwege',
        title: 'Standarddepot, freies Altersvorsorgedepot und Garantieprodukt',
        body: 'Innerhalb des neuen Systems können Anbieter unterschiedliche Produktvarianten anbieten. Vergleiche die drei Grundtypen:',
        cards: [
          {
            label: 'Variante 1 · Standardisiert',
            title: 'Standarddepot',
            badge: 'Kostendeckel max. 1 %',
            tone: 'accent',
            points: [
              'Einfache, standardisierte Struktur mit begrenzter Auswahl',
              'Meist ein chancenorientierter und ein schwankungsärmerer Baustein',
              'Gesetzliche Begrenzung der Effektivkosten auf maximal 1 %',
              'Automatische Risikoreduzierung vor dem Rentenbeginn je nach Produktstruktur möglich',
            ],
          },
          {
            label: 'Variante 2 · Selbstgesteuert',
            title: 'Freies Altersvorsorgedepot',
            badge: 'Breitere Auswahl',
            tone: 'neutral',
            points: [
              'Breitere Auswahl an zulässigen Fonds und ETFs',
              'Mehr eigene Verantwortung bei Auswahl und Gewichtung',
              'Kosten hängen vom Anbieter und den gewählten Produkten ab',
              'Keine identische 1-%-Kostenobergrenze für jede freie Produktkonfiguration',
            ],
          },
          {
            label: 'Variante 3 · Mit Absicherung',
            title: 'Garantieprodukt',
            badge: '80 % oder 100 % Garantie',
            tone: 'warning',
            points: [
              'Varianten mit 80 % oder 100 % Garantie können angeboten werden',
              'Reduziertes Verlustrisiko zum maßgeblichen Rentenbeginn',
              'Garantien können die mögliche langfristige Rendite verringern',
              'Preis und Bedingungen hängen vom konkreten Anbieter ab',
            ],
          },
        ],
        takeaway:
          'Mehr Auswahl, mehr Garantie oder niedrigere Kosten sind unterschiedliche Eigenschaften. Kein Merkmal macht ein Produkt automatisch zur besten Lösung für alle.',
      },
      {
        id: 'altersvorsorge-9-free-vs-promoted',
        type: 'comparison',
        kicker: 'Schritt 9 · Zwei Werkzeuge im Vergleich',
        title: 'Freies Wertpapierdepot vs. gefördertes Altersvorsorgedepot',
        body: 'Du kannst privat sowohl in einem normalen Wertpapierdepot als auch in einem zertifizierten Altersvorsorgedepot investieren:',
        leftCard: {
          label: 'Ohne staatliche Zulage',
          title: 'Freies Wertpapierdepot',
          badge: 'Flexibel verfügbar',
          tone: 'neutral',
          points: [
            'Grundsätzlich jederzeit flexibler verfügbar',
            'Keine Grundzulage des Altersvorsorgedepots',
            'Große Produktauswahl am Markt',
            'Normale steuerliche Behandlung (laufende Besteuerung oberhalb des Sparer-Pauschbetrags)',
            'Auch für Sparziele vor dem Ruhestand nutzbar',
          ],
        },
        rightCard: {
          label: 'Zertifizierter Vertrag ab 2027',
          title: 'Gefördertes Altersvorsorgedepot',
          badge: 'Zweckgebunden fürs Alter',
          tone: 'accent',
          points: [
            'Staatliche Zulage bei Förderberechtigung möglich',
            'Erträge innerhalb des Vertrags in der Ansparphase nicht laufend besteuert',
            'Kapital ist für die Altersvorsorge gebunden (eingeschränkter Zugriff)',
            'Spätere Auszahlungen im Alter sind grundsätzlich steuerpflichtig',
            'Nur zertifizierte Produkte sind förderfähig',
          ],
        },
        takeaway:
          'Ein freies Depot und ein Altersvorsorgedepot erfüllen unterschiedliche Aufgaben. Entscheidend sind Ziel, Laufzeit, Kosten, Verfügbarkeit und persönliche Voraussetzungen.',
      },
      {
        id: 'altersvorsorge-10-scenario-nora',
        type: 'scenario',
        kicker: 'Schritt 10 · Entscheidungs-Check',
        title: 'Wie prüft Nora ein Angebot strukturiert?',
        personTag: 'Nora · 19 Jahre · Ausbildung',
        situation:
          'Nora hat nach allen Ausgaben 70 € monatlich übrig. Ihr Notgroschen ist noch nicht vollständig aufgebaut. Sie sieht Werbung für ein Altersvorsorgedepot mit staatlicher Zulage.',
        contextFacts: [
          { label: 'Übrig pro Monat', value: '70 €' },
          { label: 'Notgroschen', value: 'noch im Aufbau' },
          { label: 'Alter', value: '19 Jahre' },
        ],
        question: 'Was sollte Nora vor einer Entscheidung prüfen?',
        options: [
          'Budget und Notgroschen, Bindungsdauer, Effektivkosten, verfügbare Anlageprodukte, Garantien und Auszahlungsregeln.',
          'Sofort die vollen 70 € monatlich einzahlen, nur um eine möglichst hohe Zulage zu erhalten.',
          'Den Anbieter mit der auffälligsten Werbung auswählen, ohne das Produktinformationsblatt zu prüfen.',
          'Davon ausgehen, dass die in der Werbung gezeigte Modellrendite fest garantiert ist.',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Genau richtig. Nora sichert zuerst ihren Notgroschen und prüft vor jedem Vertragsabschluss systematisch Budget, Bindungsdauer, Effektivkosten, Produktauswahl, Garantien und Auszahlungsregeln.',
        explanationWrong:
          'Vorsicht: Weder eine Werbeanzeige noch eine hohe Zulage ersetzen den Blick auf Notgroschen, Bindungsdauer, Effektivkosten und Auszahlungsregeln.',
      },
      {
        id: 'altersvorsorge-11-completion',
        type: 'completion',
        kicker: 'Modul 05 abgeschlossen',
        title: 'Du kannst Förderung und Rendite jetzt trennen.',
        body: 'Du weißt jetzt, wie das neue Altersvorsorgedepot aufgebaut ist, welche Teile eines Endwerts planbar sind und welche Annahmen vor einem Abschluss geprüft werden müssen.',
        summaryPoints: [
          'Das Altersvorsorgedepot ergänzt die gesetzliche und betriebliche Altersvorsorge.',
          'Die Grundzulage steigt mit dem Eigenbeitrag und beträgt in diesem Modell maximal 540 € pro Jahr.',
          'Bei Vertragsabschluss vor dem 25. Geburtstag kann ein einmaliger Berufseinsteigerbonus von 200 € berücksichtigt werden.',
          'Rendite ist nicht garantiert; Kosten und Steuern beeinflussen das Ergebnis.',
          'Das Kapital ist für die Altersvorsorge gedacht und nicht so frei verfügbar wie in einem normalen Depot.',
        ],
        depotBridge: {
          label: 'Eigene Förderung simulieren',
          description:
            'Trenne Eigenbeiträge, staatliche Zulagen, mögliche Wertentwicklung und Kosten.',
          to: '/rechner',
        },
      },
    ],
    sections: [
      {
        heading: '1. Gesetzlicher Stand und Grundprinzip ab 2027',
        paragraphs: [
          'Die gesetzliche Grundlage wurde 2026 beschlossen. Zertifizierte Produkte sollen ab dem 1. Januar 2027 angeboten werden. Konkrete Anbieterbedingungen können sich bis zur endgültigen Zertifizierung und Veröffentlichung der Produktunterlagen noch ändern (Rechts- und Informationsstand: November 2026).',
          'Ein privates Altersvorsorgedepot kann die gesetzliche und betriebliche Altersvorsorge ergänzen. Du zahlst eigene Beiträge ein, der Staat ergänzt bei Förderberechtigung eine Zulage, und das Kapital wird langfristig angelegt.',
        ],
      },
      {
        heading: '2. Zulagen, Kosten, Besteuerung und Bindung',
        paragraphs: [
          'Für die ersten 360 € Eigenbeitrag im Jahr beträgt die Grundzulage in diesem Modell 50 Cent je Euro, darüber bis 1.800 € jährlich 25 Cent je Euro (maximal 540 € pro Jahr). Hinzu kommen ggf. Kinderzulage (bis zu 300 € pro Kind/Jahr) und ein einmaliger Berufseinsteigerbonus von 200 € bei Abschluss vor dem 25. Geburtstag.',
          'Während Erträge in der Ansparphase innerhalb des Vertrags nicht laufend besteuert werden, ist das Kapital für die Altersvorsorge gebunden und spätere Auszahlungen sind grundsätzlich steuerpflichtig.',
        ],
      },
    ],
    practicalExample: {
      title: 'Praxisbeispiel: Nora (19) prüft Budget, Notgroschen und Vertragsregeln',
      scenario:
        'Nora hat in der Ausbildung monatlich 70 € übrig, ihr Notgroschen ist aber noch nicht komplett aufgebaut.',
      takeaway:
        'Sie zahlt nicht blind die vollen 70 € in einen gebundenen Vertrag ein, sondern baut ihren Notgroschen aus und prüft vorab Bindungsdauer, Effektivkosten, Produktauswahl, Garantien und Auszahlungsregeln.',
    },
    interactiveType: 'retirement-horizon',
    merkeSummary: [
      'Das Altersvorsorgedepot ergänzt die gesetzliche und betriebliche Altersvorsorge.',
      'Die Grundzulage steigt mit dem Eigenbeitrag und beträgt in diesem Modell maximal 540 € pro Jahr.',
      'Bei Vertragsabschluss vor dem 25. Geburtstag kann ein einmaliger Berufseinsteigerbonus von 200 € berücksichtigt werden.',
      'Rendite ist nicht garantiert; Kosten und Steuern beeinflussen das Ergebnis.',
      'Das Kapital ist für die Altersvorsorge gedacht und nicht so frei verfügbar wie in einem normalen Depot.',
    ],
    quiz: [
      {
        id: 'altersvorsorge-q1',
        question:
          'Du zahlst 30 € pro Monat ein, also 360 € im Jahr. Wie hoch ist die Grundzulage in diesem Modell?',
        options: ['30 €', '180 €', '360 €', '540 €'],
        correctIndex: 1,
        explanationCorrect:
          'Richtig! Für die ersten 360 € Eigenbeitrag werden 50 Cent Grundzulage je eingezahltem Euro berücksichtigt.',
        explanationWrong:
          'Für die ersten 360 € Jahresbeitrag gibt es 50 Cent je Euro – also 180 € Grundzulage.',
      },
      {
        id: 'altersvorsorge-q2',
        question: 'Warum zeigt der Altersvorsorgedepot-Rechner mehrere mögliche Ergebnisse?',
        options: [
          'Weil Rendite, Kosten und Kapitalmarktentwicklung nicht im Voraus feststehen.',
          'Weil der Staat jedes Jahr eine feste Aktienrendite von 7 % garantiert.',
          'Weil alle Anbieter gesetzlich exakt dieselben Gebühren verlangen.',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Genau! Kapitalmarktrenditen sind nicht garantiert, und unterschiedliche Kosten sowie spätere Steuern verändern das Ergebnis.',
        explanationWrong:
          'Rendite, Kosten und Kapitalmarktentwicklung stehen nicht im Voraus fest.',
      },
      {
        id: 'altersvorsorge-q3',
        question: 'Was sollte Nora (19) vor Abschluss eines Altersvorsorgedepots prüfen?',
        options: [
          'Budget und Notgroschen, Bindungsdauer, Effektivkosten, verfügbare Anlageprodukte, Garantien und Auszahlungsregeln.',
          'Nur den Werbeslogan auf Social Media.',
          'Ob sie ihr gesamtes Girokonto sofort auflösen kann.',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Perfekt! Eine fundierte Entscheidung berücksichtigt Budget, Reserve, Bindung, Gesamtkosten und Vertragsregeln.',
        explanationWrong:
          'Prüfe immer zuerst Budget, Notgroschen, Bindungsdauer, Effektivkosten, Produktauswahl, Garantien und Auszahlungsregeln.',
      },
    ],
    nextRoute: '/staat',
  },
  {
    id: 'staat',
    route: '/staat',
    order: 6,
    isCoreTopic: true,
    categoryLabel: 'Modul 06 · Förderung & Anbieter-Check',
    title: 'Hilfe vom Staat verstehen',
    shortTitle: 'Staatliche Hilfe',
    subtitle:
      'Förderprogramme unterscheiden, Voraussetzungen prüfen, Kostenfallen erkennen und Anbieter vergleichen.',
    oneLineDescription:
      'VL, Sparzulage, Förderstatus, Kostenfallen und veröffentlichte Anbieterkonditionen prüfen.',
    readingMinutes: 7,
    hook: 'Wie unterscheidest du echte Förderung von Werbeversprechen und versteckten Gebühren?',
    intro:
      'Staatliche Förderung gibt es in unterschiedlichen Programmen – von Vermögenswirksamen Leistungen über das ab 2027 startende Altersvorsorgedepot bis zu Altverträgen mit Bestandsschutz. Hier lernst du den systematischen 4-Fragen-Check und vergleichst echte Konditionen (Rechts- und Informationsstand: November 2026).',
    steps: [
      {
        id: 'staat-1-intro',
        type: 'intro',
        kicker: 'Modul 06 · Staatliche Förderung',
        title: 'Förderprogramme unterscheiden – Bedingungen selbst prüfen',
        hook: 'Nicht jede Förderung passt zu jedem Ziel, und „0 € Depotgebühr“ in der Werbung heißt nicht automatisch 0 € Gesamtkosten.',
        body: 'In diesem Modul lernst du, wie du verschiedene staatliche Förderprogramme auseinanderhältst, mit vier Prüf-Fragen jeden Vertrag durchleuchtest und veröffentlichte Anbieterangaben sachlich einordnest.',
        visual: 'state-check',
        ctaLabel: 'Lektion starten',
      },
      {
        id: 'staat-2-vl',
        type: 'explanation',
        kicker: 'Schritt 2 · VL, Sparzulage & 4 Prüf-Fragen',
        title: 'Arbeitgeber-Zuschuss nutzen und die 4 Prüf-Fragen stellen',
        body: 'Viele Ausbildungsbetriebe und Arbeitgeber zahlen monatlich zwischen 6,65 € und 40 € zusätzlich zum Gehalt in einen VL-Vertrag (Vermögenswirksame Leistungen). Innerhalb der gesetzlichen Einkommensgrenzen kommen Arbeitnehmersparzulage oder Wohnungsbauprämie (inkl. U25-Sonderregel ab 16 Jahren) hinzu. Vor jedem Fördervertrag stellst du dir vier feste Fragen: 1. Bin ich förderberechtigt? 2. Wie viel muss ich selbst einzahlen? 3. Welche Kosten und Bindungsfristen gelten? 4. Wann und wie kann ich über das Geld verfügen?',
        highlightPoint:
          'Die 4 Prüf-Fragen: 1. Bin ich förderberechtigt? · 2. Wie viel muss ich selbst einzahlen? · 3. Welche Kosten und Bindungsfristen gelten? · 4. Wann und wie kann ich über das Geld verfügen?',
        visual: 'provider-check',
        moreInfo: {
          title: 'Die 4 Prüf-Fragen im Detail (Stand: November 2026)',
          points: [
            '1. Bin ich förderberechtigt? (z. B. Tarif-/Ausbildungsvertrag bei VL, Einkommensgrenzen bei der Sparzulage, Förderberechtigung beim Altersvorsorgedepot).',
            '2. Wie viel muss ich selbst einzahlen? (Reicht der Arbeitgeberbeitrag oder ist ein eigener Mindestbeitrag nötig?).',
            '3. Welche Kosten und Bindungsfristen gelten? (Effektivkosten, feste Monatsgebühren, Abschlusskosten, 7 Jahre Sperrfrist bei VL bzw. Bindung bis zum Ruhestand beim Altersvorsorgedepot).',
            '4. Wann und wie kann ich über das Geld verfügen? (Freie Auszahlung nach Sperrfrist, wohnwirtschaftliche Verwendung oder steuerpflichtige Renten-/Auszahlplanphase).',
          ],
          sourceNote: 'Quelle: Verbraucherzentrale / Bundesfinanzministerium (Rechts- und Informationsstand: November 2026)',
        },
      },
      {
        id: 'staat-3-check1',
        type: 'question',
        kicker: 'Schritt 3 · Verständnis-Check',
        title: 'Was steckt hinter VL?',
        question: 'Was sind „Vermögenswirksame Leistungen“ (VL)?',
        options: [
          'Ein freiwilliger oder tariflicher Zuschuss vom Arbeitgeber, der direkt in einen geeigneten Sparvertrag fließt.',
          'Ein Kredit vom Finanzamt mit 10 % Zinsen.',
          'Eine automatische Bar-Auszahlung an alle Schüler ab 16 Jahren.',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Richtig. Viele Arbeitgeber zahlen schon in der Ausbildung monatlich VL dazu – nachfragen in der Personalabteilung lohnt sich fast immer.',
        explanationWrong:
          'VL sind ein freiwilliger oder tariflicher Geldzuschuss deines Arbeitgebers in einen Sparvertrag.',
      },
      {
        id: 'staat-4-interactive',
        type: 'interactive',
        kicker: 'Schritt 4 · Programm-Status prüfen',
        title: 'Aktiv, ab 2027 startend, Bestandsschutz oder nur geplant?',
        body: 'Filtere die staatlichen Programme nach ihrem aktuellen Status (Rechts- und Informationsstand: November 2026) und vergleiche Voraussetzungen und Bindungsfristen:',
        widget: 'state-status-checker',
      },
      {
        id: 'staat-5-cost-examples',
        type: 'interactive',
        kicker: 'Schritt 5 · Kosten-Check an anonymisierten Praxisbeispielen',
        title: 'Feste Gebühr, „0 €“-Werbung, Aktionen, Auswahl & Garantie prüfen',
        body: 'Teste im Gebühren-Simulator, wie sich eine feste Jahresgebühr von 12 € im Vergleich zu prozentualen Kosten bei verschiedenen Depotgrößen auswirkt, und arbeite die 5 anonymisierten Angebotsvergleiche durch:',
        widget: 'cost-impact-slider',
      },
      {
        id: 'staat-6-check-provider',
        type: 'question',
        kicker: 'Schritt 6 · Werbeaussagen durchschauen',
        title: 'Was fehlt bei „0 € Depotgebühr“ und Startaktionen?',
        question:
          'Ein Anbieter wirbt mit „0 € Depotgebühr zum Start“. Welche Informationen musst du trotzdem im Preis- und Leistungsverzeichnis prüfen?',
        options: [
          'Laufende Produktkosten (TER), Fondsauswahl, Spreads, Ordergebühren sowie wie lange und bis zu welchem Anlagevolumen eine Startaktion gilt.',
          'Gar keine – „0 € Depotgebühr“ garantiert gesetzlich, dass über 40 Jahre keinerlei Produkt-, Order- oder Folgekosten entstehen.',
          'Nur die Hintergrundfarbe der Banking-App.',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Genau richtig! Selbst bei 0 € Depotgebühr können laufende Produktkosten (z. B. ab 0,03 % bis über 1 %), Börsenspreads, Ordergebühren oder zeitliche und betragsmäßige Grenzen bei Erstattungsaktionen (z. B. nur 1 bis 3 Jahre oder bis 25.000 €) anfallen.',
        explanationWrong:
          'Vorsicht: „0 € Depotgebühr“ bezieht sich nur auf die Depotführung. Produktkosten, Spreads, Orderkosten, Einschränkungen der ETF-Auswahl und das Ablaufen befristeter Startaktionen musst du immer separat prüfen.',
        exampleSources: [
          {
            providerId: 'ing',
            providerName: 'ING',
            productName: 'ING Aktiv',
            sourceUrls: [
              'https://www.ing.de/sparen-anlegen/altersvorsorge-depot/',
              'https://neues-altersvorsorgedepot.de/anbieter/ing',
            ],
            informationStatus: 'Stand November 2026',
          },
          {
            providerId: 'traderepublic',
            providerName: 'Trade Republic',
            productName: 'Trade Republic Altersvorsorgedepot',
            sourceUrls: [
              'https://traderepublic.com/de-de/altersvorsorgedepot',
              'https://finanzfacts.de/wiki/altersvorsorgedepot/anbieter/trade-republic/',
            ],
            informationStatus: 'Stand November 2026',
          },
          {
            providerId: 'quirion',
            providerName: 'Quirion / Quirin Privatbank',
            productName: 'Quirion Standard',
            sourceUrls: [
              'https://www.quirion.de/vorsorgen',
              'https://www.quirion.de/post/unser-neuer-standard-fuer-die-altersvorsorge',
            ],
            informationStatus: 'Stand November 2026',
          },
          {
            providerId: 'smartbroker',
            providerName: 'SMARTBROKER+',
            productName: 'SMARTBROKER+ Standard',
            sourceUrls: [
              'https://www.smartbrokerplus.de/de-de/altersvorsorgedepot/',
              'https://www.wiwo.de/vergleich/altersvorsorgedepot-smartbrokerplus/',
            ],
            informationStatus: 'Stand November 2026',
          },
        ],
      },
      {
        id: 'staat-7-scenario-mia',
        type: 'scenario',
        kicker: 'Schritt 7 · Praxis-Szenario · Mia (17)',
        title: '26 € monatlich vom Ausbildungsbetrieb',
        personTag: 'Mia · 17 Jahre · 1. Lehrjahr',
        situation:
          'Mia entdeckt in ihrem Ausbildungsvertrag, dass ihr Betrieb 26 € monatlich an Vermögenswirksamen Leistungen (VL) zahlt, sobald sie einen passenden Vertrag vorlegt.',
        contextFacts: [
          { label: 'VL vom Betrieb', value: '26 € / Monat' },
          { label: 'Über 6 Jahre', value: '1.872 € Zuschuss' },
        ],
        question: 'Was ist Mias klügster nächster Schritt?',
        options: [
          'Bei der Personalabteilung nachfragen, mit den 4 Prüf-Fragen kostengünstige VL-Verträge vergleichen und den Zuschuss mitnehmen',
          'Nichts tun, weil 26 € im Monat keinen Unterschied machen',
          'Auf die noch nicht verfügbare Frühstart-Rente warten',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Richtig! 26 € monatlich vom Arbeitgeber summieren sich über 6 Einzahlungsjahre auf 1.872 € extra – plus mögliche staatliche Arbeitnehmersparzulage.',
        explanationWrong:
          'Prüfe den Arbeitgeber-Zuschuss: Über 6 Einzahlungsjahre sind 26 € im Monat fast 1.900 € zusätzliches Kapital.',
      },
      {
        id: 'staat-8-check2',
        type: 'question',
        kicker: 'Schritt 8 · Status sauber trennen',
        title: 'Altersvorsorgedepot, Riester und Frühstart-Rente unterscheiden',
        question:
          'Welche Einordnung entspricht dem Rechts- und Informationsstand November 2026?',
        options: [
          'Das Altersvorsorgedepot ist gesetzlich beschlossen (zertifizierte Produkte ab 01.01.2027), bestehende Riester-Verträge haben Bestandsschutz (kein Neugeschäft ab 2027), und die Frühstart-Rente ist ein separates geplantes Programm.',
          'Altersvorsorgedepot und Frühstart-Rente sind ein einziges identisches Programm, das schon seit 2020 läuft.',
          'Alle bestehenden Riester-Verträge werden Ende 2026 automatisch ersatzlos gestrichen.',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Exakt! Die gesetzliche Grundlage für das Altersvorsorgedepot wurde 2026 beschlossen (Produkte ab 01.01.2027). Bestehende Riester-Verträge genießen Bestandsschutz und sollten nicht unüberlegt gekündigt werden. Die Frühstart-Rente ist ein separates geplantes Vorhaben.',
        explanationWrong:
          'Trenne die drei Programme sauber: Altersvorsorgedepot (beschlossen, Start ab 01.01.2027), Riester (Bestandsschutz für Altverträge, kein Neugeschäft ab 2027) und Frühstart-Rente (separat geplant, noch nicht verfügbar).',
      },
      {
        id: 'staat-9-provider-overview',
        type: 'interactive',
        kicker: 'Schritt 9 · Veröffentlichte Anbieterinformationen (Stand: November 2026)',
        title: 'Anbieterübersicht zum Altersvorsorgedepot',
        body: 'Nachdem du die Förderregeln und Kostenfallen kennst, kannst du hier die veröffentlichten Angaben von 11 Anbietern sachlich nach Produkteigenschaften und Informationsstand filtern:',
        widget: 'provider-comparison',
      },
      {
        id: 'staat-10-completion',
        type: 'completion',
        kicker: 'Modul 06 abgeschlossen',
        title: 'Alle 6 Kernmodule geschafft!',
        body: 'Du kannst staatliche Förderprogramme jetzt nach ihrem Status unterscheiden, Bedingungen mit vier klaren Fragen prüfen und Anbieterangaben ohne Werbebrille vergleichen.',
        summaryPoints: [
          'Aktiv nutzbar: Vermögenswirksame Leistungen (VL), Arbeitnehmersparzulage und Wohnungsbauprämie (inkl. U25-Regel).',
          'Ab 01.01.2027: Zertifizierte Altersvorsorgedepots auf Basis des 2026 beschlossenen Gesetzes; konkrete Anbieterbedingungen können sich bis zur Zertifizierung noch ändern.',
          'Bestandsschutz vs. Planung: Bestehende Riester-Verträge laufen weiter (nicht unüberlegt kündigen); die Frühstart-Rente ist ein separates geplantes Programm.',
          'Stelle vor jedem Vertrag die 4 Prüf-Fragen zu Förderberechtigung, Eigenbeitrag, Gesamtkosten/Bindung und Verfügbarkeit.',
        ],
        depotBridge: {
          label: 'Im Vorsorgedepot-Rechner durchspielen',
          description:
            'Simuliere im Rechner unterschiedliche Kostenannahmen, Zulagen und Laufzeiten.',
          to: '/rechner',
        },
      },
    ],
    sections: [
      {
        heading: '1. Förderprogramme und die 4 Prüf-Fragen',
        paragraphs: [
          'Viele Betriebe zahlen monatlich Vermögenswirksame Leistungen (VL) zusätzlich zum Lohn. Innerhalb der Einkommensgrenzen (Rechts- und Informationsstand: November 2026) gibt es dazu die staatliche Arbeitnehmersparzulage sowie bei Bausparverträgen die Wohnungsbauprämie (inkl. U25-Sonderregel).',
          'Prüfe vor jedem Abschluss: 1. Bin ich förderberechtigt? 2. Wie viel muss ich selbst einzahlen? 3. Welche Kosten und Bindungsfristen gelten? 4. Wann und wie kann ich über das Geld verfügen?',
        ],
      },
      {
        heading: '2. Altersvorsorgedepot ab 2027, Riester-Bestandsschutz & Frühstart-Rente',
        paragraphs: [
          'Die gesetzliche Grundlage wurde 2026 beschlossen. Zertifizierte Produkte sollen ab dem 1. Januar 2027 angeboten werden. Konkrete Anbieterbedingungen können sich bis zur endgültigen Zertifizierung und Veröffentlichung der Produktunterlagen noch ändern.',
          'Bestehende Riester-Verträge haben Bestandsschutz (kein Neugeschäft ab 2027) und sollten individuell auf Kosten, Garantien und Wechselbedingungen geprüft werden. Die Frühstart-Rente ist dagegen ein separates geplantes Programm für Kinder und Jugendliche.',
        ],
      },
    ],
    practicalExample: {
      title: 'Praxisbeispiel: Mia (17) nutzt 26 € VL monatlich nach dem 4-Fragen-Check',
      scenario:
        'Mias Ausbildungsbetrieb zahlt 26 € monatlich an Vermögenswirksamen Leistungen (VL).',
      takeaway:
        'Über 6 Einzahlungsjahre summiert sich der Arbeitgeber-Zuschuss auf 1.872 € plus mögliche staatliche Arbeitnehmersparzulage – vorausgesetzt, Mia wählt einen Vertrag mit niedrigen Kosten.',
    },
    interactiveType: 'state-support',
    merkeSummary: [
      'Unterscheide zwischen aktiven Förderungen (VL, Sparzulage, Wohnungsbauprämie), dem ab 01.01.2027 startenden Altersvorsorgedepot, Riester-Bestandsverträgen und der geplanten Frühstart-Rente.',
      'Prüfe jeden Vertrag mit den 4 Fragen: Förderberechtigung, Eigenbeitrag, Kosten/Bindungsfrist und Verfügbarkeit.',
      'Lass dich nicht von „0 € Depotgebühr“ oder kurzen Startaktionen blenden, sondern prüfe Effektivkosten, Fondsauswahl und Folgekonditionen.',
    ],
    quiz: [
      {
        id: 'staat-q1',
        question: 'Was sind „Vermögenswirksame Leistungen“ (VL)?',
        options: [
          'Ein freiwilliger oder tariflicher Geldzuschuss vom Arbeitgeber, der direkt in einen Sparvertrag fließt.',
          'Ein Kredit vom Finanzamt, den man mit 10 % Zinsen zurückzahlen muss.',
          'Ein Gewinnspiel der Zentralbank für alle unter 18 Jahren.',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Richtig! Viele Arbeitgeber zahlen schon in der Ausbildung monatlich VL dazu.',
        explanationWrong:
          'VL sind zusätzliche Leistungen deines Arbeitgebers in einen Sparvertrag.',
      },
      {
        id: 'staat-q2',
        question:
          'Welcher rechtliche Stand gilt (Rechts- und Informationsstand: November 2026) für das Altersvorsorgedepot und die Frühstart-Rente?',
        options: [
          'Beide sind bereits seit 2010 identisch und automatisch für jeden aktiv.',
          'Die gesetzliche Grundlage für das Altersvorsorgedepot wurde 2026 beschlossen (Produkte ab 01.01.2027); die Frühstart-Rente ist dagegen ein separates geplantes Programm.',
          'Jeder 16-Jährige bekommt dadurch automatisch 500 € bar ausgezahlt.',
        ],
        correctIndex: 1,
        explanationCorrect:
          'Exakt! Das Altersvorsorgedepot startet mit zertifizierten Produkten ab dem 1. Januar 2027, während die Frühstart-Rente ein separates geplantes Vorhaben ist.',
        explanationWrong:
          'Wichtig: Die gesetzliche Grundlage für das Altersvorsorgedepot wurde 2026 beschlossen (Produkte ab 01.01.2027). Die Frühstart-Rente ist ein separates geplantes Programm.',
      },
      {
        id: 'staat-q3',
        question:
          'Welche vier Prüf-Fragen helfen dir, bevor du einen staatlich geförderten Vertrag unterschreibst?',
        options: [
          '1. Bin ich förderberechtigt? 2. Wie viel muss ich selbst einzahlen? 3. Welche Kosten und Bindungsfristen gelten? 4. Wann und wie kann ich über das Geld verfügen?',
          'Nur die Frage, welcher Anbieter die bunteste Werbung schaltet.',
          'Ob der Vertrag innerhalb von 3 Tagen das Geld verdoppelt.',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Genau so ist es! Mit diesen vier Fragen prüfst du systematisch Voraussetzungen, Eigenbeitrag, Kosten und Verfügbarkeit.',
        explanationWrong:
          'Prüfe immer Förderberechtigung, Eigenbeitrag, Kosten/Bindungsfristen und Verfügbarkeit.',
      },
    ],
    nextRoute: '/taschengeld',
  },
  {
    id: 'taschengeld',
    route: '/taschengeld',
    order: 7,
    isCoreTopic: false,
    categoryLabel: 'Praxis-Modul · Budget-Werkzeug',
    title: 'Budget & Taschengeld planen',
    shortTitle: 'Budget & Taschengeld',
    subtitle: 'Einnahmen und Ausgaben gegenüberstellen und deinen echten Spielraum finden.',
    oneLineDescription: 'Monatliche Einnahmen, Ausgaben und freien Puffer berechnen.',
    readingMinutes: 4,
    hook: 'Wie viel Geld bleibt dir am Monatsende wirklich übrig?',
    intro:
      'Ein klarer Kassensturz dauert keine fünf Minuten: Stell deine monatlichen Einnahmen und Ausgaben nebeneinander und finde heraus, wie viel Puffer wirklich frei ist.',
    steps: [
      {
        id: 'taschengeld-1-intro',
        type: 'intro',
        kicker: 'Praxis-Modul · Budget & Taschengeld',
        title: 'Dein monatlicher Kassensturz',
        hook: 'Kleine Abos und Snacks summieren sich oft unbemerkt auf 50 € bis 100 € im Monat.',
        body: 'In diesem Praxis-Modul prüfst du deine Einnahmen und Ausgaben und lernst die Dreiteilung zwischen kurzfristiger Reserve, freiem langfristigem Sparen und gebundener Altersvorsorge kennen.',
        visual: 'budget-balance',
        ctaLabel: 'Praxis-Modul starten',
      },
      {
        id: 'taschengeld-2-abocheck',
        type: 'explanation',
        kicker: 'Konzept 1 · Überblick & Dreiteilung',
        title: 'Wohin fließt dein Geld jeden Monat?',
        body: 'Stell einmal im Monat deine sicheren Einnahmen (Taschengeld, Nebenjob, Ausbildungsvergütung) deinen festen und variablen Ausgaben gegenüber. Bleibt am Monatsende ein Überschuss, unterscheidest du drei Zwecke: 1. kurzfristige Reserve (Tagesgeld/Notgroschen), 2. freies langfristiges Sparen (flexibles Depot) und 3. gebundene Altersvorsorge (z. B. Altersvorsorgedepot). Dein gesamter Überschuss sollte niemals automatisch in einen gebundenen Vertrag fließen.',
        highlightPoint:
          'Dreiteilung für deinen Überschuss: 1. kurzfristige Reserve · 2. freies langfristiges Sparen · 3. gebundene Altersvorsorge.',
        visual: 'abo-check',
        moreInfo: {
          title: 'Warum nicht den gesamten Überschuss fest binden?',
          points: [
            '1. Kurzfristige Reserve: Dein Notgroschen auf dem Tagesgeldkonto schützt dich bei Reparaturen, Umzug oder Prüfungsphasen.',
            '2. Freies langfristiges Sparen: Im normalen Depot bleibt dein Geld vor dem Rentenbeginn erreichbar.',
            '3. Gebundene Altersvorsorge: Ein Altersvorsorgedepot bietet staatliche Zulagen, bindet das Kapital aber zweckgebunden bis zum Ruhestand.',
          ],
        },
      },
      {
        id: 'taschengeld-3-interactive',
        type: 'interactive',
        kicker: 'Konzept 2 · Interaktiver Budget-Planer',
        title: 'Trag deine Einnahmen und Ausgaben ein',
        body: 'Passe die Beispielwerte an deine Situation an oder füge eigene Kategorien hinzu:',
        widget: 'budget-mini',
      },
      {
        id: 'taschengeld-4-check1',
        type: 'question',
        kicker: 'Verständnis-Check · Defizit',
        title: 'Wenn Ausgaben höher sind als Einnahmen',
        question: 'Deine monatlichen Einnahmen liegen bei 180 €, deine Ausgaben bei 195 €. Was ist jetzt der richtige Schritt?',
        options: [
          'Zuerst die laufenden Ausgaben prüfen und senken, bis wieder ein Überschuss bleibt.',
          'Trotzdem sofort einen Aktien-Sparplan über 50 € starten.',
          'Einen Konsumkredit aufnehmen, um weiterzusparen.',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Richtig. Solange du monatlich mehr ausgibst als du einnimmst, hat der Ausgleich deines Budgets oberste Priorität.',
        explanationWrong:
          'Bei einem Minus im Monatsbudget darfst du kein Geld langfristig binden oder Schulden machen – zuerst müssen die Ausgaben angepasst werden.',
      },
      {
        id: 'taschengeld-5-check2',
        type: 'question',
        kicker: 'Verständnis-Check · Überschuss aufteilen',
        title: '50 € übrig – wie vorgehen?',
        question: 'Du hast nach allen Ausgaben 50 € im Monat übrig, besitzt aber noch keinen Notgroschen. Was ist sinnvoll?',
        options: [
          'Zuerst die kurzfristige Reserve (Notgroschen) auf dem Tagesgeld aufbauen und den Überschuss nicht komplett in eine gebundene Altersvorsorge stecken.',
          'Die vollen 50 € sofort bis zum 67. Lebensjahr fest binden.',
          'Alles sofort für Konsum auf Raten ausgeben.',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Perfekt! Ein sicherer Puffer auf dem Tagesgeldkonto hat Vorrang. Danach kannst du zwischen freiem langfristigem Sparen und gebundener Altersvorsorge abwägen.',
        explanationWrong:
          'Ohne Notgroschen solltest du zuerst deine kurzfristige Reserve aufbauen, statt den gesamten Überschuss langfristig zu binden.',
      },
      {
        id: 'taschengeld-6-completion',
        type: 'completion',
        kicker: 'Praxis-Modul abgeschlossen',
        title: 'Dein Budget-Kompass steht!',
        body: 'Du weißt jetzt, wie du Einnahmen und Ausgaben im Blick behältst und deinen Überschuss überlegt aufteilst.',
        summaryPoints: [
          'Ein ehrlicher Kassensturz schützt davor, mehr Geld zu verplanen, als monatlich hereinkommt.',
          'Unterscheide bei deinem Überschuss zwischen kurzfristiger Reserve, freiem langfristigem Sparen und gebundener Altersvorsorge.',
        ],
        depotBridge: {
          label: 'Zum Budget-, Zinseszins- & Vorsorgedepot-Rechner',
          description: 'Nutze jederzeit den Rechner, um Budget, freies Sparen und das Altersvorsorgedepot gemeinsam durchzuspielen.',
          to: '/rechner',
        },
      },
    ],
    sections: [
      {
        heading: '1. Wohin fließt dein Geld jeden Monat?',
        paragraphs: [
          'Kleine Alltagsausgaben wie Snacks, In-App-Käufe oder Abos summieren sich schnell auf 50 € bis 100 € im Monat.',
          'Stell alle festen Einnahmen und Ausgaben nebeneinander, um deinen echten monatlichen Spielraum zu sehen.',
        ],
      },
      {
        heading: '2. Kurzfristige Reserve, freies Sparen und gebundene Altersvorsorge',
        paragraphs: [
          'Unterscheide drei Aufgaben: 1. kurzfristige Reserve auf dem Tagesgeldkonto, 2. freies langfristiges Sparen im flexiblen Depot und 3. gebundene Altersvorsorge mit staatlicher Förderung.',
          'Zahle niemals deinen gesamten monatlichen Überschuss unflexibel in einen gebundenen Vertrag ein, solange deine Reserve und deine mittelfristigen Ziele nicht abgedeckt sind.',
        ],
      },
    ],
    practicalExample: {
      title: 'Praxisbeispiel: Der Abo-Check bringt 20 € pro Monat',
      scenario:
        'Amir (17) stellt fest, dass er zwei ungenutzte Abos für zusammen 20 € im Monat bezahlt.',
      takeaway:
        'Er kündigt beide Abos und teilt das frei gewordene Geld bewusst zwischen seiner kurzfristigen Reserve und seinem langfristigen Sparziel auf.',
    },
    interactiveType: 'budget-planner',
    merkeSummary: [
      'Ein ehrlicher Kassensturz schützt davor, mehr Geld zu verplanen, als monatlich hereinkommt.',
      'Unterscheide klar zwischen kurzfristiger Reserve, freiem langfristigem Sparen und gebundener Altersvorsorge.',
    ],
    quiz: [
      {
        id: 'taschengeld-q1',
        question: 'Deine monatlichen Einnahmen liegen bei 180 €, deine Ausgaben bei 195 €. Was ist jetzt der richtige Schritt?',
        options: [
          'Trotzdem einen Aktien-Sparplan über 50 € starten.',
          'Zuerst die laufenden Ausgaben prüfen und kürzen, bis die Einnahmen wieder höher sind als die Ausgaben.',
          'Einen Ratenkredit für Konsumausgaben aufnehmen.',
        ],
        correctIndex: 1,
        explanationCorrect:
          'Richtig! Solange du jeden Monat mehr ausgibst als du einnimmst, hat das Ausgleichen deines Budgets oberste Priorität.',
        explanationWrong:
          'Wenn die Ausgaben höher sind als die Einnahmen, müssen zuerst die Ausgaben angepasst werden.',
      },
      {
        id: 'taschengeld-q2',
        question: 'Welche drei Bereiche solltest du unterscheiden, wenn am Monatsende Geld übrig bleibt?',
        options: [
          'Kurzfristige Reserve, freies langfristiges Sparen und gebundene Altersvorsorge.',
          'Nur Girokonto und Dispokredit.',
          'Den gesamten Überschuss immer sofort bis zum Rentenbeginn festlegen.',
        ],
        correctIndex: 0,
        explanationCorrect:
          'Perfekt! So hältst du genug Geld flexibel verfügbar und bindest nur den Teil, auf den du langfristig verzichten kannst.',
        explanationWrong:
          'Unterscheide immer zwischen kurzfristiger Reserve, freiem langfristigem Sparen und gebundener Altersvorsorge.',
      },
    ],
  },
];

export type Lesson = LessonModule;
export type InteractiveWidgetKind = InteractiveStepWidget;

export const CORE_LESSONS = LESSONS.filter((lesson) => lesson.isCoreTopic);
export const BONUS_LESSON = LESSONS.find((lesson) => !lesson.isCoreTopic)!;
export const BONUS_LESSONS = LESSONS.filter((lesson) => !lesson.isCoreTopic);

export function getLessonById(id: string): LessonModule | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

export function getLessonByRoute(routePath: string): LessonModule | undefined {
  return LESSONS.find((lesson) => lesson.route === routePath);
}

export function getNextLesson(lessonId: string): LessonModule | null {
  const current = getLessonById(lessonId);
  if (!current || !current.nextRoute) return null;
  return getLessonByRoute(current.nextRoute) ?? null;
}

export const DAILY_QUESTIONS: DailyQuestionItem[] = [
  {
    id: 'dq-inflation-100',
    topicId: 'grundlagen',
    topicLabel: 'Grundlagen',
    question:
      'Auf deinem Girokonto liegen 100 € unverzinst. Die Inflation beträgt 2 % pro Jahr. Was passiert nach 10 Jahren?',
    options: [
      'Auf dem Konto stehen weiterhin 100 €, aber die Kaufkraft entspricht nur noch etwa 82 €.',
      'Auf dem Konto stehen nach 10 Jahren nur noch 82 €.',
      'Die Kaufkraft steigt automatisch auf 120 €.',
    ],
    correctIndex: 0,
    explanation:
      'Der Euro-Betrag auf dem Konto bleibt bei 100 €, aber weil Preise über 10 Jahre steigen, kannst du dir davon real nur noch so viel kaufen wie heute für rund 82 €.',
  },
  {
    id: 'dq-zinseszins-start',
    topicId: 'zinseszins',
    topicLabel: 'Zinseszins',
    question:
      'Warum hat jemand, der mit 17 Jahren 30 € monatlich anlegt, mit 50 oft deutlich mehr Kapital als jemand, der erst mit 30 Jahren 50 € monatlich startet?',
    options: [
      'Weil Jüngere an der Börse höhere Zinsen geschenkt bekommen.',
      'Weil die Erträge 13 Jahre länger Zeit haben, selbst wieder neue Erträge (Zinseszins) zu erwirtschaften.',
      'Weil Banken ab 30 Jahren keine Sparpläne mehr erlauben.',
    ],
    correctIndex: 1,
    explanation:
      'Beim Zinseszins arbeitet die Zeit exponentiell: Die zusätzlichen 13 Jahre sorgen dafür, dass bereits angesammelte Erträge immer kräftiger mitwachsen.',
  },
  {
    id: 'dq-notgroschen',
    topicId: 'anlageklassen',
    topicLabel: 'Anlageklassen',
    question:
      'Welche Anlageform eignet sich am besten für deinen kurzfristigen Notgroschen (z. B. 1.000 € Sicherheitsreserve)?',
    options: [
      'Ein Tagesgeldkonto mit täglicher Verfügbarkeit und Einlagensicherung.',
      'Eine einzelne Aktie eines bekannten Smartphone-Herstellers.',
      'Ein geschlossener Vertrag mit 7 Jahren Kündigungsfrist.',
    ],
    correctIndex: 0,
    explanation:
      'Dein Notgroschen muss jederzeit verfügbar sein und darf nicht im Wert schwanken – genau dafür ist ein Tagesgeldkonto da.',
  },
  {
    id: 'dq-grundzulage-360',
    topicId: 'altersvorsorgedepot',
    topicLabel: 'Vorsorgedepot',
    question:
      'Du zahlst 30 € pro Monat (360 € im Jahr) in ein gefördertes Altersvorsorgedepot ein. Wie hoch ist die jährliche Grundzulage in diesem Modell?',
    options: [
      '180 € (50 Cent Grundzulage je eingezahltem Euro für die ersten 360 € Jahresbeitrag).',
      '30 € pauschal für das gesamte Jahr.',
      '540 € unabhängig vom eigenen Beitrag.',
    ],
    correctIndex: 0,
    explanation:
      'Für die ersten 360 € Eigenbeitrag pro Jahr werden in diesem Modell 50 Cent Grundzulage je Euro berücksichtigt – bei 360 € Jahresbeitrag also 180 €.',
  },
  {
    id: 'dq-zulage-vs-rendite',
    topicId: 'altersvorsorgedepot',
    topicLabel: 'Vorsorgedepot',
    question:
      'Worin liegt beim Altersvorsorgedepot der wichtigste Unterschied zwischen staatlicher Zulage und Kapitalmarktrendite?',
    options: [
      'Die Zulage berechnet sich nach gesetzlichen Förderregeln aus deinem Beitrag; die Kapitalmarktrendite schwankt und ist nicht garantiert.',
      'Die Kapitalmarktrendite ist gesetzlich fest garantiert, während die Zulage täglich an der Börse schwankt.',
      'Beide Werte stehen schon bei Vertragsabschluss auf den Cent genau für 45 Jahre fest.',
    ],
    correctIndex: 0,
    explanation:
      'Staatliche Zulagen folgen klaren Förderregeln bei Erfüllung der Voraussetzungen. Die Wertentwicklung am Kapitalmarkt ist dagegen eine ungarantierte Modellannahme.',
  },
  {
    id: 'dq-null-euro-depotgebuehr',
    topicId: 'staat',
    topicLabel: 'Staatliche Hilfe',
    question:
      'Was bedeutet die Werbeaussage „0 € Depotgebühr“ bei einem Altersvorsorgedepot?',
    options: [
      'Es fällt keine separate Grundgebühr für die Depotführung an – laufende Produktkosten (TER), Spreads, Orderkosten oder zeitliche Grenzen von Startaktionen müssen trotzdem geprüft werden.',
      'Das gesamte Produkt ist über die gesamte Laufzeit von 40 Jahren garantiert frei von sämtlichen Fonds-, Transaktions- und Folgekosten.',
      'Der Staat übernimmt automatisch alle Fonds- und Börsengebühren.',
    ],
    correctIndex: 0,
    explanation:
      '„0 € Depotgebühr“ heißt nicht automatisch 0 € Gesamtkosten. Prüfe immer Produktkosten, Auswahlbeschränkungen, Spreads und die Dauer möglicher Erstattungsaktionen.',
  },
];

