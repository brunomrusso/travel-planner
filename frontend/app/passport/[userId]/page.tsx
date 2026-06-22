'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Plus, Share2, X } from 'lucide-react';
import FlagImg from '@/components/FlagImg';

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

const ROTATIONS = [-4, 2, -2, 3, -3, 1, -1, 4];

const CONTINENT: Record<string, string> = {
  dz:'África',ao:'África',bj:'África',bw:'África',bf:'África',bi:'África',cm:'África',
  cv:'África',cf:'África',td:'África',km:'África',cd:'África',cg:'África',ci:'África',
  dj:'África',eg:'África',gq:'África',er:'África',et:'África',ga:'África',gm:'África',
  gh:'África',gn:'África',gw:'África',ke:'África',ls:'África',lr:'África',ly:'África',
  mg:'África',mw:'África',ml:'África',mr:'África',mu:'África',ma:'África',mz:'África',
  na:'África',ne:'África',ng:'África',rw:'África',st:'África',sn:'África',sl:'África',
  so:'África',za:'África',ss:'África',sd:'África',sz:'África',tz:'África',tg:'África',
  tn:'África',ug:'África',zm:'África',zw:'África',sc:'África',
  ag:'Américas',ar:'Américas',bs:'Américas',bb:'Américas',bz:'Américas',bo:'Américas',
  br:'Américas',ca:'Américas',cl:'Américas',co:'Américas',cr:'Américas',cu:'Américas',
  dm:'Américas',do:'Américas',ec:'Américas',sv:'Américas',gd:'Américas',gt:'Américas',
  gy:'Américas',ht:'Américas',hn:'Américas',jm:'Américas',mx:'Américas',ni:'Américas',
  pa:'Américas',py:'Américas',pe:'Américas',kn:'Américas',lc:'Américas',vc:'Américas',
  sr:'Américas',tt:'Américas',us:'Américas',uy:'Américas',ve:'Américas',
  af:'Ásia',am:'Ásia',az:'Ásia',bh:'Ásia',bd:'Ásia',bt:'Ásia',bn:'Ásia',kh:'Ásia',
  cn:'Ásia',cy:'Ásia',ge:'Ásia',in:'Ásia',id:'Ásia',ir:'Ásia',iq:'Ásia',il:'Ásia',
  jp:'Ásia',jo:'Ásia',kz:'Ásia',kw:'Ásia',kg:'Ásia',la:'Ásia',lb:'Ásia',my:'Ásia',
  mv:'Ásia',mn:'Ásia',mm:'Ásia',np:'Ásia',kp:'Ásia',om:'Ásia',pk:'Ásia',ph:'Ásia',
  qa:'Ásia',sa:'Ásia',sg:'Ásia',kr:'Ásia',lk:'Ásia',sy:'Ásia',tj:'Ásia',th:'Ásia',
  tl:'Ásia',tr:'Ásia',tm:'Ásia',ae:'Ásia',uz:'Ásia',vn:'Ásia',ye:'Ásia',
  al:'Europa',ad:'Europa',at:'Europa',by:'Europa',be:'Europa',ba:'Europa',bg:'Europa',
  hr:'Europa',cz:'Europa',dk:'Europa',ee:'Europa',fi:'Europa',fr:'Europa',de:'Europa',
  gr:'Europa',hu:'Europa',is:'Europa',ie:'Europa',it:'Europa',lv:'Europa',li:'Europa',
  lt:'Europa',lu:'Europa',mk:'Europa',mt:'Europa',md:'Europa',mc:'Europa',me:'Europa',
  nl:'Europa',no:'Europa',pl:'Europa',pt:'Europa',ro:'Europa',ru:'Europa',sm:'Europa',
  rs:'Europa',sk:'Europa',si:'Europa',es:'Europa',se:'Europa',ch:'Europa',ua:'Europa',gb:'Europa',
  au:'Oceania',fj:'Oceania',ki:'Oceania',mh:'Oceania',nr:'Oceania',nz:'Oceania',
  pw:'Oceania',pg:'Oceania',ws:'Oceania',sb:'Oceania',to:'Oceania',tv:'Oceania',vu:'Oceania',
};

