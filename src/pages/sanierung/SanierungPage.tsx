/**
 * Individueller Sanierungsfahrplan (iSFP-orientiert).
 *
 * WICHTIG: orientierende Schätzung, kein zertifizierter iSFP-Nachweis.
 * Nutzt die Heizlastdaten des Projekts und eine vereinfachte Jahresbilanz
 * (siehe engine/energy.ts) sowie den Maßnahmenkatalog (engine/measures.ts).
 */
import { LineChart, Printer, Plus, Sparkles, Trash2, Wand2 } from "lucide-react"

import { CashflowChart } from "./CashflowChart"
import { NumberField } from "@/components/inputs/NumberField"
import { LoadBars } from "@/components/results/LoadBars"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  ENERGY_CARRIER_LABELS,
  type EnergyResult,
} from "@/engine/energy"
import {
  MEASURE_PRESETS,
  SOWIESO_REMAINING_YEARS,
  type MeasureStepResult,
  type ScenarioResult,
} from "@/engine/measures"
import type { MeasureEconomics, SkippedMeasure } from "@/engine/recommend"
import {
  ENERGY_CARRIERS,
  type EnergyCarrier,
  type SanierungsTempo,
  type SanierungsZiel,
} from "@/engine/types"
import { de, deEur, deKgA, deKw, deKwhA } from "@/lib/format"
import { useProjectStore } from "@/store/projectStore"
import {
  useMeasureEconomics,
  useRecommendationReport,
  useScenarioResult,
} from "@/store/selectors"

const ZIEL_LABELS: Record<SanierungsZiel, string> = {
  kosten: "Niedrigste Kosten (Wirtschaftlichkeit)",
  co2: "Maximale CO₂-Einsparung",
  komfort: "Wohnkomfort",
}

/** Begründung in der „nicht empfohlen"-Liste, inkl. Zahlen bei Unwirtschaftlichkeit. */
function skipReasonText(s: SkippedMeasure): string {
  if (
    s.reason === "unwirtschaftlich" &&
    s.paybackYears !== undefined &&
    s.lifespanYears !== undefined
  ) {
    const pay = Number.isFinite(s.paybackYears)
      ? `${Math.round(s.paybackYears)} J`
      : "nie"
    return `unwirtschaftlich (Amortisation ${pay} > Lebensdauer ${s.lifespanYears} J) — nur als Sowieso-Maßnahme sinnvoll`
  }
  return s.reason
}

/** Amortisation + Bewertung einer gewählten Maßnahme für die Liste. */
function economicsBadge(e: MeasureEconomics): { text: string; cls: string } {
  const pay = Number.isFinite(e.paybackYears)
    ? `${Math.round(e.paybackYears)} J`
    : "—"
  if (e.economics === "wirtschaftlich")
    return { text: `Amort. ${pay}`, cls: "text-emerald-600" }
  if (e.economics === "grenzwertig")
    return { text: `Amort. ${pay} · grenzwertig`, cls: "text-amber-600" }
  return { text: `Amort. ${pay} · unwirtschaftlich`, cls: "text-destructive" }
}

/** Statische Amortisation: Eigenanteil / jährliche Energiekosten-Ersparnis. */
function paybackLabel(scenario: ScenarioResult): string {
  const eigenanteil = scenario.totalCostEur - scenario.totalFundingEur
  const saving = scenario.energieKostenSavedEur
  if (saving <= 0 || eigenanteil <= 0) return "—"
  return `${de(eigenanteil / saving, 0)} Jahre`
}

/** Kurzzusammenfassung einer Maßnahmen-Stufe je nach Art. */
function measureSummary(step: MeasureStepResult): string {
  const cost = `${deEur(step.costEur)} (Förderung ${deEur(step.fundingEur)})`
  if (step.preset.kind === "heating") {
    return `Erzeugerwechsel · −${deKgA(step.co2SavedKg)} CO₂ · ${cost}`
  }
  return `${de(step.affectedM2, 0)} m² · −${deKw(step.phiHlSavedW)} · ${cost}`
}

function Kpi({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  )
}

function EnergyKpis({ energy }: { energy: EnergyResult }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      <Kpi label="Heizwärme" value={deKwhA(energy.qHeatKwh)} />
      <Kpi label="Endenergie" value={deKwhA(energy.endenergieKwh)} />
      <Kpi
        label="Energiekosten"
        value={`${deEur(energy.energieKostenEur)}/a`}
      />
      <Kpi
        label="Primärenergie"
        value={deKwhA(energy.primaerenergieKwh)}
        sub={`${de(energy.primaerSpecificKwhM2a, 0)} kWh/(m²·a)`}
      />
      <Kpi label="CO₂" value={deKgA(energy.co2Kg)} />
      <Kpi label="Effizienzhaus" value={energy.effizienzhaus} />
    </div>
  )
}

