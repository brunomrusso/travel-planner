'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const CATEGORY_ICONS: Record<string, string> = {
  museum: '🏛️', restaurant: '🍽️', park: '🌿', historic: '🏰', church: '⛪',
  beach: '🏖️', gallery: '🖼️', bar: '🍺', cafe: '☕', zoo: '🦁',
  market: '🛒', spa: '💆', entertainment: '🎭', hiking: '🥾', nature: '🌲',
};

interface Attraction {
  id: string; name: string; category: string; city: string;
  visit_duration_minutes: number; address?: string;
}
interface ItineraryItem {
  id: string; attraction_id: string; day_number: number; order_in_day: number; start_time?: string;
}
interface Trip {
  id: string; destination_city: string; start_date: string; end_date: string;
  traveler_profile: string; destinations?: { city: string; country_code: string }[];
}

export default function SharedTripPage() {
  const params = useParams();
  const tripId = params.id as string;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}/share`)
      .then(r => { if (!r.ok) { setNotFound(true); setIsLoading(false); return null; } return r.json(); })
      .then(data => {
        if (!data) return;
        setTrip(data.trip);
        setItinerary(data.itinerary);
        setAttractions(data.attractions);
        setIsLoading(false);
      })
      .catch(() => { setNotFound(true); setIsLoading(false); });
  }, [tripId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (notFound || !trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-4">😕</p>
          <p className="text-gray-600">Viagem não encontrada.</p>
          <Link href="/" className="mt-4 inline-block text-teal-600 hover:underline">Criar minha viagem</Link>
        </div>
      </div>
    );
  }

  const days = Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000) + 1;
  const itineraryByDay = Array.from({ length: days }, (_, i) =>
    itinerary.filter(item => item.day_number === i + 1).sort((a, b) => a.order_in_day - b.order_in_day)
  );
  const startFmt = new Date(trip.start_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const endFmt = new Date(trip.end_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-teal-200 text-sm mb-2">✈️ Roteiria — Roteiro Compartilhado</p>
          <h1 className="text-4xl font-bold">{trip.destination_city}</h1>
          <p className="text-teal-100 mt-2">📅 {startFmt} → {endFmt} • {days} {days === 1 ? 'dia' : 'dias'} • {itinerary.length} atrações</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {itineraryByDay.map((dayItems, dayIndex) => {
          const dayDate = new Date(trip.start_date + 'T12:00:00');
          dayDate.setDate(dayDate.getDate() + dayIndex);
          const dayLabel = dayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

          return (
            <div key={dayIndex} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-teal-800 px-5 py-3">
                <h3 className="text-white font-bold">Dia {dayIndex + 1}</h3>
                <p className="text-white/70 text-sm capitalize">{dayLabel}</p>
              </div>
              <div>
                {dayItems.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">Sem atividades planejadas</p>
                ) : (
                  dayItems.map((item, index) => {
                    const attraction = attractions.find(a => a.id === item.attraction_id);
                    const icon = CATEGORY_ICONS[attraction?.category || ''] || '📍';
                    const dur = attraction
                      ? Math.floor(attraction.visit_duration_minutes / 60) > 0
                        ? `${Math.floor(attraction.visit_duration_minutes / 60)}h${attraction.visit_duration_minutes % 60 > 0 ? attraction.visit_duration_minutes % 60 + 'min' : ''}`
                        : `${attraction.visit_duration_minutes}min`
                      : '';
                    return (
                      <div key={item.id} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-0">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-xl flex-shrink-0">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{attraction?.name || 'Atração'}</p>
                          {item.start_time && <p className="text-xs text-teal-600 font-medium">🕐 {item.start_time.slice(0, 5)}</p>}
                        </div>
                        {dur && <span className="text-xs text-gray-400 flex-shrink-0">⏱ {dur}</span>}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}

        <div className="text-center py-8 border-t border-gray-200">
          <p className="text-gray-500 mb-4">Quer criar seu próprio roteiro personalizado?</p>
          <Link
            href="/register"
            className="bg-teal-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-teal-700 transition inline-block"
          >
            ✈️ Criar minha viagem grátis
          </Link>
        </div>
      </main>
    </div>
  );
}
