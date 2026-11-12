# Geldstart – Finanzbildung & Virtuelles Übungsdepot für junge Leute (16–20 Jahre)

**Geldstart** ist eine mobil-optimierte Web-Anwendung zur finanziellen Grundbildung für Jugendliche und junge Erwachsene (ca. 16–20 Jahre).

Die App verbindet verständliche Finanzbildung direkt mit einer praktischen, risikofreien Simulation entlang eines klaren pädagogischen Lernflusses:
**Lernen → Verstehen → Im Depot ausprobieren → Ergebnis beobachten → Entscheidung reflektieren**

> **Wichtiger rechtlicher Hinweis:**  
> *Nur zu Bildungszwecken – keine Anlageberatung. Alle Käufe und Verkäufe sind Simulationen. Geldanlagen können an Wert verlieren.*

---

## Inhaltsverzeichnis & Funktionsumfang

Die primäre Navigation umfasst 4 Hauptbereiche (`Start`, `Lernen`, `Depot`, `Mehr`) sowie das jederzeit erreichbare Rechenwerkzeug (`Rechner`):

1. **Start (`/`)** – Persönliches Lern-Dashboard mit Fortschrittsanzeige, kompaktem **Übungsdepot-Überblick**, prominentem Schnellzugriff auf den **Zinseszins- & Budget-Rechner**, direktem Einstieg in die nächste Lektion (`Weiterlernen`) und interaktiver Wissensfrage.
2. **Lernen (`/lernen`)** – Strukturierter Lernpfad mit 6 Kernmodulen, Praxis-Brücken ins Übungsdepot und interaktiven Rechnern:
   - **Grundlagen (`/grundlagen`)**: Sparen vs. Investieren, Inflation & Kaufkraftverlust (inkl. Kaufkraft-Simulator), Notgroschen, Risikostreuung (Diversifikation) und direkte Brücke zum Depot.
   - **Zinseszins (`/zinseszins`)**: Zinsen auf Zinsen, der Faktor Zeit, Vergleich frühes vs. spätes Starten sowie direkter Übergang in den Zinseszins-Rechner und das Übungsdepot.
   - **Anlageklassen (`/anlageklassen`)**: Interaktiver Direktvergleich von 7 Anlageklassen (*Tagesgeld & Festgeld*, *Anleihen*, *Einzelaktien*, *ETFs*, *Immobilien*, *Gold* und *Kryptowährungen*) inklusive direktem Übergang zum Ausprobieren im Übungsdepot.
   - **Sparen mit kleinen Beträgen & Kindergeld (`/kindergeld`)**: Regelmäßigkeit vs. Startsumme, Trennung von Alltag, Rücklage und Sparplan sowie interaktiver Kleinbetrags-Simulator.
   - **Altersvorsorge (`/altersvorsorgedepot`)**: Gesetzliche Rente (Umlageverfahren) vs. private Vorsorge, lange Kapitalbindung und transparente Einordnung geplanter Gesetzeskonzepte.
   - **Hilfe vom Staat (`/staat`)**: Klare Trennung zwischen bereits aktiven Programmen (*Vermögenswirksame Leistungen*, *Arbeitnehmersparzulage*, *Wohnungsbauprämie*, *Riester-Zulagen*) und politisch geplanten Vorhaben (*Frühstart-Rente*, *Altersvorsorgedepot*).
   - **Budget & Taschengeld (`/taschengeld`)**: Monatlicher Einnahmen- und Ausgaben-Rechner zur Ermittlung des realen Sparpotenzials.
3. **Depot (`/depot`)** – **Virtuelles Übungsdepot (5.000,00 € Startguthaben)**:
   - **Start mit 5.000,00 € Spielgeld**: Kauf und Verkauf ausgewählter kuratierter Bildungs-Wertpapiere ohne echtes Geld und ohne echte Orderausführung.
   - **Lektionsbasierte Freischaltung**: Starter-ETF (`EUNL.DE`) und Bargeld (`EUR-CASH`) sind sofort verfügbar; weitere breit gestreute ETFs (`VWCE.DE`, `IEGA.DE`) nach *Grundlagen*, Gold-ETC & Einzelaktien nach *Anlageklassen*, schwankungsintensivere Einzelwerte nach *Zinseszins* + *Anlageklassen*.
   - **Mobile-first Depot-Übersicht**: Virtuelles Gesamtvermögen, verfügbares Spielgeld, Wert der Anlagen, virtueller Gewinn oder Verlust, Anzahl der Positionen, Kursdatum und transparente Simulationshinweise.
