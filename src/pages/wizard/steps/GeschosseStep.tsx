/**
 * Schritt 3: Geschosse — welche Ebenen werden beheizt? Die Grenzen ZWISCHEN
 * zwei angelegten Geschossen sind automatisch „beheizt" (Decke des einen =
 * Fußboden des anderen); gefragt wird nur, was unter dem untersten und über
 * dem obersten Geschoss liegt.
 */
import { Plus, Trash2 } from "lucide-react"

import { NumberField } from "@/components/inputs/NumberField"
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
import { useProjectStore } from "@/store/projectStore"

import { meanHeight, normalizeStack } from "../stack"
import type {
  AboveSituation,
  BelowSituation,
  WizardStoreyInput,
} from "../types"

const BELOW_OPTIONS: { id: BelowSituation; label: string }[] = [
  { id: "keller-unbeheizt", label: "Unbeheizter Keller" },
  { id: "erdreich", label: "Erdreich / Bodenplatte" },
  { id: "aussenluft", label: "Außenluft (z.B. Durchfahrt)" },
]

const ABOVE_OPTIONS: { id: AboveSituation; label: string }[] = [
  { id: "dach-unbeheizt", label: "Unbeheizter Dachboden" },
  { id: "flachdach", label: "Flachdach / Außenluft" },
  { id: "dachschraegen", label: "Dachschrägen (im Raum erfasst)" },
]

const STOREY_TEMPLATES: WizardStoreyInput[] = [
  { id: "KG", label: "Keller (beheizt)", heightM: 2.3, below: "erdreich", above: "beheizt" },
  { id: "EG", label: "Erdgeschoss", heightM: 2.6, below: "keller-unbeheizt", above: "beheizt" },
  { id: "OG1", label: "1. Obergeschoss", heightM: 2.6, below: "beheizt", above: "beheizt" },
  { id: "OG2", label: "2. Obergeschoss", heightM: 2.6, below: "beheizt", above: "beheizt" },
  {
    id: "DG",
    label: "Dachgeschoss",
    heightM: 2.2,
    below: "beheizt",
    above: "dachschraegen",
    kniestockM: 1.0,
    firstM: 3.4,
  },
]

export function GeschosseStep() {
  const wizard = useProjectStore((s) => s.wizard)
  const setWizard = useProjectStore((s) => s.setWizard)

  const update = (index: number, patch: Partial<WizardStoreyInput>) => {
    const storeys = wizard.storeys.map((st, i) =>
      i === index ? { ...st, ...patch } : st,
    )
    setWizard({ storeys: normalizeStack(storeys) })
  }

  const remove = (index: number) => {
    const removed = wizard.storeys[index]
    setWizard({
      storeys: normalizeStack(wizard.storeys.filter((_, i) => i !== index)),
      rooms: wizard.rooms.filter((r) => r.storeyId !== removed.id),
    })
  }

  const addFromTemplate = (template: WizardStoreyInput) => {
    setWizard({ storeys: normalizeStack([...wizard.storeys, { ...template }]) })
  }

  const availableTemplates = STOREY_TEMPLATES.filter(
    (t) => !wizard.storeys.some((st) => st.id === t.id),
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Nur <strong>beheizte</strong> Geschosse anlegen. Zwischen zwei
        angelegten Geschossen entstehen keine Verluste (die Decke des einen
        ist der Fußboden des anderen — beide beheizt); gefragt wird nur, was{" "}
        <strong>unter dem untersten</strong> und{" "}
        <strong>über dem obersten</strong> Geschoss liegt.
      </p>

      {wizard.storeys.map((st, i) => {
        const isBottom = i === 0
        const isTop = i === wizard.storeys.length - 1
        const neighborBelow = isBottom ? null : wizard.storeys[i - 1]
        const neighborAbove = isTop ? null : wizard.storeys[i + 1]
        return (
          <div key={st.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded bg-secondary px-2 py-0.5 text-sm font-bold">
                  {st.id}
                </span>
                <Input
                  className="h-8 w-48"
                  value={st.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-destructive"
                aria-label={`${st.label} entfernen`}
                onClick={() => remove(i)}
              >
                <Trash2 />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {st.above !== "dachschraegen" && (
                <div className="space-y-1">
                  <Label
                    className="text-xs text-muted-foreground"
                    title="Innen gemessen, Boden bis Decke. Für Wandflächen wird automatisch die Geschosshöhe (+ 0,20 m Deckendicke) angesetzt."
                  >
                    Lichte Raumhöhe (m)
                  </Label>
                  <NumberField
                    value={st.heightM}
                    onCommit={(v) => update(i, { heightM: v ?? 2.6 })}
                  />
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Was liegt darunter?
                </Label>
                {isBottom ? (
                  <Select
                    value={st.below}
                    onValueChange={(v) =>
                      update(i, { below: v as BelowSituation })
                    }
                  >
                    <SelectTrigger size="sm" className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BELOW_OPTIONS.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex h-9 items-center text-sm text-muted-foreground">
                    {neighborBelow!.id} (beheizt) — keine Verluste
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Was liegt darüber?
                </Label>
                {isTop ? (
                  <Select
                    value={st.above}
                    onValueChange={(v) => {
                      const above = v as AboveSituation
                      if (above === "dachschraegen") {
                        const k = st.kniestockM ?? 1.0
                        const f = st.firstM ?? 3.4
                        update(i, {
                          above,
                          kniestockM: k,
                          firstM: f,
                          heightM: meanHeight(k, f) ?? st.heightM,
                        })
                      } else {
                        update(i, { above, kniestockM: null, firstM: null })
                      }
                    }}
                  >
                    <SelectTrigger size="sm" className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ABOVE_OPTIONS.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex h-9 items-center text-sm text-muted-foreground">
                    {neighborAbove!.id} (beheizt) — keine Verluste
                  </div>
                )}
              </div>
            </div>
            {st.above === "dachschraegen" && (
              <div className="space-y-2 rounded-md bg-muted/40 p-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Kniestockhöhe (m)
                    </Label>
                    <NumberField
                      value={st.kniestockM ?? null}
                      onCommit={(v) => {
                        const k = v ?? 1.0
                        update(i, {
                          kniestockM: k,
                          heightM:
                            meanHeight(k, st.firstM ?? null) ?? st.heightM,
                        })
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Firsthöhe (m)
                    </Label>
                    <NumberField
                      value={st.firstM ?? null}
                      onCommit={(v) => {
                        const f = v ?? 3.4
                        update(i, {
                          firstM: f,
                          heightM:
                            meanHeight(st.kniestockM ?? null, f) ?? st.heightM,
                        })
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Mittlere Raumhöhe
                    </Label>
                    <div className="flex h-9 items-center text-sm font-medium tabular-nums">
                      {st.heightM.toLocaleString("de-DE", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      m
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Beide innen gemessen: Kniestock = Boden bis Beginn der
                  Schräge, First = Boden bis zum höchsten Punkt. Volumen und
                  Wandflächen werden mit der mittleren Höhe gerechnet —{" "}
                  <strong>Giebelwände</strong> (Trapezform) einfach mit ihrer
                  Länge erfassen, die Trapezfläche ergibt sich automatisch.
                </p>
              </div>
            )}
          </div>
        )
      })}

      {availableTemplates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTemplates.map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant="outline"
              onClick={() => addFromTemplate(t)}
            >
              <Plus /> {t.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
