/**
 * Round-Trip-Tests für das JSON-Projektformat:
 * serialize → parse muss identische Berechnungsergebnisse liefern.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { getExampleProject } from "@/engine/example"
import { parseProjectJson, serializeProjectJson } from "@/engine/schema"
import { defaultParams } from "@/engine/types"

import { dumpResults, normalize } from "./helpers"

describe("JSON-Schema Round-Trip", () => {
  it("Beispielprojekt: serialize → parse rechnet identisch", () => {
    const project = getExampleProject()
    const params = defaultParams()
    const wire = serializeProjectJson(project, params)
    // über JSON-String, wie beim echten Speichern/Laden
    const reloaded = parseProjectJson(JSON.parse(JSON.stringify(wire)))
    expect(normalize(dumpResults(reloaded, params))).toEqual(
      normalize(dumpResults(project, params)),
    )
  })

  it("eg_r1_example.json: parse → serialize → parse rechnet identisch", () => {
    const original = parseProjectJson(
      JSON.parse(
        readFileSync(join(__dirname, "../fixtures/eg_r1_example.json"), "utf-8"),
      ),
    )
    const params = defaultParams()
    const wire = serializeProjectJson(original, params)
    const reloaded = parseProjectJson(JSON.parse(JSON.stringify(wire)))
    expect(normalize(dumpResults(reloaded, params))).toEqual(
      normalize(dumpResults(original, params)),
    )
  })

  it("Raum mit eigener Höhe + Geschoss-Injektion wird materialisiert", async () => {
    const { makeRoom, makeStorey } = await import("@/engine/types")
    const project = {
      projectId: "T",
      description: "Test",
      address: "",
      storeys: { EG: makeStorey({ id: "EG", storeyHeightM: 2.6 }) },
      usageUnits: [
        {
          number: 1,
          name: "WE1",
          rooms: [
            makeRoom({
              id: "EG-R1",
              name: "Wohnraum",
              floor: "EG",
              roomWidthM: 4,
              roomLengthM: 5,
              roomType: "Wohnraum" as const,
              storeyId: "EG",
              // eigene Höhe → Format-Parser würde das Geschoss lösen
              storeyHeightM: 3.0,
            }),
          ],
        },
      ],
    }
    const params = defaultParams()
    const wire = serializeProjectJson(project, params)
    const reloaded = parseProjectJson(JSON.parse(JSON.stringify(wire)))
    expect(normalize(dumpResults(reloaded, params))).toEqual(
      normalize(dumpResults(project, params)),
    )
    // DE/FB müssen als explizite Bauteile in der Datei stehen
    const roomWire = wire.usage_units![0].rooms![0]
    expect(
      roomWire.components!.map((c) => c.component_type).sort(),
    ).toEqual(["DE", "FB"])
  })

  it("Dichtheit/WRG-Parameter überstehen serialize → readParamsFromWire", async () => {
    const { readParamsFromWire } = await import("@/engine/schema")
    const project = getExampleProject()
    const params = { ...defaultParams(), n50: 6, withWrg: true, wrgEta: 0.75 }
    const wire = JSON.parse(
      JSON.stringify(serializeProjectJson(project, params)),
    )
    const reloaded = readParamsFromWire(wire)
    expect(reloaded.n50).toBe(6)
    expect(reloaded.withWrg).toBe(true)
    expect(reloaded.wrgEta).toBe(0.75)
    expect(reloaded.thetaEC).toBe(params.thetaEC)
  })

  it("ungültige Daten werfen einen Fehler", () => {
    expect(() => parseProjectJson({ usage_units: [{ number: "x" }] })).toThrow()
    expect(() => parseProjectJson(null)).toThrow()
  })
})
