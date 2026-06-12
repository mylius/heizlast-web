import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { roundHalfEven } from "@/engine/round"

interface RoundingCase {
  x: string
  ndigits: number
  expected: string
}

const cases: RoundingCase[] = JSON.parse(
  readFileSync(join(__dirname, "../fixtures/rounding_cases.json"), "utf-8"),
)

describe("roundHalfEven", () => {
  it(`stimmt mit den Referenz-Rundungsfällen überein (${cases.length} Fälle)`, () => {
    const failures: string[] = []
    for (const c of cases) {
      const x = Number(c.x)
      const expected = Number(c.expected)
      const actual = roundHalfEven(x, c.ndigits)
      if (!Object.is(actual, expected)) {
        failures.push(
          `round(${c.x}, ${c.ndigits}): erwartet ${c.expected}, erhalten ${actual}`,
        )
      }
    }
    expect(failures).toEqual([])
  })

  it("klassische Banker's-Rounding-Fälle", () => {
    expect(roundHalfEven(0.5, 0)).toBe(0)
    expect(roundHalfEven(1.5, 0)).toBe(2)
    expect(roundHalfEven(2.5, 0)).toBe(2)
    expect(roundHalfEven(2.675, 2)).toBe(2.67) // 2.675 ist binär 2.67499…
    expect(roundHalfEven(0.125, 2)).toBe(0.12) // exakte Hälfte → gerade
    expect(roundHalfEven(-1.5, 0)).toBe(-2)
  })
})
