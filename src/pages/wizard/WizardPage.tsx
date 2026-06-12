/**
 * Geführter Assistent: 6 Schritte mit Fortschrittsanzeige. Die Rohantworten
 * liegen im Store (wizard), das Projektmodell entsteht erst im Ergebnis-
 * Schritt — Zurück-Navigation behält daher alle einfachen Eingaben.
 */
import { ArrowLeft, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useProjectStore } from "@/store/projectStore"

import { BauteileStep } from "./steps/BauteileStep"
import { ErgebnisStep } from "./steps/ErgebnisStep"
import { GebaeudeStep } from "./steps/GebaeudeStep"
import { GeschosseStep } from "./steps/GeschosseStep"
import { RaeumeStep } from "./steps/RaeumeStep"
import { StandortStep } from "./steps/StandortStep"

const STEPS = [
  { title: "Gebäude", component: GebaeudeStep },
  { title: "Standort", component: StandortStep },
  { title: "Geschosse", component: GeschosseStep },
  { title: "Räume", component: RaeumeStep },
  { title: "Bauteile prüfen", component: BauteileStep },
  { title: "Ergebnis", component: ErgebnisStep },
]

export function WizardPage() {
  const step = useProjectStore((s) => s.wizard.step)
  const setWizard = useProjectStore((s) => s.setWizard)
  const roomCount = useProjectStore((s) => s.wizard.rooms.length)

  const current = Math.min(step, STEPS.length - 1)
  const StepComponent = STEPS[current].component
  // Ohne Räume ist das Ergebnis sinnlos — Weiter erst ab einem Raum
  const nextDisabled = current === 3 && roomCount === 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <ol className="mb-8 flex flex-wrap items-center gap-1.5">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => i < current && setWizard({ step: i })}
              disabled={i > current}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                i === current
                  ? "bg-primary text-primary-foreground"
                  : i < current
                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                    : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded-full text-[10px]",
                  i === current
                    ? "bg-primary-foreground/20"
                    : "bg-muted-foreground/20",
                )}
              >
                {i + 1}
              </span>
              {s.title}
            </button>
            {i < STEPS.length - 1 && (
              <span className="text-muted-foreground/40">›</span>
            )}
          </li>
        ))}
      </ol>

      <h1 className="mb-4 text-xl font-bold">{STEPS[current].title}</h1>

      <StepComponent />

      <div className="mt-8 flex justify-between border-t pt-4">
        <Button
          variant="outline"
          disabled={current === 0}
          onClick={() => setWizard({ step: current - 1 })}
        >
          <ArrowLeft /> Zurück
        </Button>
        {current < STEPS.length - 1 && (
          <Button
            disabled={nextDisabled}
            onClick={() => setWizard({ step: current + 1 })}
          >
            Weiter <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  )
}
