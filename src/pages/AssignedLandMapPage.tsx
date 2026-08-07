import { useState } from 'react';
import {
  MapPin,
  Compass,
  AlertTriangle,
  Activity,
  CheckCircle2,
  TrendingUp,
  CloudRain,
  ShieldAlert,
  Loader2,
  Trash2,
  Sparkles
} from 'lucide-react';

import { FieldShell } from '../components/field/FieldShell';
import { InteractiveGISMap } from '../components/gis/InteractiveGISMap';
import { useFieldDashboard } from '../hooks/useFieldDashboard';
import {
  computeClientMetrics,
  analyzeRegion,
  type GeoJSONPolygon,
  type GISMetrics,
  type AnalysisResult
} from '../services/gisService';

export default function AssignedLandMapPage() {
  const { data: dashboardData } = useFieldDashboard();

  const [polygon, setPolygon] = useState<GeoJSONPolygon | null>(null);
  const [metrics, setMetrics] = useState<GISMetrics | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle Polygon Creation / Modification on Map
  const handlePolygonChange = (newPolygon: GeoJSONPolygon | null) => {
    setPolygon(newPolygon);
    setErrorMsg(null);

    if (newPolygon) {
      const clientMetrics = computeClientMetrics(newPolygon);
      setMetrics(clientMetrics);
    } else {
      setMetrics(null);
      setAnalysisResult(null);
    }
  };

  // Trigger FastAPI Backend Geospatial Analysis
  const handleAnalyzeClick = async () => {
    if (!polygon) return;
    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const result = await analyzeRegion(polygon);
      setAnalysisResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Geospatial analysis failed. Please verify the polygon.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Clear Map Selection
  const handleClear = () => {
    setPolygon(null);
    setMetrics(null);
    setAnalysisResult(null);
    setErrorMsg(null);
  };

  return (
    <FieldShell
      title="Assigned Land & GIS Workbench"
      subtitle="Interactive GIS parcel selection, spatial analysis, and priority zone mapping"
      officerName={dashboardData?.officer.displayName}
      notificationCount={dashboardData?.notificationCount}
    >
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

        {/* Instructions / Notice Bar */}
        <div className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#5F7F52]/10 rounded-xl text-[#5F7F52]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#121614]">Interactive GIS Workbench</h3>
              <p className="text-xs text-[#6C756D]">
                Draw a land boundary using click-by-click vertex placement, review metric calculations, and trigger environmental analysis.
              </p>
            </div>
          </div>
          {polygon && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#22c55e]/15 text-[#15803d] text-xs font-bold rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              1 Active Polygon Selected
            </span>
          )}
        </div>

        {/* Large Interactive Leaflet GIS Map Canvas */}
        <div className="space-y-3">
          <InteractiveGISMap
            onPolygonChange={handlePolygonChange}
            priorityZones={analysisResult?.priority_zones}
          />
        </div>

        {/* Error Alert Display */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 text-sm">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Selected Area Information Panel */}
        <div className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-6 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4D8D0]/60 pb-4">
            <div>
              <h3 className="text-base font-bold text-[#121614] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#5F7F52]" />
                Selected Land Information
              </h3>
              <p className="text-xs text-[#6C756D] mt-0.5">
                Real-time spatial geometry measurements computed via Turf.js
              </p>
            </div>

            {/* Actions: Clear & Analyze Selected Land */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClear}
                disabled={!polygon || isAnalyzing}
                className="px-4 py-2 text-xs font-bold text-[#6C756D] hover:text-[#E53E3E] disabled:opacity-40 disabled:hover:text-[#6C756D] border border-[#D4D8D0] bg-white rounded-xl transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>

              <button
                type="button"
                onClick={handleAnalyzeClick}
                disabled={!polygon || isAnalyzing}
                className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-sm flex items-center gap-2 ${
                  !polygon || isAnalyzing
                    ? 'bg-[#6C756D]/40 cursor-not-allowed'
                    : 'bg-[#5F7F52] hover:bg-[#4d6942] active:scale-98'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Geospatial Backend...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze Selected Land
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Metric Cards Grid */}
          {metrics ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
                <span className="text-[11px] font-semibold text-[#6C756D] uppercase tracking-wider">Area (Hectares)</span>
                <div className="text-lg font-extrabold text-[#121614] mt-1">{metrics.areaHa} <span className="text-xs font-medium text-[#6C756D]">ha</span></div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
                <span className="text-[11px] font-semibold text-[#6C756D] uppercase tracking-wider">Area ($m^2$)</span>
                <div className="text-lg font-extrabold text-[#121614] mt-1">{metrics.areaM2.toLocaleString()} <span className="text-xs font-medium text-[#6C756D]">$m^2$</span></div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
                <span className="text-[11px] font-semibold text-[#6C756D] uppercase tracking-wider">Perimeter</span>
                <div className="text-lg font-extrabold text-[#121614] mt-1">{metrics.perimeterM.toLocaleString()} <span className="text-xs font-medium text-[#6C756D]">m</span></div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
                <span className="text-[11px] font-semibold text-[#6C756D] uppercase tracking-wider">Vertices</span>
                <div className="text-lg font-extrabold text-[#121614] mt-1">{metrics.verticesCount}</div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs col-span-2 sm:col-span-1">
                <span className="text-[11px] font-semibold text-[#6C756D] uppercase tracking-wider">Centroid</span>
                <div className="text-xs font-bold text-[#121614] mt-1.5 truncate">
                  {metrics.centroid[0]}, {metrics.centroid[1]}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center border-2 border-dashed border-[#D4D8D0]/80 rounded-xl bg-white/50">
              <MapPin className="w-8 h-8 text-[#6C756D]/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#6C756D]">No polygon drawn yet</p>
              <p className="text-xs text-[#6C756D]/80 mt-0.5">
                Click <b>"Draw Polygon"</b> on the map top bar, click vertices to outline your land parcel, and double-click to finish.
              </p>
            </div>
          )}
        </div>

        {/* Environmental Analysis Results Section */}
        {analysisResult && (
          <div className="bg-white border border-[#D4D8D0] rounded-2xl p-6 space-y-6 shadow-md animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#E2E8F0] pb-4">
              <div>
                <span className="text-xs font-bold text-[#5F7F52] uppercase tracking-wider">FastAPI Geospatial Backend Response</span>
                <h3 className="text-lg font-extrabold text-[#121614] mt-0.5">Environmental & Restoration Analysis</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#6C756D]">Restoration Priority:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide text-white ${
                    analysisResult.risk.restoration_priority === 'Critical'
                      ? 'bg-red-600'
                      : analysisResult.risk.restoration_priority === 'High'
                      ? 'bg-orange-500'
                      : analysisResult.risk.restoration_priority === 'Medium'
                      ? 'bg-yellow-500'
                      : 'bg-green-600'
                  }`}
                >
                  {analysisResult.risk.restoration_priority} Priority
                </span>
              </div>
            </div>

            {/* Key Indicators Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Terrain Card */}
              <div className="p-4 bg-[#F8FAF6] rounded-xl border border-[#E2E8F0] space-y-2">
                <div className="flex items-center gap-2 text-[#5F7F52] font-bold text-sm">
                  <TrendingUp className="w-4 h-4" />
                  Terrain Parameters
                </div>
                <div className="text-xs text-[#374151] space-y-1">
                  <div className="flex justify-between"><span>Mean Elevation:</span> <b>{analysisResult.terrain.elevation_mean_m} m</b></div>
                  <div className="flex justify-between"><span>Mean Slope:</span> <b>{analysisResult.terrain.slope_mean_deg}&deg;</b></div>
                  <div className="flex justify-between"><span>Terrain Stability:</span> <b>{analysisResult.terrain.terrain_stability_index}%</b></div>
                </div>
              </div>

              {/* Vegetation Card */}
              <div className="p-4 bg-[#F8FAF6] rounded-xl border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#5F7F52] font-bold text-sm">
                    <Activity className="w-4 h-4" />
                    Vegetation & NDVI
                  </div>
                  {analysisResult.vegetation.satellite_acquisition_date && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                      Sentinel-2 ({analysisResult.vegetation.satellite_acquisition_date})
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#374151] space-y-1">
                  <div className="flex justify-between"><span>Mean NDVI:</span> <b>{analysisResult.vegetation.ndvi_mean}</b></div>
                  <div className="flex justify-between"><span>Canopy Cover:</span> <b>{analysisResult.vegetation.canopy_cover_pct}%</b></div>
                  <div className="flex justify-between"><span>Health Status:</span> <b className="text-right">{analysisResult.vegetation.health_status}</b></div>
                </div>
              </div>

              {/* Climate & Soil Card */}
              <div className="p-4 bg-[#F8FAF6] rounded-xl border border-[#E2E8F0] space-y-2">
                <div className="flex items-center gap-2 text-[#5F7F52] font-bold text-sm">
                  <CloudRain className="w-4 h-4" />
                  Soil & Climate
                </div>
                <div className="text-xs text-[#374151] space-y-1">
                  <div className="flex justify-between"><span>Soil Type:</span> <b>{analysisResult.soil.type}</b></div>
                  <div className="flex justify-between"><span>Soil pH:</span> <b>{analysisResult.soil.ph}</b></div>
                  <div className="flex justify-between"><span>Annual Rainfall:</span> <b>{analysisResult.rainfall.annual_mean_mm} mm</b></div>
                </div>
              </div>
            </div>

            {/* Risk Scores Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-[#121614] uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#5F7F52]" />
                Deterministic Environmental Risk Indicators
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-red-50/60 rounded-xl border border-red-100">
                  <span className="text-[11px] font-semibold text-red-700">Erosion Risk</span>
                  <div className="text-lg font-black text-red-900 mt-0.5">{analysisResult.risk.erosion_risk}%</div>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="text-[11px] font-semibold text-blue-700">Flood Risk</span>
                  <div className="text-lg font-black text-blue-900 mt-0.5">{analysisResult.risk.flood_risk}%</div>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                  <span className="text-[11px] font-semibold text-amber-700">Drought Risk</span>
                  <div className="text-lg font-black text-amber-900 mt-0.5">{analysisResult.risk.drought_risk}%</div>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="text-[11px] font-semibold text-emerald-700">Terrain Stability</span>
                  <div className="text-lg font-black text-emerald-900 mt-0.5">{analysisResult.risk.terrain_stability}%</div>
                </div>
              </div>
            </div>

            {/* Priority Zones Summary */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-extrabold text-[#121614] uppercase tracking-wider">
                  Grid Priority Zones ({analysisResult.priority_zones.length} Cells Partitioned)
                </h4>
                <span className="text-xs text-[#6C756D]">Rendered as color-coded overlays on map above</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {analysisResult.priority_zones.map((cell) => (
                  <div
                    key={cell.cell_id}
                    className="p-2 rounded-lg border text-center text-xs space-y-1"
                    style={{ backgroundColor: `${cell.color}15`, borderColor: cell.color }}
                  >
                    <div className="font-bold truncate" style={{ color: cell.color }}>
                      {cell.cell_id}
                    </div>
                    <div className="text-[10px] font-semibold text-[#374151]">{cell.priority_score} pts</div>
                    <div className="text-[9px] text-[#6C756D] capitalize">{cell.priority}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </FieldShell>
  );
}
