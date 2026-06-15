/**
 * Wirtschaftlichkeit über die Zeit: kumulierter Saldo (Investitionen vs.
 * jährliche Energiekosten-Einsparung) über die Jahre. Die Investitionen lassen
 * sich per Drag entlang der Zeitachse verschieben; der Schnittpunkt mit der
 * Nulllinie ist der Amortisationszeitpunkt.
 *
 * Reines SVG (keine Chart-Bibliothek), im Stil von SankeyChart/LoadBars.
 */
import { useEffect, useMemo, useRef, useState } from "react"

import type { ScenarioResult } from "@/engine/measures"
import type { RenovationMeasureSelection } from "@/engine/types"
import { deEur } from "@/lib/format"

const H = 280
const PAD = { left: 56, right: 16, top: 16, bottom: 28 }
const MAX_YEAR = 40

interface CashflowPoint {
  year: number
  cumulative: number
}

/** Jährliche Energiekosten nach allen Maßnahmen mit Umsetzungsjahr ≤ y. */
function costAtYear(scenario: ScenarioResult, year: number): number {
  let cost = scenario.baseEnergy.energieKostenEur
  for (const step of scenario.steps) {
    if (step.selection.year <= year) cost = step.energy.energieKostenEur
    else break
  }
  return cost
}

function buildSeries(
  scenario: ScenarioResult,
  chartYears: number,
): { points: CashflowPoint[]; breakEven: number | null } {
  const baseCost = scenario.baseEnergy.energieKostenEur
  const points: CashflowPoint[] = [{ year: 0, cumulative: 0 }]
  let cumulative = 0
  let breakEven: number | null = null

  for (let y = 1; y <= chartYears; y++) {
    const invest = scenario.steps
      .filter((s) => s.selection.year === y)
      .reduce((sum, s) => sum + (s.costEur - s.fundingEur), 0)
    const saving = baseCost - costAtYear(scenario, y)
    cumulative += saving - invest
    points.push({ year: y, cumulative })
    if (breakEven === null && cumulative >= 0 && y > 0) {
      // nur als amortisiert werten, wenn überhaupt investiert wurde
      const investedSoFar = scenario.steps.some((s) => s.selection.year <= y)
      if (investedSoFar) breakEven = y
    }
  }
  return { points, breakEven }
}

interface CashflowChartProps {
  scenario: ScenarioResult
  measures: RenovationMeasureSelection[]
  horizonYears: number
  onMoveMeasure: (id: string, year: number) => void
}