function EnergyParamsEditor() {
  const energyParams = useProjectStore((s) => s.energyParams)
  const setEnergyParams = useProjectStore((s) => s.setEnergyParams)
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1">
        <Label className="text-xs">Energieträger</Label>
        <Select
          value={energyParams.carrier}
          onValueChange={(v) => setEnergyParams({ carrier: v as EnergyCarrier })}
        >
          <SelectTrigger size="sm" className="h-8 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ENERGY_CARRIERS.map((c) => (
              <SelectItem key={c} value={c}>
                {ENERGY_CARRIER_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Anlagennutzungsgrad / JAZ</Label>
        <NumberField
          value={energyParams.systemEfficiency}
          onCommit={(v) =>
            v !== null && setEnergyParams({ systemEfficiency: v })
          }
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Gradtagzahl G_t [Kd/a]</Label>
        <NumberField
          value={energyParams.gradtagzahlKd}
          onCommit={(v) => v !== null && setEnergyParams({ gradtagzahlKd: v })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Energiepreis [ct/kWh]</Label>
        <NumberField
          value={energyParams.energyPriceCtKwh}
          onCommit={(v) =>
            v !== null && setEnergyParams({ energyPriceCtKwh: v })
          }
        />
      </div>
    </div>
  )
}

function RecommendationCard() {
  const input = useProjectStore((s) => s.recommendationInput)
  const setInput = useProjectStore((s) => s.setRecommendationInput)
  const applyRecommendation = useProjectStore((s) => s.applyRecommendation)
  const report = useRecommendationReport()
  // "Bereits gut" / "nicht vorhanden" beruht auf den vorhandenen U-Werten —
  // nutzerseitige Ausschlüsse blendet die Liste aus (sie stehen schon oben).
  const notApplicable = report.skipped.filter(
    (s) => s.reason !== "ausgeschlossen",
  )

  const toggleExcluded = (presetId: string, excluded: boolean) => {
    const set = new Set(input.excludedPresetIds)
    if (excluded) set.add(presetId)
    else set.delete(presetId)
    setInput({ excludedPresetIds: [...set] })
  }

  return (
    <Card className="border-primary/30 print:hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          Fahrplan automatisch vorschlagen
        </CardTitle>
        <CardDescription>
          Ein paar Fragen — daraus wird ein priorisierter Maßnahmenvorschlag
          erstellt, den Sie unten weiter anpassen können.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs">Sanierungsziel</Label>
            <Select
              value={input.ziel}
              onValueChange={(v) => setInput({ ziel: v as SanierungsZiel })}
            >
              <SelectTrigger size="sm" className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ZIEL_LABELS) as SanierungsZiel[]).map((z) => (
                  <SelectItem key={z} value={z}>
                    {ZIEL_LABELS[z]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tempo</Label>
            <Select
              value={input.tempo}
              onValueChange={(v) => setInput({ tempo: v as SanierungsTempo })}
            >
              <SelectTrigger size="sm" className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="schrittweise">
                  Schrittweise über Jahre
                </SelectItem>
                <SelectItem value="einmal">Alles auf einmal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Zeithorizont [Jahre]</Label>
            <NumberField
              value={input.horizonYears}
              onCommit={(v) => v !== null && setInput({ horizonYears: v })}
              disabled={input.tempo === "einmal"}
            />
          </div>
          <div className="flex items-end gap-2 pb-1">
            <Switch
              id="wp-geplant"
              checked={input.waermepumpeGeplant}
              onCheckedChange={(v) => setInput({ waermepumpeGeplant: v })}
            />
            <Label htmlFor="wp-geplant" className="text-xs leading-tight">
              Wärmepumpe geplant
              <span className="block text-muted-foreground">
                Hülle zuerst dämmen
              </span>
            </Label>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">
            Ausschließen (bereits erledigt oder nicht möglich)
          </Label>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {MEASURE_PRESETS.map((preset) => {
              const excluded = input.excludedPresetIds.includes(preset.id)
              return (
                <label
                  key={preset.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={excluded}
                    onCheckedChange={(v) =>
                      toggleExcluded(preset.id, v === true)
                    }
                  />
                  {preset.label}
                </label>
              )
            })}
          </div>
        </div>

        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <div className="font-medium">Empfohlen ({report.recommended.length})</div>
          {report.recommended.length > 0 ? (
            <ul className="mt-1 space-y-0.5 text-xs">
              {report.recommended.map((c) => (
                <li key={c.preset.id} className="text-muted-foreground">
                  <span className="text-foreground/80">{c.preset.label}</span> —{" "}
                  Amortisation{" "}
                  {Number.isFinite(c.paybackYears)
                    ? `${Math.round(c.paybackYears)} J`
                    : "—"}
                  {c.economics === "grenzwertig" && (
                    <span className="text-amber-600">
                      {" "}
                      · grenzwertig: nur als Sowieso-Maßnahme (Restlebensdauer
                      &lt; {SOWIESO_REMAINING_YEARS} J)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-muted-foreground">—</div>
          )}
          {notApplicable.length > 0 && (
            <>
              <div className="mt-2 font-medium">Nicht empfohlen</div>
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {notApplicable.map((s) => (
                  <li key={s.preset.id}>
                    <span className="text-foreground/70">{s.preset.label}</span>{" "}
                    — {skipReasonText(s)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <Button onClick={() => applyRecommendation()}>
          <Sparkles className="size-4" />
          Fahrplan vorschlagen
        </Button>
      </CardContent>
    </Card>
  )
}

export function SanierungPage() {
  const renovation = useProjectStore((s) => s.renovation)
  const addMeasure = useProjectStore((s) => s.addMeasure)
  const updateMeasure = useProjectStore((s) => s.updateMeasure)
  const removeMeasure = useProjectStore((s) => s.removeMeasure)
  const optimizeSchedule = useProjectStore((s) => s.optimizeSchedule)
  const horizonYears = useProjectStore((s) => s.recommendationInput.horizonYears)
  const scenario = useScenarioResult()
  const economics = useMeasureEconomics()

  const selectedPresetIds = new Set(renovation.measures.map((m) => m.presetId))

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 print:max-w-none print:py-0">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Sanierungsfahrplan
        </h1>
        <p className="text-sm text-muted-foreground">
          Maßnahmen-Pakete mit Wirkung auf Heizlast, Energiebedarf, CO₂ und
          Kosten — abgeleitet aus Ihrer Heizlastberechnung.
        </p>
      </div>

      <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
        <strong>Orientierende Schätzung, kein zertifizierter Nachweis.</strong>{" "}
        Jahresenergie, CO₂ und Effizienzhaus-Einordnung beruhen auf einem
        vereinfachten Gradtagzahl-Verfahren (nicht DIN&nbsp;V&nbsp;18599). Ein
        rechtskräftiger individueller Sanierungsfahrplan (iSFP) kann nur von
        zertifizierten Energieeffizienz-Expert:innen ausgestellt werden.
      </div>

      {/* Ist-Zustand */}
      <Card className="print:break-inside-avoid">
        <CardHeader>
          <CardTitle>Ist-Zustand</CardTitle>
          <CardDescription>
            Heizlast {deKw(scenario.baseResults.totalPhiHlW)} ·{" "}
            beheizte Fläche {de(scenario.baseEnergy.aHeatedM2, 0)} m²
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EnergyParamsEditor />
          <EnergyKpis energy={scenario.baseEnergy} />
        </CardContent>
      </Card>

      {/* Automatischer Vorschlag */}
      <RecommendationCard />

      {/* Maßnahmen */}
      <Card className="print:break-inside-avoid">
        <CardHeader>
          <CardTitle>Maßnahmen</CardTitle>
          <CardDescription>
            Automatisch vorgeschlagen oder manuell ergänzt — Ziel-U-Wert und
            Umsetzungsjahr lassen sich anpassen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 print:hidden">
            {MEASURE_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                size="sm"
                variant="outline"
                disabled={selectedPresetIds.has(preset.id)}
                onClick={() => addMeasure(preset.id)}
              >
                <Plus className="size-3.5" />
                {preset.label}
              </Button>
            ))}
          </div>

          {renovation.measures.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Maßnahmen gewählt.
            </p>
          ) : (
            <div className="space-y-2">
              {[...renovation.measures]
                .sort((a, b) => a.year - b.year)
                .map((m) => {
                  const step = scenario.steps.find(
                    (s) => s.selection.id === m.id,
                  )
                  const preset = MEASURE_PRESETS.find(
                    (p) => p.id === m.presetId,
                  )
                  if (!preset) return null
                  const econ = economics.get(m.id)
                  const badge = econ ? economicsBadge(econ) : null
                  return (
                    <div
                      key={m.id}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border p-3"
                    >
                      <Switch
                        checked={m.enabled}
                        onCheckedChange={(v) =>
                          updateMeasure(m.id, { enabled: v })
                        }
                        aria-label="Maßnahme aktiv"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">
                            {preset.label}
                          </span>
                          {badge && (
                            <span
                              className={`shrink-0 text-xs font-medium ${badge.cls}`}
                            >
                              {badge.text}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {step ? measureSummary(step) : "—"}
                        </div>
                        {econ &&
                          (econ.economics === "grenzwertig" ||
                            econ.economics === "unwirtschaftlich") && (
                            <div className="text-xs text-amber-600">
                              Amortisation über Lebensdauer ({econ.lifespanYears}{" "}
                              J) — lohnt sich nur als Sowieso-Maßnahme
                              (Restlebensdauer &lt; {SOWIESO_REMAINING_YEARS} J).
                            </div>
                          )}
                      </div>
                      <div className="flex items-center gap-3">
                        {preset.kind === "envelope" && (
                          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            U
                            <NumberField
                              value={m.targetUValue}
                              onCommit={(v) =>
                                v !== null &&
                                updateMeasure(m.id, { targetUValue: v })
                              }
                              className="w-16"
                            />
                          </label>
                        )}
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          Jahr
                          <NumberField
                            value={m.year}
                            onCommit={(v) =>
                              v !== null && updateMeasure(m.id, { year: v })
                            }
                            className="w-14"
                          />
                        </label>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 print:hidden"
                          aria-label="Maßnahme entfernen"
                          onClick={() => removeMeasure(m.id)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zielzustand */}
      <Card className="print:break-inside-avoid">
        <CardHeader>
          <CardTitle>Zielzustand nach allen Maßnahmen</CardTitle>
          <CardDescription>
            Einsparung: −{deKw(scenario.phiHlSavedW)} Heizlast · −
            {deKwhA(scenario.endenergieSavedKwh)} Endenergie · −
            {deKgA(scenario.co2SavedKg)} CO₂ · −
            {deEur(scenario.energieKostenSavedEur)}/a Energiekosten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EnergyKpis energy={scenario.finalEnergy} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Kpi
              label="Heizlast vorher → nachher"
              value={`${deKw(scenario.baseResults.totalPhiHlW)} → ${deKw(
                scenario.finalResults.totalPhiHlW,
              )}`}
            />
            <Kpi label="Investition" value={deEur(scenario.totalCostEur)} />
            <Kpi label="Förderung (BEG)" value={deEur(scenario.totalFundingEur)} />
            <Kpi
              label="Eigenanteil"
              value={deEur(scenario.totalCostEur - scenario.totalFundingEur)}
            />
            <Kpi
              label="Kostenersparnis"
              value={`${deEur(scenario.energieKostenSavedEur)}/a`}
            />
            <Kpi label="Amortisation" value={paybackLabel(scenario)} />
          </div>
          {scenario.finalResults.totalPhiHlW > 0 && (
            <LoadBars results={scenario.finalResults} />
          )}
        </CardContent>
      </Card>

      {/* Wirtschaftlichkeit über die Zeit */}
      <Card className="print:break-inside-avoid">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="size-4 text-primary" />
            Wirtschaftlichkeit über die Zeit
          </CardTitle>
          <CardDescription>
            Kumulierter Saldo aus Investitionen und Energiekosten-Ersparnis.
            Investitions-Marker lassen sich entlang der Zeitachse verschieben.
          </CardDescription>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              disabled={renovation.measures.every((m) => !m.enabled)}
              onClick={() => optimizeSchedule()}
            >
              <Wand2 className="size-4" />
              Optimieren
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <CashflowChart
            scenario={scenario}
            measures={renovation.measures}
            horizonYears={horizonYears}
            onMoveMeasure={(id, year) => updateMeasure(id, { year })}
          />
        </CardContent>
      </Card>

      {/* Fahrplan-Timeline */}
      {scenario.steps.length > 0 && (
        <Card className="print:break-inside-avoid">
          <CardHeader>
            <CardTitle>Fahrplan</CardTitle>
            <CardDescription>
              Maßnahmenpakete in der Umsetzungsreihenfolge mit kumulativer
              Wirkung.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {scenario.steps.map((step, i) => (
                <li
                  key={step.selection.id}
                  className="flex gap-3 border-l-2 border-primary/40 pl-3"
                >
                  <div className="text-sm font-semibold tabular-nums text-muted-foreground">
                    {step.selection.year}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {i + 1}. {step.preset.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Heizlast danach {deKw(step.phiHlW)} (−
                      {deKw(step.phiHlSavedW)}) · Endenergie −
                      {deKwhA(step.endenergieSavedKwh)} · CO₂ −
                      {deKgA(step.co2SavedKg)} · {deEur(step.costEur)} (Förderung{" "}
                      {deEur(step.fundingEur)})
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" />
          Drucken / als PDF speichern
        </Button>
      </div>
    </div>
  )
}
