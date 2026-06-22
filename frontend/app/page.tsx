'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/supabase';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await getSession();
      if (data?.session) {
        setIsAuthenticated(true);
        router.push('/trips');
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-teal-light to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-teal-light to-white">
      <nav className="bg-white shadow-md border-b-4 border-brand-teal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-brand-teal">✈️ Roteiria</h1>
          <div className="space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-brand-teal font-medium">
              Entrar
            </Link>
            <Link href="/register" className="bg-brand-orange text-white px-4 py-2 rounded-lg hover:bg-brand-orange-dark font-medium">
              Cadastrar
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-brand-black mb-4">
            Planeje a Viagem Perfeita
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Crie roteiros de viagem personalizados de acordo com seu estilo de viagem
          </p>
          <Link href="/register" className="inline-block bg-brand-orange text-white px-8 py-3 rounded-lg hover:bg-brand-orange-dark font-semibold text-lg">
            Começar agora
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-xl font-bold text-brand-black mb-2">Explore Destinos</h3>
            <p className="text-gray-600">
              Adicione cidades à sua viagem e descubra atrações incríveis
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-brand-black mb-2">Roteiros Personalizados</h3>
            <p className="text-gray-600">
              Itinerários otimizados com base no seu perfil de viajante
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-4xl mb-4">✏️</div>
            <h3 className="text-xl font-bold text-brand-black mb-2">Planejamento Flexível</h3>
            <p className="text-gray-600">
              Personalize e ajuste seu itinerário da forma que precisar
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
