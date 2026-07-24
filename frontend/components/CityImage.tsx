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

const PERSON_SIGNALS = /\b(saint|são \w+ de |santa \w+ de |born \d|died \d|\d{3,4}[–\-]\d{3,4}|bishop|pope|apostle|martyr|feast day|patron saint|catholic|canonized|beatified|holy|friar|monk|nun|friar)\b/i;

function isAboutPerson(data: Record<string, unknown>): boolean {
  const desc = ((data.description as string) || '').toLowerCase();
  const extract = ((data.extract as string) || '').slice(0, 400).toLowerCase();
  if (PERSON_SIGNALS.test(desc)) return true;
  if (/\b(saint|patron|holy|martyred|born in \d|died in \d)\b/.test(extract)) return true;
  return false;
}

async function fetchSummary(lang: string, title: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function extractPhoto(data: Record<string, unknown>): string | null {
  const original = (data?.originalimage as Record<string, string> | undefined)?.source;
  const thumb = (data?.thumbnail as Record<string, string> | undefined)?.source;
  if (isPhotoUrl(original)) return original!;
  if (isPhotoUrl(thumb)) return thumb!;
  return null;
}

async function fetchCityImage(city: string): Promise<string | null> {
  // 1. Try English Wikipedia
  const en = await fetchSummary('en', city);
  if (en && !isAboutPerson(en)) {
    const photo = extractPhoto(en);
    if (photo) return photo;
  }

  // 2. If English looks like a saint/person, try disambiguation variants
  if (!en || isAboutPerson(en)) {
    for (const variant of [`${city} (city)`, `${city} (município)`, `${city}, Brazil`, `${city}, Brasil`]) {
      const d = await fetchSummary('en', variant) || await fetchSummary('pt', variant);
      if (d && !isAboutPerson(d)) {
        const photo = extractPhoto(d);
        if (photo) return photo;
      }
    }
  }

  // 3. Try Portuguese Wikipedia directly
  const pt = await fetchSummary('pt', city);
  if (pt && !isAboutPerson(pt)) {
    const photo = extractPhoto(pt);
    if (photo) return photo;
  }

  // 4. Last resort — use whatever photo we have even if person page
  if (en) { const p = extractPhoto(en); if (p) return p; }
  if (pt) { const p = extractPhoto(pt); if (p) return p; }
  return null;
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
