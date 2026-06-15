/**
 * Automatischer Fahrplan-Vorschlag (engine/recommend.ts).
 */
import { describe, expect, it } from "vitest"

import { getExampleProject } from "@/engine/example"
import {
  economicsForSelection,
  optimizeMeasureYears,
  rankCandidates,
  recommendationReport,
  recommendMeasures,
} from "@/engine/recommend"
import {
  classifyEconomics,
  measurePresetById,
  UNECONOMIC_PAYBACK_FACTOR,
} from "@/engine/measures"
import {
  defaultEnergyParams,
  defaultParams,
  defaultRecommendationInput,
  makeComponent,
  makeRoom,
  makeStorey,
  type Project,
  type RecommendationInput,
} from "@/engine/types"

const params = defaultParams()
const energy = defaultEnergyParams()

function input(patch: Partial<RecommendationInput> = {}): RecommendationInput {
  return { ...defaultRecommendationInput(), ...patch }
}

describe("rankCandidates", () => {
  it("liefert nur wirksame, nicht ausgeschlossene Maßnahmen", () => {
    const project = getExampleProject()
    const cands = rankCandidates(project, params, energy, input())
    expect(cands.length).toBeGreaterThan(0)
    for (const c of cands) {
      expect(c.endenergieSavedKwh).toBeGreaterThan(0)
    }
    // Ausschluss greift
    const firstId = cands[0].preset.id
    const filtered = rankCandidates(
      project,
      params,
      energy,
      input({ excludedPresetIds: [firstId] }),
    )
    expect(filtered.some((c) => c.preset.id === firstId)).toBe(false)
  })

  it("Ziel CO₂ sortiert die Hüllmaßnahmen nach CO₂-Einsparung", () => {
    // Der Heizungstausch steht aus Sequenzgründen zuletzt (separat getestet);
    // die Score-Reihenfolge gilt innerhalb der Hüllmaßnahmen.
    const envelope = rankCandidates(
      getExampleProject(),
      params,
      energy,
      input({ ziel: "co2" }),
    ).filter((c) => c.preset.kind === "envelope")
    for (let i = 1; i < envelope.length; i++) {
      expect(envelope[i].co2SavedKg).toBeLessThanOrEqual(
        envelope[i - 1].co2SavedKg,
      )
    }
  })

  it("Heizungstausch kommt immer nach allen Hüllmaßnahmen", () => {
    // Auch beim Ziel CO₂ (Wärmepumpe hätte den höchsten Score) muss die
    // Anlagentechnik zuletzt stehen — die Hülle wird zuerst gedämmt, damit die
    // Wärmepumpe auf die reduzierte Heizlast ausgelegt werden kann.
    for (const ziel of ["kosten", "co2", "komfort"] as const) {
      const cands = rankCandidates(
        getExampleProject(),
        params,
        energy,
        input({ ziel }),
      )
      const firstHeating = cands.findIndex((c) => c.preset.kind === "heating")
      if (firstHeating < 0) continue
      // Vor der ersten Anlagenmaßnahme steht mindestens eine Hüllmaßnahme …
      expect(
        cands.slice(0, firstHeating).some((c) => c.preset.kind === "envelope"),
      ).toBe(true)
      // … und danach folgt keine Hüllmaßnahme mehr.
      for (let i = firstHeating; i < cands.length; i++) {
        expect(cands[i].preset.kind).toBe("heating")
      }
    }
  })

  it("Wärmepumpe wird empfohlen, wenn aktueller Träger nicht WP ist", () => {
    const { recommended } = recommendationReport(
      getExampleProject(),
      params,
      energy,
      input(),
    )
    expect(recommended.some((c) => c.preset.id === "waermepumpe")).toBe(true)
    // Bei bereits vorhandener Wärmepumpe entfällt der Vorschlag
    const report2 = recommendationReport(
      getExampleProject(),
      params,
      { ...energy, carrier: "waermepumpe" },
      input(),
    )
    expect(
      report2.skipped.find((s) => s.preset.id === "waermepumpe")?.reason,
    ).toBe("bereits vorhanden")
  })
})

describe("recommendationReport — Anwendbarkeit aus U-Werten", () => {
  // Gebäude mit bereits gut gedämmtem Dach (0,15) und Altbau-Außenwand (1,4),
  // ohne Haustür.
  function project(daU: number): Project {
    return {
      projectId: "P",
      description: "Test",
      address: "",
      storeys: {
        DG: makeStorey({
          id: "DG",
          storeyHeightM: 2.6,
          addDefaultDe: false,
          addDefaultFb: false,
        }),
      },
      usageUnits: [
        {
          number: 1,
          name: "WE1",
          rooms: [
            makeRoom({
              id: "R1",
              name: "Raum",
              floor: "DG",
              roomWidthM: 5,
              roomLengthM: 5,
              roomType: "Wohnraum",
              storeyId: "DG",
              components: [
                makeComponent({
                  orientation: "N",
                  componentType: "AW",
                  bruttoM2: 12,
                  uValue: 1.4,
                  deltaUTb: 0.1,
                }),
                makeComponent({
                  orientation: "H",
                  componentType: "DA",
                  bruttoM2: 25,
                  uValue: daU,
                  deltaUTb: 0.1,
                }),
              ],
            }),
          ],
        },
      ],
    }
  }

  it("Dach bei 0,15 (Ziel 0,14) gilt als bereits ausreichend gedämmt", () => {
    const report = recommendationReport(
      project(0.15),
      params,
      energy,
      input(),
    )
    const dach = report.skipped.find((s) => s.preset.id === "dach")
    expect(dach?.reason).toBe("bereits ausreichend gedämmt")
    // Fassade (Altbau 1,4) bleibt empfohlen
    expect(report.recommended.some((c) => c.preset.id === "fassade")).toBe(true)
  })

  it("ungedämmtes Dach (0,9) wird empfohlen", () => {
    const report = recommendationReport(project(0.9), params, energy, input())
    expect(report.recommended.some((c) => c.preset.id === "dach")).toBe(true)
  })

  it("fehlende Bauteilart wird als 'nicht vorhanden' gemeldet", () => {
    const report = recommendationReport(project(0.9), params, energy, input())
    const haustuer = report.skipped.find((s) => s.preset.id === "haustuer")
    expect(haustuer?.reason).toBe("nicht vorhanden")
  })
})

