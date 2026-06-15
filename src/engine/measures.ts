/**
 * Maßnahmenkatalog des Sanierungsfahrplans.
 *
 * Jede Maßnahme verbessert den U-Wert aller passenden Bauteile auf einen
 * Zielwert (angelehnt an die `modern`/`passivhaus`-Presets in presets.ts) und
 * trägt eine grobe Kosten- und Förderabschätzung. `simulateScenario` wendet
 * die ausgewählten Maßnahmen kumulativ an und rechnet Heizlast und
 * Energiebilanz vor/nach jeder Stufe neu.
 */
import { computeProject, getEffectiveComponentAreas, type ProjectResults } from "./calc"
import {
  effectiveComponents,
  makeStoreyDe,
  makeStoreyFb,
  storeyForRoom,
} from "./derive"
import {
  DEFAULT_ENERGY_PRICE_CT_KWH,
  computeEnergy,
  type EnergyResult,
} from "./energy"
import type {
  BuildingComponent,
  CalculationParams,
  ComponentType,
  EnergyCarrier,
  EnergyParams,
  Project,
  RenovationMeasureSelection,
} from "./types"

interface MeasureBase {
  id: string
  label: string
  /** Kurzbeschreibung für Tooltips/Karten. */
  hint: string
  /** Förderquote (BEG inkl. iSFP-Bonus), 0…1. */
  fundingRate: number
  /** Typische Nutzungsdauer des Bauteils/der Anlage [Jahre]. */
  lifespanYears: number
}

/**
 * Faktor, ab dem eine Maßnahme als unwirtschaftlich gilt: liegt die statische
 * Amortisation über Lebensdauer × Faktor, zahlt sie sich nie ab; dazwischen
 * (über der Lebensdauer, aber darunter) gilt sie als „grenzwertig".
 */
export const UNECONOMIC_PAYBACK_FACTOR = 2

/**
 * Faustregel-Restlebensdauer [Jahre], unterhalb der eine grenzwertige Maßnahme
 * als „Sowieso-Maßnahme" sinnvoll wird (das Bauteil wird ohnehin bald erneuert,
 * dann zählen nur die Mehrkosten der besseren Ausführung).
 */
export const SOWIESO_REMAINING_YEARS = 15

export type MeasureEconomicsClass =
  | "wirtschaftlich"
  | "grenzwertig"
  | "unwirtschaftlich"

/** Wirtschaftlichkeit aus statischer Amortisation und Bauteil-Lebensdauer. */
export function classifyEconomics(
  paybackYears: number,
  lifespanYears: number,
): MeasureEconomicsClass {
  if (paybackYears <= lifespanYears) return "wirtschaftlich"
  if (paybackYears <= lifespanYears * UNECONOMIC_PAYBACK_FACTOR)
    return "grenzwertig"
  return "unwirtschaftlich"
}

/** Hüllmaßnahme: verbessert den U-Wert passender Bauteile. */
export interface EnvelopeMeasure extends MeasureBase {
  kind: "envelope"
  /** Bauteilarten, deren U-Wert die Maßnahme verbessert. */
  componentTypes: ComponentType[]
  /**
   * Verfeinerung für Decken (DE): "outside" = Decke gegen Außenluft (Dach
   * direkt auf dem Raum) → gehört zur Dachdämmung; "buffer" = Decke gegen
   * unbeheizten Dachboden → günstige oberste Geschossdecke. Für andere
   * Bauteilarten ohne Bedeutung.
   */
  deFacing?: "outside" | "buffer"
  /** Empfohlener Ziel-U-Wert [W/(m²K)] (editierbar). */
  targetUValue: number
  /** Kosten pro betroffener Bauteilfläche [€/m²]. */
  costPerM2: number
}

/**
 * Δθ-Schwelle [K], ab der eine Decke (DE) als „gegen Außenluft" (= Dach) statt
 * gegen einen unbeheizten Dachboden gilt: liegt die angrenzende Temperatur quasi
 * auf Außenniveau, sitzt das Dach direkt auf dem Raum.
 */
const ROOF_AIR_MARGIN_K = 2

/** Decke gegen Außenluft (Dach direkt auf dem Raum). */
export function isOutsideRoofDe(c: BuildingComponent, thetaE: number): boolean {
  return (
    c.componentType === "DE" &&
    c.adjacent === "e" &&
    c.thetaAdjacentC <= thetaE + ROOF_AIR_MARGIN_K
  )
}

/** Decke gegen unbeheizten Dachboden (Pufferraum), nicht direkt Außenluft. */
export function isAtticFloorDe(c: BuildingComponent, thetaE: number): boolean {
  return (
    c.componentType === "DE" &&
    c.adjacent === "e" &&
    c.thetaAdjacentC > thetaE + ROOF_AIR_MARGIN_K
  )
}

