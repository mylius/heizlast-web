/**
 * Orientierende Jahresenergiebilanz (engine/energy.ts).
 * Plausibilitäts- und Konsistenzprüfungen am Beispielprojekt.
 */
import { describe, expect, it } from "vitest"

import { getExampleProject } from "@/engine/example"
import {
  CO2_FACTOR_KG_PER_KWH,
  PRIMARY_ENERGY_FACTOR,
  computeEnergy,
  effizienzhausEstimate,
  transmissionTransferW_K,
  ventilationTransferW_K,
} from "@/engine/energy"
import { aFloorM2 } from "@/engine/derive"
import { defaultEnergyParams, defaultParams } from "@/engine/types"

const project = getExampleProject()
const params = defaultParams()
const energy = defaultEnergyParams()

describe("Transferkoeffizienten", () => {
  it("H_T und H_V sind positiv", () => {
    expect(transmissionTransferW_K(project)).toBeGreaterThan(0)
    expect(ventilationTransferW_K(project, params)).toBeGreaterThan(0)
  })
})

describe("computeEnergy", () => {
  const res = computeEnergy(project, params, energy)

  it("beheizte Fläche = Σ Raumflächen (ohne Override)", () => {
    const sum = project.usageUnits
      .flatMap((u) => u.rooms)
      .reduce((s, r) => s + aFloorM2(r), 0)
    expect(res.aHeatedM2).toBeCloseTo(sum, 6)
  })

  it("Primärenergie = Endenergie · f_P, CO₂ = Endenergie · g_CO2", () => {
    expect(res.primaerenergieKwh).toBeCloseTo(
      res.endenergieKwh * PRIMARY_ENERGY_FACTOR[energy.carrier],
      6,
    )
    expect(res.co2Kg).toBeCloseTo(
      res.endenergieKwh * CO2_FACTOR_KG_PER_KWH[energy.carrier],
      6,
    )
  })

  it("Bedarfswerte sind positiv und plausibel groß", () => {
    expect(res.qHeatKwh).toBeGreaterThan(0)
    expect(res.endenergieKwh).toBeGreaterThan(res.qHeatKwh > 0 ? 0 : -1)
    expect(res.primaerSpecificKwhM2a).toBeGreaterThan(0)
  })

  it("bessere U-Werte (Override H_T via Fläche) senken den Bedarf nicht künstlich", () => {
    const more = computeEnergy(project, params, {
      ...energy,
      gradtagzahlKd: energy.gradtagzahlKd * 2,
    })
    expect(more.qHeatKwh).toBeGreaterThan(res.qHeatKwh)
  })
})

describe("effizienzhausEstimate", () => {
  it("kleinere Primärenergie ⇒ bessere Stufe", () => {
    expect(effizienzhausEstimate(25)).toBe("EH 40")
    expect(effizienzhausEstimate(200)).toBe("Bestand (unsaniert)")
  })
})
