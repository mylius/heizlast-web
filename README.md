# heizlast-web

Heizlastberechnung nach **DIN EN 12831** als reine Browser-Anwendung — kein
Backend, alle Daten bleiben lokal (localStorage bzw. Projektdateien).

Zwei Modi:

- **Geführter Assistent** für Hausbesitzer: Schritt für Schritt Gebäude,
  Standort (Norm-Außentemperatur per PLZ), Geschosse und Räume erfassen — mit
  Bauteil-Vorlagen nach Baualtersklasse („Altbau vor 1977", „WSchVO 1977",
  „Modern EnEV/GEG", „Passivhaus") und verständlichen Hinweisen.
- **Profi-Modus** für Energieberater: alle Felder des RAUMHEIZLAST-Formulars
  direkt editierbar (f_ix, ΔU_TB, θ_angrenzend, q_V-Überschreibungen,
  Aufheizzuschlag, Geschoss-Defaults für FB/DE) mit Live-Neuberechnung.

Exporte: **PDF** (druckoptimierter Bericht, Seitenumbruch je Raum),
**Markdown**, **Excel (XLSX)** und **Projektdatei (JSON)**.

## Verifikation

Die Engine wird gegen eingecheckte Referenz-Fixtures getestet
(`tests/fixtures/`):

- **Bauteilgenaue Paritätstests**: jede Zeile der Transmissionstabellen der
  Beispielprojekte (Flächen, f_ix, U_korr, Φ_T,k) muss exakt den
  Referenzwerten entsprechen — inklusive kaufmännischem Runden (Banker's
  Rounding auf dem exakten Binärwert, `src/engine/round.ts`, verifiziert
  gegen ~390 aufgezeichnete Rundungsfälle).
- **Golden-File-Test**: der Markdown-Bericht ist byte-identisch zur
  Referenzausgabe.
- **Round-Trip-Tests**: gespeicherte `.json`-Projektdateien rechnen nach dem
  Wiedereinlesen identisch; Geschoss-Einstellungen, die das Dateiformat
  nicht kennt, werden beim Export automatisch in explizite Raum-Bauteile
  aufgelöst.

## Entwicklung

```sh
bun install
bun run dev        # Dev-Server
bun run test       # vitest (Paritäts-, Schema-, Komponententests)
bun run build      # Produktions-Build (statisch, dist/)
```

Stack: Bun · Vite · React · TypeScript · Tailwind CSS v4 · shadcn/ui ·
zustand · zod · exceljs (lazy geladen).

Hinweis: Die Scripts nutzen `bunx --bun`, damit Vite/Vitest unter der
Bun-Runtime laufen (vermeidet rolldown-Binding-Konflikte, wenn Node eine
andere CPU-Architektur hat als Bun).

## Fachliche Hinweise

- Abgedeckt: Transmissions- und Lüftungswärmeverluste nach EN 12831-1
  (Mindestluftwechsel nach Raumart, Temperaturkorrekturfaktoren,
  Wärmebrückenzuschläge, Aufheizzuschlag, Nutzungseinheiten-Summen).
- **Temperatur-Konvention:** Φ_T,k = A·U·f_ix·(θᵢ−θ_adj) kennt zwei
  gleichwertige DIN-Schreibweisen — tatsächliche Nachbartemperatur mit
  f_ix = 1/leer, oder θ_adj = θ_e mit Normfaktor f_x. Beides zusammen
  mindert doppelt; der Profi-Modus warnt bei dieser Kombination.
- Der Assistent setzt unbeheizte Nachbarbereiche über effektive
  Temperaturen aus b-Faktoren an (Beiblatt 1, vereinfacht): unbeheizter
  Keller b = 0,5, unbeheizter Dachboden b = 0,9, Erdreich b ≈ 0,33.
- Außenbauteil-Vorlagen enthalten den pauschalen Wärmebrückenzuschlag
  ΔU_TB = 0,10 W/(m²K) nach DIN/TS 12831-1.
- **Lüftung:** maßgeblich ist max(hygienischer Mindestluftwechsel,
  Infiltration). Die Infiltration V̇_inf = 2·V·n₅₀·e·ε berücksichtigt die
  Luftdichtheit n₅₀ (Assistent: aus Baualtersklasse, Profi: editierbar) und
  die Zahl der dem Wind ausgesetzten Fassaden. Lüftungsanlagen mit
  Wärmerückgewinnung reduzieren den hygienisch zugeführten Anteil um η.
- Dachgeschosse: Kniestock- und Firsthöhe ergeben die mittlere Raumhöhe —
  Volumen und Giebelwände (Trapezflächen) sind damit automatisch richtig.
- Der Assistent fragt die **lichte Raumhöhe** ab (innen messbar); für
  Wandflächen wird automatisch die Geschosshöhe (+ 0,20 m Deckendicke)
  angesetzt. Geschoss-Grenzen zwischen angelegten Geschossen sind
  automatisch „beheizt" (Decke = Fußboden des Geschosses darüber); nur die
  Unterseite des untersten und die Oberseite des obersten Geschosses werden
  abgefragt.
- Vereinfacht: erdreichberührte Bodenplatten (kein B′-Verfahren), keine
  Verteilverluste (EN 12831-2).
- Die Norm-Außentemperaturen (`src/data/normaussentemperatur.json`) folgen
  den klassischen 2-K-Klimazonen je PLZ-Region; für verbindliche
  Berechnungen den ortsgenauen Wert der DIN/TS 12831-1 eintragen (das Feld
  ist immer manuell überschreibbar).
