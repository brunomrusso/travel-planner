'use client';

import { useEffect, useState } from 'react';

const imageCache = new Map<string, string | null>();

function isPhotoUrl(url: string | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.endsWith('.svg')) return false;
  if (/flag|coat.?of.?arms|bras.?o|bandeira|emblem|shield|wappen/i.test(lower)) return false;
  return true;
}

async function fetchCityImage(city: string): Promise<string | null> {
  const tryLang = async (lang: string): Promise<string | null> => {
    try {
      const res = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      const original = data?.originalimage?.source;
      const thumb = data?.thumbnail?.source;
      if (isPhotoUrl(original)) return original;
      if (isPhotoUrl(thumb)) return thumb;
      return null;
    } catch {
      return null;
    }
  };
  // English Wikipedia tends to have better city panoramas as lead image
  return (await tryLang('en')) || (await tryLang('pt'));
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
