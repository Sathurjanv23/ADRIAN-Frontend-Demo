'use client';

import { useEffect, useRef, memo } from 'react';
import type { Incident, RescueTeam, Hospital } from '@/types';

interface EmergencyMapProps {
  incidents: Incident[];
  rescueTeams: RescueTeam[];
  hospitals: Hospital[];
  activeFilters: string[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
  onMapReady?: (mapInstance: any) => void;
}

function EmergencyMapComponent({
  incidents,
  rescueTeams,
  hospitals,
  activeFilters,
  selectedIncident,
  onSelectIncident,
  onMapReady,
}: EmergencyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);

  // Initialize Map
  useEffect(() => {
    let isCancelled = false;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;

        if (!mapContainer.current || isCancelled) return;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = L.map(mapContainer.current, {
          center: [7.8731, 80.7718],
          zoom: 8,
          zoomControl: false,
          attributionControl: true,
        });

        L.control.zoom({ position: 'topright' }).addTo(map);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        const markerGroup = L.layerGroup().addTo(map);
        layerGroupRef.current = markerGroup;
        mapInstanceRef.current = map;

        if (onMapReady) {
          onMapReady(map);
        }
      } catch (err) {
        console.error('Failed to initialize Leaflet Map:', err);
      }
    };

    initMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onMapReady]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const updateMarkers = async () => {
      const L = (await import('leaflet')).default;
      const markerGroup = layerGroupRef.current;
      markerGroup.clearLayers();

      // 1. Incidents
      if (activeFilters.includes('incidents')) {
        incidents.forEach((incident) => {
          if (!incident.location?.lat || !incident.location?.lng) return;

          const color =
            incident.severity === 'critical' ? '#ff3b3b' :
              incident.severity === 'high' ? '#ff7a00' :
                incident.severity === 'medium' ? '#ffd700' : '#22c55e';

          const isCritical = incident.severity === 'critical';

          const iconHtml = `
            <div style="position: relative; width: 22px; height: 22px; cursor: pointer;">
              ${isCritical ? `<div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(255, 59, 59, 0.4); animation: pulse 2s infinite;"></div>` : ''}
              <div style="
                width: 22px; height: 22px; border-radius: 50%;
                background: ${color};
                border: 2px solid #ffffff;
                box-shadow: 0 0 10px ${color};
                display: flex; align-items: center; justify-content: center;
              ">
                <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
              </div>
            </div>
          `;

          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-incident-marker',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          const marker = L.marker([incident.location.lat, incident.location.lng], { icon: customIcon });
          marker.on('click', () => {
            onSelectIncident(incident);
            mapInstanceRef.current?.panTo([incident.location.lat, incident.location.lng], { animate: true });
          });
          marker.addTo(markerGroup);
        });
      }

      // 2. Rescue Teams
      if (activeFilters.includes('teams')) {
        rescueTeams.forEach((team) => {
          if (!team.location?.lat || !team.location?.lng) return;

          const teamColor =
            team.status === 'available' ? '#22c55e' :
              team.status === 'en_route' ? '#ffd700' : '#00d4ff';

          const iconHtml = `
            <div style="
              width: 16px; height: 16px; border-radius: 4px;
              background: ${teamColor};
              border: 1.5px solid #ffffff;
              box-shadow: 0 0 8px ${teamColor};
              cursor: pointer;
            "></div>
          `;

          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-team-marker',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          const marker = L.marker([team.location.lat, team.location.lng], { icon: customIcon });
          marker.bindTooltip(`🚑 ${team.name} (${team.status})`, {
            direction: 'top',
            className: 'leaflet-tooltip-dark',
          });
          marker.addTo(markerGroup);
        });
      }

      // 3. Hospitals
      if (activeFilters.includes('hospitals')) {
        hospitals.forEach((hosp) => {
          if (!hosp.location?.lat || !hosp.location?.lng) return;

          const iconHtml = `
            <div style="
              width: 14px; height: 14px; border-radius: 50%;
              background: #a855f7;
              border: 1.5px solid #ffffff;
              box-shadow: 0 0 8px #a855f7;
              cursor: pointer;
            "></div>
          `;

          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-hospital-marker',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });

          const marker = L.marker([hosp.location.lat, hosp.location.lng], { icon: customIcon });
          marker.bindTooltip(`🏥 ${hosp.name} (${hosp.availableBeds} beds)`, {
            direction: 'top',
            className: 'leaflet-tooltip-dark',
          });
          marker.addTo(markerGroup);
        });
      }
    };

    updateMarkers();
  }, [incidents, rescueTeams, hospitals, activeFilters, onSelectIncident]);

  return <div ref={mapContainer} className="w-full h-full dark-tactical-tiles" />;
}

export const LazyEmergencyMap = memo(EmergencyMapComponent);
export default LazyEmergencyMap;
