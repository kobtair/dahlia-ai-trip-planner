'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

type Stop = { id: string; name: string; latitude?: number; longitude?: number; startTime: string; endTime: string };
type Day = { day: number; title: string; items: Stop[]; route: { geometry?: { coordinates: [number, number][] } } };
const COLORS = ['#ab482f', '#286a80', '#79609a', '#43724a', '#926413', '#a34270'];

export function ItineraryMap({ itinerary, destination }: { itinerary: Day[]; destination: { latitude: number; longitude: number } }) {
  const container = useRef<HTMLDivElement>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [error, setError] = useState('');
  const visible = selectedDay ? itinerary.filter((day) => day.day === selectedDay) : itinerary;

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    void import('leaflet').then((L) => {
      if (cancelled || !container.current) return;
      const map = L.map(container.current).setView([destination.latitude, destination.longitude], 13);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19,
      }).addTo(map);
      const bounds: [number, number][] = [];
      for (const day of itinerary.filter((entry) => !selectedDay || entry.day === selectedDay)) {
        const color = COLORS[(day.day - 1) % COLORS.length];
        const stops = day.items.filter((stop) => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude));
        const points = stops.map((stop): [number, number] => [stop.latitude!, stop.longitude!]);
        bounds.push(...points);
        const geometry = day.route.geometry?.coordinates;
        if (points.length > 1) L.polyline(geometry?.length ? geometry.map(([lon, lat]): [number, number] => [lat, lon]) : points, {
          color, weight: 4, opacity: .85, dashArray: geometry?.length ? undefined : '7 9',
        }).addTo(map);
        stops.forEach((stop, index) => {
          const label = `${day.day}.${day.items.indexOf(stop) + 1}`;
          const popup = document.createElement('div');
          const title = document.createElement('strong');
          title.textContent = stop.name;
          const details = document.createElement('p');
          details.textContent = `Day ${day.day} · Stop ${day.items.indexOf(stop) + 1} · ${stop.startTime}–${stop.endTime}`;
          popup.appendChild(title);
          popup.appendChild(details);
          L.marker(points[index], { title: `${label} ${stop.name}`, icon: L.divIcon({
            className: '', html: `<span style="display:grid;place-items:center;width:34px;height:34px;border:2px solid white;border-radius:50%;background:${color};color:white;font:600 11px Arial;box-shadow:0 2px 8px #0004">${label}</span>`, iconSize: [34, 34], iconAnchor: [17, 17],
          }) }).addTo(map).bindPopup(popup.outerHTML);
        });
      }
      if (bounds.length) map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
      const observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(container.current);
      cleanup = () => { observer.disconnect(); map.remove(); };
    }).catch(() => { if (!cancelled) setError('The interactive map could not load. Please reload the page.'); });
    return () => { cancelled = true; cleanup(); };
  }, [itinerary, selectedDay, destination.latitude, destination.longitude]);

  return <div>
    <div className="mb-4 flex flex-wrap gap-2" aria-label="Filter map by day">
      {[0, ...itinerary.map((day) => day.day)].map((day) => <button key={day} onClick={() => setSelectedDay(day)} aria-pressed={selectedDay === day} className="rounded-full border px-3 py-2 text-xs" style={selectedDay === day ? { background: '#292c30', color: 'white' } : {}}>{day ? `Day ${day}` : 'All days'}</button>)}
    </div>
    {error && <p role="alert">{error}</p>}
    <section ref={container} aria-label="Itinerary places and routes" className="relative z-0 h-[520px] w-full rounded-xl border" />
    <p className="mt-3 text-xs text-muted-foreground">Markers show day.stop. Solid lines follow walking routes; dashed lines connect stops when route data is unavailable. Older saved trips may need rebuilding for walking routes.</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">{visible.map((day) => <div key={day.day}><h3 className="text-sm font-semibold" style={{ color: COLORS[(day.day - 1) % COLORS.length] }}>Day {day.day} · {day.title}</h3><ol className="mt-2 space-y-2 text-xs">{day.items.map((stop, index) => <li key={stop.id}>{day.day}.{index + 1} · {stop.name} <span className="text-muted-foreground">{stop.startTime}</span>{!Number.isFinite(stop.latitude) && ' · Coordinates unavailable'}</li>)}</ol></div>)}</div>
  </div>;
}
