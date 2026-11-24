import React from 'react';
import {
  Tag, Sparkles, ArrowLeft, ShoppingBag, Eye, Copy, CheckCircle, Award, Scale
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const BrandsPage: React.FC = () => {
  const { products, navigate, setSelectedBrand, setSelectedCategory, setSelectedTag } = useShop();

  const brandMap = products.reduce<Record<string, { count: number; categories: Set<string>; sampleImage: string }>>((acc, p) => {
    if (!acc[p.brand]) {
      acc[p.brand] = { count: 0, categories: new Set(), sampleImage: p.image };
    }
    acc[p.brand].count += 1;
    acc[p.brand].categories.add(p.category);
    return acc;
  }, {});

  const brands = Object.entries(brandMap).sort((a, b) => a[0].localeCompare(b[0]));

  const handleOpenBrand = (brand: string) => {
    setSelectedCategory('Tous');
    setSelectedTag('Tous');
    setSelectedBrand(brand);
    navigate('/');
    setTimeout(() => {
      document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à la boutique
      </button>

      <div className="bg-gradient-to-r from-blue-900 to-sky-900 text-white rounded-3xl p-8 shadow-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-sky-200 text-xs font-bold rounded-full mb-3">
          <Award className="w-3.5 h-3.5 text-amber-300" /> Laboratoires Partenaires Agréés
        </div>
        <h1 className="text-3xl font-black tracking-tight">Nos Marques &amp; Laboratoires</h1>
        <p className="text-sm text-blue-200 mt-2 max-w-2xl">
          Découvrez l’ensemble des marques dermo-cosmétiques, solaires et nutritionnelles sélectionnées par nos pharmaciens.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map(([brandName, info]) => (
          <div
            key={brandName}
            onClick={() => handleOpenBrand(brandName)}
            className="bg-white rounded-3xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer group flex items-center gap-4"
          >
            <img
              src={info.sampleImage}
              alt={brandName}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-2xl object-cover border border-gray-100 bg-gray-50 shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-1.5">
              <h2 className="font-black text-gray-900 text-base group-hover:text-blue-700 transition-colors truncate">
                {brandName}
              </h2>
              <p className="text-xs text-gray-500 truncate">
                {Array.from(info.categories).join(' • ')}
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 pt-1">
                <span>{info.count} référence{info.count > 1 ? 's' : ''}</span>
                <span>→</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PromotionsPage: React.FC = () => {
  const { products, promoCodes, addToCart, setSelectedProductForDetail, navigate, showToast, compareList, toggleCompare } = useShop();

  const discountedProducts = products.filter(
    p => (p.oldPrice && p.oldPrice > p.price) || p.tags.includes('Promo')
  );
  const activePromos = promoCodes.filter(p => p.active);

  const copyPromo = (code: string) => {
    navigator.clipboard?.writeText(code);
    showToast(`Code promo ${code} copié ! Appliquez-le dans votre panier.`);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-10">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à la boutique
      </button>

      <div className="bg-gradient-to-r from-blue-900 to-sky-900 text-white rounded-3xl p-8 shadow-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-amber-300 text-xs font-bold rounded-full mb-3">
          <Tag className="w-3.5 h-3.5" /> Offres Officinales &amp; Codes Avantages
        </div>
        <h1 className="text-3xl font-black tracking-tight">Promotions &amp; Bons Plans Myrlan</h1>
        <p className="text-sm text-blue-200 mt-2 max-w-2xl">
          Profitez de nos remises immédiates sur vos soins favoris et copiez nos codes promo actifs en un clic.
        </p>
      </div>

      {/* Active Promo Codes */}
      {activePromos.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" /> Codes Promo Actifs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activePromos.map(promo => (
              <div key={promo.id} className="bg-white rounded-2xl border border-blue-200 p-5 flex flex-col justify-between gap-4 shadow-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-base text-blue-900 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                      {promo.code}
                    </span>
                    <span className="font-black text-lg text-amber-600 tabular-nums">-{promo.discountPercent}%</span>
                  </div>
                  <p className="text-xs text-gray-600 pt-1">{promo.description}</p>
                  {promo.minOrder > 0 && (
                    <p className="text-[11px] font-semibold text-gray-400">Minimum d’achat : {promo.minOrder} €</p>
                  )}
                </div>
                <button
                  onClick={() => copyPromo(promo.code)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Copier le code
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discounted Products */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-gray-900">Produits en Promotion ({discountedProducts.length})</h2>
        {discountedProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center text-sm text-gray-500">
            Aucun produit en promotion directe pour le moment. Utilisez nos codes promo ci-dessus sur tout le catalogue !
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {discountedProducts.map(product => {
              const discountPct = product.oldPrice
                ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
                : 0;
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div
                    onClick={() => setSelectedProductForDetail(product)}
                    className="cursor-pointer"
                  >
                    <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {discountPct > 0 && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 bg-rose-600 text-white text-xs font-black rounded-lg tabular-nums">
                          -{discountPct}%
                        </span>
                      )}
                    </div>
                    <div className="p-5 space-y-1.5">
                      <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">{product.brand}</div>
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-2">{product.name}</h3>
                    </div>
                  </div>
                  <div className="p-5 pt-0 flex items-center justify-between">
                    <div className="flex items-baseline gap-2 tabular-nums">
                      <span className="text-lg font-black text-blue-800">{product.price.toFixed(2)} €</span>
                      {product.oldPrice && (
                        <span className="text-xs text-gray-400 line-through">{product.oldPrice.toFixed(2)} €</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCompare(product.id)}
                        aria-pressed={compareList.includes(product.id)}
                        className={`p-2.5 rounded-xl border transition-colors ${
                          compareList.includes(product.id)
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                        title={compareList.includes(product.id) ? 'Retirer du comparateur' : 'Comparer'}
                      >
                        <Scale className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedProductForDetail(product)}
                        className="p-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
                        title="Voir la fiche"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:bg-gray-300"
                      >
                        <ShoppingBag className="w-4 h-4" /> Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3 text-xs text-blue-900">
        <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
        <span>Toutes nos remises sont cumulables avec la livraison offerte dès 49 € d’achats (hors Chronopost).</span>
      </div>
    </div>
  );
};
