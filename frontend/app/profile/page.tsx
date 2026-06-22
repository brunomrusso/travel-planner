'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/supabase';
import Link from 'next/link';
import axios from 'axios';

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
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [defaultProfile, setDefaultProfile] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await getSession();
      if (!data?.session) { router.push('/login'); return; }
      const t = data.session.access_token;
      setToken(t);
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me/preferences`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        setEmail(res.data.email || '');
        setDisplayName(res.data.display_name || '');
        setDefaultProfile(res.data.default_profile || '');
      } catch {}
      setIsLoading(false);
    };
    load();
  }, [router]);

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
          <Link href="/trips" className="text-gray-400 hover:text-brand-teal transition">
            ← Voltar
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
      </main>
    </div>
  );
}
