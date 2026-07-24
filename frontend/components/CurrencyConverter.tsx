'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, RefreshCw } from 'lucide-react';

const COUNTRY_CURRENCY: Record<string, { code: string; symbol: string; name: string }> = {
  fr: { code: 'EUR', symbol: '€', name: 'Euro' },
  de: { code: 'EUR', symbol: '€', name: 'Euro' },
  it: { code: 'EUR', symbol: '€', name: 'Euro' },
  es: { code: 'EUR', symbol: '€', name: 'Euro' },
  pt: { code: 'EUR', symbol: '€', name: 'Euro' },
  nl: { code: 'EUR', symbol: '€', name: 'Euro' },
  be: { code: 'EUR', symbol: '€', name: 'Euro' },
  at: { code: 'EUR', symbol: '€', name: 'Euro' },
  gr: { code: 'EUR', symbol: '€', name: 'Euro' },
  gb: { code: 'GBP', symbol: '£', name: 'Libra' },
  us: { code: 'USD', symbol: '$', name: 'Dólar' },
  ca: { code: 'CAD', symbol: 'CA$', name: 'Dólar Canadense' },
  au: { code: 'AUD', symbol: 'A$', name: 'Dólar Australiano' },
  nz: { code: 'NZD', symbol: 'NZ$', name: 'Dólar Neozelandês' },
  jp: { code: 'JPY', symbol: '¥', name: 'Iene' },
  cn: { code: 'CNY', symbol: '¥', name: 'Yuan' },
  kr: { code: 'KRW', symbol: '₩', name: 'Won' },
  in: { code: 'INR', symbol: '₹', name: 'Rúpia' },
  mx: { code: 'MXN', symbol: 'MX$', name: 'Peso Mexicano' },
  ar: { code: 'ARS', symbol: 'AR$', name: 'Peso Argentino' },
  cl: { code: 'CLP', symbol: 'CL$', name: 'Peso Chileno' },
  co: { code: 'COP', symbol: 'CO$', name: 'Peso Colombiano' },
  pe: { code: 'PEN', symbol: 'S/', name: 'Sol Peruano' },
  uy: { code: 'UYU', symbol: 'UY$', name: 'Peso Uruguaio' },
  ch: { code: 'CHF', symbol: 'Fr', name: 'Franco Suíço' },
  se: { code: 'SEK', symbol: 'kr', name: 'Coroa Sueca' },
  no: { code: 'NOK', symbol: 'kr', name: 'Coroa Norueguesa' },
  dk: { code: 'DKK', symbol: 'kr', name: 'Coroa Dinamarquesa' },
  pl: { code: 'PLN', symbol: 'zł', name: 'Zloty' },
  cz: { code: 'CZK', symbol: 'Kč', name: 'Coroa Tcheca' },
  hu: { code: 'HUF', symbol: 'Ft', name: 'Florim' },
  ro: { code: 'RON', symbol: 'lei', name: 'Leu' },
  tr: { code: 'TRY', symbol: '₺', name: 'Lira Turca' },
  ae: { code: 'AED', symbol: 'د.إ', name: 'Dirham' },
  sg: { code: 'SGD', symbol: 'S$', name: 'Dólar de Singapura' },
  th: { code: 'THB', symbol: '฿', name: 'Baht' },
  id: { code: 'IDR', symbol: 'Rp', name: 'Rupia' },
  my: { code: 'MYR', symbol: 'RM', name: 'Ringgit' },
  za: { code: 'ZAR', symbol: 'R', name: 'Rand' },
  eg: { code: 'EGP', symbol: '£', name: 'Libra Egípcia' },
  ma: { code: 'MAD', symbol: 'MAD', name: 'Dirham Marroquino' },
  np: { code: 'NPR', symbol: '₨', name: 'Rupia Nepalesa' },
  vn: { code: 'VND', symbol: '₫', name: 'Dong' },
  ph: { code: 'PHP', symbol: '₱', name: 'Peso Filipino' },
  hk: { code: 'HKD', symbol: 'HK$', name: 'Dólar de Hong Kong' },
};

