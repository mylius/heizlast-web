/**
 * Zonenübersicht: alle Räume mit Fläche, Volumen, Temperaturen und Heizlast.
 */
import type { ProjectResults } from "@/engine/calc"
import {
  aFloorM2,
  effectiveNMinH1,
  effectiveThetaIC,
  storeyForRoom,
  vIM3,
} from "@/engine/derive"
import type { Project } from "@/engine/types"
import { de, deWatt } from "@/lib/format"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function ZonesTable({
  project,
  results,
}: {
  project: Project
  results: ProjectResults
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Geschoss</TableHead>
          <TableHead>Nr.</TableHead>
          <TableHead>Bezeichnung</TableHead>
          <TableHead>Raumart</TableHead>
          <TableHead className="text-right">A (m²)</TableHead>
          <TableHead className="text-right">V (m³)</TableHead>
          <TableHead className="text-right">θᵢ (°C)</TableHead>
          <TableHead className="text-right">n_min (1/h)</TableHead>
          <TableHead className="text-right">Φ_T</TableHead>
          <TableHead className="text-right">Φ_V</TableHead>
          <TableHead className="text-right">Φ_HL</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.unitResults.flatMap((ur) =>
          ur.roomResults.map((res) => {
            const r = res.room
            const storey = storeyForRoom(r, project)
            const nMin = effectiveNMinH1(r)
            return (
              <TableRow key={`${ur.unit.number}-${r.id}`}>
                <TableCell>{r.floor}</TableCell>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.roomType ?? r.name}</TableCell>
                <TableCell className="text-right">{de(aFloorM2(r))}</TableCell>
                <TableCell className="text-right">
                  {de(vIM3(r, storey))}
                </TableCell>
                <TableCell className="text-right">
                  {de(effectiveThetaIC(r), 1)}
                </TableCell>
                <TableCell className="text-right">
                  {nMin !== 0 ? de(nMin, 1) : "–"}
                </TableCell>
                <TableCell className="text-right">{deWatt(res.phiTStandW)}</TableCell>
                <TableCell className="text-right">{deWatt(res.phiVStandW)}</TableCell>
                <TableCell className="text-right font-semibold">
                  {deWatt(res.phiHlW)}
                </TableCell>
              </TableRow>
            )
          }),
        )}
      </TableBody>
    </Table>
  )
}
