'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/supabase';
import Link from 'next/link';
import axios from 'axios';
import { ArrowLeft, BookMarked, Plus, X } from 'lucide-react';

const TRAVELER_PROFILES = [
  { value: 'adventure', label: '🏔️ Aventura', description: 'Trilhas, natureza, ar livre' },
  { value: 'cultural', label: '🏛️ Cultural', description: 'Museus, história, galerias' },
  { value: 'gastronomic', label: '🍽️ Gastronômico', description: 'Restaurantes, cafés, mercados' },
  { value: 'relax', label: '🏖️ Relaxamento', description: 'Praias, spas, parques' },
  { value: 'family', label: '👨‍👩‍👧‍👦 Família', description: 'Crianças, entretenimento' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [defaultProfile, setDefaultProfile] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [passport, setPassport] = useState<{ countries: { country: string; country_code: string; year?: number; source?: string }[]; stats: { countries: number; continents: number; trips: number } } | null>(null);
  const [addCountryModal, setAddCountryModal] = useState(false);
  const [newCountry, setNewCountry] = useState({ country: '', country_code: '', year: '' });

  useEffect(() => {
    const load = async () => {
      const { data } = await getSession();
      if (!data?.session) { router.push('/login'); return; }
      const t = data.session.access_token;
      setToken(t);
      setUserId(data.session.user.id);
      try {
        const [prefsRes, passportRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me/preferences`, { headers: { Authorization: `Bearer ${t}` } }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me/passport`, { headers: { Authorization: `Bearer ${t}` } }),
        ]);
        setEmail(prefsRes.data.email || '');
        setDisplayName(prefsRes.data.display_name || '');
        setDefaultProfile(prefsRes.data.default_profile || '');
        setPassport(passportRes.data);
      } catch {}
      setIsLoading(false);
    };
    load();
  }, [router]);

  const handleRemoveCountry = async (code: string) => {
    await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/users/me/passport/countries/${code}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setPassport(prev => prev ? { ...prev, countries: prev.countries.filter(c => c.country_code !== code), stats: { ...prev.stats, countries: prev.stats.countries - 1 } } : prev);
  };

  const handleAddCountry = async () => {
    if (!newCountry.country || !newCountry.country_code) return;
    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/me/passport/countries`,
      { country: newCountry.country, country_code: newCountry.country_code.toLowerCase(), year: newCountry.year ? parseInt(newCountry.year) : null },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me/passport`, { headers: { Authorization: `Bearer ${token}` } });
    setPassport(res.data);
    setAddCountryModal(false);
    setNewCountry({ country: '', country_code: '', year: '' });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/me/preferences`,
        { display_name: displayName, default_profile: defaultProfile },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-teal-light to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-teal-light to-white">
      <nav className="bg-white shadow-md border-b-4 border-brand-teal print:hidden">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/trips" className="flex items-center gap-1.5 text-gray-400 hover:text-brand-teal transition">
            <ArrowLeft size={18} />
            <span className="text-sm">Voltar</span>
          </Link>
          <h1 className="text-xl font-bold text-brand-teal flex items-center gap-2">
            <img src="/icons/icon.svg" alt="" className="w-7 h-7 rounded-lg" />
            Roteiria
          </h1>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-brand-teal-light flex items-center justify-center text-3xl">
              🧳
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Meu Perfil</h2>
              <p className="text-sm text-gray-500">{email}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Como quer ser chamado?
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Seu nome"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Seu estilo de viagem padrão
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TRAVELER_PROFILES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setDefaultProfile(p.value)}
                    className={`text-left px-4 py-3 rounded-xl border-2 transition ${
                      defaultProfile === p.value
                        ? 'border-brand-teal bg-brand-teal-light'
                        : 'border-gray-200 hover:border-brand-teal/40'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 text-sm">{p.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
                  </button>
                ))}
              </div>
              {defaultProfile && (
                <p className="mt-2 text-xs text-gray-400">
                  Este perfil será pré-selecionado ao criar uma nova viagem.
                </p>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-brand-teal text-white font-semibold py-3 rounded-xl hover:bg-brand-teal-dark transition disabled:opacity-60"
            >
              {isSaving ? 'Salvando...' : saved ? '✅ Salvo!' : 'Salvar preferências'}
            </button>
          </div>
        </div>
        {/* Passport section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">🛂 Passaporte</h2>
              {passport && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {passport.stats.countries} {passport.stats.countries === 1 ? 'país' : 'países'} &bull; {passport.stats.continents} {passport.stats.continents === 1 ? 'continente' : 'continentes'} &bull; {passport.stats.trips} viagens concluídas
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {userId && (
                <a href={`/passport/${userId}`} target="_blank" rel="noreferrer"
                  className="text-xs bg-brand-teal-light text-brand-teal font-semibold px-3 py-1.5 rounded-full hover:bg-teal-100 transition">
                  Ver passaporte
                </a>
              )}
              <button onClick={() => setAddCountryModal(true)}
                className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 font-semibold px-3 py-1.5 rounded-full hover:bg-gray-200 transition">
                <Plus size={13} /> Adicionar país
              </button>
            </div>
          </div>

          {passport && passport.countries.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {passport.countries.map((c, i) => (
                <div key={c.country_code + i} className="flex items-center gap-1.5 bg-teal-50 border border-teal-100 rounded-full px-3 py-1">
                  <span className="text-base">{Array.from(c.country_code.toUpperCase()).map(ch => String.fromCodePoint(0x1F1E6 + ch.charCodeAt(0) - 65)).join('')}</span>
                  <span className="text-xs font-medium text-teal-900">{c.country || c.country_code.toUpperCase()}</span>
                  {c.year && <span className="text-xs text-teal-500">{c.year}</span>}
                  {c.source === 'manual' && (
                    <button onClick={() => handleRemoveCountry(c.country_code)} className="text-red-400 hover:text-red-600 ml-0.5" title="Remover">
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Nenhum país registrado. Conclua uma viagem ou adicione manualmente.</p>
          )}
        </div>
      </main>

      {/* Add country modal */}
      {addCountryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setAddCountryModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-4">Adicionar país visitado</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Nome do país (ex: França)" value={newCountry.country}
                onChange={e => setNewCountry(p => ({ ...p, country: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal" />
              <input type="text" placeholder="Código (ex: fr, us, br)" value={newCountry.country_code}
                onChange={e => setNewCountry(p => ({ ...p, country_code: e.target.value }))}
                maxLength={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal" />
              <input type="number" placeholder="Ano (opcional)" value={newCountry.year}
                onChange={e => setNewCountry(p => ({ ...p, year: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setAddCountryModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm">Cancelar</button>
              <button onClick={handleAddCountry} className="flex-1 py-2.5 bg-brand-teal text-white rounded-xl font-semibold hover:bg-brand-teal-dark text-sm">Adicionar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
