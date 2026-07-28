'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { X, Send, MessageCircle, Bot, Wand2, Check, Trash2, MoveRight, Plus } from 'lucide-react';

interface AdjustAction {
  type: 'remove' | 'move' | 'add';
  attraction_name?: string;
  target_day?: number;
  category?: string;
  name_hint?: string;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  action?: AdjustAction | null;
  actionApplied?: boolean;
}

export interface ItineraryAction {
  type: 'remove' | 'move' | 'add';
  attraction_name?: string;
  target_day?: number;
  category?: string;
  name_hint?: string;
}

interface TripChatProps {
  tripId: string;
  city: string;
  token: string;
  itinerarySummary?: string;
  onItineraryAction?: (action: ItineraryAction, messageIndex: number) => void;
}

const SUGGESTIONS = [
  'Quais documentos preciso?',
  'Como se locomover pela cidade?',
  'O que comer de típico?',
  'Dicas de segurança',
];

const ADJUST_SUGGESTIONS = [
  'Remova o primeiro museu do roteiro',
  'Mova o último item do Dia 1 para o Dia 2',
  'Remova a atração mais longa do Dia 1',
];

const ADJUST_KEYWORDS = ['remov', 'mov', 'troc', 'mud', 'cancel', 'tira', 'coloc', 'passe', 'coloca'];

export default function TripChat({ tripId, city, token, itinerarySummary, onItineraryAction }: TripChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [];
    try { const s = localStorage.getItem(`chat_${tripId}`); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adjustMode, setAdjustMode] = useState(false);
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
    if (messages.length > 0) {
      try { localStorage.setItem(`chat_${tripId}`, JSON.stringify(messages.slice(-30))); } catch {}
    }
  }, [messages, tripId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const isAdjustIntent = (text: string) =>
    ADJUST_KEYWORDS.some(k => text.toLowerCase().includes(k));

  const sendMessage = async (text: string, forceAdjust = false) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput('');
    setError('');
    const userMsg: Message = { role: 'user', text: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const useAdjust = forceAdjust || adjustMode || isAdjustIntent(msg);

    try {
      if (useAdjust) {
        const history = messages.slice(-6).map(m => ({ role: m.role, content: m.text }));
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}/adjust`,
          { command: msg, history },
          { headers: { Authorization: `Bearer ${token}` }, timeout: 25000 }
        );
        setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply, action: res.data.action ?? null }]);
      } else {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}/chat`,
          { message: msg },
          { headers: { Authorization: `Bearer ${token}` }, timeout: 25000 }
        );
        setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }]);
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Erro ao conectar com a IA. Tente novamente.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const applyAction = (action: AdjustAction, msgIdx: number) => {
    if (!onItineraryAction) return;
    if (action.type === 'add') {
      onItineraryAction({ type: 'add', target_day: action.target_day, category: action.category, name_hint: action.name_hint }, msgIdx);
    } else {
      if (!action.attraction_name) return;
      onItineraryAction({ type: action.type, attraction_name: action.attraction_name, target_day: action.target_day }, msgIdx);
    }
    setMessages(prev => prev.map((m, i) => i === msgIdx ? { ...m, actionApplied: true } : m));
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
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-brand-teal text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {msg.text.replace(/\*\*(.*?)\*\*/g, '$1')}
                </div>
                {msg.action && msg.role === 'assistant' && (
                  <div className="mt-1 flex items-center gap-2">
                    {msg.actionApplied ? (
                      <span className="text-xs text-green-600 flex items-center gap-1"><Check size={11} /> Aplicado</span>
                    ) : (
                      <>
                        <button
                          onClick={() => applyAction(msg.action!, i)}
                          className="flex items-center gap-1 text-xs bg-brand-teal text-white px-2.5 py-1 rounded-full hover:bg-brand-teal-dark transition"
                        >
                          {msg.action.type === 'remove' ? <Trash2 size={11} /> : msg.action.type === 'add' ? <Plus size={11} /> : <MoveRight size={11} />}
                          {msg.action.type === 'remove' ? 'Confirmar remoção' : msg.action.type === 'add' ? `Adicionar ao Dia ${msg.action.target_day || 1}` : `Mover para Dia ${msg.action.target_day}`}
                        </button>
                        <button
                          onClick={() => setMessages(prev => prev.map((m, idx) => idx === i ? { ...m, action: null } : m))}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >Cancelar</button>
                      </>
                    )}
                  </div>
                )}
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

          {/* Mode toggle + Suggestions */}
          {messages.length <= 1 && !loading && (
            <div className="px-3 pb-2 space-y-2">
              <div className="flex gap-1">
                <button
                  onClick={() => setAdjustMode(false)}
                  className={`flex-1 text-xs py-1 rounded-lg border transition ${
                    !adjustMode ? 'bg-brand-teal text-white border-brand-teal' : 'text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >Perguntas</button>
                <button
                  onClick={() => setAdjustMode(true)}
                  className={`flex-1 text-xs py-1 rounded-lg border transition flex items-center justify-center gap-1 ${
                    adjustMode ? 'bg-brand-teal text-white border-brand-teal' : 'text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                ><Wand2 size={11} /> Ajustar roteiro</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(adjustMode ? ADJUST_SUGGESTIONS : SUGGESTIONS).map(s => (
                  <button key={s} onClick={() => sendMessage(s, adjustMode)}
                    className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full hover:bg-teal-100 transition">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 px-3 py-2 flex gap-2 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={adjustMode ? 'Diga o que quer mudar no roteiro...' : 'Pergunte sobre a viagem...'}
              rows={1}
              className={`flex-1 text-sm border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-teal resize-none ${
                adjustMode ? 'border-amber-300 bg-amber-50/40' : 'border-gray-200'
              }`}
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
