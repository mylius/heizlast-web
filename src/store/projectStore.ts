/**
 * Zentraler App-State: Projekt + Berechnungsparameter + Assistent-Antworten.
 * Persistiert in localStorage (Schlüssel heizlast-web:v1).
 */
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { persist } from "zustand/middleware"
import { temporal } from "zundo"

import { getExampleProject } from "@/engine/example"
import {
  DEFAULT_ENERGY_PRICE_CT_KWH,
  DEFAULT_SYSTEM_EFFICIENCY,
} from "@/engine/energy"
import { measurePresetById } from "@/engine/measures"
import { optimizeMeasureYears, recommendMeasures } from "@/engine/recommend"
import type {
  BuildingComponent,
  CalculationParams,
  EnergyParams,
  Project,
  RecommendationInput,
  RenovationMeasureSelection,
  RenovationScenario,
  Room,
  Storey,
  UsageUnit,
} from "@/engine/types"
import {
  defaultEnergyParams,
  defaultParams,
  defaultRecommendationInput,
  defaultRenovation,
  makeRoom,
  makeStorey,
} from "@/engine/types"
import type { WizardState } from "@/pages/wizard/types"
import { exampleWizardState } from "@/pages/wizard/example"
import { initialWizardState } from "@/pages/wizard/types"

export interface RoomPath {
  unitIndex: number
  roomIndex: number
}

interface AppState {
  project: Project
  params: CalculationParams
  energyParams: EnergyParams
  renovation: RenovationScenario
  recommendationInput: RecommendationInput
  wizard: WizardState
  /** true, sobald ein Projekt geladen/bearbeitet wurde (für "Fortsetzen") */
  hasSession: boolean

  setProject: (project: Project) => void
  resetToDemo: () => void
  newEmptyProject: () => void
  setParams: (patch: Partial<CalculationParams>) => void
  setEnergyParams: (patch: Partial<EnergyParams>) => void
  addMeasure: (presetId: string) => void
  updateMeasure: (id: string, patch: Partial<RenovationMeasureSelection>) => void
  removeMeasure: (id: string) => void
  setRecommendationInput: (patch: Partial<RecommendationInput>) => void
  /** Erzeugt aus den Fragebogen-Antworten einen Maßnahmenvorschlag. */
  applyRecommendation: () => void
  /** Ordnet die Umsetzungsjahre für schnellste Amortisation neu an. */
  optimizeSchedule: () => void
  updateProjectMeta: (
    patch: Partial<Pick<Project, "projectId" | "description" | "address">>,
  ) => void

  addUnit: () => void
  removeUnit: (unitIndex: number) => void
  updateUnit: (unitIndex: number, patch: Partial<Omit<UsageUnit, "rooms">>) => void

  addRoom: (unitIndex: number, room?: Room) => void
  removeRoom: (path: RoomPath) => void
  /** Dupliziert den Raum und fügt die Kopie direkt dahinter ein. */
  duplicateRoom: (path: RoomPath) => void
  updateRoom: (path: RoomPath, patch: Partial<Room>) => void

  addComponent: (path: RoomPath, component: BuildingComponent) => void
  removeComponent: (path: RoomPath, componentIndex: number) => void
  updateComponent: (
    path: RoomPath,
    componentIndex: number,
    patch: Partial<BuildingComponent>,
  ) => void
  addOpening: (
    path: RoomPath,
    componentIndex: number,
    opening: BuildingComponent,
  ) => void
  removeOpening: (
    path: RoomPath,
    componentIndex: number,
    openingIndex: number,
  ) => void
  updateOpening: (
    path: RoomPath,
    componentIndex: number,
    openingIndex: number,
    patch: Partial<BuildingComponent>,
  ) => void

  upsertStorey: (storey: Storey) => void
  removeStorey: (id: string) => void

  setWizard: (patch: Partial<WizardState>) => void
  resetWizard: () => void
}

function emptyProject(): Project {
  return {
    projectId: "",
    description: "Heizlastberechnung",
    address: "",
    storeys: {
      EG: makeStorey({ id: "EG", storeyHeightM: 2.6 }),
    },
    usageUnits: [
      {
        number: 1,
        name: "Wohneinheit 1",
        rooms: [
          makeRoom({
            id: "EG-R1",
            name: "Wohnraum",
            floor: "EG",
            roomWidthM: 4,
            roomLengthM: 5,
            roomType: "Wohnraum",
            storeyId: "EG",
          }),
        ],
      },
    ],
  }
}

const roomAt = (state: { project: Project }, path: RoomPath): Room =>
  state.project.usageUnits[path.unitIndex].rooms[path.roomIndex]

/** Für Undo/Redo verfolgte Teilmenge des States. */
export interface UndoableState {
  project: Project
  params: CalculationParams
  energyParams: EnergyParams
  renovation: RenovationScenario
  recommendationInput: RecommendationInput
}

