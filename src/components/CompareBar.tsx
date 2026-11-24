import React from 'react';
import { Scale, X, ArrowRight, Trash2 } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const CompareBar: React.FC = () => {
  const {
    products,
    compareList,
    removeFromCompare,
    clearCompare,
    isCompareOpen,
    setIsCompareOpen
  } = useShop();

  const comparedProducts = compareList
    .map(id => products.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (comparedProducts.length === 0 || isCompareOpen) return null;

  return (
    <div
      role="region"
      aria-label="Barre de comparaison de produits"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-4xl bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl px-3 py-2.5 sm:px-4 sm:py-3 print:hidden animate-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Title + Scrollable selected product chips */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-900 shrink-0 tabular-nums">
            <Scale className="w-4 h-4 text-blue-700" />
            <span>Comparateur</span>
            <span className="text-slate-400">·</span>
            <span className="text-blue-700">{comparedProducts.length}/4</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none min-w-0 py-0.5">
            {comparedProducts.map(product => (
              <div
                key={product.id}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl pl-1.5 pr-2 py-1 shrink-0 max-w-[165px]"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-lg object-cover bg-white shrink-0"
                />
                <span className="text-[11px] font-semibold text-slate-800 truncate">
                  {product.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFromCompare(product.id)}
                  className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition-colors shrink-0"
                  aria-label={`Retirer ${product.name} du comparateur`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={clearCompare}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors whitespace-nowrap"
            title="Vider le comparateur"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vider</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCompareOpen(true)}
            className="px-3.5 sm:px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Scale className="w-3.5 h-3.5 sm:hidden" />
            <span>Comparer ({comparedProducts.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
