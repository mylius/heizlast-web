/**
 * Druckoptimierter Bericht (RAUMHEIZLAST DIN EN 12831): gleiche Struktur wie
 * der Markdown-Bericht, als semantisches HTML. "PDF erstellen" nutzt den
 * Browser-Druckdialog (print.css: A4, Seitenumbruch je Raum).
 */
import { useNavigate } from "react-router-dom"
import { ArrowLeft, FileDown, FileSpreadsheet, FileText, Printer } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { SankeyChart } from "@/components/results/SankeyChart"
import { aggregateHeatLoss } from "@/engine/breakdown"
import type { RoomResult } from "@/engine/calc"
import {
  aFloorM2,
  effectiveCeilingThicknessM,
  effectiveNMinH1,
  effectiveStoreyHeightM,
  effectiveThetaIC,
  hIM,
  storeyForRoom,
  thetaDesignC,
  vIM3,
} from "@/engine/derive"
import type { Project, Storey } from "@/engine/types"
import { saveFile, saveTextFile } from "@/lib/download"
import { saveProjectFile } from "@/lib/projectFile"
import { buildReportMd } from "@/report/markdown"
import { fmt } from "@/report/format"
import { useProjectStore } from "@/store/projectStore"
import { useProjectResults } from "@/store/selectors"

