/**
 * Profi-Modus: Sidebar (Nutzungseinheiten → Räume, Gebäude), Hauptbereich
 * mit Raum-Editor bzw. Übersicht, Live-Ergebnisse.
 */
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building2,
  FileDown,
  FileUp,
  FileText,
  LayoutList,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react"

import { LoadBars } from "@/components/results/LoadBars"
import { SankeyChart } from "@/components/results/SankeyChart"
import { UnitTotalsTable } from "@/components/results/UnitTotalsTable"
import { ZonesTable } from "@/components/results/ZonesTable"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { deKw, deWatt } from "@/lib/format"
import { openProjectFile, saveProjectFile } from "@/lib/projectFile"
import { cn } from "@/lib/utils"
import { aggregateHeatLoss } from "@/engine/breakdown"
import { validateProject } from "@/engine/validate"
import { useProjectStore } from "@/store/projectStore"
import { useProjectResults } from "@/store/selectors"

import { BuildingEditor } from "./BuildingEditor"
import { RoomEditor } from "./RoomEditor"

type Selection =
  | { kind: "overview" }
  | { kind: "building" }
  | { kind: "room"; unitIndex: number; roomIndex: number }

export function ProfiPage() {
  const store = useProjectStore()
  const project = store.project
  const results = useProjectResults()
  const navigate = useNavigate()
  const [selection, setSelection] = useState<Selection>({ kind: "overview" })
  const validations = validateProject(project, results)
  const warningsAt = (unitIndex: number, roomIndex: number) =>
    validations.find(
      (v) => v.unitIndex === unitIndex && v.roomIndex === roomIndex,
    )

  // Auswahl absichern, falls Räume/Einheiten gelöscht wurden
  const validSelection: Selection =
    selection.kind === "room" &&
    !project.usageUnits[selection.unitIndex]?.rooms[selection.roomIndex]
      ? { kind: "overview" }
      : selection

  return (
    <div className="mx-auto flex max-w-[100rem] gap-6 px-4 py-6">
      <aside className="w-64 shrink-0 space-y-4">
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => saveProjectFile(project, store.params)}
          >
            <FileDown /> Speichern
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => openProjectFile()}>
            <FileUp /> Öffnen
          </Button>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="w-full"
          onClick={() => navigate("/bericht")}
        >
          <FileText /> Bericht / Export
        </Button>
        <Separator />
        <nav className="space-y-1">
          <SidebarItem
            active={validSelection.kind === "overview"}
            onClick={() => setSelection({ kind: "overview" })}
          >
            <LayoutList className="size-4" /> Übersicht
            <span className="ml-auto text-xs font-semibold tabular-nums">
              {deKw(results.totalPhiHlW)}
            </span>
          </SidebarItem>
          <SidebarItem
            active={validSelection.kind === "building"}
            onClick={() => setSelection({ kind: "building" })}
          >
            <Building2 className="size-4" /> Gebäude & Geschosse
          </SidebarItem>
        </nav>
        {project.usageUnits.map((unit, unitIndex) => (
          <div key={unitIndex} className="space-y-1">
            <div className="flex items-center justify-between px-2">
              <Input
                className="h-7 border-none px-0 text-xs font-semibold shadow-none focus-visible:ring-0"
                value={unit.name}
                onChange={(e) =>
                  store.updateUnit(unitIndex, { name: e.target.value })
                }
              />
              <span className="text-xs text-muted-foreground tabular-nums">
                {deWatt(results.unitResults[unitIndex]?.phiHlW ?? 0)}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`${unit.name} löschen`}
                onClick={() => {
                  if (
                    unit.rooms.length > 0 &&
                    !window.confirm(
                      `„${unit.name}" mit ${unit.rooms.length} ${unit.rooms.length === 1 ? "Raum" : "Räumen"} löschen?`,
                    )
                  ) {
                    return
                  }
                  store.removeUnit(unitIndex)
                  setSelection({ kind: "overview" })
                }}
              >
                <Trash2 />
              </Button>
            </div>
            {unit.rooms.map((room, roomIndex) => (
              <SidebarItem
                key={roomIndex}
                active={
                  validSelection.kind === "room" &&
                  validSelection.unitIndex === unitIndex &&
                  validSelection.roomIndex === roomIndex
                }
                onClick={() =>
                  setSelection({ kind: "room", unitIndex, roomIndex })
                }
              >
                <span className="truncate">
                  {room.id} {room.name}
                </span>
                {warningsAt(unitIndex, roomIndex) && (
                  <TriangleAlert
                    className="size-3.5 shrink-0 text-amber-500"
                    aria-label="Hinweise vorhanden"
                  />
                )}
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {deWatt(
                    results.unitResults[unitIndex]?.roomResults[roomIndex]
                      ?.phiHlW ?? 0,
                  )}
                </span>
              </SidebarItem>
            ))}
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
              onClick={() => {
                store.addRoom(unitIndex)
                setSelection({
                  kind: "room",
                  unitIndex,
                  roomIndex: unit.rooms.length,
                })
              }}
            >
              <Plus /> Raum
            </Button>
          </div>
        ))}
        <Button
          size="sm"
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => store.addUnit()}
        >
          <Plus /> Nutzungseinheit
        </Button>
      </aside>

      <main className="min-w-0 flex-1">
        {validSelection.kind === "overview" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Zonenübersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <ZonesTable project={project} results={results} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Wohin geht die Wärme?</CardTitle>
              </CardHeader>
              <CardContent>
                <SankeyChart breakdown={aggregateHeatLoss(results)} />
              </CardContent>
            </Card>
            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Heizlast je Raum</CardTitle>
                </CardHeader>
                <CardContent>
                  <LoadBars results={results} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Ergebnis Nutzungseinheiten</CardTitle>
                </CardHeader>
                <CardContent>
                  <UnitTotalsTable results={results} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        {validSelection.kind === "building" && <BuildingEditor />}
        {validSelection.kind === "room" && (
          <RoomEditor
            path={{
              unitIndex: validSelection.unitIndex,
              roomIndex: validSelection.roomIndex,
            }}
          />
        )}
      </main>
    </div>
  )
}

function SidebarItem({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
        active
          ? "bg-secondary font-medium text-secondary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}
