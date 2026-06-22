'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

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
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-green-800 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400" />
    </div>
  );

  if (notFound || !data) return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 to-green-800 flex items-center justify-center text-white">
      <div className="text-center">
        <p className="text-4xl mb-4">🛂</p>
        <p className="text-xl">Passaporte não encontrado.</p>
        <Link href="/" className="mt-4 inline-block text-yellow-400 hover:underline">Criar minha conta</Link>
      </div>
    </div>
  );

  const title = getTravelerTitle(data.stats.countries);
  const visitedCodes = data.countries.map(c => c.country_code);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-green-800">
      {/* Passport cover header */}
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-6 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <img src="/icons/icon.svg" alt="Roteiria" className="w-10 h-10 rounded-xl" />
          <span className="text-yellow-400 font-bold text-lg tracking-widest uppercase">Roteiria</span>
        </div>
        <div className="bg-green-800/60 border border-yellow-500/40 rounded-3xl px-8 py-8 shadow-2xl backdrop-blur-sm">
          <p className="text-yellow-400/70 text-xs tracking-[0.3em] uppercase mb-2">Passaporte do Viajante</p>
          <h1 className="text-white text-3xl font-bold mb-1">{data.display_name}</h1>
          <p className="text-yellow-300 text-lg font-medium">{title.icon} {title.label}</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { value: data.stats.countries, label: 'Países' },
              { value: data.stats.continents, label: 'Continentes' },
              { value: data.stats.trips, label: 'Viagens' },
            ].map(s => (
              <div key={s.label} className="bg-green-900/60 rounded-2xl py-4 border border-yellow-500/20">
                <p className="text-yellow-300 text-3xl font-bold">{s.value}</p>
                <p className="text-green-300 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={share}
            className="mt-5 px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-green-950 font-semibold rounded-full text-sm transition"
          >
            {copied ? '✅ Link copiado!' : '🔗 Compartilhar passaporte'}
          </button>
        </div>
      </div>

      {/* World map */}
      <div className="max-w-3xl mx-auto px-4 pb-4">
        <div className="bg-green-800/40 border border-yellow-500/20 rounded-2xl overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <p className="text-yellow-400/80 text-xs tracking-widest uppercase">Mapa de Viagens</p>
          </div>
          <WorldMap visitedCodes={visitedCodes} />
        </div>
      </div>

      {/* Stamps */}
      <div className="max-w-3xl mx-auto px-4 pb-10">
        <div className="bg-green-800/40 border border-yellow-500/20 rounded-2xl p-6">
          <p className="text-yellow-400/80 text-xs tracking-widest uppercase mb-5">Carimbos</p>
          {data.countries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">🌍</p>
              <p className="text-green-300">Nenhuma viagem registrada ainda.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 justify-center">
              {data.countries.map((c, i) => (
                <div
                  key={c.country_code + i}
                  style={{ transform: `rotate(${ROTATIONS[i % ROTATIONS.length]}deg)` }}
                  className="w-24 border-2 border-dashed border-yellow-500/60 rounded-xl p-3 flex flex-col items-center bg-white/5 backdrop-blur-sm shadow-lg"
                >
                  <span className="text-3xl">{getFlag(c.country_code)}</span>
                  <p className="text-yellow-100 text-xs font-bold text-center mt-1 leading-tight">{c.country || c.country_code.toUpperCase()}</p>
                  {c.year && <p className="text-yellow-500/70 text-xs mt-0.5">{c.year}</p>}
                  {c.city && <p className="text-green-300/70 text-xs truncate w-full text-center">{c.city}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="text-center pb-10">
        <Link href="/register" className="text-yellow-400/70 hover:text-yellow-300 text-sm transition">
          ✈️ Criar minha conta no Roteiria
        </Link>
      </div>
    </div>
  );
}
