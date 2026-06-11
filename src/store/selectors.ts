/**
 * Abgeleitete Ergebnisse aus dem Store. Volle Neuberechnung pro Änderung —
 * bei Projekten mit Dutzenden Räumen im Mikrosekundenbereich.
 */
import { useMemo } from "react"

import { computeProject, type ProjectResults } from "@/engine/calc"
import { useProjectStore } from "./projectStore"

export function useProjectResults(): ProjectResults {
  const project = useProjectStore((s) => s.project)
  const params = useProjectStore((s) => s.params)
  return useMemo(() => computeProject(project, params), [project, params])
}
