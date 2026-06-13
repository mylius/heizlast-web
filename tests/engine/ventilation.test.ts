/**
 * Infiltration (n₅₀) und Wärmerückgewinnung in der Lüftungsberechnung.
 */
import { describe, expect, it } from "vitest"

import { computeRoomVentilationLoss } from "@/engine/calc"
import { exposedFacadeCount, infiltrationFlowM3h } from "@/engine/ventilation"
import {
  defaultParams,
  makeComponent,
  makeRoom,
  makeStorey,
  type CalculationParams,
} from "@/engine/types"

const storey = makeStorey({ id: "EG", storeyHeightM: 2.6, ceilingThicknessM: 0.2 })

// 5×5-Raum, h_i = 2,4 → A 25, V 60; θ_i 20, θ_e −10 → Δθ 30
function room(
  walls: { orientation: "N" | "S" | "O" | "W"; type?: "AW" | "AF" }[],
) {
  return makeRoom({
    id: "R1",
    name: "Test",
    floor: "EG",
    roomWidthM: 5,
    roomLengthM: 5,
    roomType: "Wohnraum",
    storeyId: "EG",
    components: walls.map((w) =>
      makeComponent({
        orientation: w.orientation,
        componentType: w.type ?? "AW",
        widthM: 5,
        lengthHeightM: null,
        uValue: 1.0,
        adjacent: "e",
      }),
    ),
  })
}

const params = (patch: Partial<CalculationParams>): CalculationParams => ({
  ...defaultParams(),
  thetaEC: -10,
  ...patch,
})

describe("exposedFacadeCount", () => {
  it("zählt distinkte Orientierungen, Wand+Fenster derselben Seite einmal", () => {
    const r = room([
      { orientation: "N" },
      { orientation: "N", type: "AF" },
      { orientation: "W" },
    ])
    expect(exposedFacadeCount(r)).toBe(2)
  })

  it("Innenraum ohne Außenbauteile: 0", () => {
    const r = makeRoom({
      id: "X",
      name: "Innen",
      floor: "EG",
      roomWidthM: 3,
      roomLengthM: 3,
      storeyId: "EG",
      components: [
        makeComponent({
          orientation: "N",
          componentType: "IW",
          bruttoM2: 6,
          adjacent: "ij",
        }),
      ],
    })
    expect(exposedFacadeCount(r)).toBe(0)
  })
})

describe("computeRoomVentilationLoss mit Infiltration", () => {
  it("ohne n₅₀ unverändert (nur Mindestluftwechsel)", () => {
    const r = room([{ orientation: "N" }, { orientation: "W" }])
    // V 60 · n_min 0,5 = 30 m³/h → 30 · 0,34 · 30 = 306
    expect(computeRoomVentilationLoss(r, params({ n50: null }), storey)).toBe(306)
    expect(infiltrationFlowM3h(r, params({ n50: null }), storey)).toBe(0)
  })

  it("undichtes Eckzimmer: Infiltration übersteigt Mindestluft", () => {
    const r = room([{ orientation: "N" }, { orientation: "W" }]) // 2 Fassaden → e 0,03
    const p = params({ n50: 10 })
    // V̇_inf = 2·60·10·0,03·1 = 36 > 30 → maßgeblich 36
    expect(infiltrationFlowM3h(r, p, storey)).toBeCloseTo(36, 6)
    // 36 · 0,34 · 30 = 367,2 → 367
    expect(computeRoomVentilationLoss(r, p, storey)).toBe(367)
  })

  it("eine Fassade, mäßig dicht: Mindestluft bleibt maßgeblich", () => {
    const r = room([{ orientation: "N" }]) // 1 Fassade → e 0,02
    const p = params({ n50: 4 })
    // V̇_inf = 2·60·4·0,02 = 9,6 < 30 → unverändert 306
    expect(computeRoomVentilationLoss(r, p, storey)).toBe(306)
  })

  it("Wärmerückgewinnung senkt den Verlust", () => {
    const r = room([{ orientation: "N" }]) // 1 Fassade, e 0,02
    const p = params({ n50: 1, withWrg: true, wrgEta: 0.8 })
    // V̇_inf = 2·60·1·0,02 = 2,4; V_min 30; V_mech = 27,6
    // Φ = 0,34·30·(2,4 + 27,6·0,2) = 0,34·30·7,92 = 80,78 → 81
    expect(computeRoomVentilationLoss(r, p, storey)).toBe(81)
  })

  it("expliziter q_V-Override ignoriert Infiltration", () => {
    const r = room([{ orientation: "N" }, { orientation: "W" }])
    r.qVEnvMinM3h = 20
    const p = params({ n50: 10, withWrg: true, wrgEta: 0.8 })
    // 20 · 0,34 · 30 = 204
    expect(computeRoomVentilationLoss(r, p, storey)).toBe(204)
  })
})
