/**
 * Datenmodell für die Heizlastberechnung nach DIN EN 12831,
 * angelehnt an das offizielle RAUMHEIZLAST-Formular.
 *
 * Alle Strukturen sind reine, serialisierbare Daten; Raum→Geschoss ist über
 * `storeyId` referenziert statt über Objektreferenzen.
 */

export type Orientation = "N" | "S" | "E" | "W" | "O" | "H"

export type ComponentType =
  | "AW" // Außenwand
  | "AF" // Außenfenster
  | "IW" // Innenwand
  | "IT" // Innentür
  | "AT" // Außentür / Haustür
  | "DE" // Decke
  | "DA" // Dachschräge
  | "DF" // Dachfenster
  | "FB" // Bodenplatte / Fußboden
  | "HTW" // Haustrennwand (DHH)
  | "BA" // Boden gegen Außenluft

export type AdjacentType = "ij" | "e"

export type RoomType =
  | "Wohnraum"
  | "Schlafen"
  | "Bad"
  | "Küche"
  | "Abstellraum"
  | "Flur"
  | "WC"
  | "Keller"
  | "Dach"
  | "Essen"

export const ORIENTATIONS: Orientation[] = ["N", "S", "E", "W", "O", "H"]

export const COMPONENT_TYPES: ComponentType[] = [
  "AW",
  "AF",
  "IW",
  "IT",
  "AT",
  "DE",
  "DA",
  "DF",
  "FB",
  "HTW",
  "BA",
]

export const ROOM_TYPES: RoomType[] = [
  "Wohnraum",
  "Schlafen",
  "Bad",
  "Küche",
  "Abstellraum",
  "Flur",
  "WC",
  "Keller",
  "Dach",
  "Essen",
]

export interface BuildingComponent {
  orientation: Orientation
  componentType: ComponentType
  label: string
  widthM: number
  /** null (oder 0) bei Wänden ⇒ Raumhöhe wird zur Berechnungszeit verwendet */
  lengthHeightM: number | null
  bruttoM2: number
  abzugM2: number
  /** Fenster/Türen in diesem Bauteil; Abzug = Summe ihrer Flächen */
  openings: BuildingComponent[]
  adjacent: AdjacentType
  thetaAdjacentC: number
  /**
   * Temperaturanpassungsfaktor; null ⇒ abgeleitet (0 intern, 1 extern).
   * DIN-Konvention: ENTWEDER tatsächliche Nachbartemperatur mit f_ix = 1/null,
   * ODER θ_adj = θ_e mit Normfaktor f_x = (θ_i−θ_u)/(θ_i−θ_e) — nie beides.
   */
  fIx: number | null
  uValue: number
  deltaUTb: number
}

export interface Storey {
  id: string
  storeyHeightM: number
  ceilingThicknessM: number
  // Defaults für Fußboden (FB)
  fbThetaAdjacentC: number
  fbUValue: number
  fbFIx: number
  fbAdjacent: AdjacentType
  // Defaults für Decke (DE)
  deThetaAdjacentC: number
  deUValue: number
  deFIx: number | null
  deAdjacent: AdjacentType
  addDefaultDe: boolean
  addDefaultFb: boolean
}

export interface Room {
  id: string
  name: string
  floor: string
  roomWidthM: number
  roomLengthM: number
  roomType: RoomType | null
  storeyHeightM: number | null
  ceilingThicknessM: number | null
  /** Referenz auf Geschoss für vererbte Höhe/Defaults */
  storeyId: string | null
  thetaIC: number | null
  deltaThetaComfortK: number
  nMinH1: number | null
  qVEnvMinM3h: number | null
  heatingUpAllowanceW: number | null
  components: BuildingComponent[]
}

export interface UsageUnit {
  number: number
  name: string
  rooms: Room[]
}

export interface Project {
  projectId: string
  description: string
  address: string
  storeys: Record<string, Storey>
  usageUnits: UsageUnit[]
}

export interface CalculationParams {
  /** Auslegungs-Außentemperatur θ_e [°C] */
  thetaEC: number
  /** Luft: ρ·c_p [Wh/(m³K)] für Φ_V = q_V · ρc_p · Δθ */
  rhoCpAirWhM3k: number
  /**
   * Luftdichtheit n₅₀ [1/h] (Luftwechsel bei 50 Pa) für die
   * Infiltrationsberechnung. null = Infiltration nicht berücksichtigt
   * (dann gilt nur der hygienische Mindestluftwechsel).
   */
  n50?: number | null
  /** Höhenkorrekturfaktor ε der Infiltration; Standard 1,0. */
  epsilon?: number
  /** Lüftungsanlage mit Wärmerückgewinnung vorhanden. */
  withWrg?: boolean
  /** Wärmerückgewinnungsgrad η (0…1). */
  wrgEta?: number
}

export const DEFAULT_THETA_E_C = -10.3

export function defaultParams(): CalculationParams {
  return {
    thetaEC: DEFAULT_THETA_E_C,
    rhoCpAirWhM3k: 0.34,
    n50: null,
    epsilon: 1.0,
    withWrg: false,
    wrgEta: 0.8,
  }
}

export function makeComponent(
  init: Partial<BuildingComponent> &
    Pick<BuildingComponent, "orientation" | "componentType">,
): BuildingComponent {
  return {
    label: "",
    widthM: 0,
    lengthHeightM: 0,
    bruttoM2: 0,
    abzugM2: 0,
    openings: [],
    adjacent: "e",
    thetaAdjacentC: DEFAULT_THETA_E_C,
    fIx: null,
    uValue: 0,
    deltaUTb: 0,
    ...init,
  }
}

export function makeStorey(
  init: Partial<Storey> & Pick<Storey, "id" | "storeyHeightM">,
): Storey {
  return {
    ceilingThicknessM: 0.2,
    fbThetaAdjacentC: 10.0,
    fbUValue: 1.6,
    // Konvention: θ ist die TATSÄCHLICHE Nachbartemperatur, daher f_ix = 1
    // (f_ix < 1 zusätzlich zur tatsächlichen Temperatur würde doppelt mindern)
    fbFIx: 1.0,
    fbAdjacent: "e",
    deThetaAdjacentC: 20.0,
    deUValue: 0.97,
    deFIx: null,
    deAdjacent: "ij",
    addDefaultDe: true,
    addDefaultFb: true,
    ...init,
  }
}

export function makeRoom(
  init: Partial<Room> &
    Pick<Room, "id" | "name" | "floor" | "roomWidthM" | "roomLengthM">,
): Room {
  return {
    roomType: null,
    storeyHeightM: null,
    ceilingThicknessM: null,
    storeyId: null,
    thetaIC: null,
    deltaThetaComfortK: 0,
    nMinH1: null,
    qVEnvMinM3h: null,
    heatingUpAllowanceW: null,
    components: [],
    ...init,
  }
}
