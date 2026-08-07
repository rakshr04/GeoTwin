import pyproj
from shapely.ops import transform
from shapely.geometry import base

def get_utm_epsg(lon: float, lat: float) -> int:
    """Calculate the UTM zone EPSG code for a given longitude and latitude."""
    zone_number = int((lon + 180) / 6) + 1
    if lat >= 0:
        return 32600 + zone_number
    else:
        return 32700 + zone_number

def reproject_shape(geometry: base.BaseGeometry, from_epsg: int = 4326, to_epsg: int = 3857) -> base.BaseGeometry:
    """Reproject a Shapely geometry from one EPSG code to another."""
    if from_epsg == to_epsg:
        return geometry
    project = pyproj.Transformer.from_crs(
        pyproj.CRS(f"EPSG:{from_epsg}"),
        pyproj.CRS(f"EPSG:{to_epsg}"),
        always_xy=True
    ).transform
    return transform(project, geometry)
