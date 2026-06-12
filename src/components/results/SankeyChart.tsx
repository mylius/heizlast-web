/**
 * „Wohin geht die Wärme?" — Sankey-Diagramm der Verlustaufteilung.
 * Handgebautes SVG ohne Chart-Bibliothek: ein Quellknoten (Normheizlast),
 * rechts die Verlustkategorien, Bänder proportional zur Leistung.
 */
import type { HeatLossBreakdown } from "@/engine/breakdown"
import { de, deWatt } from "@/lib/format"

const COLORS: Record<string, string> = {
  aw: "#38bdf8",
  fenster: "#fbbf24",
  tueren: "#fb923c",
  dach: "#f87171",
  decken: "#c084fc",
  boeden: "#a3e635",
  htw: "#94a3b8",
  innen: "#cbd5e1",
  lueftung: "#2dd4bf",
  aufheiz: "#f472b6",
}

const W = 760
const H = 340
const NODE_W = 12
const LEFT_X = 4
const RIGHT_X = 470
const LABEL_X = RIGHT_X + NODE_W + 10
const PAD_Y = 10
const GAP = 7

export function SankeyChart({ breakdown }: { breakdown: HeatLossBreakdown }) {
  const { categories, totalW, gainsW } = breakdown
  if (totalW <= 0 || categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Keine Verluste vorhanden — Räume und Bauteile erfassen.
      </p>
    )
  }

  const n = categories.length
  const availableH = H - 2 * PAD_Y - GAP * (n - 1)
  const heights = categories.map((c) =>
    Math.max(2.5, (c.watts / totalW) * availableH),
  )
  const flowsH = heights.reduce((s, h) => s + h, 0)

  // Quellknoten: zusammenhängend, vertikal zentriert
  const leftH = flowsH
  const leftY0 = (H - leftH) / 2

  // Zielknoten: gestapelt mit Lücken, vertikal zentriert
  const rightTotalH = flowsH + GAP * (n - 1)
  let rightY = (H - rightTotalH) / 2

  let leftY = leftY0
  const midX = (LEFT_X + NODE_W + RIGHT_X) / 2

  const ribbons = categories.map((c, i) => {
    const h = heights[i]
    const yL0 = leftY
    const yL1 = leftY + h
    const yR0 = rightY
    const yR1 = rightY + h
    leftY += h
    rightY += h + GAP
    const x1 = LEFT_X + NODE_W
    const x2 = RIGHT_X
    const path = [
      `M ${x1} ${yL0}`,
      `C ${midX} ${yL0} ${midX} ${yR0} ${x2} ${yR0}`,
      `L ${x2} ${yR1}`,
      `C ${midX} ${yR1} ${midX} ${yL1} ${x1} ${yL1}`,
      "Z",
    ].join(" ")
    return { c, h, yR0, yR1, path }
  })

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Verlustaufteilung der Normheizlast nach Bauteilart"
      >
        {/* Bänder */}
        {ribbons.map(({ c, path }) => (
          <path key={c.key} d={path} fill={COLORS[c.key] ?? "#999"} opacity={0.45}>
            <title>{`${c.label}: ${deWatt(c.watts)} (${de((c.watts / totalW) * 100, 0)} %)`}</title>
          </path>
        ))}
        {/* Quellknoten */}
        <rect
          x={LEFT_X}
          y={leftY0}
          width={NODE_W}
          height={leftH}
          rx={2}
          className="fill-foreground"
        />
        <text
          x={LEFT_X + NODE_W + 8}
          y={leftY0 - 8 < 12 ? leftY0 + 14 : leftY0 - 8}
          className="fill-foreground text-[13px] font-semibold"
        >
          Normheizlast {deWatt(totalW)}
        </text>
        {/* Zielknoten + Beschriftung */}
        {ribbons.map(({ c, yR0, yR1 }) => {
          const pct = (c.watts / totalW) * 100
          const cy = (yR0 + yR1) / 2
          return (
            <g key={c.key}>
              <rect
                x={RIGHT_X}
                y={yR0}
                width={NODE_W}
                height={yR1 - yR0}
                rx={2}
                fill={COLORS[c.key] ?? "#999"}
              />
              <text
                x={LABEL_X}
                y={cy + 4}
                className="fill-foreground text-[12px]"
              >
                {c.label}
                <tspan className="fill-muted-foreground">
                  {"  "}
                  {deWatt(c.watts)} · {de(pct, 0)} %
                </tspan>
              </text>
            </g>
          )
        })}
      </svg>
      {gainsW > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          Zusätzlich {deWatt(gainsW)} Wärmegewinne aus wärmeren Nachbarräumen
          (nicht als Fluss dargestellt).
        </p>
      )}
    </div>
  )
}
