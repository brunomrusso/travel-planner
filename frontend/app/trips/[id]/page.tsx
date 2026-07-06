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
import { Share2, Trash2, RefreshCw, Info, Printer, ArrowUpDown, Check, Plus, X, ArrowLeft, Package, MapPin } from 'lucide-react';

const ItineraryMap = dynamic(() => import('@/components/ItineraryMap'), {
  ssr: false,
  loading: () => <div className="h-[280px] bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">Carregando mapa...</div>,
});

const OUTDOOR_CATEGORIES = new Set(['park', 'beach', 'hiking', 'zoo', 'market', 'monument']);

const SEASONAL_DATA: Array<{ keys: string[]; months: number[]; warn: boolean; msg: string }> = [
  { keys: ['veneza', 'venice'], months: [7, 8], warn: true, msg: 'Veneza em jul/ago: superlotada. Visite cedo pela manhã.' },
  { keys: ['barcelona'], months: [7, 8], warn: true, msg: 'Barcelona no verão: praias lotadas e filas enormes.' },
  { keys: ['roma', 'rome'], months: [7, 8], warn: true, msg: 'Roma em jul/ago: calor extremo (40°C+) e superlotação.' },
  { keys: ['paris'], months: [7, 8], warn: false, msg: 'Alta temporada em Paris. Muitos locais fecham em agosto.' },
  { keys: ['rio de janeiro', 'rio'], months: [12, 1, 2], warn: true, msg: 'Rio no Réveillon/Carnaval: preços altíssimos e superlotação.' },
  { keys: ['dubai'], months: [6, 7, 8, 9], warn: true, msg: 'Dubai no verão: temperatura acima de 45°C. Prefira nov–abr.' },
  { keys: ['tóquio', 'tokyo', 'kyoto'], months: [3, 4], warn: false, msg: 'Temporada de cerejeiras (mar/abr): reserve hotel com antecedência.' },
  { keys: ['bali'], months: [7, 8], warn: false, msg: 'Alta temporada em Bali. Prefira mai/jun ou set.' },
  { keys: ['santorini', 'mykonos'], months: [7, 8], warn: true, msg: 'Ilhas gregas no verão: superlotadas, preços triplicados.' },
  { keys: ['praga', 'prague'], months: [7, 8], warn: false, msg: 'Praga no verão: visite pontos principais bem cedo pela manhã.' },
  { keys: ['machu picchu'], months: [6, 7, 8], warn: false, msg: 'Temporada seca: melhor clima mas ingressos esgotam semanas antes.' },
];

interface DayTrip { city: string; distance_km: number; how: string; highlights: string[]; tip?: string; }

