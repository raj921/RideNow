import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Ride, Partner, Location } from '@ride-hailing/shared-types';
import { RIDE_STATE_LABELS } from '@ride-hailing/shared-types';

// Public demo token
mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

interface LiveMapProps {
  rides: Ride[];
  partners: (Partner & { liveLocation?: Location })[];
  onRideSelect?: (ride: Ride) => void;
}

export function LiveMap({ rides, partners, onRideSelect }: LiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-73.9855, 40.7580], // NYC
      zoom: 12,
    });

    mapRef.current = map;

    map.on('load', () => {
      setMapLoaded(true);
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;
    const existingIds = new Set<string>();

    // Add/update ride markers
    rides.forEach((ride) => {
      const markerId = `ride-${ride.id}`;
      existingIds.add(markerId);

      const location = ride.currentLocation || ride.pickup;
      
      if (markersRef.current.has(markerId)) {
        // Update existing marker
        markersRef.current.get(markerId)!.setLngLat([location.lng, location.lat]);
      } else {
        // Create new marker
        const el = document.createElement('div');
        el.className = 'ride-marker';
        el.innerHTML = `
          <div style="
            background: ${getStateColor(ride.state)};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            border: 2px solid white;
          ">🚗</div>
        `;

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([location.lng, location.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div style="min-width: 180px;">
                <div style="font-weight: 600; margin-bottom: 4px;">${RIDE_STATE_LABELS[ride.state]}</div>
                <div style="font-size: 12px; color: #a1a1aa;">
                  <div>📍 ${ride.pickup.formatted}</div>
                  <div>🎯 ${ride.dropoff.formatted}</div>
                </div>
              </div>
            `)
          )
          .addTo(map);

        el.addEventListener('click', () => onRideSelect?.(ride));
        markersRef.current.set(markerId, marker);
      }
    });

    // Add/update partner markers
    partners.forEach((partner) => {
      const location = partner.liveLocation || partner.currentLocation;
      if (!location) return;

      const markerId = `partner-${partner.id}`;
      existingIds.add(markerId);

      if (markersRef.current.has(markerId)) {
        markersRef.current.get(markerId)!.setLngLat([location.lng, location.lat]);
      } else {
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="
            background: ${partner.status === 'BUSY' ? '#f59e0b' : '#22c55e'};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">👤</div>
        `;

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([location.lng, location.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div>
                <div style="font-weight: 600;">${partner.name}</div>
                <div style="font-size: 12px; color: #a1a1aa;">
                  ${partner.vehicleModel} • ${partner.vehicleNumber}
                </div>
                <div style="font-size: 12px; color: ${partner.status === 'BUSY' ? '#f59e0b' : '#22c55e'};">
                  ${partner.status}
                </div>
              </div>
            `)
          )
          .addTo(map);

        markersRef.current.set(markerId, marker);
      }
    });

    // Remove old markers
    markersRef.current.forEach((marker, id) => {
      if (!existingIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });
  }, [rides, partners, mapLoaded, onRideSelect]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
          <div className="text-zinc-500">Loading map...</div>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-zinc-900/90 backdrop-blur-sm rounded-lg p-3 border border-zinc-800">
        <div className="text-xs text-zinc-400 mb-2 font-medium">LEGEND</div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-zinc-300">Searching</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-zinc-300">En Route</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-zinc-300">In Trip</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-zinc-300">Online Partner</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStateColor(state: string): string {
  switch (state) {
    case 'REQUESTED':
    case 'SEARCHING':
      return '#f59e0b';
    case 'PARTNER_ASSIGNED':
    case 'PARTNER_ARRIVED':
      return '#3b82f6';
    case 'TRIP_STARTED':
      return '#22c55e';
    default:
      return '#6b7280';
  }
}

