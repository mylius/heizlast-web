/**
 * Schritt 4: Räume je Geschoss — Grundmaße, Außenwände mit Fensterflächen,
 * optional Dachschräge, Haustür und Haustrennwand (DHH).
 */
import { Plus, Trash2 } from "lucide-react"

import { NumberField } from "@/components/inputs/NumberField"
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
import { Switch } from "@/components/ui/switch"
import { defaultThetaIForRoomType } from "@/engine/defaults"
import type { Orientation, RoomType } from "@/engine/types"
import { ROOM_TYPES } from "@/engine/types"
import { de } from "@/lib/format"
import { useProjectStore } from "@/store/projectStore"

import type { WizardRoomInput, WizardWallInput } from "../types"

const WALL_ORIENTATIONS: Orientation[] = ["N", "O", "S", "W"]

const ROOM_TEMPLATES: { name: string; roomType: RoomType }[] = [
  { name: "Wohnzimmer", roomType: "Wohnraum" },
  { name: "Küche", roomType: "Küche" },
  { name: "Schlafzimmer", roomType: "Schlafen" },
  { name: "Kinderzimmer", roomType: "Wohnraum" },
  { name: "Bad", roomType: "Bad" },
  { name: "WC", roomType: "WC" },
  { name: "Flur", roomType: "Flur" },
  { name: "Abstellraum", roomType: "Abstellraum" },
]

let roomKeyCounter = 0
const nextRoomKey = () => `room-${Date.now()}-${roomKeyCounter++}`

