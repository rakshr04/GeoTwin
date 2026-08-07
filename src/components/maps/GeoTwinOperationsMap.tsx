import React, { useState, useEffect } from 'react';
import { Map, MapMarker, MarkerContent, MarkerTooltip, MarkerLabel, useMap } from '../ui/mapcn-marker-tooltip';
import { MapPin, Compass, Layers, Filter, Eye } from 'lucide-react';
import { getStatusColour, getStatusLabel, type GeoTwinPlot } from '../../lib/mapGeoTwinData';
import type { AssignedSector } from '../../types/fieldOperations';

interface GeoTwinOperationsMapProps {
  plots: GeoTwinPlot[];
  sectors: AssignedSector[];
  selectedPlot: GeoTwinPlot | null;
  onSelectPlot: (plot: GeoTwinPlot | null) => void;
  onOpenWorkspace?: (plot: GeoTwinPlot) => void;
}

// Inner component to handle MapLibre interactions that require the map instance
const MapLayersAndEvents: React.FC<{
  sectors: AssignedSector[];
  plots: GeoTwinPlot[];
  selectedPlot: GeoTwinPlot | null;
  onSelectPlot: (plot: GeoTwinPlot | null) => void;
  activeLayers: { boundaries: boolean; heat: boolean };
}> = ({ sectors, plots, selectedPlot, onSelectPlot, activeLayers }) => {
  const { map } = useMap();

  useEffect(() => {
    if (!map || sectors.length === 0) return;

    const sourceId = 'geotwin-boundaries';

    // Prepare GeoJSON features from sectors
    const features = sectors.map((sector) => {
      const plot = plots.find((p) => p.id === sector.id);
      const status = plot?.status || 'in_progress';
      return {
        type: 'Feature' as const,
        geometry: sector.geometry,
        id: sector.id,
        properties: {
          id: sector.id,
          name: sector.name,
          projectName: sector.projectName,
          status: status,
          progress: sector.progress,
        },
      };
    });

    const loadLayers = () => {
      if (map.getSource(sourceId)) {
        // Source already exists, just update data
        (map.getSource(sourceId) as any).setData({
          type: 'FeatureCollection',
          features,
        });
        return;
      }

      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      });

      // Status fill layer
      map.addLayer({
        id: 'geotwin-fill',
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': [
            'match',
            ['get', 'status'],
            'completed', '#4C91CF',
            'pending', '#D99A2B',
            'overdue', '#C95B4A',
            '#9BBE55' // in_progress fallback
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.32,
            ['boolean', ['feature-state', 'hover'], false],
            0.22,
            0.15
          ],
        },
      });

      // Outline layer
      map.addLayer({
        id: 'geotwin-outline',
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': [
            'match',
            ['get', 'status'],
            'completed', '#4C91CF',
            'pending', '#D99A2B',
            'overdue', '#C95B4A',
            '#9BBE55'
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            3,
            ['boolean', ['feature-state', 'hover'], false],
            2,
            1
          ],
        },
      });

      // Events
      let hoveredId: string | number | null = null;

      map.on('mousemove', 'geotwin-fill', (e: any) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          if (hoveredId !== null) {
            map.setFeatureState({ source: sourceId, id: hoveredId }, { hover: false });
          }
          hoveredId = feature.id ?? null;
          if (hoveredId !== null) {
            map.setFeatureState({ source: sourceId, id: hoveredId }, { hover: true });
          }
        }
      });

      map.on('mouseleave', 'geotwin-fill', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredId !== null) {
          map.setFeatureState({ source: sourceId, id: hoveredId }, { hover: false });
          hoveredId = null;
        }
      });

      map.on('click', 'geotwin-fill', (e: any) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const plotId = feature.properties?.id;
          const matchedPlot = plots.find((p) => p.id === plotId);
          if (matchedPlot) {
            onSelectPlot(matchedPlot);
          }
        }
      });
    };

    if (map.loaded()) {
      loadLayers();
    } else {
      map.on('load', loadLayers);
    }

    return () => {
      if (map.getLayer('geotwin-fill')) map.removeLayer('geotwin-fill');
      if (map.getLayer('geotwin-outline')) map.removeLayer('geotwin-outline');
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, sectors, plots, onSelectPlot]);

  // Update selected state feature state
  useEffect(() => {
    if (!map || sectors.length === 0) return;
    const sourceId = 'geotwin-boundaries';

    sectors.forEach((sector) => {
      const isSelected = selectedPlot?.id === sector.id;
      try {
        if (map.getSource(sourceId)) {
          map.setFeatureState(
            { source: sourceId, id: sector.id },
            { selected: isSelected }
          );
        }
      } catch (err) {
        // Ignored if map source is not ready
      }
    });
  }, [map, selectedPlot, sectors]);

  // Update visibility based on activeLayers
  useEffect(() => {
    if (!map) return;
    if (map.getLayer('geotwin-fill')) {
      map.setLayoutProperty(
        'geotwin-fill',
        'visibility',
        activeLayers.boundaries ? 'visible' : 'none'
      );
    }
    if (map.getLayer('geotwin-outline')) {
      map.setLayoutProperty(
        'geotwin-outline',
        'visibility',
        activeLayers.boundaries ? 'visible' : 'none'
      );
    }
  }, [map, activeLayers.boundaries]);

  return null;
};

