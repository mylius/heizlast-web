/**
 * Schritt 6: Ergebnis — Heizlast aus den Assistent-Eingaben, mit Export und
 * Übergabe an den Profi-Modus (verlustfrei, gleiches Datenmodell).
 */
import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { FileDown, FileText, SlidersHorizontal } from "lucide-react"

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
import { aggregateHeatLoss } from "@/engine/breakdown"
import { computeProject } from "@/engine/calc"
import { aFloorM2 } from "@/engine/derive"
import { validateProject } from "@/engine/validate"
import { de, deKw } from "@/lib/format"
import { saveProjectFile } from "@/lib/projectFile"
import { useProjectStore } from "@/store/projectStore"

import { buildProjectFromWizard, paramsFromWizard } from "../mapping"

export function ErgebnisStep() {
  const navigate = useNavigate()
  const wizard = useProjectStore((s) => s.wizard)
  const setProject = useProjectStore((s) => s.setProject)
  const setParams = useProjectStore((s) => s.setParams)

  const { project, params, results } = useMemo(() => {
    const project = buildProjectFromWizard(wizard)
    const params = paramsFromWizard(wizard)
    return { project, params, results: computeProject(project, params) }
  }, [wizard])

  const totalArea = project.usageUnits
    .flatMap((u) => u.rooms)
    .reduce((s, r) => s + aFloorM2(r), 0)
  const specific = totalArea > 0 ? results.totalPhiHlW / totalArea : 0
  const validations = validateProject(project, results)

  const applyToStore = () => {
    setProject(project)
    setParams(params)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 text-center">
        <div className="text-sm text-muted-foreground">
          Normheizlast des Gebäudes
        </div>
        <div className="text-4xl font-bold tracking-tight">
          {deKw(results.totalPhiHlW)}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          {de(specific, 0)} W/m² beheizter Fläche ·{" "}
          {specific > 100
            ? "hoher Wert — typisch für ungedämmten Altbau"
            : specific > 50
              ? "mittlerer Wert — teilsanierter Bestand"
              : "niedriger Wert — gut gedämmtes Gebäude"}
        </div>
        <p className="mx-auto mt-3 max-w-xl text-xs text-muted-foreground">
          Die Heizlast ist die Leistung, die die Heizung am kältesten
          Auslegungstag liefern muss — eine wichtige Größe für die
          Dimensionierung z.B. einer Wärmepumpe. Für Förderanträge und die
          Heizungsauslegung sollte ein Fachbetrieb die Berechnung prüfen.
        </p>
      </div>

      {validations.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          <p className="mb-1 font-semibold">Hinweise zur Plausibilität</p>
          <ul className="list-inside list-disc space-y-0.5">
            {validations.flatMap((v) =>
              v.warnings.map((w, i) => (
                <li key={`${v.roomId}-${i}`}>
                  <strong>
                    {v.roomId} {v.roomName}:
                  </strong>{" "}
                  {w}
                </li>
              )),
            )}
          </ul>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Wohin geht die Wärme?</CardTitle>
        </CardHeader>
        <CardContent>
          <SankeyChart breakdown={aggregateHeatLoss(results)} />
          <p className="mt-2 text-xs text-muted-foreground">
            Die größten Posten sind die wirksamsten Ansatzpunkte für eine
            Sanierung — was hier oben steht, lohnt sich zuerst.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Räume</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ZonesTable project={project} results={results} />
          <LoadBars results={results} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zusammenstellung</CardTitle>
        </CardHeader>
        <CardContent>
          <UnitTotalsTable results={results} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            applyToStore()
            navigate("/bericht")
          }}
        >
          <FileText /> Bericht / PDF erstellen
        </Button>
        <Button variant="outline" onClick={() => saveProjectFile(project, params)}>
          <FileDown /> Projekt speichern (.json)
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            applyToStore()
            navigate("/profi")
          }}
        >
          <SlidersHorizontal /> Im Profi-Modus verfeinern
        </Button>
      </div>
    </div>
  )
}
