/**
 * Markdown-Bericht (RAUMHEIZLAST DIN EN 12831).
 *
 * Layout entspricht dem klassischen RAUMHEIZLAST-Formular — wird per
 * Golden-File-Test gegen die Referenzausgabe verifiziert.
 */
import {
  computeRoomHeatingLoad,
  computeUsageUnitTotals,
  type RoomResult,
} from "@/engine/calc"
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
import type {
  AdjacentType,
  CalculationParams,
  ComponentType,
  Project,
  Room,
  Storey,
  UsageUnit,
} from "@/engine/types"

import { fmt, fmtInt } from "./format"

function componentStr(comp: ComponentType, label: string): string {
  if (label) return `${comp} (${label})`
  return comp
}

function adjacentStr(a: AdjacentType): string {
  return a
}

function buildRoomTransmissionTable(
  roomResult: RoomResult,
  storey?: Storey,
): string {
  const room = roomResult.room
  const lines = [
    "| Orientierung | Bauteil | Breite | L/H | Bruttofläche | Abzugsfläche | Bauteilfläche | grenzt an | angrenz. Temp. | $f_{ix}$ | $U_k$ | $\\Delta U_{TB}$ | $U_{korr}$ | $\\Phi_{T,k}$ (W) |",
    "|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|",
  ]
  const storeyHeight = effectiveStoreyHeightM(room, storey)
  for (const r of roomResult.componentResults) {
    const c = r.component
    const br = r.effectiveBruttoM2
    const ab = r.effectiveAbzugM2
    const orient =
      r.effectiveOrientation !== null ? r.effectiveOrientation : c.orientation
    const compLabel = componentStr(c.componentType, c.label)
    let widthS: string
    let lhS: string
    if (c.widthM && (c.lengthHeightM || c.orientation === "H")) {
      widthS = fmt(c.widthM)
      lhS = c.lengthHeightM ? fmt(c.lengthHeightM) : fmt(storeyHeight)
    } else if (c.orientation !== "H" && br && storeyHeight) {
      lhS = fmt(storeyHeight)
      widthS = fmt(br / storeyHeight)
    } else if (c.orientation === "H" && br && room.roomWidthM && room.roomLengthM) {
      lhS = fmt(room.roomLengthM)
      widthS = fmt(room.roomWidthM)
    } else {
      widthS = "-"
      lhS = "-"
    }
    const brS = fmt(br)
    const abS = ab ? fmt(ab) : "-"
    const akS = fmt(r.aKM2)
    const adjS = adjacentStr(c.adjacent)
    const thetaAdjS = fmt(c.thetaAdjacentC, 2)
    const fixS = r.fIx !== 0 || c.adjacent === "e" ? fmt(r.fIx) : "-"
    const uS = fmt(c.uValue)
    const duS = c.deltaUTb ? fmt(c.deltaUTb) : "-"
    const ucorrS = fmt(r.uCorrected)
    const phiS = r.phiTKW !== 0 ? fmt(r.phiTKW, 0) : "-"
    lines.push(
      `| ${orient} | ${compLabel} | ${widthS} | ${lhS} | ${brS} | ${abS} | ${akS} | ${adjS} | ${thetaAdjS} | ${fixS} | ${uS} | ${duS} | ${ucorrS} | ${phiS} |`,
    )
  }
  lines.push(
    `| | | | | | | | | | | **$\\Sigma \\Phi_{T,stand,i}$** | | | **${fmtInt(roomResult.phiTStandW)} W** |`,
  )
  return lines.join("\n")
}

function buildRoomVentilationSection(roomResult: RoomResult): string {
  const room = roomResult.room
  const qMin = roomResult.qVMinM3h
  const lines = [
    "**Lüftungswärmeverluste:**",
    `- Mindestaußenluftvolumenstrom $q_{V,min,i}$: **${fmt(qMin, 1)} m³/h**`,
  ]
  if (roomResult.qVInfM3h > 0) {
    lines.push(
      `- Infiltration $q_{V,inf,i}$ (n₅₀-basiert): **${fmt(roomResult.qVInfM3h, 1)} m³/h**`,
    )
  }
  lines.push(
    `- Leckagen, ALD, Mindestwert $\\Phi_{V,env/min,i}$: **${fmtInt(roomResult.phiVStandW)} W**`,
    `- $\\Sigma \\Phi_{V,stand,i}$ = **${fmtInt(roomResult.phiVStandW)} W**`,
  )
  const aufheiz = room.heatingUpAllowanceW ?? 0.0
  if (aufheiz > 0) {
    lines.push("")
    lines.push(`**Aufheizzuschlag:** **${fmtInt(aufheiz)} W**`)
  }
  const phiHl = roomResult.phiHlW
  lines.push("")
  if (aufheiz > 0) {
    lines.push(
      `**Normheizlast $\\Phi_{HL,i}$** = $\\Phi_{T,stand,i}$ + $\\Phi_{V,stand,i}$ + Aufheizzuschlag = **${fmtInt(phiHl)} W**`,
    )
  } else {
    lines.push(
      `**Normheizlast $\\Phi_{HL,i}$** = $\\Phi_{T,stand,i}$ + $\\Phi_{V,stand,i}$ = **${fmtInt(phiHl)} W**`,
    )
  }
  return lines.join("\n")
}

