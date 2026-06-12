/**
 * Schritt 2: Standort — Norm-Außentemperatur per PLZ/Ort, manuell überschreibbar.
 */
import { NumberField } from "@/components/inputs/NumberField"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { de } from "@/lib/format"
import { lookupThetaE } from "@/lib/theta-e"
import { useProjectStore } from "@/store/projectStore"

export function StandortStep() {
  const wizard = useProjectStore((s) => s.wizard)
  const setWizard = useProjectStore((s) => s.setWizard)

  const match = lookupThetaE(wizard.plzOrCity)

  const onLocationChange = (value: string) => {
    const m = lookupThetaE(value)
    if (m && !wizard.thetaEManual) {
      setWizard({ plzOrCity: value, thetaEC: m.thetaE })
    } else {
      setWizard({ plzOrCity: value })
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Die <strong>Norm-Außentemperatur θ<sub>e</sub></strong> ist die tiefste
        Außentemperatur, für die die Heizung ausgelegt wird (kältestes
        2-Tage-Mittel, das 10-mal in 20 Jahren erreicht wird). Sie hängt vom
        Standort ab: an der Küste mild (−10 °C), im Alpenvorland streng
        (−16 °C und kälter).
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>PLZ oder Ort</Label>
          <Input
            value={wizard.plzOrCity}
            placeholder="z.B. 80331 oder München"
            onChange={(e) => onLocationChange(e.target.value)}
          />
          {match ? (
            <p className="text-xs text-muted-foreground">
              PLZ-Region {match.plzPrefix} ({match.referenzort}):{" "}
              <strong>{de(match.thetaE, 1)} °C</strong>
            </p>
          ) : (
            wizard.plzOrCity.trim() !== "" && (
              <p className="text-xs text-muted-foreground">
                Kein Referenzort gefunden — θ<sub>e</sub> bitte manuell setzen.
              </p>
            )
          )}
        </div>
        <div className="space-y-1.5">
          <Label>
            Norm-Außentemperatur θ<sub>e</sub> (°C)
          </Label>
          <NumberField
            value={wizard.thetaEC}
            onCommit={(v) =>
              setWizard({ thetaEC: v ?? -10.3, thetaEManual: true })
            }
          />
          <p className="text-xs text-muted-foreground">
            Manuell anpassbar — z.B. mit dem ortsgenauen Wert aus
            DIN/TS 12831-1. Die Tabellenwerte hier sind die klassischen
            2-K-Klimazonen.
          </p>
        </div>
      </div>
    </div>
  )
}
