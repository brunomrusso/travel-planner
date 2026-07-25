'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, signOut } from '@/lib/supabase';
import Link from 'next/link';
import axios from 'axios';
import FlagImg from '@/components/FlagImg';
import CityImage from '@/components/CityImage';
import { User, BookMarked, LogOut, CheckCircle, Trash2, Plane, Clock, Archive, Share2, Calendar, Landmark, Utensils, Waves, Users, Mountain, type LucideIcon } from 'lucide-react';
import CurrencyConverter from '@/components/CurrencyConverter';
import ThemeToggle from '@/components/ThemeToggle';

interface DestinationCity { city: string; country: string; country_code: string; }

const PROFILE_LABELS: Record<string, string> = {
  adventure: 'Aventura', cultural: 'Cultural', gastronomic: 'Gastronômico',
  relax: 'Relaxamento', family: 'Família',
};
const PROFILE_ICONS: Record<string, LucideIcon> = {
  adventure: Mountain, cultural: Landmark, gastronomic: Utensils,
  relax: Waves, family: Users,
};
function ProfileChips({ raw }: { raw: string }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {raw.split(',').map(p => {
        const key = p.trim();
        const Icon = PROFILE_ICONS[key] || User;
        return (
          <span key={key} className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            <Icon size={11} strokeWidth={1.5} />
            {PROFILE_LABELS[key] || key}
          </span>
        );
      })}
    </div>
  );
}

interface Trip {
  id: string;
  destination_city: string;
  destinations: DestinationCity[];
  start_date: string;
  end_date: string;
  traveler_profile: string;
  created_at: string;
  status?: string;
}

type TripStatus = 'ongoing' | 'upcoming' | 'completed';

