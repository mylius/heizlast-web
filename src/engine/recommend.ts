/**
 * Automatischer Fahrplan-Vorschlag.
 *
 * Scannt den Maßnahmenkatalog gegen den Ist-Zustand: für jede Maßnahme wird
 * die tatsächliche Wirkung (Heizlast, Energie, CO₂, Kosten) per Einzel-
 * Simulation bestimmt. Maßnahmen ohne Verbesserungspotenzial (Bauteile bereits
 * besser als der Zielwert) entfallen. Die verbleibenden Kandidaten werden je
 * nach Sanierungsziel priorisiert und über den gewählten Zeithorizont verteilt.
 */
import {
  MEASURE_PRESETS,
  MIN_U_IMPROVEMENT,
  classifyEconomics,
  componentAreaM2,
  improvableAreaM2,
  measurePredicate,
  measurePresetById,
  simulateScenario,
  type MeasureEconomicsClass,
  type MeasurePreset,
} from "./measures"
import type {
  CalculationParams,
  EnergyParams,
  Project,
  RecommendationInput,
  RenovationMeasureSelection,
} from "./types"

/** Maßnahmen, die die gefühlte Behaglichkeit am stärksten verbessern. */
const COMFORT_PRESET_IDS = new Set(["fenster", "fassade", "dach"])

export interface MeasureCandidate {
  preset: MeasurePreset
  phiHlSavedW: number
  endenergieSavedKwh: number
  co2SavedKg: number
  costEur: number
  fundingEur: number
  netCostEur: number
  euroSavedPerYear: number
  /** Statische Amortisation [Jahre] (Eigenanteil / jährliche Ersparnis). */
  paybackYears: number
  /** Typische Bauteil-/Anlagen-Lebensdauer [Jahre]. */
  lifespanYears: number
  /** Wirtschaftlichkeit aus Amortisation vs. Lebensdauer. */
  economics: MeasureEconomicsClass
  /** Vergleichskennzahl für die gewählte Priorisierung (größer = besser). */
  score: number
}

/** Wirtschaftlichkeitskennzahlen einer einzelnen Maßnahme (Standalone). */
export interface MeasureEconomics {
  netCostEur: number
  euroSavedPerYear: number
  paybackYears: number
  lifespanYears: number
  economics: MeasureEconomicsClass
}

/** Wirkung einer einzelnen Maßnahme im Ist-Zustand (null = kein Potenzial). */
function candidate(
  project: Project,
  params: CalculationParams,
  energy: EnergyParams,
  preset: MeasurePreset,
): Omit<MeasureCandidate, "score"> | null {
  const sel: RenovationMeasureSelection = {
    id: preset.id,
    presetId: preset.id,
    targetUValue: preset.kind === "envelope" ? preset.targetUValue : 0,
    year: 1,
    enabled: true,
  }
  const sim = simulateScenario(project, params, energy, [sel])
  const step = sim.steps[0]
  if (!step) return null
  // Kein Potenzial: vernachlässigbare Endenergie-Einsparung. (Die Flächen-/
  // Bauteilprüfung übernimmt recommendationReport vor dem Aufruf.)
  if (step.endenergieSavedKwh < 1) return null

  const netCostEur = step.costEur - step.fundingEur
  // Jährliche Kostenersparnis aus der Energiebilanz (berücksichtigt bei
  // Anlagenmaßnahmen auch den geänderten Energieträger-Preis).
  const euroSavedPerYear =
    sim.baseEnergy.energieKostenEur - step.energy.energieKostenEur
  const paybackYears =
    euroSavedPerYear > 0 ? netCostEur / euroSavedPerYear : Infinity
  return {
    preset,
    phiHlSavedW: step.phiHlSavedW,
    endenergieSavedKwh: step.endenergieSavedKwh,
    co2SavedKg: step.co2SavedKg,
    costEur: step.costEur,
    fundingEur: step.fundingEur,
    netCostEur,
    euroSavedPerYear,
    paybackYears,
    lifespanYears: preset.lifespanYears,
    economics: classifyEconomics(paybackYears, preset.lifespanYears),
  }
}

/**
 * Wirtschaftlichkeit einer konkreten (ggf. manuell angepassten) Auswahl —
 * für die Anzeige der Amortisation/Bewertung je Maßnahme in der Liste.
 */
