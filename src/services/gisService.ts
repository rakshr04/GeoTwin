import * as turf from '@turf/turf';

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface GISMetrics {
  areaM2: number;
  areaHa: number;
  perimeterM: number;
  verticesCount: number;
  centroid: [number, number]; // [longitude, latitude]
  bbox: [number, number, number, number]; // [min_lon, min_lat, max_lon, max_lat]
}

export interface PriorityZone {
  cell_id: string;
  area_ha: number;
  elevation_mean: number;
  slope_mean: number;
  ndvi_mean: number;
  rainfall_mean?: number;
  land_cover: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  priority_score: number;
  color: string;
  geometry: GeoJSONPolygon;
}

export interface AnalysisResult {
  geometry: {
    area_m2: number;
    area_ha: number;
    perimeter_m: number;
    centroid: [number, number];
    bbox: [number, number, number, number];
    num_vertices: number;
  };
  terrain: {
    elevation_min_m: number;
    elevation_max_m: number;
    elevation_mean_m: number;
    slope_mean_deg: number;
    terrain_stability_index: number;
  };
  vegetation: {
    ndvi_mean: number;
    ndvi_min: number;
    ndvi_max: number;
    health_status: string;
    canopy_cover_pct: number;
    satellite_source?: string;
    satellite_acquisition_date?: string;
  };
  land_cover: {
    primary_class: string;
    composition: Record<string, number>;
  };
  rainfall: {
    annual_mean_mm: number;
    monsoon_season_mm: number;
    dry_months_count: number;
  };
  soil: {
    type: string;
    ph: number;
    organic_matter_pct: number;
    erosion_susceptibility: string;
  };
  risk: {
    erosion_risk: number;
    flood_risk: number;
    drought_risk: number;
    terrain_stability: number;
    restoration_priority: string;
  };
  priority_zones: PriorityZone[];
}

const FASTAPI_URL = import.meta.env.VITE_GEOSPATIAL_API_URL || 'http://localhost:8005';

export function computeClientMetrics(geojson: GeoJSONPolygon): GISMetrics {
  try {
    const feature = turf.polygon(geojson.coordinates);
    const areaM2 = turf.area(feature);
    const areaHa = areaM2 / 10000.0;
    const perimeterM = turf.length(feature, { units: 'meters' });
    const centroidFeature = turf.centroid(feature);
    const bbox = turf.bbox(feature) as [number, number, number, number];

    const outerRing = geojson.coordinates[0] || [];
    const isClosed =
      outerRing.length > 1 &&
      outerRing[0][0] === outerRing[outerRing.length - 1][0] &&
      outerRing[0][1] === outerRing[outerRing.length - 1][1];
    const verticesCount = isClosed ? outerRing.length - 1 : outerRing.length;

    return {
      areaM2: Math.round(areaM2 * 100) / 100,
      areaHa: Math.round(areaHa * 10000) / 10000,
      perimeterM: Math.round(perimeterM * 100) / 100,
      verticesCount,
      centroid: [
        Math.round(centroidFeature.geometry.coordinates[0] * 1000000) / 1000000,
        Math.round(centroidFeature.geometry.coordinates[1] * 1000000) / 1000000,
      ],
      bbox: [
        Math.round(bbox[0] * 1000000) / 1000000,
        Math.round(bbox[1] * 1000000) / 1000000,
        Math.round(bbox[2] * 1000000) / 1000000,
        Math.round(bbox[3] * 1000000) / 1000000,
      ],
    };
  } catch {
    return {
      areaM2: 0,
      areaHa: 0,
      perimeterM: 0,
      verticesCount: 0,
      centroid: [0, 0],
      bbox: [0, 0, 0, 0],
    };
  }
}

export async function analyzeRegion(polygon: GeoJSONPolygon): Promise<AnalysisResult> {
  const response = await fetch(`${FASTAPI_URL}/api/analyze-region`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ polygon }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Server returned status ${response.status}`);
  }

  return (await response.json()) as AnalysisResult;
}
