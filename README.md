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

## Beziehung zum Python-Projekt `heizlastrechner`

Die Berechnungs-Engine ist eine 1:1-Portierung von
[`heizlastrechner`](../heizlastrechner) (Python) nach TypeScript:

- **Identische Ergebnisse**: Paritätstests vergleichen jede Bauteilzeile der
  Beispielprojekte exakt mit von Python generierten Fixtures — inklusive
  CPython-Rundungsverhalten (Banker's Rounding auf dem exakten Binärwert,
  `src/engine/round.ts`).
- **Identischer Markdown-Bericht**: Golden-File-Test gegen die
  Python-Ausgabe (byte-gleich).
- **Kompatible Projektdateien**: gespeicherte `.json`-Projekte rechnen im
  Python-CLI mit identischen Summen (`uv run heizlastrechner projekt.json`).
  Geschoss-Einstellungen, die das Python-JSON-Format nicht kennt, werden beim
  Export automatisch in explizite Raum-Bauteile aufgelöst.

Fixtures neu erzeugen (nach Änderungen am Python-Referenzprojekt):

```sh
cd ../heizlastrechner
uv run python ../heizlast-web/scripts/gen-fixtures.py
```

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
- Dachgeschosse: Kniestock- und Firsthöhe ergeben die mittlere Raumhöhe —
  Volumen und Giebelwände (Trapezflächen) sind damit automatisch richtig.
- Der Assistent fragt die **lichte Raumhöhe** ab (innen messbar); für
  Wandflächen wird automatisch die Geschosshöhe (+ 0,20 m Deckendicke)
  angesetzt. Geschoss-Grenzen zwischen angelegten Geschossen sind
  automatisch „beheizt" (Decke = Fußboden des Geschosses darüber); nur die
  Unterseite des untersten und die Oberseite des obersten Geschosses werden
  abgefragt.
- Vereinfacht: erdreichberührte Bodenplatten (kein B′-Verfahren),
  Infiltration nicht separat von der Mindestlüftung, keine
  Verteilverluste (EN 12831-2).
- Die Norm-Außentemperaturen (`src/data/normaussentemperatur.json`) folgen
  den klassischen 2-K-Klimazonen je PLZ-Region; für verbindliche
  Berechnungen den ortsgenauen Wert der DIN/TS 12831-1 eintragen (das Feld
  ist immer manuell überschreibbar).
