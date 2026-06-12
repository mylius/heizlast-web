/**
 * Bauteil-Vorlagen (Presets) mit typischen U-Werten nach Baualtersklasse.
 *
 * Portierung von heizlastrechner/components.py als Datenkatalog. Jedes Preset
 * trägt einen Namen und einen Hinweis, wann es angemessen ist. Die mit
 * `extension: true` markierten Presets existieren nur in der Web-App
 * (Erweiterung gegenüber dem Python-Skript).
 */
import {
  DEFAULT_THETA_E_C,
  makeComponent,
  type AdjacentType,
  type BuildingComponent,
  type ComponentType,
  type Orientation,
} from "./types"

export type Era = "altbau" | "wschvo77" | "modern" | "passivhaus" | "neutral"

export const ERA_LABELS: Record<Era, string> = {
  altbau: "Altbau (vor 1977)",
  wschvo77: "WSchVO 1977–1995",
  modern: "Modern (EnEV/GEG)",
  passivhaus: "Passivhaus",
  neutral: "Baujahr-unabhängig",
}

export interface ComponentPreset {
  id: string
  name: string
  /** Wann ist dieses Preset angemessen? (für Tooltips/Auswahlhilfen) */
  hint: string
  era: Era
  componentType: ComponentType
  label: string
  uValue: number
  deltaUTb: number
  adjacent: AdjacentType
  thetaAdjacentC: number
  fIx: number | null
  /** Nur in der Web-App, nicht im Python-Skript vorhanden */
  extension?: boolean
}

// Außenbauteile tragen den pauschalen Wärmebrückenzuschlag ΔU_TB = 0,10
// W/(m²K) nach DIN/TS 12831-1 (ohne detaillierten Nachweis)
const ext = (p: Omit<ComponentPreset, "deltaUTb" | "adjacent" | "thetaAdjacentC" | "fIx"> & Partial<ComponentPreset>): ComponentPreset => ({
  deltaUTb: 0.1,
  adjacent: "e",
  thetaAdjacentC: DEFAULT_THETA_E_C,
  fIx: 1.0,
  ...p,
})

