/**
 * Norm-Außentemperatur-Lookup nach PLZ oder Ortsname.
 * Datenquelle siehe src/data/normaussentemperatur.json (klassische
 * Klimazonen-Werte; für verbindliche Berechnungen DIN/TS 12831-1 prüfen).
 */
import data from "@/data/normaussentemperatur.json"

export interface ThetaEMatch {
  thetaE: number
  referenzort: string
  plzPrefix: string
}

const regions = data.regions as {
  plz: string
  ort: string
  thetaE: number
}[]

export function lookupThetaE(input: string): ThetaEMatch | null {
  const q = input.trim()
  if (!q) return null

  const digits = q.match(/^\d{2,5}/)?.[0]
  if (digits) {
    const prefix = digits.slice(0, 2)
    const region = regions.find((r) => r.plz === prefix)
    if (region) {
      return { thetaE: region.thetaE, referenzort: region.ort, plzPrefix: region.plz }
    }
    return null
  }

  const lower = q.toLowerCase()
  const region =
    regions.find((r) => r.ort.toLowerCase() === lower) ??
    regions.find((r) =>
      r.ort
        .toLowerCase()
        .split(/[/()]/)
        .some((part) => part.trim() === lower),
    ) ??
    regions.find((r) => r.ort.toLowerCase().includes(lower))
  if (region) {
    return { thetaE: region.thetaE, referenzort: region.ort, plzPrefix: region.plz }
  }
  return null
}
