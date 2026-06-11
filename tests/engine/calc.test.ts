/**
 * Unit-Tests für die kritischen Sonderfälle der Berechnungslogik.
 */
import { describe, expect, it } from "vitest"

import { getEffectiveComponentAreas } from "@/engine/calc"
import { effectiveComponents, effectiveFIx } from "@/engine/derive"
import {
  makeComponent,
  makeRoom,
  makeStorey,
} from "@/engine/types"

const room = makeRoom({
  id: "R1",
  name: "Test",
  floor: "EG",
  roomWidthM: 4,
  roomLengthM: 5,
  storeyHeightM: 2.5,
  ceilingThicknessM: 0.2,
})

describe("getEffectiveComponentAreas", () => {
  it("brutto_m2 > 0 hat Vorrang", () => {
    const c = makeComponent({
      orientation: "N",
      componentType: "AW",
      bruttoM2: 10,
      widthM: 3,
      lengthHeightM: 2,
    })
    expect(getEffectiveComponentAreas(c, room)).toEqual([10, 0, 10])
  })

  it("Wand: lengthHeightM null UND 0 fallen auf Raumhöhe zurück (Falsy-Semantik)", () => {
    const cNull = makeComponent({
      orientation: "N",
      componentType: "AW",
      widthM: 4,
      lengthHeightM: null,
    })
    const cZero = makeComponent({
      orientation: "N",
      componentType: "AW",
      widthM: 4,
      lengthHeightM: 0,
    })
    expect(getEffectiveComponentAreas(cNull, room)[0]).toBe(10) // 4 × 2.5
    expect(getEffectiveComponentAreas(cZero, room)[0]).toBe(10)
  })

  it("horizontales Bauteil braucht width UND length", () => {
    const c = makeComponent({
      orientation: "H",
      componentType: "FB",
      widthM: 4,
      lengthHeightM: 0,
    })
    expect(getEffectiveComponentAreas(c, room)[0]).toBe(0)
  })

  it("Öffnungen überschreiben abzugM2", () => {
    const c = makeComponent({
      orientation: "N",
      componentType: "AW",
      bruttoM2: 10,
      abzugM2: 99, // wird ignoriert, da Öffnungen vorhanden
      openings: [
        makeComponent({ orientation: "N", componentType: "AF", bruttoM2: 1.5 }),
        makeComponent({ orientation: "N", componentType: "AF", bruttoM2: 0.5 }),
      ],
    })
    expect(getEffectiveComponentAreas(c, room)).toEqual([10, 2, 8])
  })

  it("A_k wird bei 0 gekappt", () => {
    const c = makeComponent({
      orientation: "N",
      componentType: "AW",
      bruttoM2: 1,
      abzugM2: 2,
    })
    expect(getEffectiveComponentAreas(c, room)[2]).toBe(0)
  })
})

describe("effectiveFIx", () => {
  it("expliziter Wert hat Vorrang, auch 0 und negativ", () => {
    const base = { orientation: "N" as const, componentType: "IW" as const }
    expect(effectiveFIx(makeComponent({ ...base, fIx: -0.13 }))).toBe(-0.13)
    expect(effectiveFIx(makeComponent({ ...base, fIx: 0 }))).toBe(0)
  })

  it("null wird abgeleitet: intern 0, extern 1", () => {
    expect(
      effectiveFIx(
        makeComponent({
          orientation: "N",
          componentType: "IW",
          adjacent: "ij",
          fIx: null,
        }),
      ),
    ).toBe(0)
    expect(
      effectiveFIx(
        makeComponent({
          orientation: "N",
          componentType: "AW",
          adjacent: "e",
          fIx: null,
        }),
      ),
    ).toBe(1)
  })
})

describe("effectiveComponents (Geschoss-DE/FB-Injektion)", () => {
  const storey = makeStorey({ id: "EG", storeyHeightM: 2.5 })
  const baseRoom = makeRoom({
    id: "R1",
    name: "Test",
    floor: "EG",
    roomWidthM: 4,
    roomLengthM: 5,
    storeyId: "EG",
  })

  it("ohne Geschoss keine Injektion", () => {
    expect(effectiveComponents(baseRoom)).toHaveLength(0)
  })

  it("mit Geschoss werden DE und FB ergänzt", () => {
    const comps = effectiveComponents(baseRoom, storey)
    expect(comps.map((c) => c.component.componentType)).toEqual(["DE", "FB"])
    expect(comps.every((c) => c.fromStorey)).toBe(true)
    // Fläche = Raumfläche
    expect(comps[0].component.bruttoM2).toBe(20)
  })

  it("eigene DE/FB unterdrücken die Injektion", () => {
    const r = {
      ...baseRoom,
      components: [
        makeComponent({ orientation: "H", componentType: "DE", bruttoM2: 5 }),
      ],
    }
    const comps = effectiveComponents(r, storey)
    expect(comps.map((c) => c.component.componentType)).toEqual(["DE", "FB"])
    expect(comps[0].fromStorey).toBe(false)
    expect(comps[1].fromStorey).toBe(true)
  })

  it("addDefault* = false deaktiviert die Injektion", () => {
    const st = makeStorey({
      id: "DG",
      storeyHeightM: 2,
      addDefaultDe: false,
      addDefaultFb: false,
    })
    expect(effectiveComponents(baseRoom, st)).toHaveLength(0)
  })
})
