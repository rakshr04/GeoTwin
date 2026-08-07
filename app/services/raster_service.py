import numpy as np
from typing import Dict, Any, Optional
from shapely.geometry import Polygon

try:
    import rasterio
    from rasterio.mask import mask
    RASTERIO_AVAILABLE = True
except ImportError:
    RASTERIO_AVAILABLE = False

def calculate_stats_from_array(data: np.ndarray, nodata: Optional[float] = None) -> Dict[str, float]:
    """Calculates min, max, mean, median stats on a 2D/3D numpy array ignoring NoData and NaNs."""
    if nodata is not None:
        valid_data = data[data != nodata]
    else:
        valid_data = data

    valid_data = valid_data[~np.isnan(valid_data)]

    if valid_data.size == 0:
        return {"min": 0.0, "max": 0.0, "mean": 0.0, "median": 0.0}

    return {
        "min": float(np.min(valid_data)),
        "max": float(np.max(valid_data)),
        "mean": float(np.mean(valid_data)),
        "median": float(np.median(valid_data))
    }

def clip_and_analyze_raster(raster_path: str, shape_wgs84: Polygon) -> Dict[str, float]:
    """
    Clips a raster file on disk using a Shapely polygon boundary and computes summary statistics.
    """
    if not RASTERIO_AVAILABLE:
        # Fallback if rasterio native library isn't linked
        return {"min": 0.0, "max": 0.0, "mean": 0.0, "median": 0.0}

    try:
        with rasterio.open(raster_path) as src:
            out_image, out_transform = mask(src, [shape_wgs84], crop=True)
            nodata = src.nodata
            stats = calculate_stats_from_array(out_image, nodata=nodata)
            return stats
    except Exception:
        return {"min": 0.0, "max": 0.0, "mean": 0.0, "median": 0.0}
