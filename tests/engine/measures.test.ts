/**
 * Maßnahmenkatalog und Szenario-Simulation (engine/measures.ts).
 */
import { describe, expect, it } from "vitest"

import { computeProject } from "@/engine/calc"
import { getExampleProject } from "@/engine/example"
import {
  applyMeasure,
  measurePresetById,
  simulateScenario,
} from "@/engine/measures"
import {
  defaultEnergyParams,
  defaultParams,
  type RenovationMeasureSelection,
} from "@/engine/types"

const params = defaultParams()
const energy = defaultEnergyParams()

function sel(
  presetId: string,
  year: number,
  enabled = true,
): RenovationMeasureSelection {
  const preset = measurePresetById(presetId)!
  return {
    id: `${presetId}-${year}`,
    presetId,
    targetUValue: preset.targetUValue,
    year,
    enabled,
  }
}

describe("applyMeasure", () => {
  it("verbessert nur passende Bauteile, lässt andere unverändert", () => {
    const project = getExampleProject()
    const next = applyMeasure(project, (c) => c.componentType === "AW", 0.2)

    const collect = (p: typeof project, types: string[]) =>
      p.usageUnits
        .flatMap((u) => u.rooms)
        .flatMap((r) => r.components)
        .filter((c) => types.includes(c.componentType))
        .map((c) => c.uValue)

    for (const u of collect(next, ["AW"])) expect(u).toBeLessThanOrEqual(0.2)
    // Fenster bleiben unverändert
    expect(collect(next, ["AF"])).toEqual(collect(project, ["AF"]))
  })

  it("verschlechtert keinen bereits besseren U-Wert", () => {
    const project = getExampleProject()
    const next = applyMeasure(project, (c) => c.componentType === "AW", 5.0)
    const before = project.usageUnits
      .flatMap((u) => u.rooms)
      .flatMap((r) => r.components)
      .filter((c) => c.componentType === "AW")
      .map((c) => c.uValue)
    const after = next.usageUnits
      .flatMap((u) => u.rooms)
      .flatMap((r) => r.components)
      .filter((c) => c.componentType === "AW")
      .map((c) => c.uValue)
    expect(after).toEqual(before)
  })

  it("ändert das Originalprojekt nicht", () => {
    const project = getExampleProject()
    const json = JSON.stringify(project)
    applyMeasure(project, (c) => c.componentType === "AW", 0.2)
    expect(JSON.stringify(project)).toBe(json)
  })
})

describe("simulateScenario", () => {
  it("Maßnahmen senken Heizlast und Energiebedarf monoton", () => {
    const project = getExampleProject()
    const measures = [sel("fassade", 1), sel("fenster", 2), sel("dach", 3)]
    const scenario = simulateScenario(project, params, energy, measures)

    expect(scenario.steps.length).toBe(3)
    expect(scenario.finalResults.totalPhiHlW).toBeLessThan(
      scenario.baseResults.totalPhiHlW,
    )
    // Kumulativ sinkende Heizlast je Stufe
    let prev = scenario.baseResults.totalPhiHlW
    for (const step of scenario.steps) {
      expect(step.phiHlW).toBeLessThanOrEqual(prev)
      expect(step.phiHlSavedW).toBeGreaterThanOrEqual(0)
      prev = step.phiHlW
    }
    expect(scenario.phiHlSavedW).toBeGreaterThan(0)
    expect(scenario.endenergieSavedKwh).toBeGreaterThan(0)
    expect(scenario.co2SavedKg).toBeGreaterThan(0)
    expect(scenario.energieKostenSavedEur).toBeGreaterThan(0)
    // Kostenersparnis = Endenergie-Ersparnis × Preis (gleicher Träger)
    expect(scenario.energieKostenSavedEur).toBeCloseTo(
      (scenario.endenergieSavedKwh * energy.energyPriceCtKwh) / 100,
      6,
    )
  })

  it("deaktivierte Maßnahmen wirken nicht", () => {
    const project = getExampleProject()
    const base = computeProject(project, params).totalPhiHlW
    const scenario = simulateScenario(project, params, energy, [
      sel("fassade", 1, false),
    ])
    expect(scenario.steps.length).toBe(0)
    expect(scenario.finalResults.totalPhiHlW).toBe(base)
  })

  it("Kosten und Förderung sind konsistent", () => {
    const project = getExampleProject()
    const scenario = simulateScenario(project, params, energy, [
      sel("fassade", 1),
    ])
    const step = scenario.steps[0]
    if (step.preset.kind === "envelope") {
      expect(step.costEur).toBeCloseTo(
        step.affectedM2 * step.preset.costPerM2,
        6,
      )
    }
    expect(step.fundingEur).toBeCloseTo(
      step.costEur * step.preset.fundingRate,
      6,
    )
    expect(scenario.totalFundingEur).toBeLessThan(scenario.totalCostEur)
  })

  it("Heizungstausch (Wärmepumpe) senkt CO₂/Primärenergie mit Pauschalkosten", () => {
    const project = getExampleProject()
    const scenario = simulateScenario(project, params, energy, [
      sel("waermepumpe", 1),
    ])
    const step = scenario.steps[0]
    expect(step.preset.kind).toBe("heating")
    // Erzeugerwechsel ändert die Heizlast nicht, aber Energie/CO₂ deutlich
    expect(step.phiHlSavedW).toBe(0)
    expect(step.co2SavedKg).toBeGreaterThan(0)
    expect(scenario.finalEnergy.primaerenergieKwh).toBeLessThan(
      scenario.baseEnergy.primaerenergieKwh,
    )
    expect(scenario.finalEnergy.endenergieKwh).toBeLessThan(
      scenario.baseEnergy.endenergieKwh,
    )
    // Pauschalkosten, nicht flächenbasiert
    if (step.preset.kind === "heating") {
      expect(step.costEur).toBe(step.preset.fixedCostEur)
    }
    expect(step.affectedM2).toBe(0)
  })

  it("Reihenfolge folgt dem Umsetzungsjahr", () => {
    const project = getExampleProject()
    const scenario = simulateScenario(project, params, energy, [
      sel("dach", 3),
      sel("fassade", 1),
    ])
    expect(scenario.steps.map((s) => s.preset.id)).toEqual(["fassade", "dach"])
  })
})
