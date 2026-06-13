/**
 * Projektbibliothek: benannte Projekte im localStorage (zusätzlich zur
 * automatisch persistierten Sitzung), gespeichert im Wire-Format.
 */
import { toast } from "sonner"

import {
  parseProjectJson,
  readParamsFromWire,
  serializeProjectJson,
  type ProjectWire,
} from "@/engine/schema"
import type { CalculationParams, Project } from "@/engine/types"
import { useProjectStore } from "@/store/projectStore"

const LS_KEY = "heizlast-web:projects"

export interface StoredProject {
  key: string
  name: string
  savedAt: string
  /** @deprecated nur für Alt-Einträge; aktuelle Parameter stehen in `wire` */
  thetaEC?: number
  wire: ProjectWire
}

export function listStoredProjects(): StoredProject[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as StoredProject[]
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function persist(list: StoredProject[]): boolean {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
    return true
  } catch {
    toast.error("Speichern fehlgeschlagen — Browser-Speicher voll?")
    return false
  }
}

/** Speichert das aktuelle Projekt als neuen Bibliothekseintrag. */
export function saveToLibrary(
  project: Project,
  params: CalculationParams,
): StoredProject | null {
  const entry: StoredProject = {
    key: crypto.randomUUID(),
    name: project.projectId || project.description || "Unbenanntes Projekt",
    savedAt: new Date().toISOString(),
    wire: serializeProjectJson(project, params),
  }
  const list = [entry, ...listStoredProjects()]
  if (!persist(list)) return null
  toast.success(`„${entry.name}" in der Bibliothek gespeichert`)
  return entry
}

/** Lädt einen Bibliothekseintrag in den Store. */
export function loadFromLibrary(key: string): boolean {
  const entry = listStoredProjects().find((p) => p.key === key)
  if (!entry) return false
  try {
    const project = parseProjectJson(entry.wire)
    useProjectStore.getState().setProject(project)
    const params = readParamsFromWire(entry.wire)
    if (params.thetaEC === undefined && entry.thetaEC !== undefined) {
      params.thetaEC = entry.thetaEC // Alt-Einträge
    }
    useProjectStore.getState().setParams(params)
    toast.success(`„${entry.name}" geladen`)
    return true
  } catch {
    toast.error("Projekt konnte nicht geladen werden")
    return false
  }
}

export function deleteFromLibrary(key: string): void {
  persist(listStoredProjects().filter((p) => p.key !== key))
}
