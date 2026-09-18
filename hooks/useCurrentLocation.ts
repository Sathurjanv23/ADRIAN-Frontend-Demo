'use client';

import { useState, useCallback } from 'react';
import type { PermissionStatus, GeoLocation } from '@/types';
import { toast } from 'sonner';

export interface LocationState {
  location: GeoLocation | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  capturedAt: string | null;
  manualAddress: string;
  isDetecting: boolean;
  isDetected: boolean;
  permissionStatus: PermissionStatus;
  error: string | null;
  mapsUrl: string | null;
  detectLocation: () => Promise<void>;
  setManualAddress: (address: string) => void;
  clearLocation: () => void;
}

export function useCurrentLocation(): LocationState {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isDetected, setIsDetected] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const detectLocation = useCallback(async () => {
    setError(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      const msg = 'Geolocation is not supported by your browser or requires a secure HTTPS context.';
      setError(msg);
      setPermissionStatus('unavailable');
      toast.error('Geolocation Unavailable', { description: msg });
      return;
    }

    setIsDetecting(true);
    setPermissionStatus('requesting');

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const capturedAt = new Date(position.timestamp).toISOString();

        const geo: GeoLocation = {
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          capturedAt,
          address: manualAddress || `GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
          district: 'Sri Lanka',
        };

        setLocation(geo);
        setIsDetected(true);
        setIsDetecting(false);
        setPermissionStatus('granted');

        toast.success('Live GPS Location Detected', {
          description: `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)} (±${Math.round(accuracy)}m)`,
        });
      },
      (err: GeolocationPositionError) => {
        setIsDetecting(false);
        setIsDetected(false);

        let msg = 'Failed to retrieve current location.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setPermissionStatus('denied');
            msg = 'Location permission was denied. Please enable location in your browser site settings or enter your address manually.';
            toast.error('Location Permission Denied', { description: msg });
            break;
          case err.POSITION_UNAVAILABLE:
            setPermissionStatus('unavailable');
            msg = 'Location information is currently unavailable. Please enter your address manually.';
            toast.error('Location Unavailable', { description: msg });
            break;
          case err.TIMEOUT:
            setPermissionStatus('idle');
            msg = 'Location request timed out. Please try again or enter your address manually.';
            toast.error('Location Request Timeout', { description: msg });
            break;
          default:
            toast.error('Location Error', { description: msg });
        }
        setError(msg);
      },
      options
    );
  }, [manualAddress]);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setIsDetected(false);
    setError(null);
  }, []);

  const mapsUrl = location
    ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
    : null;

  return {
    location,
    latitude: location?.lat ?? null,
    longitude: location?.lng ?? null,
    accuracy: location?.accuracy ?? null,
    capturedAt: location?.capturedAt ?? null,
    manualAddress,
    isDetecting,
    isDetected,
    permissionStatus,
    error,
    mapsUrl,
    detectLocation,
    setManualAddress,
    clearLocation,
  };
}
