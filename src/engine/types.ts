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

/**
 * Energieträger der Wärmeerzeugung. Bestimmt Primärenergiefaktor,
 * CO₂-Emissionsfaktor und einen typischen Anlagennutzungsgrad
 * (bei Wärmepumpen die Jahresarbeitszahl > 1).
 */
export type EnergyCarrier =
  | "gas"
  | "oel"
  | "fernwaerme"
  | "waermepumpe"
  | "pellets"
  | "nachtspeicher"

export const ENERGY_CARRIERS: EnergyCarrier[] = [
  "gas",
  "oel",
  "fernwaerme",
  "waermepumpe",
  "pellets",
  "nachtspeicher",
]

/**
 * Parameter der orientierenden Jahresenergiebilanz (kein zertifizierter
 * DIN-V-18599-Nachweis). Transparentes Gradtagzahl-Verfahren.
 */
export interface EnergyParams {
  /** Gradtagzahl G_t [Kd/a] (Standort-/Klimakennwert). */
  gradtagzahlKd: number
  /** Beheizte Wohnfläche A_N [m²]; null ⇒ aus Räumen abgeleitet. */
  aHeatedM2Override: number | null
  /** Trinkwarmwasser-Nutzenergiebedarf [kWh/(m²·a)]. */
  dhwKwhM2a: number
  /** Anrechenbare interne + solare Gewinne [kWh/(m²·a)]. */
  gainsKwhM2a: number
  /** Ausnutzungsgrad der Gewinne η (0…1). */
  gainUtilisation: number
  /** Energieträger der Wärmeerzeugung. */
  carrier: EnergyCarrier
  /**
   * Anlagennutzungsgrad e_ges (Erzeugung × Verteilung × Übergabe);
   * bei Wärmepumpen die Jahresarbeitszahl (> 1).
   */
  systemEfficiency: number
  /** Energiepreis [ct/kWh Endenergie] für die Kostenabschätzung. */
  energyPriceCtKwh: number
}

export function defaultEnergyParams(): EnergyParams {
  return {
    gradtagzahlKd: 3500,
    aHeatedM2Override: null,
    dhwKwhM2a: 12.5,
    gainsKwhM2a: 30,
    gainUtilisation: 0.95,
    carrier: "gas",
    systemEfficiency: 0.9,
    energyPriceCtKwh: 12,
  }
}

/** Eine im Fahrplan ausgewählte Sanierungsmaßnahme. */
export interface RenovationMeasureSelection {
  /** Eindeutige Auswahl-ID (mehrfache Auswahl desselben Presets erlaubt). */
  id: string
  /** Referenz auf das MeasurePreset (siehe engine/measures.ts). */
  presetId: string
  /** Editierbarer Ziel-U-Wert [W/(m²K)]. */
  targetUValue: number
  /** Umsetzungsjahr (Phase im Fahrplan). */
  year: number
  enabled: boolean
}

export interface RenovationScenario {
  measures: RenovationMeasureSelection[]
}

export function defaultRenovation(): RenovationScenario {
  return { measures: [] }
}

/** Sanierungsziel, das die Priorisierung der Maßnahmen steuert. */
export type SanierungsZiel = "kosten" | "co2" | "komfort"
/** Umsetzungstempo: alles auf einmal oder über mehrere Jahre verteilt. */
export type SanierungsTempo = "einmal" | "schrittweise"

/** Antworten des Fragebogens für den automatischen Fahrplan-Vorschlag. */
export interface RecommendationInput {
  ziel: SanierungsZiel
  tempo: SanierungsTempo
  /** Zeithorizont in Jahren (nur bei "schrittweise"). */
  horizonYears: number
  /** Heizungstausch auf Wärmepumpe geplant ⇒ Hülle zuerst. */
  waermepumpeGeplant: boolean
  /** Ausgeschlossene Maßnahmen (bereits erledigt oder nicht möglich). */
  excludedPresetIds: string[]
}

export function defaultRecommendationInput(): RecommendationInput {
  return {
    ziel: "kosten",
    tempo: "schrittweise",
    horizonYears: 10,
    waermepumpeGeplant: false,
    excludedPresetIds: [],
  }
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