const DAY_TRIPS: Record<string, DayTrip[]> = {
  paris: [
    { city: 'Versailles', distance_km: 23, how: 'Trem RER C (35 min)', highlights: ['Palácio de Versailles', 'Jardins reais', 'Galeria dos Espelhos'], tip: 'Compre ingresso online — fila enorme!' },
    { city: 'Giverny', distance_km: 80, how: 'Ônibus ou carro (1h20)', highlights: ['Casa de Monet', 'Jardim das Nenúfares'], tip: 'Aberto abr–out; fechado no inverno.' },
    { city: 'Chartres', distance_km: 90, how: 'Trem (1h)', highlights: ['Catedral Gótica de Chartres', 'Cidade medieval'], tip: 'Meio dia basta.' },
    { city: 'Reims', distance_km: 145, how: 'TGV (45 min)', highlights: ['Catedral Notre-Dame de Reims', 'Caves de champagne'], tip: 'Agende visita a uma maison de champagne.' },
    { city: 'Fontainebleau', distance_km: 60, how: 'Trem (40 min)', highlights: ['Castelo de Fontainebleau', 'Floresta para trilhas'] },
  ],
  rome: [
    { city: 'Tivoli', distance_km: 30, how: 'Ônibus ou carro (45 min)', highlights: ["Villa d'Este", 'Villa Adriana (UNESCO)'] },
    { city: 'Orvieto', distance_km: 90, how: 'Trem (1h10)', highlights: ['Catedral de Orvieto', 'Cidade medieval na rocha', 'Vinhos locais'] },
    { city: 'Nápoles', distance_km: 230, how: 'Trem alta velocidade (1h10)', highlights: ['Pompeia', 'Herculano', 'Pizza autêntica'], tip: 'Sair cedo — dá para ver Pompeia e voltar no mesmo dia.' },
    { city: 'Ostia Antica', distance_km: 25, how: 'Trem (30 min)', highlights: ['Ruínas de cidade portuária romana', 'Mosaicos originais'], tip: 'Menos turistas que Pompeia.' },
  ],
  barcelona: [
    { city: 'Montserrat', distance_km: 60, how: 'Trem + cremalheira (1h15)', highlights: ['Mosteiro de Montserrat', 'Trilha Sant Joan', 'Vista dos Pireneus'] },
    { city: 'Girona', distance_km: 100, how: 'Trem (38 min)', highlights: ['Casco antigo medieval', 'Muralhas romanas', 'Cenário de Game of Thrones'] },
    { city: 'Sitges', distance_km: 35, how: 'Trem (35 min)', highlights: ['Praias', 'Museu Cau Ferrat', 'Arquitetura modernista'] },
    { city: 'Figueres', distance_km: 145, how: 'Trem (55 min)', highlights: ['Museu Teatro Dalí'] },
    { city: 'Tarragona', distance_km: 100, how: 'Trem (1h)', highlights: ['Anfiteatro romano', 'Muralhas romanas UNESCO', 'Praias'] },
  ],
  london: [
    { city: 'Bath', distance_km: 170, how: 'Trem (1h25)', highlights: ['Termas Romanas', 'Abadia de Bath', 'Arquitetura georgiana'], tip: 'Favorito de Jane Austen.' },
    { city: 'Oxford', distance_km: 95, how: 'Ônibus ou trem (1h)', highlights: ['Universidade de Oxford', 'Bodleian Library', 'Christ Church'] },
    { city: 'Cambridge', distance_km: 90, how: 'Trem (50 min)', highlights: ["Universidade de Cambridge", 'Punting no rio Cam', "King's College Chapel"] },
    { city: 'Windsor', distance_km: 35, how: 'Trem (35 min)', highlights: ['Castelo de Windsor', 'Eton College'], tip: 'Confirme horários da troca da guarda.' },
    { city: 'Stonehenge', distance_km: 140, how: 'Tour ou carro (1h30)', highlights: ['Stonehenge', 'Avebury', 'Planuras de Salisbury'] },
  ],
  amsterdam: [
    { city: 'Haarlem', distance_km: 20, how: 'Trem (15 min)', highlights: ['Grote Kerk', 'Frans Hals Museum', 'Centro histórico'] },
    { city: 'Delft', distance_km: 65, how: 'Trem (1h)', highlights: ['Cerâmica Delft Blue', 'Centro medieval', 'Túmulo de Vermeer'] },
    { city: 'Keukenhof', distance_km: 35, how: 'Trem + ônibus (1h10)', highlights: ['7 milhões de tulipas', 'Jardins botânicos'], tip: 'Apenas março–maio.' },
    { city: 'Bruges', distance_km: 110, how: 'Trem (2h via Bruxelas)', highlights: ['Canais medievais', 'Chocolate belga', 'Cerveja artesanal'], tip: 'Veneza do Norte!' },
  ],
  berlin: [
    { city: 'Potsdam', distance_km: 30, how: 'Trem S-Bahn (40 min)', highlights: ['Palácio Sanssouci', 'Parques UNESCO', 'Palácio Cecilienhof'] },
    { city: 'Dresden', distance_km: 200, how: 'Trem ICE (1h10)', highlights: ['Frauenkirche', 'Zwinger Palace', 'Cidade Velha reconstruída'] },
    { city: 'Sachsenhausen', distance_km: 35, how: 'Trem (1h)', highlights: ['Memorial do campo de concentração'], tip: 'Visita importante historicamente.' },
  ],
  prague: [
    { city: 'Cesky Krumlov', distance_km: 175, how: 'Ônibus (2h45)', highlights: ['Castelo barroco', 'Rio Vltava', 'Centro histórico UNESCO'] },
    { city: 'Karlovy Vary', distance_km: 130, how: 'Ônibus (2h)', highlights: ['Spas termais', 'Colunas de termas', 'Festival de cinema'] },
    { city: 'Kutna Hora', distance_km: 80, how: 'Trem (1h)', highlights: ['Ossário de Sedlec', 'Catedral de Santa Bárbara', 'Cidade prata medieval'] },
  ],
  lisbon: [
    { city: 'Sintra', distance_km: 30, how: 'Trem (40 min)', highlights: ['Palácio da Pena', 'Castelo dos Mouros', 'Quinta da Regaleira'], tip: 'Vá cedo — superlota em jul/ago.' },
    { city: 'Cascais', distance_km: 30, how: 'Trem (40 min)', highlights: ['Praias', 'Estoril Casino', 'Boca do Inferno'] },
    { city: 'Obidos', distance_km: 90, how: 'Ônibus (1h30)', highlights: ['Castelo medieval', 'Muralhas para caminhar', 'Licor de ginja'] },
    { city: 'Evora', distance_km: 130, how: 'Trem ou ônibus (1h30)', highlights: ['Templo Romano', 'Capela dos Ossos', 'Cromeleque dos Almendres'] },
  ],
  madrid: [
    { city: 'Toledo', distance_km: 70, how: 'Trem alta velocidade (30 min)', highlights: ['Catedral Gótica', 'Sinagoga del Tránsito', 'El Greco Museu'], tip: 'Um dia inteiro não é demais.' },
    { city: 'Segovia', distance_km: 90, how: 'Trem (35 min)', highlights: ['Aqueduto Romano', 'Alcázar de Segóvia', 'Catedral'] },
    { city: 'Avila', distance_km: 110, how: 'Trem (1h30)', highlights: ['Muralhas medievais UNESCO', 'Catedral de Ávila'] },
  ],
  'rio de janeiro': [
    { city: 'Petrópolis', distance_km: 65, how: 'Ônibus (1h30)', highlights: ['Museu Imperial', 'Palácio de Cristal', 'Casa do Santos Dumont'], tip: 'Clima serrano muito mais fresco que o Rio.' },
    { city: 'Paraty', distance_km: 240, how: 'Ônibus (4h)', highlights: ['Centro histórico colonial UNESCO', 'Baías e ilhas', 'Cachoeiras'], tip: 'Vale pernoite mas dá bate e volta também.' },
    { city: 'Buzios', distance_km: 175, how: 'Ônibus (2h30)', highlights: ['27 praias', 'Orla Bardot', 'Piscinas naturais'] },
  ],
  'sao paulo': [
    { city: 'Campos do Jordão', distance_km: 185, how: 'Ônibus (3h) ou carro', highlights: ['Arquitetura europeia', 'Serra da Mantiqueira', 'Artesanato local'], tip: 'Melhor no inverno durante o festival.' },
    { city: 'Holambra', distance_km: 130, how: 'Carro (2h)', highlights: ['Cidade de imigração holandesa', 'Flores exóticas', 'Museu da imigração'] },
    { city: 'Guaruja', distance_km: 85, how: 'Carro ou ônibus (1h30)', highlights: ['Praias de água limpa', 'Piscinas naturais'] },
    { city: 'Atibaia', distance_km: 65, how: 'Carro (1h)', highlights: ['Turismo rural', 'Festival de morangos', 'Serra do Japi'] },
  ],
  tokyo: [
    { city: 'Nikko', distance_km: 150, how: 'Trem (50 min)', highlights: ['Santuário de Toshogu', 'Cataratas de Kegon', 'Floresta de cedros'] },
    { city: 'Kamakura', distance_km: 50, how: 'Trem (1h)', highlights: ['Buda gigante (Daibutsu)', 'Templos Zen', 'Praias'] },
    { city: 'Hakone', distance_km: 80, how: 'Trem Romancecar (1h25)', highlights: ['Vista do Monte Fuji', 'Onsen (banhos termais)', 'Lago Ashi'] },
    { city: 'Yokohama', distance_km: 30, how: 'Trem (30 min)', highlights: ['Chinatown maior da Ásia', 'Minato Mirai', 'Ramen Museum'] },
  ],
  istanbul: [
    { city: 'Ilhas dos Príncipes', distance_km: 15, how: 'Balsa (1h10)', highlights: ['Ilhas sem carros', 'Passeio de charrete', 'Praias tranquilas'] },
    { city: 'Bursa', distance_km: 90, how: 'Balsa + ônibus (2h15)', highlights: ['Grande Mesquita', 'Monte Uludag para trekking', 'Kebab de Bursa'] },
  ],
  'buenos aires': [
    { city: 'Tigre', distance_km: 30, how: 'Trem (1h)', highlights: ['Delta do Paraná', 'Canais de barco', 'Puerto de Frutos'] },
    { city: 'Colonia del Sacramento', distance_km: 50, how: 'Balsa (1h)', highlights: ['Cidade colonial portuguesa UNESCO', 'Bairro Histórico', 'Farol'] },
    { city: 'Montevideu', distance_km: 250, how: 'Balsa (2h30)', highlights: ['Rambla de Montevidéu', 'Ciudad Vieja', 'Mercado del Puerto'] },
  ],
  singapore: [
    { city: 'Malaca', distance_km: 220, how: 'Ônibus (2h30)', highlights: ['Cidade Patrimônio UNESCO', 'Cultura Peranakan', 'Jonker Street'], tip: 'Atravessa a fronteira com a Malásia.' },
    { city: 'Johor Bahru', distance_km: 30, how: 'Ônibus (1h)', highlights: ['Legoland', 'Compras mais baratas', 'Cidade moderna'] },
  ],
};