export const useProjectStore = create<AppState>()(
  persist(
    temporal(
      immer((set) => ({
      project: getExampleProject(),
      params: defaultParams(),
      energyParams: defaultEnergyParams(),
      renovation: defaultRenovation(),
      recommendationInput: defaultRecommendationInput(),
      wizard: initialWizardState(),
      hasSession: false,

      setProject: (project) =>
        set((s) => {
          s.project = project
          s.hasSession = true
        }),
      resetToDemo: () =>
        set((s) => {
          s.project = getExampleProject()
          s.params = defaultParams()
          s.energyParams = defaultEnergyParams()
          s.renovation = defaultRenovation()
          s.recommendationInput = defaultRecommendationInput()
          s.wizard = exampleWizardState()
          s.hasSession = true
        }),
      newEmptyProject: () =>
        set((s) => {
          s.project = emptyProject()
          s.params = defaultParams()
          s.energyParams = defaultEnergyParams()
          s.renovation = defaultRenovation()
          s.recommendationInput = defaultRecommendationInput()
          s.wizard = initialWizardState()
          s.hasSession = true
        }),
      setParams: (patch) =>
        set((s) => {
          Object.assign(s.params, patch)
          s.hasSession = true
        }),
      setEnergyParams: (patch) =>
        set((s) => {
          // Energieträgerwechsel: passenden Default-Wirkungsgrad und -preis
          // vorschlagen, sofern der Nutzer sie nicht selbst überschrieben hat.
          if (patch.carrier !== undefined) {
            const cur = s.energyParams
            if (
              patch.systemEfficiency === undefined &&
              cur.systemEfficiency === DEFAULT_SYSTEM_EFFICIENCY[cur.carrier]
            ) {
              cur.systemEfficiency = DEFAULT_SYSTEM_EFFICIENCY[patch.carrier]
            }
            if (
              patch.energyPriceCtKwh === undefined &&
              cur.energyPriceCtKwh === DEFAULT_ENERGY_PRICE_CT_KWH[cur.carrier]
            ) {
              cur.energyPriceCtKwh = DEFAULT_ENERGY_PRICE_CT_KWH[patch.carrier]
            }
          }
          Object.assign(s.energyParams, patch)
          s.hasSession = true
        }),
      addMeasure: (presetId) =>
        set((s) => {
          const preset = measurePresetById(presetId)
          if (!preset) return
          const nextYear =
            s.renovation.measures.reduce((max, m) => Math.max(max, m.year), 0) +
            1
          s.renovation.measures.push({
            id:
              globalThis.crypto?.randomUUID?.() ??
              `m-${Date.now()}-${s.renovation.measures.length}`,
            presetId,
            targetUValue: preset.kind === "envelope" ? preset.targetUValue : 0,
            year: nextYear,
            enabled: true,
          })
          s.hasSession = true
        }),
      updateMeasure: (id, patch) =>
        set((s) => {
          const m = s.renovation.measures.find((m) => m.id === id)
          if (m) Object.assign(m, patch)
          s.hasSession = true
        }),
      removeMeasure: (id) =>
        set((s) => {
          s.renovation.measures = s.renovation.measures.filter(
            (m) => m.id !== id,
          )
          s.hasSession = true
        }),
      setRecommendationInput: (patch) =>
        set((s) => {
          Object.assign(s.recommendationInput, patch)
          s.hasSession = true
        }),
      applyRecommendation: () =>
        set((s) => {
          s.renovation.measures = recommendMeasures(
            s.project,
            s.params,
            s.energyParams,
            s.recommendationInput,
          )
          s.hasSession = true
        }),
      optimizeSchedule: () =>
        set((s) => {
          s.renovation.measures = optimizeMeasureYears(
            s.project,
            s.params,
            s.energyParams,
            s.renovation.measures,
          )
          s.hasSession = true
        }),
      updateProjectMeta: (patch) =>
        set((s) => {
          Object.assign(s.project, patch)
          s.hasSession = true
        }),

      addUnit: () =>
        set((s) => {
          const nextNumber =
            Math.max(0, ...s.project.usageUnits.map((u) => u.number)) + 1
          s.project.usageUnits.push({
            number: nextNumber,
            name: `Wohneinheit ${nextNumber}`,
            rooms: [],
          })
          s.hasSession = true
        }),
      removeUnit: (unitIndex) =>
        set((s) => {
          s.project.usageUnits.splice(unitIndex, 1)
          s.hasSession = true
        }),
      updateUnit: (unitIndex, patch) =>
        set((s) => {
          Object.assign(s.project.usageUnits[unitIndex], patch)
          s.hasSession = true
        }),

      addRoom: (unitIndex, room) =>
        set((s) => {
          const unit = s.project.usageUnits[unitIndex]
          const firstStoreyId = Object.keys(s.project.storeys)[0] ?? null
          unit.rooms.push(
            room ??
              makeRoom({
                id: `${firstStoreyId ?? "R"}-R${unit.rooms.length + 1}`,
                name: "Neuer Raum",
                floor: firstStoreyId ?? "EG",
                roomWidthM: 4,
                roomLengthM: 4,
                roomType: "Wohnraum",
                storeyId: firstStoreyId,
              }),
          )
          s.hasSession = true
        }),
      removeRoom: (path) =>
        set((s) => {
          s.project.usageUnits[path.unitIndex].rooms.splice(path.roomIndex, 1)
          s.hasSession = true
        }),
      duplicateRoom: (path) =>
        set((s) => {
          const unit = s.project.usageUnits[path.unitIndex]
          const original = unit.rooms[path.roomIndex]
          if (!original) return
          const copy: Room = JSON.parse(JSON.stringify(original))
          const existingIds = new Set(
            s.project.usageUnits.flatMap((u) => u.rooms.map((r) => r.id)),
          )
          let n = 2
          while (existingIds.has(`${original.id}-${n}`)) n++
          copy.id = `${original.id}-${n}`
          copy.name = `${original.name} (Kopie)`
          unit.rooms.splice(path.roomIndex + 1, 0, copy)
          s.hasSession = true
        }),
      updateRoom: (path, patch) =>
        set((s) => {
          Object.assign(roomAt(s, path), patch)
          s.hasSession = true
        }),

      addComponent: (path, component) =>
        set((s) => {
          roomAt(s, path).components.push(component)
          s.hasSession = true
        }),
      removeComponent: (path, componentIndex) =>
        set((s) => {
          roomAt(s, path).components.splice(componentIndex, 1)
          s.hasSession = true
        }),
      updateComponent: (path, componentIndex, patch) =>
        set((s) => {
          Object.assign(roomAt(s, path).components[componentIndex], patch)
          s.hasSession = true
        }),
      addOpening: (path, componentIndex, opening) =>
        set((s) => {
          roomAt(s, path).components[componentIndex].openings.push(opening)
          s.hasSession = true
        }),
      removeOpening: (path, componentIndex, openingIndex) =>
        set((s) => {
          roomAt(s, path).components[componentIndex].openings.splice(
            openingIndex,
            1,
          )
          s.hasSession = true
        }),
      updateOpening: (path, componentIndex, openingIndex, patch) =>
        set((s) => {
          Object.assign(
            roomAt(s, path).components[componentIndex].openings[openingIndex],
            patch,
          )
          s.hasSession = true
        }),

      upsertStorey: (storey) =>
        set((s) => {
          s.project.storeys[storey.id] = storey
          s.hasSession = true
        }),
      removeStorey: (id) =>
        set((s) => {
          delete s.project.storeys[id]
          for (const unit of s.project.usageUnits) {
            for (const room of unit.rooms) {
              if (room.storeyId === id) room.storeyId = null
            }
          }
          s.hasSession = true
        }),

      setWizard: (patch) =>
        set((s) => {
          Object.assign(s.wizard, patch)
          s.hasSession = true
        }),
      resetWizard: () =>
        set((s) => {
          s.wizard = initialWizardState()
        }),
      })),
      {
        // Nur Projekt + Parameter sind undo-fähig; der Assistent hat seine
        // eigene Schritt-Navigation
        partialize: (s): UndoableState => ({
          project: s.project,
          params: s.params,
          energyParams: s.energyParams,
          renovation: s.renovation,
          recommendationInput: s.recommendationInput,
        }),
        limit: 50,
        equality: (a, b) => JSON.stringify(a) === JSON.stringify(b),
        // Tipp-Eingaben (z.B. Namen) nicht zeichenweise historisieren
        handleSet: (handleSet) => {
          let lastCall = 0
          return (state) => {
            const now = Date.now()
            if (now - lastCall > 400) {
              lastCall = now
              handleSet(state)
            }
          }
        },
      },
    ),
    {
      name: "heizlast-web:v1",
      version: 3,
      // Ältere Stände erhalten die seither ergänzten Felder mit Defaults.
      // v2: Energie-Parameter + Sanierungsszenario; v3: Fragebogen-Antworten.
      migrate: (persisted, version) => {
        const s = (persisted ?? {}) as Partial<AppState>
        if (version < 2) {
          if (!s.energyParams) s.energyParams = defaultEnergyParams()
          if (!s.renovation) s.renovation = defaultRenovation()
        }
        if (version < 3) {
          if (!s.recommendationInput)
            s.recommendationInput = defaultRecommendationInput()
        }
        return s as AppState
      },
    },
  ),
)
