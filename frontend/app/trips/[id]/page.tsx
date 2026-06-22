'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSession } from '@/lib/supabase';
import Link from 'next/link';
import axios from 'axios';
import dynamic from 'next/dynamic';
import FlagImg from '@/components/FlagImg';
import CityImage from '@/components/CityImage';
import AttractionModal from '@/components/AttractionModal';

const ItineraryMap = dynamic(() => import('@/components/ItineraryMap'), {
  ssr: false,
  loading: () => <div className="h-[280px] bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">Carregando mapa...</div>,
});

const CATEGORY_ICONS: Record<string, string> = {
  restaurant: '🍽️', museum: '🏛️', park: '🌿', historic: '🏰',
  entertainment: '🎭', beach: '🏖️', spa: '💆', zoo: '🦁',
  market: '🛍️', gallery: '🖼️',
};

const CATEGORY_PT: Record<string, string> = {
  restaurant: 'Restaurante', museum: 'Museu', park: 'Parque', historic: 'Histórico',
  entertainment: 'Entretenimento', beach: 'Praia', spa: 'Spa', zoo: 'Zoológico',
  market: 'Mercado', gallery: 'Galeria',
};

const PROFILE_PT: Record<string, string> = {
  adventure: '🏔️ Aventura', cultural: '🏛️ Cultural', gastronomic: '🍽️ Gastronômico',
  relax: '🏖️ Relaxamento', family: '👨‍👩‍👧‍👦 Família',
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function getTransport(distKm: number) {
  if (distKm < 1.0) return { icon: '🚶', label: 'A pé', speedKmh: 5, color: 'text-green-700 bg-green-50 border-green-200' };
  if (distKm < 3.5) return { icon: '🚌', label: 'Transporte público', speedKmh: 20, color: 'text-blue-700 bg-blue-50 border-blue-200' };
  return { icon: '🚕', label: 'Táxi / Uber', speedKmh: 25, color: 'text-orange-700 bg-orange-50 border-orange-200' };
}

interface DestinationCity { city: string; country: string; country_code: string; }

interface Attraction {
  id: string;
  name: string;
  category: string;
  city: string;
  latitude: number;
  longitude: number;
  visit_duration_minutes: number;
  address?: string;
}

interface ItineraryItem {
  id: string;
  day_number: number;
  order_in_day: number;
  attraction_id: string;
  start_time?: string;
  notes?: string;
}

interface Trip {
  id: string;
  destination_city: string;
  destinations: DestinationCity[];
  start_date: string;
  end_date: string;
  traveler_profile: string;
}


export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [selectedAttraction, setSelectedAttraction] = useState<{
    name: string; city: string; category: string; durationStr: string; address?: string;
  } | null>(null);
  const [tips, setTips] = useState<{
    overview?: string;
    days?: Array<{ day: number; theme: string; tip: string; food: string }>;
  } | null>(null);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const loadTripData = async () => {
      const { data } = await getSession();
      
      if (!data?.session) {
        router.push('/login');
        return;
      }

      setToken(data.session.access_token);

      try {
        const headers = { Authorization: `Bearer ${data.session.access_token}` };

        const tripResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}`,
          { headers }
        );
        setTrip(tripResponse.data);
        setIsLoading(false);

        const tripDests: DestinationCity[] = tripResponse.data.destinations || [{ city: tripResponse.data.destination_city, country: '', country_code: '' }];
        const [itineraryResponse, ...attrResponses] = await Promise.allSettled([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/itineraries/${tripId}`, { headers }),
          ...tripDests.map(d => axios.get(`${process.env.NEXT_PUBLIC_API_URL}/attractions/?city=${encodeURIComponent(d.city)}`, { headers, timeout: 20000 })),
        ]);

        const allAttractions: Attraction[] = [];
        for (const r of attrResponses) {
          if (r.status === 'fulfilled') allAttractions.push(...r.value.data);
        }
        setAttractions(allAttractions);
        if (itineraryResponse.status === 'fulfilled') setItinerary(itineraryResponse.value.data);
      } catch (error) {
        console.error('Error loading trip data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTripData();
  }, [tripId, router]);

  useEffect(() => {
    if (itinerary.length === 0 || !token) return;
    setTipsLoading(true);
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}/tips`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 40000,
      })
      .then(res => {
        if (res.data?.tips) setTips(res.data.tips);
        else console.warn('[tips]', res.data?.reason, res.data?.detail || '');
      })
      .catch(err => console.error('[tips error]', err?.response?.data || err?.message))
      .finally(() => setTipsLoading(false));
  }, [itinerary.length, token, tripId]);

  const numDays = trip
    ? Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000) + 1
    : 0;

  const persistReorder = async (updates: { id: string; day_number: number; order_in_day: number }[]) => {
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/itineraries/${tripId}/reorder`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      console.error('reorder error', e);
    }
  };

  const moveWithinDay = (item: ItineraryItem, dir: 'up' | 'down', dayItems: ItineraryItem[]) => {
    const idx = dayItems.findIndex(i => i.id === item.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= dayItems.length) return;
    const swap = dayItems[swapIdx];
    const newItinerary = itinerary.map(i => {
      if (i.id === item.id) return { ...i, order_in_day: swap.order_in_day };
      if (i.id === swap.id) return { ...i, order_in_day: item.order_in_day };
      return i;
    });
    setItinerary(newItinerary);
    persistReorder([
      { id: item.id, day_number: item.day_number, order_in_day: swap.order_in_day },
      { id: swap.id, day_number: swap.day_number, order_in_day: item.order_in_day },
    ]);
  };

  const moveToDay = (item: ItineraryItem, newDay: number) => {
    if (newDay === item.day_number) return;
    const targetMax = itinerary
      .filter(i => i.day_number === newDay)
      .reduce((m, i) => Math.max(m, i.order_in_day), 0);
    const newOrder = targetMax + 1;
    setItinerary(itinerary.map(i =>
      i.id === item.id ? { ...i, day_number: newDay, order_in_day: newOrder } : i
    ));
    persistReorder([{ id: item.id, day_number: newDay, order_in_day: newOrder }]);
  };

  const handleGenerateItinerary = async () => {
    setIsGenerating(true);
    setGenerateError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}/generate-itinerary`,
        {},
        { headers, timeout: 30000 }
      );
      // Re-fetch itinerary without full page reload
      const [itineraryRes, attractionsRes] = await Promise.allSettled([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/itineraries/${tripId}`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/attractions/?city=${trip?.destination_city}`, { headers }),
      ]);
      if (itineraryRes.status === 'fulfilled') setItinerary(itineraryRes.value.data);
      if (attractionsRes.status === 'fulfilled') setAttractions(attractionsRes.value.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error generating itinerary. Please try again.';
      setGenerateError(msg);
      console.error('Error generating itinerary:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-teal-light to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-teal-light to-white">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Viagem não encontrada</p>
          <Link href="/trips" className="text-brand-teal hover:text-brand-teal-dark font-medium mt-4 inline-block">
            Voltar para viagens
          </Link>
        </div>
      </div>
    );
  }

  const days = Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const itineraryByDay = Array.from({ length: days }, (_, i) =>
    itinerary.filter(item => item.day_number === i + 1).sort((a, b) => a.order_in_day - b.order_in_day)
  );
  const totalAttractions = itinerary.length;
  const startDateFmt = new Date(trip.start_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const endDateFmt = new Date(trip.end_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero banner com foto do destino */}
      <CityImage city={trip.destination_city} className="relative h-72 bg-gradient-to-r from-brand-teal to-brand-teal-dark overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-4 left-6">
          <Link href="/trips" className="text-white/90 hover:text-white font-medium flex items-center gap-1 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm transition">
            ← Minhas Viagens
          </Link>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          {trip.destinations && trip.destinations.length > 1 ? (
            <div className="flex flex-wrap gap-2 mb-2">
              {trip.destinations.map((d, i) => (
                <span key={i} className="bg-black/40 backdrop-blur-sm text-white text-xl font-bold px-3 py-1 rounded-xl flex items-center gap-2">
                  <FlagImg code={d.country_code} size="lg" /> {d.city}
                </span>
              ))}
            </div>
          ) : (
            <h1 className="text-5xl font-bold text-white drop-shadow-lg flex items-center gap-3">
              {trip.destinations?.[0]?.country_code && <FlagImg code={trip.destinations[0].country_code} size="lg" />}
              {trip.destination_city}
            </h1>
          )}
          <div className="flex flex-wrap gap-3 mt-3">
            <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
              📅 {startDateFmt} → {endDateFmt}
            </span>
            <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
              🕐 {days} {days === 1 ? 'dia' : 'dias'}
            </span>
            <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
              {trip.traveler_profile.split(',').map(p => PROFILE_PT[p.trim()] || p.trim()).join(' • ')}
            </span>
          </div>
        </div>
      </CityImage>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats */}
        {itinerary.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-4 text-center border-t-4 border-brand-teal">
              <p className="text-3xl font-bold text-brand-teal">{days}</p>
              <p className="text-gray-500 text-sm mt-1">{days === 1 ? 'Dia' : 'Dias'} de viagem</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center border-t-4 border-brand-orange">
              <p className="text-3xl font-bold text-brand-orange">{totalAttractions}</p>
              <p className="text-gray-500 text-sm mt-1">Atrações no roteiro</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center border-t-4 border-gray-300">
              <p className="text-3xl font-bold text-gray-700">{Math.round(totalAttractions / days)}</p>
              <p className="text-gray-500 text-sm mt-1">Atrações por dia</p>
            </div>
          </div>
        )}

        {/* Botão gerar / regenerar roteiro */}
        {generateError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {generateError}
          </div>
        )}

        {itinerary.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8 text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Seu roteiro está pronto para ser criado!</h2>
            <p className="text-gray-500 mb-6">Vamos montar um itinerário personalizado para {trip.destination_city} com base no seu perfil de viagem.</p>
            <button
              onClick={handleGenerateItinerary}
              disabled={isGenerating}
              className="bg-brand-orange text-white px-10 py-4 rounded-xl hover:bg-brand-orange-dark font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition inline-flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Gerando roteiro... (pode levar até 30s)
                </>
              ) : '✨ Gerar Roteiro'}
            </button>
          </div>
        ) : (
          <div className="flex justify-end mb-4">
            <button
              onClick={handleGenerateItinerary}
              disabled={isGenerating}
              className="text-sm text-gray-500 hover:text-brand-orange border border-gray-300 hover:border-brand-orange px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                  Regenerando...
                </>
              ) : '🔄 Regenerar Roteiro'}
            </button>
          </div>
        )}

        {/* Roteiro por dia */}
        {itinerary.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">📋 Roteiro de Viagem</h2>
              <button
                onClick={() => setIsReordering(r => !r)}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition ${
                  isReordering
                    ? 'bg-brand-teal text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isReordering ? '✅ Concluir' : '⇅ Reorganizar'}
              </button>
            </div>
            {tipsLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-400 animate-pulse">
                <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-brand-teal rounded-full animate-spin" />
                Gerando dicas do assistente...
              </div>
            )}
            {tips?.overview && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl px-5 py-4 flex gap-3 items-start">
                <span className="text-2xl flex-shrink-0">🌍</span>
                <p className="text-teal-800 text-sm leading-relaxed">{tips.overview}</p>
              </div>
            )}
            {itineraryByDay.map((dayItems, dayIndex) => {
              const dayDate = new Date(trip.start_date + 'T12:00:00');
              dayDate.setDate(dayDate.getDate() + dayIndex);
              const dayLabel = dayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
              const dayDuration = dayItems.reduce((acc, item) => {
                const attr = attractions.find(a => a.id === item.attraction_id);
                return acc + (attr?.visit_duration_minutes || 0);
              }, 0);

              const dayPoints = dayItems
                .map((item, i) => {
                  const a = attractions.find(x => x.id === item.attraction_id);
                  return a ? { lat: a.latitude, lng: a.longitude, name: a.name, order: i + 1 } : null;
                })
                .filter((p): p is { lat: number; lng: number; name: string; order: number } => p !== null);

              return (
                <div key={dayIndex} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-brand-teal to-brand-teal-dark px-6 py-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        Dia {dayIndex + 1}
                        {(() => {
                          const firstAttr = dayItems[0] ? attractions.find(a => a.id === dayItems[0].attraction_id) : null;
                          const cityName = firstAttr?.city;
                          const destInfo = trip.destinations?.find(d => d.city === cityName);
                          return destInfo?.country_code ? (
                            <span className="flex items-center gap-1">
                              <FlagImg code={destInfo.country_code} size="sm" />
                              <span className="text-sm font-normal opacity-90">{cityName}</span>
                            </span>
                          ) : cityName && trip.destinations && trip.destinations.length > 1 ? (
                            <span className="text-sm font-normal opacity-90">{cityName}</span>
                          ) : null;
                        })()}
                      </h3>
                      <p className="text-white/80 text-sm capitalize">{dayLabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{dayItems.length} {dayItems.length === 1 ? 'atração' : 'atrações'}</p>
                      {dayDuration > 0 && <p className="text-white/80 text-sm">~{Math.round(dayDuration / 60)}h de atividades</p>}
                    </div>
                  </div>

                  {tips?.days && (() => {
                    const dt = tips.days!.find(d => d.day === dayIndex + 1);
                    if (!dt) return null;
                    return (
                      <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 space-y-1">
                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">✨ {dt.theme}</p>
                        <p className="text-sm text-amber-800">💡 {dt.tip}</p>
                        <p className="text-sm text-amber-800">🍽️ {dt.food}</p>
                      </div>
                    );
                  })()}

                  <div>
                    {dayItems.length === 0 ? (
                      <p className="text-gray-500 p-6 text-center">Nenhuma atividade planejada para este dia</p>
                    ) : (
                      dayItems.map((item, index) => {
                        const attraction = attractions.find(a => a.id === item.attraction_id);
                        const nextItem = dayItems[index + 1];
                        const nextAttraction = nextItem ? attractions.find(a => a.id === nextItem.attraction_id) : null;

                        const icon = CATEGORY_ICONS[attraction?.category || ''] || '📍';
                        const categoryPt = CATEGORY_PT[attraction?.category || ''] || attraction?.category || '';
                        const durationH = attraction ? Math.floor(attraction.visit_duration_minutes / 60) : 0;
                        const durationM = attraction ? attraction.visit_duration_minutes % 60 : 0;
                        const durationStr = durationH > 0
                          ? `${durationH}h${durationM > 0 ? durationM + 'min' : ''}`
                          : `${durationM}min`;

                        let travelConnector = null;
                        if (attraction && nextAttraction) {
                          const distKm = haversineKm(attraction.latitude, attraction.longitude, nextAttraction.latitude, nextAttraction.longitude);
                          const transport = getTransport(distKm);
                          const travelMin = Math.round((distKm / transport.speedKmh) * 60);
                          travelConnector = (
                            <div className="flex items-center gap-2 px-5 py-2 border-l-2 border-dashed border-gray-200 ml-[28px]">
                              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${transport.color}`}>
                                <span>{transport.icon}</span>
                                <span>{transport.label}</span>
                                <span className="text-gray-400">•</span>
                                <span>{distKm.toFixed(1)} km</span>
                                <span className="text-gray-400">•</span>
                                <span>~{travelMin} min</span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={item.id}>
                            {isReordering ? (
                              <div className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 bg-amber-50/40">
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    onClick={() => moveWithinDay(item, 'up', dayItems)}
                                    disabled={index === 0}
                                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed transition text-sm"
                                  >↑</button>
                                  <button
                                    onClick={() => moveWithinDay(item, 'down', dayItems)}
                                    disabled={index === dayItems.length - 1}
                                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed transition text-sm"
                                  >↓</button>
                                </div>
                                <div className="flex-shrink-0 w-8 h-8 bg-brand-teal-light rounded-full flex items-center justify-center font-bold text-brand-teal text-sm">
                                  {index + 1}
                                </div>
                                <div className="text-xl flex-shrink-0">{icon}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 truncate text-sm">{attraction?.name || 'Atração'}</p>
                                  <p className="text-xs text-gray-400">{categoryPt} • ⏱ {durationStr}</p>
                                </div>
                                <select
                                  value={item.day_number}
                                  onChange={e => moveToDay(item, parseInt(e.target.value))}
                                  className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-700 flex-shrink-0"
                                >
                                  {Array.from({ length: numDays }, (_, i) => i + 1).map(d => (
                                    <option key={d} value={d}>Dia {d}</option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="w-full flex items-center gap-4 p-5 hover:bg-teal-50/60 active:bg-teal-50 transition border-b border-gray-100 last:border-0 text-left group"
                                onClick={() => attraction && setSelectedAttraction({
                                  name: attraction.name,
                                  city: attraction.city || trip.destination_city,
                                  category: categoryPt,
                                  durationStr,
                                  address: attraction.address,
                                })}
                              >
                                <div className="flex-shrink-0 w-10 h-10 bg-brand-teal-light rounded-full flex items-center justify-center font-bold text-brand-teal text-lg">
                                  {index + 1}
                                </div>
                                <div className="text-2xl flex-shrink-0">{icon}</div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 truncate group-hover:text-brand-teal transition">{attraction?.name || 'Atração'}</h4>
                                  <p className="text-sm text-gray-500 flex items-center gap-2">
                                    {item.start_time && (
                                      <span className="font-semibold text-brand-teal">🕐 {item.start_time.slice(0, 5)}</span>
                                    )}
                                    <span>{categoryPt}</span>
                                  </p>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-2">
                                  <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                                    ⏱ {durationStr}
                                  </span>
                                  <span className="text-gray-300 group-hover:text-brand-teal transition text-lg">ℹ️</span>
                                </div>
                              </button>
                            )}
                            {!isReordering && travelConnector}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {dayPoints.length > 0 && (
                    <div className="border-t border-gray-100">
                      <ItineraryMap points={dayPoints} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedAttraction && (
        <AttractionModal
          name={selectedAttraction.name}
          city={selectedAttraction.city}
          category={selectedAttraction.category}
          durationStr={selectedAttraction.durationStr}
          address={selectedAttraction.address}
          onClose={() => setSelectedAttraction(null)}
        />
      )}
    </div>
  );
}
