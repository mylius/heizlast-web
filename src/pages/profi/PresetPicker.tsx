/**
 * Auswahl-Dialog für Bauteil-Vorlagen, gruppiert nach Bauteiltyp,
 * mit Baualtersklasse, U-Wert und Hinweis zur Eignung.
 */
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  ERA_LABELS,
  PRESETS,
  type ComponentPreset,
} from "@/engine/presets"
import type { ComponentType } from "@/engine/types"
import { de } from "@/lib/format"

const TYPE_LABELS: Record<ComponentType, string> = {
  AW: "Außenwand",
  AF: "Außenfenster",
  IW: "Innenwand",
  IT: "Innentür",
  AT: "Haustür / Außentür",
  DE: "Decke",
  DA: "Dachschräge",
  DF: "Dachfenster",
  FB: "Fußboden",
  HTW: "Haustrennwand",
  BA: "Boden gegen Außenluft",
}

interface PresetPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (preset: ComponentPreset) => void
  /** Nur diese Bauteiltypen anbieten (z.B. Öffnungen: AF/DF/AT/IT) */
  filterTypes?: ComponentType[]
  title?: string
}

export function PresetPicker({
  open,
  onOpenChange,
  onSelect,
  filterTypes,
  title = "Bauteil-Vorlage wählen",
}: PresetPickerProps) {
  const [query, setQuery] = useState("")

  const groups = useMemo(() => {
    const q = query.toLowerCase()
    const filtered = PRESETS.filter(
      (p) =>
        (!filterTypes || filterTypes.includes(p.componentType)) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.hint.toLowerCase().includes(q) ||
          p.componentType.toLowerCase().includes(q)),
    )
    const byType = new Map<ComponentType, ComponentPreset[]>()
    for (const p of filtered) {
      const list = byType.get(p.componentType) ?? []
      list.push(p)
      byType.set(p.componentType, list)
    }
    return byType
  }, [query, filterTypes])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Typische U-Werte nach Baualtersklasse — im Zweifel die Klasse der
            letzten Sanierung des jeweiligen Bauteils wählen.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Suchen…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="space-y-4">
          {[...groups.entries()].map(([type, presets]) => (
            <div key={type}>
              <h4 className="mb-1.5 text-sm font-semibold text-muted-foreground">
                {type} — {TYPE_LABELS[type]}
              </h4>
              <div className="space-y-1.5">
                {presets.map((p) => (
                  <Button
                    key={p.id}
                    variant="outline"
                    className="h-auto w-full justify-start gap-3 py-2 text-left whitespace-normal"
                    onClick={() => {
                      onSelect(p)
                      onOpenChange(false)
                    }}
                  >
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.name}</span>
                        <Badge variant="secondary">{ERA_LABELS[p.era]}</Badge>
                        <Badge variant="outline">
                          U = {de(p.uValue)} W/(m²K)
                        </Badge>
                      </div>
                      <p className="text-xs font-normal text-muted-foreground">
                        {p.hint}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ))}
          {groups.size === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Keine Vorlage gefunden.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
