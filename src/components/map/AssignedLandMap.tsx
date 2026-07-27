import { useEffect, useRef } from 'react';
import mapboxgl, {
  type GeoJSONSource,
  type LngLatBoundsLike,
  type Map as MapboxMap,
} from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import type { AssignedSector } from '../../types/fieldOperations';

interface AssignedLandMapProps {
  sectors: AssignedSector[];
  selectedSectorId?: string | null;
}

function collectCoordinates(
  value: unknown,
  output: Array<[number, number]>,
) {
  if (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  ) {
    output.push([value[0], value[1]]);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) =>
      collectCoordinates(item, output),
    );
  }
}

function popupContent(properties: Record<string, unknown>) {
  const container = document.createElement('div');
  container.className = 'geotwin-map-popup';
  [
    ['Sector', properties.name],
    ['Project', properties.projectName],
    ['Status', properties.assignmentStatus],
    ['Area', `${properties.areaHectares} ha`],
    ['Due', properties.dueDate || 'No due date'],
    ['Progress', `${properties.progress}%`],
  ].forEach(([label, value]) => {
    const row = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = `${String(label)}: `;
    row.append(strong, document.createTextNode(String(value)));
    container.append(row);
  });
  return container;
}

export function AssignedLandMap({
  sectors,
  selectedSectorId,
}: AssignedLandMapProps) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<MapboxMap | null>(null);

  useEffect(() => {
    const token =
      import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim();
    if (!token || !container.current || sectors.length === 0) {
      return;
    }
    mapboxgl.accessToken = token;
    const instance = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [79.0193, 18.1124],
      zoom: 6,
      attributionControl: true,
    });
    map.current = instance;
    instance.addControl(
      new mapboxgl.NavigationControl(),
      'top-right',
    );
    instance.addControl(
      new mapboxgl.FullscreenControl(),
      'top-right',
    );
    instance.addControl(
      new mapboxgl.ScaleControl({ unit: 'metric' }),
      'bottom-left',
    );

    let hoveredId: string | number | null = null;
    let selectedId: string | number | null = null;
    const features = sectors.map((sector) => ({
      type: 'Feature' as const,
      geometry: sector.geometry,
      properties: {
        sectorId: sector.id,
        name: sector.name,
        projectName: sector.projectName,
        assignmentStatus: sector.assignmentStatus,
        areaHectares: sector.areaHectares.toFixed(2),
        dueDate: sector.dueDate,
        progress: sector.progress,
      },
    }));

    instance.on('load', () => {
      instance.addSource('assigned-sectors', {
        type: 'geojson',
        generateId: true,
        data: {
          type: 'FeatureCollection',
          features,
        },
      });
      instance.addLayer({
        id: 'assigned-sector-fill',
        type: 'fill',
        source: 'assigned-sectors',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#E8B44F',
            ['boolean', ['feature-state', 'hover'], false],
            '#90A982',
            '#5F7F52',
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.62,
            0.42,
          ],
        },
      });
      instance.addLayer({
        id: 'assigned-sector-outline',
        type: 'line',
        source: 'assigned-sectors',
        paint: {
          'line-color': '#FBFAEF',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            4,
            2,
          ],
        },
      });

      const selectedIndex = selectedSectorId
        ? sectors.findIndex(
            (sector) => sector.id === selectedSectorId,
          )
        : -1;
      if (selectedIndex >= 0) {
        selectedId = selectedIndex;
        instance.setFeatureState(
          {
            source: 'assigned-sectors',
            id: selectedId,
          },
          { selected: true },
        );
      }

      const coordinateList: Array<[number, number]> = [];
      const boundsTargets =
        selectedIndex >= 0
          ? [sectors[selectedIndex]]
          : sectors;
      boundsTargets.forEach((sector) =>
        collectCoordinates(
          sector.geometry.coordinates,
          coordinateList,
        ),
      );
      if (coordinateList.length) {
        const bounds = coordinateList.reduce(
          (result, coordinate) =>
            result.extend(coordinate),
          new mapboxgl.LngLatBounds(
            coordinateList[0],
            coordinateList[0],
          ),
        );
        instance.fitBounds(
          bounds as unknown as LngLatBoundsLike,
          { padding: 70, maxZoom: 15, duration: 900 },
        );
      }
    });

    instance.on(
      'mousemove',
      'assigned-sector-fill',
      (event) => {
        instance.getCanvas().style.cursor = 'pointer';
        const feature = event.features?.[0] as
          | {
              id?: string | number;
            }
          | undefined;
        const featureId = feature?.id;
        if (featureId === undefined) return;
        if (hoveredId !== null) {
          instance.setFeatureState(
            {
              source: 'assigned-sectors',
              id: hoveredId,
            },
            { hover: false },
          );
        }
        hoveredId = featureId;
        instance.setFeatureState(
          {
            source: 'assigned-sectors',
            id: featureId,
          },
          { hover: true },
        );
      },
    );

    instance.on(
      'mouseleave',
      'assigned-sector-fill',
      () => {
        instance.getCanvas().style.cursor = '';
        if (hoveredId !== null) {
          instance.setFeatureState(
            {
              source: 'assigned-sectors',
              id: hoveredId,
            },
            { hover: false },
          );
        }
        hoveredId = null;
      },
    );

    instance.on('click', 'assigned-sector-fill', (event) => {
      const feature = event.features?.[0] as
        | {
            id?: string | number;
            properties?: Record<string, unknown>;
          }
        | undefined;
      const featureId = feature?.id;
      if (!feature || featureId === undefined) return;
      if (selectedId !== null) {
        instance.setFeatureState(
          {
            source: 'assigned-sectors',
            id: selectedId,
          },
          { selected: false },
        );
      }
      selectedId = featureId;
      instance.setFeatureState(
        {
          source: 'assigned-sectors',
          id: featureId,
        },
        { selected: true },
      );
      new mapboxgl.Popup({ closeButton: true })
        .setLngLat(event.lngLat)
        .setDOMContent(
          popupContent(
            (feature.properties ?? {}) as Record<
              string,
              unknown
            >,
          ),
        )
        .addTo(instance);
    });

    return () => {
      (
        instance.getSource(
          'assigned-sectors',
        ) as GeoJSONSource | undefined
      )?.setData({
        type: 'FeatureCollection',
        features: [],
      });
      instance.remove();
      map.current = null;
    };
  }, [sectors, selectedSectorId]);

  const token =
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim();
  if (!token) {
    return (
      <div className="h-[62vh] min-h-[420px] rounded-2xl bg-[#243028] text-[#D7DED5] flex items-center justify-center p-8 text-center">
        <div>
          <h2 className="font-bold text-lg">
            Map configuration required
          </h2>
          <p className="text-sm text-[#A9B3A8] mt-2 max-w-md">
            Add VITE_MAPBOX_ACCESS_TOKEN to the frontend
            environment to render assigned land. The rest of the
            dashboard remains available.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div
      ref={container}
      className="h-[62vh] min-h-[420px] w-full rounded-2xl overflow-hidden border border-[#D4D8D0]"
      aria-label="Read-only map of assigned land sectors"
    />
  );
}
