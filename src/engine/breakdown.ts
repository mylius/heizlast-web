/**
 * Verlustaufteilung („Wohin geht die Wärme?"): aggregiert die Heizlast
 * über alle Räume nach Bauteilart plus Lüftung und Aufheizzuschlag.
 * Netto-negative Kategorien (Wärmegewinne, z.B. Innenwand zum wärmeren
 * Bad) erscheinen nicht als Fluss, sondern gesammelt als `gainsW`.
 */
import type { ProjectResults } from "./calc"
import type { ComponentType } from "./types"

const COMPONENT_CATEGORIES: {
  key: string
  label: string
  types: ComponentType[]
}[] = [
  { key: "aw", label: "Außenwände", types: ["AW"] },
  { key: "fenster", label: "Fenster", types: ["AF", "DF"] },
  { key: "tueren", label: "Außentüren", types: ["AT"] },
  { key: "dach", label: "Dach", types: ["DA"] },
  { key: "decken", label: "Decken", types: ["DE"] },
  { key: "boeden", label: "Böden", types: ["FB", "BA"] },
  { key: "htw", label: "Haustrennwand", types: ["HTW"] },
  { key: "innen", label: "Innenwände/-türen", types: ["IW", "IT"] },
]

export interface LossCategory {
  key: string
  label: string
  watts: number
}

export interface HeatLossBreakdown {
  /** Positive Verlustflüsse, absteigend sortiert */
  categories: LossCategory[]
  /** Summe der Flüsse [W] */
  totalW: number
  /** Netto-Wärmegewinne (negative Kategorien), als positiver Betrag [W] */
  gainsW: number
}

export function aggregateHeatLoss(results: ProjectResults): HeatLossBreakdown {
  const sums = new Map<string, number>(
    COMPONENT_CATEGORIES.map((c) => [c.key, 0]),
  )
  let ventilation = 0
  let heatingUp = 0

  for (const ur of results.unitResults) {
    for (const res of ur.roomResults) {
      ventilation += res.phiVStandW
      heatingUp += res.room.heatingUpAllowanceW ?? 0
      for (const cr of res.componentResults) {
        const category = COMPONENT_CATEGORIES.find((c) =>
          c.types.includes(cr.component.componentType),
        )
        if (category) {
          sums.set(category.key, (sums.get(category.key) ?? 0) + cr.phiTKW)
        }
      }
    }
  }

  const categories: LossCategory[] = []
  let gainsW = 0
  for (const c of COMPONENT_CATEGORIES) {
    const watts = sums.get(c.key) ?? 0
    if (watts > 0) categories.push({ key: c.key, label: c.label, watts })
    else if (watts < 0) gainsW += -watts
  }
  if (ventilation > 0) {
    categories.push({ key: "lueftung", label: "Lüftung", watts: ventilation })
  }
  if (heatingUp > 0) {
    categories.push({
      key: "aufheiz",
      label: "Aufheizzuschlag",
      watts: heatingUp,
    })
  }
  categories.sort((a, b) => b.watts - a.watts)

  return {
    categories,
    totalW: categories.reduce((s, c) => s + c.watts, 0),
    gainsW,
  }
}
