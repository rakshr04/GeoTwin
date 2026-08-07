from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class GeoJSONPolygonGeometry(BaseModel):
    type: str = Field(..., description="Must be 'Polygon'")
    coordinates: List[List[List[float]]] = Field(
        ...,
        description="Array of linear rings. First ring is exterior boundary."
    )

class AnalyzeRegionRequest(BaseModel):
    polygon: GeoJSONPolygonGeometry

class GeometryMetrics(BaseModel):
    area_m2: float
    area_ha: float
    perimeter_m: float
    centroid: List[float]  # [longitude, latitude]
    bbox: List[float]      # [min_lon, min_lat, max_lon, max_lat]
    num_vertices: int
    metadata: Optional[Dict[str, Any]] = None

class TerrainMetrics(BaseModel):
    elevation_min_m: float
    elevation_max_m: float
    elevation_mean_m: float
    slope_mean_deg: float
    slope_min_deg: Optional[float] = 0.0
    slope_max_deg: Optional[float] = 0.0
    terrain_stability_index: float
    metadata: Optional[Dict[str, Any]] = None

class VegetationMetrics(BaseModel):
    ndvi_mean: float
    ndvi_min: float
    ndvi_max: float
    health_status: str
    canopy_cover_pct: float
    satellite_source: Optional[str] = "Sentinel-2 L2A"
    satellite_acquisition_date: Optional[str] = "2026-08-01"
    metadata: Optional[Dict[str, Any]] = None

class LandCoverMetrics(BaseModel):
    primary_class: str
    composition: Dict[str, float]
    metadata: Optional[Dict[str, Any]] = None

class RainfallMetrics(BaseModel):
    annual_mean_mm: float
    monsoon_season_mm: float
    dry_months_count: int
    monthly_avg_mm: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

class SoilMetrics(BaseModel):
    type: str
    ph: float
    organic_matter_pct: float
    erosion_susceptibility: str
    clay_pct: Optional[float] = 30.0
    sand_pct: Optional[float] = 50.0
    silt_pct: Optional[float] = 20.0
    metadata: Optional[Dict[str, Any]] = None

class WaterMetrics(BaseModel):
    distance_to_nearest_water_m: float
    water_coverage_pct: float
    metadata: Optional[Dict[str, Any]] = None

class RiskScores(BaseModel):
    erosion_risk: float        # 0 - 100
    flood_risk: float          # 0 - 100
    drought_risk: float        # 0 - 100
    terrain_stability: float   # 0 - 100
    restoration_priority: str  # "Low", "Medium", "High", "Critical"
    priority_score: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

class PriorityZoneCell(BaseModel):
    cell_id: str
    area_ha: float
    elevation_mean: float
    slope_mean: float
    ndvi_mean: float
    land_cover: str
    priority: str              # "Low", "Medium", "High", "Critical"
    priority_score: float      # 0 - 100
    color: str                 # Hex color code
    geometry: Dict[str, Any]   # GeoJSON Polygon dict
    soil_type: Optional[str] = None
    risk_scores: Optional[Dict[str, float]] = None
    metadata: Optional[Dict[str, Any]] = None

class AnalyzeRegionResponse(BaseModel):
    geometry: GeometryMetrics
    terrain: TerrainMetrics
    vegetation: VegetationMetrics
    land_cover: LandCoverMetrics
    rainfall: RainfallMetrics
    soil: SoilMetrics
    water: Optional[WaterMetrics] = None
    risk: RiskScores
    priority_zones: List[PriorityZoneCell]

