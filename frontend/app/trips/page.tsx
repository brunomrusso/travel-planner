'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, signOut } from '@/lib/supabase';
import Link from 'next/link';
import axios from 'axios';

interface Trip {
  id: string;
  destination_city: string;
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">✈️ Travel Planner</h1>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-red-600 font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">My Trips</h2>
          <Link
            href="/trips/new"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            + New Trip
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No trips yet</h3>
            <p className="text-gray-600 mb-6">Create your first trip to get started planning!</p>
            <Link
              href="/trips/new"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              Create Trip
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div key={trip.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-32"></div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{trip.destination_city}</h3>
                  <p className="text-gray-600 mb-1">
                    📅 {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600 mb-4">
                    👤 {trip.traveler_profile}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/trips/${trip.id}`}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-center hover:bg-blue-700 font-medium"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDeleteTrip(trip.id)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-medium"
                    >
                      Delete
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
