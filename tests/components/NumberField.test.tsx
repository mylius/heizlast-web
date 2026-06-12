// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { NumberField } from "@/components/inputs/NumberField"

afterEach(cleanup)

describe("NumberField", () => {
  it("übernimmt deutsche Komma-Eingaben bei Enter", () => {
    const onCommit = vi.fn()
    render(<NumberField value={1} onCommit={onCommit} aria-label="Test" />)
    const input = screen.getByLabelText("Test")
    fireEvent.change(input, { target: { value: "2,5" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onCommit).toHaveBeenCalledWith(2.5)
  })

  it("akzeptiert auch Punkt als Dezimaltrenner", () => {
    const onCommit = vi.fn()
    render(<NumberField value={1} onCommit={onCommit} aria-label="Test" />)
    const input = screen.getByLabelText("Test")
    fireEvent.change(input, { target: { value: "3.75" } })
    fireEvent.blur(input)
    expect(onCommit).toHaveBeenCalledWith(3.75)
  })

  it("leeres Feld bedeutet null (automatisch), wenn nullable", () => {
    const onCommit = vi.fn()
    render(
      <NumberField value={2} onCommit={onCommit} nullable aria-label="Test" />,
    )
    const input = screen.getByLabelText("Test")
    fireEvent.change(input, { target: { value: "" } })
    fireEvent.blur(input)
    expect(onCommit).toHaveBeenCalledWith(null)
  })

  it("verwirft ungültige Eingaben und stellt den Wert wieder her", () => {
    const onCommit = vi.fn()
    render(<NumberField value={2} onCommit={onCommit} aria-label="Test" />)
    const input = screen.getByLabelText("Test") as HTMLInputElement
    fireEvent.change(input, { target: { value: "abc" } })
    fireEvent.blur(input)
    expect(onCommit).not.toHaveBeenCalled()
    expect(input.value).toBe("2")
  })

  it("Bearbeitung treibt eine Live-Anzeige (kontrollierter Roundtrip)", () => {
    function Harness() {
      const [v, setV] = useState<number | null>(10)
      return (
        <div>
          <NumberField value={v} onCommit={setV} aria-label="Feld" />
          <output aria-label="Ergebnis">{v !== null ? v * 2 : "-"}</output>
        </div>
      )
    }
    render(<Harness />)
    const input = screen.getByLabelText("Feld")
    fireEvent.change(input, { target: { value: "21" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(screen.getByLabelText("Ergebnis").textContent).toBe("42")
  })
})