function getDayTrips(cities: string[]): { mainCity: string; trips: DayTrip[] } | null {
  for (const city of cities) {
    const cl = city.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ').trim();
    for (const key of Object.keys(DAY_TRIPS)) {
      const kn = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (cl.includes(kn) || kn.includes(cl))
        return { mainCity: city, trips: DAY_TRIPS[key] };
    }
  }
  return null;
}

function checkSeasonality(cities: string[], start: string, end: string) {
  if (!start || !end) return [];
  const months = new Set<number>();
  let d = new Date(start + 'T12:00:00');
  const fin = new Date(end + 'T12:00:00');
  while (d <= fin) { months.add(d.getMonth() + 1); d.setDate(d.getDate() + 28); }
  months.add(fin.getMonth() + 1);
  const out: Array<{ warn: boolean; msg: string }> = [];
  for (const city of cities)
    for (const a of SEASONAL_DATA)
      if (a.keys.some(k => city.toLowerCase().includes(k)) && a.months.some(m => months.has(m)))
        out.push({ warn: a.warn, msg: a.msg });
  return out;
}

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

const WEATHER_ICON: Record<number, string> = {
  113: '☀️', 116: '⛅', 119: '☁️', 122: '☁️',
  143: '🌫️', 248: '🌫️', 260: '🌫️',
  176: '🌦️', 179: '🌨️', 182: '🌧️', 185: '🌧️',
  200: '⛈️', 227: '❄️', 230: '❄️',
  263: '🌧️', 266: '🌧️', 281: '🌧️', 284: '🌧️',
  293: '🌧️', 296: '🌧️', 299: '🌧️', 302: '🌧️',
  305: '🌧️', 308: '🌧️', 311: '🌧️', 314: '🌧️',
  317: '🌨️', 320: '🌨️', 323: '❄️', 326: '❄️',
  329: '❄️', 332: '❄️', 335: '❄️', 338: '❄️',
  350: '🌧️', 353: '🌦️', 356: '🌧️', 359: '🌧️',
  362: '🌨️', 365: '🌨️', 368: '🌨️', 371: '❄️',
  374: '🌧️', 377: '🌧️', 386: '⛈️', 389: '⛈️',
  392: '⛈️', 395: '⛈️',
};
const getWeatherIcon = (code: number) => WEATHER_ICON[code] ?? '🌤️';

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
    lat?: number; lon?: number;
  } | null>(null);
  const [tips, setTips] = useState<{
    overview?: string;
    days?: Array<{ day: number; theme: string; tip: string; food: string }>;
  } | null>(null);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [visited, setVisited] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const saved = localStorage.getItem(`visited_${typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : ''}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [weatherByDate, setWeatherByDate] = useState<Record<string, { icon: string; maxC: number; minC: number; is_rainy: boolean; description: string }>>({});
  const [dayNotes, setDayNotes] = useState<Record<number, string>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(`notes_${window.location.pathname.split('/').pop()}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [addModalDay, setAddModalDay] = useState<number | null>(null);
  const [availableAttractions, setAvailableAttractions] = useState<Attraction[]>([]);
  const [attrSearch, setAttrSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState('');
  const [showPackingList, setShowPackingList] = useState(false);
  const [packingChecked, setPackingChecked] = useState<Set<string>>(new Set());
  const [expandedGems, setExpandedGems] = useState<Set<string>>(new Set());
  const [showDayTrips, setShowDayTrips] = useState(true);
  const [dayTripModal, setDayTripModal] = useState<{ trip: DayTrip; mainCity: string; smartDay: number } | null>(null);
  const [dayTripDay, setDayTripDay] = useState(1);
  const [addingDayTrip, setAddingDayTrip] = useState(false);
  const [dayTripMsg, setDayTripMsg] = useState<{ ok: boolean; text: string } | null>(null);

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

  const deleteItem = async (item: ItineraryItem) => {
    setItinerary(prev => prev.filter(i => i.id !== item.id));
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/itineraries/${tripId}/items/${item.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) { console.error('delete item', e); }
  };

  const deleteTrip = async () => {
    if (!confirm('Excluir esta viagem permanentemente? Esta ação não pode ser desfeita.')) return;
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.push('/trips');
    } catch (e) { console.error('delete trip', e); }
  };

  const shareTrip = async () => {
    const url = `${window.location.origin}/shared/${tripId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { prompt('Copie o link da sua viagem:', url); }
  };

  const openAddModal = async (day: number) => {
    setAttrSearch('');
    setAddModalDay(day);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}/available-attractions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAvailableAttractions(res.data);
    } catch (e) { console.error('available attractions', e); }
  };

  const addAttractionToDay = async (attraction: Attraction, day: number) => {
    const dayItems = itinerary.filter(i => i.day_number === day);
    const newOrder = dayItems.reduce((m, i) => Math.max(m, i.order_in_day), 0) + 1;
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/itineraries/${tripId}`,
        { attraction_id: attraction.id, day_number: day, order_in_day: newOrder, notes: '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setItinerary(prev => [...prev, res.data]);
      setAvailableAttractions(prev => prev.filter(a => a.id !== attraction.id));
      setAddModalDay(null);
    } catch (e) { console.error('add attraction', e); }
  };

  const updateDayNote = (day: number, text: string) => {
    setDayNotes(prev => {
      const next = { ...prev, [day]: text };
      try { localStorage.setItem(`notes_${tripId}`, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const toggleVisited = (attractionId: string) => {
    setVisited(prev => {
      const next = new Set(prev);
      next.has(attractionId) ? next.delete(attractionId) : next.add(attractionId);
      try { localStorage.setItem(`visited_${tripId}`, JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  };

  const generatePackingList = () => {
    const cats = new Set(
      itinerary.map(i => attractions.find(a => a.id === i.attraction_id)?.category).filter(Boolean) as string[]
    );
    const wVals = Object.values(weatherByDate);
    const hasRain = wVals.some(w => w.is_rainy);
    const hasCold = wVals.some(w => typeof w.minC === 'number' && (w.minC as number) < 12);
    const hasHot = wVals.some(w => typeof w.maxC === 'number' && (w.maxC as number) > 28);
    const profs = (trip?.traveler_profile || '').split(',');
    return [
      { cat: '📋 Documentos', items: ['Passaporte / RG', 'Passagens / e-tickets', 'Seguro viagem', 'Cartão de crédito/débito', 'Dinheiro local em espécie'] },
      { cat: '📱 Tecnologia', items: ['Carregador do celular', 'Adaptador de tomada', 'Power bank', 'Fone de ouvido'] },
      { cat: '💊 Saúde & Higiene', items: ['Remédios pessoais', 'Protetor solar FPS 50+', 'Repelente', 'Band-aid / kit básico'] },
      { cat: '👗 Roupas', items: ['Roupa íntima (1 por dia)', 'Camisetas', 'Calça / bermuda', ...(hasCold ? ['Casaco / jaqueta', 'Cachecol'] : []), ...(hasHot ? ['Roupas leves de linho'] : []), ...(cats.has('beach') ? ['Biquíni / sunga', 'Canga'] : [])] },
      ...(cats.has('beach') ? [{ cat: '🏖️ Praia', items: ['Óculos de sol', 'Chapéu / boné', 'Chinelo', 'Bolsa impermeável'] }] : []),
      ...(cats.has('hiking') || cats.has('park') ? [{ cat: '🥾 Trilha / Outdoor', items: ['Tênis de caminhada', 'Mochila pequena', 'Garrafinha de água', 'Snacks energéticos'] }] : []),
      ...(hasRain ? [{ cat: '🌧️ Para a chuva', items: ['Guarda-chuva compacto', 'Capa de chuva', 'Sapato impermeável'] }] : []),
      ...(profs.includes('adventure') ? [{ cat: '🧗 Aventura', items: ['Kit primeiros socorros', 'Lanterna / headlamp', 'Mapa offline (baixar antes)'] }] : []),
      ...(profs.includes('cultural') ? [{ cat: '🎨 Cultural', items: ['Câmera fotográfica', 'Caderninho de anotações', 'App de museu offline'] }] : []),
      ...(profs.includes('gastronomic') || cats.has('restaurant') ? [{ cat: '🍽️ Gastronomia', items: ['App de tradução de cardápio', 'Lista de restaurantes salvos offline'] }] : []),
    ];
  };

  const hiddenGemsFor = (attr: Attraction): Attraction[] => {
    const inItin = new Set(itinerary.map(i => i.attraction_id));
    return attractions
      .filter(a => !inItin.has(a.id) && a.id !== attr.id)
      .map(a => ({ ...a, _dist: haversineKm(attr.latitude, attr.longitude, a.latitude, a.longitude) }))
      .filter((a: any) => a._dist < 0.7)
      .sort((a: any, b: any) => a._dist - b._dist)
      .slice(0, 2);
  };

  const openDayTripModal = (dt: DayTrip, mainCity: string) => {
    const nDays = numDays || 1;
    let best = 1, bestScore = Infinity;
    for (let d = 1; d <= nDays; d++) {
      const dayItems = itinerary.filter(it => it.day_number === d);
      const mins = dayItems.reduce((acc, it) => acc + (attractions.find(a => a.id === it.attraction_id)?.visit_duration_minutes || 0), 0);
      const score = dayItems.length * 100 + mins;
      if (score < bestScore) { bestScore = score; best = d; }
    }
    setDayTripDay(best);
    setDayTripMsg(null);
    setDayTripModal({ trip: dt, mainCity, smartDay: best });
  };

  const handleAddDayTrip = async () => {
    if (!dayTripModal || addingDayTrip) return;
    setAddingDayTrip(true);
    setDayTripMsg(null);
    try {
      const { data } = await getSession();
      const headers = { Authorization: `Bearer ${data!.session!.access_token}` };
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}/add-day-trip`,
        { city: dayTripModal.trip.city, day_number: dayTripDay, max_attractions: 4 },
        { headers, timeout: 30000 }
      );
      const newItems: ItineraryItem[] = res.data.added;
      const newAttrs: Attraction[] = res.data.attractions;
      setItinerary(prev => [...prev, ...newItems]);
      setAttractions(prev => {
        const ids = new Set(prev.map(a => a.id));
        return [...prev, ...newAttrs.filter((a: Attraction) => !ids.has(a.id))];
      });
      setDayTripMsg({ ok: true, text: `✅ ${newItems.length} atra${newItems.length === 1 ? 'ção adicionada' : 'ções adicionadas'} de ${dayTripModal.trip.city} ao Dia ${dayTripDay}!` });
      setTimeout(() => { setDayTripModal(null); setDayTripMsg(null); }, 2800);
    } catch (err: any) {
      setDayTripMsg({ ok: false, text: err.response?.data?.detail || 'Erro ao adicionar. Tente novamente.' });
    } finally {
      setAddingDayTrip(false);
    }
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

  useEffect(() => {
    if (!trip || !token) return;
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}/weather`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 12000,
      })
      .then(res => {
        const map: Record<string, { icon: string; maxC: number; minC: number; is_rainy: boolean; description: string }> = {};
        for (const w of (res.data || [])) {
          map[w.date] = {
            icon: w.icon,
            maxC: w.temp_max ?? '--',
            minC: w.temp_min ?? '--',
            is_rainy: w.is_rainy,
            description: w.description,
          };
        }
        setWeatherByDate(map);
      })
      .catch(() => {});
  }, [trip?.id, token]);

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
          <Link href="/trips" className="text-white/90 hover:text-white font-medium flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm transition">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Minhas Viagens</span>
          </Link>
        </div>
        <div className="absolute top-4 right-6 flex gap-2 print:hidden">
          <button onClick={shareTrip} className="bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 hover:bg-white/30 transition">
            <Share2 size={14} />
            <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Compartilhar'}</span>
          </button>
          <button onClick={deleteTrip} title="Excluir viagem" className="bg-red-500/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 hover:bg-red-600/80 transition">
            <Trash2 size={14} />
          </button>
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
              ) : <><RefreshCw size={14} /> Regenerar Roteiro</>}
            </button>
          </div>
        )}

        {/* Alerta de sazonalidade */}
        {trip && (() => {
          const alerts = checkSeasonality(
            (trip.destinations || [{ city: trip.destination_city }]).map(d => d.city),
            trip.start_date,
            trip.end_date
          );
          if (!alerts.length) return null;
          return (
            <div className="space-y-2 mb-6 print:hidden">
              {alerts.map((a, i) => (
                <div key={i} className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm ${
                  a.warn ? 'bg-orange-50 border border-orange-200 text-orange-800' : 'bg-blue-50 border border-blue-200 text-blue-800'
                }`}>
                  <span className="flex-shrink-0">{a.warn ? '⚠️' : 'ℹ️'}</span>
                  <span>{a.msg}</span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Roteiro por dia */}
        {itinerary.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2 print:hidden">
              <h2 className="text-2xl font-bold text-gray-900">📋 Roteiro de Viagem</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => { setPackingChecked(new Set()); setShowPackingList(true); }}
                  className="text-sm font-medium px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                  title="Lista de bagagem"
                >
                  <Package size={14} className="inline mr-1" /> Bagagem
                </button>
                <button
                  onClick={() => window.print()}
                  className="text-sm font-medium px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                  title="Exportar / Imprimir"
                >
                  <Printer size={14} className="inline mr-1" /> Exportar
                </button>
                <button
                  onClick={() => setIsReordering(r => !r)}
                  className={`text-sm font-medium px-4 py-2 rounded-lg transition ${
                    isReordering
                      ? 'bg-brand-teal text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isReordering ? <><Check size={14} className="inline mr-1" />Concluir</> : <><ArrowUpDown size={14} className="inline mr-1" />Reorganizar</>}
                </button>
              </div>
            </div>
            {visited.size > 0 && !isReordering && (
              <p className="text-sm text-green-600 print:hidden">✅ {visited.size} {visited.size === 1 ? 'atração visitada' : 'atrações visitadas'}</p>
            )}
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
                      <h3 className="text-white font-bold text-lg flex items-center gap-2 flex-wrap">
                        <span className="whitespace-nowrap">Dia {dayIndex + 1}</span>
                        {(() => {
                            const dk = dayDate.toISOString().split('T')[0];
                            const w = weatherByDate[dk];
                            if (!w) return null;
                            return (
                              <span
                                className={`flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-sm font-normal ${w.is_rainy ? 'bg-blue-500/30' : 'bg-white/20'}`}
                                title={w.description}
                              >
                                <span>{w.icon}</span>
                                <span>{w.maxC}°</span>
                                <span className="opacity-70 text-xs">{w.minC}°</span>
                                {w.is_rainy && <span className="text-xs font-semibold">Chuva</span>}
                              </span>
                            );
                          })()}
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
                                <button
                                  onClick={() => deleteItem(item)}
                                  title="Remover"
                                  className="w-7 h-7 flex items-center justify-center rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition flex-shrink-0"
                                ><X size={14} /></button>
                              </div>
                            ) : (
                              <div
                                className={`w-full flex items-center gap-4 p-5 border-b border-gray-100 last:border-0 transition ${
                                  visited.has(item.attraction_id)
                                    ? 'bg-green-50/60'
                                    : 'hover:bg-teal-50/60'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleVisited(item.attraction_id)}
                                  title={visited.has(item.attraction_id) ? 'Desmarcar' : 'Marcar como visitado'}
                                  className={`print:hidden flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition ${
                                    visited.has(item.attraction_id)
                                      ? 'bg-green-100 text-green-600'
                                      : 'bg-brand-teal-light text-brand-teal hover:bg-green-100 hover:text-green-600'
                                  }`}
                                >
                                  {visited.has(item.attraction_id) ? '✓' : index + 1}
                                </button>
                                <div className="print:hidden flex-shrink-0 w-10 h-10 rounded-full bg-brand-teal-light hidden print:flex items-center justify-center font-bold text-brand-teal text-lg">
                                  {index + 1}
                                </div>
                                <button
                                  type="button"
                                  className="flex-1 flex items-center gap-4 text-left group min-w-0"
                                  onClick={() => attraction && setSelectedAttraction({
                                    name: attraction.name,
                                    city: attraction.city || trip.destination_city,
                                    category: categoryPt,
                                    durationStr,
                                    address: attraction.address,
                                    lat: attraction.latitude,
                                    lon: attraction.longitude,
                                  })}
                                >
                                  <div className="text-2xl flex-shrink-0">{icon}</div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`font-bold truncate group-hover:text-brand-teal transition ${
                                      visited.has(item.attraction_id) ? 'line-through text-gray-400' : 'text-gray-900'
                                    }`}>{attraction?.name || 'Atração'}</h4>
                                    <p className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
                                      {item.start_time && (
                                        <span className="font-semibold text-brand-teal">🕐 {item.start_time.slice(0, 5)}</span>
                                      )}
                                      <span>{categoryPt}</span>
                                      {(() => {
                                        const dk = dayDate.toISOString().split('T')[0];
                                        const w = weatherByDate[dk];
                                        if (w?.is_rainy && attraction && OUTDOOR_CATEGORIES.has(attraction.category)) {
                                          return (
                                            <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 font-medium">
                                              🌧️ Ao ar livre
                                            </span>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </p>
                                  </div>
                                  <div className="flex-shrink-0 flex items-center gap-2">
                                    <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                                      ⏱ {durationStr}
                                    </span>
                                    {attraction && (
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${attraction.latitude},${attraction.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        title="Abrir no Google Maps"
                                        className="print:hidden text-gray-300 hover:text-blue-500 transition flex-shrink-0"
                                      >
                                        <MapPin size={16} />
                                      </a>
                                    )}
                                    <Info size={16} className="print:hidden text-gray-300 group-hover:text-brand-teal transition flex-shrink-0" />
                                  </div>
                                </button>
                              </div>
                            )}
                            {!isReordering && travelConnector}
                            {!isReordering && attraction && (() => {
                              const gems = hiddenGemsFor(attraction);
                              if (!gems.length) return null;
                              const key = item.id;
                              const open = expandedGems.has(key);
                              return (
                                <div className="ml-[52px] mr-4 mb-2">
                                  <button
                                    onClick={() => setExpandedGems(prev => { const n = new Set(prev); open ? n.delete(key) : n.add(key); return n; })}
                                    className="text-xs text-brand-teal hover:text-brand-teal-dark font-medium flex items-center gap-1"
                                  >
                                    🔍 {gems.length} descoberta{gems.length > 1 ? 's' : ''} próxima{gems.length > 1 ? 's' : ''} {open ? '▲' : '▼'}
                                  </button>
                                  {open && (
                                    <div className="mt-1.5 space-y-1">
                                      {gems.map((g: any) => (
                                        <div key={g.id} className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                                          <span className="text-lg">{CATEGORY_ICONS[g.category] || '📍'}</span>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{g.name}</p>
                                            <p className="text-xs text-gray-400">{CATEGORY_PT[g.category] || g.category} • {(g._dist * 1000).toFixed(0)}m</p>
                                          </div>
                                          <a href={`https://www.google.com/maps/search/?api=1&query=${g.latitude},${g.longitude}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500"><MapPin size={14} /></a>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {isReordering && (
                    <button
                      onClick={() => openAddModal(dayIndex + 1)}
                      className="w-full flex items-center justify-center gap-2 py-3 text-sm text-brand-teal font-medium hover:bg-teal-50 transition border-t border-dashed border-gray-200"
                    >
                      <Plus size={16} /> Adicionar atração neste dia
                    </button>
                  )}

                  {dayPoints.length > 0 && (
                    <div className="border-t border-gray-100">
                      <ItineraryMap points={dayPoints} />
                    </div>
                  )}

                  <div className="print:hidden border-t border-gray-100 px-5 py-3">
                    <textarea
                      placeholder="📝 Notas do dia (hospedagem, reservas, lembretes...)"
                      value={dayNotes[dayIndex + 1] || ''}
                      onChange={e => updateDayNote(dayIndex + 1, e.target.value)}
                      rows={dayNotes[dayIndex + 1] ? 3 : 1}
                      className="w-full text-sm text-gray-600 placeholder-gray-300 bg-gray-50/60 rounded-lg px-3 py-2 border border-transparent focus:border-gray-200 focus:bg-white outline-none resize-none transition"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bate e Volta */}
        {trip && (() => {
          const cities = (trip.destinations || [{ city: trip.destination_city }]).map((d: any) => d.city);
          const result = getDayTrips(cities);
          if (!result) return null;
          return (
            <div className="mt-8 print:hidden">
              <button
                onClick={() => setShowDayTrips(v => !v)}
                className="w-full flex items-center justify-between bg-white rounded-xl shadow-sm px-6 py-4 hover:shadow-md transition group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚆</span>
                  <div className="text-left">
                    <p className="font-bold text-gray-900">Bate e Voltas de {result.mainCity}</p>
                    <p className="text-sm text-gray-500">{result.trips.length} destinos próximos para explorar em 1 dia</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-brand-teal transition text-sm">{showDayTrips ? '▲ Recolher' : '▼ Ver sugestões'}</span>
              </button>
              {showDayTrips && (
                <div className="mt-3 grid sm:grid-cols-2 gap-3">
                  {result.trips.map(dt => (
                    <div key={dt.city} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-gray-900">{dt.city}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">📍 {dt.distance_km}km &nbsp;·&nbsp; 🚌 {dt.how}</p>
                        </div>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(result.mainCity)}&destination=${encodeURIComponent(dt.city)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 text-xs bg-brand-teal text-white px-2.5 py-1 rounded-full hover:bg-brand-teal-dark transition font-medium whitespace-nowrap"
                        >
                          Como ir
                        </a>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {dt.highlights.map(h => (
                          <span key={h} className="text-xs bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full">{h}</span>
                        ))}
                      </div>
                      {dt.tip && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                          💡 {dt.tip}
                        </p>
                      )}
                      {itinerary.length > 0 && (
                        <button
                          onClick={() => openDayTripModal(dt, result.mainCity)}
                          className="w-full mt-1 text-xs font-semibold text-brand-teal border border-brand-teal rounded-xl py-2 hover:bg-teal-50 transition"
                        >
                          + Adicionar ao Roteiro
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </main>

      {addModalDay !== null && (
        <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center" onClick={() => setAddModalDay(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Adicionar ao Dia {addModalDay}</h3>
              <button onClick={() => setAddModalDay(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
            </div>
            <div className="px-4 py-3 border-b border-gray-100">
              <input
                type="text"
                placeholder="🔍 Buscar atração..."
                value={attrSearch}
                onChange={e => setAttrSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-teal"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {availableAttractions
                .filter(a => !attrSearch || a.name.toLowerCase().includes(attrSearch.toLowerCase()) || a.city.toLowerCase().includes(attrSearch.toLowerCase()))
                .map(a => {
                  const icon = CATEGORY_ICONS[a.category || ''] || '📍';
                  const dur = Math.floor(a.visit_duration_minutes / 60) > 0
                    ? `${Math.floor(a.visit_duration_minutes / 60)}h${a.visit_duration_minutes % 60 > 0 ? (a.visit_duration_minutes % 60) + 'min' : ''}`
                    : `${a.visit_duration_minutes}min`;
                  return (
                    <button
                      key={a.id}
                      onClick={() => addAttractionToDay(a, addModalDay!)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-teal-50 transition border-b border-gray-100 last:border-0 text-left"
                    >
                      <span className="text-2xl flex-shrink-0">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm">{a.name}</p>
                        <p className="text-xs text-gray-400">{a.city} • ⏱ {dur}</p>
                      </div>
                      <span className="text-brand-teal font-bold text-lg">+</span>
                    </button>
                  );
                })}
              {availableAttractions.filter(a => !attrSearch || a.name.toLowerCase().includes(attrSearch.toLowerCase())).length === 0 && (
                <p className="text-gray-400 text-sm text-center py-8">Nenhuma atração disponível.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {dayTripModal && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center" onClick={() => !addingDayTrip && setDayTripModal(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">🚆 Adicionar Bate e Volta</h3>
              <button onClick={() => setDayTripModal(null)} disabled={addingDayTrip} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-40">✕</button>
            </div>

            {/* Destination summary */}
            <div className="px-5 py-3 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100 flex items-center gap-3">
              <span className="text-3xl">🗺️</span>
              <div>
                <p className="font-bold text-teal-900">{dayTripModal.trip.city}</p>
                <p className="text-xs text-teal-700 mt-0.5">
                  📍 {dayTripModal.trip.distance_km}km de {dayTripModal.mainCity} &nbsp;·&nbsp; 🚌 {dayTripModal.trip.how}
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {dayTripModal.trip.highlights.map(h => (
                    <span key={h} className="text-xs bg-white/70 text-teal-700 px-1.5 py-0.5 rounded-full border border-teal-100">{h}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {/* Smart suggestion */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                <span className="text-lg flex-shrink-0">🤖</span>
                <div className="flex-1">
                  <p className="text-sm text-blue-800">
                    <strong>Sugestão inteligente:</strong> Dia {dayTripModal.smartDay} tem a menor carga de atividades — ideal para encaixar o bate e volta.
                  </p>
                </div>
                {dayTripDay !== dayTripModal.smartDay && (
                  <button onClick={() => setDayTripDay(dayTripModal.smartDay)} className="text-xs text-blue-600 underline whitespace-nowrap flex-shrink-0">Usar</button>
                )}
              </div>

              {/* Day selector */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Escolha o dia:</p>
                <div className="space-y-2">
                  {Array.from({ length: numDays }, (_, i) => {
                    const dayNum = i + 1;
                    const dayItems = itinerary.filter(it => it.day_number === dayNum);
                    const dayMins = dayItems.reduce((acc, it) => acc + (attractions.find(a => a.id === it.attraction_id)?.visit_duration_minutes || 0), 0);
                    const dayH = Math.floor(dayMins / 60);
                    const dayM = dayMins % 60;
                    const isBusy = dayItems.length >= 4 || dayMins >= 360;
                    const isSmart = dayNum === dayTripModal.smartDay;
                    const isSelected = dayTripDay === dayNum;
                    const d = new Date(trip!.start_date + 'T12:00:00');
                    d.setDate(d.getDate() + i);
                    const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
                    return (
                      <button key={dayNum} onClick={() => setDayTripDay(dayNum)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition ${
                          isSelected ? 'border-brand-teal bg-teal-50' : 'border-gray-100 hover:border-teal-200 bg-white'
                        }`}>
                        <div className="flex items-center gap-2.5">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isSelected ? 'bg-brand-teal text-white' : 'bg-gray-100 text-gray-500'
                          }`}>{dayNum}</span>
                          <span className="text-sm font-medium text-gray-800 capitalize">{label}</span>
                          {isSmart && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Sugerido</span>}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded-full ${isBusy ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                            {dayItems.length} atv · {dayH}h{dayM > 0 ? dayM + 'min' : ''}
                          </span>
                          {isBusy && <span title="Dia cheio">⚠️</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Busy day warning */}
              {(() => {
                const dayItems = itinerary.filter(it => it.day_number === dayTripDay);
                const dayMins = dayItems.reduce((acc, it) => acc + (attractions.find(a => a.id === it.attraction_id)?.visit_duration_minutes || 0), 0);
                if (dayItems.length < 4 && dayMins < 300) return null;
                return (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2">
                    <span>⚠️</span>
                    <p className="text-sm text-orange-700">
                      O Dia {dayTripDay} já está bem cheio ({dayItems.length} atividades, ~{Math.round(dayMins / 60)}h).
                      O bate e volta será adicionado, mas considere remover atividades para não sobrecarregar o dia.
                    </p>
                  </div>
                );
              })()}

              {/* Distance notice */}
              {dayTripModal.trip.distance_km > 100 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-start gap-2">
                  <span>🕐</span>
                  <p className="text-sm text-gray-600">
                    Destino a {dayTripModal.trip.distance_km}km. Considere sair cedo — o transporte de ida e volta consome boa parte do dia.
                  </p>
                </div>
              )}

              {/* Result message */}
              {dayTripMsg && (
                <div className={`rounded-xl p-3 text-sm font-medium text-center ${
                  dayTripMsg.ok ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {dayTripMsg.text}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-5 py-4 flex gap-3">
              <button onClick={() => setDayTripModal(null)} disabled={addingDayTrip}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition disabled:opacity-40">
                Cancelar
              </button>
              <button onClick={handleAddDayTrip} disabled={addingDayTrip || dayTripMsg?.ok === true}
                className="flex-1 py-2.5 rounded-xl bg-brand-teal text-white text-sm font-semibold hover:bg-brand-teal-dark transition disabled:opacity-50 flex items-center justify-center gap-2">
                {addingDayTrip
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Buscando atrações...</>
                  : '✓ Adicionar ao Roteiro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPackingList && (
        <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center" onClick={() => setShowPackingList(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><Package size={18} /> Lista de Bagagem</h3>
              <button onClick={() => setShowPackingList(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
            </div>
            <p className="text-xs text-gray-400 px-5 pt-3">Gerada com base no roteiro, clima e perfil da viagem.</p>
            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-4">
              {generatePackingList().map(section => (
                <div key={section.cat}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{section.cat}</p>
                  <div className="space-y-1">
                    {section.items.map(item => {
                      const id = `${section.cat}::${item}`;
                      const checked = packingChecked.has(id);
                      return (
                        <button key={id} onClick={() => setPackingChecked(prev => { const n = new Set(prev); checked ? n.delete(id) : n.add(id); return n; })}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${
                            checked ? 'bg-green-50 text-gray-400 line-through' : 'hover:bg-gray-50 text-gray-800'
                          }`}>
                          <span className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold transition ${
                            checked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                          }`}>{checked ? '✓' : ''}</span>
                          <span className="text-sm">{item}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-400">{packingChecked.size} itens marcados</span>
              <button onClick={() => setPackingChecked(new Set())} className="text-xs text-gray-400 hover:text-red-500">Limpar</button>
            </div>
          </div>
        </div>
      )}

      {selectedAttraction && (
        <AttractionModal
          name={selectedAttraction.name}
          city={selectedAttraction.city}
          category={selectedAttraction.category}
          durationStr={selectedAttraction.durationStr}
          address={selectedAttraction.address}
          lat={selectedAttraction.lat}
          lon={selectedAttraction.lon}
          onClose={() => setSelectedAttraction(null)}
        />
      )}
    </div>
  );
}
