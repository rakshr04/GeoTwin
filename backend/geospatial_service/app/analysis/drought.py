from typing import Dict, Any

def compute_drought_risk(
    annual_rainfall_mm: float,
    dry_months_count: int,
    ndvi_mean: float,
    sand_pct: float,
    organic_matter_pct: float = 1.8,
    water_coverage_pct: float = 0.0,
    is_water_body: bool = False
) -> Dict[str, Any]:
    """
    Computes deterministic Drought Risk score based on rainfall deficit, length of dry season,
    vegetation moisture deficit (1 - NDVI), and soil water retention capacity.
    For water bodies, calculates hydrological drawdown / reservoir shrinkage risk.
    """
    rain_deficit_score = max(0.0, 1.0 - (annual_rainfall_mm / 1500.0))
    dry_season_score = min(1.0, dry_months_count / 8.0)

    if is_water_body or water_coverage_pct > 60.0:
        # Water body drawdown risk depends on climate & dry season duration
        raw_score = 100.0 * (0.60 * rain_deficit_score + 0.40 * dry_season_score)
        drought_score = round(max(5.0, min(85.0, raw_score)), 1)
        level = "Water Body Desiccation Risk"
        formula = "Water Body Drawdown Risk = 100 * (0.60*RainDeficit + 0.40*DryMonths)"
        desc = "Calculated from ERA5 rainfall deficit and dry season duration; measures reservoir drawdown / evaporation risk."
    else:
        veg_stress_score = max(0.0, min(1.0, 1.0 - ndvi_mean))
        soil_retention_deficit = min(1.0, (sand_pct / 85.0) * 0.7 + max(0.0, 1.0 - organic_matter_pct / 3.0) * 0.3)
        raw_score = 100.0 * (
            0.35 * rain_deficit_score +
            0.30 * dry_season_score +
            0.20 * veg_stress_score +
            0.15 * soil_retention_deficit
        )
        drought_score = round(max(5.0, min(95.0, raw_score)), 1)

        if drought_score < 25.0:
            level = "Low"
        elif drought_score < 50.0:
            level = "Medium"
        elif drought_score < 75.0:
            level = "High"
        else:
            level = "Critical"

        formula = "Drought Risk = 100 * (0.35*RainDeficit + 0.30*DryMonths + 0.20*VegStress + 0.15*SoilRetentionDeficit)"
        desc = "Calculated from ERA5 annual rainfall deficit, dry months count, Sentinel-2 vegetation stress, and ISRIC soil texture water retention."

    return {
        "score": drought_score,
        "level": level,
        "formula": formula,
        "factors": {
            "rain_deficit_score": round(rain_deficit_score, 2),
            "dry_season_score": round(dry_season_score, 2),
            "veg_stress_score": round(max(0.0, 1.0 - ndvi_mean), 2),
            "water_body_mode": is_water_body or water_coverage_pct > 60.0
        },
        "metadata": {
            "source": "Deterministic Hydro-Climatic Drought Index Model",
            "unit": "index (0 to 100)",
            "description": desc
        }
    }


