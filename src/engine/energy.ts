/**
 * Orientierende Jahresenergiebilanz für den Sanierungsfahrplan.
 *
 * WICHTIG: Dies ist eine transparente, vereinfachte Abschätzung nach dem
 * Gradtagzahl-Verfahren — KEIN zertifizierter DIN-V-18599-Nachweis und keine
 * Grundlage für einen rechtskräftigen iSFP. Sie nutzt dieselben Bauteil- und
 * Lüftungsdaten wie die Heizlastberechnung (DIN EN 12831-1).
 *
 *   H_T = Σ A_k · U_korr · f_ix            [W/K]   (Transmission)
 *   H_V = Σ Φ_V,i / (θ_i − θ_e)            [W/K]   (Lüftung, aus der Heizlast)
 *   Q_h = (H_T + H_V) · G_t · 24/1000 − η·Q_gewinne   [kWh/a]
 *   Endenergie   = (Q_h + Q_w) / e_ges
 *   Primärenergie = Endenergie · f_P
 *   CO₂          = Endenergie · g_CO2
 */
import { computeProject, getEffectiveComponentAreas } from "./calc"
import {
  aFloorM2,
  effectiveComponents,
  effectiveFIx,
  storeyForRoom,
  thetaDesignC,
  uCorrected,
} from "./derive"
import type {
  CalculationParams,
  EnergyCarrier,
  EnergyParams,
  Project,
} from "./types"

/** Primärenergiefaktor f_P je Energieträger (GEG-nahe Richtwerte). */
export const PRIMARY_ENERGY_FACTOR: Record<EnergyCarrier, number> = {
  gas: 1.1,
  oel: 1.1,
  fernwaerme: 0.7,
  waermepumpe: 1.8, // bezogen auf den Stromeinsatz
  pellets: 0.2,
  nachtspeicher: 1.8, // Strom
}

/** CO₂-Emissionsfaktor [kg/kWh Endenergie] je Energieträger. */
export const CO2_FACTOR_KG_PER_KWH: Record<EnergyCarrier, number> = {
  gas: 0.201,
  oel: 0.266,
  fernwaerme: 0.15,
  waermepumpe: 0.38, // Strommix
  pellets: 0.025,
  nachtspeicher: 0.38, // Strommix
}

/** Typischer Anlagennutzungsgrad / JAZ je Energieträger (Default-Vorschlag). */
export const DEFAULT_SYSTEM_EFFICIENCY: Record<EnergyCarrier, number> = {
  gas: 0.9,
  oel: 0.85,
  fernwaerme: 0.95,
  waermepumpe: 3.2, // Jahresarbeitszahl
  pellets: 0.85,
  nachtspeicher: 1.0, // direkte Stromheizung
}

/** Typischer Energiepreis [ct/kWh Endenergie] je Energieträger (Default). */
export const DEFAULT_ENERGY_PRICE_CT_KWH: Record<EnergyCarrier, number> = {
  gas: 12,
  oel: 12,
  fernwaerme: 14,
  waermepumpe: 30, // Strom
  pellets: 9,
  nachtspeicher: 26, // (Nacht-)Stromtarif
}

export const ENERGY_CARRIER_LABELS: Record<EnergyCarrier, string> = {
  gas: "Gas-Brennwert",
  oel: "Öl",
  fernwaerme: "Fernwärme",
  waermepumpe: "Wärmepumpe",
  pellets: "Holzpellets",
  nachtspeicher: "Nachtspeicheröfen (Strom)",
}

/**
 * Transmissions-Wärmetransferkoeffizient H_T [W/K] = Σ A_k · U_korr · f_ix
 * über alle (effektiven) Bauteile aller Räume — temperaturunabhängig.
 */
export function transmissionTransferW_K(project: Project): number {
  let ht = 0
  for (const unit of project.usageUnits) {
    for (const room of unit.rooms) {
      const storey = storeyForRoom(room, project)
      for (const { component } of effectiveComponents(room, storey)) {
        const [, , aK] = getEffectiveComponentAreas(component, room, storey)
        ht += aK * uCorrected(component) * effectiveFIx(component)
        for (const op of component.openings) {
          const [, , aKo] = getEffectiveComponentAreas(op, room, storey)
          ht += aKo * uCorrected(op) * effectiveFIx(op)
        }
      }
    }
  }
  return ht
}

/**
 * Lüftungs-Wärmetransferkoeffizient H_V [W/K], abgeleitet aus den
 * Standard-Lüftungsverlusten der Heizlast: H_V,i = Φ_V,i / (θ_i − θ_e).
 */