export function CashflowChart({
  scenario,
  measures,
  horizonYears,
  onMoveMeasure,
}: CashflowChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [width, setWidth] = useState(720)
  const [dragId, setDragId] = useState<string | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const enabled = useMemo(
    () => measures.filter((m) => m.enabled),
    [measures],
  )

  const latestYear = enabled.reduce((max, m) => Math.max(max, m.year), 0)
  const chartYears = Math.min(
    MAX_YEAR,
    Math.max(15, horizonYears, latestYear + 2),
  )

  const { points, breakEven } = useMemo(
    () => buildSeries(scenario, chartYears),
    [scenario, chartYears],
  )

  const plotW = width - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const maxCF = Math.max(0, ...points.map((p) => p.cumulative))
  const minCF = Math.min(0, ...points.map((p) => p.cumulative))
  const range = maxCF - minCF || 1

  const xOf = (year: number) => PAD.left + (year / chartYears) * plotW
  const yOf = (eur: number) =>
    PAD.top + (1 - (eur - minCF) / range) * plotH
  const yearOf = (px: number) =>
    Math.round(((px - PAD.left) / plotW) * chartYears)

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xOf(p.year)},${yOf(p.cumulative)}`)
    .join(" ")
  const areaPath =
    `M${xOf(0)},${yOf(0)} ` +
    points.map((p) => `L${xOf(p.year)},${yOf(p.cumulative)}`).join(" ") +
    ` L${xOf(chartYears)},${yOf(0)} Z`

  const zeroY = yOf(0)

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragId || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const year = Math.min(MAX_YEAR, Math.max(1, yearOf(e.clientX - rect.left)))
    onMoveMeasure(dragId, year)
  }

  if (scenario.steps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Noch keine aktiven Maßnahmen — füge oben Maßnahmen hinzu, um die
        Wirtschaftlichkeit über die Zeit zu sehen.
      </p>
    )
  }

  return (
    <div ref={wrapRef} className="w-full select-none">
      <svg
        ref={svgRef}
        width={width}
        height={H}
        className="touch-none"
        onPointerMove={onPointerMove}
        onPointerUp={(e) => {
          if (dragId) {
            svgRef.current?.releasePointerCapture?.(e.pointerId)
            setDragId(null)
          }
        }}
      >
        {/* Nulllinie */}
        <line
          x1={PAD.left}
          x2={width - PAD.right}
          y1={zeroY}
          y2={zeroY}
          className="stroke-border"
          strokeWidth={1}
        />
        {/* y-Achsenbeschriftung (oben/unten) */}
        <text x={4} y={PAD.top + 4} className="fill-muted-foreground text-[10px]">
          {deEur(maxCF)}
        </text>
        <text
          x={4}
          y={H - PAD.bottom}
          className="fill-muted-foreground text-[10px]"
        >
          {deEur(minCF)}
        </text>
        {/* Fläche unter/über der Kurve */}
        <path d={areaPath} className="fill-primary/10" />
        {/* kumulierte Saldokurve */}
        <path
          d={linePath}
          fill="none"
          className="stroke-primary"
          strokeWidth={2}
        />
        {/* Amortisationsmarke */}
        {breakEven !== null && (
          <g>
            <line
              x1={xOf(breakEven)}
              x2={xOf(breakEven)}
              y1={PAD.top}
              y2={H - PAD.bottom}
              className="stroke-emerald-500"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle
              cx={xOf(breakEven)}
              cy={zeroY}
              r={4}
              className="fill-emerald-500"
            />
            <text
              x={xOf(breakEven) + 5}
              y={PAD.top + 11}
              className="fill-emerald-600 text-[11px] font-medium"
            >
              amortisiert nach {breakEven} J.
            </text>
          </g>
        )}
        {/* x-Achse: Jahresbeschriftung */}
        {Array.from({ length: chartYears + 1 }).map((_, y) =>
          y % 5 === 0 ? (
            <text
              key={y}
              x={xOf(y)}
              y={H - 8}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {y}
            </text>
          ) : null,
        )}
        {/* verschiebbare Investitions-Marker */}
        {enabled.map((m) => {
          const x = xOf(Math.min(chartYears, m.year))
          const isHeating = scenario.steps.find(
            (s) => s.selection.id === m.id,
          )?.preset.kind === "heating"
          return (
            <g
              key={m.id}
              className="cursor-ew-resize"
              onPointerDown={(e) => {
                e.preventDefault()
                svgRef.current?.setPointerCapture(e.pointerId)
                setDragId(m.id)
              }}
            >
              <line
                x1={x}
                x2={x}
                y1={PAD.top}
                y2={H - PAD.bottom}
                className={
                  isHeating ? "stroke-orange-400" : "stroke-sky-400"
                }
                strokeWidth={dragId === m.id ? 2.5 : 1.5}
              />
              <circle
                cx={x}
                cy={H - PAD.bottom}
                r={7}
                className={
                  isHeating
                    ? "fill-orange-400 stroke-background"
                    : "fill-sky-400 stroke-background"
                }
                strokeWidth={2}
              />
            </g>
          )
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-sky-400" />
          Hülle (Investition)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-orange-400" />
          Heizung (Investition)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-3 bg-primary" />
          Kumulierter Saldo
        </span>
        <span className="text-muted-foreground/80">
          Marker ziehen, um das Umsetzungsjahr zu ändern.
        </span>
      </div>
    </div>
  )
}
