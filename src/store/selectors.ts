/**
 * Abgeleitete Ergebnisse aus dem Store. Volle Neuberechnung pro Änderung —
 * bei Projekten mit Dutzenden Räumen im Mikrosekundenbereich.
 */
import { useMemo } from "react"

import { computeProject, type ProjectResults } from "@/engine/calc"
import { computeEnergy, type EnergyResult } from "@/engine/energy"
import { simulateScenario, type ScenarioResult } from "@/engine/measures"
import {
  economicsForSelection,
  recommendationReport,
  type MeasureEconomics,
  type RecommendationReport,
} from "@/engine/recommend"
import { useProjectStore } from "./projectStore"

export function useProjectResults(): ProjectResults {
  const project = useProjectStore((s) => s.project)
  const params = useProjectStore((s) => s.params)
  return useMemo(() => computeProject(project, params), [project, params])
}

/** Orientierende Jahresenergiebilanz des Ist-Zustands. */
export function useEnergyResult(): EnergyResult {
  const project = useProjectStore((s) => s.project)
  const params = useProjectStore((s) => s.params)
  const energyParams = useProjectStore((s) => s.energyParams)
  return useMemo(
    () => computeEnergy(project, params, energyParams),
    [project, params, energyParams],
  )
}

/** Sanierungsszenario (Vorher/Nachher über alle Maßnahmen). */
export function useScenarioResult(): ScenarioResult {
  const project = useProjectStore((s) => s.project)
  const params = useProjectStore((s) => s.params)
  const energyParams = useProjectStore((s) => s.energyParams)
  const renovation = useProjectStore((s) => s.renovation)
  return useMemo(
    () => simulateScenario(project, params, energyParams, renovation.measures),
    [project, params, energyParams, renovation],
  )
}

/** Empfohlene vs. nicht empfohlene Maßnahmen für die aktuellen Antworten. */
export function useRecommendationReport(): RecommendationReport {
  const project = useProjectStore((s) => s.project)
  const params = useProjectStore((s) => s.params)
  const energyParams = useProjectStore((s) => s.energyParams)
  const input = useProjectStore((s) => s.recommendationInput)
  return useMemo(
    () => recommendationReport(project, params, energyParams, input),
    [project, params, energyParams, input],
  )
}

/** Wirtschaftlichkeit (Amortisation/Bewertung) je gewählter Maßnahme. */
export function useMeasureEconomics(): Map<string, MeasureEconomics> {
  const project = useProjectStore((s) => s.project)
  const params = useProjectStore((s) => s.params)
  const energyParams = useProjectStore((s) => s.energyParams)
  const renovation = useProjectStore((s) => s.renovation)
  return useMemo(() => {
    const map = new Map<string, MeasureEconomics>()
    for (const m of renovation.measures) {
      const e = economicsForSelection(project, params, energyParams, m)
      if (e) map.set(m.id, e)
    }
    return map
  }, [project, params, energyParams, renovation])
}
