/**
 * Übersetzt die Assistent-Antworten in das vollständige Projektmodell.
 * Gleiche Konstruktionsmuster wie examples/default.py: Wände als Presets mit
 * Fenster-Öffnungen, FB/DE über Geschoss-Defaults.
 */
import {
  ERA_PRESET_MAP,
  buildFromPreset,
  presetById,
  type ComponentPreset,
} from "@/engine/presets"
import {
  makeRoom,
  makeStorey,
  type BuildingComponent,
  type ComponentType,
  type Project,
  type Room,
  type Storey,
} from "@/engine/types"

import { normalizeStack } from "./stack"
import type { WizardState, WizardRoomInput, WizardStoreyInput } from "./types"

/** Typische U-Werte für Geschoss-Defaults nach Baualtersklasse. */
const FB_U_UNHEATED_BELOW: Record<WizardState["era"], number> = {
  // Decke zum unbeheizten Keller / Bodenplatte (vereinfacht, ohne B′-Verfahren)
  altbau: 1.6,
  wschvo77: 1.0,
  modern: 0.5,
  passivhaus: 0.25,
}

/**
 * Effektive Nachbartemperatur aus dem b-Faktor (DIN EN 12831 Bbl. 1):
 * θ_eff = θ_i − b·(θ_i − θ_e), mit θ_i = 20 °C als Referenz. Die Bauteile
 * rechnen dann mit f_ix = 1 gegen diese Temperatur (Norm-äquivalent zum
 * f_x-Verfahren gegen θ_e).
 */
function effectiveAdjacentTemp(b: number, thetaE: number): number {
  return Math.round((20 - b * (20 - thetaE)) * 10) / 10
}

/** b-Faktoren nach Beiblatt 1 (vereinfacht). */
const B_FACTOR = {
  kellerUnbeheizt: 0.5,
  dachbodenUnbeheizt: 0.9,
  erdreich: 0.33,
} as const

const DE_U_TOP: Record<WizardState["era"], number> = {
  // Oberste Geschossdecke zum unbeheizten Dachraum / Flachdach
  altbau: 1.4,
  wschvo77: 0.6,
  modern: 0.24,
  passivhaus: 0.15,
}

const DE_U_HEATED = 0.97 // Zwischendecke zwischen beheizten Geschossen

/** Standardfläche einer Haustür (1,10 m × 2,00 m). */
const ENTRANCE_DOOR_M2 = 2.2

export function effectivePresetFor(
  wizard: WizardState,
  type: ComponentType,
): ComponentPreset {
  const override = wizard.presetOverrides[type]
  if (override) return presetById(override)
  if (wizard.windowsReplaced && (type === "AF" || type === "DF")) {
    return presetById(ERA_PRESET_MAP.modern[type]!)
  }
  const id = ERA_PRESET_MAP[wizard.era][type]
  if (!id) throw new Error(`Kein Preset für ${type} in Ära ${wizard.era}`)
  return presetById(id)
}

function buildStorey(
  input: WizardStoreyInput,
  wizard: WizardState,
): Storey {
  const era = wizard.era
  const thetaE = wizard.thetaEC
  // Konvention: tatsächliche/effektive Nachbartemperatur mit f_ix = 1
  // (bzw. 0 bei beheizt-intern) — nie f-Faktor UND Temperatur kombinieren
  const fb =
    input.below === "beheizt"
      ? { theta: 20.0, u: DE_U_HEATED, fIx: 0.0, adjacent: "ij" as const }
      : input.below === "aussenluft"
        ? {
            theta: thetaE,
            u: effectivePresetFor(wizard, "BA").uValue,
            fIx: 1.0,
            adjacent: "e" as const,
          }
        : input.below === "erdreich"
          ? {
              theta: effectiveAdjacentTemp(B_FACTOR.erdreich, thetaE),
              u: FB_U_UNHEATED_BELOW[era],
              fIx: 1.0,
              adjacent: "e" as const,
            }
          : {
              theta: effectiveAdjacentTemp(B_FACTOR.kellerUnbeheizt, thetaE),
              u: FB_U_UNHEATED_BELOW[era],
              fIx: 1.0,
              adjacent: "e" as const,
            }

  const de =
    input.above === "beheizt"
      ? { theta: 20.0, u: DE_U_HEATED, adjacent: "ij" as const, add: true }
      : input.above === "dach-unbeheizt"
        ? {
            theta: effectiveAdjacentTemp(B_FACTOR.dachbodenUnbeheizt, thetaE),
            u: DE_U_TOP[era],
            adjacent: "e" as const,
            add: true,
          }
        : input.above === "flachdach"
          ? { theta: thetaE, u: DE_U_TOP[era], adjacent: "e" as const, add: true }
          : // Dachschrägen werden als DA-Bauteile im Raum erfasst
            { theta: 20.0, u: DE_U_HEATED, adjacent: "ij" as const, add: false }

  return makeStorey({
    id: input.id,
    // Eingabe ist die LICHTE Raumhöhe (Boden–Decke, innen gemessen):
    // Geschosshöhe = lichte Höhe + Deckendicke. Volumen rechnet dann exakt
    // mit dem Messwert, Wandflächen mit der Geschosshöhe (≈ Außenmaß).
    storeyHeightM: input.heightM + 0.2,
    ceilingThicknessM: 0.2,
    fbThetaAdjacentC: fb.theta,
    fbUValue: fb.u,
    fbFIx: fb.fIx,
    fbAdjacent: fb.adjacent,
    deThetaAdjacentC: de.theta,
    deUValue: de.u,
    deAdjacent: de.adjacent,
    addDefaultDe: de.add,
  })
}

