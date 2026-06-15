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
}

const emptyDest = (): DestEntry => ({
  city: '', country: '', country_code: '', query: '',
  valid: null, suggestions: [], showSuggestions: false, isSearching: false,
});


export default function NewTripPage() {
  const router = useRouter();
  const [destinations, setDestinations] = useState<DestEntry[]>([emptyDest()]);
  const [formData, setFormData] = useState({ start_date: '', end_date: '', traveler_profile: 'cultural' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

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
        params: { q: query, format: 'json', limit: 5, featuretype: 'city', addressdetails: 1 },
        headers: { 'Accept-Language': 'pt-BR' },
        timeout: 5000,
      });
      setDestinations(prev => prev.map((d, i) => i === idx
        ? { ...d, suggestions: res.data, showSuggestions: res.data.length > 0, valid: res.data.length === 0 ? false : null, isSearching: false }
        : d
      ));
    } catch {
      setDestinations(prev => prev.map((d, i) => i === idx ? { ...d, isSearching: false } : d));
    }
  };

  const handleCityInput = (idx: number, val: string) => {
    setDestinations(prev => prev.map((d, i) => i === idx ? { ...d, query: val, city: val, valid: null } : d));
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
    setDestinations(prev => prev.map((d, i) => i === idx
      ? { ...d, city: name, country, country_code, query: name, valid: true, suggestions: [], showSuggestions: false }
      : d
    ));
  };

  const addDestination = () => setDestinations(prev => [...prev, emptyDest()]);
  const removeDestination = (idx: number) => setDestinations(prev => prev.filter((_, i) => i !== idx));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = destinations.find(d => d.valid !== true);
    if (invalid) { setError('Confirme todos os destinos na lista de sugestões.'); return; }
    setError('');
    setIsLoading(true);
    try {
      const { data } = await getSession();
      if (!data?.session) { router.push('/login'); return; }
      const destList = destinations.map(d => ({ city: d.city, country: d.country, country_code: d.country_code }));
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/trips/`,
        {
          destination_city: destinations[0].city,
          destinations: destList,
          start_date: formData.start_date,
          end_date: formData.end_date,
          traveler_profile: formData.traveler_profile,
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
                  {dest.query.length >= 2 && !dest.isSearching && dest.suggestions.length === 0 && dest.valid === null && (
                    <p className="text-amber-600 text-xs mt-1 ml-8">⚠ Nenhuma cidade encontrada</p>
                  )}
                </div>
              ))}
            </div>

            {destinations.length > 1 && (
              <p className="text-xs text-gray-400 mt-2">Os dias serão divididos igualmente entre as cidades.</p>
            )}
          </div>

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
            <label className="block text-gray-700 font-semibold mb-3">🎯 Perfil do Viajante</label>
            <div className="grid grid-cols-2 gap-3">
              {TRAVELER_PROFILES.map(profile => (
                <button key={profile.value} type="button"
                  onClick={() => setFormData(prev => ({ ...prev, traveler_profile: profile.value }))}
                  className={`p-4 rounded-xl border-2 text-left transition ${
                    formData.traveler_profile === profile.value
                      ? 'border-brand-teal bg-brand-teal-light shadow-md'
                      : 'border-gray-200 hover:border-brand-teal hover:bg-gray-50'
                  }`}>
                  <div className="font-semibold text-gray-900">{profile.label}</div>
                  <div className="text-sm text-gray-500 mt-1">{profile.description}</div>
                </button>
              ))}
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
