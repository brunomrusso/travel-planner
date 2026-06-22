'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Plus, Share2 } from 'lucide-react';

const WorldMap = dynamic(() => import('@/components/WorldMap'), { ssr: false });

const TRAVELER_TITLES = [
  { min: 0,  label: 'Explorador Iniciante', icon: '🌱' },
  { min: 1,  label: 'Viajante',             icon: '🧳' },
  { min: 4,  label: 'Mochileiro',           icon: '🎒' },
  { min: 11, label: 'Viajante Experiente',  icon: '🗺️' },
  { min: 26, label: 'Globetrotter',         icon: '🌍' },
  { min: 51, label: 'Cidadão do Mundo',     icon: '🌐' },
];

function getTravelerTitle(count: number) {
  return [...TRAVELER_TITLES].reverse().find(t => count >= t.min) || TRAVELER_TITLES[0];
}

function getFlag(code: string) {
  return Array.from(code.toUpperCase()).map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('');
}

const ROTATIONS = [-4, 2, -2, 3, -3, 1, -1, 4];

interface Country { country: string; country_code: string; year?: number; city?: string; source?: string; }
interface PassportData {
  display_name: string;
  countries: Country[];
  stats: { countries: number; continents: number; trips: number };
}

export default function PassportPage() {
  const { userId } = useParams<{ userId: string }>();
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/passport`)
      .then(r => { if (!r.ok) { setNotFound(true); setLoading(false); return null; } return r.json(); })
      .then(d => { if (d) { setData(d); setLoading(false); } })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [userId]);

  const share = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal" />
    </div>
  );

  if (notFound || !data) return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">🛂</p>
        <p className="text-xl text-gray-700">Passaporte não encontrado.</p>
        <Link href="/trips" className="mt-4 inline-block text-brand-teal hover:underline">← Voltar</Link>
      </div>
    </div>
  );

  const title = getTravelerTitle(data.stats.countries);
  const sortedCountries = [...data.countries].sort((a, b) => {
    if (!a.year && !b.year) return 0;
    if (!a.year) return 1;
    if (!b.year) return -1;
    return a.year - b.year;
  });
  const visitedCodes = sortedCountries.map(c => c.country_code);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white">
      {/* Navbar */}
      <nav className="bg-white shadow-md border-b-4 border-brand-teal">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/trips" className="flex items-center gap-1.5 text-brand-teal font-semibold hover:text-teal-700 transition">
            <img src="/icons/icon.svg" alt="" className="w-7 h-7 rounded-lg" />
            <ArrowLeft size={16} />
            <span className="hidden sm:inline text-sm">Minhas Viagens</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-1.5 text-sm bg-teal-50 text-brand-teal font-semibold px-4 py-1.5 rounded-full hover:bg-teal-100 transition"
            >
              <Plus size={14} /> Adicionar país
            </Link>
            <button
              onClick={share}
              className="flex items-center gap-1.5 text-sm bg-brand-teal text-white font-semibold px-4 py-1.5 rounded-full hover:bg-teal-700 transition"
            >
              <Share2 size={14} />
              <span>{copied ? 'Copiado!' : 'Compartilhar'}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Passport cover card */}
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-4">
        <div className="bg-gradient-to-br from-teal-700 to-teal-900 rounded-3xl px-8 py-8 shadow-xl text-center">
          <p className="text-teal-300/80 text-xs tracking-[0.3em] uppercase mb-3">Passaporte do Viajante</p>
          <h1 className="text-white text-3xl font-bold mb-1">{data.display_name}</h1>
          <p className="text-teal-200 text-lg font-medium">{title.icon} {title.label}</p>

          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { value: data.stats.countries, label: 'Países' },
              { value: data.stats.continents, label: 'Continentes' },
              { value: data.stats.trips, label: 'Viagens' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-2xl py-4">
                <p className="text-white text-3xl font-bold">{s.value}</p>
                <p className="text-teal-200 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* World map */}
      <div className="max-w-3xl mx-auto px-4 pb-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-5 pt-4 pb-1 flex items-center gap-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Mapa de Viagens</p>
          </div>
          <WorldMap visitedCodes={visitedCodes} />
        </div>
      </div>

      {/* Stamps */}
      <div className="max-w-3xl mx-auto px-4 pb-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Carimbos</p>
            <Link href="/profile" className="flex items-center gap-1 text-xs text-brand-teal hover:underline font-medium">
              <Plus size={12} /> Adicionar país visitado
            </Link>
          </div>
          {sortedCountries.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-5xl mb-3">🌍</p>
              <p className="text-gray-500 mb-4">Nenhuma viagem registrada ainda.</p>
              <Link href="/profile" className="inline-flex items-center gap-1.5 bg-brand-teal text-white font-semibold px-5 py-2 rounded-full text-sm hover:bg-teal-700 transition">
                <Plus size={14} /> Adicionar país visitado
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-5 justify-center py-2">
              {sortedCountries.map((c, i) => (
                <div
                  key={c.country_code + i}
                  style={{ transform: `rotate(${ROTATIONS[i % ROTATIONS.length]}deg)` }}
                  className="w-28 border-2 border-dashed border-teal-400 rounded-xl p-3 flex flex-col items-center bg-teal-50/60 shadow-sm hover:shadow-md transition"
                >
                  <span className="text-5xl leading-none">{getFlag(c.country_code)}</span>
                  <div className="w-full border-t border-dashed border-teal-300 my-2" />
                  <p className="text-teal-900 text-xs font-bold text-center leading-tight">{c.country || c.country_code.toUpperCase()}</p>
                  {c.city && <p className="text-teal-600/70 text-xs truncate w-full text-center mt-0.5">{c.city}</p>}
                  {c.year && <p className="text-teal-500 text-xs font-semibold mt-0.5">{c.year}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="text-center pb-10">
        <Link href="/register" className="text-gray-400 hover:text-brand-teal text-sm transition">
          ✈️ Crie seu passaporte no Roteiria — grátis
        </Link>
      </div>
    </div>
  );
}
