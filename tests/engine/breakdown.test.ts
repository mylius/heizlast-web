/**
 * Verlustaufteilung: die Summe aller Flüsse minus Gewinne muss exakt den
 * Gebäudesummen (Φ_T + Φ_V) entsprechen; nichts geht verloren.
 */
import { describe, expect, it } from "vitest"

import { aggregateHeatLoss } from "@/engine/breakdown"
import { computeProject } from "@/engine/calc"
import { getExampleProject } from "@/engine/example"
import { defaultParams } from "@/engine/types"

describe("aggregateHeatLoss", () => {
  it("Flüsse − Gewinne = Φ_T + Φ_V des Gebäudes", () => {
    const results = computeProject(getExampleProject(), defaultParams())
    const breakdown = aggregateHeatLoss(results)
    expect(breakdown.totalW - breakdown.gainsW).toBe(
      results.totalPhiTW + results.totalPhiVW,
    )
    // Beispielprojekt: Innenwand zum 24-°C-Bad liefert einen Gewinn
    expect(breakdown.gainsW).toBeGreaterThan(0)
  })

  it("Kategorien sind positiv und absteigend sortiert", () => {
    const results = computeProject(getExampleProject(), defaultParams())
    const { categories } = aggregateHeatLoss(results)
    expect(categories.length).toBeGreaterThan(3)
    for (let i = 0; i < categories.length; i++) {
      expect(categories[i].watts).toBeGreaterThan(0)
      if (i > 0) {
        expect(categories[i].watts).toBeLessThanOrEqual(
          categories[i - 1].watts,
        )
      }
    }
    expect(categories.some((c) => c.key === "lueftung")).toBe(true)
  })
})
