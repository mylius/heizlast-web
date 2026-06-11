/**
 * Bauteil-Tabelle eines Raums (Spalten wie das RAUMHEIZLAST-Formular) mit
 * Inline-Bearbeitung und Live-Neuberechnung. Aus dem Geschoss geerbte
 * DE/FB-Zeilen sind grau und können in den Raum übernommen werden;
 * Öffnungen erscheinen als eingerückte Unterzeilen ihrer Wand.
 */
import { useMemo, useState } from "react"
import { CopyPlus, Plus, SquarePlus, Trash2 } from "lucide-react"

import { NumberField } from "@/components/inputs/NumberField"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { computeRoomTransmission, type ComponentResult } from "@/engine/calc"
import { buildFromPreset, type ComponentPreset } from "@/engine/presets"
import type {
  BuildingComponent,
  ComponentType,
  Orientation,
  Room,
  Storey,
} from "@/engine/types"
import { COMPONENT_TYPES, ORIENTATIONS } from "@/engine/types"
import { de, deWatt } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useProjectStore, type RoomPath } from "@/store/projectStore"

import { PresetPicker } from "./PresetPicker"

interface GridRow {
  res: ComponentResult
  componentIndex: number
  openingIndex: number | null
}

/** 0 ↔ leer für Felder, bei denen 0 "nicht gesetzt" bedeutet. */
function zeroAsEmpty(
  value: number,
  onCommit: (v: number) => void,
): { value: number | null; onCommit: (v: number | null) => void } {
  return {
    value: value === 0 ? null : value,
    onCommit: (v) => onCommit(v ?? 0),
  }
}

export function ComponentGrid({
  room,
  storey,
  path,
  thetaEC,
}: {
  room: Room
  storey?: Storey
  path: RoomPath
  thetaEC: number
}) {
  const store = useProjectStore()
  const [presetTarget, setPresetTarget] = useState<
    { kind: "component" } | { kind: "opening"; componentIndex: number } | null
  >(null)

  const rows = useMemo<GridRow[]>(() => {
    const [results] = computeRoomTransmission(room, storey)
    let parentIdx = -1
    return results.map((res) => {
      if (!res.isOpening) {
        parentIdx = room.components.indexOf(res.component)
        return { res, componentIndex: parentIdx, openingIndex: null }
      }
      const openingIdx =
        parentIdx >= 0
          ? room.components[parentIdx].openings.indexOf(res.component)
          : -1
      return { res, componentIndex: parentIdx, openingIndex: openingIdx }
    })
  }, [room, storey])

  const phiTotal = rows.reduce((s, r) => s + r.res.phiTKW, 0)

  const onPresetSelect = (preset: ComponentPreset) => {
    if (!presetTarget) return
    if (presetTarget.kind === "component") {
      store.addComponent(
        path,
        buildFromPreset(preset, {
          orientation: preset.componentType === "FB" || preset.componentType === "DE" || preset.componentType === "BA" ? "H" : "N",
          lengthHeightM: null,
          thetaEC,
        }),
      )
    } else {
      store.addOpening(
        path,
        presetTarget.componentIndex,
        buildFromPreset(preset, { bruttoM2: 1.5, thetaEC }),
      )
    }
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md border">
        <Table className="text-xs [&_td]:px-1.5 [&_td]:py-1 [&_th]:px-1.5">
          <TableHeader>
            <TableRow>
              <TableHead>Orient.</TableHead>
              <TableHead>Bauteil</TableHead>
              <TableHead className="text-right">Breite (m)</TableHead>
              <TableHead className="text-right">L/H (m)</TableHead>
              <TableHead className="text-right">Brutto (m²)</TableHead>
              <TableHead className="text-right">Abzug (m²)</TableHead>
              <TableHead className="text-right">A_k (m²)</TableHead>
              <TableHead>grenzt an</TableHead>
              <TableHead className="text-right">θ_adj (°C)</TableHead>
              <TableHead className="text-right">f_ix</TableHead>
              <TableHead className="text-right">U_k</TableHead>
              <TableHead className="text-right">ΔU_TB</TableHead>
              <TableHead className="text-right">U_korr</TableHead>
              <TableHead className="text-right">Φ_T,k (W)</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) =>
              row.openingIndex === null ? (
                <ComponentRow
                  key={`c-${i}`}
                  row={row}
                  path={path}
                  onAddOpening={(componentIndex) =>
                    setPresetTarget({ kind: "opening", componentIndex })
                  }
                />
              ) : (
                <OpeningRow key={`o-${i}`} row={row} path={path} />
              ),
            )}
            <TableRow className="bg-muted/30 font-semibold">
              <TableCell colSpan={13} className="text-right">
                Σ Φ_T,stand,i
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {deWatt(phiTotal)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPresetTarget({ kind: "component" })}
        >
          <SquarePlus /> Bauteil aus Vorlage
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            store.addComponent(path, {
              orientation: "N",
              componentType: "AW",
              label: "",
              widthM: 0,
              lengthHeightM: null,
              bruttoM2: 0,
              abzugM2: 0,
              openings: [],
              adjacent: "e",
              thetaAdjacentC: thetaEC,
              fIx: null,
              uValue: 1.0,
              deltaUTb: 0,
            })
          }
        >
          <Plus /> Leeres Bauteil
        </Button>
      </div>
      <PresetPicker
        open={presetTarget !== null}
        onOpenChange={(open) => !open && setPresetTarget(null)}
        onSelect={onPresetSelect}
        filterTypes={
          presetTarget?.kind === "opening"
            ? ["AF", "DF", "AT", "IT"]
            : undefined
        }
        title={
          presetTarget?.kind === "opening"
            ? "Öffnung (Fenster/Tür) hinzufügen"
            : "Bauteil-Vorlage wählen"
        }
      />
    </div>
  )
}

