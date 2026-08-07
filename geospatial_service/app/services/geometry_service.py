from typing import Dict, Any, Tuple
from shapely.geometry import shape, Polygon
from fastapi import HTTPException

from app.models.schemas import GeoJSONPolygonGeometry, GeometryMetrics
from app.utils.spatial import get_utm_epsg, reproject_shape

def validate_and_parse_polygon(geojson_dict: Dict[str, Any]) -> Polygon:
    """
    Validates GeoJSON polygon geometry.
    Rejects self-intersections, too few vertices, or invalid geometries.
    """
    try:
        geom = shape(geojson_dict)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid GeoJSON structure: {str(e)}"
        )

    if not isinstance(geom, Polygon):
        raise HTTPException(
            status_code=400,
            detail=f"Geometry must be a Polygon, received: {geom.geom_type}"
        )

    # Check minimum vertices (exterior ring must have >= 4 coordinates including closure)
    exterior_coords = list(geom.exterior.coords)
    unique_coords = set(exterior_coords)
    if len(unique_coords) < 3:
        raise HTTPException(
            status_code=400,
            detail=f"Polygon must have at least 3 unique vertices. Found: {len(unique_coords)}"
        )

    if not geom.is_valid:
        raise HTTPException(
            status_code=400,
            detail="Polygon geometry is invalid or has self-intersections."
        )

    if not geom.is_simple:
        raise HTTPException(
            status_code=400,
            detail="Polygon self-intersects."
        )

    return geom

def process_geometry_metrics(polygon_wgs84: Polygon) -> Tuple[GeometryMetrics, Polygon, int]:
    """
    Computes spatial metrics by reprojecting WGS84 polygon to an optimal UTM metric projection.
    """
    centroid_wgs84 = polygon_wgs84.centroid
    centroid_lon, centroid_lat = centroid_wgs84.x, centroid_wgs84.y
    bbox_wgs84 = list(polygon_wgs84.bounds)  # [minx, miny, maxx, maxy]

    # Calculate optimal UTM zone for metric accuracy
    utm_epsg = get_utm_epsg(centroid_lon, centroid_lat)
    polygon_metric = reproject_shape(polygon_wgs84, from_epsg=4326, to_epsg=utm_epsg)

    area_m2 = float(polygon_metric.area)
    area_ha = float(area_m2 / 10000.0)
    perimeter_m = float(polygon_metric.length)

    exterior_coords = list(polygon_wgs84.exterior.coords)
    # Remove duplicate closing point for vertex count
    unique_vertices = len(exterior_coords) - 1 if exterior_coords[0] == exterior_coords[-1] else len(exterior_coords)

    metrics = GeometryMetrics(
        area_m2=round(area_m2, 2),
        area_ha=round(area_ha, 4),
        perimeter_m=round(perimeter_m, 2),
        centroid=[round(centroid_lon, 6), round(centroid_lat, 6)],
        bbox=[round(b, 6) for b in bbox_wgs84],
        num_vertices=unique_vertices
    )

    return metrics, polygon_metric, utm_epsg
