from typing import Dict, Any

def compute_flood_risk(
    elevation_mean_m: float,
    slope_mean_deg: float,
    dist_to_river_m: float,
    annual_rainfall_mm: float,
    urban_pct: float,
    clay_pct: float,
    water_coverage_pct: float = 0.0,
    is_water_body: bool = False
) -> Dict[str, Any]:
    """
    Computes deterministic Flood Risk score based on topographic slope, river proximity,
    annual rainfall intensity, urban imperviousness, and soil infiltration capacity.
    If polygon is an existing water body, marks risk as Not Applicable (Water Body).
    """
    if is_water_body or water_coverage_pct > 60.0:
        return {
            "score": 0.0,
            "level": "Not Applicable (Water Body)",
            "formula": "N/A - Polygon is a permanent water body",
            "factors": {
                "river_proximity_score": 0.0,
                "flatness_score": 0.0,
                "rainfall_score": 0.0,
                "impervious_score": 0.0
            },
            "metadata": {
                "source": "Deterministic Topographic-Hydrological Flood Risk Model",
                "unit": "index (0 to 100)",
                "description": "Polygon is an existing permanent water body. Land flood risk model is Not Applicable; value represents surrounding inundation & drawdown susceptibility."
            }
        }

    # River proximity factor: closer to rivers -> higher flood exposure (0 to 1)
    river_score = max(0.0, 1.0 - (dist_to_river_m / 1000.0))
    # Topographic flatness factor: flatter slope -> higher water accumulation (0 to 1)
    flatness_score = max(0.0, 1.0 - (slope_mean_deg / 20.0))
    # Rainfall intensity factor: higher annual rainfall -> increased runoff volume (0 to 1)
    rain_score = min(1.0, annual_rainfall_mm / 1800.0)
    # Impervious surface & low soil permeability factor: high urban % or high clay % reduces infiltration
    impervious_score = (urban_pct / 100.0) * 0.5 + (clay_pct / 100.0) * 0.5

    raw_score = 100.0 * (
        0.35 * river_score +
        0.30 * flatness_score +
        0.20 * rain_score +
        0.15 * impervious_score
    )
    flood_score = round(max(5.0, min(95.0, raw_score)), 1)

    if flood_score < 25.0:
        level = "Low"
    elif flood_score < 50.0:
        level = "Medium"
    elif flood_score < 75.0:
        level = "High"
    else:
        level = "Critical"

    return {
        "score": flood_score,
        "level": level,
        "formula": "Flood Risk = 100 * (0.35*RiverProx + 0.30*TopographicFlatness + 0.20*RainfallIntensity + 0.15*ImperviousInfiltration)",
        "factors": {
            "river_proximity_score": round(river_score, 2),
            "flatness_score": round(flatness_score, 2),
            "rainfall_score": round(rain_score, 2),
            "impervious_score": round(impervious_score, 2)
        },
        "metadata": {
            "source": "Deterministic Topographic-Hydrological Flood Risk Model",
            "unit": "index (0 to 100)",
            "description": "Calculated from DEM topography, slope, river distance, ERA5 rainfall, urban impervious cover, and soil clay permeability."
        }
    }