function getTripStatus(trip: Trip): TripStatus {
  if (trip.status === 'completed') return 'completed';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(trip.start_date + 'T12:00:00');
  const end = new Date(trip.end_date + 'T12:00:00');
  if (today > end) return 'completed';
  if (today >= start && today <= end) return 'ongoing';
  return 'upcoming';
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T12:00:00');
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [sharedTrips, setSharedTrips] = useState<(Trip & { _shared_by: string; _permission: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const loadTrips = async () => {
      const { data } = await getSession();
      if (!data?.session) { router.push('/login'); return; }
      setToken(data.session.access_token);
      setUserId(data.session.user.id);
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/trips/`,
          { headers: { Authorization: `Bearer ${data.session.access_token}` } }
        );
        setTrips(response.data);
        try {
          const sharedRes = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/trips/shared-with-me`,
            { headers: { Authorization: `Bearer ${data.session.access_token}` } }
          );
          setSharedTrips(sharedRes.data || []);
        } catch { /* shared trips are optional */ }
      } catch (error) {
        console.error('Error loading trips:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTrips();
  }, [router]);

  const handleLogout = async () => { await signOut(); router.push('/'); };

  const handleCompleteTrip = async (tripId: string) => {
    if (!confirm('Marcar esta viagem como concluída?')) return;
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: 'completed' } : t));
    } catch { alert('Erro ao atualizar viagem.'); }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Excluir esta viagem permanentemente?')) return;
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTrips(trips.filter(t => t.id !== tripId));
    } catch (error) { console.error('Error deleting trip:', error); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-teal-light to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal mx-auto mb-4" />
          <p className="text-gray-600">Carregando viagens...</p>
        </div>
      </div>
    );
  }

  const ongoing = trips.filter(t => getTripStatus(t) === 'ongoing');
  const upcoming = trips.filter(t => getTripStatus(t) === 'upcoming')
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  const completed = trips.filter(t => getTripStatus(t) === 'completed')
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  const TripCard = ({ trip }: { trip: Trip }) => {
    const status = getTripStatus(trip);
    const days = Math.ceil((new Date(trip.end_date + 'T12:00:00').getTime() - new Date(trip.start_date + 'T12:00:00').getTime()) / 86400000) + 1;
    const until = daysUntil(trip.start_date);

    return (
      <div className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition group ${status === 'completed' ? 'opacity-80' : ''}`}>
        <CityImage city={trip.destination_city} className="relative h-36 bg-gradient-to-r from-brand-teal to-brand-teal-dark overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          {status === 'ongoing' && (
            <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Em andamento
            </div>
          )}
          {status === 'upcoming' && until <= 30 && (
            <div className="absolute top-3 left-3 bg-brand-orange text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
              {until <= 0 ? 'Começa hoje!' : until === 1 ? 'Amanhã!' : `Em ${until} dias`}
            </div>
          )}
          {status === 'completed' && (
            <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle size={12} /> Concluída
            </div>
          )}
          <div className="absolute bottom-3 left-4 right-4">
            {trip.destinations && trip.destinations.length > 1 ? (
              <div className="flex flex-wrap gap-1">
                {trip.destinations.map((d, i) => (
                  <span key={i} className="bg-black/40 backdrop-blur-sm text-white text-sm px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <FlagImg code={d.country_code} size="sm" /> {d.city}
                  </span>
                ))}
              </div>
            ) : (
              <h3 className="text-white font-bold text-xl drop-shadow flex items-center gap-2">
                {trip.destinations?.[0]?.country_code && <FlagImg code={trip.destinations[0].country_code} size="md" />}
                {trip.destination_city}
              </h3>
            )}
          </div>
        </CityImage>
        <div className="p-5">
          <p className="text-gray-600 text-sm mb-2 flex items-center gap-1">
            <Calendar size={12} className="flex-shrink-0" />
            {new Date(trip.start_date + 'T12:00:00').toLocaleDateString('pt-BR')} → {new Date(trip.end_date + 'T12:00:00').toLocaleDateString('pt-BR')}
            <span className="ml-1 text-gray-400">· {days} {days === 1 ? 'dia' : 'dias'}</span>
          </p>
          <div className="mb-4"><ProfileChips raw={trip.traveler_profile} /></div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/trips/${trip.id}`}
              className="flex-1 bg-brand-teal text-white px-4 py-2 rounded text-center hover:bg-brand-teal-dark font-medium text-sm"
            >
              Ver Roteiro
            </Link>
            {status !== 'completed' && (
              <button
                onClick={() => handleCompleteTrip(trip.id)}
                className="flex items-center justify-center gap-1 bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded hover:bg-green-100 font-medium text-sm"
                title="Marcar como concluída"
              >
                <CheckCircle size={15} />
              </button>
            )}
            <button
              onClick={() => handleDeleteTrip(trip.id)}
              className="flex items-center justify-center bg-red-50 text-red-500 border border-red-100 px-3 py-2 rounded hover:bg-red-100"
              title="Excluir viagem"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SectionHeader = ({ icon, label, count, color }: { icon: React.ReactNode; label: string; count: number; color: string }) => (
    <div className={`flex items-center gap-2 mb-4 pb-2 border-b-2 ${color}`}>
      {icon}
      <h2 className="text-lg font-bold text-gray-800">{label}</h2>
      <span className="ml-auto text-sm text-gray-400 font-medium">{count} {count === 1 ? 'viagem' : 'viagens'}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-teal-light to-white">
      <nav className="bg-white shadow-md border-b-4 border-brand-teal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-brand-teal flex items-center gap-2">
            <img src="/icons/icon.svg" alt="" className="w-8 h-8 rounded-lg" />
            Roteiria
          </h1>
          <div className="flex items-center gap-4">
            {userId && (
              <Link href={`/passport/${userId}`} className="flex items-center gap-1.5 text-gray-500 hover:text-brand-teal transition" title="Meu passaporte">
                <BookMarked size={18} />
                <span className="hidden sm:inline text-sm">Passaporte</span>
              </Link>
            )}
            <Link href="/profile" className="flex items-center gap-1.5 text-gray-500 hover:text-brand-teal transition" title="Meu perfil">
              <User size={18} />
              <span className="hidden sm:inline text-sm">Perfil</span>
            </Link>
            <CurrencyConverter variant="nav" />
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition" title="Sair">
              <LogOut size={18} />
              <span className="hidden sm:inline text-sm">Sair</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center gap-3 mb-8">
          <div>
            <h2 className="text-xl sm:text-3xl font-bold text-gray-900">Minhas Viagens</h2>
            <p className="text-sm text-gray-500 mt-1">{trips.length} {trips.length === 1 ? 'viagem' : 'viagens'} no total</p>
          </div>
          <Link
            href="/trips/new"
            className="whitespace-nowrap flex-shrink-0 bg-brand-orange text-white px-4 sm:px-6 py-2.5 rounded-xl hover:bg-brand-orange-dark font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transition"
          >
            + Nova Viagem
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhuma viagem ainda</h3>
            <p className="text-gray-600 mb-6">Crie sua primeira viagem e comece a planejar!</p>
            <Link href="/trips/new" className="inline-block bg-brand-orange text-white px-6 py-2 rounded-lg hover:bg-brand-orange-dark font-medium">
              Criar Viagem
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {ongoing.length > 0 && (
              <section>
                <SectionHeader icon={<Plane size={20} className="text-green-600" />} label="Em Andamento" count={ongoing.length} color="border-green-400" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ongoing.map(t => <TripCard key={t.id} trip={t} />)}
                </div>
              </section>
            )}

            {upcoming.length > 0 && (
              <section>
                <SectionHeader icon={<Clock size={20} className="text-brand-orange" />} label="Próximas Viagens" count={upcoming.length} color="border-brand-orange" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcoming.map(t => <TripCard key={t.id} trip={t} />)}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <SectionHeader icon={<Archive size={20} className="text-gray-400" />} label="Viagens Concluídas" count={completed.length} color="border-gray-300" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completed.map(t => <TripCard key={t.id} trip={t} />)}
                </div>
              </section>
            )}

            {sharedTrips.length > 0 && (
              <section>
                <SectionHeader icon={<Share2 size={20} className="text-blue-500" />} label="Compartilhadas Comigo" count={sharedTrips.length} color="border-blue-300" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sharedTrips.map(t => (
                    <div key={t.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                      <CityImage city={t.destination_city} className="relative h-36 bg-gradient-to-r from-blue-400 to-blue-600 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        <div className="absolute top-3 left-3 bg-blue-500/80 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Share2 size={10} /> {t._permission === 'edit' ? 'Pode editar' : 'Visualizar'}
                        </div>
                        <div className="absolute bottom-3 left-4 right-4">
                          {t.destinations && t.destinations.length > 1 ? (
                            <div className="flex flex-wrap gap-1">
                              {t.destinations.map((d, i) => (
                                <span key={i} className="bg-black/40 backdrop-blur-sm text-white text-sm px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                  <FlagImg code={d.country_code} size="sm" /> {d.city}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <h3 className="text-white font-bold text-xl drop-shadow flex items-center gap-2">
                              {t.destinations?.[0]?.country_code && <FlagImg code={t.destinations[0].country_code} size="md" />}
                              {t.destination_city}
                            </h3>
                          )}
                        </div>
                      </CityImage>
                      <div className="p-5">
                        <p className="text-gray-600 text-sm mb-2 flex items-center gap-1">
                          <Calendar size={12} className="flex-shrink-0" />
                          {new Date(t.start_date + 'T12:00:00').toLocaleDateString('pt-BR')} → {new Date(t.end_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </p>
                        <div className="mb-4"><ProfileChips raw={t.traveler_profile} /></div>
                        <Link href={`/trips/${t.id}`} className="w-full block bg-blue-500 text-white px-4 py-2 rounded text-center hover:bg-blue-600 font-medium text-sm">
                          Ver Roteiro
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
