/**
 * Projektdatei speichern/öffnen (JSON, kompatibel zum Python-CLI).
 */
import { toast } from "sonner"
import * as z from "zod"

import { parseProjectJson, serializeProjectJson } from "@/engine/schema"
import type { CalculationParams, Project } from "@/engine/types"
import { useProjectStore } from "@/store/projectStore"

import { openTextFile, saveTextFile } from "./download"

export async function saveProjectFile(
  project: Project,
  params: CalculationParams,
): Promise<void> {
  const wire = serializeProjectJson(project, params.thetaEC)
  const name = (project.projectId || "heizlast-projekt").replace(/[^\w.-]+/g, "_")
  await saveTextFile(
    JSON.stringify(wire, null, 2) + "\n",
    `${name}.json`,
    "application/json",
    "Heizlast-Projekt (JSON)",
  )
  toast.success("Projekt gespeichert")
}

/** Öffnet eine Projektdatei und lädt sie in den Store. Liefert true bei Erfolg. */
export async function openProjectFile(): Promise<boolean> {
  const text = await openTextFile(".json,application/json")
  if (text === null) return false
  try {
    const data = JSON.parse(text)
    const project = parseProjectJson(data)
    useProjectStore.getState().setProject(project)
    if (typeof data.theta_e_c === "number") {
      useProjectStore.getState().setParams({ thetaEC: data.theta_e_c })
    }
    toast.success(`Projekt „${project.projectId || project.description}“ geladen`)
    return true
  } catch (err) {
    if (err instanceof z.ZodError) {
      const first = err.issues[0]
      toast.error("Ungültige Projektdatei", {
        description: `${first.path.join(".")}: ${first.message}`,
      })
    } else if (err instanceof SyntaxError) {
      toast.error("Datei ist kein gültiges JSON")
    } else {
      toast.error("Projektdatei konnte nicht geladen werden")
    }
    return false
  }
}
