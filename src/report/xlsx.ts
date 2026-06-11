/**
 * Excel-Export: Zonenübersicht, ein Blatt pro Raum (Transmissionstabelle wie
 * im RAUMHEIZLAST-Formular) und Ergebniszusammenstellung. Erstellt mit
 * exceljs vollständig im Browser.
 */
import ExcelJS from "exceljs"

import { computeProject } from "@/engine/calc"
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
import type { CalculationParams, Project } from "@/engine/types"

const NUM2 = "#,##0.00"
const NUM1 = "#,##0.0"
const NUM0 = "#,##0"

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true }
  row.alignment = { vertical: "middle", wrapText: true }
}

/** Excel-Blattnamen: max. 31 Zeichen, ohne []:*?/\ */
function sheetName(name: string): string {
  return name.replace(/[[\]:*?/\\]/g, "-").slice(0, 31)
}

export async function buildXlsx(
  project: Project,
  params: CalculationParams,
): Promise<Blob> {
  const wb = new ExcelJS.Workbook()
  wb.creator = "heizlast-web"
  wb.created = new Date()
  const results = computeProject(project, params)

  // --- Zonenübersicht
  const zones = wb.addWorksheet("Zonenübersicht")
  zones.columns = [
    { header: "Geschoss", key: "floor", width: 10 },
    { header: "Nr.", key: "id", width: 10 },
    { header: "Bezeichnung", key: "name", width: 20 },
    { header: "Raumart", key: "type", width: 14 },
    { header: "A_NGI (m²)", key: "a", width: 11, style: { numFmt: NUM2 } },
    { header: "V_i (m³)", key: "v", width: 10, style: { numFmt: NUM2 } },
    { header: "θ_i (°C)", key: "theta", width: 9, style: { numFmt: NUM1 } },
    { header: "n_min (1/h)", key: "nmin", width: 11, style: { numFmt: NUM1 } },
    { header: "Φ_T (W)", key: "phit", width: 10, style: { numFmt: NUM0 } },
    { header: "Φ_V (W)", key: "phiv", width: 10, style: { numFmt: NUM0 } },
    { header: "Φ_HL (W)", key: "phihl", width: 10, style: { numFmt: NUM0 } },
  ]
  styleHeader(zones.getRow(1))
  for (const ur of results.unitResults) {
    for (const res of ur.roomResults) {
      const r = res.room
      const storey = storeyForRoom(r, project)
      zones.addRow({
        floor: r.floor,
        id: r.id,
        name: r.name,
        type: r.roomType ?? r.name,
        a: aFloorM2(r),
        v: vIM3(r, storey),
        theta: effectiveThetaIC(r),
        nmin: effectiveNMinH1(r),
        phit: res.phiTStandW,
        phiv: res.phiVStandW,
        phihl: res.phiHlW,
      })
    }
  }
  zones.getColumn("phihl").font = { bold: true }
  styleHeader(zones.getRow(1))

  // --- Ein Blatt pro Raum
  for (const ur of results.unitResults) {
    for (const res of ur.roomResults) {
      const r = res.room
      const storey = storeyForRoom(r, project)
      const ws = wb.addWorksheet(sheetName(`${r.id} ${r.name}`))
      ws.addRow([`RAUMHEIZLAST DIN EN 12831 — ${r.id} ${r.name}`]).font = {
        bold: true,
        size: 13,
      }
      ws.addRow([])
      ws.addRow(["Geschoss", r.floor])
      ws.addRow(["Raumart", r.roomType ?? r.name])
      ws.addRow(["θ_i,ausleg (°C)", thetaDesignC(r)])
      ws.addRow(["Raumbreite (m)", r.roomWidthM])
      ws.addRow(["Raumlänge (m)", r.roomLengthM])
      ws.addRow(["Raumfläche A_NGI (m²)", aFloorM2(r)])
      ws.addRow(["Geschosshöhe (m)", effectiveStoreyHeightM(r, storey)])
      ws.addRow(["Deckendicke (m)", effectiveCeilingThicknessM(r, storey)])
      ws.addRow(["Raumhöhe h_i (m)", hIM(r, storey)])
      ws.addRow(["Raumvolumen V_i (m³)", vIM3(r, storey)])
      ws.addRow([])

      const header = ws.addRow([
        "Orientierung",
        "Bauteil",
        "Breite (m)",
        "L/H (m)",
        "Brutto (m²)",
        "Abzug (m²)",
        "A_k (m²)",
        "grenzt an",
        "θ_adj (°C)",
        "f_ix",
        "U_k",
        "ΔU_TB",
        "U_korr",
        "Φ_T,k (W)",
      ])
      styleHeader(header)
      for (const cr of res.componentResults) {
        const c = cr.component
        const row = ws.addRow([
          cr.effectiveOrientation ?? c.orientation,
          c.label ? `${c.componentType} (${c.label})` : c.componentType,
          c.widthM || null,
          c.lengthHeightM || null,
          cr.effectiveBruttoM2,
          cr.effectiveAbzugM2 || null,
          cr.aKM2,
          c.adjacent,
          c.thetaAdjacentC,
          cr.fIx,
          c.uValue,
          c.deltaUTb || null,
          cr.uCorrected,
          cr.phiTKW,
        ])
        for (const col of [3, 4, 5, 6, 7, 9, 10, 11, 12, 13]) {
          row.getCell(col).numFmt = NUM2
        }
        row.getCell(14).numFmt = NUM0
      }
      const sumRow = ws.addRow([
        "Σ Φ_T,stand,i",
        ...Array(12).fill(null),
        res.phiTStandW,
      ])
      sumRow.font = { bold: true }
      sumRow.getCell(14).numFmt = NUM0
      ws.addRow([])
      ws.addRow(["q_V,min (m³/h)", res.qVMinM3h]).getCell(2).numFmt = NUM1
      ws.addRow(["Φ_V,stand (W)", res.phiVStandW]).getCell(2).numFmt = NUM0
      if (r.heatingUpAllowanceW) {
        ws.addRow(["Aufheizzuschlag (W)", r.heatingUpAllowanceW]).getCell(2).numFmt =
          NUM0
      }
      const hlRow = ws.addRow(["Normheizlast Φ_HL (W)", res.phiHlW])
      hlRow.font = { bold: true }
      hlRow.getCell(2).numFmt = NUM0
      ws.getColumn(1).width = 22
      ws.getColumn(2).width = 16
    }
  }

  // --- Ergebnis
  const erg = wb.addWorksheet("Ergebnis")
  erg.columns = [
    { header: "Nr.", key: "nr", width: 8 },
    { header: "Bezeichnung", key: "name", width: 24 },
    { header: "Σ Φ_T (W)", key: "phit", width: 12, style: { numFmt: NUM0 } },
    { header: "Σ Φ_V (W)", key: "phiv", width: 12, style: { numFmt: NUM0 } },
    {
      header: "Normheizlast (W)",
      key: "phihl",
      width: 16,
      style: { numFmt: NUM0 },
    },
  ]
  styleHeader(erg.getRow(1))
  for (const ur of results.unitResults) {
    erg.addRow({
      nr: ur.unit.number,
      name: ur.unit.name,
      phit: ur.phiTW,
      phiv: ur.phiVW,
      phihl: ur.phiHlW,
    })
  }
  const totalRow = erg.addRow({
    nr: "Summe",
    name: "Gebäude gesamt",
    phit: results.totalPhiTW,
    phiv: results.totalPhiVW,
    phihl: results.totalPhiHlW,
  })
  totalRow.font = { bold: true }

  const buffer = await wb.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}
