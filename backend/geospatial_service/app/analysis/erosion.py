from typing import Dict, Any

def compute_erosion_risk(
    slope_mean_deg: float,
    annual_rainfall_mm: float,
    ndvi_mean: float,
    clay_pct: float,
    sand_pct: float = 50.0,
    water_coverage_pct: float = 0.0,
    is_water_body: bool = False
) -> Dict[str, Any]:
    """
    Computes deterministic RUSLE (Revised Universal Soil Loss Equation) Soil Erosion Risk for land pixels.
    If polygon is mostly water (> 60%), calculates Shoreline Erosion Risk for land-water boundaries.
    """
    ls_score = min(1.0, (slope_mean_deg / 30.0) ** 1.2)
    r_score = min(1.0, annual_rainfall_mm / 2000.0)

    if is_water_body or water_coverage_pct > 60.0:
        # Shoreline erosion risk based on bank slope and rainfall erosivity
        raw_score = 100.0 * (0.60 * ls_score + 0.40 * r_score)
        erosion_score = round(max(5.0, min(90.0, raw_score)), 1)
        level = "Shoreline Erosion Risk"
        formula = "Shoreline Erosion = 100 * (0.60*LS_bank_slope + 0.40*R_rainfall)"
        desc = "Submerged water pixels excluded; score evaluates shoreline/bank erosion risk from hydrodynamics and precipitation."
    else:
        c_score = max(0.0, min(1.0, 1.0 - ndvi_mean))
        k_score = max(0.1, min(1.0, (100.0 - clay_pct) / 100.0 * 0.7 + (sand_pct / 100.0) * 0.3))
        raw_score = 100.0 * (
            0.35 * ls_score +
            0.25 * r_score +
            0.25 * c_score +
            0.15 * k_score
        )
        erosion_score = round(max(5.0, min(98.0, raw_score)), 1)

        if erosion_score < 25.0:
            level = "Low"
        elif erosion_score < 50.0:
            level = "Medium"
        elif erosion_score < 75.0:
            level = "High"
        else:
            level = "Critical"

        formula = "RUSLE: Score = 100 * (0.35*LS_slope + 0.25*R_rain + 0.25*C_cover + 0.15*K_erodibility)"
        desc = "Deterministic RUSLE soil erosion assessment integrating DEM slope (LS), ERA5 rainfall erosivity (R), Sentinel-2 ground cover (C), and ISRIC soil erodibility (K)."

    return {
        "score": erosion_score,
        "level": level,
        "formula": formula,
        "factors": {
            "LS_slope_factor": round(ls_score, 2),
            "R_rainfall_erosivity": round(r_score, 2),
            "water_body_mode": is_water_body or water_coverage_pct > 60.0
        },
        "metadata": {
            "source": "Revised Universal Soil Loss Equation (RUSLE)",
            "unit": "index (0 to 100)",
            "description": desc
        }
    }