export function ReportPage() {
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.project)
  const params = useProjectStore((s) => s.params)
  const results = useProjectResults()
  const dateStr = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  const fileBase = (project.projectId || "Heizlastberechnung").replace(
    /[^\w.-]+/g,
    "_",
  )

  const exportMarkdown = async () => {
    await saveTextFile(
      buildReportMd(project, params) + "\n",
      `${fileBase}.md`,
      "text/markdown",
      "Markdown-Bericht",
    )
    toast.success("Markdown-Bericht gespeichert")
  }

  const exportXlsx = async () => {
    // exceljs ist groß → erst beim Export laden
    const { buildXlsx } = await import("@/report/xlsx")
    const blob = await buildXlsx(project, params)
    await saveFile(
      blob,
      `${fileBase}.xlsx`,
      "Excel-Arbeitsmappe",
      {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
      },
    )
    toast.success("Excel-Datei gespeichert")
  }

  const allRoomResults = results.unitResults.flatMap((ur) => ur.roomResults)

  return (
    <div className="mx-auto max-w-4xl px-6 py-6 print:max-w-none print:p-0">
      <div className="mb-6 flex flex-wrap items-center gap-2 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft /> Zurück
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" onClick={() => window.print()}>
            <Printer /> PDF erstellen / Drucken
          </Button>
          <Button size="sm" variant="outline" onClick={exportMarkdown}>
            <FileText /> Markdown
          </Button>
          <Button size="sm" variant="outline" onClick={exportXlsx}>
            <FileSpreadsheet /> Excel
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => saveProjectFile(project, params)}
          >
            <FileDown /> Projektdatei
          </Button>
        </div>
      </div>

      <article className="report space-y-6 text-sm print:space-y-4 print:text-[10px] print:leading-snug">
        <section className="report-cover flex min-h-[60vh] flex-col rounded-lg border p-8 print:min-h-[calc(100vh-30mm)] print:rounded-none print:border-none print:p-0">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Heizlastberechnung nach DIN EN 12831
            </p>
            <h1 className="text-3xl font-bold tracking-tight print:text-2xl">
              {project.projectId || project.description || "Heizlastberechnung"}
            </h1>
            {project.description && project.projectId && (
              <p className="text-lg text-muted-foreground print:text-sm">
                {project.description}
              </p>
            )}
            {project.address && <p className="text-sm">{project.address}</p>}
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
            <dt className="text-muted-foreground">Datum</dt>
            <dd>{dateStr}</dd>
            <dt className="text-muted-foreground">
              Norm-Außentemperatur θ<sub>e</sub>
            </dt>
            <dd>{fmt(params.thetaEC)} °C</dd>
            <dt className="text-muted-foreground">Räume</dt>
            <dd>{allRoomResults.length}</dd>
            <dt className="text-muted-foreground">Normheizlast gesamt</dt>
            <dd className="text-xl font-bold print:text-base">
              {Math.trunc(results.totalPhiHlW)} W
            </dd>
          </dl>

          <div className="mt-auto grid grid-cols-2 gap-12 pt-16">
            <div>
              <div className="border-t pt-1 text-xs text-muted-foreground">
                Ort, Datum
              </div>
            </div>
            <div>
              <div className="border-t pt-1 text-xs text-muted-foreground">
                Unterschrift Ersteller/in
              </div>
            </div>
          </div>
          <p className="mt-6 text-[10px] leading-snug text-muted-foreground">
            Berechnung der Norm-Heizlast (Transmissions- und
            Lüftungswärmeverluste) nach DIN EN 12831-1. Erstellt mit
            heizlast-web; Eingabedaten und Annahmen sind in den folgenden
            Raumblättern dokumentiert und vom Ersteller zu verantworten.
          </p>
        </section>

        <header className="print-page-break">
          <h1 className="text-2xl font-bold print:text-lg">
            RAUMHEIZLAST DIN EN 12831
          </h1>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5">
            <dt className="font-semibold">Projekt:</dt>
            <dd>
              {project.projectId || "-"} /{" "}
              {project.description || "Heizlastberechnung"}
            </dd>
            <dt className="font-semibold">Datum:</dt>
            <dd>{dateStr}</dd>
            {project.address && (
              <>
                <dt className="font-semibold">Adresse:</dt>
                <dd>{project.address}</dd>
              </>
            )}
          </dl>
        </header>

        <section>
          <h2 className="report-h2">Berechnungsparameter</h2>
          <p>
            Auslegungs-Außentemperatur θ<sub>e</sub> = {fmt(params.thetaEC)} °C
          </p>
        </section>

        <section>
          <h2 className="report-h2">1. Checkliste Vereinbarungen</h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>Geschoss</th>
                <th>Nr.</th>
                <th>Bezeichnung</th>
                <th>Raumart</th>
                <th>Innentemp. °C</th>
                <th>Mindest-Außenluftwechsel 1/h</th>
              </tr>
            </thead>
            <tbody>
              {project.usageUnits.flatMap((u) =>
                u.rooms.map((r, i) => (
                  <tr key={`${u.number}-${i}`}>
                    <td>{r.floor}</td>
                    <td>{r.id}</td>
                    <td>{r.name}</td>
                    <td>{r.roomType ?? r.name}</td>
                    <td className="num">{fmt(effectiveThetaIC(r))}</td>
                    <td className="num">
                      {effectiveNMinH1(r) !== 0 ? fmt(effectiveNMinH1(r)) : "-"}
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="report-h2">2. Zonenübersicht</h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>Geschoss</th>
                <th>Nr.</th>
                <th>Bezeichnung</th>
                <th>Raumart</th>
                <th>
                  A<sub>NGI</sub> (m²)
                </th>
                <th>
                  V<sub>i</sub> (m³)
                </th>
                <th>
                  θ<sub>i</sub> (°C)
                </th>
                <th>
                  n<sub>min</sub> (1/h)
                </th>
                <th>
                  Φ<sub>T</sub> (W)
                </th>
                <th>
                  Φ<sub>V</sub> (W)
                </th>
                <th>
                  Φ<sub>HL</sub> (W)
                </th>
              </tr>
            </thead>
            <tbody>
              {results.unitResults.flatMap((ur) =>
                ur.roomResults.map((res, i) => {
                  const r = res.room
                  const storey = storeyForRoom(r, project)
                  return (
                    <tr key={`${ur.unit.number}-${i}`}>
                      <td>{r.floor}</td>
                      <td>{r.id}</td>
                      <td>{r.name}</td>
                      <td>{r.roomType ?? r.name}</td>
                      <td className="num">{fmt(aFloorM2(r))}</td>
                      <td className="num">{fmt(vIM3(r, storey))}</td>
                      <td className="num">{fmt(effectiveThetaIC(r))}</td>
                      <td className="num">
                        {effectiveNMinH1(r) !== 0
                          ? fmt(effectiveNMinH1(r))
                          : "-"}
                      </td>
                      <td className="num">{Math.trunc(res.phiTStandW)}</td>
                      <td className="num">{Math.trunc(res.phiVStandW)}</td>
                      <td className="num font-bold">{Math.trunc(res.phiHlW)}</td>
                    </tr>
                  )
                }),
              )}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="report-h2">3. Verlustaufteilung</h2>
          <div className="max-w-2xl">
            <SankeyChart breakdown={aggregateHeatLoss(results)} />
          </div>
        </section>

        {allRoomResults.map((res, i) => (
          <RoomSection
            key={i}
            result={res}
            project={project}
            pageNum={i + 1}
            totalPages={allRoomResults.length + 1}
          />
        ))}

        <section className="print-page-break">
          <h2 className="report-h2">
            Ergebnis Zusammenstellung Nutzungseinheiten
          </h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>Nr.</th>
                <th>Bezeichnung</th>
                <th>
                  Σ Φ<sub>T</sub> (W)
                </th>
                <th>
                  Σ Φ<sub>V</sub> (W)
                </th>
                <th>Normheizlast (W)</th>
              </tr>
            </thead>
            <tbody>
              {results.unitResults.map((ur) => (
                <tr key={ur.unit.number} className="font-semibold">
                  <td>{ur.unit.number}</td>
                  <td>{ur.unit.name}</td>
                  <td className="num">{Math.trunc(ur.phiTW)}</td>
                  <td className="num">{Math.trunc(ur.phiVW)}</td>
                  <td className="num">{Math.trunc(ur.phiHlW)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td>Summe</td>
                <td>Gebäude gesamt</td>
                <td className="num">{Math.trunc(results.totalPhiTW)}</td>
                <td className="num">{Math.trunc(results.totalPhiVW)}</td>
                <td className="num">{Math.trunc(results.totalPhiHlW)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <footer className="pt-4 text-xs text-muted-foreground print:text-[9px]">
          Erstellt mit heizlast-web — Heizlastberechnung nach DIN EN 12831
          (Transmissions- und Lüftungswärmeverluste).
        </footer>
      </article>
    </div>
  )
}

function RoomSection({
  result,
  project,
  pageNum,
  totalPages,
}: {
  result: RoomResult
  project: Project
  pageNum: number
  totalPages: number
}) {
  const room = result.room
  const storey: Storey | undefined = storeyForRoom(room, project)
  const aufheiz = room.heatingUpAllowanceW ?? 0

  return (
    <section className="print-page-break">
      <h2 className="report-h2">
        RAUMHEIZLAST — {room.id} {room.name}
      </h2>
      <p className="text-xs text-muted-foreground">
        Seite REG-{room.id} ({pageNum}/{totalPages}) · Geschoss {room.floor} ·
        θ<sub>i,ausleg</sub> = {fmt(thetaDesignC(room))} °C
      </p>

      <div className="mt-2 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Dim label="Raumbreite" value={`${fmt(room.roomWidthM)} m`} />
        <Dim label="Raumlänge" value={`${fmt(room.roomLengthM)} m`} />
        <Dim label="Raumfläche" value={`${fmt(aFloorM2(room))} m²`} />
        <Dim
          label="Geschosshöhe"
          value={`${fmt(effectiveStoreyHeightM(room, storey))} m`}
        />
        <Dim
          label="Deckendicke"
          value={`${fmt(effectiveCeilingThicknessM(room, storey))} m`}
        />
        <Dim label="Raumhöhe" value={`${fmt(hIM(room, storey))} m`} />
        <Dim label="Raumvolumen" value={`${fmt(vIM3(room, storey))} m³`} />
      </div>

      <h3 className="mt-4 mb-1 font-semibold">
        Standard-Transmissionswärmeverlust
      </h3>
      <table className="report-table">
        <thead>
          <tr>
            <th>Orient.</th>
            <th>Bauteil</th>
            <th>Breite</th>
            <th>L/H</th>
            <th>Brutto</th>
            <th>Abzug</th>
            <th>
              A<sub>k</sub>
            </th>
            <th>grenzt an</th>
            <th>
              θ<sub>adj</sub>
            </th>
            <th>
              f<sub>ix</sub>
            </th>
            <th>
              U<sub>k</sub>
            </th>
            <th>
              ΔU<sub>TB</sub>
            </th>
            <th>
              U<sub>korr</sub>
            </th>
            <th>
              Φ<sub>T,k</sub> (W)
            </th>
          </tr>
        </thead>
        <tbody>
          {result.componentResults.map((cr, i) => {
            const c = cr.component
            const storeyHeight = effectiveStoreyHeightM(room, storey)
            let widthS = "-"
            let lhS = "-"
            if (c.widthM && (c.lengthHeightM || c.orientation === "H")) {
              widthS = fmt(c.widthM)
              lhS = c.lengthHeightM ? fmt(c.lengthHeightM) : fmt(storeyHeight)
            } else if (
              c.orientation !== "H" &&
              cr.effectiveBruttoM2 &&
              storeyHeight
            ) {
              lhS = fmt(storeyHeight)
              widthS = fmt(cr.effectiveBruttoM2 / storeyHeight)
            } else if (
              c.orientation === "H" &&
              cr.effectiveBruttoM2 &&
              room.roomWidthM &&
              room.roomLengthM
            ) {
              lhS = fmt(room.roomLengthM)
              widthS = fmt(room.roomWidthM)
            }
            return (
              <tr key={i} className={cr.isOpening ? "text-muted-foreground" : ""}>
                <td>
                  {cr.isOpening ? "↳ " : ""}
                  {cr.effectiveOrientation ?? c.orientation}
                </td>
                <td>
                  {c.label
                    ? `${c.componentType} (${c.label})`
                    : c.componentType}
                </td>
                <td className="num">{cr.isOpening ? "-" : widthS}</td>
                <td className="num">{cr.isOpening ? "-" : lhS}</td>
                <td className="num">{fmt(cr.effectiveBruttoM2)}</td>
                <td className="num">
                  {cr.effectiveAbzugM2 ? fmt(cr.effectiveAbzugM2) : "-"}
                </td>
                <td className="num">{fmt(cr.aKM2)}</td>
                <td>{c.adjacent}</td>
                <td className="num">{fmt(c.thetaAdjacentC)}</td>
                <td className="num">
                  {cr.fIx !== 0 || c.adjacent === "e" ? fmt(cr.fIx) : "-"}
                </td>
                <td className="num">{fmt(c.uValue)}</td>
                <td className="num">{c.deltaUTb ? fmt(c.deltaUTb) : "-"}</td>
                <td className="num">{fmt(cr.uCorrected)}</td>
                <td className="num">
                  {cr.phiTKW !== 0 ? fmt(cr.phiTKW, 0) : "-"}
                </td>
              </tr>
            )
          })}
          <tr className="font-bold">
            <td colSpan={13} className="text-right">
              Σ Φ<sub>T,stand,i</sub>
            </td>
            <td className="num">{Math.trunc(result.phiTStandW)} W</td>
          </tr>
        </tbody>
      </table>

      <h3 className="mt-4 mb-1 font-semibold">Lüftung und Normheizlast</h3>
      <ul className="list-inside list-disc">
        <li>
          Mindestaußenluftvolumenstrom q<sub>V,min,i</sub>:{" "}
          <strong>{fmt(result.qVMinM3h, 1)} m³/h</strong>
        </li>
        <li>
          Lüftungswärmeverlust Φ<sub>V,stand,i</sub>:{" "}
          <strong>{Math.trunc(result.phiVStandW)} W</strong>
        </li>
        {aufheiz > 0 && (
          <li>
            Aufheizzuschlag: <strong>{Math.trunc(aufheiz)} W</strong>
          </li>
        )}
        <li>
          Normheizlast Φ<sub>HL,i</sub> = Φ<sub>T</sub> + Φ<sub>V</sub>
          {aufheiz > 0 ? " + Aufheizzuschlag" : ""}:{" "}
          <strong>{Math.trunc(result.phiHlW)} W</strong>
        </li>
      </ul>
    </section>
  )
}

function Dim({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  )
}
