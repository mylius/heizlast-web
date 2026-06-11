import { LoadBars } from "@/components/results/LoadBars"
import { UnitTotalsTable } from "@/components/results/UnitTotalsTable"
import { ZonesTable } from "@/components/results/ZonesTable"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useProjectStore } from "@/store/projectStore"
import { useProjectResults } from "@/store/selectors"

export function ProfiPage() {
  const project = useProjectStore((s) => s.project)
  const results = useProjectResults()

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Zonenübersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <ZonesTable project={project} results={results} />
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Heizlast je Raum</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadBars results={results} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ergebnis Nutzungseinheiten</CardTitle>
          </CardHeader>
          <CardContent>
            <UnitTotalsTable results={results} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
