'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/supabase';
import axios from 'axios';

const TRAVELER_PROFILES = [
  { value: 'adventure', label: '🏔️ Adventure', description: 'Hiking, nature, outdoor activities' },
  { value: 'cultural', label: '🏛️ Cultural', description: 'Museums, galleries, historic sites' },
  { value: 'gastronomic', label: '🍽️ Gastronomic', description: 'Restaurants, cafes, food markets' },
  { value: 'relax', label: '🏖️ Relax', description: 'Beaches, spas, parks' },
  { value: 'family', label: '👨‍👩‍👧‍👦 Family', description: 'Kid-friendly attractions, entertainment' },
];

export default function NewTripPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    destination_city: '',
    start_date: '',
    end_date: '',
    traveler_profile: 'cultural',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSelect = (profile: string) => {
    setFormData(prev => ({ ...prev, traveler_profile: profile }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data } = await getSession();
      if (!data?.session) {
        router.push('/login');
        return;
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/trips/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        }
      );

      router.push(`/trips/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error creating trip');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Create New Trip</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Destination City</label>
            <input
              type="text"
              name="destination_city"
              value={formData.destination_city}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Paris, Tokyo, Barcelona"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Start Date</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">End Date</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-4">Traveler Profile</label>
            <div className="grid md:grid-cols-2 gap-3">
              {TRAVELER_PROFILES.map(profile => (
                <button
                  key={profile.value}
                  type="button"
                  onClick={() => handleProfileSelect(profile.value)}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    formData.traveler_profile === profile.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{profile.label}</div>
                  <div className="text-sm text-gray-600">{profile.description}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating trip...' : 'Create Trip'}
          </button>
        </form>
      </div>
    </div>
  );
}
