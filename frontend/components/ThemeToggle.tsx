'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

interface Props {
  variant?: 'nav' | 'icon';
}

export default function ThemeToggle({ variant = 'nav' }: Props) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  if (!mounted) return null;

  if (variant === 'icon') {
    return (
      <button
        onClick={toggle}
        className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition"
        title={dark ? 'Modo claro' : 'Modo escuro'}
      >
        {dark ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 text-gray-500 hover:text-brand-teal transition outline-none"
      title={dark ? 'Modo claro' : 'Modo escuro'}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
      <span className="hidden sm:inline text-sm">{dark ? 'Claro' : 'Escuro'}</span>
    </button>
  );
}
