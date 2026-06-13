/**
 * Heizlastberechnung nach DIN EN 12831.
 *
 * - Standard-Transmissionswärmeverlust: Φ_T,k = A_k · U_korr · f_ix · (θ_i − θ_adj)
 * - Standard-Lüftungswärmeverlust: Φ_V = q_V · ρc_p · (θ_i − θ_supply)
 * - Normheizlast = Σ Φ_T,stand,i + Σ Φ_V,stand,i (+ Aufheizzuschlag)
 *
 * Rundung wie im RAUMHEIZLAST-Formular: Φ_T,k wird pro Bauteil auf ganze
 * Watt gerundet, dann summiert.
 */
import {
  effectiveComponents,
  effectiveFIx,
  effectiveNMinH1,
  effectiveStoreyHeightM,
  qVMinM3h,
  storeyForRoom,
  thetaDesignC,
  uCorrected,
  vIM3,
} from "./derive"
import { roundHalfEven } from "./round"
import { infiltrationFlowM3h } from "./ventilation"
import type {
  BuildingComponent,
  CalculationParams,
  Orientation,
  Project,
  Room,
  Storey,
  UsageUnit,
} from "./types"

/** Ergebnis für ein Bauteil (eine Zeile der Transmissionstabelle). */
export interface ComponentResult {
  component: BuildingComponent
  effectiveBruttoM2: number
  effectiveAbzugM2: number
  aKM2: number
  fIx: number
  uCorrected: number
  phiTKW: number
  /** Bei Öffnungszeilen: Orientierung der übergeordneten Wand */
  effectiveOrientation: Orientation | null
  /** true, wenn das Bauteil als DE/FB-Default aus dem Geschoss stammt */
  fromStorey: boolean
  /** true für Öffnungszeilen (Fenster/Tür innerhalb einer Wand) */
  isOpening: boolean
}

export interface RoomResult {
  room: Room
  componentResults: ComponentResult[]
  phiTStandW: number
  phiVStandW: number
  /** Normheizlast Φ_HL,i [W] */
  phiHlW: number
  qVMinM3h: number
  /** Infiltrationsvolumenstrom V̇_inf,i [m³/h] (0 wenn nicht berücksichtigt) */
  qVInfM3h: number
}

/**
 * (effektive Bruttofläche, Abzugsfläche, Bauteilfläche A_k) in m².
 * Brutto aus bruttoM2, oder widthM × lengthHeightM, oder (Wände) widthM × Raumhöhe.
 * Abzug aus Summe der Öffnungen oder abzugM2.
 */
export function getEffectiveComponentAreas(
  comp: BuildingComponent,
  room: Room,
  storey?: Storey,
): [number, number, number] {
  let brutto: number
  if (comp.bruttoM2 > 0) {
    brutto = comp.bruttoM2
  } else if (comp.orientation !== "H" && comp.widthM > 0) {
    // lengthHeightM 0 UND null fallen beide auf die Raumhöhe zurück
    const lh = comp.lengthHeightM
      ? comp.lengthHeightM
      : effectiveStoreyHeightM(room, storey)
    brutto = roundHalfEven(comp.widthM * lh, 2)
  } else if (comp.orientation === "H" && comp.widthM > 0 && comp.lengthHeightM) {
    brutto = roundHalfEven(comp.widthM * comp.lengthHeightM, 2)
  } else {
    brutto = 0.0
  }
  let abzug: number
  if (comp.openings.length > 0) {
    abzug = comp.openings.reduce(
      (sum, op) => sum + getEffectiveComponentAreas(op, room, storey)[0],
      0,
    )
  } else {
    abzug = comp.abzugM2
  }
  const aK = Math.max(0.0, roundHalfEven(brutto - abzug, 2))
  return [brutto, abzug, aK]
}

/** Standard-Transmissionswärmeverlust für ein Bauteil [W]. */
export function computeComponentTransmission(
  comp: BuildingComponent,
  room: Room,
  thetaIC: number,
  storey?: Storey,
): ComponentResult {
  const [brutto, abzug, aK] = getEffectiveComponentAreas(comp, room, storey)
  const u = uCorrected(comp)
  const fIx = effectiveFIx(comp)
  const deltaTheta = thetaIC - comp.thetaAdjacentC
  const phi = aK * u * fIx * deltaTheta
  return {
    component: comp,
    effectiveBruttoM2: brutto,
    effectiveAbzugM2: abzug,
    aKM2: aK,
    fIx,
    uCorrected: u,
    phiTKW: roundHalfEven(phi, 0),
    effectiveOrientation: null,
    fromStorey: false,
    isOpening: false,
  }
}

/**
 * Transmissionswärmeverluste aller Bauteile und Σ Φ_T,stand,i [W].
 * Default-DE/FB aus dem Geschoss werden ergänzt; Öffnungen erzeugen
 * zusätzliche Zeilen mit der Orientierung der übergeordneten Wand.
 */
