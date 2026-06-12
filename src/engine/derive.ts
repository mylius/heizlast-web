/**
 * Abgeleitete Raumgrößen (Fläche, Volumen, q_V,min, effektive Temperaturen)
 * und Geschoss-Default-Bauteile (DE/FB).
 *
 * Portierung der berechneten Properties aus heizlastrechner/model.py als
 * reine Funktionen über (room, storey). Rundungsstellen exakt wie in Python.
 */
import { defaultNMinForRoomType, defaultThetaIForRoomType } from "./defaults"
import { pythonRound } from "./round"
import {
  makeComponent,
  type BuildingComponent,
  type Project,
  type Room,
  type Storey,
} from "./types"

export function storeyForRoom(
  room: Room,
  project: Project,
): Storey | undefined {
  if (room.storeyId === null) return undefined
  return project.storeys[room.storeyId]
}

/** Geschosshöhe h_G,i [m]; vom Raum oder vom Geschoss geerbt. */
export function effectiveStoreyHeightM(room: Room, storey?: Storey): number {
  if (room.storeyHeightM !== null) return room.storeyHeightM
  if (storey !== undefined) return storey.storeyHeightM
  return 0.0
}

/** Deckendicke d_i [m]; vom Raum oder vom Geschoss geerbt. */
export function effectiveCeilingThicknessM(
  room: Room,
  storey?: Storey,
): number {
  if (room.ceilingThicknessM !== null) return room.ceilingThicknessM
  if (storey !== undefined) return storey.ceilingThicknessM
  return 0.2
}

/** Raumfläche A_NGI [m²]. */
export function aFloorM2(room: Room): number {
  return pythonRound(room.roomWidthM * room.roomLengthM, 2)
}

/** Raumhöhe (lichte Höhe) h_i [m]. */
export function hIM(room: Room, storey?: Storey): number {
  return pythonRound(
    effectiveStoreyHeightM(room, storey) -
      effectiveCeilingThicknessM(room, storey),
    2,
  )
}

/** Raumvolumen V_i [m³]. */
export function vIM3(room: Room, storey?: Storey): number {
  return pythonRound(aFloorM2(room) * hIM(room, storey), 2)
}

/** Auslegungs-Innentemperatur θ_i [°C]; aus thetaIC oder Raumart. */
export function effectiveThetaIC(room: Room): number {
  if (room.thetaIC !== null) return room.thetaIC
  return defaultThetaIForRoomType(room.roomType)
}

/** Auslegungsinnentemperatur θ_i,ausleg [°C] (inkl. Komfortzuschlag). */
export function thetaDesignC(room: Room): number {
  return effectiveThetaIC(room) + room.deltaThetaComfortK
}

/** n_min [1/h]: aus nMinH1 oder Default nach Raumart. */
export function effectiveNMinH1(room: Room): number {
  if (room.nMinH1 !== null) return room.nMinH1
  return defaultNMinForRoomType(room.roomType)
}

/** Mindestaußenluftvolumenstrom q_V,min,i [m³/h] (EN 12831-1 Gl. 33). */
export function qVMinM3h(room: Room, storey?: Storey): number {
  if (room.qVEnvMinM3h !== null) return room.qVEnvMinM3h
  return pythonRound(vIM3(room, storey) * effectiveNMinH1(room), 1)
}

/** FB-Bauteil mit Geschoss-Defaults (Storey.make_fb). */
export function makeStoreyFb(
  storey: Storey,
  bruttoM2: number,
  uValue?: number,
): BuildingComponent {
  return makeComponent({
    orientation: "H",
    componentType: "FB",
    bruttoM2,
    adjacent: storey.fbAdjacent,
    thetaAdjacentC: storey.fbThetaAdjacentC,
    fIx: storey.fbFIx,
    uValue: uValue ?? storey.fbUValue,
  })
}

/** DE-Bauteil mit Geschoss-Defaults (Storey.make_de). */
export function makeStoreyDe(
  storey: Storey,
  bruttoM2: number,
  uValue?: number,
  thetaAdjacentC?: number,
  adjacent?: Storey["deAdjacent"],
): BuildingComponent {
  return makeComponent({
    orientation: "H",
    componentType: "DE",
    bruttoM2,
    adjacent: adjacent ?? storey.deAdjacent,
    thetaAdjacentC: thetaAdjacentC ?? storey.deThetaAdjacentC,
    fIx: storey.deFIx,
    uValue: uValue ?? storey.deUValue,
  })
}

export interface EffectiveComponent {
  component: BuildingComponent
  /** true, wenn das Bauteil als DE/FB-Default aus dem Geschoss ergänzt wurde */
  fromStorey: boolean
}

/**
 * Bauteile für die Transmissionsberechnung: room.components plus Default-DE/FB
 * aus dem Geschoss, sofern der Raum ein Geschoss hat und DE/FB nicht selbst
 * definiert (und das Geschoss die Defaults nicht deaktiviert).
 */
export function effectiveComponents(
  room: Room,
  storey?: Storey,
): EffectiveComponent[] {
  const out: EffectiveComponent[] = room.components.map((component) => ({
    component,
    fromStorey: false,
  }))
  if (storey === undefined) return out
  const hasDe = room.components.some((c) => c.componentType === "DE")
  // BA (Boden gegen Außenluft) ist ebenfalls ein Fußboden: Räume mit BA
  // dürfen nicht zusätzlich den Default-FB erhalten (doppelter Boden)
  const hasFb = room.components.some(
    (c) => c.componentType === "FB" || c.componentType === "BA",
  )
  if (storey.addDefaultDe && !hasDe) {
    out.push({ component: makeStoreyDe(storey, aFloorM2(room)), fromStorey: true })
  }
  if (storey.addDefaultFb && !hasFb) {
    out.push({ component: makeStoreyFb(storey, aFloorM2(room)), fromStorey: true })
  }
  return out
}

/** korrigierter U-Wert U_cequiv,k = U_k + ΔU_TB,k. */
export function uCorrected(comp: BuildingComponent): number {
  return pythonRound(comp.uValue + comp.deltaUTb, 2)
}

/** Effektiver f_ix: expliziter Wert, sonst 0 (intern) bzw. 1 (extern). */
export function effectiveFIx(comp: BuildingComponent): number {
  if (comp.fIx !== null) return comp.fIx
  if (comp.adjacent === "ij") return 0.0
  return 1.0
}
