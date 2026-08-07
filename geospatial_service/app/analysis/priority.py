from typing import Dict, Any, Optional

DEFAULT_WEIGHTS = {
    "veg_degradation": 0.30,
    "soil_degradation": 0.25,
    "flood_risk": 0.20,
    "drought_risk": 0.15,
    "terrain_instability": 0.10,
}

PRIORITY_LEVEL_COLOR_MAP = [
    (30.0, "Low", "#10B981"),        # Emerald Green
    (55.0, "Medium", "#F59E0B"),     # Amber / Gold
    (75.0, "High", "#EF4444"),       # Red
    (100.0, "Critical", "#7F1D1D")   # Dark Crimson
]

def classify_priority_level(score: float) -> tuple[str, str]:
    """Maps priority score to rating level and hex color code."""
    for threshold, level, color in PRIORITY_LEVEL_COLOR_MAP:
        if score < threshold:
            return level, color
    return "Critical", "#7F1D1D"

def compute_priority_score(
    ndvi_mean: float,
    erosion_score: float,
    flood_score: float,
    drought_score: float,
    terrain_stability_score: float,
    custom_weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Computes deterministic Multi-Criteria Restoration Priority Score (0 to 100).
    Formula:
    Priority = 0.30 * Veg Degradation + 0.25 * Soil Degradation + 0.20 * Flood Risk + 0.15 * Drought Risk + 0.10 * Terrain Instability
    """
    weights = custom_weights or DEFAULT_WEIGHTS

    veg_deg = max(0.0, min(100.0, 100.0 * (1.0 - ndvi_mean)))
    soil_deg = max(0.0, min(100.0, erosion_score))
    flood_r = max(0.0, min(100.0, flood_score))
    drought_r = max(0.0, min(100.0, drought_score))
    terrain_inst = max(0.0, min(100.0, 100.0 - terrain_stability_score))

    raw_priority = (
        weights["veg_degradation"] * veg_deg +
        weights["soil_degradation"] * soil_deg +
        weights["flood_risk"] * flood_r +
        weights["drought_risk"] * drought_r +
        weights["terrain_instability"] * terrain_inst
    )
    priority_score = round(max(5.0, min(98.0, raw_priority)), 1)
    level, color = classify_priority_level(priority_score)

    return {
        "score": priority_score,
        "level": level,
        "color": color,
        "weights": weights,
        "breakdown": {
            "veg_degradation_score": round(veg_deg, 1),
            "soil_degradation_score": round(soil_deg, 1),
            "flood_risk_score": round(flood_r, 1),
            "drought_risk_score": round(drought_r, 1),
            "terrain_instability_score": round(terrain_inst, 1)
        },
        "metadata": {
            "source": "Deterministic Multi-Criteria Decision Analysis (MCDA)",
            "unit": "index (0 to 100)",
            "formula": "Priority = 0.30*VegDegradation + 0.25*SoilDegradation + 0.20*FloodRisk + 0.15*DroughtRisk + 0.10*TerrainInstability",
            "weights": weights
        }
    }

