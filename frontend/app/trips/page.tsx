'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, signOut } from '@/lib/supabase';
import Link from 'next/link';
import axios from 'axios';
import FlagImg from '@/components/FlagImg';
import CityImage from '@/components/CityImage';

interface DestinationCity { city: string; country: string; country_code: string; }

const PROFILE_PT: Record<string, string> = {
  adventure: '🏔️ Aventura', cultural: '🏛️ Cultural', gastronomic: '🍽️ Gastronômico',
  relax: '🏖️ Relaxamento', family: '👨‍👩‍👧‍👦 Família',
};

const formatProfiles = (raw: string) =>
  raw.split(',').map(p => PROFILE_PT[p.trim()] || p.trim()).join(' • ');

interface Trip {
  id: string;
  destination_city: string;
  destinations: DestinationCity[];
  start_date: string;
  end_date: string;
  traveler_profile: string;
  created_at: string;
}


export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState('');

  useEffect(() => {
    const loadTrips = async () => {
      const { data } = await getSession();
      
      if (!data?.session) {
        router.push('/login');
        return;
      }

      setToken(data.session.access_token);

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/trips/`,
          {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
            },
          }
        );
        setTrips(response.data);
      } catch (error) {
        console.error('Error loading trips:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTrips();
  }, [router]);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTrips(trips.filter(t => t.id !== tripId));
    } catch (error) {
      console.error('Error deleting trip:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-teal-light to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando viagens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-teal-light to-white">
      <nav className="bg-white shadow-md border-b-4 border-brand-teal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-brand-teal">✈️ Roteiro Certo</h1>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-red-600 font-medium"
          >
            Sair
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Minhas Viagens</h2>
          <Link
            href="/trips/new"
            className="bg-brand-orange text-white px-6 py-2 rounded-lg hover:bg-brand-orange-dark font-medium"
          >
            + Nova Viagem
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhuma viagem ainda</h3>
            <p className="text-gray-600 mb-6">Crie sua primeira viagem e comece a planejar!</p>
            <Link
              href="/trips/new"
              className="inline-block bg-brand-orange text-white px-6 py-2 rounded-lg hover:bg-brand-orange-dark font-medium"
            >
              Criar Viagem
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div key={trip.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition group">
                <CityImage city={trip.destination_city} className="relative h-36 bg-gradient-to-r from-brand-teal to-brand-teal-dark overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
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
                  <p className="text-gray-600 text-sm mb-1">
                    📅 {new Date(trip.start_date + 'T12:00:00').toLocaleDateString('pt-BR')} → {new Date(trip.end_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-gray-600 text-sm mb-4">
                    {formatProfiles(trip.traveler_profile)}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/trips/${trip.id}`}
                      className="flex-1 bg-brand-teal text-white px-4 py-2 rounded text-center hover:bg-brand-teal-dark font-medium"
                    >
                      Ver Roteiro
                    </Link>
                    <button
                      onClick={() => handleDeleteTrip(trip.id)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-medium"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