function buildRoom(
  input: WizardRoomInput,
  index: number,
  wizard: WizardState,
): Room {
  const thetaEC = wizard.thetaEC
  const components: BuildingComponent[] = []

  const awPreset = effectivePresetFor(wizard, "AW")
  const afPreset = effectivePresetFor(wizard, "AF")
  let doorPending = input.hasEntranceDoor

  for (const wall of input.walls) {
    if (wall.lengthM <= 0) continue
    const openings: BuildingComponent[] = []
    if (wall.windowAreaM2 > 0) {
      openings.push(
        buildFromPreset(afPreset, { bruttoM2: wall.windowAreaM2, thetaEC }),
      )
    }
    if (doorPending) {
      // Haustür als Öffnung der ersten Außenwand (zieht Wandfläche ab)
      openings.push(
        buildFromPreset(effectivePresetFor(wizard, "AT"), {
          bruttoM2: ENTRANCE_DOOR_M2,
          thetaEC,
        }),
      )
      doorPending = false
    }
    components.push(
      buildFromPreset(awPreset, {
        orientation: wall.orientation,
        widthM: wall.lengthM,
        lengthHeightM: null,
        openings,
        thetaEC,
      }),
    )
  }
  if (doorPending) {
    // keine Außenwand erfasst → Haustür als eigenständiges Bauteil
    components.push(
      buildFromPreset(effectivePresetFor(wizard, "AT"), {
        bruttoM2: ENTRANCE_DOOR_M2,
        thetaEC,
      }),
    )
  }

  if (input.roofWidthM > 0 && input.roofLengthM > 0) {
    const openings: BuildingComponent[] = []
    if (input.roofWindowAreaM2 > 0) {
      openings.push(
        buildFromPreset(effectivePresetFor(wizard, "DF"), {
          bruttoM2: input.roofWindowAreaM2,
          thetaEC,
        }),
      )
    }
    components.push(
      buildFromPreset(effectivePresetFor(wizard, "DA"), {
        orientation: "N",
        widthM: input.roofWidthM,
        lengthHeightM: input.roofLengthM,
        openings,
        thetaEC,
      }),
    )
  }

  if (input.partyWallLengthM > 0) {
    components.push(
      buildFromPreset(presetById("HtwGedaemmt"), {
        orientation: "O",
        widthM: input.partyWallLengthM,
        lengthHeightM: null,
        thetaEC,
      }),
    )
  }

  return makeRoom({
    id: `${input.storeyId}-R${index + 1}`,
    name: input.name,
    floor: input.storeyId,
    roomWidthM: input.widthM,
    roomLengthM: input.lengthM,
    roomType: input.roomType,
    storeyId: input.storeyId,
    components,
  })
}

export function buildProjectFromWizard(wizard: WizardState): Project {
  // Grenzen normalisieren (auch für ältere gespeicherte Sitzungen):
  // zwischen zwei Geschossen immer „beheizt", kanonische Reihenfolge
  const stack = normalizeStack(wizard.storeys)
  const storeys: Record<string, Storey> = {}
  for (const st of stack) {
    storeys[st.id] = buildStorey(st, wizard)
  }

  const rooms: Room[] = []
  for (const st of stack) {
    const inStorey = wizard.rooms.filter((r) => r.storeyId === st.id)
    inStorey.forEach((input, i) => rooms.push(buildRoom(input, i, wizard)))
  }

  return {
    projectId: wizard.projectName || "Heizlastberechnung",
    description:
      wizard.buildingKind === "efh"
        ? "Einfamilienhaus"
        : wizard.buildingKind === "dhh"
          ? "Doppelhaushälfte / Reihenhaus"
          : "Wohnung",
    address: wizard.address,
    storeys,
    usageUnits: [{ number: 1, name: "Wohneinheit 1", rooms }],
  }
}
