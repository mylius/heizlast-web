/**
 * Golden-File-Test: Der Markdown-Bericht muss byte-identisch zur
 * Python-Ausgabe sein (festes Datum 01.01.2026).
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { getExampleProject } from "@/engine/example"
import { defaultParams } from "@/engine/types"
import { buildReportMd } from "@/report/markdown"

describe("Markdown-Bericht", () => {
  it("stimmt mit dem Python-Golden-File überein", () => {
    const golden = readFileSync(
      join(__dirname, "../fixtures/default_report.md"),
      "utf-8",
    )
    const actual =
      buildReportMd(getExampleProject(), defaultParams(), {
        projectDate: new Date(2026, 0, 1),
      }) + "\n"
    expect(actual).toBe(golden)
  })
})
