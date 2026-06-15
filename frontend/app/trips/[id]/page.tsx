'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSession } from '@/lib/supabase';
import Link from 'next/link';
import axios from 'axios';

interface Attraction {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  visit_duration_minutes: number;
}

interface ItineraryItem {
  id: string;
  day_number: number;
  order_in_day: number;
  attraction_id: string;
  start_time?: string;
  notes?: string;
}

interface Trip {
  id: string;
  destination_city: string;
  start_date: string;
  end_date: string;
  traveler_profile: string;
}

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState('');

  useEffect(() => {
    const loadTripData = async () => {
      const { data } = await getSession();
      
      if (!data?.session) {
        router.push('/login');
        return;
      }

      setToken(data.session.access_token);

      try {
        const tripResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}`,
          {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
            },
          }
        );
        setTrip(tripResponse.data);

        const attractionsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/attractions/?city=${tripResponse.data.destination_city}`,
          {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
            },
          }
        );
        setAttractions(attractionsResponse.data);

        const itineraryResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/itineraries/${tripId}`,
          {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
            },
          }
        );
        setItinerary(itineraryResponse.data);
      } catch (error) {
        console.error('Error loading trip data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTripData();
  }, [tripId, router]);

  const handleGenerateItinerary = async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}/generate-itinerary`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      window.location.reload();
    } catch (error) {
      console.error('Error generating itinerary:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Trip not found</p>
          <Link href="/trips" className="text-blue-600 hover:text-blue-700 font-medium mt-4 inline-block">
            Back to trips
          </Link>
        </div>
      </div>
    );
  }

  const days = Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const itineraryByDay = Array.from({ length: days }, (_, i) => 
    itinerary.filter(item => item.day_number === i + 1).sort((a, b) => a.order_in_day - b.order_in_day)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/trips" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to trips
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{trip.destination_city}</h1>
          <div></div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-gray-600 text-sm">Destination</p>
              <p className="text-2xl font-bold text-gray-900">{trip.destination_city}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Duration</p>
              <p className="text-2xl font-bold text-gray-900">{days} days</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Travel Profile</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">{trip.traveler_profile}</p>
            </div>
          </div>

          {itinerary.length === 0 && (
            <button
              onClick={handleGenerateItinerary}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Generate Itinerary
            </button>
          )}
        </div>

        {itinerary.length > 0 && (
          <div className="space-y-6">
            {itineraryByDay.map((dayItems, dayIndex) => (
              <div key={dayIndex} className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Day {dayIndex + 1} - {new Date(new Date(trip.start_date).getTime() + dayIndex * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </h2>
                {dayItems.length === 0 ? (
                  <p className="text-gray-600">No activities planned for this day</p>
                ) : (
                  <div className="space-y-3">
                    {dayItems.map((item, index) => {
                      const attraction = attractions.find(a => a.id === item.attraction_id);
                      return (
                        <div key={item.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 min-w-fit">{index + 1}.</div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900">{attraction?.name}</h3>
                            <p className="text-sm text-gray-600">
                              {attraction?.category} • {attraction?.visit_duration_minutes} min
                            </p>
                            {item.notes && <p className="text-sm text-gray-700 mt-1">{item.notes}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