4. **Mehr (`/mehr`)** – **Finanz-Werkzeuge** (Zinseszins- & Budget-Rechner, Kompakt-Glossar), transparente Dokumentation der Marktdaten-Architektur, **getrenntes Zurücksetzen** von Lernfortschritt und Übungsdepot und rechtliche Hinweise.
5. **Zinseszins- & Budget-Rechner (`/rechner`)** – Erreichbar über die Startseite, die Lektion *Zinseszins*, den Bereich *Lernen* und *Mehr*.

---

## Prototype market-data sources (Prototyp-Marktdaten & Architektur)

Das Learn Depot verwendet eine austauschbare Provider-Abstraktion (`MarketDataProvider` und `MarketPriceRepository` in `src/lib/market-types.ts` und `src/lib/market-providers.ts`):

1. **Temporäre Prototyp-Quellen (ausschließlich serverseitig über `server.ts`)**:
   - **Börse Frankfurt Public Endpoint (`boerse-frankfurt-prototype`)**: Ruft über `text/event-stream` (SSE) Kurse für kuratierte Xetra-ISINs in EUR ab (`https://api.boerse-frankfurt.de/v1/data/price_information?isin={ISIN}&mic={XETR_OR_XFRA}`).
   - **Nasdaq Public Endpoint (`nasdaq-prototype`)**: Ruft verzögerte Kurse für kuratierte US-Aktien in USD ab (`https://api.nasdaq.com/api/quote/{SYMBOL}/info?assetclass=stocks`).
   - **Frankfurter FX Reference Endpoint**: Ruft einmal pro Refresh-Zyklus den aktuellen USD/EUR-Referenzwechselkurs ab (`https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR`) und teilt ihn für alle USD-Wertpapiere.
   - *Wichtiger Hinweis*: Diese öffentlichen Endpunkte dienen ausschließlich dem technischen Schulprototyp und stellen **keinen lizenzierten kommerziellen Marktdaten-Feed** dar.
2. **Zentraler täglicher Katalog-Refresh & Shared Cache (`SharedDailyQuoteCoordinator`)**:
   - Kurse werden **niemals** pro Nutzer, pro gehaltener Position oder bei jedem Komponenten-Render abgerufen.
   - Stattdessen aktualisiert der Server den kuratierten Bildungskatalog (17 handelbare Instrumente + `EUR-CASH`) zentral einmal pro Tag (mit `pendingRefresh`-Sperre gegen parallele Mehrfachabfragen und Concurrency-Limit `5`).
   - Schlägt die heutige Aktualisierung fehl, bleibt der letzte erfolgreiche Kurs mit `status: 'stale'` erhalten; existiert noch kein Kurs, wird ein klar als `status: 'fallback'` gekennzeichneter Demowert aus der Ausgangsversion genutzt.
3. **Austauschbarkeit für den späteren Produktionsbetrieb**:
   - Für einen späteren öffentlichen oder schulübergreifenden Produktionsbetrieb können die Prototyp-Adapter hinter `MarketDataProvider` und `MarketPriceRepository` ohne Umbau der Depot-Oberfläche oder der Portfolio-Logik durch einen lizenzierten Marktdaten-Provider ersetzt werden.

---

## Technologie-Stack

- **Framework**: React 19 + TypeScript
- **Server / Dev-Middleware**: Express + Vite (`server.ts`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) mit eigenen Design-Tokens (`Bricolage Grotesque`, `Figtree`, `JetBrains Mono`)
- **Persistenz**: Rein lokal im Browser über versionierte `localStorage`-Schlüssel (`geldstart_progress_v1` für Lernfortschritt, `geldstart_depot_v1` für das Übungsdepot)
- **Tests**: Node.js Test-Runner mit `tsx` (`src/test/app.test.ts`)

---

## Lokale Entwicklung, Tests & Build

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver (Express + Vite auf Port 3000) starten
npm run dev

# Produktions-Build erstellen (Ausgabe im Ordner dist/)
npm run build

# TypeScript-Typprüfung (Linting) ausführen
npm run lint

# Unit-Tests für Rechner-Logik, Depot-Arithmetik, Provider-Parsing & Persistenz ausführen
npx tsx --test src/test/app.test.ts
```