const CONT_STYLE: Record<string, string> = {
  'África':   'bg-amber-50 border-amber-200 text-amber-800',
  'Américas': 'bg-green-50 border-green-200 text-green-800',
  'Ásia':     'bg-red-50 border-red-200 text-red-800',
  'Europa':   'bg-blue-50 border-blue-200 text-blue-800',
  'Oceania':  'bg-purple-50 border-purple-200 text-purple-800',
};

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
  const [selectedVisits, setSelectedVisits] = useState<Country[] | null>(null);
  const [view, setView] = useState<'stamps' | 'timeline'>('stamps');

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

  const nextTitle = TRAVELER_TITLES.find(t => t.min > data.stats.countries);
  const progressPct = nextTitle
    ? Math.round(((data.stats.countries - title.min) / (nextTitle.min - title.min)) * 100)
    : 100;
  const worldPct = Math.round((data.stats.countries / 195) * 100);

  const continentMap: Record<string, Country[]> = {};
  sortedCountries.forEach(c => {
    const cont = CONTINENT[c.country_code.toLowerCase()] || 'Outros';
    if (!continentMap[cont]) continentMap[cont] = [];
    continentMap[cont].push(c);
  });
  const continentEntries = Object.entries(continentMap).sort((a, b) => b[1].length - a[1].length);

  const yearGroups: Record<string, Country[]> = {};
  sortedCountries.forEach(c => {
    const key = c.year ? String(c.year) : 'sem-data';
    if (!yearGroups[key]) yearGroups[key] = [];
    yearGroups[key].push(c);
  });
  const timelineYears = [
    ...Object.keys(yearGroups).filter(k => k !== 'sem-data').sort((a, b) => Number(a) - Number(b)),
    ...(yearGroups['sem-data'] ? ['sem-data'] : []),
  ];

  // Deduplicated countries for stamps (one stamp per country, badge if visited multiple times)
  const countryVisitMap: Record<string, Country[]> = {};
  sortedCountries.forEach(c => {
    const key = c.country_code.toLowerCase();
    if (!countryVisitMap[key]) countryVisitMap[key] = [];
    countryVisitMap[key].push(c);
  });
  const stampCountries = Object.values(countryVisitMap).map(visits => ({
    ...visits[visits.length - 1],
    visitCount: visits.length,
    allVisits: visits,
  }));

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

          {/* Progress to next title */}
          <div className="mt-5 px-1">
            <div className="flex justify-between text-xs text-teal-300 mb-1.5">
              <span>{title.icon} {title.label}</span>
              {nextTitle
                ? <span>{nextTitle.icon} {nextTitle.label} em {nextTitle.min - data.stats.countries} pa{nextTitle.min - data.stats.countries === 1 ? 'ís' : 'íses'}</span>
                : <span>🏆 Nível máximo!</span>}
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-teal-300 rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <p className="text-teal-400/80 text-xs mt-3">{data.stats.countries} de 195 países visitados ({worldPct}% do mundo)</p>
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

      {/* Continent breakdown */}
      {continentEntries.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 pb-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Por Continente</p>
            <div className="flex flex-wrap gap-2">
              {continentEntries.map(([cont, countries]) => (
                <div key={cont} className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${CONT_STYLE[cont] || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  <FlagImg code={countries[0].country_code} size="sm" />
                  <span className="text-sm font-semibold">{cont}</span>
                  <span className="text-xs font-bold bg-white/60 rounded-full px-1.5 py-0.5">{countries.length}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stamps / Timeline */}
      <div className="max-w-3xl mx-auto px-4 pb-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* Header com tabs */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setView('stamps')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  view === 'stamps' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Carimbos
              </button>
              <button
                onClick={() => setView('timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  view === 'timeline' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Linha do Tempo
              </button>
            </div>
            <Link href="/profile" className="flex items-center gap-1 text-xs text-brand-teal hover:underline font-medium">
              <Plus size={12} /> Adicionar país
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
          ) : view === 'stamps' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
              {stampCountries.map((sc, i) => (
                <button
                  key={sc.country_code + i}
                  onClick={() => setSelectedVisits(sc.allVisits)}
                  style={{ transform: `rotate(${ROTATIONS[i % ROTATIONS.length]}deg)` }}
                  className="relative border-2 border-dashed border-teal-400 rounded-xl p-2 sm:p-3 flex flex-col items-center bg-teal-50/60 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  {sc.visitCount > 1 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-teal-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center z-10">
                      {sc.visitCount}
                    </span>
                  )}
                  <FlagImg code={sc.country_code} size="xl" className="rounded shadow-sm" />
                  <div className="w-full border-t border-dashed border-teal-300 my-2" />
                  <p className="text-teal-900 text-xs font-bold text-center leading-tight">{sc.country || sc.country_code.toUpperCase()}</p>
                  {sc.city && <p className="text-teal-600/70 text-xs truncate w-full text-center mt-0.5">{sc.city}</p>}
                  {sc.year && <p className="text-teal-500 text-xs font-semibold mt-0.5">{sc.year}</p>}
                </button>
              ))}
            </div>
          ) : (
            /* Timeline view */
            <div className="relative pl-8">
              {/* Vertical line */}
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-teal-400 via-teal-300 to-gray-200 rounded-full" />

              {timelineYears.map((yearKey, yi) => (
                <div key={yearKey} className="relative mb-8 last:mb-0">
                  {/* Year badge */}
                  <div className="absolute -left-8 flex items-center justify-center">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      yearKey === 'sem-data'
                        ? 'bg-gray-100 border-gray-300'
                        : 'bg-teal-500 border-teal-300'
                    }`}>
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  </div>

                  {/* Year label */}
                  <div className="mb-3 ml-1">
                    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                      yearKey === 'sem-data'
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-teal-100 text-teal-800'
                    }`}>
                      {yearKey === 'sem-data' ? 'Sem data registrada' : yearKey}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      {yearGroups[yearKey].length} pa{yearGroups[yearKey].length === 1 ? 'ís' : 'íses'}
                    </span>
                  </div>

                  {/* Country cards for this year */}
                  <div className="flex flex-col gap-2">
                    {yearGroups[yearKey].map((c, ci) => (
                      <button
                        key={c.country_code + ci}
                        onClick={() => setSelectedVisits([c])}
                        className="flex items-center gap-3 bg-gray-50 hover:bg-teal-50 border border-gray-100 hover:border-teal-200 rounded-xl px-4 py-3 text-left transition-all group"
                      >
                        <FlagImg code={c.country_code} size="lg" className="rounded flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm group-hover:text-teal-800 transition">
                            {c.country || c.country_code.toUpperCase()}
                          </p>
                          {c.city && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{c.city}</p>
                          )}
                        </div>
                        {CONTINENT[c.country_code.toLowerCase()] && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 hidden sm:block ${
                            CONT_STYLE[CONTINENT[c.country_code.toLowerCase()]] || 'bg-gray-50 border-gray-200 text-gray-600'
                          }`}>
                            {CONTINENT[c.country_code.toLowerCase()]}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
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

      {/* Country detail sheet */}
      {selectedVisits && selectedVisits.length > 0 && (() => {
        const first = selectedVisits[0];
        const multi = selectedVisits.length > 1;
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedVisits(null)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
              className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 z-10"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setSelectedVisits(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition">
                <X size={16} />
              </button>

              <div className="flex items-center gap-4 mb-5">
                <FlagImg code={first.country_code} size="xl" className="rounded-lg shadow-sm flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">{first.country || first.country_code.toUpperCase()}</h3>
                  {multi ? (
                    <span className="inline-block mt-1 text-xs font-semibold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                      {selectedVisits.length} visitas
                    </span>
                  ) : first.city ? (
                    <p className="text-gray-500 text-sm mt-0.5">{first.city}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                {multi ? (
                  // Multiple visits: list each
                  selectedVisits.map((v, i) => (
                    <div key={i} className="flex items-center bg-teal-50 rounded-xl px-4 py-2.5 gap-2">
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-teal-500 text-white text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        {v.year && <span className="font-bold text-teal-900 text-sm">{v.year}</span>}
                        {v.city && <span className="text-teal-600/70 text-xs ml-1.5">· {v.city}</span>}
                        {!v.year && !v.city && <span className="text-teal-600 text-sm">Visita {i + 1}</span>}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{v.source === 'manual' ? 'manual' : 'viagem'}</span>
                    </div>
                  ))
                ) : (
                  // Single visit
                  <>
                    {first.year && (
                      <div className="flex items-center bg-teal-50 rounded-xl px-4 py-2.5">
                        <span className="text-teal-700 text-sm font-medium">Ano da visita</span>
                        <span className="ml-auto font-bold text-teal-900">{first.year}</span>
                      </div>
                    )}
                    {CONTINENT[first.country_code.toLowerCase()] && (
                      <div className={`flex items-center rounded-xl px-4 py-2.5 border ${CONT_STYLE[CONTINENT[first.country_code.toLowerCase()]] || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                        <span className="text-sm font-medium">Continente</span>
                        <span className="ml-auto font-semibold text-sm">{CONTINENT[first.country_code.toLowerCase()]}</span>
                      </div>
                    )}
                    <div className="flex items-center bg-gray-50 rounded-xl px-4 py-2.5">
                      <span className="text-gray-600 text-sm font-medium">Origem</span>
                      <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                        {first.source === 'manual' ? 'Adicionado manualmente' : 'Viagem registrada'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