/** Trifft die Maßnahme auf das Bauteil zu (inkl. DE-Verfeinerung)? */
export function measureMatches(
  measure: EnvelopeMeasure,
  c: BuildingComponent,
  thetaE: number,
): boolean {
  if (!measure.componentTypes.includes(c.componentType)) return false
  if (c.componentType === "DE" && measure.deFacing) {
    return measure.deFacing === "outside"
      ? isOutsideRoofDe(c, thetaE)
      : isAtticFloorDe(c, thetaE)
  }
  return true
}

/** Prädikat einer Hüllmaßnahme für die aktuelle Außentemperatur. */
export function measurePredicate(
  measure: EnvelopeMeasure,
  thetaE: number,
): (c: BuildingComponent) => boolean {
  return (c) => measureMatches(measure, c, thetaE)
}

/** Anlagenmaßnahme: tauscht den Wärmeerzeuger (Energieträger/Effizienz). */
export interface HeatingMeasure extends MeasureBase {
  kind: "heating"
  /** Neuer Energieträger. */
  targetCarrier: EnergyCarrier
  /** Anlagennutzungsgrad / JAZ des neuen Erzeugers. */
  targetSystemEfficiency: number
  /** Pauschale Investitionskosten [€]. */
  fixedCostEur: number
}

export type MeasurePreset = EnvelopeMeasure | HeatingMeasure

/**
 * BEG-Einzelmaßnahmen: 15 % Grundförderung + 5 % iSFP-Bonus = 0,20 für die
 * Hülle; der Heizungstausch wird nach BEG-Heizungsförderung deutlich höher
 * gefördert. Kosten und Zielwerte sind grobe Richtwerte und im UI editierbar.
 */
export const MEASURE_PRESETS: MeasurePreset[] = [
  {
    id: "fassade",
    lifespanYears: 40,
    kind: "envelope",
    label: "Fassadendämmung (WDVS)",
    hint: "Wärmedämmverbundsystem auf die Außenwände. Ziel-U-Wert 0,20 W/(m²K).",
    componentTypes: ["AW"],
    targetUValue: 0.2,
    costPerM2: 180,
    fundingRate: 0.2,
  },
  {
    id: "fenster",
    lifespanYears: 35,
    kind: "envelope",
    label: "Fenstertausch (3-fach)",
    hint: "Neue Fenster mit Dreifachverglasung. Ziel-U-Wert 0,90 W/(m²K).",
    componentTypes: ["AF", "DF"],
    targetUValue: 0.9,
    costPerM2: 650,
    fundingRate: 0.2,
  },
  {
    id: "dach",
    lifespanYears: 45,
    kind: "envelope",
    label: "Dachdämmung",
    hint: "Auf-/Zwischensparrendämmung des Daches — inkl. Decken, die direkt gegen Außenluft liegen (Dach direkt auf dem Raum). Ziel-U-Wert 0,14 W/(m²K).",
    componentTypes: ["DA", "DE"],
    deFacing: "outside",
    targetUValue: 0.14,
    costPerM2: 220,
    fundingRate: 0.2,
  },
  {
    id: "oberste-decke",
    lifespanYears: 45,
    kind: "envelope",
    label: "Oberste Geschossdecke dämmen",
    hint: "Dämmung der Decke zu einem unbeheizten Dachboden (begehbarer Pufferraum). Nicht für Dächer, die direkt auf dem Raum sitzen. Ziel-U-Wert 0,14 W/(m²K).",
    componentTypes: ["DE"],
    deFacing: "buffer",
    targetUValue: 0.14,
    costPerM2: 50,
    fundingRate: 0.2,
  },
  {
    id: "kellerdecke",
    lifespanYears: 40,
    kind: "envelope",
    label: "Kellerdecke / Bodenplatte dämmen",
    hint: "Dämmung des Fußbodens gegen Keller/Erdreich. Ziel-U-Wert 0,25 W/(m²K).",
    componentTypes: ["FB", "BA"],
    targetUValue: 0.25,
    costPerM2: 60,
    fundingRate: 0.2,
  },
  {
    id: "haustuer",
    lifespanYears: 35,
    kind: "envelope",
    label: "Haustür erneuern",
    hint: "Neue, gut gedämmte Haustür. Ziel-U-Wert 0,80 W/(m²K).",
    componentTypes: ["AT"],
    targetUValue: 0.8,
    costPerM2: 1200,
    fundingRate: 0.2,
  },
  {
    id: "waermepumpe",
    lifespanYears: 20,
    kind: "heating",
    label: "Heizung auf Wärmepumpe umstellen",
    hint: "Austausch des Wärmeerzeugers gegen eine Wärmepumpe (JAZ ~3,2). Senkt vor allem Primärenergie, CO₂ und – bei zuvor gedämmter Hülle – die Betriebskosten. Hohe BEG-Heizungsförderung.",
    targetCarrier: "waermepumpe",
    targetSystemEfficiency: 3.2,
    fixedCostEur: 22000,
    fundingRate: 0.55,
  },
]

