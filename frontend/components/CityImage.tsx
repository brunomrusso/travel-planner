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

const PERSON_SIGNALS = /\b(saint|born \d|died \d|\d{3,4}[–\-]\d{3,4}|bishop|pope|apostle|martyr|feast day|patron saint|canonized|beatified|friar|monk|nun)\b/i;

function isUsableArticle(data: Record<string, unknown>): boolean {
  if (!data) return false;
  if ((data.type as string) === 'disambiguation') return false;
  const desc = ((data.description as string) || '').toLowerCase();
  const extract = ((data.extract as string) || '').slice(0, 300).toLowerCase();
  if (PERSON_SIGNALS.test(desc) || PERSON_SIGNALS.test(extract)) return false;
  return true;
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

async function searchWikipediaCity(city: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(city + ' city municipality')}&limit=5&format=json&origin=*`
    );
    const [, titles] = await res.json() as [unknown, string[]];
    for (const title of (titles || [])) {
      if (/municipality|,\s|city in|town in/i.test(title)) return title;
    }
    return titles?.[0] || null;
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
  // 1. Direct fetch from English Wikipedia
  const en = await fetchSummary('en', city);
  if (en && isUsableArticle(en)) {
    const photo = extractPhoto(en);
    if (photo) return photo;
  }

  // 2. Direct fetch from Portuguese Wikipedia
  const pt = await fetchSummary('pt', city);
  if (pt && isUsableArticle(pt)) {
    const photo = extractPhoto(pt);
    if (photo) return photo;
  }

  // 3. If both failed (disambiguation, person, or no image) → search Wikipedia
  const found = await searchWikipediaCity(city);
  if (found && found.toLowerCase() !== city.toLowerCase()) {
    const d = await fetchSummary('en', found);
    if (d && isUsableArticle(d)) {
      const photo = extractPhoto(d);
      if (photo) return photo;
    }
  }

  // 4. No usable city image found — return null (gradient background shows instead)
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
