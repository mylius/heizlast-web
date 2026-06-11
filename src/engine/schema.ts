/**
 * JSON-Projektformat, kompatibel zum Python-CLI (heizlastrechner project.json).
 *
 * Der Parser repliziert die Eigenheiten von heizlastrechner/app/cli_core.py:
 * - Geschoss wird nur angehängt, wenn der Raum kein eigenes storey_height_m hat
 *   und floor einer Geschoss-ID entspricht
 * - room_type fällt auf den Raumnamen zurück
 * - Öffnungen werden mit reduziertem Feldsatz gelesen (Orientierung N,
 *   grenzt an "e" erzwungen)
 * - length_height_m: null → 0 (in der Berechnung gleichwertig)
 *
 * Der Serializer schreibt nur Geschoss-Felder, die der Python-Parser liest;
 * Geschosse mit nicht abbildbaren Einstellungen (addDefault* = false,
 * abweichende de/fb-Adjacency, deFIx) werden aufgelöst: betroffene Räume
 * erhalten explizite Höhe/Deckendicke und materialisierte DE/FB-Bauteile,
 * damit die Datei im Python-CLI identisch rechnet.
 */
import * as z from "zod"

import { parseRoomType } from "./defaults"
import {
  aFloorM2,
  effectiveComponents,
  storeyForRoom,
} from "./derive"
import {
  COMPONENT_TYPES,
  DEFAULT_THETA_E_C,
  ORIENTATIONS,
  makeComponent,
  makeRoom,
  makeStorey,
  type BuildingComponent,
  type Project,
  type Room,
  type Storey,
} from "./types"

const orientationSchema = z.enum(ORIENTATIONS as [string, ...string[]])
const componentTypeSchema = z.enum(COMPONENT_TYPES as [string, ...string[]])
const adjacentSchema = z.enum(["ij", "e"])

const openingWireSchema = z.object({
  component_type: componentTypeSchema,
  label: z.string().optional(),
  brutto_m2: z.number().optional(),
  theta_adjacent_c: z.number().optional(),
  f_ix: z.number().nullable().optional(),
  u_value: z.number().optional(),
  delta_u_tb: z.number().optional(),
})

const componentWireSchema = z.object({
  orientation: orientationSchema,
  component_type: componentTypeSchema,
  label: z.string().optional(),
  width_m: z.number().optional(),
  length_height_m: z.number().nullable().optional(),
  brutto_m2: z.number().optional(),
  abzug_m2: z.number().optional(),
  openings: z.array(openingWireSchema).optional(),
  adjacent: adjacentSchema.optional(),
  theta_adjacent_c: z.number().optional(),
  f_ix: z.number().nullable().optional(),
  u_value: z.number(),
  delta_u_tb: z.number().optional(),
})

const roomWireSchema = z.object({
  id: z.string(),
  name: z.string(),
  floor: z.string(),
  room_width_m: z.number(),
  room_length_m: z.number(),
  room_type: z.string().nullable().optional(),
  storey_height_m: z.number().nullable().optional(),
  ceiling_thickness_m: z.number().nullable().optional(),
  theta_i_c: z.number().nullable().optional(),
  n_min_h1: z.number().nullable().optional(),
  q_v_env_min_m3h: z.number().nullable().optional(),
  heating_up_allowance_w: z.number().nullable().optional(),
  components: z.array(componentWireSchema).optional(),
})

const storeyWireSchema = z.object({
  id: z.string(),
  storey_height_m: z.number(),
  ceiling_thickness_m: z.number().optional(),
  fb_theta_adjacent_c: z.number().optional(),
  fb_u_value: z.number().optional(),
  fb_f_ix: z.number().optional(),
  de_theta_adjacent_c: z.number().optional(),
  de_u_value: z.number().optional(),
})

export const projectWireSchema = z.object({
  project_id: z.string().optional(),
  description: z.string().optional(),
  address: z.string().nullable().optional(),
  theta_e_c: z.number().optional(),
  storeys: z.array(storeyWireSchema).optional(),
  usage_units: z
    .array(
      z.object({
        number: z.number(),
        name: z.string(),
        rooms: z.array(roomWireSchema).optional(),
      }),
    )
    .optional(),
})

export type ProjectWire = z.infer<typeof projectWireSchema>
type ComponentWire = z.infer<typeof componentWireSchema>
type RoomWire = z.infer<typeof roomWireSchema>

