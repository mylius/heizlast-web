/**
 * Infiltration durch die Gebäudehülle (DIN EN 12831-1).
 *
 * V̇_inf,i = 2 · V_i · n₅₀ · e_i · ε_i
 *
 * - n₅₀: Luftdichtheit (Luftwechsel bei 50 Pa), gebäudeweit (params.n50)
 * - e_i: Abschirmkoeffizient, abgeleitet aus der Zahl der dem Wind
 *   ausgesetzten Fassaden des Raums (0 → 0; 1 → 0,02; ≥2 → 0,03)
 * - ε_i: Höhenkorrektur (params.epsilon, Standard 1,0)
 *
 * Der hygienische Mindestluftwechsel und die Infiltration werden in der
 * Lüftungsberechnung über max(V̇_min, V̇_inf) verknüpft (siehe calc.ts).
 */
import { vIM3 } from "./derive"
import type { CalculationParams, ComponentType, Room, Storey } from "./types"

/** Bauteiltypen, die eine dem Wind ausgesetzte Fassade markieren. */
const FACADE_TYPES = new Set<ComponentType>(["AW", "AF", "AT", "DA", "DF"])

/** Zahl der dem Außenklima ausgesetzten Fassaden-Orientierungen des Raums. */
export function exposedFacadeCount(room: Room): number {
  const orientations = new Set<string>()
  for (const c of room.components) {
    if (
      c.adjacent === "e" &&
      c.orientation !== "H" &&
      FACADE_TYPES.has(c.componentType)
    ) {
      // O ist ein Alias für E (Ost)
      orientations.add(c.orientation === "O" ? "E" : c.orientation)
    }
  }
  return orientations.size
}

/** Abschirmkoeffizient e nach Zahl der exponierten Fassaden. */
export function shieldingCoefficient(exposedFacades: number): number {
  if (exposedFacades <= 0) return 0
  if (exposedFacades === 1) return 0.02
  return 0.03
}

/** Infiltrationsvolumenstrom V̇_inf,i [m³/h]; 0 wenn n₅₀ nicht gesetzt. */
export function infiltrationFlowM3h(
  room: Room,
  params: CalculationParams,
  storey?: Storey,
): number {
  const n50 = params.n50 ?? null
  if (n50 === null) return 0
  const e = shieldingCoefficient(exposedFacadeCount(room))
  if (e === 0) return 0
  const epsilon = params.epsilon ?? 1.0
  return 2 * vIM3(room, storey) * n50 * e * epsilon
}
