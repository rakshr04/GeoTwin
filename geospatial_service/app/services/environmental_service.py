import math
import numpy as np
from typing import Dict, Any, Tuple
from shapely.geometry import Polygon

from app.models.schemas import (
    TerrainMetrics,
    VegetationMetrics,
    LandCoverMetrics,
    RainfallMetrics,
    SoilMetrics,
    RiskScores
)
from app.services.live_datasets_service import fetch_all_live_geospatial_datasets

from app.models.schemas import (
    TerrainMetrics,
    VegetationMetrics,
    LandCoverMetrics,
    RainfallMetrics,
    SoilMetrics,
    WaterMetrics,
    RiskScores
)
from app.services.dem_service import compute_elevation_and_slope_metrics
from app.services.ndvi_service import compute_ndvi_metrics
from app.services.landcover_service import compute_land_cover_composition
from app.services.soil_service import fetch_soil_metrics
from app.services.rainfall_service import fetch_rainfall_metrics
from app.services.water_service import compute_water_body_metrics

from app.analysis.erosion import compute_erosion_risk
from app.analysis.flood import compute_flood_risk
from app.analysis.drought import compute_drought_risk
from app.analysis.terrain import compute_terrain_stability
from app.analysis.priority import compute_priority_score

def compute_environmental_analysis(polygon_wgs84: Polygon, polygon_metric: Polygon, area_ha: float) -> Tuple[
    TerrainMetrics,
    VegetationMetrics,
    LandCoverMetrics,
    RainfallMetrics,
    SoilMetrics,
    WaterMetrics,
    RiskScores
]:
    centroid = polygon_wgs84.centroid
    lon, lat = centroid.x, centroid.y
    bbox = polygon_wgs84.bounds

    # Single parallel fetch of all live datasets (Elevation, STAC, SoilGrids, Climate)
    live_datasets = fetch_all_live_geospatial_datasets(lat, lon, bbox=bbox)
    live_stac = live_datasets.get("sentinel2")
    live_elev_val = live_datasets.get("elevation_m")
    live_soil_dict = live_datasets.get("soil")
    live_climate_dict = live_datasets.get("climate")

    # 1. Stage 1 Dedicated Water Detection
    water_res = compute_water_body_metrics(
        bbox,
        polygon_wgs84=polygon_wgs84,
        pre_fetched_stac=live_stac
    )
    water_cov_pct = water_res["water_coverage_pct"]
    is_water = water_res["is_water_body"]

    # 2. Spatial Elevation & Slope Metrics (DEM Clipped to Polygon)
    dem = compute_elevation_and_slope_metrics(
        bbox,
        polygon_wgs84=polygon_wgs84,
        pre_fetched_elevation=live_elev_val
    )
    
    # 3. Vegetation Metrics (Sentinel-2 NDVI Clipped to Polygon)
    veg = compute_ndvi_metrics(
        bbox,
        polygon_wgs84=polygon_wgs84,
        water_coverage_pct=water_cov_pct,
        is_water_body=is_water,
        pre_fetched_stac=live_stac
    )
    
    # 4. Land Cover Composition (ESA WorldCover Intersected with Polygon)
    lc = compute_land_cover_composition(
        bbox,
        veg["ndvi_mean"],
        polygon_wgs84=polygon_wgs84,
        water_coverage_pct=water_cov_pct
    )
    
    # 5. Soil Metrics (ISRIC SoilGrids & Water Surface Composition)
    soil_res = fetch_soil_metrics(
        lat,
        lon,
        polygon_wgs84=polygon_wgs84,
        water_coverage_pct=water_cov_pct,
        pre_fetched_soil=live_soil_dict,
        has_pre_fetched=True
    )
    
    # 6. Rainfall & Climate Metrics (ERA5 / CHIRPS from Polygon Location)
    rain = fetch_rainfall_metrics(
        lat,
        lon,
        polygon_wgs84=polygon_wgs84,
        pre_fetched_climate=live_climate_dict,
        has_pre_fetched=True
    )



    # 7. Deterministic Adaptive Risk Models
    erosion_res = compute_erosion_risk(
        dem["slope_mean_deg"],
        rain["annual_mean_mm"],
        veg["ndvi_mean"],
        soil_res["clay_pct"],
        soil_res["sand_pct"],
        water_coverage_pct=water_cov_pct,
        is_water_body=is_water
    )

    flood_res = compute_flood_risk(
        dem["elevation_mean_m"],
        dem["slope_mean_deg"],
        water_res["distance_to_nearest_water_m"],
        rain["annual_mean_mm"],
        lc["composition"].get("Urban", 0.0),
        soil_res["clay_pct"],
        water_coverage_pct=water_cov_pct,
        is_water_body=is_water
    )

    drought_res = compute_drought_risk(
        rain["annual_mean_mm"],
        rain["dry_months_count"],
        veg["ndvi_mean"],
        soil_res["sand_pct"],
        soil_res["organic_matter_pct"],
        water_coverage_pct=water_cov_pct,
        is_water_body=is_water
    )

    terrain_res = compute_terrain_stability(
        dem["slope_mean_deg"],
        dem["elevation_std_m"],
        veg["ndvi_mean"],
        erosion_res["score"],
        soil_res["sand_pct"],
        soil_res["clay_pct"],
        water_coverage_pct=water_cov_pct,
        is_water_body=is_water
    )

    priority_res = compute_priority_score(
        veg["ndvi_mean"],
        erosion_res["score"],
        flood_res["score"],
        drought_res["score"],
        terrain_res["score"]
    )

    # Build Pydantic Response Models with Metadata
    terrain = TerrainMetrics(
        elevation_min_m=dem["elevation_min_m"],
        elevation_max_m=dem["elevation_max_m"],
        elevation_mean_m=dem["elevation_mean_m"],
        slope_min_deg=dem["slope_min_deg"],
        slope_max_deg=dem["slope_max_deg"],
        slope_mean_deg=dem["slope_mean_deg"],
        terrain_stability_index=terrain_res["score"],
        metadata=dem["metadata"]
    )

    vegetation = VegetationMetrics(
        ndvi_mean=veg["ndvi_mean"],
        ndvi_min=veg["ndvi_min"],
        ndvi_max=veg["ndvi_max"],
        health_status=veg["health_status"],
        canopy_cover_pct=veg["canopy_cover_pct"],
        satellite_source=veg["satellite_source"],
        satellite_acquisition_date=veg["satellite_acquisition_date"],
        metadata=veg["metadata"]
    )

    land_cover = LandCoverMetrics(
        primary_class=lc["primary_class"],
        composition=lc["composition"],
        metadata=lc["metadata"]
    )

    rainfall = RainfallMetrics(
        annual_mean_mm=rain["annual_mean_mm"],
        monsoon_season_mm=rain["monsoon_season_mm"],
        dry_months_count=rain["dry_months_count"],
        monthly_avg_mm=rain["monthly_avg_mm"],
        metadata=rain["metadata"]
    )

    soil = SoilMetrics(
        type=soil_res["type"],
        ph=soil_res["ph"],
        organic_matter_pct=soil_res["organic_matter_pct"],
        erosion_susceptibility=soil_res["erosion_susceptibility"],
        clay_pct=soil_res["clay_pct"],
        sand_pct=soil_res["sand_pct"],
        silt_pct=soil_res["silt_pct"],
        metadata=soil_res["metadata"]
    )

    water = WaterMetrics(
        distance_to_nearest_water_m=water_res["distance_to_nearest_water_m"],
        water_coverage_pct=water_res["water_coverage_pct"],
        metadata=water_res["metadata"]
    )

    risk = RiskScores(
        erosion_risk=erosion_res["score"],
        flood_risk=flood_res["score"],
        drought_risk=drought_res["score"],
        terrain_stability=terrain_res["score"],
        restoration_priority=priority_res["level"],
        priority_score=priority_res["score"],
        metadata={
            "priority_score": priority_res,
            "erosion_risk": erosion_res,
            "flood_risk": flood_res,
            "drought_risk": drought_res,
            "terrain_stability": terrain_res
        }
    )

    regional_raw = {
        "dem": dem,
        "veg": veg,
        "lc": lc,
        "rain": rain,
        "soil": soil_res,
        "water": water_res
    }

    return terrain, vegetation, land_cover, rainfall, soil, water, risk, regional_raw


