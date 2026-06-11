"""
Erzeugt Paritäts-Fixtures aus dem Python-Referenzprojekt heizlastrechner.

Ausführen im Python-Repo:
    cd /Users/mylius/projects/heizlastrechner
    uv run python /Users/mylius/projects/heizlast-web/scripts/gen-fixtures.py

Schreibt nach heizlast-web/tests/fixtures/:
  - default_project.results.json / insulated_project.results.json /
    eg_r1_example.results.json  (Ergebnisse pro Bauteil/Raum/Einheit)
  - eg_r1_example.json (Kopie der Eingabedatei)
  - default_report.md (Markdown-Golden-File, festes Datum 01.01.2026)
  - rounding_cases.json (alle round()-Aufrufe der Berechnung, als repr-Strings)
"""

from __future__ import annotations

import builtins
import json
import shutil
from datetime import date
from pathlib import Path

from heizlastrechner.adapters.exporters.markdown import build_report_md
from heizlastrechner.app.cli_core import _parse_project
from heizlastrechner.calc import (
    compute_room_heating_load,
    compute_usage_unit_totals,
)
from heizlastrechner.examples.default import get_example_project
from heizlastrechner.examples.insulated import get_example_project_insulated
from heizlastrechner.model import CalculationParams, Project

PY_REPO = Path("/Users/mylius/projects/heizlastrechner")
OUT_DIR = Path("/Users/mylius/projects/heizlast-web/tests/fixtures")

_original_round = builtins.round
_rounding_cases: dict[tuple[str, int], str] = {}


def _recording_round(x, ndigits=None):
    result = _original_round(x, ndigits)
    if isinstance(x, float):
        _rounding_cases[(repr(x), ndigits or 0)] = repr(float(result))
    return result


def dump_results(project: Project, params: CalculationParams) -> dict:
    units_out = []
    for unit in project.usage_units:
        room_results = [compute_room_heating_load(r, params) for r in unit.rooms]
        rooms_out = []
        for res in room_results:
            room = res.room
            comps_out = []
            for cr in res.component_results:
                c = cr.component
                orient = (
                    cr.effective_orientation
                    if cr.effective_orientation is not None
                    else c.orientation
                )
                comps_out.append(
                    {
                        "orientation": orient.value,
                        "component_type": c.component_type.value,
                        "label": c.label,
                        "effective_brutto_m2": cr.effective_brutto_m2,
                        "effective_abzug_m2": cr.effective_abzug_m2,
                        "a_k_m2": cr.a_k_m2,
                        "f_ix": cr.f_ix,
                        "u_corrected": cr.u_corrected,
                        "theta_adjacent_c": c.theta_adjacent_c,
                        "adjacent": c.adjacent.value,
                        "phi_t_k_w": cr.phi_t_k_w,
                        "is_opening": cr.effective_orientation is not None,
                    }
                )
            rooms_out.append(
                {
                    "id": room.id,
                    "name": room.name,
                    "floor": room.floor,
                    "a_floor_m2": room.a_floor_m2,
                    "h_i_m": room.h_i_m,
                    "v_i_m3": room.v_i_m3,
                    "effective_theta_i_c": room.effective_theta_i_c,
                    "theta_design_c": room.theta_design_c,
                    "effective_n_min_h1": room.effective_n_min_h1,
                    "q_v_min_m3h": room.q_v_min_m3h(),
                    "phi_t_stand_w": res.phi_t_stand_w,
                    "phi_v_stand_w": res.phi_v_stand_w,
                    "phi_hl_w": res.phi_hl_w,
                    "components": comps_out,
                }
            )
        phi_t, phi_v, phi_hl = compute_usage_unit_totals(
            unit, params, room_results=room_results
        )
        units_out.append(
            {
                "number": unit.number,
                "name": unit.name,
                "phi_t_w": phi_t,
                "phi_v_w": phi_v,
                "phi_hl_w": phi_hl,
                "rooms": rooms_out,
            }
        )
    return {
        "theta_e_c": params.theta_e_c,
        "units": units_out,
        "building": {
            "phi_t_w": sum(u["phi_t_w"] for u in units_out),
            "phi_v_w": sum(u["phi_v_w"] for u in units_out),
            "phi_hl_w": sum(u["phi_hl_w"] for u in units_out),
        },
    }


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    params = CalculationParams(theta_e_c=-10.3)

    builtins.round = _recording_round
    try:
        eg_r1_path = PY_REPO / "examples" / "eg_r1_example.json"
        with open(eg_r1_path, encoding="utf-8") as f:
            eg_r1_project = _parse_project(json.load(f))

        fixtures = {
            "default_project.results.json": get_example_project(),
            "insulated_project.results.json": get_example_project_insulated(),
            "eg_r1_example.results.json": eg_r1_project,
        }
        for filename, project in fixtures.items():
            results = dump_results(project, params)
            with open(OUT_DIR / filename, "w", encoding="utf-8") as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            print(f"wrote {filename}")

        report = build_report_md(
            get_example_project(), params, project_date=date(2026, 1, 1)
        )
        (OUT_DIR / "default_report.md").write_text(report + "\n", encoding="utf-8")
        print("wrote default_report.md")
    finally:
        builtins.round = _original_round

    # Zusätzliche adversariale Fälle für pythonRound
    for x, nd in [
        (0.5, 0), (1.5, 0), (2.5, 0), (-0.5, 0), (-1.5, 0), (-2.5, 0),
        (2.675, 2), (2.665, 2), (0.125, 2), (0.135, 2), (-2.675, 2),
        (76.245, 1), (1234.5, 0), (0.045, 2), (1.005, 2), (2.0000000001, 0),
        (0.1 + 0.2, 1), (1e-9, 2), (123456.785, 2), (8.9225, 2),
    ]:
        _rounding_cases[(repr(x), nd)] = repr(float(_original_round(x, nd)))

    cases = [
        {"x": x, "ndigits": nd, "expected": result}
        for (x, nd), result in sorted(_rounding_cases.items())
    ]
    with open(OUT_DIR / "rounding_cases.json", "w", encoding="utf-8") as f:
        json.dump(cases, f, indent=2)
    print(f"wrote rounding_cases.json ({len(cases)} cases)")

    shutil.copy(eg_r1_path, OUT_DIR / "eg_r1_example.json")
    print("copied eg_r1_example.json")


if __name__ == "__main__":
    main()
