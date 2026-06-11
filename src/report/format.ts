/**
 * Zahlformatierung für Berichte: deutsche Dezimalkommas, "-" für leere Werte.
 * Portierung von _fmt aus heizlastrechner/adapters/exporters/markdown.py.
 */
import { pythonRound } from "@/engine/round"

export function fmt(
  x: number | null | undefined,
  decimals = 2,
  empty = "-",
): string {
  if (x === null || x === undefined) return empty
  if (decimals === 0) return String(Math.trunc(pythonRound(x, 0)))
  return pythonRound(x, decimals).toFixed(decimals).replace(".", ",")
}

/** Ganzzahl-Darstellung wie Pythons int() (Truncation Richtung 0). */
export function fmtInt(x: number): string {
  return String(Math.trunc(x))
}
