/**
 * Schritt 1: Gebäude — Name, Adresse, Gebäudetyp und Baualtersklasse.
 */
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ERA_LABELS } from "@/engine/presets"
import { cn } from "@/lib/utils"
import { useProjectStore } from "@/store/projectStore"

import type { BuildingKind, WizardState } from "../types"

const KINDS: { id: BuildingKind; label: string; hint: string }[] = [
  {
    id: "efh",
    label: "Einfamilienhaus",
    hint: "Freistehendes Haus — alle Außenwände grenzen an Außenluft.",
  },
  {
    id: "dhh",
    label: "Doppelhaushälfte / Reihenhaus",
    hint: "Eine oder zwei Seiten grenzen an den Nachbarn (Haustrennwand).",
  },
  {
    id: "wohnung",
    label: "Wohnung",
    hint: "Nur die tatsächlichen Außenflächen erfassen; Wände zu beheizten Nachbarwohnungen verursachen keine Verluste.",
  },
]

const ERAS: { id: WizardState["era"]; hint: string }[] = [
  {
    id: "altbau",
    hint: "Ungedämmter Bestand vor der 1. Wärmeschutzverordnung: massive Wände ohne Dämmung, einfache Fenster (sofern nicht getauscht).",
  },
  {
    id: "wschvo77",
    hint: "Baujahr ca. 1977–1995: erste Dämmstandards, z.B. Sparrendämmung im Dach.",
  },
  {
    id: "modern",
    hint: "EnEV 2002 bis GEG bzw. umfassend saniert: gedämmte Hülle, Wärmeschutzverglasung.",
  },
  {
    id: "passivhaus",
    hint: "Hochgedämmt mit 3-Scheiben-Verglasung und sehr geringen Verlusten.",
  },
]

export function GebaeudeStep() {
  const wizard = useProjectStore((s) => s.wizard)
  const setWizard = useProjectStore((s) => s.setWizard)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Projektname</Label>
          <Input
            value={wizard.projectName}
            placeholder="z.B. Heizlast Musterstraße 1"
            onChange={(e) => setWizard({ projectName: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Adresse (optional)</Label>
          <Input
            value={wizard.address}
            placeholder="Straße, PLZ Ort"
            onChange={(e) => setWizard({ address: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Gebäudetyp</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {KINDS.map((k) => (
            <OptionCard
              key={k.id}
              active={wizard.buildingKind === k.id}
              title={k.label}
              hint={k.hint}
              onClick={() => setWizard({ buildingKind: k.id })}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Baualtersklasse</Label>
        <p className="text-xs text-muted-foreground">
          Bestimmt die vorgeschlagenen U-Werte aller Bauteile. Maßgeblich ist
          der Zustand heute: ein 1960er-Haus mit gedämmter Fassade wählt
          „Modern". Einzelne Bauteile lassen sich später anpassen.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {ERAS.map((e) => (
            <OptionCard
              key={e.id}
              active={wizard.era === e.id}
              title={ERA_LABELS[e.id]}
              hint={e.hint}
              onClick={() => setWizard({ era: e.id })}
            />
          ))}
        </div>
      </div>

      {wizard.era !== "modern" && wizard.era !== "passivhaus" && (
        <label className="flex items-start gap-3 rounded-md border p-3">
          <Switch
            checked={wizard.windowsReplaced}
            onCheckedChange={(windowsReplaced) => setWizard({ windowsReplaced })}
          />
          <span className="space-y-0.5">
            <span className="block text-sm font-medium">
              Fenster wurden später getauscht
            </span>
            <span className="block text-xs text-muted-foreground">
              Sehr häufig bei Altbauten: moderne 2-Scheiben-Verglasung
              (U = 1,05) statt der alten Fenster — trotz ungedämmter Wände.
            </span>
          </span>
        </label>
      )}
    </div>
  )
}

function OptionCard({
  active,
  title,
  hint,
  onClick,
}: {
  active: boolean
  title: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border p-3 text-left transition-colors",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "hover:bg-muted/50",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{title}</span>
        {active && <Badge className="px-1.5 text-[10px]">gewählt</Badge>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </button>
  )
}
