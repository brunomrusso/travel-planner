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

async function searchCityImage(city: string): Promise<string | null> {
  const queries = [`${city} municipality`, `${city} city`, city];
  for (const q of queries) {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=5&prop=pageimages|description&pithumbsize=1200&format=json&origin=*`
      );
      const data = await res.json() as Record<string, unknown>;
      const pages = Object.values((data?.query as Record<string, unknown>)?.pages as Record<string, unknown> || {}) as Record<string, unknown>[];
      for (const page of pages) {
        const desc = ((page.description as string) || '').toLowerCase();
        if (PERSON_SIGNALS.test(desc)) continue;
        const thumb = (page.thumbnail as { source?: string } | undefined)?.source;
        if (thumb && isPhotoUrl(thumb)) return thumb;
      }
    } catch { /* try next query */ }
  }
  return null;
}

function extractPhoto(data: Record<string, unknown>): string | null {
  const original = (data?.originalimage as Record<string, string> | undefined)?.source;
  const thumb = (data?.thumbnail as Record<string, string> | undefined)?.source;
  if (isPhotoUrl(original)) return original!;
  if (isPhotoUrl(thumb)) return thumb!;
  return null;
}

const SAINT_PREFIX = /^(são |santa |santo |san |sant'|sant |saint )/i;

async function fetchCityImage(city: string): Promise<string | null> {
  const isSaintName = SAINT_PREFIX.test(city.trim());

  if (!isSaintName) {
    // Normal city name: try direct Wikipedia fetch first (fast path)
    const en = await fetchSummary('en', city);
    if (en && isUsableArticle(en)) {
      const photo = extractPhoto(en);
      if (photo) return photo;
    }

    const pt = await fetchSummary('pt', city);
    if (pt && isUsableArticle(pt)) {
      const photo = extractPhoto(pt);
      if (photo) return photo;
    }
  }

  // Saint-named cities OR direct fetch failed:
  // Use Wikipedia search to find the specific municipality article
  // e.g. "São Roque" → finds "São Roque, São Paulo" which has a real city photo
  const photo = await searchCityImage(city);
  if (photo) return photo;

  // No usable city image — show gradient background
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
