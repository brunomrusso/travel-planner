'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/supabase';
import Link from 'next/link';
import axios from 'axios';
import FlagImg from '@/components/FlagImg';

const TRAVELER_PROFILES = [
  { value: 'adventure', label: '🏔️ Aventura', description: 'Trilhas, natureza, atividades ao ar livre' },
  { value: 'cultural', label: '🏛️ Cultural', description: 'Museus, galerias, sítios históricos' },
  { value: 'gastronomic', label: '🍽️ Gastronômico', description: 'Restaurantes, cafés, mercados' },
  { value: 'relax', label: '🏖️ Relaxamento', description: 'Praias, spas, parques' },
  { value: 'family', label: '👨‍👩‍👧‍👦 Família', description: 'Atrações para crianças, entretenimento' },
];

interface CityOption {
  display_name: string;
  lat?: string;
  lon?: string;
  class?: string;
  type?: string;
  address?: { country?: string; city?: string; town?: string; village?: string; country_code?: string };
}

interface DestEntry {
  city: string;
  country: string;
  country_code: string;
  query: string;
  valid: boolean | null;
  suggestions: CityOption[];
  showSuggestions: boolean;
  isSearching: boolean;
  days: number;
  lat?: number;
  lon?: number;
  countryDetected?: { name: string; code: string };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function totalRouteKm(dests: DestEntry[]): number {
  let d = 0;
  for (let i = 0; i < dests.length - 1; i++) {
    if (dests[i].lat && dests[i + 1].lat)
      d += haversineKm(dests[i].lat!, dests[i].lon!, dests[i + 1].lat!, dests[i + 1].lon!);
  }
  return d;
}

function nearestNeighborCities(dests: DestEntry[]): DestEntry[] {
  if (dests.length < 3) return dests;
  const result = [dests[0]];
  const pool = [...dests.slice(1)];
  while (pool.length > 0) {
    const last = result[result.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < pool.length; i++) {
      const d = last.lat && pool[i].lat ? haversineKm(last.lat!, last.lon!, pool[i].lat!, pool[i].lon!) : Infinity;
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    result.push(pool.splice(bestIdx, 1)[0]);
  }
  return result;
}

const SEASONAL_ALERTS: Array<{ keys: string[]; months: number[]; level: 'warn' | 'info'; msg: string }> = [
  { keys: ['veneza', 'venice'], months: [7, 8], level: 'warn', msg: 'Veneza em jul/ago: superlotada. Considere abr ou out.' },
  { keys: ['barcelona'], months: [7, 8], level: 'warn', msg: 'Barcelona no verão: praias lotadas e filas enormes nas atrações.' },
  { keys: ['roma', 'rome'], months: [7, 8], level: 'warn', msg: 'Roma em jul/ago: calor extremo (40°C+) e superlotação.' },
  { keys: ['paris'], months: [7, 8], level: 'info', msg: 'Alta temporada em Paris. Muitos locais fecham em agosto.' },
  { keys: ['rio de janeiro', 'copacabana', 'rio'], months: [12, 1, 2], level: 'warn', msg: 'Rio no Réveillon/Carnaval: preços altíssimos e superlotação.' },
  { keys: ['dubai'], months: [6, 7, 8, 9], level: 'warn', msg: 'Dubai no verão: temperatura acima de 45°C. Prefira nov–abr.' },
  { keys: ['tóquio', 'tokyo', 'kyoto'], months: [3, 4], level: 'info', msg: 'Temporada de cerejeiras (mar/abr): muito popular, reserve hotel com antecedência.' },
  { keys: ['bali'], months: [7, 8], level: 'info', msg: 'Alta temporada em Bali. Prefira mai/jun ou set.' },
  { keys: ['amsterdam'], months: [4, 5], level: 'info', msg: 'Florada das tulipas (abr/mai): muito procurado, hotéis esgotam rápido.' },
  { keys: ['new york', 'nova york', 'nova iorque'], months: [11, 12], level: 'info', msg: 'Natal em NYC: linda mas lotada e cara.' },
  { keys: ['machu picchu'], months: [6, 7, 8], level: 'info', msg: 'Temporada seca: melhor clima mas ingressos esgotam semanas antes.' },
  { keys: ['santorini', 'mykonos'], months: [7, 8], level: 'warn', msg: 'Ilhas gregas no verão: superlotadas, preços triplicados.' },
  { keys: ['madrid'], months: [8], level: 'info', msg: 'Madrid em agosto: calor extremo e vários locais fechados.' },
  { keys: ['praga', 'prague'], months: [7, 8], level: 'info', msg: 'Praga no verão: muito turística, visite cedo pela manhã para evitar multidões.' },
];

const COUNTRY_TOP_CITIES: Record<string, string[]> = {
  es: ['Madrid', 'Barcelona', 'Sevilha', 'Granada', 'Toledo', 'Valencia', 'Bilbao', 'Córdoba'],
  fr: ['Paris', 'Nice', 'Lyon', 'Bordeaux', 'Marseille', 'Estrasburgo', 'Toulouse'],
  it: ['Roma', 'Florença', 'Veneza', 'Milão', 'Nápoles', 'Siena', 'Cinque Terre', 'Bolonha'],
  pt: ['Lisboa', 'Porto', 'Faro', 'Sintra', 'Coimbra', 'Évora', 'Braga'],
  de: ['Berlim', 'Munique', 'Hamburgo', 'Colônia', 'Frankfurt', 'Dresden', 'Nuremberg'],
  gb: ['Londres', 'Edinburgh', 'Bath', 'Oxford', 'Cambridge', 'York', 'Manchester'],
  gr: ['Atenas', 'Santorini', 'Mykonos', 'Thessaloniki', 'Creta', 'Rodes'],
  jp: ['Tóquio', 'Kyoto', 'Osaka', 'Hiroshima', 'Nara', 'Hakone', 'Nikko'],
  us: ['Nova York', 'Los Angeles', 'Miami', 'Chicago', 'San Francisco', 'Las Vegas', 'New Orleans'],
  br: ['São Paulo', 'Rio de Janeiro', 'Salvador', 'Florianópolis', 'Curitiba', 'Manaus', 'Natal'],
  ar: ['Buenos Aires', 'Bariloche', 'Mendoza', 'Salta', 'Córdoba', 'Ushuaia'],
  pe: ['Lima', 'Cusco', 'Machu Picchu', 'Arequipa', 'Paracas'],
  th: ['Bangkok', 'Chiang Mai', 'Phuket', 'Koh Samui', 'Ayutthaya'],
  au: ['Sydney', 'Melbourne', 'Brisbane', 'Cairns', 'Gold Coast', 'Perth'],
  cn: ['Pequim', 'Xangai', 'Chengdu', "Xi'an", 'Guilin', 'Zhangjiajie'],
  mx: ['Cidade do México', 'Cancún', 'Oaxaca', 'Guadalajara', 'Tulum'],
  tr: ['Istambul', 'Capadócia', 'Antalya', 'Éfeso', 'Pamukkale'],
  in: ['Nova Delhi', 'Mumbai', 'Jaipur', 'Agra', 'Goa', 'Varanasi'],
  ma: ['Marrakech', 'Fes', 'Casablanca', 'Chefchaouen', 'Essaouira'],
  nl: ['Amsterdã', 'Haia', 'Utrecht', 'Roterdã'],
  ch: ['Zurique', 'Genebra', 'Berna', 'Lucerna', 'Interlaken'],
  at: ['Viena', 'Salzburgo', 'Innsbruck', 'Hallstatt'],
  hu: ['Budapeste', 'Eger', 'Pécs'],
  cz: ['Praga', 'Brno', 'Český Krumlov'],
  pl: ['Varsóvia', 'Cracóvia', 'Gdansk', 'Wrocław'],
  no: ['Oslo', 'Bergen', 'Tromsø', 'Ålesund'],
  dk: ['Copenhague', 'Aarhus'],
  se: ['Estocolmo', 'Gotemburgo'],
  nz: ['Auckland', 'Queenstown', 'Wellington', 'Christchurch'],
  ca: ['Toronto', 'Vancouver', 'Montreal', 'Quebec', 'Banff'],
  za: ['Cidade do Cabo', 'Joanesburgo', 'Durban'],
  eg: ['Cairo', 'Luxor', 'Assuã', 'Hurghada'],
  kr: ['Seul', 'Busan', 'Jeju'],
  vn: ['Hanói', 'Ho Chi Minh', 'Hoi An', 'Da Nang'],
  id: ['Bali', 'Jacarta', 'Yogyakarta', 'Lombok'],
};

const _norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const COUNTRY_PT_NAMES: Record<string, string> = {
  espanha: 'es', franca: 'fr', italia: 'it', portugal: 'pt', alemanha: 'de',
  'reino unido': 'gb', grecia: 'gr', japao: 'jp', 'estados unidos': 'us', eua: 'us',
  brasil: 'br', argentina: 'ar', peru: 'pe', tailandia: 'th', australia: 'au',
  china: 'cn', mexico: 'mx', turquia: 'tr', india: 'in', marrocos: 'ma',
  holanda: 'nl', 'paises baixos': 'nl', suica: 'ch', austria: 'at', hungria: 'hu',
  'republica tcheca: ': 'cz', polonia: 'pl', noruega: 'no', dinamarca: 'dk',
  suecia: 'se', 'nova zelandia': 'nz', canada: 'ca', 'africa do sul': 'za',
  egito: 'eg', 'coreia do sul': 'kr', vietna: 'vn', indonesia: 'id', singapura: 'sg',
  belgica: 'be', russia: 'ru', ucrania: 'ua', escocia: 'gb', irlanda: 'ie',
  cuba: 'cu', colombia: 'co', chile: 'cl', bolivia: 'bo', equador: 'ec',
  tailândia: 'th',
};

function getSeasonalAlerts(cities: string[], start: string, end: string) {
  if (!start || !end) return [];
  const months = new Set<number>();
  const d1 = new Date(start + 'T12:00:00');
  const d2 = new Date(end + 'T12:00:00');
  let cur = new Date(d1);
  while (cur <= d2) { months.add(cur.getMonth() + 1); cur.setDate(cur.getDate() + 30); }
  months.add(d2.getMonth() + 1);
  const found: Array<{ level: 'warn' | 'info'; msg: string }> = [];
  for (const city of cities) {
    const cl = city.toLowerCase();
    for (const a of SEASONAL_ALERTS) {
      if (a.keys.some(k => cl.includes(k)) && a.months.some(m => months.has(m)))
        found.push({ level: a.level, msg: a.msg });
    }
  }
  return found;
}

const emptyDest = (): DestEntry => ({
  city: '', country: '', country_code: '', query: '',
  valid: null, suggestions: [], showSuggestions: false, isSearching: false, days: 1,
  lat: undefined, lon: undefined, countryDetected: undefined,
});


export default function NewTripPage() {
  const router = useRouter();
  const [destinations, setDestinations] = useState<DestEntry[]>([emptyDest()]);
  const [formData, setFormData] = useState({ start_date: '', end_date: '' });
  const [profiles, setProfiles] = useState<string[]>(['cultural']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cityOrderSuggestion, setCityOrderSuggestion] = useState<{ order: DestEntry[]; savings: number } | null>(null);
  const debounceRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const loadPrefs = async () => {
      const { data } = await getSession();
      if (!data?.session) return;
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me/preferences`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
        if (res.data?.default_profile) setProfiles([res.data.default_profile]);
      } catch {}
    };
    loadPrefs();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      setDestinations(prev => prev.map((d, i) => {
        if (dropdownRefs.current[i] && !dropdownRefs.current[i]!.contains(e.target as Node)) {
          return { ...d, showSuggestions: false };
        }
        return d;
      }));
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCities = async (idx: number, query: string) => {
    if (query.length < 2) {
      setDestinations(prev => prev.map((d, i) => i === idx ? { ...d, suggestions: [], valid: null, isSearching: false } : d));
      return;
    }
    setDestinations(prev => prev.map((d, i) => i === idx ? { ...d, isSearching: true } : d));
    try {
      const res = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: query, format: 'json', limit: 8, addressdetails: 1 },
        headers: { 'Accept-Language': 'pt-BR' },
        timeout: 5000,
      });
      // Filter out country-level results (no city/town/village in address)
      const cityResults: CityOption[] = (res.data as CityOption[]).filter(
        r => r.address?.city || r.address?.town || r.address?.village
      );
      // If Nominatim returned only country-level results, treat as country input
      if (cityResults.length === 0 && res.data.length > 0) {
        const first = res.data[0] as CityOption;
        const cc = first.address?.country_code || '';
        if (cc && COUNTRY_TOP_CITIES[cc]) {
          setDestinations(prev => prev.map((d, i) => i === idx
            ? { ...d, countryDetected: { name: query, code: cc }, suggestions: [], showSuggestions: false, isSearching: false }
            : d
          ));
          return;
        }
      }
      setDestinations(prev => prev.map((d, i) => i === idx
        ? { ...d, suggestions: cityResults, showSuggestions: cityResults.length > 0, valid: cityResults.length === 0 ? false : null, isSearching: false }
        : d
      ));
    } catch {
      setDestinations(prev => prev.map((d, i) => i === idx ? { ...d, isSearching: false } : d));
    }
  };

  const handleCityInput = (idx: number, val: string) => {
    // Detect if user typed a country name (PT-BR)
    const detectedCode = COUNTRY_PT_NAMES[_norm(val)];
    if (detectedCode) {
      setDestinations(prev => prev.map((d, i) => i === idx
        ? { ...d, query: val, city: '', valid: null, countryDetected: { name: val, code: detectedCode }, suggestions: [], showSuggestions: false, isSearching: false }
        : d
      ));
      clearTimeout(debounceRefs.current[idx]);
      return;
    }
    setDestinations(prev => prev.map((d, i) => i === idx ? { ...d, query: val, city: val, valid: null, countryDetected: undefined } : d));
    clearTimeout(debounceRefs.current[idx]);
    if (val.length >= 2) {
      debounceRefs.current[idx] = setTimeout(() => searchCities(idx, val), 400);
    } else {
      setDestinations(prev => prev.map((d, i) => i === idx ? { ...d, suggestions: [], showSuggestions: false } : d));
    }
  };

  const handleSelectCity = (idx: number, city: CityOption) => {
    const name = city.address?.city || city.address?.town || city.address?.village || city.display_name.split(',')[0];
    const country = city.address?.country || '';
    const country_code = city.address?.country_code || '';
    const lat = city.lat ? parseFloat(city.lat) : undefined;
    const lon = city.lon ? parseFloat(city.lon) : undefined;
    setDestinations(prev => prev.map((d, i) => i === idx
      ? { ...d, city: name, country, country_code, query: name, valid: true, suggestions: [], showSuggestions: false, lat, lon }
      : d
    ));
  };

  const quickAddCity = async (baseIdx: number, cityName: string) => {
    // Find first empty or country-detected slot at/after baseIdx, else append
    const targetIdx = (() => {
      for (let i = baseIdx; i < destinations.length; i++) {
        if (!destinations[i].valid) return i;
      }
      return -1; // need to append
    })();

    const applyCity = (idx: number, res: CityOption[]) => {
      const cityResults = (res as CityOption[]).filter(r => r.address?.city || r.address?.town || r.address?.village);
      if (cityResults.length === 0) return;
      const r = cityResults[0];
      const name = r.address?.city || r.address?.town || r.address?.village || r.display_name.split(',')[0];
      setDestinations(prev => {
        const next = [...prev];
        const entry: DestEntry = {
          ...next[idx],
          city: name, country: r.address?.country || '', country_code: r.address?.country_code || '',
          query: name, valid: true, suggestions: [], showSuggestions: false, isSearching: false,
          lat: r.lat ? parseFloat(r.lat) : undefined, lon: r.lon ? parseFloat(r.lon) : undefined,
          countryDetected: undefined,
        };
        next[idx] = entry;
        return tripDays > 0 ? distributeDaysEvenly(next, tripDays) : next;
      });
    };

    if (targetIdx === -1) {
      // Append new entry first
      setDestinations(prev => {
        const next = [...prev, { ...emptyDest(), query: cityName, isSearching: true }];
        return next;
      });
    } else {
      setDestinations(prev => prev.map((d, i) => i === targetIdx ? { ...d, query: cityName, isSearching: true, countryDetected: undefined } : d));
    }

    try {
      const res = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: cityName, format: 'json', limit: 5, addressdetails: 1 },
        headers: { 'Accept-Language': 'pt-BR' },
        timeout: 5000,
      });
      const idx = targetIdx === -1 ? destinations.length : targetIdx;
      applyCity(idx, res.data);
    } catch {
      const idx = targetIdx === -1 ? destinations.length : targetIdx;
      setDestinations(prev => prev.map((d, i) => i === idx ? { ...d, isSearching: false } : d));
    }
  };

  const tripDays = formData.start_date && formData.end_date
    ? Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / 86400000) + 1
    : 0;

  const distributeDaysEvenly = (dests: DestEntry[], total: number): DestEntry[] => {
    if (dests.length === 0 || total <= 0) return dests;
    const base = Math.floor(total / dests.length);
    return dests.map((d, i) => ({
      ...d,
      days: i === dests.length - 1 ? total - base * (dests.length - 1) : base,
    }));
  };

  const addDestination = () => {
    setDestinations(prev => {
      const next = [...prev, emptyDest()];
      return tripDays > 0 ? distributeDaysEvenly(next, tripDays) : next;
    });
  };
  const removeDestination = (idx: number) => {
    setDestinations(prev => {
      const next = prev.filter((_, i) => i !== idx);
      return tripDays > 0 ? distributeDaysEvenly(next, tripDays) : next;
    });
  };

  const setDestDays = (idx: number, val: number) => {
    setDestinations(prev => prev.map((d, i) => i === idx ? { ...d, days: Math.max(1, val) } : d));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleProfile = (value: string) => {
    setProfiles(prev =>
      prev.includes(value) ? prev.filter(p => p !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = destinations.find(d => d.valid !== true);
    if (invalid) { setError('Confirme todos os destinos na lista de sugestões.'); return; }
    if (profiles.length === 0) { setError('Selecione ao menos um perfil de viajante.'); return; }
    setError('');
    setIsLoading(true);
    try {
      const { data } = await getSession();
      if (!data?.session) { router.push('/login'); return; }
      const destList = destinations.map(d => ({ city: d.city, country: d.country, country_code: d.country_code, ...(destinations.length > 1 ? { days: d.days } : {}) }));
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/trips/`,
        {
          destination_city: destinations[0].city,
          destinations: destList,
          start_date: formData.start_date,
          end_date: formData.end_date,
          traveler_profile: profiles.join(','),
        },
        { headers: { Authorization: `Bearer ${data.session.access_token}` } }
      );
      router.push(`/trips/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao criar viagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // City order optimization
  useEffect(() => {
    const valid = destinations.filter(d => d.valid && d.lat && d.lon);
    if (valid.length < 3) { setCityOrderSuggestion(null); return; }
    const optimized = nearestNeighborCities(valid);
    const isSame = optimized.every((d, i) => d.city === valid[i].city);
    if (isSame) { setCityOrderSuggestion(null); return; }
    const currentKm = totalRouteKm(valid);
    const optimizedKm = totalRouteKm(optimized);
    const savings = Math.round(currentKm - optimizedKm);
    if (savings > 50) setCityOrderSuggestion({ order: optimized, savings });
    else setCityOrderSuggestion(null);
  }, [destinations.map(d => d.city).join(',')]);

  const seasonalAlerts = getSeasonalAlerts(
    destinations.filter(d => d.valid).map(d => d.city),
    formData.start_date,
    formData.end_date
  );

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-teal-light to-white py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/trips" className="text-brand-teal hover:text-brand-teal-dark font-medium">← Voltar</Link>
          <h1 className="text-3xl font-bold text-brand-black">Nova Viagem</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-8 space-y-6">

          {/* Destinos */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-gray-700 font-semibold">🌍 Destinos</label>
              {destinations.length < 5 && (
                <button type="button" onClick={addDestination}
                  className="text-sm text-brand-teal hover:text-brand-teal-dark font-medium flex items-center gap-1 border border-brand-teal px-3 py-1 rounded-lg transition">
                  + Adicionar cidade
                </button>
              )}
            </div>

            <div className="space-y-3">
              {destinations.map((dest, idx) => (
                <div key={idx} className="relative" ref={el => { dropdownRefs.current[idx] = el; }}>
                  <div className="flex items-center gap-2">
                    {destinations.length > 1 && (
                      <span className="flex-shrink-0 w-6 h-6 bg-brand-teal text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                    )}
                    <div className="relative flex-1">
                      <div className="relative">
                        {dest.valid && dest.country_code && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 select-none">
                            <FlagImg code={dest.country_code} size="md" />
                          </span>
                        )}
                        <input
                          type="text"
                          value={dest.query}
                          onChange={e => handleCityInput(idx, e.target.value)}
                          onFocus={() => dest.suggestions.length > 0 && setDestinations(prev => prev.map((d, i) => i === idx ? { ...d, showSuggestions: true } : d))}
                          className={`w-full py-3 border-2 rounded-lg focus:outline-none transition pr-10 ${dest.valid && dest.country_code ? 'pl-10' : 'pl-4'} ${
                            dest.valid === true ? 'border-brand-teal bg-brand-teal-light'
                            : dest.valid === false ? 'border-red-400 bg-red-50'
                            : 'border-gray-300 focus:border-brand-teal'
                          }`}
                          placeholder={idx === 0 ? 'Ex: Paris, Tóquio...' : 'Próxima cidade...'}
                          autoComplete="off"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {dest.isSearching
                            ? <span className="inline-block w-4 h-4 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
                            : dest.valid === true ? <span className="text-brand-teal font-bold">✓</span>
                            : dest.valid === false ? <span className="text-red-500">✗</span>
                            : null}
                        </div>
                      </div>

                      {dest.showSuggestions && dest.suggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                          {dest.suggestions.map((city, si) => {
                            const name = city.address?.city || city.address?.town || city.address?.village || city.display_name.split(',')[0];
                            const country = city.address?.country || '';
                            const cc = city.address?.country_code || '';
                            return (
                              <button key={si} type="button"
                                onMouseDown={() => handleSelectCity(idx, city)}
                                className="w-full px-4 py-3 text-left hover:bg-brand-teal-light flex items-center gap-3 border-b border-gray-100 last:border-0 transition">
                                <FlagImg code={cc} size="lg" />
                                <div>
                                  <p className="font-semibold text-gray-900">{name}</p>
                                  <p className="text-sm text-gray-500">{country}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {idx > 0 && (
                      <button type="button" onClick={() => removeDestination(idx)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-500 transition text-xl leading-none">×</button>
                    )}
                  </div>
                  {dest.valid === true && dest.country && (
                    <p className="text-brand-teal text-xs mt-1 ml-8 font-medium flex items-center gap-1">
                      ✓ <FlagImg code={dest.country_code} size="sm" /> {dest.city}, {dest.country}
                    </p>
                  )}
                  {dest.countryDetected && (
                    <div className="mt-2 ml-8 bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <p className="font-semibold text-amber-800 text-sm flex items-center gap-1.5">
                        🌍 <span>&#34;{dest.countryDetected.name}&#34; é um país, não uma cidade.</span>
                      </p>
                      <p className="text-amber-700 text-xs mt-1">
                        {tripDays > 0
                          ? `Para ${tripDays} dia${tripDays > 1 ? 's' : ''}, adicione as cidades que deseja visitar:`
                          : 'Adicione as cidades que deseja visitar:'}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(COUNTRY_TOP_CITIES[dest.countryDetected.code] || []).map(city => (
                          <button key={city} type="button"
                            onClick={() => quickAddCity(idx, city)}
                            className="text-xs bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 px-2.5 py-1.5 rounded-full font-medium transition">
                            + {city}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {dest.query.length >= 2 && !dest.isSearching && dest.suggestions.length === 0 && dest.valid === null && !dest.countryDetected && (
                    <p className="text-amber-600 text-xs mt-1 ml-8">⚠ Nenhuma cidade encontrada</p>
                  )}
                </div>
              ))}
            </div>

            {/* Long-trip nudge: single destination with many days */}
            {tripDays >= 8 && destinations.length === 1 && destinations[0].valid === true && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 text-lg">🗺️</span>
                <div className="flex-1">
                  <p className="font-semibold text-blue-800">Viagem longa — que tal visitar mais cidades?</p>
                  <p className="text-blue-700 text-xs mt-0.5">
                    {tripDays} dias em uma única cidade pode ser muito. O ideal é {Math.ceil(tripDays / 5)}–{Math.ceil(tripDays / 4)} cidades com 4–6 dias cada.
                  </p>
                  {destinations.length < 5 && (
                    <button type="button" onClick={addDestination}
                      className="mt-2 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 font-semibold transition">
                      + Adicionar cidade
                    </button>
                  )}
                </div>
              </div>
            )}

            {cityOrderSuggestion && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🗺️</span>
                <div className="flex-1">
                  <p className="font-semibold text-amber-800 text-sm">Rota otimizada disponível</p>
                  <p className="text-amber-700 text-sm mt-0.5">
                    {cityOrderSuggestion.order.map(d => d.city).join(' → ')}
                    <span className="font-bold"> (economiza ~{cityOrderSuggestion.savings}km)</span>
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button type="button" onClick={() => {
                      const optimized = cityOrderSuggestion.order.map(d => {
                        const orig = destinations.find(o => o.city === d.city);
                        return orig ? { ...d, days: orig.days } : d;
                      });
                      const rest = destinations.filter(d => !d.valid || !d.lat);
                      setDestinations(tripDays > 0 ? distributeDaysEvenly([...optimized, ...rest], tripDays) : [...optimized, ...rest]);
                      setCityOrderSuggestion(null);
                    }} className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-full hover:bg-amber-700 font-semibold transition">
                      ✓ Aplicar
                    </button>
                    <button type="button" onClick={() => setCityOrderSuggestion(null)} className="text-xs text-amber-600 hover:text-amber-800 px-2 py-1">
                      Manter original
                    </button>
                  </div>
                </div>
              </div>
            )}

            {destinations.length > 1 && tripDays > 0 && (
              <div className="mt-3 bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Dias por cidade</p>
                {destinations.map((dest, idx) => (
                  dest.valid ? (
                    <div key={idx} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-700 flex items-center gap-1 flex-1 min-w-0 truncate">
                        {dest.country_code && <FlagImg code={dest.country_code} size="sm" />} {dest.city}
                      </span>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setDestDays(idx, dest.days - 1)} className="w-7 h-7 rounded-full bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center font-bold">−</button>
                        <span className="w-8 text-center font-semibold text-gray-900 text-sm">{dest.days}</span>
                        <button type="button" onClick={() => setDestDays(idx, dest.days + 1)} className="w-7 h-7 rounded-full bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center font-bold">+</button>
                      </div>
                    </div>
                  ) : null
                ))}
                <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                  <span className="text-xs text-gray-500">Total</span>
                  <span className={`text-xs font-semibold ${destinations.reduce((s, d) => s + d.days, 0) === tripDays ? 'text-green-600' : 'text-red-500'}`}>
                    {destinations.reduce((s, d) => s + d.days, 0)} / {tripDays} dias
                  </span>
                </div>
              </div>
            )}
          </div>

          {seasonalAlerts.length > 0 && (
            <div className="space-y-2">
              {seasonalAlerts.map((a, i) => (
                <div key={i} className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm ${
                  a.level === 'warn' ? 'bg-orange-50 border border-orange-200 text-orange-800' : 'bg-blue-50 border border-blue-200 text-blue-800'
                }`}>
                  <span className="flex-shrink-0">{a.level === 'warn' ? '⚠️' : 'ℹ️'}</span>
                  <span>{a.msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* Datas */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">📅 Data de Início</label>
              <input type="date" name="start_date" value={formData.start_date}
                onChange={handleInputChange} min={today}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-brand-teal transition" required />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">📅 Data de Retorno</label>
              <input type="date" name="end_date" value={formData.end_date}
                onChange={handleInputChange} min={formData.start_date || today}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-brand-teal transition" required />
            </div>
          </div>

          {/* Perfil */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">🎯 Perfil do Viajante</label>
            <p className="text-sm text-gray-500 mb-3">Selecione um ou mais perfis</p>
            <div className="grid grid-cols-2 gap-3">
              {TRAVELER_PROFILES.map(profile => {
                const selected = profiles.includes(profile.value);
                return (
                  <button key={profile.value} type="button"
                    onClick={() => toggleProfile(profile.value)}
                    className={`relative p-4 rounded-xl border-2 text-left transition ${
                      selected
                        ? 'border-brand-teal bg-brand-teal-light shadow-md'
                        : 'border-gray-200 hover:border-brand-teal hover:bg-gray-50'
                    }`}>
                    {selected && (
                      <span className="absolute top-2 right-2 text-brand-teal font-bold">✓</span>
                    )}
                    <div className="font-semibold text-gray-900">{profile.label}</div>
                    <div className="text-sm text-gray-500 mt-1">{profile.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full bg-brand-orange text-white py-4 rounded-xl hover:bg-brand-orange-dark font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition">
            {isLoading ? 'Criando viagem...' : `✈️ Criar Viagem ${destinations.length > 1 ? `(${destinations.length} destinos)` : ''}`}
          </button>
        </form>
      </div>
    </div>
  );
}
