'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/supabase';
import Link from 'next/link';
import axios from 'axios';

const TRAVELER_PROFILES = [
  { value: 'adventure', label: '🏔️ Aventura', description: 'Trilhas, natureza, atividades ao ar livre' },
  { value: 'cultural', label: '🏛️ Cultural', description: 'Museus, galerias, sítios históricos' },
  { value: 'gastronomic', label: '🍽️ Gastronômico', description: 'Restaurantes, cafés, mercados' },
  { value: 'relax', label: '🏖️ Relaxamento', description: 'Praias, spas, parques' },
  { value: 'family', label: '👨‍👩‍👧‍👦 Família', description: 'Atrações para crianças, entretenimento' },
];

interface CityOption {
  display_name: string;
  address?: { country?: string; city?: string; town?: string; village?: string };
}

export default function NewTripPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    destination_city: '',
    start_date: '',
    end_date: '',
    traveler_profile: 'cultural',
  });
  const [cityQuery, setCityQuery] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<CityOption[]>([]);
  const [cityValid, setCityValid] = useState<boolean | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCities = async (query: string) => {
    if (query.length < 2) {
      setCitySuggestions([]);
      setCityValid(null);
      return;
    }
    setIsSearching(true);
    try {
      const res = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: query, format: 'json', limit: 5, featuretype: 'city', addressdetails: 1 },
        headers: { 'Accept-Language': 'pt-BR' },
        timeout: 5000,
      });
      setCitySuggestions(res.data);
      setShowSuggestions(res.data.length > 0);
      if (res.data.length === 0) setCityValid(false);
    } catch {
      // ignorar silenciosamente
    } finally {
      setIsSearching(false);
    }
  };

  const handleCityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCityQuery(val);
    setCityValid(null);
    setFormData(prev => ({ ...prev, destination_city: val }));
    clearTimeout(debounceRef.current);
    if (val.length >= 2) {
      debounceRef.current = setTimeout(() => searchCities(val), 400);
    } else {
      setCitySuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectCity = (city: CityOption) => {
    const name = city.address?.city || city.address?.town || city.address?.village || city.display_name.split(',')[0];
    setCityQuery(name);
    setFormData(prev => ({ ...prev, destination_city: name }));
    setCityValid(true);
    setShowSuggestions(false);
    setCitySuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSelect = (profile: string) => {
    setFormData(prev => ({ ...prev, traveler_profile: profile }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cityValid !== true) {
      setError('Selecione um destino válido da lista de sugestões.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const { data } = await getSession();
      if (!data?.session) { router.push('/login'); return; }
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/trips/`,
        formData,
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-8 space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">🌍 Destino</label>
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <input
                  type="text"
                  value={cityQuery}
                  onChange={handleCityInput}
                  onFocus={() => citySuggestions.length > 0 && setShowSuggestions(true)}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition pr-10 ${
                    cityValid === true
                      ? 'border-brand-teal bg-brand-teal-light'
                      : cityValid === false
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-300 focus:border-brand-teal'
                  }`}
                  placeholder="Ex: Paris, Tóquio, Buenos Aires..."
                  autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isSearching ? (
                    <span className="inline-block w-5 h-5 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
                  ) : cityValid === true ? (
                    <span className="text-brand-teal text-xl font-bold">✓</span>
                  ) : cityValid === false ? (
                    <span className="text-red-500 text-xl">✗</span>
                  ) : null}
                </div>
              </div>

              {showSuggestions && citySuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                  {citySuggestions.map((city, i) => {
                    const name = city.address?.city || city.address?.town || city.address?.village || city.display_name.split(',')[0];
                    const country = city.address?.country || '';
                    return (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => handleSelectCity(city)}
                        className="w-full px-4 py-3 text-left hover:bg-brand-teal-light flex items-center gap-3 border-b border-gray-100 last:border-0 transition"
                      >
                        <span className="text-xl">📍</span>
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
            {cityValid === true && (
              <p className="text-brand-teal text-sm mt-1 font-medium">✓ Destino confirmado</p>
            )}
            {cityQuery.length >= 2 && !isSearching && citySuggestions.length === 0 && cityValid === null && (
              <p className="text-amber-600 text-sm mt-1">⚠ Nenhuma cidade encontrada. Verifique a grafia.</p>
            )}
            {cityValid === false && (
              <p className="text-red-500 text-sm mt-1">Cidade não encontrada. Tente outro nome.</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">📅 Data de Início</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                min={today}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-brand-teal transition"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">📅 Data de Retorno</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                min={formData.start_date || today}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-brand-teal transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-3">🎯 Perfil do Viajante</label>
            <div className="grid grid-cols-2 gap-3">
              {TRAVELER_PROFILES.map(profile => (
                <button
                  key={profile.value}
                  type="button"
                  onClick={() => handleProfileSelect(profile.value)}
                  className={`p-4 rounded-xl border-2 text-left transition ${
                    formData.traveler_profile === profile.value
                      ? 'border-brand-teal bg-brand-teal-light shadow-md'
                      : 'border-gray-200 hover:border-brand-teal hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{profile.label}</div>
                  <div className="text-sm text-gray-500 mt-1">{profile.description}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-orange text-white py-4 rounded-xl hover:bg-brand-orange-dark font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Criando viagem...' : '✈️ Criar Viagem'}
          </button>
        </form>
      </div>
    </div>
  );
}
