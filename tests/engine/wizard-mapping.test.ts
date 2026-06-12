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
    // AW: brutto 5×2,6 = 13, Abzug 1,5 → A 11,5; U_korr 1,4+0,1 = 1,5;
    //     Φ = 11,5·1,5·1·32 = 552
    // AF: U_korr 2,8+0,1 = 2,9 → 1,5·2,9·32 = 139,2 → 139
    // DE (unbeheizter Dachboden, b = 0,9): θ_eff = 20 − 0,9·32 = −8,8;
    //     Φ = 20·1,4·28,8 = 806,4 → 806
    // FB (unbeheizter Keller, b = 0,5): θ_eff = 20 − 0,5·32 = 4;
    //     Φ = 20·1,6·16 = 512
    expect(room.phiTStandW).toBe(552 + 139 + 806 + 512)
    // V = 20·2,4 = 48 → q_V = 24 → Φ_V = 24·0,34·32 = 261,12 → 261
    expect(room.phiVStandW).toBe(261)
    expect(room.phiHlW).toBe(2270)
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
