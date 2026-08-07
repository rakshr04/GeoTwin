import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { Maximize2, Minimize2, Trash2, PlusCircle } from 'lucide-react';

import type { GeoJSONPolygon, PriorityZone } from '../../services/gisService';

interface InteractiveGISMapProps {
  onPolygonChange: (polygon: GeoJSONPolygon | null) => void;
  priorityZones?: PriorityZone[];
  initialCenter?: [number, number]; // [lat, lng]
  initialZoom?: number;
}

export const InteractiveGISMap: React.FC<InteractiveGISMapProps> = ({
  onPolygonChange,
  priorityZones = [],
  initialCenter = [17.385, 78.475], // Telangana / Hyderabad area
  initialZoom = 13,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const activePolygonLayerRef = useRef<L.Polygon | null>(null);
  const priorityZonesGroupRef = useRef<L.LayerGroup | null>(null);

  const [baseMap, setBaseMap] = useState<'street' | 'satellite'>('street');
  const [isDrawingActive, setIsDrawingActive] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const streetTileRef = useRef<L.TileLayer>(
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    })
  );

  const satelliteTileRef = useRef<L.TileLayer>(
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      }
    )
  );

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
    });

    streetTileRef.current.addTo(map);
    mapRef.current = map;

    // Initialize Layer Group for Priority Zones
    const priorityGroup = L.layerGroup().addTo(map);
    priorityZonesGroupRef.current = priorityGroup;

    // Configure Geoman Drawing Controls
    map.pm.addControls({
      position: 'topleft',
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawCircle: false,
      drawText: false,
      editMode: true,
      dragMode: true,
      cutPolygon: false,
      removalMode: true,
      drawPolygon: true,
    });

    map.pm.setGlobalOptions({
      allowSelfIntersection: false,
      pathOptions: {
        color: '#22c55e',
        fillColor: '#22c55e',
        fillOpacity: 0.25,
        weight: 3,
      },
    });

    // Helper to extract GeoJSON Polygon
    const extractGeoJSON = (layer: L.Polygon): GeoJSONPolygon | null => {
      const geojson = layer.toGeoJSON();
      if (geojson.geometry.type === 'Polygon') {
        return {
          type: 'Polygon',
          coordinates: geojson.geometry.coordinates as number[][][],
        };
      }
      return null;
    };

    // Event Listeners for Polygon Creation
    map.on('pm:create', (e: any) => {
      const layer = e.layer as L.Polygon;

      // Single Polygon Restriction: Remove previous polygon if exists
      if (activePolygonLayerRef.current && activePolygonLayerRef.current !== layer) {
        map.removeLayer(activePolygonLayerRef.current);
      }

      activePolygonLayerRef.current = layer;
      setIsDrawingActive(false);

      const parsed = extractGeoJSON(layer);
      onPolygonChange(parsed);

      // Listen for edit and drag events on the active layer
      layer.on('pm:edit', () => {
        onPolygonChange(extractGeoJSON(layer));
      });
      layer.on('pm:dragend', () => {
        onPolygonChange(extractGeoJSON(layer));
      });
      layer.on('pm:remove', () => {
        activePolygonLayerRef.current = null;
        onPolygonChange(null);
      });
    });

    map.on('pm:drawstart', () => {
      setIsDrawingActive(true);
    });

    map.on('pm:drawend', () => {
      setIsDrawingActive(false);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle Base Map Toggle
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (baseMap === 'street') {
      if (map.hasLayer(satelliteTileRef.current)) {
        map.removeLayer(satelliteTileRef.current);
      }
      streetTileRef.current.addTo(map);
    } else {
      if (map.hasLayer(streetTileRef.current)) {
        map.removeLayer(streetTileRef.current);
      }
      satelliteTileRef.current.addTo(map);
    }
  }, [baseMap]);

  // Handle Priority Zones Overlay Rendering
  useEffect(() => {
    if (!mapRef.current || !priorityZonesGroupRef.current) return;
    const priorityGroup = priorityZonesGroupRef.current;
    priorityGroup.clearLayers();

    if (!priorityZones || priorityZones.length === 0) return;

    priorityZones.forEach((zone) => {
      const polygonLayer = L.geoJSON(zone.geometry as any, {
        style: {
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: 0.45,
          weight: 2,
        },
      });

      const popupContent = `
        <div style="font-family: sans-serif; padding: 4px;">
          <div style="font-weight: bold; font-size: 13px; color: ${zone.color};">
            ${zone.cell_id} &bull; Priority: ${zone.priority}
          </div>
          <div style="font-size: 11px; margin-top: 4px; color: #374151;">
            <b>Priority Score:</b> ${zone.priority_score} / 100<br/>
            <b>Elevation:</b> ${zone.elevation_mean} m<br/>
            <b>Slope:</b> ${zone.slope_mean}&deg;<br/>
            <b>NDVI:</b> ${zone.ndvi_mean}<br/>
            <b>Rainfall:</b> ${zone.rainfall_mean ? zone.rainfall_mean + ' mm' : 'N/A'}<br/>
            <b>Land Cover:</b> ${zone.land_cover}
          </div>
        </div>
      `;
      polygonLayer.bindTooltip(popupContent, { sticky: true });
      priorityGroup.addLayer(polygonLayer);
    });

    // Fit map bounds to priority zones if active polygon is present
    if (activePolygonLayerRef.current && mapRef.current) {
      mapRef.current.fitBounds(activePolygonLayerRef.current.getBounds(), { padding: [30, 30] });
    }
  }, [priorityZones]);

  // Manual Trigger to start drawing
  const startDrawing = () => {
    if (!mapRef.current) return;
    if (activePolygonLayerRef.current) {
      mapRef.current.removeLayer(activePolygonLayerRef.current);
      activePolygonLayerRef.current = null;
      onPolygonChange(null);
    }
    mapRef.current.pm.enableDraw('Polygon', {
      allowSelfIntersection: false,
    });
  };

  // Clear current active polygon
  const clearPolygon = () => {
    if (!mapRef.current) return;
    if (activePolygonLayerRef.current) {
      mapRef.current.removeLayer(activePolygonLayerRef.current);
      activePolygonLayerRef.current = null;
      onPolygonChange(null);
    }
    if (priorityZonesGroupRef.current) {
      priorityZonesGroupRef.current.clearLayers();
    }
    mapRef.current.pm.disableDraw();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  return (
    <div className="relative w-full h-[68vh] min-h-[500px] rounded-2xl overflow-hidden border border-[#D4D8D0] shadow-sm bg-[#121614]">
      {/* Top Map Control Bar */}
      <div className="absolute top-4 left-14 z-[1000] flex flex-wrap gap-2 items-center bg-[#FBFAEF]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-[#D4D8D0] shadow-md">
        {/* Base Map Switcher */}
        <div className="flex items-center bg-white/80 p-1 rounded-lg border border-[#E2E8F0] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setBaseMap('street')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              baseMap === 'street'
                ? 'bg-[#5F7F52] text-white shadow-sm'
                : 'text-[#6C756D] hover:text-[#121614]'
            }`}
          >
            Street View
          </button>
          <button
            type="button"
            onClick={() => setBaseMap('satellite')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              baseMap === 'satellite'
                ? 'bg-[#5F7F52] text-white shadow-sm'
                : 'text-[#6C756D] hover:text-[#121614]'
            }`}
          >
            Satellite
          </button>
        </div>

        <div className="h-4 w-[1px] bg-[#D4D8D0]" />

        {/* Draw Polygon Trigger */}
        <button
          type="button"
          onClick={startDrawing}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
            isDrawingActive
              ? 'bg-[#E53E3E] text-white animate-pulse'
              : 'bg-[#5F7F52] hover:bg-[#4d6942] text-white shadow-sm'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          {isDrawingActive ? 'Click Points on Map...' : 'Draw Polygon'}
        </button>

        {/* Clear Button */}
        <button
          type="button"
          onClick={clearPolygon}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#6C756D] hover:text-[#E53E3E] hover:bg-red-50 rounded-lg transition-all"
          title="Clear current polygon"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Map
        </button>

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-1.5 text-[#6C756D] hover:text-[#121614] hover:bg-black/5 rounded-lg transition-all"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Map Canvas */}
      <div ref={containerRef} className="w-full h-full z-0" />
    </div>
  );
};