export function measurePresetById(id: string): MeasurePreset | undefined {
  return MEASURE_PRESETS.find((m) => m.id === id)
}

/**
 * Minimale U-Wert-Verbesserung [W/(m²K)], ab der eine Maßnahme für ein Bauteil
 * als sinnvoll gilt. Ein Bauteil, das bereits nahe am Zielwert liegt (z.B. ein
 * Dach mit 0,15 bei Zielwert 0,14), wird nicht zur Sanierung empfohlen.
 */
export const MIN_U_IMPROVEMENT = 0.1

/** Tiefe Kopie eines Projekts (wie duplicateRoom im Store). */
function cloneProject(project: Project): Project {
  return JSON.parse(JSON.stringify(project)) as Project
}

/**
 * Wendet eine Maßnahme auf eine Kopie des Projekts an: setzt den U-Wert aller
 * passenden Bauteile (inkl. Öffnungen) auf den Zielwert, sofern der bisherige
 * U-Wert schlechter ist. `matches` entscheidet je Bauteil über die Zugehörigkeit
 * (Bauteilart, ggf. DE-Verfeinerung). Wärmebrückenzuschlag bleibt unverändert.
 */
export function applyMeasure(
  project: Project,
  matches: (c: BuildingComponent) => boolean,
  targetUValue: number,
): Project {
  const next = cloneProject(project)
  const apply = (comp: BuildingComponent) => {
    if (matches(comp) && comp.uValue > targetUValue) {
      comp.uValue = targetUValue
    }
    for (const op of comp.openings) apply(op)
  }
  for (const unit of next.usageUnits) {
    for (const room of unit.rooms) {
      for (const comp of room.components) apply(comp)
    }
  }
  // Geschoss-Default-Bauteile (DE/FB) liegen nicht in room.components — über
  // ein repräsentatives Bauteil gegen dasselbe Prädikat prüfen.
  for (const storey of Object.values(next.storeys)) {
    if (matches(makeStoreyDe(storey, 0)) && storey.deUValue > targetUValue) {
      storey.deUValue = targetUValue
    }
    if (matches(makeStoreyFb(storey, 0)) && storey.fbUValue > targetUValue) {
      storey.fbUValue = targetUValue
    }
  }
  return next
}

/**
 * Gesamtfläche [m²] aller passenden Bauteile im Ist-Zustand — unabhängig vom
 * U-Wert (für die Prüfung, ob die Maßnahme überhaupt anwendbar ist).
 */
export function componentAreaM2(
  project: Project,
  matches: (c: BuildingComponent) => boolean,
): number {
  return sumComponentArea(project, matches)
}

/**
 * Fläche [m²] der Bauteile, die eine Maßnahme tatsächlich verbessern würde:
 * `matches` trifft zu UND der U-Wert liegt um mehr als `margin` über dem
 * Zielwert. Mit `margin = 0` ist es die mechanisch veränderte Fläche (Bezug für
 * Kosten); mit `MIN_U_IMPROVEMENT` die sanierungswürdige Fläche (Empfehlung).
 */
export function improvableAreaM2(
  project: Project,
  matches: (c: BuildingComponent) => boolean,
  targetUValue: number,
  margin = 0,
): number {
  return sumComponentArea(
    project,
    (c) => matches(c) && c.uValue - targetUValue > margin,
  )
}

/** Summiert die A_k aller (effektiven) Bauteile inkl. Öffnungen je Prädikat. */
function sumComponentArea(
  project: Project,
  predicate: (c: BuildingComponent) => boolean,
): number {
  let area = 0
  for (const unit of project.usageUnits) {
    for (const room of unit.rooms) {
      const storey = storeyForRoom(room, project)
      for (const { component } of effectiveComponents(room, storey)) {
        if (predicate(component)) {
          area += getEffectiveComponentAreas(component, room, storey)[2]
        }
        for (const op of component.openings) {
          if (predicate(op)) {
            area += getEffectiveComponentAreas(op, room, storey)[2]
          }
        }
      }
    }
  }
  return area
}

/** Ergebnis einer einzelnen Fahrplan-Stufe (eine Maßnahme). */
export interface MeasureStepResult {
  selection: RenovationMeasureSelection
  preset: MeasurePreset
  /** Heizlast nach dieser Stufe [W]. */
  phiHlW: number
  /** Heizlast-Einsparung gegenüber der Vorstufe [W]. */
  phiHlSavedW: number
  /** Energiebilanz nach dieser Stufe. */
  energy: EnergyResult
  /** Endenergie-Einsparung gegenüber der Vorstufe [kWh/a]. */
  endenergieSavedKwh: number
  /** CO₂-Einsparung gegenüber der Vorstufe [kg/a]. */
  co2SavedKg: number
  /** Betroffene Fläche [m²]. */
  affectedM2: number
  /** Investitionskosten brutto [€]. */
  costEur: number
  /** Förderung [€]. */
  fundingEur: number
}