function parseOpening(o: z.infer<typeof openingWireSchema>): BuildingComponent {
  return makeComponent({
    orientation: "N",
    componentType: o.component_type as BuildingComponent["componentType"],
    label: o.label ?? "",
    bruttoM2: o.brutto_m2 ?? 0,
    adjacent: "e",
    thetaAdjacentC: o.theta_adjacent_c ?? DEFAULT_THETA_E_C,
    fIx: o.f_ix ?? null,
    uValue: o.u_value ?? 0,
    deltaUTb: o.delta_u_tb ?? 0,
  })
}

function parseComponent(c: ComponentWire): BuildingComponent {
  return makeComponent({
    orientation: c.orientation as BuildingComponent["orientation"],
    componentType: c.component_type as BuildingComponent["componentType"],
    label: c.label ?? "",
    widthM: c.width_m ?? 0,
    // Python: None → 0.0 (in Berechnung und Anzeige gleichwertig)
    lengthHeightM: c.length_height_m ?? 0,
    bruttoM2: c.brutto_m2 ?? 0,
    abzugM2: c.abzug_m2 ?? 0,
    openings: (c.openings ?? []).map(parseOpening),
    adjacent: (c.adjacent ?? "e") as BuildingComponent["adjacent"],
    thetaAdjacentC: c.theta_adjacent_c ?? DEFAULT_THETA_E_C,
    fIx: c.f_ix ?? null,
    uValue: c.u_value,
    deltaUTb: c.delta_u_tb ?? 0,
  })
}

function parseRoom(d: RoomWire, storeys: Record<string, Storey>): Room {
  const sh = d.storey_height_m ?? null
  const hasStorey = storeys[d.floor] !== undefined && sh === null
  return makeRoom({
    id: d.id,
    name: d.name,
    floor: d.floor,
    roomWidthM: d.room_width_m,
    roomLengthM: d.room_length_m,
    roomType: parseRoomType(d.room_type || d.name),
    storeyHeightM: sh,
    ceilingThicknessM: d.ceiling_thickness_m ?? null,
    storeyId: hasStorey ? d.floor : null,
    thetaIC: d.theta_i_c ?? null,
    nMinH1: d.n_min_h1 ?? null,
    qVEnvMinM3h: d.q_v_env_min_m3h ?? null,
    heatingUpAllowanceW: d.heating_up_allowance_w ?? null,
    components: (d.components ?? []).map(parseComponent),
  })
}

/** Projekt aus Wire-JSON parsen. Wirft ZodError bei ungültigen Daten. */
export function parseProjectJson(data: unknown): Project {
  const wire = projectWireSchema.parse(data)
  const storeys: Record<string, Storey> = {}
  for (const s of wire.storeys ?? []) {
    storeys[s.id] = makeStorey({
      id: s.id,
      storeyHeightM: s.storey_height_m,
      ceilingThicknessM: s.ceiling_thickness_m ?? 0.2,
      fbThetaAdjacentC: s.fb_theta_adjacent_c ?? 10.0,
      fbUValue: s.fb_u_value ?? 1.6,
      fbFIx: s.fb_f_ix ?? 0.33,
      deThetaAdjacentC: s.de_theta_adjacent_c ?? 20.0,
      deUValue: s.de_u_value ?? 0.97,
    })
  }
  return {
    projectId: wire.project_id ?? "",
    description: wire.description ?? "",
    address: wire.address ?? "",
    storeys,
    usageUnits: (wire.usage_units ?? []).map((u) => ({
      number: u.number,
      name: u.name,
      rooms: (u.rooms ?? []).map((r) => parseRoom(r, storeys)),
    })),
  }
}

// ---------------------------------------------------------------------------
// Serialisierung
// ---------------------------------------------------------------------------

/**
 * Geschoss ist genau dann im Python-JSON-Format abbildbar, wenn nur Felder
 * abweichen, die der Python-Parser auch liest.
 */
function isStoreyPythonRepresentable(s: Storey): boolean {
  return (
    s.fbAdjacent === "e" &&
    s.deAdjacent === "ij" &&
    s.deFIx === null &&
    s.addDefaultDe &&
    s.addDefaultFb
  )
}

function serializeOpening(o: BuildingComponent): Record<string, unknown> {
  const out: Record<string, unknown> = {
    component_type: o.componentType,
  }
  if (o.label) out.label = o.label
  out.brutto_m2 = o.bruttoM2
  out.theta_adjacent_c = o.thetaAdjacentC
  if (o.fIx !== null) out.f_ix = o.fIx
  out.u_value = o.uValue
  if (o.deltaUTb !== 0) out.delta_u_tb = o.deltaUTb
  return out
}

