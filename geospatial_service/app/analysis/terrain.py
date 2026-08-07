from typing import Dict, Any

def compute_terrain_stability(
    slope_mean_deg: float,
    elevation_std_m: float,
    ndvi_mean: float,
    erosion_score: float,
    sand_pct: float = 50.0,
    clay_pct: float = 30.0,
    water_coverage_pct: float = 0.0,
    is_water_body: bool = False
) -> Dict[str, Any]:
    """
    Computes deterministic Terrain Stability score for land pixels (0 to 100, 100 = highly stable).
    Excludes water pixels. If water coverage > 70%, displays Not Applicable (Water Body).
    """
    if is_water_body or water_coverage_pct > 70.0:
        return {
            "score": 100.0,
            "instability_score": 0.0,
            "formula": "N/A - Polygon is a permanent water body",
            "factors": {
                "slope_instability": 0.0,
                "elevation_var_instability": 0.0,
                "vegetation_root_support": 0.0,
                "soil_cohesion_instability": 0.0,
                "erosion_instability": 0.0
            },
            "metadata": {
                "source": "Deterministic Slope-Topography-Vegetation-Soil Stability Model",
                "unit": "index (0 to 100)",
                "interpretation": "Terrain Stability: Not Applicable (Water Body Surface)"
            }
        }

    slope_instability = min(1.0, slope_mean_deg / 35.0)
    elevation_var_instability = min(1.0, elevation_std_m / 40.0)
    vegetation_root_support = max(0.0, min(1.0, ndvi_mean))
    soil_cohesion_instability = min(1.0, sand_pct / 85.0)  # Sandy soils lack cohesion
    erosion_instability = min(1.0, erosion_score / 100.0)

    # Calculate overall instability score (0 to 100)
    instability = 100.0 * (
        0.35 * slope_instability +
        0.25 * elevation_var_instability +
        0.20 * erosion_instability +
        0.10 * soil_cohesion_instability +
        0.10 * (1.0 - vegetation_root_support)
    )
    stability_score = round(max(5.0, min(99.0, 100.0 - instability)), 1)

    return {
        "score": stability_score,
        "instability_score": round(instability, 1),
        "formula": "Terrain Stability = 100 - 100*(0.35*SlopeFactor + 0.25*ElevStdFactor + 0.20*ErosionFactor + 0.10*SoilCohesion + 0.10*(1-NDVI))",
        "factors": {
            "slope_instability": round(slope_instability, 2),
            "elevation_var_instability": round(elevation_var_instability, 2),
            "vegetation_root_support": round(vegetation_root_support, 2),
            "soil_cohesion_instability": round(soil_cohesion_instability, 2),
            "erosion_instability": round(erosion_instability, 2)
        },
        "metadata": {
            "source": "Deterministic Slope-Topography-Vegetation-Soil Stability Model",
            "unit": "index (0 to 100)",
            "interpretation": "100 = Extremely Stable, < 30 = Unstable / Landslide Prone"
        }
    }


