'use client';

import { useEffect, useState } from 'react';

interface WikiInfo {
  title: string;
  extract: string;
  thumbnail?: string;
  url: string;
}

async function fetchWikiInfo(name: string, city: string): Promise<WikiInfo | null> {
  const trySearch = async (lang: string, query: string): Promise<WikiInfo | null> => {
    try {
      const searchRes = await fetch(
        `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json&origin=*`
      );
      if (!searchRes.ok) return null;
      const [, titles, , urls] = await searchRes.json();
      if (!titles?.length) return null;

      const summaryRes = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titles[0])}`
      );
      if (!summaryRes.ok) return null;
      const data = await summaryRes.json();
      if (!data.extract || data.extract.length < 40) return null;

      const thumb = data.originalimage?.source || data.thumbnail?.source;
      const isPhoto = thumb && !/\.(svg)$/i.test(thumb) &&
        !/flag|coat.?of.?arms|emblem|bandeira|bras.?o/i.test(thumb);

      return {
        title: data.title,
        extract: data.extract,
        thumbnail: isPhoto ? thumb : undefined,
        url: urls[0],
      };
    } catch {
      return null;
    }
  };

  return (
    (await trySearch('pt', `${name} ${city}`)) ||
    (await trySearch('en', `${name} ${city}`)) ||
    (await trySearch('pt', name)) ||
    (await trySearch('en', name))
  );
}

interface AttractionModalProps {
  name: string;
  city: string;
  category: string;
  durationStr: string;
  address?: string;
  onClose: () => void;
}

export default function AttractionModal({ name, city, category, durationStr, address, onClose }: AttractionModalProps) {
  const [info, setInfo] = useState<WikiInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWikiInfo(name, city).then(result => {
      setInfo(result);
      setLoading(false);
    });
  }, [name, city]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Foto Wikipedia */}
        {loading ? (
          <div className="h-44 bg-gray-100 animate-pulse flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : info?.thumbnail ? (
          <div className="h-44 overflow-hidden">
            <img src={info.thumbnail} alt={name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-20 bg-gradient-to-r from-brand-teal to-brand-teal-dark" />
        )}

        {/* Conteúdo */}
        <div className="p-5 overflow-y-auto flex-1">
          <div className="flex justify-between items-start gap-3 mb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{category} • ⏱ {durationStr}</p>
              {address && <p className="text-xs text-gray-400 mt-0.5">📍 {address}</p>}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-5/6" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-4/6" />
            </div>
          ) : info ? (
            <>
              <p className="text-gray-700 text-sm leading-relaxed">{info.extract}</p>
              <a
                href={info.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-brand-teal font-semibold text-sm hover:underline"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                </svg>
                Ver mais na Wikipedia
              </a>
            </>
          ) : (
            <p className="text-gray-400 text-sm italic">Não encontramos informações sobre este local na Wikipedia.</p>
          )}
        </div>
      </div>
    </div>
  );
}