function serializeComponent(c: BuildingComponent): Record<string, unknown> {
  const out: Record<string, unknown> = {
    orientation: c.orientation,
    component_type: c.componentType,
  }
  if (c.label) out.label = c.label
  if (c.widthM) out.width_m = c.widthM
  if (c.lengthHeightM) out.length_height_m = c.lengthHeightM
  if (c.bruttoM2) out.brutto_m2 = c.bruttoM2
  if (c.abzugM2 && c.openings.length === 0) out.abzug_m2 = c.abzugM2
  if (c.openings.length > 0) out.openings = c.openings.map(serializeOpening)
  out.adjacent = c.adjacent
  out.theta_adjacent_c = c.thetaAdjacentC
  if (c.fIx !== null) out.f_ix = c.fIx
  out.u_value = c.uValue
  if (c.deltaUTb !== 0) out.delta_u_tb = c.deltaUTb
  return out
}

function serializeRoom(
  r: Room,
  project: Project,
  materialize: boolean,
): Record<string, unknown> {
  const storey = storeyForRoom(r, project)
  const out: Record<string, unknown> = {
    id: r.id,
    name: r.name,
    floor: r.floor,
    room_width_m: r.roomWidthM,
    room_length_m: r.roomLengthM,
  }
  if (r.roomType !== null) out.room_type = r.roomType
  let components = r.components
  if (materialize && storey !== undefined) {
    // Geschoss nicht Python-abbildbar: Raum vom Geschoss lösen und
    // effektive DE/FB-Bauteile explizit ausschreiben
    out.storey_height_m = r.storeyHeightM ?? storey.storeyHeightM
    out.ceiling_thickness_m = r.ceilingThicknessM ?? storey.ceilingThicknessM
    components = effectiveComponents(r, storey).map((ec) => ec.component)
  } else {
    if (r.storeyHeightM !== null) {
      out.storey_height_m = r.storeyHeightM
    } else if (r.storeyId === null && project.storeys[r.floor] !== undefined) {
      // Raum ist bewusst vom Geschoss gelöst, floor kollidiert aber mit einer
      // Geschoss-ID: explizite Höhe schreiben, sonst würde der Python-Parser
      // das Geschoss wieder anhängen
      out.storey_height_m = 0
    }
    if (r.ceilingThicknessM !== null)
      out.ceiling_thickness_m = r.ceilingThicknessM
  }
  if (r.thetaIC !== null) out.theta_i_c = r.thetaIC
  if (r.nMinH1 !== null) out.n_min_h1 = r.nMinH1
  if (r.qVEnvMinM3h !== null) out.q_v_env_min_m3h = r.qVEnvMinM3h
  if (r.heatingUpAllowanceW !== null)
    out.heating_up_allowance_w = r.heatingUpAllowanceW
  out.components = components.map(serializeComponent)
  return out
}

/**
 * Projekt als Python-CLI-kompatibles JSON serialisieren.
 * `thetaEC` wird als zusätzlicher Top-Level-Schlüssel mitgeschrieben
 * (vom Python-Parser ignoriert, von der Web-App beim Laden gelesen).
 */
export function serializeProjectJson(
  project: Project,
  thetaEC?: number,
): ProjectWire {
  const materializeStoreyIds = new Set(
    Object.values(project.storeys)
      .filter((s) => !isStoreyPythonRepresentable(s))
      .map((s) => s.id),
  )
  const out: Record<string, unknown> = {
    project_id: project.projectId,
    description: project.description,
  }
  if (project.address) out.address = project.address
  if (thetaEC !== undefined) out.theta_e_c = thetaEC
  const storeys = Object.values(project.storeys)
    .filter((s) => !materializeStoreyIds.has(s.id))
    .map((s) => ({
      id: s.id,
      storey_height_m: s.storeyHeightM,
      ceiling_thickness_m: s.ceilingThicknessM,
      fb_theta_adjacent_c: s.fbThetaAdjacentC,
      fb_u_value: s.fbUValue,
      fb_f_ix: s.fbFIx,
      de_theta_adjacent_c: s.deThetaAdjacentC,
      de_u_value: s.deUValue,
    }))
  if (storeys.length > 0) out.storeys = storeys
  out.usage_units = project.usageUnits.map((u) => ({
    number: u.number,
    name: u.name,
    rooms: u.rooms.map((r) =>
      serializeRoom(
        r,
        project,
        r.storeyId !== null && materializeStoreyIds.has(r.storeyId),
      ),
    ),
  }))
  return out as ProjectWire
}