export interface ScenarioResult {
  /** Ist-Zustand (vor allen Maßnahmen). */
  baseResults: ProjectResults
  baseEnergy: EnergyResult
  /** Zustand nach allen aktivierten Maßnahmen. */
  finalResults: ProjectResults
  finalEnergy: EnergyResult
  /** Stufen in der gewählten Reihenfolge (nur aktivierte Maßnahmen). */
  steps: MeasureStepResult[]
  /** Summen über alle Stufen. */
  totalCostEur: number
  totalFundingEur: number
  phiHlSavedW: number
  endenergieSavedKwh: number
  co2SavedKg: number
  /** Jährliche Energiekosten-Einsparung [€/a]. */
  energieKostenSavedEur: number
}

/**
 * Wendet die aktivierten Maßnahmen kumulativ in der gegebenen Reihenfolge an
 * und berechnet Heizlast + Energiebilanz vor/nach jeder Stufe neu.
 */
export function simulateScenario(
  project: Project,
  params: CalculationParams,
  energy: EnergyParams,
  measures: RenovationMeasureSelection[],
): ScenarioResult {
  const baseResults = computeProject(project, params)
  const baseEnergy = computeEnergy(project, params, energy)

  const active = measures
    .filter((m) => m.enabled)
    .slice()
    .sort((a, b) => a.year - b.year)

  let current = project
  // Anlagenmaßnahmen ändern den Energieträger/Wirkungsgrad für diese und alle
  // folgenden Stufen (kumulativ wie die Hüllmaßnahmen am Projekt).
  let currentEnergy = energy
  let prevPhiHl = baseResults.totalPhiHlW
  let prevEndenergie = baseEnergy.endenergieKwh
  let prevCo2 = baseEnergy.co2Kg

  const steps: MeasureStepResult[] = []
  let totalCostEur = 0
  let totalFundingEur = 0

  for (const sel of active) {
    const preset = measurePresetById(sel.presetId)
    if (!preset) continue

    let affectedM2 = 0
    let costEur: number
    if (preset.kind === "envelope") {
      const matches = measurePredicate(preset, params.thetaEC)
      // Kosten nur für die Fläche, die der U-Wert-Verbesserung tatsächlich
      // unterliegt (bereits bessere Bauteile werden nicht erneuert/berechnet).
      affectedM2 = improvableAreaM2(current, matches, sel.targetUValue)
      current = applyMeasure(current, matches, sel.targetUValue)
      costEur = affectedM2 * preset.costPerM2
    } else {
      // Erzeugerwechsel: Energieträger, Effizienz und Preis übernehmen.
      currentEnergy = {
        ...currentEnergy,
        carrier: preset.targetCarrier,
        systemEfficiency: preset.targetSystemEfficiency,
        energyPriceCtKwh: DEFAULT_ENERGY_PRICE_CT_KWH[preset.targetCarrier],
      }
      costEur = preset.fixedCostEur
    }

    const results = computeProject(current, params)
    const energyResult = computeEnergy(current, params, currentEnergy)

    const phiHlW = results.totalPhiHlW
    const fundingEur = costEur * preset.fundingRate
    totalCostEur += costEur
    totalFundingEur += fundingEur

    steps.push({
      selection: sel,
      preset,
      phiHlW,
      phiHlSavedW: prevPhiHl - phiHlW,
      energy: energyResult,
      endenergieSavedKwh: prevEndenergie - energyResult.endenergieKwh,
      co2SavedKg: prevCo2 - energyResult.co2Kg,
      affectedM2,
      costEur,
      fundingEur,
    })

    prevPhiHl = phiHlW
    prevEndenergie = energyResult.endenergieKwh
    prevCo2 = energyResult.co2Kg
  }

  const finalResults = computeProject(current, params)
  const finalEnergy = computeEnergy(current, params, currentEnergy)

  return {
    baseResults,
    baseEnergy,
    finalResults,
    finalEnergy,
    steps,
    totalCostEur,
    totalFundingEur,
    phiHlSavedW: baseResults.totalPhiHlW - finalResults.totalPhiHlW,
    endenergieSavedKwh: baseEnergy.endenergieKwh - finalEnergy.endenergieKwh,
    co2SavedKg: baseEnergy.co2Kg - finalEnergy.co2Kg,
    energieKostenSavedEur:
      baseEnergy.energieKostenEur - finalEnergy.energieKostenEur,
  }
}
