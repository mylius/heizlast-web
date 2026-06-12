import { useNavigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { deKw } from "@/lib/format"
import { openProjectFile } from "@/lib/projectFile"
import { useProjectStore } from "@/store/projectStore"
import { useProjectResults } from "@/store/selectors"

export function StartPage() {
  const navigate = useNavigate()
  const hasSession = useProjectStore((s) => s.hasSession)
  const project = useProjectStore((s) => s.project)
  const resetToDemo = useProjectStore((s) => s.resetToDemo)
  const newEmptyProject = useProjectStore((s) => s.newEmptyProject)
  const resetWizard = useProjectStore((s) => s.resetWizard)
  const results = useProjectResults()

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Heizlastberechnung nach DIN EN 12831
        </h1>
        <p className="text-muted-foreground">
          Raumweise Normheizlast für Wohngebäude — als geführter Assistent für
          Hausbesitzer oder im Profi-Modus für Energieberater. Alle Daten
          bleiben im Browser.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Geführter Assistent</CardTitle>
            <CardDescription>
              Schritt für Schritt: Gebäude, Standort, Geschosse und Räume
              eingeben — mit verständlichen Vorlagen nach Baujahr. Ideal, um
              z.B. vor einem Heizungstausch die Größenordnung zu ermitteln.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button
              className="w-full"
              onClick={() => {
                resetWizard()
                navigate("/assistent")
              }}
            >
              Assistent starten
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>
              Profi-Modus{" "}
              <Badge variant="secondary" className="ml-1 align-middle">
                Energieberater
              </Badge>
            </CardTitle>
            <CardDescription>
              Volle Kontrolle über alle Bauteile, f_ix, Wärmebrückenzuschläge
              und Lüftungswerte — mit Live-Ergebnissen und Export als PDF,
              Excel, Markdown oder Projektdatei.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/profi")}
            >
              Profi-Modus öffnen
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {hasSession && (
          <Button variant="secondary" onClick={() => navigate("/profi")}>
            Letzte Sitzung fortsetzen
            <span className="ml-2 text-xs text-muted-foreground">
              {project.projectId || project.description} ·{" "}
              {deKw(results.totalPhiHlW)}
            </span>
          </Button>
        )}
        <Button
          variant="outline"
          onClick={async () => {
            if (await openProjectFile()) navigate("/profi")
          }}
        >
          Projektdatei öffnen (.json)
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            resetToDemo()
            navigate("/assistent")
          }}
        >
          Demo im Assistenten öffnen
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            resetToDemo()
            navigate("/profi")
          }}
        >
          Demo im Profi-Modus öffnen
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            newEmptyProject()
            navigate("/profi")
          }}
        >
          Leeres Projekt
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Die Berechnung deckt Transmissions- und Lüftungswärmeverluste nach
        EN 12831-1 ab; Sonderfälle wie erdreichberührte Bodenplatten
        (B′-Verfahren) sind vereinfacht. Projekte lassen sich als JSON-Datei
        speichern und wieder öffnen.
      </p>
    </div>
  )
}
