/**
 * Default-Innentemperaturen und Mindest-Luftwechsel nach Raumart.
 * Portierung der Tabellen aus heizlastrechner/model.py.
 */
import { ROOM_TYPES, type RoomType } from "./types"

export const DEFAULT_THETA_I_BY_ROOM_TYPE: Record<RoomType, number> = {
  Wohnraum: 20.0,
  Schlafen: 20.0,
  Bad: 24.0,
  Küche: 20.0,
  Abstellraum: 15.0,
  Flur: 15.0,
  WC: 20.0,
  Keller: 10.0,
  Dach: 20.0,
  Essen: 20.0,
}

export function defaultThetaIForRoomType(roomType: RoomType | null): number {
  if (roomType === null) return 20.0
  return DEFAULT_THETA_I_BY_ROOM_TYPE[roomType] ?? 20.0
}

/** n_min [1/h] nach EN 12831-1 Gl. 33: 0 für Abstellraum, sonst 0,5. */
export function defaultNMinForRoomType(roomType: RoomType | null): number {
  if (roomType === "Abstellraum") return 0.0
  return 0.5
}

export function parseRoomType(s: string | null | undefined): RoomType | null {
  const key = (s ?? "").trim()
  if (!key) return null
  return ROOM_TYPES.find((rt) => rt === key) ?? null
}
