/**
 * Testhilfen: Ergebnis-Dump in der Struktur der Referenz-Fixtures
 * (tests/fixtures/*.results.json), für den 1:1-Vergleich.
 */
import { computeProject } from "@/engine/calc"
import {
  aFloorM2,
  effectiveNMinH1,
  effectiveThetaIC,
  hIM,
  storeyForRoom,
  thetaDesignC,
  vIM3,
} from "@/engine/derive"
import type { CalculationParams, Project } from "@/engine/types"

/** Normalisiert -0 zu 0 (JSON.parse("-0.0") ergibt -0, toEqual unterscheidet). */
export function normalize(value: unknown): unknown {
  if (typeof value === "number") return value === 0 ? 0 : value
  if (Array.isArray(value)) return value.map(normalize)
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, normalize(v)]),
    )
  }
  return value
}

export function dumpResults(project: Project, params: CalculationParams) {
  const results = computeProject(project, params)
  return {
    theta_e_c: params.thetaEC,
    units: results.unitResults.map((ur) => ({
      number: ur.unit.number,
      name: ur.unit.name,
      phi_t_w: ur.phiTW,
      phi_v_w: ur.phiVW,
      phi_hl_w: ur.phiHlW,
      rooms: ur.roomResults.map((res) => {
        const room = res.room
        const storey = storeyForRoom(room, project)
        return {
          id: room.id,
          name: room.name,
          floor: room.floor,
          a_floor_m2: aFloorM2(room),
          h_i_m: hIM(room, storey),
          v_i_m3: vIM3(room, storey),
          effective_theta_i_c: effectiveThetaIC(room),
          theta_design_c: thetaDesignC(room),
          effective_n_min_h1: effectiveNMinH1(room),
          q_v_min_m3h: res.qVMinM3h,
          phi_t_stand_w: res.phiTStandW,
          phi_v_stand_w: res.phiVStandW,
          phi_hl_w: res.phiHlW,
          components: res.componentResults.map((cr) => ({
            orientation: cr.effectiveOrientation ?? cr.component.orientation,
            component_type: cr.component.componentType,
            label: cr.component.label,
            effective_brutto_m2: cr.effectiveBruttoM2,
            effective_abzug_m2: cr.effectiveAbzugM2,
            a_k_m2: cr.aKM2,
            f_ix: cr.fIx,
            u_corrected: cr.uCorrected,
            theta_adjacent_c: cr.component.thetaAdjacentC,
            adjacent: cr.component.adjacent,
            phi_t_k_w: cr.phiTKW,
            is_opening: cr.effectiveOrientation !== null,
          })),
        }
      }),
    })),
    building: {
      phi_t_w: results.totalPhiTW,
      phi_v_w: results.totalPhiVW,
      phi_hl_w: results.totalPhiHlW,
    },
  }
}