export const PRESETS: ComponentPreset[] = [
  // --- Außenwände
  ext({
    id: "AwAltbau",
    name: "Außenwand ungedämmt (Altbau)",
    hint: "Massive Wand ohne Dämmung, Baujahr vor 1977 (vor der ersten Wärmeschutzverordnung). Typisch für unsanierten Bestand. U = 1,40 W/(m²K).",
    era: "altbau",
    componentType: "AW",
    label: "AW (Altbau)",
    uValue: 1.4,
  }),
  ext({
    id: "AwWsvo1977",
    name: "Außenwand WSchVO 1977",
    hint: "Neubau ab November 1977 nach Wärmeschutzverordnung, leichte Dämmung. U = 1,00 W/(m²K).",
    era: "wschvo77",
    componentType: "AW",
    label: "AW (WSchVO 77)",
    uValue: 1.0,
  }),
  ext({
    id: "AwModern",
    name: "Außenwand nach GEG/EnEV (modern)",
    hint: "Neubaustandard ab EnEV 2002 bzw. GEG, oder Bestand mit nachträglichem Wärmedämmverbundsystem (WDVS). U = 0,24 W/(m²K).",
    era: "modern",
    componentType: "AW",
    label: "AW (GEG)",
    uValue: 0.24,
  }),
  ext({
    id: "AwPassivhaus",
    name: "Außenwand Passivhaus",
    hint: "Hochgedämmte Wand nach Passivhaus-Standard (≥ 24 cm Dämmung). U = 0,15 W/(m²K).",
    era: "passivhaus",
    componentType: "AW",
    label: "AW (Passivhaus)",
    uValue: 0.15,
    extension: true,
  }),
  // --- Außenfenster
  ext({
    id: "AfAltbau",
    name: "Außenfenster Altbau",
    hint: "Einfachverglasung oder altes Kastenfenster, vor 1977 / unsanierter Bestand. U = 2,80 W/(m²K).",
    era: "altbau",
    componentType: "AF",
    label: "AF (Altbau)",
    uValue: 2.8,
  }),
  ext({
    id: "AfModern",
    name: "Außenfenster modern (2-Scheiben)",
    hint: "2-Scheiben-Wärmeschutzverglasung, typisch für Fenstertausch ab ca. 1995 (EnEV/GEG). U = 1,05 W/(m²K).",
    era: "modern",
    componentType: "AF",
    label: "AF (modern)",
    uValue: 1.05,
  }),
  ext({
    id: "AfPassivhaus",
    name: "Außenfenster Passivhaus",
    hint: "3-Scheiben-Verglasung, hochwärmedämmender Rahmen (Passivhaus-Standard). U = 0,80 W/(m²K).",
    era: "passivhaus",
    componentType: "AF",
    label: "AF (Passivhaus)",
    uValue: 0.8,
  }),
  // --- Dach
  ext({
    id: "DachAltbau",
    name: "Dach ungedämmt (Altbau)",
    hint: "Dachschräge ungedämmt oder nur leicht gedämmt, vor 1977 bzw. älterer Bestand. U = 0,90 W/(m²K).",
    era: "altbau",
    componentType: "DA",
    label: "DA (Altbau)",
    uValue: 0.9,
  }),
  ext({
    id: "DachSparrendaemmung",
    name: "Dach mit Sparrendämmung",
    hint: "Zwischensparrendämmung, typisch für Nachrüstung ab WSchVO 1977 bis EnEV-Ära. U = 0,30 W/(m²K).",
    era: "wschvo77",
    componentType: "DA",
    label: "DA (Sparrendämmung)",
    uValue: 0.3,
  }),
  ext({
    id: "DachModern",
    name: "Dach nach GEG/EnEV (modern)",
    hint: "Aktueller Neubaustandard, z.B. Aufsparrendämmung. U = 0,20 W/(m²K).",
    era: "modern",
    componentType: "DA",
    label: "DA (GEG)",
    uValue: 0.2,
  }),
  // --- Dachfenster
  ext({
    id: "DfAltbau",
    name: "Dachfenster Altbau",
    hint: "Ältere Bauart, vor 1977 / unsanierter Bestand. U = 2,50 W/(m²K).",
    era: "altbau",
    componentType: "DF",
    label: "DF (Altbau)",
    uValue: 2.5,
  }),
  ext({
    id: "DfModern",
    name: "Dachfenster modern",
    hint: "Wärmedämmendes Dachfenster, EnEV-/GEG-typisch. U = 1,00 W/(m²K).",
    era: "modern",
    componentType: "DF",
    label: "DF (modern)",
    uValue: 1.0,
  }),
  // --- Boden gegen Außenluft
  ext({
    id: "BaAltbau",
    name: "Boden gegen Außenluft (Altbau)",
    hint: "Beheizte Fläche gegen Außenluft (z.B. Erker, Kriechkeller, auskragendes Geschoss), ungedämmt. U = 1,70 W/(m²K).",
    era: "altbau",
    componentType: "BA",
    label: "BA (Altbau)",
    uValue: 1.7,
  }),
  ext({
    id: "BaModern",
    name: "Boden gegen Außenluft (modern)",
    hint: "Mit Dämmung auf GEG-/EnEV-Niveau. U = 0,50 W/(m²K).",
    era: "modern",
    componentType: "BA",
    label: "BA (GEG)",
    uValue: 0.5,
  }),
  // --- Haustrennwand
  {
    id: "HtwGedaemmt",
    name: "Haustrennwand gedämmt",
    hint: "Trennwand zwischen zwei Wohneinheiten einer Doppelhaushälfte / eines Reihenhauses. Grenzt an den (möglicherweise unbeheizten) Nachbarn, daher mit reduzierter Nachbartemperatur 10,9 °C angesetzt. U = 0,30 W/(m²K).",
    era: "neutral",
    componentType: "HTW",
    label: "HTW (DHH)",
    uValue: 0.3,
    deltaUTb: 0,
    adjacent: "ij",
    thetaAdjacentC: 10.9,
    fIx: 1.0,
  },
  // --- Innenwand / Innentüren
  {
    id: "Iw",
    name: "Innenwand",
    hint: "Innenwand zwischen beheizten Räumen. Bei gleicher Temperatur beider Räume entsteht kein Verlust (f_ix automatisch 0); bei kühlerem Nachbarraum angrenzende Temperatur und f_ix anpassen. U = 3,19 W/(m²K).",
    era: "neutral",
    componentType: "IW",
    label: "IW",
    uValue: 3.19,
    deltaUTb: 0,
    adjacent: "ij",
    thetaAdjacentC: 20.0,
    fIx: null,
  },
  {
    id: "Innentuer",
    name: "Innentür (Standard)",
    hint: "Standard-Innentür zwischen beheizten Räumen. U = 2,00 W/(m²K).",
    era: "neutral",
    componentType: "IT",
    label: "IT",
    uValue: 2.0,
    deltaUTb: 0,
    adjacent: "ij",
    thetaAdjacentC: 20.0,
    fIx: null,
  },
  {
    id: "InnentuerGedaemmt",
    name: "Innentür gedämmt",
    hint: "Innentür mit besserer Wärmedämmung, z.B. zum unbeheizten Abstellraum oder Keller. U = 1,00 W/(m²K).",
    era: "neutral",
    componentType: "IT",
    label: "IT (gedämmt)",
    uValue: 1.0,
    deltaUTb: 0,
    adjacent: "ij",
    thetaAdjacentC: 20.0,
    fIx: null,
  },
  // --- Haustüren
  ext({
    id: "HaustuerAltbau",
    name: "Haustür Altbau",
    hint: "Alte Bauart, vor 1977 / unsanierter Bestand. U = 2,80 W/(m²K).",
    era: "altbau",
    componentType: "AT",
    label: "AT (Altbau)",
    uValue: 2.8,
  }),
  ext({
    id: "HaustuerModern",
    name: "Haustür modern",
    hint: "Wärmedämmende Haustür nach EnEV-/GEG-Standard. U = 1,20 W/(m²K).",
    era: "modern",
    componentType: "AT",
    label: "AT (modern)",
    uValue: 1.2,
  }),
  ext({
    id: "HaustuerPassivhaus",
    name: "Haustür Passivhaus",
    hint: "Haustür im Passivhaus-Standard. U = 0,80 W/(m²K).",
    era: "passivhaus",
    componentType: "AT",
    label: "AT (Passivhaus)",
    uValue: 0.8,
  }),
]

