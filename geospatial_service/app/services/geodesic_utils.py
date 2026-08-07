import math
from typing import Tuple


def bbox_size_meters(bbox: Tuple[float, float, float, float]) -> Tuple[float, float]:
    """Return width and height of a WGS‑84 bounding box in metres.

    The calculation uses a simple equirectangular approximation:
    * 1° latitude ≈ 111 000 m
    * 1° longitude ≈ 111 000 m * cos(latitude)

    Args:
        bbox: (min_lon, min_lat, max_lon, max_lat)

    Returns:
        (width_meters, height_meters)
    """
    min_lon, min_lat, max_lon, max_lat = bbox
    # Center latitude for longitude scaling
    center_lat = (min_lat + max_lat) / 2.0
    meters_per_deg_lat = 111_000.0
    meters_per_deg_lon = 111_000.0 * math.cos(math.radians(center_lat))

    width_deg = max_lon - min_lon
    height_deg = max_lat - min_lat

    width_m = width_deg * meters_per_deg_lon
    height_m = height_deg * meters_per_deg_lat
    return width_m, height_m
