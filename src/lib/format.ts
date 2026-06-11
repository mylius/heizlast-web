/**
 * UI-Zahlformatierung (deutsche Schreibweise).
 */

export function de(x: number, decimals = 2): string {
  return x.toLocaleString("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function deWatt(x: number): string {
  return `${x.toLocaleString("de-DE", { maximumFractionDigits: 0 })} W`
}

export function deKw(watts: number, decimals = 1): string {
  return `${(watts / 1000).toLocaleString("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} kW`
}

/** Zahl aus deutschem Eingabeformat ("2,5" oder "2.5") parsen. */
export function parseDeNumber(s: string): number | null {
  const trimmed = s.trim()
  if (!trimmed) return null
  const normalized = trimmed.replace(/\./g, "").replace(",", ".")
  // Falls keine Komma-Notation: Original mit Punkt als Dezimaltrenner versuchen
  const candidate = trimmed.includes(",") ? normalized : trimmed
  const n = Number(candidate)
  return Number.isFinite(n) ? n : null
}
