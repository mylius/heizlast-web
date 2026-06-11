/**
 * Einfache Balkenvisualisierung der Raumheizlasten:
 * Transmission vs. Lüftung, absteigend sortiert. Reine Divs, keine Chart-Lib.
 */
import type { ProjectResults } from "@/engine/calc"
import { deWatt } from "@/lib/format"

export function LoadBars({ results }: { results: ProjectResults }) {
  const rooms = results.unitResults
    .flatMap((ur) => ur.roomResults)
    .filter((r) => r.phiHlW > 0)
    .sort((a, b) => b.phiHlW - a.phiHlW)
  const max = Math.max(1, ...rooms.map((r) => r.phiHlW))

  if (rooms.length === 0) return null

  return (
    <div className="space-y-2">
      {rooms.map((res) => {
        const tPct = (Math.max(0, res.phiTStandW) / max) * 100
        const vPct = (Math.max(0, res.phiVStandW) / max) * 100
        return (
          <div key={`${res.room.id}-${res.room.name}`} className="grid grid-cols-[10rem_1fr_5rem] items-center gap-2 text-sm">
            <div className="truncate text-muted-foreground" title={`${res.room.id} ${res.room.name}`}>
              {res.room.id} {res.room.name}
            </div>
            <div className="flex h-4 overflow-hidden rounded-sm bg-muted">
              <div
                className="bg-chart-1"
                style={{ width: `${tPct}%` }}
                title={`Transmission ${deWatt(res.phiTStandW)}`}
              />
              <div
                className="bg-chart-2"
                style={{ width: `${vPct}%` }}
                title={`Lüftung ${deWatt(res.phiVStandW)}`}
              />
            </div>
            <div className="text-right font-medium tabular-nums">
              {deWatt(res.phiHlW)}
            </div>
          </div>
        )
      })}
      <div className="flex gap-4 pt-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm bg-chart-1" />
          Transmission Φ_T
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm bg-chart-2" />
          Lüftung Φ_V
        </span>
      </div>
    </div>
  )
}
