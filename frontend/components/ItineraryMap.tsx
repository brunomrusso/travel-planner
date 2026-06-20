'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapPoint {
  lat: number;
  lng: number;
  name: string;
  order: number;
}

function numberedIcon(n: number) {
  return L.divIcon({
    className: '',
    html: `<div style="background:#0d9488;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14);
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [points, map]);
  return null;
}

export default function ItineraryMap({ points }: { points: MapPoint[] }) {
  if (points.length === 0) return null;
  const center: [number, number] = [points[0].lat, points[0].lng];
  const line = points.map((p) => [p.lat, p.lng] as [number, number]);

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: 280, width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={line} pathOptions={{ color: '#0d9488', weight: 3, dashArray: '6 8' }} />
      {points.map((p, i) => (
        <Marker key={i} position={[p.lat, p.lng]} icon={numberedIcon(p.order)}>
          <Popup>
            <strong>
              {p.order}. {p.name}
            </strong>
          </Popup>
        </Marker>
      ))}
      <FitBounds points={points} />
    </MapContainer>
  );
}