function OrientationSelect({
  value,
  onChange,
}: {
  value: Orientation
  onChange: (o: Orientation) => void
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Orientation)}>
      <SelectTrigger size="sm" className="h-7 w-14 px-2 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ORIENTATIONS.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ComponentRow({
  row,
  path,
  onAddOpening,
}: {
  row: GridRow
  path: RoomPath
  onAddOpening: (componentIndex: number) => void
}) {
  const store = useProjectStore()
  const { res, componentIndex } = row
  const c = res.component
  const injected = componentIndex < 0
  const update = (patch: Partial<BuildingComponent>) =>
    store.updateComponent(path, componentIndex, patch)

  if (injected) {
    return (
      <TableRow className="bg-muted/40 text-muted-foreground">
        <TableCell>{c.orientation}</TableCell>
        <TableCell>
          <span className="flex items-center gap-1.5">
            {c.componentType}
            <Badge variant="outline" className="px-1 text-[10px]">
              aus Geschoss
            </Badge>
          </span>
        </TableCell>
        <TableCell className="text-right">–</TableCell>
        <TableCell className="text-right">–</TableCell>
        <TableCell className="text-right tabular-nums">
          {de(res.effectiveBruttoM2)}
        </TableCell>
        <TableCell className="text-right">–</TableCell>
        <TableCell className="text-right tabular-nums">{de(res.aKM2)}</TableCell>
        <TableCell>{c.adjacent}</TableCell>
        <TableCell className="text-right tabular-nums">
          {de(c.thetaAdjacentC, 1)}
        </TableCell>
        <TableCell className="text-right tabular-nums">{de(res.fIx)}</TableCell>
        <TableCell className="text-right tabular-nums">{de(c.uValue)}</TableCell>
        <TableCell className="text-right">–</TableCell>
        <TableCell className="text-right tabular-nums">
          {de(res.uCorrected)}
        </TableCell>
        <TableCell className="text-right font-medium tabular-nums">
          {res.phiTKW}
        </TableCell>
        <TableCell>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-6"
                onClick={() => store.addComponent(path, { ...c })}
              >
                <CopyPlus />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              In den Raum übernehmen, um es zu bearbeiten
            </TooltipContent>
          </Tooltip>
        </TableCell>
      </TableRow>
    )
  }

  const hasOpenings = c.openings.length > 0
  return (
    <TableRow>
      <TableCell>
        <OrientationSelect
          value={c.orientation}
          onChange={(orientation) => update({ orientation })}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Select
            value={c.componentType}
            onValueChange={(v) => update({ componentType: v as ComponentType })}
          >
            <SelectTrigger size="sm" className="h-7 w-[5.5rem] px-2 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMPONENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {c.label && (
            <span className="max-w-24 truncate text-muted-foreground" title={c.label}>
              {c.label}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <NumberField
          className="h-7 w-16"
          aria-label="Breite"
          {...zeroAsEmpty(c.widthM, (widthM) => update({ widthM }))}
          nullable
        />
      </TableCell>
      <TableCell>
        <NumberField
          className="h-7 w-16"
          aria-label="Länge/Höhe"
          value={c.lengthHeightM ? c.lengthHeightM : null}
          onCommit={(lengthHeightM) => update({ lengthHeightM })}
          nullable
          placeholder={c.orientation !== "H" ? "Raumhöhe" : ""}
        />
      </TableCell>
      <TableCell>
        <NumberField
          className="h-7 w-16"
          aria-label="Bruttofläche"
          {...zeroAsEmpty(c.bruttoM2, (bruttoM2) => update({ bruttoM2 }))}
          nullable
          placeholder={res.effectiveBruttoM2 ? de(res.effectiveBruttoM2) : ""}
        />
      </TableCell>
      <TableCell>
        {hasOpenings ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block text-right tabular-nums">
                {de(res.effectiveAbzugM2)}
              </span>
            </TooltipTrigger>
            <TooltipContent>Summe der Öffnungen (automatisch)</TooltipContent>
          </Tooltip>
        ) : (
          <NumberField
            className="h-7 w-16"
            aria-label="Abzugsfläche"
            {...zeroAsEmpty(c.abzugM2, (abzugM2) => update({ abzugM2 }))}
            nullable
          />
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">{de(res.aKM2)}</TableCell>
      <TableCell>
        <Select
          value={c.adjacent}
          onValueChange={(v) => update({ adjacent: v as "ij" | "e" })}
        >
          <SelectTrigger size="sm" className="h-7 w-14 px-2 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="e">e</SelectItem>
            <SelectItem value="ij">ij</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <NumberField
          className="h-7 w-16"
          aria-label="Angrenzende Temperatur"
          value={c.thetaAdjacentC}
          onCommit={(v) => update({ thetaAdjacentC: v ?? 0 })}
        />
      </TableCell>
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <NumberField
                className="h-7 w-16"
                aria-label="f_ix"
                value={c.fIx}
                onCommit={(fIx) => update({ fIx })}
                nullable
                placeholder={`auto ${de(res.fIx, 2)}`}
              />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Leer = automatisch (0 bei „ij", 1 bei „e"). Explizite Werte —
            auch 0 oder negativ — haben Vorrang.
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell>
        <NumberField
          className="h-7 w-16"
          aria-label="U-Wert"
          value={c.uValue}
          onCommit={(v) => update({ uValue: v ?? 0 })}
        />
      </TableCell>
      <TableCell>
        <NumberField
          className="h-7 w-14"
          aria-label="Wärmebrückenzuschlag"
          {...zeroAsEmpty(c.deltaUTb, (deltaUTb) => update({ deltaUTb }))}
          nullable
        />
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {de(res.uCorrected)}
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {res.phiTKW}
      </TableCell>
      <TableCell>
        <div className="flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-6"
                onClick={() => onAddOpening(componentIndex)}
              >
                <SquarePlus />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Öffnung (Fenster/Tür) hinzufügen</TooltipContent>
          </Tooltip>
          <Button
            size="icon"
            variant="ghost"
            className="size-6 text-destructive"
            aria-label="Bauteil löschen"
            onClick={() => store.removeComponent(path, componentIndex)}
          >
            <Trash2 />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function OpeningRow({ row, path }: { row: GridRow; path: RoomPath }) {
  const store = useProjectStore()
  const { res, componentIndex, openingIndex } = row
  const c = res.component
  const update = (patch: Partial<BuildingComponent>) =>
    store.updateOpening(path, componentIndex, openingIndex!, patch)

  return (
    <TableRow className={cn(componentIndex < 0 && "text-muted-foreground")}>
      <TableCell className="pl-5 text-muted-foreground">
        ↳ {res.effectiveOrientation}
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground">
          {c.componentType}
          {c.label ? ` (${c.label})` : ""}
        </span>
      </TableCell>
      <TableCell className="text-right">–</TableCell>
      <TableCell className="text-right">–</TableCell>
      <TableCell>
        <NumberField
          className="h-7 w-16"
          aria-label="Fläche der Öffnung"
          value={c.bruttoM2}
          onCommit={(v) => update({ bruttoM2: v ?? 0 })}
        />
      </TableCell>
      <TableCell className="text-right">–</TableCell>
      <TableCell className="text-right tabular-nums">{de(res.aKM2)}</TableCell>
      <TableCell>{c.adjacent}</TableCell>
      <TableCell>
        <NumberField
          className="h-7 w-16"
          aria-label="Angrenzende Temperatur"
          value={c.thetaAdjacentC}
          onCommit={(v) => update({ thetaAdjacentC: v ?? 0 })}
        />
      </TableCell>
      <TableCell>
        <NumberField
          className="h-7 w-16"
          aria-label="f_ix"
          value={c.fIx}
          onCommit={(fIx) => update({ fIx })}
          nullable
          placeholder={`auto ${de(res.fIx, 2)}`}
        />
      </TableCell>
      <TableCell>
        <NumberField
          className="h-7 w-16"
          aria-label="U-Wert"
          value={c.uValue}
          onCommit={(v) => update({ uValue: v ?? 0 })}
        />
      </TableCell>
      <TableCell>
        <NumberField
          className="h-7 w-14"
          aria-label="Wärmebrückenzuschlag"
          {...zeroAsEmpty(c.deltaUTb, (deltaUTb) => update({ deltaUTb }))}
          nullable
        />
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {de(res.uCorrected)}
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {res.phiTKW}
      </TableCell>
      <TableCell>
        <Button
          size="icon"
          variant="ghost"
          className="size-6 text-destructive"
          aria-label="Öffnung löschen"
          onClick={() =>
            store.removeOpening(path, componentIndex, openingIndex!)
          }
        >
          <Trash2 />
        </Button>
      </TableCell>
    </TableRow>
  )
}
