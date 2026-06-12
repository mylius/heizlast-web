/**
 * Plausibilitätsprüfungen: Hinweise auf wahrscheinliche Eingabefehler.
 * Keine harten Fehler — die Berechnung läuft immer durch; die Hinweise
 * machen stille Korrekturen (z.B. A_k auf 0 gekappt) sichtbar.
 */
import type { ProjectResults, RoomResult } from "./calc"
import { getEffectiveComponentAreas } from "./calc"
import {
  aFloorM2,
  effectiveComponents,
  effectiveStoreyHeightM,
  storeyForRoom,
} from "./derive"
import type { Project, Room, Storey } from "./types"

const de1 = (x: number) => x.toFixed(1).replace(".", ",")

export function validateRoom(
  room: Room,
  storey?: Storey,
  result?: RoomResult,
): string[] {
  const warnings: string[] = []

  if (room.roomWidthM <= 0 || room.roomLengthM <= 0) {
    warnings.push(
      "Raumbreite/-länge fehlt — Fläche, Volumen und Lüftungsverlust sind 0.",
    )
  }

  const comps = effectiveComponents(room, storey)
  if (comps.length === 0) {
    warnings.push(
      "Keine Bauteile erfasst — der Raum hat keine Transmissionsverluste.",
    )
  }

  const usesRoomHeight = comps.some(
    (ec) =>
      ec.component.orientation !== "H" &&
      ec.component.widthM > 0 &&
      !ec.component.lengthHeightM &&
      ec.component.bruttoM2 <= 0,
  )
  if (usesRoomHeight && effectiveStoreyHeightM(room, storey) <= 0) {
    warnings.push(
      "Keine Geschosshöhe gesetzt — Wandflächen aus Breite × Raumhöhe sind 0.",
    )
  }

  for (const { component: c } of comps) {
    const [brutto, abzug] = getEffectiveComponentAreas(c, room, storey)
    if (brutto > 0 && abzug > brutto) {
      warnings.push(
        `${c.componentType}${c.label ? ` (${c.label})` : ""}: Öffnungen/Abzug (${de1(abzug)} m²) größer als die Bruttofläche (${de1(brutto)} m²) — die Bauteilfläche wird auf 0 gekappt.`,
      )
    }
  }

  // Vollhohe Außen-/Trennwände länger als der Raumumfang?
  const wallLength = room.components
    .filter(
      (c) =>
        (c.componentType === "AW" || c.componentType === "HTW") &&
        c.widthM > 0 &&
        !c.lengthHeightM &&
        c.bruttoM2 <= 0,
    )
    .reduce((s, c) => s + c.widthM, 0)
  const perimeter = 2 * (room.roomWidthM + room.roomLengthM)
  if (perimeter > 0 && wallLength > perimeter * 1.05) {
    warnings.push(
      `Summe der Wandlängen (${de1(wallLength)} m) übersteigt den Raumumfang (${de1(perimeter)} m) — Wandmaße prüfen.`,
    )
  }

  if (result) {
    const area = aFloorM2(room)
    if (area > 0 && result.phiHlW / area > 250) {
      warnings.push(
        `Spezifische Heizlast ${Math.round(result.phiHlW / area)} W/m² — ungewöhnlich hoch, U-Werte und Flächen prüfen (unsanierter Altbau liegt typisch bei 100–180 W/m²).`,
      )
    }
  }

  return warnings
}

export interface RoomValidation {
  unitIndex: number
  roomIndex: number
  roomId: string
  roomName: string
  warnings: string[]
}

/** Alle Räume prüfen; liefert nur Einträge mit Hinweisen. */
export function validateProject(
  project: Project,
  results?: ProjectResults,
): RoomValidation[] {
  const out: RoomValidation[] = []
  project.usageUnits.forEach((unit, unitIndex) => {
    unit.rooms.forEach((room, roomIndex) => {
      const storey = storeyForRoom(room, project)
      const result =
        results?.unitResults[unitIndex]?.roomResults[roomIndex]
      const warnings = validateRoom(room, storey, result)
      if (warnings.length > 0) {
        out.push({
          unitIndex,
          roomIndex,
          roomId: room.id,
          roomName: room.name,
          warnings,
        })
      }
    })
  })
  return out
}
