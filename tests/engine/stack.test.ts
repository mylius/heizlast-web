/**
 * Geschoss-Stapel: kanonische Sortierung und automatische Grenzen
 * (Decke von Geschoss N = Fußboden von Geschoss N+1).
 */
import { describe, expect, it } from "vitest"

import { normalizeStack } from "@/pages/wizard/stack"
import type { WizardStoreyInput } from "@/pages/wizard/types"

const storey = (
  id: string,
  patch: Partial<WizardStoreyInput> = {},
): WizardStoreyInput => ({
  id,
  label: id,
  heightM: 2.6,
  below: "keller-unbeheizt",
  above: "dach-unbeheizt",
  ...patch,
})

describe("normalizeStack", () => {
  it("sortiert kanonisch (KG → EG → OG1 → OG2 → DG)", () => {
    const result = normalizeStack([storey("DG"), storey("EG"), storey("KG")])
    expect(result.map((s) => s.id)).toEqual(["KG", "EG", "DG"])
  })

  it("setzt Grenzen zwischen Geschossen auf beheizt, Ränder bleiben", () => {
    const result = normalizeStack([
      storey("EG", { below: "keller-unbeheizt", above: "flachdach" }),
      storey("OG1", { below: "aussenluft", above: "dachschraegen", kniestockM: 1, firstM: 3 }),
    ])
    // EG: unterstes → below bleibt; above wird beheizt (OG1 liegt darüber)
    expect(result[0].below).toBe("keller-unbeheizt")
    expect(result[0].above).toBe("beheizt")
    expect(result[0].kniestockM).toBeNull()
    // OG1: oberstes → above bleibt; below wird beheizt
    expect(result[1].below).toBe("beheizt")
    expect(result[1].above).toBe("dachschraegen")
    expect(result[1].kniestockM).toBe(1)
  })

  it("repariert unsinnige Randwerte nach dem Entfernen eines Geschosses", () => {
    // OG1 war Mittelgeschoss (below/above beheizt) und wird nach Entfernen
    // von EG und DG zum einzigen Geschoss
    const result = normalizeStack([
      storey("OG1", { below: "beheizt", above: "beheizt" }),
    ])
    expect(result[0].below).toBe("keller-unbeheizt")
    expect(result[0].above).toBe("dach-unbeheizt")
  })
})