export function economicsForSelection(
  project: Project,
  params: CalculationParams,
  energy: EnergyParams,
  selection: RenovationMeasureSelection,
): MeasureEconomics | null {
  const preset = measurePresetById(selection.presetId)
  if (!preset) return null
  const sim = simulateScenario(project, params, energy, [
    { ...selection, enabled: true },
  ])
  const step = sim.steps[0]
  if (!step) return null
  const netCostEur = step.costEur - step.fundingEur
  const euroSavedPerYear =
    sim.baseEnergy.energieKostenEur - step.energy.energieKostenEur
  const paybackYears =
    euroSavedPerYear > 0 ? netCostEur / euroSavedPerYear : Infinity
  return {
    netCostEur,
    euroSavedPerYear,
    paybackYears,
    lifespanYears: preset.lifespanYears,
    economics: classifyEconomics(paybackYears, preset.lifespanYears),
  }
}

/** Bewertung je nach Sanierungsziel (größer = höhere Priorität). */
function scoreFor(
  c: Omit<MeasureCandidate, "score">,
  ziel: RecommendationInput["ziel"],
): number {
  switch (ziel) {
    case "co2":
      return c.co2SavedKg
    case "komfort":
      return c.phiHlSavedW * (COMFORT_PRESET_IDS.has(c.preset.id) ? 2 : 1)
    case "kosten":
    default:
      // Wirtschaftlichkeit: jährliche Einsparung je investiertem Euro
      return c.euroSavedPerYear / Math.max(1, c.netCostEur)
  }
}

/** Grund, warum eine Maßnahme nicht empfohlen wird. */
export type SkipReason =
  | "ausgeschlossen"
  | "nicht vorhanden"
  | "bereits ausreichend gedämmt"
  | "bereits vorhanden"
  | "unwirtschaftlich"

export interface SkippedMeasure {
  preset: MeasurePreset
  reason: SkipReason
  /** Bei „unwirtschaftlich": statische Amortisation [Jahre]. */
  paybackYears?: number
  /** Bei „unwirtschaftlich": Bauteil-Lebensdauer [Jahre]. */
  lifespanYears?: number
}

export interface RecommendationReport {
  /** Empfohlene Maßnahmen, priorisiert. */
  recommended: MeasureCandidate[]
  /** Nicht empfohlene Maßnahmen mit Begründung. */
  skipped: SkippedMeasure[]
}

/**
 * Prüft jede Katalog-Maßnahme gegen den Ist-Zustand und teilt sie in
 * empfohlen / nicht empfohlen (mit Begründung) auf. Eine Maßnahme entfällt,
 * wenn sie ausgeschlossen wurde, die Bauteilart gar nicht vorkommt, oder alle
 * vorhandenen Bauteile bereits nahe genug am Zielwert liegen.
 */
export function recommendationReport(
  project: Project,
  params: CalculationParams,
  energy: EnergyParams,
  input: RecommendationInput,
): RecommendationReport {
  const excluded = new Set(input.excludedPresetIds)
  const recommended: MeasureCandidate[] = []
  const skipped: SkippedMeasure[] = []

  // Einsortieren: unwirtschaftliche Maßnahmen (Amortisation ≫ Lebensdauer)
  // beim Ziel „niedrigste Kosten" gar nicht erst vorschlagen — mit Begründung.
  // Bei CO₂-/Komfortzielen bleiben sie (dort zählt nicht die Amortisation).
  const place = (c: Omit<MeasureCandidate, "score">) => {
    if (c.economics === "unwirtschaftlich" && input.ziel === "kosten") {
      skipped.push({
        preset: c.preset,
        reason: "unwirtschaftlich",
        paybackYears: c.paybackYears,
        lifespanYears: c.lifespanYears,
      })
      return
    }
    recommended.push({ ...c, score: scoreFor(c, input.ziel) })
  }

  for (const preset of MEASURE_PRESETS) {
    if (excluded.has(preset.id)) {
      skipped.push({ preset, reason: "ausgeschlossen" })
      continue
    }

    if (preset.kind === "heating") {
      // Erzeugerwechsel nur empfehlen, wenn nicht bereits derselbe Träger.
      if (energy.carrier === preset.targetCarrier) {
        skipped.push({ preset, reason: "bereits vorhanden" })
        continue
      }
      const c = candidate(project, params, energy, preset)
      if (!c) {
        skipped.push({ preset, reason: "bereits vorhanden" })
        continue
      }
      place(c)
      continue
    }

    const matches = measurePredicate(preset, params.thetaEC)
    if (componentAreaM2(project, matches) <= 0) {
      skipped.push({ preset, reason: "nicht vorhanden" })
      continue
    }
    // Gibt es Bauteile mit nennenswertem Verbesserungspotenzial?
    const worthwhile = improvableAreaM2(
      project,
      matches,
      preset.targetUValue,
      MIN_U_IMPROVEMENT,
    )
    const c = worthwhile > 0 ? candidate(project, params, energy, preset) : null
    if (!c) {
      skipped.push({ preset, reason: "bereits ausreichend gedämmt" })
      continue
    }
    place(c)
  }

  recommended.sort((a, b) => b.score - a.score)

  // Reihenfolge der Gewerke: erst die Gebäudehülle, dann die Anlagentechnik.
  // Eine neue Heizung (z.B. Wärmepumpe) muss auf die durch die Dämmung
  // reduzierte Heizlast ausgelegt werden, sonst ist sie überdimensioniert und
  // arbeitet ineffizient — der Erzeugerwechsel kommt deshalb IMMER zuletzt,
  // unabhängig davon, dass er für sich die größte CO₂-Wirkung hätte.
  const envelope = recommended.filter((c) => c.preset.kind === "envelope")
  const heating = recommended.filter((c) => c.preset.kind === "heating")
  // Bei geplanter Wärmepumpe die Hülle nach Heizlast-Reduktion priorisieren
  // (möglichst kleine, effiziente Anlage), sonst nach dem gewählten Ziel.
  if (input.waermepumpeGeplant) {
    envelope.sort((a, b) => b.phiHlSavedW - a.phiHlSavedW)
  }
  return { recommended: [...envelope, ...heating], skipped }
}