describe("recommendMeasures", () => {
  it("schrittweise: Jahre liegen im Horizont und sind aufsteigend", () => {
    const measures = recommendMeasures(
      getExampleProject(),
      params,
      energy,
      input({ tempo: "schrittweise", horizonYears: 8 }),
    )
    expect(measures.length).toBeGreaterThan(0)
    let prev = 0
    for (const m of measures) {
      expect(m.year).toBeGreaterThanOrEqual(1)
      expect(m.year).toBeLessThanOrEqual(8)
      expect(m.year).toBeGreaterThanOrEqual(prev)
      expect(m.enabled).toBe(true)
      prev = m.year
    }
  })

  it("einmal: alle Maßnahmen im Jahr 1", () => {
    const measures = recommendMeasures(
      getExampleProject(),
      params,
      energy,
      input({ tempo: "einmal" }),
    )
    expect(measures.every((m) => m.year === 1)).toBe(true)
  })
})

describe("Wirtschaftlichkeit", () => {
  it("classifyEconomics: Amortisation vs. Lebensdauer", () => {
    expect(classifyEconomics(10, 40)).toBe("wirtschaftlich")
    expect(classifyEconomics(40, 40)).toBe("wirtschaftlich")
    expect(classifyEconomics(60, 40)).toBe("grenzwertig")
    expect(classifyEconomics(40 * UNECONOMIC_PAYBACK_FACTOR + 1, 40)).toBe(
      "unwirtschaftlich",
    )
    expect(classifyEconomics(Infinity, 40)).toBe("unwirtschaftlich")
  })

  it("Ziel Kosten: unwirtschaftliche Maßnahmen werden mit Begründung ausgeschlossen", () => {
    const report = recommendationReport(
      getExampleProject(),
      params,
      energy,
      input({ ziel: "kosten" }),
    )
    // Fenster (schon modern, Mini-Ersparnis, teuer) → unwirtschaftlich
    const fenster = report.skipped.find((s) => s.preset.id === "fenster")
    expect(fenster?.reason).toBe("unwirtschaftlich")
    expect(fenster?.paybackYears).toBeGreaterThan(fenster!.lifespanYears!)
    // Empfohlene tragen eine Bewertung
    for (const c of report.recommended) {
      expect(["wirtschaftlich", "grenzwertig", "unwirtschaftlich"]).toContain(
        c.economics,
      )
    }
  })

  it("Ziel Komfort: unwirtschaftliche Maßnahmen bleiben (nicht herausgefiltert)", () => {
    const report = recommendationReport(
      getExampleProject(),
      params,
      energy,
      input({ ziel: "komfort" }),
    )
    expect(report.skipped.some((s) => s.reason === "unwirtschaftlich")).toBe(
      false,
    )
  })

  it("economicsForSelection liefert Amortisation und Klasse", () => {
    const project = getExampleProject()
    const m = recommendMeasures(
      project,
      params,
      energy,
      input(),
    ).find((x) => measurePresetById(x.presetId)?.id === "fassade")!
    const e = economicsForSelection(project, params, energy, m)
    expect(e).not.toBeNull()
    expect(e!.paybackYears).toBeGreaterThan(0)
    expect(e!.netCostEur).toBeGreaterThan(0)
    expect(e!.economics).toBe(classifyEconomics(e!.paybackYears, e!.lifespanYears))
  })
})

describe("optimizeMeasureYears", () => {
  it("vergibt fortlaufende Jahre, Heizungstausch zuletzt", () => {
    const project = getExampleProject()
    const measures = recommendMeasures(
      project,
      params,
      energy,
      input({ tempo: "einmal" }),
    )
    const optimized = optimizeMeasureYears(project, params, energy, measures)

    const years = optimized.map((m) => m.year).sort((a, b) => a - b)
    // fortlaufend 1..n, je ein Jahr pro Maßnahme
    expect(years).toEqual(years.map((_, i) => i + 1))

    // Anlagentechnik (Wärmepumpe) bekommt das höchste Jahr
    const heating = optimized.filter(
      (m) => measurePresetById(m.presetId)?.kind === "heating",
    )
    if (heating.length > 0) {
      const maxYear = Math.max(...optimized.map((m) => m.year))
      expect(heating.every((m) => m.year >= maxYear - heating.length + 1)).toBe(
        true,
      )
      expect(Math.max(...heating.map((m) => m.year))).toBe(maxYear)
    }
  })

  it("deaktivierte Maßnahmen bleiben unverändert", () => {
    const project = getExampleProject()
    const measures = recommendMeasures(
      project,
      params,
      energy,
      input({ tempo: "schrittweise" }),
    ).map((m, i) => (i === 0 ? { ...m, enabled: false, year: 99 } : m))
    const optimized = optimizeMeasureYears(project, params, energy, measures)
    const disabled = optimized.find((m) => !m.enabled)
    expect(disabled?.year).toBe(99)
  })
})
