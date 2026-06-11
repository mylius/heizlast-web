/**
 * Round-Trip-Tests für das Python-kompatible JSON-Format:
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
    const wire = serializeProjectJson(project, params.thetaEC)
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
    const wire = serializeProjectJson(original, params.thetaEC)
    const reloaded = parseProjectJson(JSON.parse(JSON.stringify(wire)))
    expect(normalize(dumpResults(reloaded, params))).toEqual(
      normalize(dumpResults(original, params)),
    )
  })

  it("ungültige Daten werfen einen Fehler", () => {
    expect(() => parseProjectJson({ usage_units: [{ number: "x" }] })).toThrow()
    expect(() => parseProjectJson(null)).toThrow()
  })
})
