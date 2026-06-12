/**
 * Geschoss-Stapel-Logik: kanonische Reihenfolge und konsistente Grenzen.
 * Die Decke eines Geschosses ist der Fußboden des darüberliegenden —
 * zwischen zwei angelegten (beheizten) Geschossen gibt es daher keine
 * Verluste, und nur die Unterseite des untersten bzw. Oberseite des
 * obersten Geschosses ist frei wählbar.
 */
import type { WizardStoreyInput } from "./types"

/** Kanonische Stapel-Reihenfolge von unten nach oben. */
export const STACK_ORDER = ["KG", "EG", "OG1", "OG2", "DG"]

export function meanHeight(
  kniestockM: number | null,
  firstM: number | null,
): number | null {
  if (!kniestockM || !firstM) return null
  return Math.round(((kniestockM + firstM) / 2) * 100) / 100
}

/**
 * Sortiert den Geschoss-Stapel kanonisch und erzwingt konsistente Grenzen:
 * zwischen zwei angelegten Geschossen immer „beheizt"; nur das unterste
 * behält seine „darunter"- und das oberste seine „darüber"-Situation.
 */
export function normalizeStack(
  storeys: WizardStoreyInput[],
): WizardStoreyInput[] {
  const sorted = [...storeys].sort(
    (a, b) => STACK_ORDER.indexOf(a.id) - STACK_ORDER.indexOf(b.id),
  )
  return sorted.map((st, i) => {
    const isBottom = i === 0
    const isTop = i === sorted.length - 1
    let below = st.below
    let above = st.above
    let kniestockM = st.kniestockM ?? null
    let firstM = st.firstM ?? null
    if (!isBottom) below = "beheizt"
    else if (below === "beheizt") below = "keller-unbeheizt"
    if (!isTop) {
      above = "beheizt"
      kniestockM = null
      firstM = null
    } else if (above === "beheizt") {
      above = "dach-unbeheizt"
    }
    return { ...st, below, above, kniestockM, firstM }
  })
}
