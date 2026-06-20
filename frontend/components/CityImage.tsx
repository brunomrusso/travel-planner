'use client';

import { useEffect, useState } from 'react';

const imageCache = new Map<string, string | null>();

async function fetchCityImage(city: string): Promise<string | null> {
  const tryLang = async (lang: string): Promise<string | null> => {
    try {
      const res = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data?.originalimage?.source || data?.thumbnail?.source || null;
    } catch {
      return null;
    }
  };
  return (await tryLang('pt')) || (await tryLang('en'));
}

interface CityImageProps {
  city: string;
  className?: string;
  children?: React.ReactNode;
}

export default function CityImage({ city, className, children }: CityImageProps) {
  const [src, setSrc] = useState<string | null>(imageCache.get(city) ?? null);

  useEffect(() => {
    if (imageCache.has(city)) {
      setSrc(imageCache.get(city)!);
      return;
    }
    let cancelled = false;
    fetchCityImage(city).then((url) => {
      imageCache.set(city, url);
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [city]);

  return (
    <div
      className={className}
      style={
        src
          ? {
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
