/**
 * Rohantworten des geführten Assistenten. Werden separat vom Projektmodell
 * gehalten, damit Zurück-Navigation die einfachen Eingaben behält; das
 * Projektmodell wird daraus per mapping.ts erzeugt.
 */
import type { Era } from "@/engine/presets"
import type { Orientation, RoomType } from "@/engine/types"

export type BuildingKind = "efh" | "dhh" | "wohnung"

export type BelowSituation = "keller-unbeheizt" | "erdreich" | "beheizt" | "aussenluft"
export type AboveSituation = "beheizt" | "dach-unbeheizt" | "flachdach" | "dachschraegen"

export interface WizardStoreyInput {
  id: string
  label: string
  /**
   * LICHTE Raumhöhe (Boden–Decke, innen gemessen); bei Geschossen mit
   * Dachschrägen die MITTLERE Höhe ((Kniestock + First) / 2) — damit sind
   * Giebelwände (Trapeze) und das Raumvolumen automatisch flächenrichtig.
   * Das Mapping addiert 0,20 m Deckendicke zur Geschosshöhe.
   */
  heightM: number
  below: BelowSituation
  above: AboveSituation
  /** Kniestockhöhe (nur bei above = "dachschraegen") */
  kniestockM?: number | null
  /** Firsthöhe (nur bei above = "dachschraegen") */
  firstM?: number | null
}

export interface WizardWallInput {
  orientation: Orientation
  lengthM: number
  windowAreaM2: number
}

export interface WizardRoomInput {
  /** stabile ID für React-Keys */
  key: string
  storeyId: string
  name: string
  roomType: RoomType
  widthM: number
  lengthM: number
  walls: WizardWallInput[]
  /** Dachschräge: Breite × Schrägenlänge, 0 = keine */
  roofWidthM: number
  roofLengthM: number
  roofWindowAreaM2: number
  hasEntranceDoor: boolean
  /** Haustrennwand zur Nachbar-Doppelhaushälfte (Länge in m, 0 = keine) */
  partyWallLengthM: number
}

export interface WizardState {
  step: number
  projectName: string
  address: string
  buildingKind: BuildingKind
  era: Exclude<Era, "neutral">
  /** Fenster nachträglich getauscht? → AF modern trotz alter Hülle */
  windowsReplaced: boolean
  /** Lüftungsanlage mit Wärmerückgewinnung (nur bei modern/passivhaus relevant) */
  hasMvhr: boolean
  plzOrCity: string
  thetaEC: number
  /** vom Nutzer manuell überschrieben? */
  thetaEManual: boolean
  storeys: WizardStoreyInput[]
  rooms: WizardRoomInput[]
  /** Preset-Austausch in Schritt 5: ComponentType → Preset-ID */
  presetOverrides: Record<string, string>
}

export function initialWizardState(): WizardState {
  return {
    step: 0,
    projectName: "",
    address: "",
    buildingKind: "efh",
    era: "altbau",
    windowsReplaced: false,
    hasMvhr: false,
    plzOrCity: "",
    thetaEC: -10.3,
    thetaEManual: false,
    storeys: [
      { id: "EG", label: "Erdgeschoss", heightM: 2.6, below: "keller-unbeheizt", above: "beheizt" },
      { id: "OG1", label: "Obergeschoss", heightM: 2.6, below: "beheizt", above: "dach-unbeheizt" },
    ],
    rooms: [],
    presetOverrides: {},
  }
}
