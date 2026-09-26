import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import L from 'leaflet';
import { useTrip } from '../../context/TripContext';
import { useVehicle } from '../../context/VehicleContext';
import { StationPopup } from './StationPopup';
import { ALL_EV_DATASET_STATIONS } from '../../data/evStationsData';
import { supabaseService } from '../../services/supabaseService';
import { ChargingStation } from '../../types/station';
import {
  Zap,
  Plus,
  Minus,
  LocateFixed,
  Key,
  Layers,
  MapPin,
  CheckCircle2,
  X,
  AlertTriangle,
  Globe,
  Square,
  Car,
  Activity,
  Filter,
  Sparkles,
  Radio,
  Eye,
  SlidersHorizontal
} from 'lucide-react';

// Custom clean Slate Map Styling for Street Mode Google Maps
const EVOYAGE_STREET_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#f1f5f9' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e6f4ea' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e2e8f0' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#cbd5e1' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e0f2fe' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#0ea5e9' }] },
];

export const GoogleMapView: React.FC = () => {
  const {
    selectedRoute,
    nearbyStations,
    selectedStation,
    setSelectedStation,
    origin: originName,
    destination: destName,
    driveMetrics,
    isTripActive,
    stopTrip,
    corridorKey
  } = useTrip();

  const { selectedVehicle } = useVehicle();

  const googleMapContainerRef = useRef<HTMLDivElement>(null);
  const leafletContainerRef = useRef<HTMLDivElement>(null);

  const googleMapInstanceRef = useRef<google.maps.Map | null>(null);
  const googleMarkersRef = useRef<google.maps.Marker[]>([]);
  const googleDriverMarkerRef = useRef<google.maps.Marker | null>(null);
  const googleDirectionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const googleTrafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);

  const leafletMapInstanceRef = useRef<L.Map | null>(null);
  const leafletLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const leafletBaseTileLayerRef = useRef<L.TileLayer | null>(null);
  const leafletLabelTileLayerRef = useRef<L.TileLayer | null>(null);

  // Map layer view style: 'satellite' (default), 'street', 'dark'
  const [mapLayerMode, setMapLayerMode] = useState<'satellite' | 'street' | 'dark'>('satellite');

  // Station dataset display filter: 'all' (all dataset stations) or 'corridor' (only active corridor)
  const [stationScope, setStationScope] = useState<'all' | 'corridor'>('all');
  const [minPowerFilter, setMinPowerFilter] = useState<number>(0); // 0 = all, 60 = fast, 120 = ultra

  // Key state
  const [apiKey, setApiKey] = useState<string>(() => {
    return (
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
      localStorage.getItem('evoyage_gmaps_api_key') ||
      ''
    );
  });

  const [activeEngine, setActiveEngine] = useState<'google' | 'live-osm'>('live-osm');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState(apiKey);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isTrafficEnabled, setIsTrafficEnabled] = useState(true);
  const [showTrafficDrawer, setShowTrafficDrawer] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Real road high-density coordinates array
  const [realRoadPath, setRealRoadPath] = useState<{ lat: number; lng: number }[]>([]);

  // Corridor Base Waypoints
  const fallbackWaypoints = selectedRoute?.polyline || [
    { lat: 22.7196, lng: 75.8577 }, // Indore
    { lat: 22.7560, lng: 75.8790 }, // MR10
    { lat: 22.8450, lng: 75.8320 }, // Sanwer
    { lat: 23.0100, lng: 75.8050 }, // Toll
    { lat: 23.1550, lng: 75.7720 }, // Nanakheda
    { lat: 23.1765, lng: 75.7885 }, // Ujjain
  ];

  const origin = fallbackWaypoints[0];
  const destination = fallbackWaypoints[fallbackWaypoints.length - 1];
  const recommendedStation = selectedRoute?.recommended_station || nearbyStations[0];

  const [dbStations, setDbStations] = useState<ChargingStation[]>([]);

  // Fetch stations directly from Supabase on mount
  useEffect(() => {
    const loadFromSupabase = async () => {
      try {
        const data = await supabaseService.getChargingStations();
        if (data && data.length > 0) {
          setDbStations(data);
        }
      } catch (e) {
        console.warn('Supabase stations fetch warning:', e);
      }
    };
    loadFromSupabase();
  }, []);

  // Merge full dataset with live trip stations & Supabase stations
  const displayedStations: ChargingStation[] = useMemo(() => {
    const stationMap = new Map<string, ChargingStation>();
    
    // 1. Primary station source: Supabase DB if populated, else local fallback
    const primarySource = dbStations.length > 0 ? dbStations : ALL_EV_DATASET_STATIONS;
    primarySource.forEach(st => stationMap.set(st.id, st));

    // 2. Override or augment with live nearby stations from context/backend
    nearbyStations.forEach(st => stationMap.set(st.id, st));

    let list = Array.from(stationMap.values());

    // Apply corridor scope filter if selected
    if (stationScope === 'corridor' && corridorKey) {
      list = list.filter(st => st.corridor === corridorKey || st.id === recommendedStation?.id);
    }

    // Apply power filter
    if (minPowerFilter > 0) {
      list = list.filter(st => st.charging_power_kw >= minPowerFilter);
    }

    return list;
  }, [nearbyStations, stationScope, corridorKey, minPowerFilter, recommendedStation?.id]);

  // Active path to use (real road path if computed, else fallback)
  const activePath = realRoadPath.length > 0 ? realRoadPath : fallbackWaypoints;

  // Calculate current interpolated driver location along the actual road
  const getInterpolatedDriverCoords = () => {
    const totalKm = driveMetrics.totalDistanceKm || 55;
    const progressFraction = Math.min(
      1,
      Math.max(0, (driveMetrics.distanceTraveledKm || 0) / totalKm)
    );

    if (activePath.length <= 1 || progressFraction <= 0) return origin;
    if (progressFraction >= 1) return destination;

    const totalSegments = activePath.length - 1;
    const targetIdx = Math.min(
      totalSegments - 1,
      Math.floor(progressFraction * totalSegments)
    );
    const segFrac = progressFraction * totalSegments - targetIdx;

    const p1 = activePath[targetIdx];
    const p2 = activePath[targetIdx + 1];

    return {
      lat: p1.lat + (p2.lat - p1.lat) * segFrac,
      lng: p1.lng + (p2.lng - p1.lng) * segFrac,
    };
  };

  const currentDriverPos = getInterpolatedDriverCoords();

  // Fetch Real Turn-by-Turn Road Geometry from OSRM Routing Engine
  useEffect(() => {
    const fetchRealRoadGeometry = async () => {
      try {
        const stopPoint = recommendedStation
          ? `${recommendedStation.longitude},${recommendedStation.latitude};`
          : '';
        const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${stopPoint}${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

        const res = await fetch(url);
        const data = await res.json();
        if (data && data.routes && data.routes[0]?.geometry?.coordinates) {
          const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => ({
            lat: c[1],
            lng: c[0],
          }));
          setRealRoadPath(coords);
        }
      } catch (err) {
        console.warn('OSRM road geometry fetch failed, using fallback waypoints:', err);
      }
    };
    fetchRealRoadGeometry();
  }, [origin.lat, destination.lat, recommendedStation?.id]);

  // Intercept Google Maps Auth Failure
  useEffect(() => {
    (window as any).gm_authFailure = () => {
      console.warn('[Google Maps] Authentication failed. Switching to Live Real-Time Satellite Engine.');
      setGoogleAuthError(
        'Google Maps reported an auth error. Switched to Live Satellite Map Engine.'
      );
      setActiveEngine('live-osm');
    };
  }, []);

  // Save API Key
  const handleSaveApiKey = () => {
    const cleanKey = tempKeyInput.trim();
    setApiKey(cleanKey);
    localStorage.setItem('evoyage_gmaps_api_key', cleanKey);
    setGoogleAuthError(null);
    if (cleanKey) {
      setActiveEngine('google');
    } else {
      setActiveEngine('live-osm');
    }
    setIsKeyModalOpen(false);
    setMapLoaded(false);
  };

  // Toggle Traffic Layer on Google Maps
  const toggleTraffic = () => {
    const next = !isTrafficEnabled;
    setIsTrafficEnabled(next);
    if (googleTrafficLayerRef.current && googleMapInstanceRef.current) {
      googleTrafficLayerRef.current.setMap(next ? googleMapInstanceRef.current : null);
    }
  };

  // 1. Initialize Real Google Map with Satellite / Hybrid Mode
  useEffect(() => {
    if (activeEngine !== 'google' || !apiKey || !googleMapContainerRef.current) return;

    let isMounted = true;

    const loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry', 'routes'],
    });

    loader
      .importLibrary('maps')
      .then(() => {
        if (!isMounted || !googleMapContainerRef.current) return;

        const defaultCenter = {
          lat: (origin.lat + destination.lat) / 2 || 22.7196,
          lng: (origin.lng + destination.lng) / 2 || 75.8577,
        };

        const mapType = mapLayerMode === 'satellite' 
          ? google.maps.MapTypeId.HYBRID 
          : google.maps.MapTypeId.ROADMAP;

        const map = new google.maps.Map(googleMapContainerRef.current, {
          center: defaultCenter,
          zoom: 11,
          mapTypeId: mapType,
          styles: mapLayerMode === 'street' ? EVOYAGE_STREET_STYLES : [],
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        // Initialize Real-time Traffic Layer
        const trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(isTrafficEnabled ? map : null);
        googleTrafficLayerRef.current = trafficLayer;

        // Initialize Directions Renderer
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#0EA5E9',
            strokeWeight: 6,
            strokeOpacity: 0.95,
          },
        });
        googleDirectionsRendererRef.current = directionsRenderer;

        googleMapInstanceRef.current = map;
        setMapLoaded(true);

        // Fetch Real Turn-by-Turn Google Route
        const directionsService = new google.maps.DirectionsService();
        const waypointsList: google.maps.DirectionsWaypoint[] = recommendedStation
          ? [
              {
                location: new google.maps.LatLng(
                  recommendedStation.latitude,
                  recommendedStation.longitude
                ),
                stopover: true,
              },
            ]
          : [];

        directionsService.route(
          {
            origin: new google.maps.LatLng(origin.lat, origin.lng),
            destination: new google.maps.LatLng(destination.lat, destination.lng),
            waypoints: waypointsList,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              directionsRenderer.setDirections(result);
              if (result.routes[0]?.overview_path) {
                const gRoadCoords = result.routes[0].overview_path.map((p) => ({
                  lat: p.lat(),
                  lng: p.lng(),
                }));
                setRealRoadPath(gRoadCoords);
              }
            }
          }
        );
      })
      .catch((err) => {
        console.warn('Google Maps Load catch:', err);
        setGoogleAuthError('Google Maps API script error. Switched to Live Satellite Map.');
        setActiveEngine('live-osm');
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey, activeEngine]);

  // Update Google Map Type when layer mode changes
  useEffect(() => {
    if (activeEngine === 'google' && googleMapInstanceRef.current) {
      if (mapLayerMode === 'satellite') {
        googleMapInstanceRef.current.setMapTypeId(google.maps.MapTypeId.HYBRID);
        googleMapInstanceRef.current.setOptions({ styles: [] });
      } else {
        googleMapInstanceRef.current.setMapTypeId(google.maps.MapTypeId.ROADMAP);
        googleMapInstanceRef.current.setOptions({ styles: EVOYAGE_STREET_STYLES });
      }
    }
  }, [mapLayerMode, activeEngine]);

  // Update Google Map Custom Markers
  useEffect(() => {
    const map = googleMapInstanceRef.current;
    if (activeEngine !== 'google' || !map || !mapLoaded) return;

    googleMarkersRef.current.forEach((m) => m.setMap(null));
    googleMarkersRef.current = [];

    const bounds = new google.maps.LatLngBounds();

    // 1. Origin Marker
    const originMarker = new google.maps.Marker({
      position: { lat: origin.lat, lng: origin.lng },
      map: map,
      title: originName || 'Origin',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#0F172A',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2.5,
      },
      label: { text: 'A', color: '#FFFFFF', fontWeight: 'bold', fontSize: '11px' },
    });
    googleMarkersRef.current.push(originMarker);
    bounds.extend(originMarker.getPosition()!);

    // 2. Destination Marker
    const destMarker = new google.maps.Marker({
      position: { lat: destination.lat, lng: destination.lng },
      map: map,
      title: destName || 'Destination',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#14B8A6',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2.5,
      },
      label: { text: 'B', color: '#FFFFFF', fontWeight: 'bold', fontSize: '11px' },
    });
    googleMarkersRef.current.push(destMarker);
    bounds.extend(destMarker.getPosition()!);

    // 3. Charging Station Markers from Dataset
    displayedStations.forEach((station) => {
      const isRec = station.id === recommendedStation?.id;
      const isAvailable = station.status === 'AVAILABLE';
      const isFast = station.charging_power_kw >= 100;

      // High visibility markers for satellite view
      const fillColor = isRec ? '#14B8A6' : isFast ? '#0EA5E9' : isAvailable ? '#10B981' : '#F59E0B';
      const scale = isRec ? 12 : isFast ? 9 : 7.5;

      const marker = new google.maps.Marker({
        position: { lat: station.latitude, lng: station.longitude },
        map: map,
        title: `${station.name} (${station.charging_power_kw}kW - ${station.status})`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: scale,
          fillColor: fillColor,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: isRec ? 3 : 2,
        },
        zIndex: isRec ? 100 : 50,
      });

      marker.addListener('click', () => {
        setSelectedStation(station);
      });

      googleMarkersRef.current.push(marker);
      bounds.extend(marker.getPosition()!);
    });

    // 4. Custom Miniature EV Car Marker
    const evCarSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" fill="rgba(20, 184, 166, 0.35)" />
        <circle cx="24" cy="24" r="16" fill="#0F172A" stroke="#14B8A6" stroke-width="2.5" />
        <g transform="translate(14, 14) scale(0.85)" fill="#FFFFFF">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </g>
      </svg>
    `;
    const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(evCarSvg)}`;

    if (!googleDriverMarkerRef.current) {
      const driverMarker = new google.maps.Marker({
        position: { lat: currentDriverPos.lat, lng: currentDriverPos.lng },
        map: map,
        title: `${selectedVehicle?.model || 'EV'} - Live Position`,
        zIndex: 9999,
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(46, 46),
          anchor: new google.maps.Point(23, 23),
        },
      });
      googleDriverMarkerRef.current = driverMarker;
    } else {
      googleDriverMarkerRef.current.setPosition({
        lat: currentDriverPos.lat,
        lng: currentDriverPos.lng,
      });
    }

    map.fitBounds(bounds, 50);
  }, [mapLoaded, displayedStations, activeEngine, origin.lat, destination.lat, currentDriverPos.lat, currentDriverPos.lng]);

  // 2. Initialize Real Leaflet Live Tile Map with Satellite Layer by default
  useEffect(() => {
    if (activeEngine !== 'live-osm' || !leafletContainerRef.current) return;

    if (!leafletMapInstanceRef.current) {
      const centerLat = (origin.lat + destination.lat) / 2 || 22.7196;
      const centerLng = (origin.lng + destination.lng) / 2 || 75.8577;

      const map = L.map(leafletContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
      });

      // Default to High-Res Esri Satellite Imagery
      const satelliteBase = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          attribution: 'Esri, Maxar, Earthstar Geographics',
        }
      ).addTo(map);

      // Overlay road labels & place names
      const satelliteLabels = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          opacity: 0.85,
        }
      ).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      leafletMapInstanceRef.current = map;
      leafletLayerGroupRef.current = layerGroup;
      leafletBaseTileLayerRef.current = satelliteBase;
      leafletLabelTileLayerRef.current = satelliteLabels;
    }

    const map = leafletMapInstanceRef.current;
    const layerGroup = leafletLayerGroupRef.current;
    if (!map || !layerGroup) return;

    // Switch Leaflet Tile Layer based on mapLayerMode
    if (leafletBaseTileLayerRef.current) {
      map.removeLayer(leafletBaseTileLayerRef.current);
    }
    if (leafletLabelTileLayerRef.current) {
      map.removeLayer(leafletLabelTileLayerRef.current);
    }

    if (mapLayerMode === 'satellite') {
      const sat = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(map);
      const labels = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, opacity: 0.85 }
      ).addTo(map);
      leafletBaseTileLayerRef.current = sat;
      leafletLabelTileLayerRef.current = labels;
    } else if (mapLayerMode === 'street') {
      const street = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { maxZoom: 19, subdomains: 'abcd' }
      ).addTo(map);
      leafletBaseTileLayerRef.current = street;
      leafletLabelTileLayerRef.current = null;
    } else {
      const dark = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
        { maxZoom: 19, subdomains: 'abcd' }
      ).addTo(map);
      leafletBaseTileLayerRef.current = dark;
      leafletLabelTileLayerRef.current = null;
    }

    layerGroup.clearLayers();

    const latLngs: L.LatLngTuple[] = activePath.map((p) => [p.lat, p.lng]);

    // Draw Real Road Polyline (exact curves with neon glowing stroke for satellite clarity)
    const routeLineGlow = L.polyline(latLngs, {
      color: '#0EA5E9',
      weight: 9,
      opacity: 0.4,
      lineCap: 'round',
    }).addTo(layerGroup);

    const routeLine = L.polyline(latLngs, {
      color: '#38BDF8',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(layerGroup);

    // Origin Pin
    const originIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `<div style="background:#0F172A;color:white;width:30px;height:30px;border-radius:50%;border:2.5px solid #FFFFFF;box-shadow:0 3px 10px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;letter-spacing:-0.5px;">A</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
    L.marker([origin.lat, origin.lng], { icon: originIcon }).addTo(layerGroup);

    // Destination Pin
    const destIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `<div style="background:#14B8A6;color:white;width:30px;height:30px;border-radius:50%;border:2.5px solid #FFFFFF;box-shadow:0 3px 10px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;letter-spacing:-0.5px;">B</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
    L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(layerGroup);

    // Stations Pins from Dataset with clear satellite-optimized badges
    displayedStations.forEach((station) => {
      const isRec = station.id === recommendedStation?.id;
      const isFast = station.charging_power_kw >= 100;
      const isAvail = station.status === 'AVAILABLE';

      let bg = isRec ? '#14B8A6' : isFast ? '#0EA5E9' : isAvail ? '#10B981' : '#F59E0B';
      let size = isRec ? 36 : isFast ? 28 : 24;

      const stationHtml = `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;">
          ${
            isRec
              ? `<div style="position:absolute;width:48px;height:48px;border-radius:50%;background:rgba(20,184,166,0.4);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>`
              : ''
          }
          <div style="background:${bg};color:white;width:${size}px;height:${size}px;border-radius:50%;border:2.5px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;transition:transform 0.15s ease;">
            <svg width="${isRec ? '18' : '13'}" height="${isRec ? '18' : '13'}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
          ${
            isRec
              ? `<div style="position:absolute;bottom:-20px;background:#0F172A;color:#14B8A6;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px;border:1px solid #14B8A6;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.5);">★ Stop</div>`
              : `<div style="position:absolute;top:-16px;background:rgba(15,23,42,0.9);color:#FFFFFF;font-size:9px;font-weight:700;padding:1px 4px;border-radius:4px;white-space:nowrap;border:0.5px solid rgba(255,255,255,0.4);">${station.charging_power_kw}kW</div>`
          }
        </div>
      `;

      const stationIcon = L.divIcon({
        className: 'custom-station-pin',
        html: stationHtml,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const m = L.marker([station.latitude, station.longitude], { icon: stationIcon }).addTo(
        layerGroup
      );

      m.on('click', () => {
        setSelectedStation(station);
      });
    });

    // Miniature EV Car Marker
    const evCarLeafletIcon = L.divIcon({
      className: 'custom-ev-car-marker',
      html: `
        <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(20,184,166,0.35);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="position:relative;width:36px;height:36px;border-radius:50%;background:#0F172A;border:2.5px solid #14B8A6;box-shadow:0 4px 14px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });
    L.marker([currentDriverPos.lat, currentDriverPos.lng], { icon: evCarLeafletIcon }).addTo(layerGroup);

    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
  }, [activeEngine, activePath, displayedStations, mapLayerMode, origin.lat, destination.lat, currentDriverPos.lat, currentDriverPos.lng]);

  return (
    <div className="relative w-full h-[540px] lg:h-[600px] bg-[#0F172A] rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm select-none animate-in fade-in duration-300">
      {/* Top Left Controls: Map Layer Switcher, Engine, & Dataset Filters */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {/* Layer Mode Switcher: Satellite (Default) / Street / Dark */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg text-white">
          <button
            onClick={() => setMapLayerMode('satellite')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mapLayerMode === 'satellite'
                ? 'bg-[#14B8A6] text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>🛰️ Satellite</span>
          </button>

          <button
            onClick={() => setMapLayerMode('street')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mapLayerMode === 'street'
                ? 'bg-[#0EA5E9] text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Street</span>
          </button>

          <button
            onClick={() => setMapLayerMode('dark')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mapLayerMode === 'dark'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>🌙 Dark</span>
          </button>
        </div>

        {/* Engine Switcher and API Settings */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setActiveEngine('live-osm')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeEngine === 'live-osm'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-[#0EA5E9]" />
              <span>Live Tile Engine</span>
              {activeEngine === 'live-osm' && <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />}
            </button>

            <button
              onClick={() => {
                if (apiKey) {
                  setActiveEngine('google');
                  setGoogleAuthError(null);
                } else {
                  setIsKeyModalOpen(true);
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeEngine === 'google'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Google Maps</span>
              {activeEngine === 'google' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>

            <button
              onClick={() => {
                setTempKeyInput(apiKey);
                setIsKeyModalOpen(true);
              }}
              title="Configure Google Maps API Key"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dataset Stations Filter Button */}
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 ${
              stationScope === 'all'
                ? 'bg-teal-50 border-teal-300 text-teal-800'
                : 'bg-white/95 border-slate-200 text-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#14B8A6] fill-[#14B8A6]" />
            <span>Stations: {displayedStations.length}</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex flex-col gap-1 w-8 mt-1">
          <button
            onClick={() => {
              if (activeEngine === 'google' && googleMapInstanceRef.current) {
                googleMapInstanceRef.current.setZoom(
                  (googleMapInstanceRef.current.getZoom() || 11) + 1
                );
              } else if (leafletMapInstanceRef.current) {
                leafletMapInstanceRef.current.zoomIn();
              }
            }}
            className="w-8 h-8 rounded-lg bg-white/95 border border-slate-200 text-slate-700 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (activeEngine === 'google' && googleMapInstanceRef.current) {
                googleMapInstanceRef.current.setZoom(
                  (googleMapInstanceRef.current.getZoom() || 11) - 1
                );
              } else if (leafletMapInstanceRef.current) {
                leafletMapInstanceRef.current.zoomOut();
              }
            }}
            className="w-8 h-8 rounded-lg bg-white/95 border border-slate-200 text-slate-700 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (activeEngine === 'google' && googleMapInstanceRef.current) {
                googleMapInstanceRef.current.panTo({
                  lat: currentDriverPos.lat,
                  lng: currentDriverPos.lng,
                });
                googleMapInstanceRef.current.setZoom(14);
              } else if (leafletMapInstanceRef.current) {
                leafletMapInstanceRef.current.panTo([
                  currentDriverPos.lat,
                  currentDriverPos.lng,
                ]);
                leafletMapInstanceRef.current.setZoom(14);
              }
            }}
            title="Center to EV Car Location"
            className="w-8 h-8 rounded-lg bg-white/95 border border-slate-200 text-slate-700 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors mt-0.5"
          >
            <LocateFixed className="w-4 h-4 text-[#14B8A6]" />
          </button>
        </div>
      </div>

      {/* Stations Dataset Filter Drawer */}
      {showFilterDrawer && (
        <div className="absolute top-28 left-4 z-30 w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl p-4 space-y-3 animate-in fade-in slide-in-from-left-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#14B8A6]" />
              <h4 className="text-xs font-bold text-slate-900">EV Station Dataset Filters</h4>
            </div>
            <button
              onClick={() => setShowFilterDrawer(false)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Dataset Scope:</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setStationScope('all')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                    stationScope === 'all'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  All Hubs ({ALL_EV_DATASET_STATIONS.length})
                </button>
                <button
                  onClick={() => setStationScope('corridor')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                    stationScope === 'corridor'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Route Corridor
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Power Output:</label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setMinPowerFilter(0)}
                  className={`py-1 px-1.5 rounded-lg text-[11px] font-bold border text-center ${
                    minPowerFilter === 0
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  Any kW
                </button>
                <button
                  onClick={() => setMinPowerFilter(60)}
                  className={`py-1 px-1.5 rounded-lg text-[11px] font-bold border text-center ${
                    minPowerFilter === 60
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  ≥ 60 kW
                </button>
                <button
                  onClick={() => setMinPowerFilter(120)}
                  className={`py-1 px-1.5 rounded-lg text-[11px] font-bold border text-center ${
                    minPowerFilter === 120
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  ≥ 120 kW
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center justify-between">
                <span>Total Marked on Map:</span>
                <span className="font-extrabold text-slate-900">{displayedStations.length} stations</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Recommended Stop:</span>
                <span className="font-bold text-teal-700 truncate max-w-[150px]">
                  {recommendedStation?.name || 'Tata Power'}
                </span>
              </div>
            </div>

            {/* Quick Stations List with Exact Coordinates */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-700">Quick Station Jump:</label>
                <button
                  onClick={() => {
                    if (activeEngine === 'google' && googleMapInstanceRef.current) {
                      const bounds = new google.maps.LatLngBounds();
                      displayedStations.forEach((s) => bounds.extend({ lat: s.latitude, lng: s.longitude }));
                      googleMapInstanceRef.current.fitBounds(bounds, 40);
                    } else if (leafletMapInstanceRef.current) {
                      const bounds = L.latLngBounds(displayedStations.map((s) => [s.latitude, s.longitude] as L.LatLngTuple));
                      leafletMapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
                    }
                  }}
                  className="text-[10px] font-bold text-teal-700 hover:text-teal-800 underline cursor-pointer"
                >
                  Fit All on Map
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {displayedStations.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => {
                      setSelectedStation(st);
                      if (activeEngine === 'google' && googleMapInstanceRef.current) {
                        googleMapInstanceRef.current.panTo({ lat: st.latitude, lng: st.longitude });
                        googleMapInstanceRef.current.setZoom(15);
                      } else if (leafletMapInstanceRef.current) {
                        leafletMapInstanceRef.current.flyTo([st.latitude, st.longitude], 15, { duration: 1 });
                      }
                    }}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-teal-50/80 border border-slate-200/70 hover:border-teal-300 cursor-pointer transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-slate-900 truncate max-w-[160px]">{st.name}</span>
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded">{st.charging_power_kw}kW</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      📍 {st.latitude.toFixed(6)}, {st.longitude.toFixed(6)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Right Action & Live Traffic Badge */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-full shadow-md flex items-center gap-2 text-xs font-bold text-white">
          <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
          <span>🛰️ Satellite Telemetry</span>
          <span className="text-slate-400 text-[10px]">|</span>
          <span className="text-sky-300 text-[11px] font-medium">{displayedStations.length} Stations</span>
        </div>

        {isTripActive && (
          <button
            onClick={stopTrip}
            title="End Drive at any time"
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-full shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>End Drive</span>
          </button>
        )}
      </div>

      {/* Floating Bottom Center Live Navigation & Miniature EV Car Ribbon */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-md">
        <div className="bg-[#0F172A]/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-500/20 border border-teal-400/50 flex items-center justify-center text-teal-400 shrink-0 shadow-inner">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white leading-tight">
                  {selectedVehicle?.model || 'EV'}
                </span>
                <span className="text-[10px] text-teal-300 font-bold bg-teal-900/60 px-1.5 py-0.2 rounded border border-teal-500/30">
                  🛰️ GPS Tracked
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5 truncate max-w-[200px]">
                Target: <strong className="text-white">{recommendedStation?.name || driveMetrics.nextStopName}</strong> ({driveMetrics.nextStopDistanceKm} km)
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-sm font-black text-white">{driveMetrics.currentSpeedKmph || 65} km/h</span>
            <p className="text-[10px] text-teal-400 font-bold">{driveMetrics.currentDriveSoc}% SOC</p>
          </div>
        </div>
      </div>

      {/* REAL GOOGLE MAP CONTAINER */}
      <div
        ref={googleMapContainerRef}
        className={`w-full h-full absolute inset-0 ${
          activeEngine === 'google' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 -z-10 pointer-events-none'
        }`}
      />

      {/* REAL LEAFLET / OSM LIVE SATELLITE TILE CONTAINER */}
      <div
        ref={leafletContainerRef}
        className={`w-full h-full absolute inset-0 ${
          activeEngine === 'live-osm' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 -z-10 pointer-events-none'
        }`}
      />

      {/* Bottom Subtext */}
      <div className="absolute bottom-1.5 left-4 right-4 z-10 flex items-center justify-between text-[10px] font-semibold text-white/70 pointer-events-none drop-shadow">
        <span>
          🛰️ High-Resolution Satellite View • {displayedStations.length} Charging Stations Active
        </span>
        <span>EVoyage AI Live GeoTelemetry</span>
      </div>

      {/* Selected Station Detailed Popup */}
      <StationPopup
        station={selectedStation}
        isRecommended={selectedStation?.id === recommendedStation?.id}
        onClose={() => setSelectedStation(null)}
      />

      {/* Google Maps API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg p-6 shadow-2xl relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Google Maps API Setup</h3>
                  <p className="text-xs text-slate-500">Configure Google Maps Satellite API credentials</p>
                </div>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Maps API Key (Starts with <code className="text-teal-700 bg-teal-50 px-1 rounded">AIzaSy...</code>)
                </label>
                <input
                  type="text"
                  value={tempKeyInput}
                  onChange={(e) => setTempKeyInput(e.target.value)}
                  placeholder="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 outline-none focus:border-[#14B8A6] focus:bg-white"
                />
              </div>

              {/* Troubleshooting Checklist */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2.5">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Google Cloud Checklist:</span>
                </p>

                <ul className="space-y-2 text-slate-600 text-[11px]">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <span>
                      <strong>Enable "Maps JavaScript API" & "Directions API":</strong> In Google Cloud Console, ensure both are enabled.
                    </span>
                  </li>

                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <span>
                      <strong>Billing Account:</strong> Ensure project billing is active ($200 free monthly usage).
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setTempKeyInput('');
                  setApiKey('');
                  localStorage.removeItem('evoyage_gmaps_api_key');
                  setActiveEngine('live-osm');
                  setIsKeyModalOpen(false);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50"
              >
                Clear Key
              </button>

              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-5 py-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Connect Map</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
