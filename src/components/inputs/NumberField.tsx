/**
 * Zahleneingabe mit deutschem Dezimalkomma. Übernimmt den Wert bei
 * Blur/Enter. Bei `nullable` bedeutet ein leeres Feld "automatisch" (null);
 * der abgeleitete Wert kann als Platzhalter angezeigt werden.
 */
import { useEffect, useState } from "react"

import { Input } from "@/components/ui/input"
import { parseDeNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

function toDisplay(value: number | null): string {
  if (value === null) return ""
  return String(value).replace(".", ",")
}

interface NumberFieldProps {
  value: number | null
  onCommit: (value: number | null) => void
  /** leeres Feld erlaubt (= automatisch) */
  nullable?: boolean
  placeholder?: string
  className?: string
  disabled?: boolean
  "aria-label"?: string
}

export function NumberField({
  value,
  onCommit,
  nullable = false,
  placeholder,
  className,
  disabled,
  "aria-label": ariaLabel,
}: NumberFieldProps) {
  const [text, setText] = useState(toDisplay(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setText(toDisplay(value))
  }, [value, focused])

  const commit = () => {
    const trimmed = text.trim()
    if (trimmed === "") {
      if (nullable) {
        if (value !== null) onCommit(null)
        return
      }
      setText(toDisplay(value))
      return
    }
    const parsed = parseDeNumber(trimmed)
    if (parsed === null) {
      setText(toDisplay(value))
      return
    }
    if (parsed !== value) onCommit(parsed)
    setText(toDisplay(parsed))
  }

  return (
    <Input
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn("h-8 text-right tabular-nums", className)}
      onChange={(e) => setText(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        commit()
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          commit()
          e.currentTarget.blur()
        }
        if (e.key === "Escape") {
          setText(toDisplay(value))
          e.currentTarget.blur()
        }
      }}
    />
  )
}
