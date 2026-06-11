/**
 * CPython-kompatibles round(): korrekt gerundet auf Dezimalstellen mit
 * "round half to even" auf dem exakten Binärwert des Doubles.
 *
 * Math.round / toFixed verhalten sich anders (half-up bzw. half-away-from-zero);
 * für die Paritätstests gegen die Python-Referenz muss exakt das
 * CPython-Verhalten nachgebildet werden (z.B. round(2.675, 2) === 2.67).
 */
export function pythonRound(x: number, ndigits = 0): number {
  if (!Number.isFinite(x)) return x
  if (!Number.isInteger(ndigits) || ndigits < 0 || ndigits > 50) {
    throw new RangeError(`pythonRound: ndigits ${ndigits} nicht unterstützt`)
  }
  if (x === 0) return x

  const sign = x < 0 ? -1 : 1
  // toFixed(100) liefert für |x| ≳ 1e-7 die exakte Dezimaldarstellung des
  // Doubles (Bruchteil eines Doubles ≥ 1e-7 hat < 100 Dezimalstellen).
  const s = Math.abs(x).toFixed(100)
  const dot = s.indexOf(".")
  const intPart = s.slice(0, dot)
  const frac = s.slice(dot + 1)

  if (frac.length <= ndigits) return x

  const keptDigits = intPart + frac.slice(0, ndigits)
  const remainder = frac.slice(ndigits)

  let roundUp: boolean
  const first = remainder[0]
  if (first > "5") {
    roundUp = true
  } else if (first < "5") {
    roundUp = false
  } else if (/[1-9]/.test(remainder.slice(1))) {
    roundUp = true
  } else {
    // exakt auf der Hälfte → auf gerade letzte Ziffer runden
    const last = keptDigits.charCodeAt(keptDigits.length - 1) - 48
    roundUp = last % 2 === 1
  }

  let resultDigits = keptDigits
  if (roundUp) {
    resultDigits = (BigInt(keptDigits) + 1n).toString()
  }
  const value = Number(`${resultDigits}e-${ndigits}`)
  return sign * value
}