export function ventilationTransferW_K(
  project: Project,
  params: CalculationParams,
): number {
  const results = computeProject(project, params)
  let hv = 0
  for (const ur of results.unitResults) {
    for (const rr of ur.roomResults) {
      const dTheta = thetaDesignC(rr.room) - params.thetaEC
      if (dTheta > 0) hv += rr.phiVStandW / dTheta
    }
  }
  return hv
}

/** Beheizte Wohnfläche A_N [m²]: Override oder Σ Raumflächen. */
export function heatedAreaM2(project: Project, energy: EnergyParams): number {
  if (energy.aHeatedM2Override !== null) return energy.aHeatedM2Override
  let a = 0
  for (const unit of project.usageUnits) {
    for (const room of unit.rooms) a += aFloorM2(room)
  }
  return a
}

export interface EnergyResult {
  /** Beheizte Fläche A_N [m²]. */
  aHeatedM2: number
  /** Transmissions-Transferkoeffizient [W/K]. */
  htW_K: number
  /** Lüftungs-Transferkoeffizient [W/K]. */
  hvW_K: number
  /** Spezifischer Transmissionswärmeverlust H_T' = H_T / A_Hüll … hier / A_N [W/(m²K)]. */
  htSpecificW_M2K: number
  /** Jahres-Heizwärmebedarf Q_h [kWh/a]. */
  qHeatKwh: number
  /** Trinkwarmwasser-Bedarf Q_w [kWh/a]. */
  qWaterKwh: number
  /** Endenergiebedarf [kWh/a]. */
  endenergieKwh: number
  /** Primärenergiebedarf [kWh/a]. */
  primaerenergieKwh: number
  /** Spezifischer Primärenergiebedarf [kWh/(m²·a)]. */
  primaerSpecificKwhM2a: number
  /** CO₂-Emissionen [kg/a]. */
  co2Kg: number
  /** Jährliche Energiekosten [€/a]. */
  energieKostenEur: number
  /** Orientierende Effizienzhaus-Einordnung (z.B. "EH 70", "Bestand"). */
  effizienzhaus: string
}

/**
 * Orientierende Effizienzhaus-Stufe über den spezifischen Primärenergiebedarf.
 * Bewusst vereinfacht (keine Referenzgebäudeberechnung nach GEG).
 */
export function effizienzhausEstimate(primaerSpecificKwhM2a: number): string {
  const q = primaerSpecificKwhM2a
  if (q <= 30) return "EH 40"
  if (q <= 45) return "EH 55"
  if (q <= 60) return "EH 70"
  if (q <= 85) return "EH 85"
  if (q <= 110) return "EH 100"
  if (q <= 160) return "EH 115"
  return "Bestand (unsaniert)"
}

/** Vollständige orientierende Energiebilanz eines Projekts. */
export function computeEnergy(
  project: Project,
  params: CalculationParams,
  energy: EnergyParams,
): EnergyResult {
  const aHeatedM2 = heatedAreaM2(project, energy)
  const htW_K = transmissionTransferW_K(project)
  const hvW_K = ventilationTransferW_K(project, params)

  // Q_h = (H_T + H_V) · G_t · 24h / 1000 − η · Gewinne   [kWh/a]
  const losses = ((htW_K + hvW_K) * energy.gradtagzahlKd * 24) / 1000
  const gains = energy.gainUtilisation * energy.gainsKwhM2a * aHeatedM2
  const qHeatKwh = Math.max(0, losses - gains)

  const qWaterKwh = energy.dhwKwhM2a * aHeatedM2

  const eff = energy.systemEfficiency > 0 ? energy.systemEfficiency : 1
  const endenergieKwh = (qHeatKwh + qWaterKwh) / eff
  const primaerenergieKwh =
    endenergieKwh * PRIMARY_ENERGY_FACTOR[energy.carrier]
  const co2Kg = endenergieKwh * CO2_FACTOR_KG_PER_KWH[energy.carrier]
  const energieKostenEur = (endenergieKwh * energy.energyPriceCtKwh) / 100

  const primaerSpecificKwhM2a =
    aHeatedM2 > 0 ? primaerenergieKwh / aHeatedM2 : 0
  const htSpecificW_M2K = aHeatedM2 > 0 ? htW_K / aHeatedM2 : 0

  return {
    aHeatedM2,
    htW_K,
    hvW_K,
    htSpecificW_M2K,
    qHeatKwh,
    qWaterKwh,
    endenergieKwh,
    primaerenergieKwh,
    primaerSpecificKwhM2a,
    co2Kg,
    energieKostenEur,
    effizienzhaus: effizienzhausEstimate(primaerSpecificKwhM2a),
  }
}
