/**
 * Paritätstests: Die Engine muss exakt die Ergebnisse der Referenz-Fixtures
 * liefern (tests/fixtures/*.results.json, bauteilgenau).
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { getExampleProject, getExampleProjectInsulated } from "@/engine/example"
import { parseProjectJson } from "@/engine/schema"
import { defaultParams } from "@/engine/types"

import { dumpResults, normalize } from "./helpers"

function loadFixture(name: string) {
  return JSON.parse(
    readFileSync(join(__dirname, "../fixtures", name), "utf-8"),
  )
}

describe("Parität mit Referenz-Fixtures", () => {
  it("Beispielprojekt", () => {
    const actual = dumpResults(getExampleProject(), defaultParams())
    const expected = loadFixture("default_project.results.json")
    expect(normalize(actual)).toEqual(normalize(expected))
  })

  it("Beispielprojekt gedämmt", () => {
    const actual = dumpResults(getExampleProjectInsulated(), defaultParams())
    const expected = loadFixture("insulated_project.results.json")
    expect(normalize(actual)).toEqual(normalize(expected))
  })

  it("JSON-Import eg_r1_example.json", () => {
    const project = parseProjectJson(loadFixture("eg_r1_example.json"))
    const actual = dumpResults(project, defaultParams())
    const expected = loadFixture("eg_r1_example.results.json")
    expect(normalize(actual)).toEqual(normalize(expected))
  })
})
