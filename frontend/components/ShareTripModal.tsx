'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, UserPlus, Trash2, Eye, Pencil, Users } from 'lucide-react';

interface Share {
  id: string;
  shared_with_email: string;
  permission: 'view' | 'edit';
  created_at: string;
}

interface Props {
  tripId: string;
  tripCity: string;
  token: string;
  onClose: () => void;
}

export default function ShareTripModal({ tripId, tripCity, token, onClose }: Props) {
  const [shares, setShares] = useState<Share[]>([]);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    setLoading(true);
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}/shares`, { headers })
      .then(r => setShares(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tripId]);

  const handleAdd = async () => {
    if (!email.trim()) return;
    setAdding(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}/shares`,
        { email: email.trim(), permission },
        { headers }
      );
      setShares(prev => [...prev, res.data]);
      setEmail('');
      setSuccess(`Viagem compartilhada com ${email.trim()}!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao compartilhar. Verifique o email.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (shareId: string, shareEmail: string) => {
    if (!confirm(`Remover acesso de ${shareEmail}?`)) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/trips/${tripId}/shares/${shareId}`, { headers });
      setShares(prev => prev.filter(s => s.id !== shareId));
    } catch {
      alert('Erro ao remover acesso.');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-brand-teal" />
            <div>
              <h3 className="font-bold text-gray-900">Compartilhar Viagem</h3>
              <p className="text-xs text-gray-400">{tripCity}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Add new share */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Convidar por email</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setPermission('view')}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl border-2 transition ${
                  permission === 'view' ? 'border-brand-teal bg-teal-50 text-brand-teal' : 'border-gray-200 text-gray-500'
                }`}
              >
                <Eye size={13} /> Visualizar
              </button>
              <button
                onClick={() => setPermission('edit')}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl border-2 transition ${
                  permission === 'edit' ? 'border-brand-teal bg-teal-50 text-brand-teal' : 'border-gray-200 text-gray-500'
                }`}
              >
                <Pencil size={13} /> Editar
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={!email.trim() || adding}
              className="mt-2 w-full bg-brand-teal text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-teal-dark disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {adding ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><UserPlus size={15} /> Convidar</>
              )}
            </button>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            {success && <p className="text-xs text-green-600 mt-2 font-medium">✅ {success}</p>}
          </div>

          {/* Current shares */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Compartilhada com {shares.length === 0 ? 'ninguém' : `${shares.length} pessoa${shares.length > 1 ? 's' : ''}`}
            </p>
            {loading ? (
              <div className="text-sm text-gray-400 text-center py-4">Carregando...</div>
            ) : shares.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum convidado ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {shares.map(share => (
                  <div key={share.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-teal-light flex items-center justify-center text-brand-teal font-bold text-sm flex-shrink-0">
                      {share.shared_with_email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{share.shared_with_email}</p>
                      <p className={`text-xs flex items-center gap-1 ${share.permission === 'edit' ? 'text-amber-600' : 'text-gray-400'}`}>
                        {share.permission === 'edit' ? <><Pencil size={10} /> Pode editar</> : <><Eye size={10} /> Somente visualizar</>}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(share.id, share.shared_with_email)}
                      className="text-gray-300 hover:text-red-500 transition flex-shrink-0"
                      title="Remover acesso"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-xs text-blue-700">
            ℹ️ O convidado precisa ter uma conta no Roteiria com o mesmo email.
          </div>
        </div>
      </div>
    </div>
  );
}
