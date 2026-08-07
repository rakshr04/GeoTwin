from fastapi import APIRouter, HTTPException
from app.models.schemas import AnalyzeRegionRequest, AnalyzeRegionResponse
from app.services.geometry_service import validate_and_parse_polygon, process_geometry_metrics
from app.services.environmental_service import compute_environmental_analysis
from app.services.grid_service import generate_grid_priority_zones

router = APIRouter(prefix="/api", tags=["Geospatial Analysis"])

@router.post("/analyze-region", response_model=AnalyzeRegionResponse)
async def analyze_region(payload: AnalyzeRegionRequest):
    """
    POST /api/analyze-region
    Receives GeoJSON Polygon, validates geometry, reprojects to projected metric CRS,
    calculates environmental parameters, divides boundary into grid priority cells, and returns structured JSON analysis.
    """
    polygon_dict = payload.polygon.model_dump()
    
    # 1. Geometry Validation
    polygon_wgs84 = validate_and_parse_polygon(polygon_dict)

    # 2. Metric Projection & Spatial Geometry Analysis
    geom_metrics, polygon_metric, utm_epsg = process_geometry_metrics(polygon_wgs84)

    # 3. Environmental Analysis (Terrain, Vegetation, Land Cover, Rainfall, Soil, Water, Risk)
    terrain, vegetation, land_cover, rainfall, soil, water, risk, regional_raw = compute_environmental_analysis(
        polygon_wgs84=polygon_wgs84,
        polygon_metric=polygon_metric,
        area_ha=geom_metrics.area_ha
    )

    # 4. Independent Grid Cell Analysis & Priority Zones (Reusing Live Regional Metrics for Sub-second Performance)
    priority_zones = generate_grid_priority_zones(
        polygon_wgs84=polygon_wgs84,
        total_area_ha=geom_metrics.area_ha,
        target_cells_count=16,
        regional_dem=regional_raw["dem"],
        regional_ndvi=regional_raw["veg"],
        regional_landcover=regional_raw["lc"],
        regional_soil=regional_raw["soil"],
        regional_rain=regional_raw["rain"],
        regional_water=regional_raw["water"]
    )

    # 5. Assemble Structured JSON Response with Complete Metadata
    return AnalyzeRegionResponse(
        geometry=geom_metrics,
        terrain=terrain,
        vegetation=vegetation,
        land_cover=land_cover,
        rainfall=rainfall,
        soil=soil,
        water=water,
        risk=risk,
        priority_zones=priority_zones
    )

