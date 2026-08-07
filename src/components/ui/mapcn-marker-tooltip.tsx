import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import ReactDOM from 'react-dom';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Map Context
interface MapContextType {
  map: maplibregl.Map | null;
  loading: boolean;
}

const MapContext = createContext<MapContextType>({
  map: null,
  loading: true,
});

export const useMap = () => useContext(MapContext);

interface MapProps extends React.HTMLAttributes<HTMLDivElement> {
  center?: [number, number];
  zoom?: number;
  theme?: 'dark' | 'light';
  styles?: {
    dark?: string;
    light?: string;
  };
  children?: React.ReactNode;
}

export const Map: React.FC<MapProps> = ({
  center = [78.4867, 17.385], // Default Telangana/Hyderabad coordinates
  zoom = 9,
  theme = 'dark',
  styles,
  children,
  className,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [loading, setLoading] = useState(true);

  const CARTO_DARK_STYLE: any = {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }
    },
    layers: [
      {
        id: 'simple-tiles',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: 0,
        maxzoom: 20
      }
    ]
  };

  const CARTO_LIGHT_STYLE: any = {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }
    },
    layers: [
      {
        id: 'simple-tiles',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: 0,
        maxzoom: 20
      }
    ]
  };

  const styleObj = theme === 'dark' ? CARTO_DARK_STYLE : CARTO_LIGHT_STYLE;

  useEffect(() => {
    if (!containerRef.current) return;

    const mapInstance = new maplibregl.Map({
      container: containerRef.current,
      style: styleObj,
      center: center,
      zoom: zoom,
    });

    mapInstance.on('load', () => {
      setLoading(false);
    });

    setMap(mapInstance);

    // Add navigation controls
    mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');

    const handleResize = () => {
      mapInstance.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mapInstance.remove();
    };
  }, [styleObj]);

  // Keep center updated if it changes
  useEffect(() => {
    if (map) {
      map.setCenter(center);
    }
  }, [center, map]);

  // Keep zoom updated if it changes
  useEffect(() => {
    if (map) {
      map.setZoom(zoom);
    }
  }, [zoom, map]);

  return (
    <div className={`relative ${className || ''}`} {...props}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      <MapContext.Provider value={{ map, loading }}>
        {!loading && children}
      </MapContext.Provider>
    </div>
  );
};

// Marker Context to pass the DOM element of the marker to children
const MarkerContext = createContext<HTMLDivElement | null>(null);

interface MapMarkerProps {
  longitude: number;
  latitude: number;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const MapMarker: React.FC<MapMarkerProps> = ({
  longitude,
  latitude,
  onClick,
  children,
}) => {
  const { map } = useMap();
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  if (!elementRef.current) {
    const el = document.createElement('div');
    el.className = 'mapcn-marker-container';
    elementRef.current = el;
  }

  useEffect(() => {
    if (!map || !elementRef.current) return;

    elementRef.current.setAttribute('data-lat', latitude.toString());
    elementRef.current.setAttribute('data-lng', longitude.toString());

    const marker = new maplibregl.Marker({
      element: elementRef.current,
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    markerRef.current = marker;
    setIsMounted(true);

    if (onClick) {
      elementRef.current.addEventListener('click', onClick);
    }

    return () => {
      if (onClick && elementRef.current) {
        elementRef.current.removeEventListener('click', onClick);
      }
      marker.remove();
      markerRef.current = null;
    };
  }, [map, longitude, latitude]);

  return (
    <MarkerContext.Provider value={elementRef.current}>
      {isMounted && children}
    </MarkerContext.Provider>
  );
};

interface MarkerContentProps {
  children: React.ReactNode;
}

export const MarkerContent: React.FC<MarkerContentProps> = ({ children }) => {
  const markerElement = useContext(MarkerContext);
  if (!markerElement) return null;

  return ReactDOM.createPortal(children, markerElement);
};

interface MarkerTooltipProps {
  children: React.ReactNode;
}

export const MarkerTooltip: React.FC<MarkerTooltipProps> = ({ children }) => {
  const { map } = useMap();
  const markerElement = useContext(MarkerContext);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  if (!tooltipRef.current) {
    tooltipRef.current = document.createElement('div');
    tooltipRef.current.className = 'mapcn-marker-tooltip-content';
  }

  useEffect(() => {
    if (!map || !markerElement || !tooltipRef.current) return;

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 15,
    }).setDOMContent(tooltipRef.current);

    popupRef.current = popup;

    // Standard maplibre way is to setPopup on the marker.
    // Since we don't have direct access to the Marker instance inside MarkerTooltip,
    // we can find it or we can just show on hover/click.
    // Let's associate the popup directly with the DOM element hover.
    const handleMouseEnter = () => {
      // Get marker coordinates from parent or just let standard popup open at marker LngLat
      // We can store LngLat on the DOM element during MapMarker creation:
      const latStr = markerElement.getAttribute('data-lat');
      const lngStr = markerElement.getAttribute('data-lng');
      if (latStr && lngStr) {
        popup.setLngLat([parseFloat(lngStr), parseFloat(latStr)]).addTo(map);
      } else {
        // Let's retrieve from markerElement's properties or parents
        // We will make sure MapMarker writes data-lat and data-lng to the element!
      }
    };

    const handleMouseLeave = () => {
      popup.remove();
    };

    markerElement.addEventListener('mouseenter', handleMouseEnter);
    markerElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      markerElement.removeEventListener('mouseenter', handleMouseEnter);
      markerElement.removeEventListener('mouseleave', handleMouseLeave);
      popup.remove();
    };
  }, [map, markerElement]);

  return ReactDOM.createPortal(children, tooltipRef.current);
};

interface MarkerLabelProps {
  children: React.ReactNode;
}

export const MarkerLabel: React.FC<MarkerLabelProps> = ({ children }) => {
  const markerElement = useContext(MarkerContext);
  const labelRef = useRef<HTMLDivElement | null>(null);

  if (!labelRef.current) {
    labelRef.current = document.createElement('div');
    labelRef.current.className = 'absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-1.5 py-0.5 bg-[#182A1F] text-[#F0EEE5] text-[9px] rounded shadow whitespace-nowrap pointer-events-none border border-[#7E9258]/30 font-semibold';
  }

  useEffect(() => {
    if (!markerElement || !labelRef.current) return;
    markerElement.appendChild(labelRef.current);
    return () => {
      if (markerElement && labelRef.current && markerElement.contains(labelRef.current)) {
        markerElement.removeChild(labelRef.current);
      }
    };
  }, [markerElement]);

  return ReactDOM.createPortal(children, labelRef.current);
};
