/**
 * Assistent → Projektmodell: handgerechneter Erwartungswert für einen
 * einfachen Fall (Altbau, ein Raum, eine Außenwand mit Fenster).
 */
import { describe, expect, it } from "vitest"

import { computeProject } from "@/engine/calc"
import { buildProjectFromWizard } from "@/pages/wizard/mapping"
import { initialWizardState } from "@/pages/wizard/types"

describe("buildProjectFromWizard", () => {
  it("Altbau-EFH mit einem Raum rechnet wie von Hand", () => {
    const wizard = initialWizardState()
    wizard.era = "altbau"
    wizard.thetaEC = -12
    wizard.storeys = [
      {
        id: "EG",
        label: "Erdgeschoss",
        heightM: 2.6,
        below: "keller-unbeheizt",
        above: "dach-unbeheizt",
      },
    ]
    wizard.rooms = [
      {
        key: "r1",
        storeyId: "EG",
        name: "Wohnzimmer",
        roomType: "Wohnraum",
        widthM: 4,
        lengthM: 5,
        walls: [{ orientation: "S", lengthM: 5, windowAreaM2: 1.5 }],
        roofWidthM: 0,
        roofLengthM: 0,
        roofWindowAreaM2: 0,
        hasEntranceDoor: false,
        partyWallLengthM: 0,
      },
    ]

    const project = buildProjectFromWizard(wizard)
    const results = computeProject(project, {
      thetaEC: -12,
      rhoCpAirWhM3k: 0.34,
    })

    const room = results.unitResults[0].roomResults[0]
    // AW: brutto 5×2,6 = 13, Abzug 1,5 → A 11,5; Φ = 11,5·1,4·1·32 = 515,2 → 515
    // AF: 1,5·2,8·1·32 = 134,4 → 134
    // DE (unbeheizter Dachboden): 20·1,4·1·(20−10) = 280
    // FB (unbeheizter Keller): 20·1,6·0,33·10 = 105,6 → 106
    expect(room.phiTStandW).toBe(515 + 134 + 280 + 106)
    // V = 20·2,4 = 48 → q_V = 24 → Φ_V = 24·0,34·32 = 261,12 → 261
    expect(room.phiVStandW).toBe(261)
    expect(room.phiHlW).toBe(1296)
    // Bauteilzeilen: AW, AF (Öffnung), DE und FB aus dem Geschoss
    expect(
      room.componentResults.map((c) => c.component.componentType),
    ).toEqual(["AW", "AF", "DE", "FB"])
    expect(room.componentResults[2].fromStorey).toBe(true)
    expect(room.componentResults[3].fromStorey).toBe(true)
  })

  it("Haustür wird als Öffnung der ersten Außenwand angesetzt", () => {
    const wizard = initialWizardState()
    wizard.rooms = [
      {
        key: "r1",
        storeyId: "EG",
        name: "Flur",
        roomType: "Flur",
        widthM: 2,
        lengthM: 3,
        walls: [{ orientation: "N", lengthM: 2, windowAreaM2: 0 }],
        roofWidthM: 0,
        roofLengthM: 0,
        roofWindowAreaM2: 0,
        hasEntranceDoor: true,
        partyWallLengthM: 0,
      },
    ]
    const project = buildProjectFromWizard(wizard)
    const flur = project.usageUnits[0].rooms.find((r) => r.name === "Flur")!
    const wall = flur.components.find((c) => c.componentType === "AW")!
    expect(wall.openings.map((o) => o.componentType)).toEqual(["AT"])
    expect(wall.openings[0].bruttoM2).toBe(2.2)
  })
})
