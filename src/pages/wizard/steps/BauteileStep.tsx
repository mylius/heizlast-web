/**
 * Schritt 5: Bauteile prüfen — die aus der Baualtersklasse abgeleiteten
 * Vorlagen je Kategorie ansehen und bei Bedarf austauschen
 * (z.B. nur die Fenster moderner als die Wände).
 */
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ERA_LABELS, PRESETS } from "@/engine/presets"
import type { ComponentType } from "@/engine/types"
import { de } from "@/lib/format"
import { useProjectStore } from "@/store/projectStore"

import { effectivePresetFor } from "../mapping"

const CATEGORIES: { type: ComponentType; label: string }[] = [
  { type: "AW", label: "Außenwände" },
  { type: "AF", label: "Fenster" },
  { type: "DA", label: "Dachschrägen" },
  { type: "DF", label: "Dachfenster" },
  { type: "AT", label: "Haustür" },
]

export function BauteileStep() {
  const wizard = useProjectStore((s) => s.wizard)
  const setWizard = useProjectStore((s) => s.setWizard)

  // Nur Kategorien zeigen, die im Projekt vorkommen
  const usedTypes = new Set<ComponentType>()
  for (const room of wizard.rooms) {
    if (room.walls.some((w) => w.lengthM > 0)) usedTypes.add("AW")
    if (room.walls.some((w) => w.windowAreaM2 > 0)) usedTypes.add("AF")
    if (room.roofWidthM > 0) usedTypes.add("DA")
    if (room.roofWindowAreaM2 > 0) usedTypes.add("DF")
    if (room.hasEntranceDoor) usedTypes.add("AT")
  }
  const categories = CATEGORIES.filter((c) => usedTypes.has(c.type))

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Aus der Baualtersklasse{" "}
        <Badge variant="secondary">{ERA_LABELS[wizard.era]}</Badge> wurden
        diese Vorlagen gewählt. Einzelne Kategorien können abweichen — typisch
        bei Teilsanierungen (neue Fenster, gedämmtes Dach, alte Wände).
      </p>

      {categories.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Noch keine Räume mit Außenbauteilen erfasst — bitte zurück zu
          Schritt 4.
        </p>
      )}

      {categories.map(({ type, label }) => {
        const current = effectivePresetFor(wizard, type)
        const options = PRESETS.filter((p) => p.componentType === type)
        return (
          <div key={type} className="space-y-2 rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Label className="w-32 font-semibold">{label}</Label>
              <Select
                value={current.id}
                onValueChange={(id) =>
                  setWizard({
                    presetOverrides: { ...wizard.presetOverrides, [type]: id },
                  })
                }
              >
                <SelectTrigger size="sm" className="w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — U = {de(p.uValue)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="outline">U = {de(current.uValue)} W/(m²K)</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{current.hint}</p>
          </div>
        )
      })}
    </div>
  )
}
