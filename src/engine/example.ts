/**
 * Eingebautes Beispielprojekt: Wohneinheit 1 mit allen Räumen (DG, OG1, EG)
 * einer Doppelhaushälfte — dient als Demo-Projekt und als Eingabe der
 * Paritätstests gegen die Referenz-Fixtures.
 */
import { buildFromPreset, presetById } from "./presets"
import {
  DEFAULT_THETA_E_C,
  makeComponent,
  makeRoom,
  makeStorey,
  type BuildingComponent,
  type Project,
  type Room,
} from "./types"

const AwAltbau = presetById("AwAltbau")
const AfModern = presetById("AfModern")
const BaAltbau = presetById("BaAltbau")
const DachSparrendaemmung = presetById("DachSparrendaemmung")
const DfModern = presetById("DfModern")
const HtwGedaemmt = presetById("HtwGedaemmt")
const Iw = presetById("Iw")

const af = (bruttoM2: number) => buildFromPreset(AfModern, { bruttoM2 })
const df = (bruttoM2: number) => buildFromPreset(DfModern, { bruttoM2 })

export function getExampleProject(): Project {
  const thetaE = DEFAULT_THETA_E_C
  const storeys = {
    EG: makeStorey({
      id: "EG",
      storeyHeightM: 2.58,
      ceilingThicknessM: 0.2,
      // Kellerdecke: tatsächliche Kellertemperatur 10 °C, daher f_ix = 1
      fbThetaAdjacentC: 10.0,
      fbUValue: 1.6,
      fbFIx: 1.0,
      fbAdjacent: "e",
      deThetaAdjacentC: 20.0,
      deUValue: 0.97,
      deAdjacent: "ij",
    }),
    OG1: makeStorey({
      id: "OG1",
      storeyHeightM: 2.58,
      ceilingThicknessM: 0.2,
      fbThetaAdjacentC: 20.0,
      fbUValue: 0.97,
      fbFIx: 0.0,
      fbAdjacent: "ij",
      deThetaAdjacentC: 20.0,
      deUValue: 0.97,
      deAdjacent: "ij",
    }),
    DG: makeStorey({
      // effektive (mittlere) Höhe für Volumen V≈68,4 m³; First 3,3 m, Kniestock 0,42 m
      id: "DG",
      storeyHeightM: 2.06,
      ceilingThicknessM: 0.2,
      addDefaultDe: false,
      addDefaultFb: false,
    }),
  }

  const rooms: Room[] = []

  // --- DG-R1
  const dgR1 = makeRoom({
    id: "DG-R1",
    name: "Wohnraum Dach",
    floor: "DG",
    roomWidthM: 5.57,
    roomLengthM: 6.6,
    roomType: "Dach",
    storeyId: "DG",
  })
  dgR1.components = [
    buildFromPreset(HtwGedaemmt, {
      orientation: "O",
      widthM: 18.38 / 2.06,
      lengthHeightM: null,
    }),
    buildFromPreset(AwAltbau, {
      orientation: "W",
      widthM: 18.38 / 2.06,
      lengthHeightM: null,
      openings: [af(0.6)],
    }),
    buildFromPreset(DachSparrendaemmung, {
      orientation: "N",
      widthM: 6.6,
      lengthHeightM: 4.02,
      openings: [df(0.6)],
    }),
    buildFromPreset(DachSparrendaemmung, {
      orientation: "S",
      widthM: 6.6,
      lengthHeightM: 4.02,
      openings: [df(0.6), df(0.6)],
    }),
  ]
  rooms.push(dgR1)

  // --- OG1-R1
  const og1R1 = makeRoom({
    id: "OG1-R1",
    name: "Schlafen",
    floor: "OG1",
    roomWidthM: 3.24,
    roomLengthM: 4.2,
    roomType: "Schlafen",
    storeyId: "OG1",
  })
  og1R1.components = [
    buildFromPreset(HtwGedaemmt, {
      orientation: "O",
      widthM: 11.49 / 2.58,
      lengthHeightM: null,
    }),
    buildFromPreset(AwAltbau, {
      orientation: "N",
      widthM: 9.23 / 2.58,
      lengthHeightM: null,
      openings: [af(1.0)],
    }),
    // Innenwand zum Bad (24 °C): tatsächliche Nachbartemperatur, f_ix = 1 → Gewinn
    buildFromPreset(Iw, {
      orientation: "S",
      bruttoM2: 9.23,
      thetaAdjacentCOverride: 24.0,
      fIxOverride: 1.0,
    }),
  ]
  rooms.push(og1R1)

  // --- OG1-R2 (Nordseite ist Dachschräge, keine Wand)
  const og1R2 = makeRoom({
    id: "OG1-R2",
    name: "Schlafen 2",
    floor: "OG1",
    roomWidthM: 3.28,
    roomLengthM: 4.2,
    roomType: "Schlafen",
    storeyId: "OG1",
  })
  og1R2.components = [
    buildFromPreset(HtwGedaemmt, {
      orientation: "O",
      widthM: 11.49 / 2.58,
      lengthHeightM: null,
    }),
    buildFromPreset(DachSparrendaemmung, {
      orientation: "N",
      widthM: 9.89 / 2.58,
      lengthHeightM: null,
    }),
    buildFromPreset(AwAltbau, {
      orientation: "W",
      widthM: 9.99 / 2.58,
      lengthHeightM: null,
      openings: [af(1.5)],
    }),
    buildFromPreset(Iw, { orientation: "S", bruttoM2: 1.89 }),
    // Innenwand zum Flur (15 °C): tatsächliche Nachbartemperatur, f_ix = 1
    buildFromPreset(Iw, {
      orientation: "S",
      bruttoM2: 6.29,
      abzugM2: 1.7,
      thetaAdjacentCOverride: 15.0,
      fIxOverride: 1.0,
    }),
  ]
  rooms.push(og1R2)

  // --- OG1-R3
  const og1R3 = makeRoom({
    id: "OG1-R3",
    name: "Bad/Dusche/Umkl.",
    floor: "OG1",
    roomWidthM: 3.7,
    roomLengthM: 3.12,
    roomType: "Bad",
    storeyId: "OG1",
  })
  og1R3.components = [
    buildFromPreset(HtwGedaemmt, {
      orientation: "O",
      widthM: 7.43 / 2.58,
      lengthHeightM: null,
    }),
    buildFromPreset(Iw, { orientation: "N", bruttoM2: 8.81 }),
    buildFromPreset(Iw, { orientation: "W", bruttoM2: 7.43 }),
    buildFromPreset(AwAltbau, {
      orientation: "S",
      widthM: 3.33 / 2.58,
      lengthHeightM: null,
      openings: [af(1.03)],
    }),
  ]
  rooms.push(og1R3)

  // --- OG1-R5
  const og1R5 = makeRoom({
    id: "OG1-R5",
    name: "Abstellraum",
    floor: "OG1",
    roomWidthM: 1.83,
    roomLengthM: 3.45,
    roomType: "Abstellraum",
    storeyHeightM: 2.27,
    ceilingThicknessM: 0.2,
    storeyId: "OG1",
  })
  og1R5.components = [
    buildFromPreset(HtwGedaemmt, {
      orientation: "O",
      widthM: 3.79 / 2.27,
      lengthHeightM: null,
    }),
    buildFromPreset(Iw, { orientation: "N", bruttoM2: 7.14, abzugM2: 1.5 }),
    buildFromPreset(AwAltbau, {
      orientation: "S",
      widthM: 7.14 / 2.27,
      lengthHeightM: null,
      openings: [af(1.5)],
    }),
    makeComponent({
      orientation: "H",
      componentType: "DE",
      bruttoM2: 6.31,
      adjacent: "e",
      thetaAdjacentC: thetaE,
      fIx: 1.0,
      uValue: 0.97,
    }),
  ]
  rooms.push(og1R5)

  // --- EG-R1 (Südwand komplett innen)
  const egR1 = makeRoom({
    id: "EG-R1",
    name: "Wohnraum",
    floor: "EG",
    roomWidthM: 4.11,
    roomLengthM: 6.67,
    roomType: "Wohnraum",
    storeyId: "EG",
  })
  egR1.components = [
    buildFromPreset(HtwGedaemmt, {
      orientation: "O",
      widthM: 11.27 / 2.58,
      lengthHeightM: null,
    }),
    buildFromPreset(AwAltbau, {
      orientation: "N",
      widthM: 18.76 / 2.58,
      lengthHeightM: null,
      openings: [af(3.4)],
    }),
    buildFromPreset(AwAltbau, {
      orientation: "W",
      widthM: 11.27 / 2.58,
      lengthHeightM: null,
      openings: [af(1.6)],
    }),
    buildFromPreset(Iw, { orientation: "S", bruttoM2: 18.76 }),
  ]
  rooms.push(egR1)

  // --- EG-R2
  const egR2 = makeRoom({
    id: "EG-R2",
    name: "Essen",
    floor: "EG",
    roomWidthM: 5.13,
    roomLengthM: 3.24,
    roomType: "Essen",
    storeyId: "EG",
  })
  egR2.components = [
    buildFromPreset(HtwGedaemmt, {
      orientation: "O",
      widthM: 13.36 / 2.58,
      lengthHeightM: null,
    }),
    buildFromPreset(AwAltbau, {
      orientation: "W",
      widthM: 4.39 / 2.58,
      lengthHeightM: null,
      openings: [af(1.4)],
    }),
    buildFromPreset(Iw, { orientation: "N", bruttoM2: 9.16, abzugM2: 1.6 }),
    buildFromPreset(Iw, { orientation: "S", bruttoM2: 9.0, abzugM2: 1.9 }),
  ]
  rooms.push(egR2)

  // --- EG-R4
  const egR4 = makeRoom({
    id: "EG-R4",
    name: "WC-Raum",
    floor: "EG",
    roomWidthM: 1.8,
    roomLengthM: 2.18,
    roomType: "WC",
    storeyId: "EG",
  })
  egR4.components = [
    buildFromPreset(HtwGedaemmt, {
      orientation: "O",
      widthM: 7.84 / 2.58,
      lengthHeightM: null,
    }),
    buildFromPreset(Iw, { orientation: "N", bruttoM2: 4.64 }),
    buildFromPreset(AwAltbau, {
      orientation: "W",
      widthM: 7.84 / 2.58,
      lengthHeightM: null,
    }),
    buildFromPreset(AwAltbau, {
      orientation: "S",
      widthM: 4.14 / 2.58,
      lengthHeightM: null,
      openings: [af(0.5)],
    }),
    buildFromPreset(BaAltbau, { orientation: "H", bruttoM2: 3.9 }),
  ]
  rooms.push(egR4)

  // --- EG-R5
  const egR5 = makeRoom({
    id: "EG-R5",
    name: "Wohnraum 2",
    floor: "EG",
    roomWidthM: 3.23,
    roomLengthM: 4.47,
    roomType: "Wohnraum",
    storeyId: "EG",
  })
  egR5.components = [
    buildFromPreset(HtwGedaemmt, {
      orientation: "O",
      widthM: 17.7 / 2.58,
      lengthHeightM: null,
    }),
    buildFromPreset(Iw, { orientation: "N", bruttoM2: 7.28, abzugM2: 1.9 }),
    buildFromPreset(AwAltbau, {
      orientation: "W",
      widthM: 9.56 / 2.58,
      lengthHeightM: null,
      openings: [af(1.3), af(1.3)],
      uValueOverride: 0.8,
    }),
    buildFromPreset(Iw, { orientation: "S", bruttoM2: 8.07, abzugM2: 1.9 }),
    makeComponent({
      orientation: "H",
      componentType: "DE",
      bruttoM2: 14.44,
      adjacent: "e",
      thetaAdjacentC: thetaE,
      fIx: 1.0,
      uValue: 0.3,
    }),
  ]
  rooms.push(egR5)

  // --- EG-R6
  const egR6 = makeRoom({
    id: "EG-R6",
    name: "Wohnraum 3",
    floor: "EG",
    roomWidthM: 3.23,
    roomLengthM: 4.52,
    roomType: "Wohnraum",
    storeyId: "EG",
  })
  egR6.components = [
    buildFromPreset(HtwGedaemmt, {
      orientation: "O",
      widthM: 12.81 / 2.58,
      lengthHeightM: null,
    }),
    buildFromPreset(Iw, { orientation: "N", bruttoM2: 8.07, abzugM2: 1.9 }),
    buildFromPreset(AwAltbau, {
      orientation: "W",
      widthM: 11.51 / 2.58,
      lengthHeightM: null,
      openings: [af(1.3)],
      uValueOverride: 0.8,
    }),
    buildFromPreset(AwAltbau, {
      orientation: "S",
      widthM: 9.97 / 2.58,
      lengthHeightM: null,
      uValueOverride: 0.8,
    }),
    makeComponent({
      orientation: "H",
      componentType: "DE",
      bruttoM2: 14.6,
      adjacent: "e",
      thetaAdjacentC: thetaE,
      fIx: 1.0,
      uValue: 0.3,
    }),
  ]
  rooms.push(egR6)

  return {
    projectId: "ID_115986",
    description: "Bespielprojekt – alle Räume",
    address: "",
    storeys,
    usageUnits: [{ number: 5, name: "Wohneinheit 1", rooms }],
  }
}

/** Variante mit gedämmten EG-Böden: Kellerdecke U ≈ 0,3 (6 cm Resol). */
export function getExampleProjectInsulated(): Project {
  const project = getExampleProject()
  if (project.storeys["EG"]) {
    project.storeys["EG"].fbUValue = 0.3
  }
  return project
}

export type { BuildingComponent }
