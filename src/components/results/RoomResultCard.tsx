/**
 * Ergebnis-Kachel eines Raums: Normheizlast, Aufteilung, spezifische Last.
 */
import type { RoomResult } from "@/engine/calc"
import { aFloorM2 } from "@/engine/derive"
import { de, deWatt } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function RoomResultCard({ result }: { result: RoomResult }) {
  const area = aFloorM2(result.room)
  const specific = area > 0 ? result.phiHlW / area : null
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-card p-4">
      <div>
        <div className="text-xs text-muted-foreground">Normheizlast Φ_HL</div>
        <div className="text-2xl font-bold tabular-nums">
          {deWatt(result.phiHlW)}
        </div>
      </div>
      <div className="text-sm">
        <div className="text-xs text-muted-foreground">Transmission Φ_T</div>
        <div className="font-medium tabular-nums">{deWatt(result.phiTStandW)}</div>
      </div>
      <div className="text-sm">
        <div className="text-xs text-muted-foreground">Lüftung Φ_V</div>
        <div className="font-medium tabular-nums">{deWatt(result.phiVStandW)}</div>
      </div>
      <div className="text-sm">
        <div className="text-xs text-muted-foreground">q_V,min</div>
        <div className="font-medium tabular-nums">
          {de(result.qVMinM3h, 1)} m³/h
        </div>
      </div>
      {result.qVInfM3h > 0 && (
        <div className="text-sm">
          <div className="text-xs text-muted-foreground">q_V,inf</div>
          <div className="font-medium tabular-nums">
            {de(result.qVInfM3h, 1)} m³/h
          </div>
        </div>
      )}
      {specific !== null && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={specific > 100 ? "destructive" : "secondary"}
              className="ml-auto tabular-nums"
            >
              {de(specific, 0)} W/m²
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            Spezifische Heizlast. Werte über 100 W/m² deuten auf schlechte
            Dämmung hin (moderner Neubau: 30–50 W/m²).
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
