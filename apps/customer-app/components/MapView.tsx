import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Platform } from 'react-native';
import type { Location, Address } from '@ride-hailing/shared-types';

interface MapViewProps {
  pickup?: Address | null;
  dropoff?: Address | null;
  partnerLocation?: Location | null;
  showPartner?: boolean;
}

export function MapView({ pickup, dropoff, partnerLocation, showPartner }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const partnerMarkerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map (web only)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Dynamically import mapbox-gl for web
    const initMap = async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;
        
        // Use a public demo token (limited usage)
        mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

        if (!mapContainerRef.current || mapRef.current) return;

        const center = pickup 
          ? [pickup.lng, pickup.lat] 
          : [-73.9855, 40.7580]; // Default to NYC

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: center as [number, number],
          zoom: 13,
        });

        mapRef.current = map;

        map.on('load', () => {
          setMapLoaded(true);

          // Add pickup marker
          if (pickup) {
            new mapboxgl.Marker({ color: '#22c55e' })
              .setLngLat([pickup.lng, pickup.lat])
              .addTo(map);
          }

          // Add dropoff marker
          if (dropoff) {
            new mapboxgl.Marker({ color: '#ef4444' })
              .setLngLat([dropoff.lng, dropoff.lat])
              .addTo(map);

            // Fit bounds to show both markers
            if (pickup) {
              map.fitBounds(
                [
                  [Math.min(pickup.lng, dropoff.lng), Math.min(pickup.lat, dropoff.lat)],
                  [Math.max(pickup.lng, dropoff.lng), Math.max(pickup.lat, dropoff.lat)],
                ],
                { padding: 60 }
              );
            }
          }
        });
      } catch (error) {
        console.error('Failed to load map:', error);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update partner marker
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || Platform.OS !== 'web') return;

    const updatePartnerMarker = async () => {
      const mapboxgl = (await import('mapbox-gl')).default;

      if (showPartner && partnerLocation) {
        if (partnerMarkerRef.current) {
          partnerMarkerRef.current.setLngLat([partnerLocation.lng, partnerLocation.lat]);
        } else {
          // Create car marker element
          const el = document.createElement('div');
          el.innerHTML = '🚗';
          el.style.fontSize = '28px';
          el.style.cursor = 'pointer';

          partnerMarkerRef.current = new mapboxgl.Marker({ element: el })
            .setLngLat([partnerLocation.lng, partnerLocation.lat])
            .addTo(mapRef.current);
        }
      } else if (partnerMarkerRef.current) {
        partnerMarkerRef.current.remove();
        partnerMarkerRef.current = null;
      }
    };

    updatePartnerMarker();
  }, [partnerLocation, showPartner, mapLoaded]);

  if (Platform.OS !== 'web') {
    // Placeholder for native platforms
    return (
      <View className="flex-1 bg-zinc-800 items-center justify-center">
        <Text className="text-zinc-500">Map available on web</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 rounded-2xl overflow-hidden">
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: '100%', minHeight: 300 }} 
      />
      {!mapLoaded && (
        <View className="absolute inset-0 bg-zinc-900 items-center justify-center">
          <Text className="text-zinc-500">Loading map...</Text>
        </View>
      )}
    </View>
  );
}