export const GeoTwinOperationsMap: React.FC<GeoTwinOperationsMapProps> = ({
  plots,
  sectors,
  selectedPlot,
  onSelectPlot,
  onOpenWorkspace,
}) => {
  const [activeLayers, setActiveLayers] = useState({ boundaries: true, heat: false });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [mapCenter, setMapCenter] = useState<[number, number]>([78.4867, 17.385]);
  const [zoom, setZoom] = useState(9);

  // Filter plots
  const filteredPlots = plots.filter((plot) => {
    if (statusFilter === 'all') return true;
    return plot.status === statusFilter;
  });

  // Calculate center of selected plot
  useEffect(() => {
    if (selectedPlot) {
      setMapCenter([selectedPlot.longitude, selectedPlot.latitude]);
      setZoom(13);
    }
  }, [selectedPlot]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter([position.coords.longitude, position.coords.latitude]);
        setZoom(14);
      },
      (error) => {
        alert(`Error getting location: ${error.message}`);
      }
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col min-h-[500px]">
      {/* Map Controls Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap max-w-[calc(100%-2rem)]">
        {/* Layer Selector */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E7E3D6] border border-[#2D352B]/14 text-xs font-semibold text-[#282D27] hover:bg-[#D8D5C7] transition-all">
            <Layers className="size-3.5" />
            <span>Layers</span>
          </button>
          <div className="absolute left-0 mt-1 hidden group-hover:block bg-[#E7E3D6] border border-[#2D352B]/14 rounded-lg p-2.5 shadow-lg min-w-[150px] space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-[#282D27] cursor-pointer">
              <input
                type="checkbox"
                checked={activeLayers.boundaries}
                onChange={(e) => setActiveLayers({ ...activeLayers, boundaries: e.target.checked })}
                className="accent-[#617C3F]"
              />
              Sectors & Plots
            </label>
          </div>
        </div>

        {/* Status Filter */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E7E3D6] border border-[#2D352B]/14 text-xs font-semibold text-[#282D27] hover:bg-[#D8D5C7] transition-all">
            <Filter className="size-3.5" />
            <span>Filter: {statusFilter === 'all' ? 'All' : getStatusLabel(statusFilter)}</span>
          </button>
          <div className="absolute left-0 mt-1 hidden group-hover:block bg-[#E7E3D6] border border-[#2D352B]/14 rounded-lg p-1.5 shadow-lg min-w-[140px] space-y-0.5">
            {['all', 'in_progress', 'pending', 'overdue', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                  statusFilter === status
                    ? 'bg-[#617C3F] text-white font-semibold'
                    : 'text-[#282D27] hover:bg-[#D8D5C7]'
                }`}
              >
                {status === 'all' ? 'Show All' : getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {/* Reset View */}
        <button
          onClick={() => {
            setMapCenter([78.4867, 17.385]);
            setZoom(9);
            onSelectPlot(null);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E7E3D6] border border-[#2D352B]/14 text-xs font-semibold text-[#282D27] hover:bg-[#D8D5C7] transition-all cursor-pointer"
        >
          <Compass className="size-3.5" />
          <span>Reset</span>
        </button>

        {/* Locate Me */}
        <button
          onClick={handleLocateMe}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E7E3D6] border border-[#2D352B]/14 text-xs font-semibold text-[#282D27] hover:bg-[#D8D5C7] transition-all cursor-pointer"
        >
          <MapPin className="size-3.5" />
          <span>Locate Me</span>
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-[#E7E3D6]/90 border border-[#2D352B]/14 rounded-xl p-3 shadow-md max-w-xs backdrop-blur-sm">
        <h4 className="text-[10px] uppercase tracking-wider font-bold text-[#686B61] mb-2">Operational Legend</h4>
        <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-[#282D27]">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#9BBE55] border border-white" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#D99A2B] border border-white" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#C95B4A] border border-white" />
            <span>Overdue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#4C91CF] border border-white" />
            <span>Completed</span>
          </div>
        </div>
      </div>

      {/* Actual Map element */}
      <div
        className="
          relative flex-1 overflow-hidden rounded-2xl
          border border-[#7E9258]/35
          shadow-[0_0_22px_rgba(118,145,70,0.20)]
        "
      >
        <Map
          center={mapCenter}
          zoom={zoom}
          theme="dark"
          className="h-full w-full min-h-[500px]"
        >
          <MapLayersAndEvents
            sectors={sectors}
            plots={plots}
            selectedPlot={selectedPlot}
            onSelectPlot={onSelectPlot}
            activeLayers={activeLayers}
          />

          {/* Plot Markers */}
          {filteredPlots.map((plot) => {
            const isSelected = selectedPlot?.id === plot.id;
            const color = getStatusColour(plot.status);

            return (
              <MapMarker
                key={plot.id}
                longitude={plot.longitude}
                latitude={plot.latitude}
                onClick={() => onSelectPlot(plot)}
              >
                <MarkerContent>
                  <button
                    type="button"
                    aria-label={`Open ${plot.name}`}
                    className={`
                      relative grid size-7 place-items-center
                      rounded-full border border-[#F1EEE3]
                      transition-all duration-200 hover:scale-110 cursor-pointer
                    `}
                    style={{
                      backgroundColor: color,
                      boxShadow: isSelected
                        ? '0 0 16px rgba(137, 168, 78, 0.8), 0 0 0 3px #617C3F'
                        : '0 0 8px rgba(0,0,0,0.5)',
                    }}
                  >
                    <MapPin className="size-3.5 text-white" />
                  </button>
                </MarkerContent>

                <MarkerLabel>{plot.name}</MarkerLabel>

                <MarkerTooltip>
                  <div className="p-2 text-xs text-[#282D27] min-w-[120px]">
                    <strong className="block text-sm font-bold border-b border-[#2D352B]/14 pb-1 mb-1">{plot.name}</strong>
                    <div className="flex justify-between mt-1">
                      <span className="text-[#686B61]">Status:</span>
                      <span className="font-semibold" style={{ color }}>{getStatusLabel(plot.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#686B61]">Progress:</span>
                      <span className="font-semibold">{plot.progress}%</span>
                    </div>
                  </div>
                </MarkerTooltip>
              </MapMarker>
            );
          })}
        </Map>

        {/* Floating details panel inside map */}
        {selectedPlot && (
          <div className="absolute bottom-4 left-4 z-10 bg-[#E2DFD2]/96 border border-[#2D352B]/14 rounded-2xl p-4 shadow-xl max-w-sm backdrop-blur-sm text-xs text-[#282D27] space-y-3">
            <div className="flex justify-between items-start border-b border-[#2D352B]/14 pb-2">
              <div>
                <h3 className="font-bold text-sm text-[#182A1F]">{selectedPlot.name}</h3>
                <p className="text-[10px] text-[#686B61]">{selectedPlot.sector}</p>
              </div>
              <button
                onClick={() => onSelectPlot(null)}
                className="text-[#686B61] hover:text-[#282D27] font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[#686B61] block">Area:</span>
                <span className="font-semibold">{selectedPlot.areaHectares.toFixed(2)} Ha</span>
              </div>
              <div>
                <span className="text-[#686B61] block">Degradation:</span>
                <span className="font-semibold capitalize">{selectedPlot.degradationLevel}</span>
              </div>
              <div>
                <span className="text-[#686B61] block">Current Task:</span>
                <span className="font-semibold truncate block max-w-[120px]">{selectedPlot.taskTitle}</span>
              </div>
              <div>
                <span className="text-[#686B61] block">Task Progress:</span>
                <span className="font-semibold">{selectedPlot.progress}%</span>
              </div>
              <div>
                <span className="text-[#686B61] block">Evidence Status:</span>
                <span className="font-semibold">{selectedPlot.evidenceUploaded} / {selectedPlot.evidenceRequired}</span>
              </div>
              <div>
                <span className="text-[#686B61] block">Due Date:</span>
                <span className="font-semibold">{selectedPlot.dueDate ? new Date(selectedPlot.dueDate).toLocaleDateString() : 'None'}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              {onOpenWorkspace && (
                <button
                  onClick={() => onOpenWorkspace(selectedPlot)}
                  className="flex-1 py-2 px-3 bg-[#617C3F] hover:bg-[#526B35] text-white text-xs font-bold rounded-lg text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(97,124,63,0.3)]"
                >
                  <Eye className="size-3.5" />
                  <span>Open Workspace</span>
                </button>
              )}
              <button
                onClick={() => {
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedPlot.latitude},${selectedPlot.longitude}`, '_blank');
                }}
                className="flex-1 py-2 px-3 bg-[#77785A] hover:bg-[#686B61] text-white text-xs font-bold rounded-lg text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Route</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