function buildRoomSection(
  roomResult: RoomResult,
  pageLabel: string,
  pageNum: number,
  totalPages: number,
  storey?: Storey,
): string {
  const room = roomResult.room
  const sections = [
    `# RAUMHEIZLAST DIN EN 12831 — ${room.id} ${room.name}`,
    `*Seite ${pageLabel} (${pageNum}/${totalPages})*`,
    "",
    "## Kopfangaben",
    `- **Geschoss:** ${room.floor}`,
    `- **Raum-Nr.:** ${room.id}`,
    `- **Bezeichnung:** ${room.name}`,
    "",
    "## Auslegungsinnentemperatur",
    `- $\\theta_{i,stand,i}$ = ${fmt(effectiveThetaIC(room))} °C`,
    `- $+ \\Delta\\theta_{comf,i}$ = ${fmt(room.deltaThetaComfortK)} K`,
    `- $\\theta_{i,ausleg,i}$ = **${fmt(thetaDesignC(room))} °C**`,
    "",
    "## Abmessungen",
    "| Größe | Wert |",
    "|:---|:---|",
    `| Raumbreite $b_i$ | ${fmt(room.roomWidthM)} m |`,
    `| Raumlänge $l_i$ | ${fmt(room.roomLengthM)} m |`,
    `| Raumfläche $A_{NGI}$ | ${fmt(aFloorM2(room))} m² |`,
    `| Geschosshöhe $h_{G,i}$ | ${fmt(effectiveStoreyHeightM(room, storey))} m |`,
    `| Deckendicke $d_i$ | ${fmt(effectiveCeilingThicknessM(room, storey))} m |`,
    `| Raumhöhe $h_i$ | ${fmt(hIM(room, storey))} m |`,
    `| Raumvolumen $V_i$ | ${fmt(vIM3(room, storey))} m³ |`,
    "",
    "## Standard-Transmissionswärmeverlust",
    "",
    buildRoomTransmissionTable(roomResult, storey),
    "",
    "## Lüftung und Normheizlast",
    "",
    buildRoomVentilationSection(roomResult),
  ]
  return sections.join("\n")
}

function buildChecklistTable(units: UsageUnit[]): string {
  const lines = [
    "| Geschoss | Nr. | Bezeichnung | Raumart | Innentemp. °C | Mindest-Außenluftwechsel $h^{-1}$ |",
    "|:---|:---|:---|:---|:---|:---|",
  ]
  for (const u of units) {
    for (const r of u.rooms) {
      const nMinVal = effectiveNMinH1(r)
      const nMin = nMinVal !== 0 ? fmt(nMinVal) : "-"
      const raumart = r.roomType !== null ? r.roomType : r.name
      lines.push(
        `| ${r.floor} | ${r.id} | ${r.name} | ${raumart} | ${fmt(effectiveThetaIC(r))} | ${nMin} |`,
      )
    }
  }
  return lines.join("\n")
}

function buildZonenuebersicht(
  allRoomResults: RoomResult[],
  units: UsageUnit[],
  storeyOf: (room: Room) => Storey | undefined,
): string {
  const lines = [
    "## 2. Zonenübersicht",
    "",
    "| Geschoss | Nr. | Bezeichnung | Raumart | $A_{NGI}$ (m²) | $V_i$ (m³) | $\\theta_i$ (°C) | $n_{min}$ ($h^{-1}$) | $\\Phi_{T}$ (W) | $\\Phi_{V}$ (W) | $\\Phi_{HL}$ (W) |",
    "|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|",
  ]
  let idx = 0
  for (const u of units) {
    for (const r of u.rooms) {
      const res = allRoomResults[idx]
      idx += 1
      const raumart = r.roomType !== null ? r.roomType : r.name
      const nMinVal = effectiveNMinH1(r)
      const nMin = nMinVal !== 0 ? fmt(nMinVal) : "-"
      lines.push(
        `| ${r.floor} | ${r.id} | ${r.name} | ${raumart} | ${fmt(aFloorM2(r))} | ${fmt(vIM3(r, storeyOf(r)))} | ${fmt(effectiveThetaIC(r))} | ${nMin} | ${fmtInt(res.phiTStandW)} | ${fmtInt(res.phiVStandW)} | **${fmtInt(res.phiHlW)}** |`,
      )
    }
  }
  return lines.join("\n")
}