export function presetById(id: string): ComponentPreset {
  const p = PRESETS.find((p) => p.id === id)
  if (!p) throw new Error(`Unbekanntes Preset: ${id}`)
  return p
}

export interface BuildFromPresetOptions {
  orientation?: Orientation
  bruttoM2?: number
  abzugM2?: number
  widthM?: number
  lengthHeightM?: number | null
  thetaEC?: number
  uValueOverride?: number
  labelOverride?: string
  thetaAdjacentCOverride?: number
  fIxOverride?: number
  openings?: BuildingComponent[]
}

/**
 * Bauteil aus Preset erzeugen (Portierung von Component.build_component):
 * externe Presets mit θ_adj = −10,3 °C erhalten die Projekt-Außentemperatur;
 * bei Öffnungen wird abzugM2 ignoriert (Abzug = Summe der Öffnungen).
 */
export function buildFromPreset(
  preset: ComponentPreset,
  opts: BuildFromPresetOptions = {},
): BuildingComponent {
  const u = opts.uValueOverride ?? preset.uValue
  const label = opts.labelOverride ?? preset.label
  let theta = opts.thetaAdjacentCOverride ?? preset.thetaAdjacentC
  if (preset.adjacent === "e" && theta === DEFAULT_THETA_E_C) {
    theta = opts.thetaEC ?? DEFAULT_THETA_E_C
  }
  const fIx = opts.fIxOverride ?? preset.fIx
  const openings = opts.openings ?? []
  return makeComponent({
    orientation: opts.orientation ?? "N",
    componentType: preset.componentType,
    label,
    widthM: opts.widthM ?? 0,
    lengthHeightM: opts.lengthHeightM === undefined ? 0 : opts.lengthHeightM,
    bruttoM2: opts.bruttoM2 ?? 0,
    abzugM2: openings.length > 0 ? 0 : (opts.abzugM2 ?? 0),
    openings,
    adjacent: preset.adjacent,
    thetaAdjacentC: theta,
    fIx,
    uValue: u,
    deltaUTb: preset.deltaUTb,
  })
}

/**
 * Empfohlene Presets je Bauteilkategorie für jede Baualtersklasse
 * (für den geführten Assistenten).
 */
export const ERA_PRESET_MAP: Record<
  Exclude<Era, "neutral">,
  Partial<Record<ComponentType, string>>
> = {
  altbau: {
    AW: "AwAltbau",
    AF: "AfAltbau",
    DA: "DachAltbau",
    DF: "DfAltbau",
    AT: "HaustuerAltbau",
    BA: "BaAltbau",
  },
  wschvo77: {
    AW: "AwWsvo1977",
    AF: "AfAltbau",
    DA: "DachSparrendaemmung",
    DF: "DfAltbau",
    AT: "HaustuerAltbau",
    BA: "BaAltbau",
  },
  modern: {
    AW: "AwModern",
    AF: "AfModern",
    DA: "DachModern",
    DF: "DfModern",
    AT: "HaustuerModern",
    BA: "BaModern",
  },
  passivhaus: {
    AW: "AwPassivhaus",
    AF: "AfPassivhaus",
    DA: "DachModern",
    DF: "DfModern",
    AT: "HaustuerPassivhaus",
    BA: "BaModern",
  },
}