export function computeRoomTransmission(
  room: Room,
  storey?: Storey,
): [ComponentResult[], number] {
  const results: ComponentResult[] = []
  const thetaI = thetaDesignC(room)
  for (const { component: comp, fromStorey } of effectiveComponents(
    room,
    storey,
  )) {
    const res = computeComponentTransmission(comp, room, thetaI, storey)
    res.fromStorey = fromStorey
    results.push(res)
    for (const op of comp.openings) {
      const opRes = computeComponentTransmission(op, room, thetaI, storey)
      opRes.effectiveOrientation = comp.orientation
      opRes.isOpening = true
      results.push(opRes)
    }
  }
  const total = results.reduce((sum, r) => sum + r.phiTKW, 0)
  return [results, roundHalfEven(total, 0)]
}

/**
 * Standard-Lüftungswärmeverlust Φ_V,stand,i [W] nach DIN EN 12831-1.
 *
 * - Expliziter q_V-Override am Raum: exakt verwenden (keine Infiltrationslogik).
 * - Sonst: maßgeblicher Volumenstrom = max(V̇_min, V̇_inf) (hygienischer
 *   Mindestluftwechsel gegen Infiltration durch Undichtheiten).
 * - Mit Wärmerückgewinnung: nur der hygienisch über die Anlage zugeführte
 *   Anteil (V̇_min − V̇_inf, ≥ 0) wird mit (1 − η) reduziert; Infiltration
 *   kommt unverändert kalt herein.
 */
export function computeRoomVentilationLoss(
  room: Room,
  params: CalculationParams,
  storey?: Storey,
): number {
  const rhoCp = params.rhoCpAirWhM3k
  const deltaTheta = thetaDesignC(room) - params.thetaEC

  if (room.qVEnvMinM3h !== null) {
    return roundHalfEven(
      Math.max(0.0, room.qVEnvMinM3h * rhoCp * deltaTheta),
      0,
    )
  }

  const vMin = roundHalfEven(vIM3(room, storey) * effectiveNMinH1(room), 1)
  const vInf = infiltrationFlowM3h(room, params, storey)

  let phiV: number
  if (params.withWrg && (params.wrgEta ?? 0) > 0) {
    const vMech = Math.max(0, vMin - vInf)
    phiV = rhoCp * deltaTheta * (vInf + vMech * (1 - (params.wrgEta ?? 0)))
  } else {
    phiV = rhoCp * Math.max(vMin, vInf) * deltaTheta
  }
  return roundHalfEven(Math.max(0.0, phiV), 0)
}

/** Vollständige Raumheizlast: Transmission, Lüftung, Normheizlast. */
export function computeRoomHeatingLoad(
  room: Room,
  params: CalculationParams,
  storey?: Storey,
): RoomResult {
  const [compResults, phiT] = computeRoomTransmission(room, storey)
  const phiV = computeRoomVentilationLoss(room, params, storey)
  const phiHl = phiT + phiV + (room.heatingUpAllowanceW ?? 0.0)
  return {
    room,
    componentResults: compResults,
    phiTStandW: phiT,
    phiVStandW: phiV,
    phiHlW: roundHalfEven(phiHl, 0),
    qVMinM3h: qVMinM3h(room, storey),
    qVInfM3h: infiltrationFlowM3h(room, params, storey),
  }
}

/** Summen (Σ Φ_T, Σ Φ_V, Normheizlast) einer Nutzungseinheit [W]. */
export function computeUsageUnitTotals(
  roomResults: RoomResult[],
): [number, number, number] {
  const phiT = roomResults.reduce((s, r) => s + r.phiTStandW, 0)
  const phiV = roomResults.reduce((s, r) => s + r.phiVStandW, 0)
  const phiHl = phiT + phiV
  return [roundHalfEven(phiT, 0), roundHalfEven(phiV, 0), roundHalfEven(phiHl, 0)]
}

export interface UnitResult {
  unit: UsageUnit
  roomResults: RoomResult[]
  phiTW: number
  phiVW: number
  phiHlW: number
}

export interface ProjectResults {
  unitResults: UnitResult[]
  totalPhiTW: number
  totalPhiVW: number
  totalPhiHlW: number
}

/** Komplette Berechnung für ein Projekt (alle Einheiten, Gebäudesumme). */
export function computeProject(
  project: Project,
  params: CalculationParams,
): ProjectResults {
  const unitResults: UnitResult[] = project.usageUnits.map((unit) => {
    const roomResults = unit.rooms.map((room) =>
      computeRoomHeatingLoad(room, params, storeyForRoom(room, project)),
    )
    const [phiTW, phiVW, phiHlW] = computeUsageUnitTotals(roomResults)
    return { unit, roomResults, phiTW, phiVW, phiHlW }
  })
  return {
    unitResults,
    totalPhiTW: unitResults.reduce((s, u) => s + u.phiTW, 0),
    totalPhiVW: unitResults.reduce((s, u) => s + u.phiVW, 0),
    totalPhiHlW: unitResults.reduce((s, u) => s + u.phiHlW, 0),
  }
}
