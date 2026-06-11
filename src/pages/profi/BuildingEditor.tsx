/**
 * Gebäude-Bereich des Profi-Modus: Projektdaten, Berechnungsparameter (θ_e)
 * und Geschosse mit ihren FB/DE-Defaults.
 */
import { Plus, Trash2 } from "lucide-react"

import { NumberField } from "@/components/inputs/NumberField"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { makeStorey, type AdjacentType, type Storey } from "@/engine/types"
import { useProjectStore } from "@/store/projectStore"

export function BuildingEditor() {
  const store = useProjectStore()
  const project = store.project
  const params = store.params

  const addStorey = () => {
    const existing = Object.keys(project.storeys)
    const candidates = ["EG", "OG1", "OG2", "DG", "KG"]
    const id =
      candidates.find((c) => !existing.includes(c)) ??
      `G${existing.length + 1}`
    store.upsertStorey(makeStorey({ id, storeyHeightM: 2.6 }))
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Projekt</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Projekt-ID</Label>
            <Input
              value={project.projectId}
              onChange={(e) => store.updateProjectMeta({ projectId: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschreibung</Label>
            <Input
              value={project.description}
              onChange={(e) =>
                store.updateProjectMeta({ description: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Adresse</Label>
            <Input
              value={project.address}
              onChange={(e) => store.updateProjectMeta({ address: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Berechnungsparameter</CardTitle>
          <CardDescription>
            Norm-Außentemperatur des Standorts (DIN/TS 12831-1). ρ·c_p für die
            Lüftungsverluste ist mit 0,34 Wh/(m³K) fest hinterlegt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-48 space-y-1">
            <Label className="text-xs text-muted-foreground">
              Auslegungs-Außentemperatur θ_e (°C)
            </Label>
            <NumberField
              value={params.thetaEC}
              onCommit={(v) => store.setParams({ thetaEC: v ?? -10.3 })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Geschosse</CardTitle>
          <CardDescription>
            Geschosse liefern Höhe, Deckendicke und Standard-Fußboden/Decke
            (FB/DE) für ihre Räume — einzelne Räume können alles überschreiben.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.values(project.storeys).map((storey) => (
            <StoreyRow key={storey.id} storey={storey} />
          ))}
          <Button size="sm" variant="outline" onClick={addStorey}>
            <Plus /> Geschoss hinzufügen
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function StoreyRow({ storey }: { storey: Storey }) {
  const store = useProjectStore()
  const update = (patch: Partial<Storey>) =>
    store.upsertStorey({ ...storey, ...patch })

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{storey.id}</h4>
        <Button
          size="icon"
          variant="ghost"
          className="size-7 text-destructive"
          aria-label={`Geschoss ${storey.id} löschen`}
          onClick={() => store.removeStorey(storey.id)}
        >
          <Trash2 />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SmallField label="Geschosshöhe (m)">
          <NumberField
            value={storey.storeyHeightM}
            onCommit={(v) => update({ storeyHeightM: v ?? 0 })}
          />
        </SmallField>
        <SmallField label="Deckendicke (m)">
          <NumberField
            value={storey.ceilingThicknessM}
            onCommit={(v) => update({ ceilingThicknessM: v ?? 0.2 })}
          />
        </SmallField>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2 rounded-md bg-muted/40 p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">
              Fußboden-Default (FB)
            </span>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              automatisch ergänzen
              <Switch
                checked={storey.addDefaultFb}
                onCheckedChange={(addDefaultFb) => update({ addDefaultFb })}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SmallField label="θ_adj (°C)">
              <NumberField
                value={storey.fbThetaAdjacentC}
                onCommit={(v) => update({ fbThetaAdjacentC: v ?? 10 })}
              />
            </SmallField>
            <SmallField label="U-Wert">
              <NumberField
                value={storey.fbUValue}
                onCommit={(v) => update({ fbUValue: v ?? 1.6 })}
              />
            </SmallField>
            <SmallField label="f_ix">
              <NumberField
                value={storey.fbFIx}
                onCommit={(v) => update({ fbFIx: v ?? 0.33 })}
              />
            </SmallField>
            <SmallField label="grenzt an">
              <AdjacentSelect
                value={storey.fbAdjacent}
                onChange={(fbAdjacent) => update({ fbAdjacent })}
              />
            </SmallField>
          </div>
        </div>
        <div className="space-y-2 rounded-md bg-muted/40 p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Decken-Default (DE)</span>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              automatisch ergänzen
              <Switch
                checked={storey.addDefaultDe}
                onCheckedChange={(addDefaultDe) => update({ addDefaultDe })}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SmallField label="θ_adj (°C)">
              <NumberField
                value={storey.deThetaAdjacentC}
                onCommit={(v) => update({ deThetaAdjacentC: v ?? 20 })}
              />
            </SmallField>
            <SmallField label="U-Wert">
              <NumberField
                value={storey.deUValue}
                onCommit={(v) => update({ deUValue: v ?? 0.97 })}
              />
            </SmallField>
            <SmallField label="f_ix">
              <NumberField
                value={storey.deFIx}
                onCommit={(deFIx) => update({ deFIx })}
                nullable
                placeholder="auto"
              />
            </SmallField>
            <SmallField label="grenzt an">
              <AdjacentSelect
                value={storey.deAdjacent}
                onChange={(deAdjacent) => update({ deAdjacent })}
              />
            </SmallField>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdjacentSelect({
  value,
  onChange,
}: {
  value: AdjacentType
  onChange: (a: AdjacentType) => void
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AdjacentType)}>
      <SelectTrigger size="sm" className="h-8 w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="e">e (außen/unbeheizt)</SelectItem>
        <SelectItem value="ij">ij (innen/beheizt)</SelectItem>
      </SelectContent>
    </Select>
  )
}

function SmallField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
