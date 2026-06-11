/**
 * Vollständige Raum-Bearbeitung: Kopffelder mit Auto-Defaults
 * (Raumart → θ_i, n_min), abgeleitete Größen, Bauteil-Tabelle und
 * Live-Ergebnis.
 */
import { Trash2 } from "lucide-react"

import { NumberField } from "@/components/inputs/NumberField"
import { RoomResultCard } from "@/components/results/RoomResultCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { computeRoomHeatingLoad } from "@/engine/calc"
import {
  aFloorM2,
  effectiveCeilingThicknessM,
  effectiveNMinH1,
  effectiveStoreyHeightM,
  effectiveThetaIC,
  hIM,
  qVMinM3h,
  storeyForRoom,
  vIM3,
} from "@/engine/derive"
import { defaultNMinForRoomType, defaultThetaIForRoomType } from "@/engine/defaults"
import type { Room, RoomType } from "@/engine/types"
import { ROOM_TYPES } from "@/engine/types"
import { de } from "@/lib/format"
import { useProjectStore, type RoomPath } from "@/store/projectStore"

import { ComponentGrid } from "./ComponentGrid"

const NONE = "__none__"

export function RoomEditor({ path }: { path: RoomPath }) {
  const store = useProjectStore()
  const project = store.project
  const params = store.params
  const room = project.usageUnits[path.unitIndex]?.rooms[path.roomIndex]
  if (!room) return null

  const storey = storeyForRoom(room, project)
  const result = computeRoomHeatingLoad(room, params, storey)
  const update = (patch: Partial<Room>) => store.updateRoom(path, patch)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            {room.id} — {room.name}
          </h2>
          <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
            <Badge variant="outline">A = {de(aFloorM2(room))} m²</Badge>
            <Badge variant="outline">h_i = {de(hIM(room, storey))} m</Badge>
            <Badge variant="outline">V = {de(vIM3(room, storey))} m³</Badge>
            <Badge variant="outline">
              q_V,min = {de(qVMinM3h(room, storey), 1)} m³/h
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => store.removeRoom(path)}
        >
          <Trash2 /> Raum löschen
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 lg:grid-cols-6">
        <Field label="Raum-Nr.">
          <Input
            className="h-8"
            value={room.id}
            onChange={(e) => update({ id: e.target.value })}
          />
        </Field>
        <Field label="Bezeichnung">
          <Input
            className="h-8"
            value={room.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </Field>
        <Field label="Geschoss">
          <Select
            value={room.storeyId ?? NONE}
            onValueChange={(v) =>
              v === NONE
                ? update({ storeyId: null })
                : update({ storeyId: v, floor: v })
            }
          >
            <SelectTrigger size="sm" className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(project.storeys).map((id) => (
                <SelectItem key={id} value={id}>
                  {id}
                </SelectItem>
              ))}
              <SelectItem value={NONE}>(kein Geschoss)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field
          label="Raumart"
          hint={
            room.roomType
              ? `Vorgaben: θᵢ ${de(defaultThetaIForRoomType(room.roomType), 1)} °C, n_min ${de(defaultNMinForRoomType(room.roomType), 1)} 1/h`
              : undefined
          }
        >
          <Select
            value={room.roomType ?? NONE}
            onValueChange={(v) =>
              update({ roomType: v === NONE ? null : (v as RoomType) })
            }
          >
            <SelectTrigger size="sm" className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROOM_TYPES.map((rt) => (
                <SelectItem key={rt} value={rt}>
                  {rt}
                </SelectItem>
              ))}
              <SelectItem value={NONE}>(keine)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Breite (m)">
          <NumberField
            value={room.roomWidthM}
            onCommit={(v) => update({ roomWidthM: v ?? 0 })}
          />
        </Field>
        <Field label="Länge (m)">
          <NumberField
            value={room.roomLengthM}
            onCommit={(v) => update({ roomLengthM: v ?? 0 })}
          />
        </Field>
        <Field label="Geschosshöhe (m)">
          <NumberField
            value={room.storeyHeightM}
            onCommit={(v) => update({ storeyHeightM: v })}
            nullable
            placeholder={`auto ${de(effectiveStoreyHeightM(room, storey))}`}
          />
        </Field>
        <Field label="Deckendicke (m)">
          <NumberField
            value={room.ceilingThicknessM}
            onCommit={(v) => update({ ceilingThicknessM: v })}
            nullable
            placeholder={`auto ${de(effectiveCeilingThicknessM(room, storey))}`}
          />
        </Field>
        <Field label="θᵢ (°C)">
          <NumberField
            value={room.thetaIC}
            onCommit={(v) => update({ thetaIC: v })}
            nullable
            placeholder={`auto ${de(effectiveThetaIC(room), 1)}`}
          />
        </Field>
        <Field label="Δθ Komfort (K)">
          <NumberField
            value={room.deltaThetaComfortK === 0 ? null : room.deltaThetaComfortK}
            onCommit={(v) => update({ deltaThetaComfortK: v ?? 0 })}
            nullable
            placeholder="0"
          />
        </Field>
        <Field label="n_min (1/h)">
          <NumberField
            value={room.nMinH1}
            onCommit={(v) => update({ nMinH1: v })}
            nullable
            placeholder={`auto ${de(effectiveNMinH1(room), 1)}`}
          />
        </Field>
        <Field label="q_V (m³/h)" hint="Überschreibt q_V,min = n_min · V">
          <NumberField
            value={room.qVEnvMinM3h}
            onCommit={(v) => update({ qVEnvMinM3h: v })}
            nullable
            placeholder={`auto ${de(qVMinM3h(room, storey), 1)}`}
          />
        </Field>
        <Field
          label="Aufheizzuschlag (W)"
          hint="Bei unterbrochenem Heizbetrieb (DIN EN 12831-1)"
        >
          <NumberField
            value={room.heatingUpAllowanceW}
            onCommit={(v) => update({ heatingUpAllowanceW: v })}
            nullable
            placeholder="0"
          />
        </Field>
      </div>

      <ComponentGrid
        room={room}
        storey={storey}
        path={path}
        thetaEC={params.thetaEC}
      />

      <RoomResultCard result={result} />
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground" title={hint}>
        {label}
      </Label>
      {children}
      {hint && (
        <p className="text-[10px] leading-tight text-muted-foreground/70">
          {hint}
        </p>
      )}
    </div>
  )
}