/** Alle wirksamen Maßnahmen, priorisiert (nicht ausgeschlossene), mit Score. */
export function rankCandidates(
  project: Project,
  params: CalculationParams,
  energy: EnergyParams,
  input: RecommendationInput,
): MeasureCandidate[] {
  return recommendationReport(project, params, energy, input).recommended
}

/**
 * Erzeugt aus den Fragebogen-Antworten eine geordnete Maßnahmenliste mit
 * Umsetzungsjahren. "einmal" ⇒ alle im Jahr 1; "schrittweise" ⇒ gleichmäßig
 * über den Zeithorizont verteilt (mindestens ein Jahr pro Maßnahme).
 */
export function recommendMeasures(
  project: Project,
  params: CalculationParams,
  energy: EnergyParams,
  input: RecommendationInput,
): RenovationMeasureSelection[] {
  const ranked = rankCandidates(project, params, energy, input)
  const n = ranked.length
  const horizon = Math.max(1, Math.round(input.horizonYears))

  return ranked.map((c, i) => {
    const year =
      input.tempo === "einmal"
        ? 1
        : Math.min(horizon, 1 + Math.floor((i * horizon) / Math.max(1, n)))
    return {
      id:
        globalThis.crypto?.randomUUID?.() ?? `rec-${c.preset.id}-${i}`,
      presetId: c.preset.id,
      targetUValue: c.preset.kind === "envelope" ? c.preset.targetUValue : 0,
      year,
      enabled: true,
    }
  })
}

/**
 * Optimiert die Umsetzungsjahre der bereits gewählten Maßnahmen für die
 * schnellste Amortisation: wirtschaftlichste Maßnahme (jährliche Einsparung je
 * Eigenanteil-Euro) zuerst, je ein Jahr pro Maßnahme, Anlagentechnik immer nach
 * der Hülle. Deaktivierte Maßnahmen bleiben unverändert.
 */
export function optimizeMeasureYears(
  project: Project,
  params: CalculationParams,
  energy: EnergyParams,
  measures: RenovationMeasureSelection[],
): RenovationMeasureSelection[] {
  const baseCost = simulateScenario(project, params, energy, [])
    .baseEnergy.energieKostenEur

  const scored = measures
    .filter((m) => m.enabled)
    .map((m) => {
      const preset = measurePresetById(m.presetId)
      const kind = preset?.kind ?? "envelope"
      const step = simulateScenario(project, params, energy, [m]).steps[0]
      let ratio = 0
      if (step) {
        const netCost = step.costEur - step.fundingEur
        const annualSaving = baseCost - step.energy.energieKostenEur
        ratio =
          netCost > 0 ? annualSaving / netCost : annualSaving > 0 ? Infinity : 0
      }
      return { m, kind, ratio }
    })

  scored.sort((a, b) => {
    // Hülle vor Anlagentechnik (korrekte Auslegung der neuen Heizung) …
    if (a.kind !== b.kind) return a.kind === "heating" ? 1 : -1
    // … sonst wirtschaftlichste zuerst.
    return b.ratio - a.ratio
  })

  const yearById = new Map<string, number>()
  scored.forEach((x, i) => yearById.set(x.m.id, i + 1))
  return measures.map((m) =>
    yearById.has(m.id) ? { ...m, year: yearById.get(m.id)! } : m,
  )
}
