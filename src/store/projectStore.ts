/**
 * Zentraler App-State: Projekt + Berechnungsparameter + Assistent-Antworten.
 * Persistiert in localStorage (Schlüssel heizlast-web:v1).
 */
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { persist } from "zustand/middleware"

import { getExampleProject } from "@/engine/example"
import type {
  BuildingComponent,
  CalculationParams,
  Project,
  Room,
  Storey,
  UsageUnit,
} from "@/engine/types"
import { defaultParams, makeRoom, makeStorey } from "@/engine/types"
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
  wizard: WizardState
  /** true, sobald ein Projekt geladen/bearbeitet wurde (für "Fortsetzen") */
  hasSession: boolean

  setProject: (project: Project) => void
  resetToDemo: () => void
  newEmptyProject: () => void
  setParams: (patch: Partial<CalculationParams>) => void
  updateProjectMeta: (
    patch: Partial<Pick<Project, "projectId" | "description" | "address">>,
  ) => void

  addUnit: () => void
  removeUnit: (unitIndex: number) => void
  updateUnit: (unitIndex: number, patch: Partial<Omit<UsageUnit, "rooms">>) => void

  addRoom: (unitIndex: number, room?: Room) => void
  removeRoom: (path: RoomPath) => void
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

export const useProjectStore = create<AppState>()(
  persist(
    immer((set) => ({
      project: getExampleProject(),
      params: defaultParams(),
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
          s.wizard = exampleWizardState()
          s.hasSession = true
        }),
      newEmptyProject: () =>
        set((s) => {
          s.project = emptyProject()
          s.params = defaultParams()
          s.wizard = initialWizardState()
          s.hasSession = true
        }),
      setParams: (patch) =>
        set((s) => {
          Object.assign(s.params, patch)
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
      name: "heizlast-web:v1",
      version: 1,
    },
  ),
)
