/**
 * Paritätstests: Die TypeScript-Engine muss exakt dieselben Ergebnisse liefern
 * wie die Python-Referenz (Fixtures aus scripts/gen-fixtures.py).
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

describe("Parität mit Python-Referenz", () => {
  it("Beispielprojekt (default.py)", () => {
    const actual = dumpResults(getExampleProject(), defaultParams())
    const expected = loadFixture("default_project.results.json")
    expect(normalize(actual)).toEqual(normalize(expected))
  })

  it("Beispielprojekt gedämmt (insulated.py)", () => {
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
