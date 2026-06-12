/**
 * Zahlformatierung für Berichte: deutsche Dezimalkommas, "-" für leere Werte.
 */
import { roundHalfEven } from "@/engine/round"

export function fmt(
  x: number | null | undefined,
  decimals = 2,
  empty = "-",
): string {
  if (x === null || x === undefined) return empty
  if (decimals === 0) return String(Math.trunc(roundHalfEven(x, 0)))
  return roundHalfEven(x, decimals).toFixed(decimals).replace(".", ",")
}

/** Ganzzahl-Darstellung (Truncation Richtung 0). */
export function fmtInt(x: number): string {
  return String(Math.trunc(x))
}