export function RaeumeStep() {
  const wizard = useProjectStore((s) => s.wizard)
  const setWizard = useProjectStore((s) => s.setWizard)

  const addRoom = (storeyId: string, template?: (typeof ROOM_TEMPLATES)[0]) => {
    const room: WizardRoomInput = {
      key: nextRoomKey(),
      storeyId,
      name: template?.name ?? "Raum",
      roomType: template?.roomType ?? "Wohnraum",
      widthM: 4,
      lengthM: 4,
      walls: [{ orientation: "S", lengthM: 4, windowAreaM2: 1.5 }],
      roofWidthM: 0,
      roofLengthM: 0,
      roofWindowAreaM2: 0,
      hasEntranceDoor: false,
      partyWallLengthM: 0,
    }
    setWizard({ rooms: [...wizard.rooms, room] })
  }

  const updateRoom = (key: string, patch: Partial<WizardRoomInput>) => {
    setWizard({
      rooms: wizard.rooms.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    })
  }

  const removeRoom = (key: string) => {
    setWizard({ rooms: wizard.rooms.filter((r) => r.key !== key) })
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Für jeden beheizten Raum: Grundmaße und die <strong>Außenwände</strong>{" "}
        mit ihren Fensterflächen. Innenwände zu beheizten Räumen können
        weggelassen werden (keine Verluste). Als Anhaltspunkt: ein normales
        Fenster hat ≈ 1,5 m², eine Balkontür ≈ 2 m².
      </p>

      {wizard.storeys.map((storey) => {
        const rooms = wizard.rooms.filter((r) => r.storeyId === storey.id)
        return (
          <section key={storey.id} className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <span className="rounded bg-secondary px-2 py-0.5 text-sm">
                {storey.id}
              </span>
              {storey.label}
              <span className="text-xs font-normal text-muted-foreground">
                {rooms.length} {rooms.length === 1 ? "Raum" : "Räume"}
              </span>
            </h3>
            {storey.above === "dachschraegen" && (
              <p className="text-xs text-muted-foreground">
                Dachgeschoss: <strong>Giebelwände</strong> einfach als
                Außenwand mit ihrer Länge erfassen — durch die mittlere
                Raumhöhe (aus Kniestock/First in Schritt 3) wird die
                Trapezfläche automatisch richtig angesetzt. Die{" "}
                <strong>Dachschrägen</strong> mit Breite (entlang der Traufe)
                und schräg gemessener Schrägenlänge angeben.
              </p>
            )}
            {rooms.map((room) => (
              <RoomCard
                key={room.key}
                room={room}
                isDhh={wizard.buildingKind === "dhh"}
                isDachgeschoss={storey.above === "dachschraegen"}
                onUpdate={(patch) => updateRoom(room.key, patch)}
                onRemove={() => removeRoom(room.key)}
              />
            ))}
            <div className="flex flex-wrap gap-1.5">
              {ROOM_TEMPLATES.map((t) => (
                <Button
                  key={t.name}
                  size="sm"
                  variant="outline"
                  onClick={() => addRoom(storey.id, t)}
                >
                  <Plus /> {t.name}
                </Button>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function RoomCard({
  room,
  isDhh,
  isDachgeschoss,
  onUpdate,
  onRemove,
}: {
  room: WizardRoomInput
  isDhh: boolean
  isDachgeschoss: boolean
  onUpdate: (patch: Partial<WizardRoomInput>) => void
  onRemove: () => void
}) {
  const updateWall = (index: number, patch: Partial<WizardWallInput>) => {
    onUpdate({
      walls: room.walls.map((w, i) => (i === index ? { ...w, ...patch } : w)),
    })
  }

  const hasRoof = room.roofWidthM > 0 || room.roofLengthM > 0

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Bezeichnung</Label>
          <Input
            className="h-8 w-40"
            value={room.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Raumart</Label>
          <Select
            value={room.roomType}
            onValueChange={(v) => onUpdate({ roomType: v as RoomType })}
          >
            <SelectTrigger size="sm" className="h-8 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROOM_TYPES.map((rt) => (
                <SelectItem key={rt} value={rt}>
                  {rt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Breite (m)</Label>
          <NumberField
            className="w-20"
            value={room.widthM}
            onCommit={(v) => onUpdate({ widthM: v ?? 0 })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Länge (m)</Label>
          <NumberField
            className="w-20"
            value={room.lengthM}
            onCommit={(v) => onUpdate({ lengthM: v ?? 0 })}
          />
        </div>
        <Badge variant="outline" className="mb-1.5">
          θᵢ {de(defaultThetaIForRoomType(room.roomType), 0)} °C
        </Badge>
        <Button
          size="icon"
          variant="ghost"
          className="mb-0.5 ml-auto size-7 text-destructive"
          aria-label="Raum entfernen"
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Außenwände (Wandlänge und Fensterfläche je Himmelsrichtung)
        </Label>
        {room.walls.map((wall, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
            <Select
              value={wall.orientation}
              onValueChange={(v) =>
                updateWall(i, { orientation: v as Orientation })
              }
            >
              <SelectTrigger size="sm" className="h-8 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WALL_ORIENTATIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">Länge</span>
            <NumberField
              className="w-20"
              value={wall.lengthM}
              onCommit={(v) => updateWall(i, { lengthM: v ?? 0 })}
            />
            <span className="text-xs text-muted-foreground">m · Fenster</span>
            <NumberField
              className="w-20"
              value={wall.windowAreaM2 === 0 ? null : wall.windowAreaM2}
              onCommit={(v) => updateWall(i, { windowAreaM2: v ?? 0 })}
              nullable
              placeholder="0"
            />
            <span className="text-xs text-muted-foreground">m²</span>
            <Button
              size="icon"
              variant="ghost"
              className="size-6 text-destructive"
              aria-label="Wand entfernen"
              onClick={() =>
                onUpdate({ walls: room.walls.filter((_, j) => j !== i) })
              }
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        {room.walls.length < 4 && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() =>
              onUpdate({
                walls: [
                  ...room.walls,
                  { orientation: "N", lengthM: room.widthM, windowAreaM2: 0 },
                ],
              })
            }
          >
            <Plus /> Außenwand
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {isDachgeschoss && (
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={hasRoof}
              onCheckedChange={(on) =>
                onUpdate(
                  on
                    ? {
                        roofWidthM: room.lengthM,
                        roofLengthM: 3,
                        roofWindowAreaM2: 0,
                      }
                    : { roofWidthM: 0, roofLengthM: 0, roofWindowAreaM2: 0 },
                )
              }
            />
            Dachschräge
          </label>
        )}
        {hasRoof && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span
              className="text-xs text-muted-foreground underline decoration-dotted"
              title="Horizontale Länge der Dachfläche entlang der Traufe/des Firsts — meist die Raumlänge. NICHT die Höhe."
            >
              Breite (entlang Traufe)
            </span>
            <NumberField
              className="w-20"
              value={room.roofWidthM}
              onCommit={(v) => onUpdate({ roofWidthM: v ?? 0 })}
            />
            <span
              className="text-xs text-muted-foreground underline decoration-dotted"
              title="Schräg gemessene Länge der Dachfläche vom Kniestock bis zum First (Zollstock an der Schräge entlang)."
            >
              m · Schrägenlänge
            </span>
            <NumberField
              className="w-20"
              value={room.roofLengthM}
              onCommit={(v) => onUpdate({ roofLengthM: v ?? 0 })}
            />
            <span className="text-xs text-muted-foreground">
              m · Dachfenster
            </span>
            <NumberField
              className="w-20"
              value={room.roofWindowAreaM2 === 0 ? null : room.roofWindowAreaM2}
              onCommit={(v) => onUpdate({ roofWindowAreaM2: v ?? 0 })}
              nullable
              placeholder="0"
            />
            <span className="text-xs text-muted-foreground">m²</span>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={room.hasEntranceDoor}
            onCheckedChange={(hasEntranceDoor) => onUpdate({ hasEntranceDoor })}
          />
          Haustür in diesem Raum
        </label>
        {isDhh && (
          <div className="flex items-center gap-2 text-sm">
            <Switch
              checked={room.partyWallLengthM > 0}
              onCheckedChange={(on) =>
                onUpdate({ partyWallLengthM: on ? room.lengthM : 0 })
              }
            />
            Haustrennwand zum Nachbarn
            {room.partyWallLengthM > 0 && (
              <>
                <NumberField
                  className="w-20"
                  value={room.partyWallLengthM}
                  onCommit={(v) => onUpdate({ partyWallLengthM: v ?? 0 })}
                />
                <span className="text-xs text-muted-foreground">m</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
