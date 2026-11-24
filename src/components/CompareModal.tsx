import React, { useEffect, useMemo, useState } from 'react';
import {
  X, Scale, ShoppingBag, Star, CheckCircle, AlertTriangle,
  Plus, Trash2, ShieldCheck, FlaskConical
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Product } from '../types';
import { analyzeProductSafety } from '../utils/pharmacySafety';

interface SpecRow {
  id: string;
  label: string;
  renderValue: (product: Product) => React.ReactNode;
  compareKey: (product: Product) => string;
}

export const CompareModal: React.FC = () => {
  const {
    products,
    compareList,
    toggleCompare,
    removeFromCompare,
    clearCompare,
    isCompareOpen,
    setIsCompareOpen,
    addToCart,
    setSelectedProductForDetail
  } = useShop();

  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isCompareOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCompareOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCompareOpen, setIsCompareOpen]);

  const comparedProducts = useMemo(
    () =>
      compareList
        .map(id => products.find(p => p.id === id))
        .filter((p): p is Product => Boolean(p)),
    [compareList, products]
  );

  const availableToAdd = useMemo(
    () => products.filter(p => !compareList.includes(p.id)),
    [products, compareList]
  );

  const lowestPrice = useMemo(() => {
    if (comparedProducts.length < 2) return null;
    const prices = comparedProducts.map(p => Number(p.price ?? 0));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min < max ? min : null;
  }, [comparedProducts]);

  const highestRating = useMemo(() => {
    const validRatings = comparedProducts
      .map(p => p.rating)
      .filter((r): r is number => typeof r === 'number' && !Number.isNaN(r));
    if (validRatings.length < 2) return null;
    const max = Math.max(...validRatings);
    const min = Math.min(...validRatings);
    return max > min ? max : null;
  }, [comparedProducts]);

  const commonIngredients = useMemo(() => {
    if (comparedProducts.length < 2) return [];
    const normalizedSets = comparedProducts.map(
      p => new Set((p.ingredients || []).map(i => String(i).trim().toLowerCase()).filter(Boolean))
    );
    const firstList = comparedProducts[0].ingredients || [];
    return firstList.filter(ing => {
      const lower = String(ing).trim().toLowerCase();
      return lower && normalizedSets.every(set => set.has(lower));
    });
  }, [comparedProducts]);

  const specRows: SpecRow[] = useMemo(
    () => [
      {
        id: 'rating',
        label: 'Note & Avis clients',
        compareKey: (p) => `${p.rating ?? 'none'}-${p.reviewsCount ?? 0}`,
        renderValue: (p) => {
          const hasRating = typeof p.rating === 'number' && !Number.isNaN(p.rating);
          const reviewsCount = typeof p.reviewsCount === 'number' ? p.reviewsCount : 0;
          return (
            <div className="space-y-1 tabular-nums">
              <div className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                <span>{hasRating ? `${p.rating.toFixed(1)} / 5` : 'Non noté'}</span>
                <span className="text-slate-400 font-normal">({reviewsCount} avis)</span>
              </div>
              {hasRating && highestRating !== null && p.rating === highestRating && (
                <div className="text-[11px] font-bold text-emerald-700">Mieux noté</div>
              )}
            </div>
          );
        }
      },
      {
        id: 'category',
        label: 'Catégorie',
        compareKey: (p) => p.category,
        renderValue: (p) => <span className="font-medium text-slate-800">{p.category}</span>
      },
      {
        id: 'contenance',
        label: 'Contenance / Volume',
        compareKey: (p) => p.contenance || p.volume || '',
        renderValue: (p) => (
          <span className="font-semibold text-slate-900 tabular-nums">{p.contenance || p.volume || '—'}</span>
        )
      },
      {
        id: 'form',
        label: 'Forme galénique',
        compareKey: (p) => p.form || '',
        renderValue: (p) => <span className="text-slate-700">{p.form || '—'}</span>
      },
      {
        id: 'presentation',
        label: 'Présentation',
        compareKey: (p) => p.presentation || '',
        renderValue: (p) => <span className="text-slate-700">{p.presentation || '—'}</span>
      },
      {
        id: 'ean',
        label: 'Code EAN',
        compareKey: (p) => p.ean || '',
        renderValue: (p) => <span className="font-mono text-slate-700 tabular-nums">{p.ean || '—'}</span>
      },
      {
        id: 'tags',
        label: 'Labels & Qualité',
        compareKey: (p) => [...(p.tags || [])].sort().join('|'),
        renderValue: (p) => {
          const tags = Array.isArray(p.tags) ? p.tags : [];
          return (
            <span className="text-slate-700">
              {tags.length > 0 ? tags.join(' · ') : 'Formule standard'}
            </span>
          );
        }
      },
      {
        id: 'minimum_age',
        label: 'Âge minimum',
        compareKey: (p) => analyzeProductSafety(p, 'standard').minimumAgeLabel,
        renderValue: (p) => {
          const safety = analyzeProductSafety(p, 'standard');
          return <span className="font-semibold text-slate-800">{safety.minimumAgeLabel}</span>;
        }
      },
      {
        id: 'pregnancy',
        label: 'Grossesse & Allaitement',
        compareKey: (p) => {
          const s = analyzeProductSafety(p, 'standard');
          return `${s.pregnancyStatus}-${s.pregnancyNote}`;
        },
        renderValue: (p) => {
          const safety = analyzeProductSafety(p, 'standard');
          return (
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 font-bold">
                {safety.pregnancyStatus === 'compatible' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-emerald-700">Compatible</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="text-amber-800">Avis conseillé</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{safety.pregnancyNote}</p>
            </div>
          );
        }
      },
      {
        id: 'tolerance',
        label: 'Tolérance cutanée',
        compareKey: (p) => analyzeProductSafety(p, 'standard').sensitiveSkinNote,
        renderValue: (p) => {
          const safety = analyzeProductSafety(p, 'standard');
          return <p className="text-slate-700 leading-relaxed">{safety.sensitiveSkinNote}</p>;
        }
      },
      {
        id: 'ingredients',
        label: 'Actifs & Formule INCI',
        compareKey: (p) => (p.ingredients || []).join('|').toLowerCase(),
        renderValue: (p) => {
          const ingredients = Array.isArray(p.ingredients) ? p.ingredients : [];
          return (
            <div className="text-[11px] font-mono text-slate-700 leading-relaxed">
              {ingredients.length > 0 ? ingredients.join(' · ') : '—'}
            </div>
          );
        }
      },
      {
        id: 'usage',
        label: 'Conseils d’utilisation',
        compareKey: (p) => p.usage || '',
        renderValue: (p) => <p className="text-slate-700 leading-relaxed">{p.usage || '—'}</p>
      },
      {
        id: 'description',
        label: 'Présentation clinique',
        compareKey: (p) => p.description || '',
        renderValue: (p) => <p className="text-slate-600 leading-relaxed">{p.description || '—'}</p>
      }
    ],
    [highestRating]
  );

  const visibleRows = useMemo(() => {
    if (!showDifferencesOnly || comparedProducts.length < 2) return specRows;
    return specRows.filter(row => {
      const keys = new Set(comparedProducts.map(p => row.compareKey(p)));
      return keys.size > 1;
    });
  }, [specRows, showDifferencesOnly, comparedProducts]);

  if (!isCompareOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 overflow-y-auto"
      onClick={() => setIsCompareOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="compare-modal-title" className="text-base sm:text-lg font-bold text-slate-900 truncate">
                Comparateur de Produits
              </h2>
              <p className="text-xs text-slate-500 tabular-nums">
                {comparedProducts.length} / 4 références sélectionnées · Spécifications côte à côte
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {comparedProducts.length >= 2 && (
              <button
                type="button"
                onClick={() => setShowDifferencesOnly(v => !v)}
                aria-pressed={showDifferencesOnly}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                  showDifferencesOnly
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {showDifferencesOnly ? 'Afficher toutes les lignes' : 'Uniquement les différences'}
              </button>
            )}

            {comparedProducts.length > 0 && (
              <button
                type="button"
                onClick={clearCompare}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Tout effacer</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCompareOpen(false)}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Fermer le comparateur"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {comparedProducts.length === 0 ? (
            <div className="p-10 text-center space-y-4">
              <Scale className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Aucun produit sélectionné</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Cliquez sur l’icône Comparer sur n’importe quel produit du catalogue ou ajoutez une référence ci-dessous.
                </p>
              </div>
              {availableToAdd.length > 0 && (
                <div className="max-w-xs mx-auto pt-2">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) toggleCompare(e.target.value);
                      e.target.value = '';
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800"
                  >
                    <option value="">+ Ajouter un produit à comparer...</option>
                    {availableToAdd.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.brand} — {p.name} ({Number(p.price ?? 0).toFixed(2)} €)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {/* Quick Add Bar + Common Active Ingredients Banner */}
              <div className="px-4 sm:px-6 py-3 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  {comparedProducts.length === 1 ? (
                    <span>Sélectionnez un deuxième produit pour comparer leurs caractéristiques côte à côte.</span>
                  ) : commonIngredients.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                      <FlaskConical className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span>
                        <strong>Actifs en commun :</strong> {commonIngredients.join(', ')}
                      </span>
                    </span>
                  ) : (
                    <span>Aucun ingrédient INCI identique sur l’ensemble de cette sélection.</span>
                  )}
                </div>

                {comparedProducts.length < 4 && availableToAdd.length > 0 && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Plus className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <select
                      aria-label="Ajouter un autre produit au comparateur"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) toggleCompare(e.target.value);
                        e.target.value = '';
                      }}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-semibold text-slate-800 max-w-[260px]"
                    >
                      <option value="">Ajouter un produit ({comparedProducts.length}/4)...</option>
                      {availableToAdd.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.brand} — {p.name} ({Number(p.price ?? 0).toFixed(2)} €)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Side-by-Side Comparison Matrix */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 align-top bg-white">
                      <th className="sticky left-0 z-20 bg-slate-50 border-r border-slate-200 w-40 sm:w-52 min-w-[150px] p-4 font-bold text-slate-700 align-middle">
                        Caractéristiques clés
                      </th>

                      {comparedProducts.map(product => {
                        const isBestPrice = lowestPrice !== null && product.price === lowestPrice;
                        const imgBroken = failedImages[product.id];
                        return (
                          <th
                            key={product.id}
                            className="p-4 min-w-[210px] sm:min-w-[230px] border-r border-slate-100 last:border-r-0 font-normal align-top"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                  {product.brand}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeFromCompare(product.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title={`Retirer ${product.name}`}
                                  aria-label={`Retirer ${product.name}`}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setIsCompareOpen(false);
                                  setSelectedProductForDetail(product);
                                }}
                                className="block w-full text-left group space-y-2"
                              >
                                <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
                                  {imgBroken ? (
                                    <div className="p-3 text-center text-[11px] text-slate-400 font-medium">
                                      {product.brand}
                                    </div>
                                  ) : (
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      referrerPolicy="no-referrer"
                                      onError={() => setFailedImages(prev => ({ ...prev, [product.id]: true }))}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  )}
                                </div>
                                <div className="font-bold text-sm text-slate-900 group-hover:text-blue-700 line-clamp-2 min-h-[2.5rem] transition-colors">
                                  {product.name}
                                </div>
                              </button>

                              <div className="space-y-1 tabular-nums">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-lg font-black text-blue-800">{Number(product.price ?? 0).toFixed(2)} €</span>
                                  {typeof product.oldPrice === 'number' && product.oldPrice > 0 && (
                                    <span className="text-xs text-slate-400 line-through">{product.oldPrice.toFixed(2)} €</span>
                                  )}
                                </div>
                                {isBestPrice && (
                                  <div className="text-[11px] font-bold text-emerald-700">Meilleur prix</div>
                                )}
                                <div className="text-[11px]">
                                  {Number(product.stock ?? 0) > 5 ? (
                                    <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
                                      <CheckCircle className="w-3 h-3" /> En stock ({product.stock})
                                    </span>
                                  ) : Number(product.stock ?? 0) > 0 ? (
                                    <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                                      <AlertTriangle className="w-3 h-3" /> Stock limité ({product.stock})
                                    </span>
                                  ) : (
                                    <span className="font-semibold text-rose-700">Rupture de stock</span>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => addToCart(product)}
                                disabled={Number(product.stock ?? 0) <= 0}
                                className={`w-full py-2 px-3 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                                  Number(product.stock ?? 0) > 0
                                    ? 'bg-blue-700 hover:bg-blue-800 text-white'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>{Number(product.stock ?? 0) > 0 ? 'Ajouter au panier' : 'Indisponible'}</span>
                              </button>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {visibleRows.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50/50 align-top">
                        <th className="sticky left-0 z-10 bg-slate-50 border-r border-slate-200 p-4 font-semibold text-slate-700">
                          {row.label}
                        </th>
                        {comparedProducts.map(product => (
                          <td
                            key={product.id}
                            className="p-4 border-r border-slate-100 last:border-r-0"
                          >
                            {row.renderValue(product)}
                          </td>
                        ))}
                      </tr>
                    ))}

                    {visibleRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={comparedProducts.length + 1}
                          className="p-8 text-center text-xs text-slate-500"
                        >
                          Toutes les caractéristiques de ces produits sont identiques. Désactivez « Uniquement les différences » pour afficher l’ensemble du tableau.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
