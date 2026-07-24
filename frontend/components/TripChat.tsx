'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { X, Send, MessageCircle, Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface TripChatProps {
  tripId: string;
  city: string;
  token: string;
}

const SUGGESTIONS = [
  'Quais documentos preciso?',
  'Como se locomover pela cidade?',
  'O que comer de típico?',
  'Dicas de segurança',
  'Melhor época para visitar',
];

export default function TripChat({ tripId, city, token }: TripChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        text: `Olá! Sou seu assistente de viagem para **${city}**. Pode me perguntar sobre transporte, gastronomia, segurança, dicas locais e muito mais! 🌍`,
      }]);
    }
  }, [open, city, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput('');
    setError('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}/chat`,
        { message: msg },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 25000 }
      );
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }]);
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Erro ao conectar com a IA. Tente novamente.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`fixed bottom-6 right-6 z-[9990] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          open ? 'bg-gray-700 rotate-0' : 'bg-brand-teal hover:bg-brand-teal-dark'
        }`}
        title="Assistente de viagem"
      >
        {open ? <X size={22} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[9989] w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200" style={{ maxHeight: '72vh' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-teal to-brand-teal-dark px-4 py-3 flex items-center gap-2">
            <Bot size={18} className="text-white" />
            <div>
              <p className="text-white font-bold text-sm">Assistente de Viagem</p>
              <p className="text-white/70 text-xs">{city}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-brand-teal text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {msg.text.replace(/\*\*(.*?)\*\*/g, '$1')}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            {error && (
              <p className="text-xs text-red-500 text-center px-2">{error}</p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (only shown initially) */}
          {messages.length <= 1 && !loading && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full hover:bg-teal-100 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 px-3 py-2 flex gap-2 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Pergunte sobre a viagem..."
              rows={1}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-teal resize-none"
              style={{ maxHeight: 80 }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-brand-teal rounded-full flex items-center justify-center disabled:opacity-40 hover:bg-brand-teal-dark transition flex-shrink-0"
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
