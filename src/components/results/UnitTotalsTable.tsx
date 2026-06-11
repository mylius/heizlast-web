/**
 * Ergebniszusammenstellung: Summen je Nutzungseinheit + Gebäude gesamt.
 */
import type { ProjectResults } from "@/engine/calc"
import { deWatt } from "@/lib/format"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function UnitTotalsTable({ results }: { results: ProjectResults }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nr.</TableHead>
          <TableHead>Bezeichnung</TableHead>
          <TableHead className="text-right">Σ Φ_T</TableHead>
          <TableHead className="text-right">Σ Φ_V</TableHead>
          <TableHead className="text-right">Normheizlast</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.unitResults.map((ur) => (
          <TableRow key={ur.unit.number}>
            <TableCell>{ur.unit.number}</TableCell>
            <TableCell>{ur.unit.name}</TableCell>
            <TableCell className="text-right">{deWatt(ur.phiTW)}</TableCell>
            <TableCell className="text-right">{deWatt(ur.phiVW)}</TableCell>
            <TableCell className="text-right font-semibold">
              {deWatt(ur.phiHlW)}
            </TableCell>
          </TableRow>
        ))}
        <TableRow className="bg-muted/50 font-semibold">
          <TableCell />
          <TableCell>Gebäude gesamt</TableCell>
          <TableCell className="text-right">{deWatt(results.totalPhiTW)}</TableCell>
          <TableCell className="text-right">{deWatt(results.totalPhiVW)}</TableCell>
          <TableCell className="text-right">{deWatt(results.totalPhiHlW)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}