function buildErgebniszusammenstellung(
  units: UsageUnit[],
  unitTotals: [number, number, number][],
  totalPhiT: number,
  totalPhiV: number,
  totalPhiHl: number,
): string {
  const lines = [
    "## Ergebnis Zusammenstellung Nutzungseinheiten",
    "",
    "| Nr. | Bezeichnung | $\\Sigma \\Phi_{T}$ (W) | $\\Sigma \\Phi_{V}$ (W) | **Normheizlast (W)** |",
    "|:---|:---|:---|:---|:---|",
  ]
  units.forEach((unit, i) => {
    const [phiT, phiV, phiHl] = unitTotals[i]
    lines.push(
      `| ${unit.number} | ${unit.name} | **${fmtInt(phiT)}** | **${fmtInt(phiV)}** | **${fmtInt(phiHl)}** |`,
    )
  })
  lines.push(
    `| **Summe** | **Gebäude gesamt** | **${fmtInt(totalPhiT)}** | **${fmtInt(totalPhiV)}** | **${fmtInt(totalPhiHl)}** |`,
  )
  return lines.join("\n")
}

export interface BuildReportOptions {
  projectDate?: Date
  includeRoomPages?: boolean
}

export function buildReportMd(
  project: Project,
  params: CalculationParams,
  options: BuildReportOptions = {},
): string {
  const projectDate = options.projectDate ?? new Date()
  const includeRoomPages = options.includeRoomPages ?? true
  const dd = String(projectDate.getDate()).padStart(2, "0")
  const mm = String(projectDate.getMonth() + 1).padStart(2, "0")
  const dateStr = `${dd}.${mm}.${projectDate.getFullYear()}`

  const storeyOf = (room: Room) => storeyForRoom(room, project)

  const allRoomResults: RoomResult[] = []
  for (const unit of project.usageUnits) {
    for (const room of unit.rooms) {
      allRoomResults.push(computeRoomHeatingLoad(room, params, storeyOf(room)))
    }
  }

  const headerLines = [
    "# RAUMHEIZLAST DIN EN 12831",
    "",
    `**Projekt:** ${project.projectId || "-"} / ${project.description || "Heizlastberechnung"}`,
    `**Datum:** ${dateStr}`,
  ]
  if (project.address) {
    headerLines.push(`**Adresse:** ${project.address}`)
  }
  headerLines.push(
    "",
    "",
    "## Berechnungsparameter",
    "",
    `- Auslegungs-Außentemperatur $\\theta_{e}$ = ${fmt(params.thetaEC)} °C`,
    "",
    "---",
    "",
    "## 1. Checkliste Vereinbarungen",
    "",
    buildChecklistTable(project.usageUnits),
    "",
    "---",
    "",
  )
  const parts = [...headerLines]
  parts.push("")
  parts.push(buildZonenuebersicht(allRoomResults, project.usageUnits, storeyOf))
  parts.push("")
  parts.push("---")
  parts.push("")

  if (includeRoomPages) {
    let idx = 0
    for (const unit of project.usageUnits) {
      for (const room of unit.rooms) {
        idx += 1
        const roomResult = allRoomResults[idx - 1]
        const pageLabel = `REG-${room.id}`
        const totalPages = allRoomResults.length + 1
        parts.push(
          buildRoomSection(roomResult, pageLabel, idx, totalPages, storeyOf(room)),
        )
        parts.push("")
        parts.push("---")
        parts.push("")
      }
    }
  }

  parts.push("")
  const unitTotalsList: [number, number, number][] = []
  let totalPhiT = 0
  let totalPhiV = 0
  let totalPhiHl = 0
  let resultIdx = 0
  for (const unit of project.usageUnits) {
    const unitRoomResults = allRoomResults.slice(
      resultIdx,
      resultIdx + unit.rooms.length,
    )
    resultIdx += unit.rooms.length
    const totals = computeUsageUnitTotals(unitRoomResults)
    unitTotalsList.push(totals)
    totalPhiT += totals[0]
    totalPhiV += totals[1]
    totalPhiHl += totals[2]
  }
  if (project.usageUnits.length > 0) {
    parts.push(
      buildErgebniszusammenstellung(
        project.usageUnits,
        unitTotalsList,
        totalPhiT,
        totalPhiV,
        totalPhiHl,
      ),
    )
    parts.push("")
  }

  return parts.join("\n").trim()
}
