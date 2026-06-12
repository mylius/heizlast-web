/**
 * Plausibilitätsprüfungen: typische Eingabefehler werden erkannt,
 * korrekte Räume bleiben ohne Hinweise.
 */
import { describe, expect, it } from "vitest"

import { computeProject } from "@/engine/calc"
import { getExampleProject } from "@/engine/example"
import { validateProject, validateRoom } from "@/engine/validate"
import {
  defaultParams,
  makeComponent,
  makeRoom,
  makeStorey,
} from "@/engine/types"

const storey = makeStorey({ id: "EG", storeyHeightM: 2.6 })

describe("validateRoom", () => {
  it("Beispielprojekt ist hinweisfrei", () => {
    const project = getExampleProject()
    const results = computeProject(project, defaultParams())
    expect(validateProject(project, results)).toEqual([])
  })

  it("erkennt Öffnungen größer als die Wandfläche", () => {
    const room = makeRoom({
      id: "R1",
      name: "Test",
      floor: "EG",
      roomWidthM: 4,
      roomLengthM: 4,
      storeyId: "EG",
      components: [
        makeComponent({
          orientation: "S",
          componentType: "AW",
          widthM: 2,
          lengthHeightM: null,
          uValue: 1.4,
          openings: [
            makeComponent({
              orientation: "S",
              componentType: "AF",
              bruttoM2: 9, // > 2 × 2,6 = 5,2 m² Wand
              uValue: 1.05,
            }),
          ],
        }),
      ],
    })
    const warnings = validateRoom(room, storey)
    expect(warnings.some((w) => w.includes("größer als die Bruttofläche"))).toBe(
      true,
    )
  })

  it("erkennt Wandlängen über dem Raumumfang", () => {
    const room = makeRoom({
      id: "R1",
      name: "Test",
      floor: "EG",
      roomWidthM: 3,
      roomLengthM: 3, // Umfang 12 m
      storeyId: "EG",
      components: [
        makeComponent({
          orientation: "N",
          componentType: "AW",
          widthM: 14,
          lengthHeightM: null,
          uValue: 1.4,
        }),
      ],
    })
    const warnings = validateRoom(room, storey)
    expect(warnings.some((w) => w.includes("Raumumfang"))).toBe(true)
  })

  it("erkennt Räume ohne Bauteile und ohne Maße", () => {
    const room = makeRoom({
      id: "R1",
      name: "Test",
      floor: "X",
      roomWidthM: 0,
      roomLengthM: 4,
    })
    const warnings = validateRoom(room)
    expect(warnings.some((w) => w.includes("Raumbreite"))).toBe(true)
    expect(warnings.some((w) => w.includes("Keine Bauteile"))).toBe(true)
  })
})