const POPULAR_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'Dólar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'Libra' },
  { code: 'ARS', symbol: 'AR$', name: 'Peso Arg.' },
  { code: 'JPY', symbol: '¥', name: 'Iene' },
];

interface Props {
  countryCode?: string;
}

export default function CurrencyConverter({ countryCode }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('100');
  const [fromBRL, setFromBRL] = useState(true);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(
    (countryCode ? COUNTRY_CURRENCY[countryCode.toLowerCase()] : null) || POPULAR_CURRENCIES[0]
  );

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setFetchError(false);
    fetch('https://open.er-api.com/v6/latest/BRL')
      .then(r => r.json())
      .then(data => {
        if (data.result === 'success' && data.rates) {
          setRates(data.rates);
          setLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        } else {
          setFetchError(true);
        }
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [open]);

  const rate = rates[selectedCurrency.code] || 0;
  const numAmount = parseFloat(amount) || 0;
  const converted = fromBRL
    ? (numAmount * rate).toFixed(selectedCurrency.code === 'JPY' ? 0 : 2)
    : rate ? (numAmount / rate).toFixed(2) : '—';

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-24 left-6 z-[9990] bg-white border border-gray-200 shadow-lg px-3 py-2.5 rounded-full flex items-center gap-2 hover:shadow-xl transition text-sm font-semibold text-gray-700 print:hidden"
        title="Conversor de moeda"
      >
        <DollarSign size={16} className="text-brand-teal" />
        <span className="hidden sm:inline">Câmbio</span>
      </button>

      {open && (
        <div className="fixed bottom-40 left-6 z-[9989] w-[310px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden print:hidden">
          <div className="bg-gradient-to-r from-brand-teal to-brand-teal-dark px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-white" />
              <p className="text-white font-bold text-sm">Conversor de Moeda</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Currency selector */}
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Moeda destino</p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => setSelectedCurrency(c)}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition ${
                      selectedCurrency.code === c.code
                        ? 'bg-brand-teal text-white border-brand-teal'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-brand-teal'
                    }`}
                  >
                    {c.symbol} {c.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Converter */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 w-10">{fromBRL ? 'BRL' : selectedCurrency.code}</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="flex-1 text-lg font-bold text-gray-800 bg-transparent outline-none w-0"
                  min="0"
                />
                <span className="text-xs text-gray-400">{fromBRL ? 'R$' : selectedCurrency.symbol}</span>
              </div>

              <button
                onClick={() => setFromBRL(v => !v)}
                className="w-full flex items-center justify-center gap-1 text-xs text-brand-teal hover:text-brand-teal-dark font-medium py-1"
              >
                <RefreshCw size={12} /> Inverter
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 w-10">{fromBRL ? selectedCurrency.code : 'BRL'}</span>
                {loading ? (
                  <span className="text-gray-400 text-sm">Carregando...</span>
                ) : (
                  <span className="text-2xl font-bold text-brand-teal">
                    {fromBRL ? selectedCurrency.symbol : 'R$'} {converted}
                  </span>
                )}
              </div>
            </div>

            {/* Error state */}
            {fetchError && (
              <p className="text-xs text-red-500 text-center">Erro ao carregar câmbio. Verifique sua conexão.</p>
            )}

            {/* Rate reference */}
            {rate > 0 && !loading && !fetchError && (
              <p className="text-xs text-gray-400 text-center">
                1 BRL = {selectedCurrency.symbol} {rate.toFixed(4)} {selectedCurrency.code}
                {lastUpdated && ` · atualizado ${lastUpdated}`}
              </p>
            )}

            {/* Other currencies */}
            {Object.keys(rates).length > 0 && (
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1.5">Outras moedas (por R$ {numAmount || 1})</p>
                <div className="grid grid-cols-2 gap-1">
                  {POPULAR_CURRENCIES.filter(c => c.code !== selectedCurrency.code && rates[c.code]).map(c => (
                    <div key={c.code} className="flex justify-between items-center bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs text-gray-500">{c.symbol} {c.code}</span>
                      <span className="text-xs font-semibold text-gray-700">
                        {c.code === 'JPY'
                          ? Math.round(numAmount * (rates[c.code] || 0))
                          : (numAmount * (rates[c.code] || 0)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
