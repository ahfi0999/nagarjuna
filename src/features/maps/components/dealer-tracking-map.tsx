'use client';

import { type ReactNode } from 'react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

type DealerTrackingMapsProviderProps = {
  children: ReactNode;
};

type DealerTrackingMapProps = {
  latitude: number | null;
  longitude: number | null;
};

export function DealerTrackingMapsProvider({
  children,
}: DealerTrackingMapsProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_API_GOOGLE_KEY;

  if (!apiKey) {
    return children;
  }

  return <APIProvider apiKey={apiKey}>{children}</APIProvider>;
}

export function DealerTrackingMap({
  latitude,
  longitude,
}: DealerTrackingMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_API_GOOGLE_KEY;

  if (
    latitude === null ||
    longitude === null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return (
      <p className="text-sm text-muted-foreground">Location unavailable.</p>
    );
  }

  if (!apiKey) {
    return <p className="text-sm text-muted-foreground">Map unavailable.</p>;
  }

  const position = { lat: latitude, lng: longitude };

  return (
    <div className="h-64 overflow-hidden rounded-md border">
      <Map
        defaultCenter={position}
        defaultZoom={15}
        gestureHandling="greedy"
        style={{ width: '100%', height: '100%' }}
      >
        <Marker position={position} />
      </Map>
    </div>
  );
}
