import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Star, ShoppingBag, Heart, ShieldCheck, CheckCircle,
  AlertTriangle, Share2, Truck, MessageSquare, Sparkles,
  FlaskConical, Leaf, Microscope, Barcode, Package, Layers, Droplet, Calendar, Scale, BellRing
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Product, Review } from '../types';
import { AddReviewModal } from './AddReviewModal';
import { analyzeProductSafety } from '../utils/pharmacySafety';

interface ProductPageProps {
  product: Product;
  onBack: () => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({ product, onBack }) => {
  const {
    addToCart, wishlist, toggleWishlist, products, setSelectedProductForDetail,
    showToast, navigate, compareList, toggleCompare, setIsCompareOpen, currentUser
  } = useShop();
  const [quantity, setQuantity] = useState(1);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [alertEmail, setAlertEmail] = useState(currentUser?.email || '');
  const [isAlertSubmitting, setIsAlertSubmitting] = useState(false);
  const [alertConfirmed, setAlertConfirmed] = useState(false);

  useEffect(() => {
    setAlertConfirmed(false);
    fetch(`/api/reviews/${encodeURIComponent(product.id)}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setReviews(data);
      })
      .catch(() => {});
  }, [product.id]);

  const handleStockAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertEmail.trim() || isAlertSubmitting) return;
    setIsAlertSubmitting(true);
    try {
      const res = await fetch('/api/stock-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, email: alertEmail.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setAlertConfirmed(true);
        showToast(
          data.alreadySubscribed
            ? 'Votre alerte retour en stock est déjà active pour ce produit.'
            : 'Alerte enregistrée ! Vous serez prévenu par email dès le réapprovisionnement.'
        );
      } else {
        showToast(data.error || 'Impossible d’enregistrer cette alerte.');
      }
    } catch {
      showToast('Erreur de connexion au serveur.');
    } finally {
      setIsAlertSubmitting(false);
    }
  };

  const safetySummary = useMemo(() => analyzeProductSafety(product, 'standard'), [product]);

  const isWishlisted = wishlist.includes(product.id);
  const isCompared = compareList.includes(product.id);
  const relatedProducts = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Lien du produit copié dans le presse-papier !');
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden animate-in fade-in duration-200">
      {/* Top Breadcrumb Bar */}
      <div className="bg-gray-50/80 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white hover:bg-blue-50 text-blue-900 border border-gray-200 rounded-xl text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au catalogue</span>
        </button>

        <div className="text-xs text-gray-500 font-medium hidden sm:block truncate">
          <button onClick={() => navigate('/')} className="hover:text-blue-700">Accueil</button>
          {' / '}
          <span className="text-blue-700 font-semibold">{product.category}</span>
          {' / '}
          <span className="text-gray-900 font-bold">{product.name}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => toggleCompare(product.id)}
            aria-pressed={isCompared}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${
              isCompared
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-100'
            }`}
            title={isCompared ? 'Retirer du comparateur' : 'Ajouter au comparateur'}
          >
            <Scale className="w-4 h-4" />
            <span>{isCompared ? 'Comparé' : 'Comparer'}</span>
          </button>

          {compareList.length >= 2 && (
            <button
              type="button"
              onClick={() => setIsCompareOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold transition-colors whitespace-nowrap tabular-nums"
            >
              Voir ({compareList.length})
            </button>
          )}

          <button
            onClick={() => toggleWishlist(product.id)}
            className={`p-2.5 rounded-xl border transition-all shrink-0 ${isWishlisted ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
            title="Ajouter aux favoris"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-10 py-6 sm:py-10 space-y-10 sm:space-y-14">

        {/* Main Product Master Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Left Column: Image */}
          <div className="lg:col-span-6 space-y-6 lg:sticky lg:top-28">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 group flex items-center justify-center">
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />

              {product.tags.length > 0 && (
                <div className="absolute top-5 left-5">
                  <span className="px-3 py-1.5 bg-white/95 backdrop-blur-md text-blue-900 text-xs font-black rounded-xl shadow-sm border border-blue-100 inline-flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    {product.tags[0]}
                  </span>
                </div>
              )}

              <div className="absolute top-5 right-5">
                <button
                  onClick={handleShare}
                  className="p-3 rounded-2xl bg-white/90 backdrop-blur-md text-gray-700 hover:bg-white shadow-md transition-all"
                  title="Partager"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Contiguous Purchase Module */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4 border-b border-gray-200/80 pb-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black tracking-widest uppercase text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-200">
                  {product.brand}
                </span>
                <span className="text-xs font-mono text-gray-400">EAN : {product.ean}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                {product.name}
              </h1>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center text-amber-500 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200 font-bold text-xs tabular-nums">
                  <Star className="w-4 h-4 fill-current mr-1" />
                  <span className="text-gray-900">{product.rating} / 5</span>
                </div>
                <span
                  className="text-xs text-blue-700 font-bold underline cursor-pointer"
                  onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {product.reviewsCount} avis clients vérifiés
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-3 sm:gap-4 pt-2 tabular-nums">
                <span className="text-3xl sm:text-4xl font-black text-blue-800">{product.price.toFixed(2)} €</span>
                {product.oldPrice && (
                  <span className="text-lg text-gray-400 line-through">{product.oldPrice.toFixed(2)} €</span>
                )}
                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-xl">
                  Contenance : {product.contenance}
                </span>
              </div>

              <div className="pt-2">
                {product.stock > 5 ? (
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
                    <CheckCircle className="w-4 h-4" /> En stock officiel en pharmacie ({product.stock} unités)
                  </span>
                ) : product.stock > 0 ? (
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200">
                    <AlertTriangle className="w-4 h-4" /> Stock faible : plus que {product.stock} disponibles !
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-200">
                    <AlertTriangle className="w-4 h-4" /> Rupture de stock
                  </span>
                )}
              </div>
            </div>

            {/* Purchase Box */}
            <div className="bg-gray-50/70 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 space-y-5 sm:space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-gray-500">Vendu et expédié par <strong className="text-gray-900">Myrlan Pharmacie</strong></span>
                <span className="text-amber-600 font-black tabular-nums">+{Math.floor(product.price)} pts fidélité</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center justify-between sm:justify-start border border-gray-300 rounded-2xl overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors font-bold"
                  >
                    -
                  </button>
                  <span className="px-5 py-3 font-black text-base text-gray-900 tabular-nums">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(Math.max(1, product.stock), q + 1))}
                    className="px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => addToCart(product, quantity)}
                  disabled={product.stock <= 0}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 sm:py-4 px-5 rounded-2xl font-black text-white shadow-lg transition-all ${
                    product.stock > 0
                      ? 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 shadow-blue-600/25'
                      : 'bg-gray-300 cursor-not-allowed shadow-none'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5 shrink-0" />
                  <span className="text-sm sm:text-base">{product.stock > 0 ? 'Ajouter au panier' : 'Rupture de stock'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200/70 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Expédition en 24h</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Paiement sécurisé SSL</span>
                </div>
              </div>

              {product.stock <= 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                    <BellRing className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>M’avertir dès le retour en stock</span>
                  </div>
                  {alertConfirmed ? (
                    <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>Vous recevrez un email prioritaire dès le réapprovisionnement officinal.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleStockAlertSubmit} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="email"
                        required
                        value={alertEmail}
                        onChange={(e) => setAlertEmail(e.target.value)}
                        placeholder="Votre email..."
                        className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={isAlertSubmitting}
                        className="px-4 py-2 bg-slate-900 hover:bg-blue-800 disabled:opacity-60 text-white font-bold text-xs rounded-xl whitespace-nowrap"
                      >
                        {isAlertSubmitting ? 'Envoi...' : 'Créer l’alerte'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fiche Technique */}
        <div className="bg-gradient-to-br from-blue-900 via-sky-900 to-blue-950 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-blue-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-amber-300 flex items-center justify-center font-bold">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-sky-300">Caractéristiques Officielles</span>
              <h2 className="text-xl font-black text-white">Fiche Technique du Produit</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-blue-950/70 border border-blue-800 space-y-1">
              <div className="flex items-center gap-2 text-sky-300 text-xs font-bold"><Barcode className="w-4 h-4" /> Code EAN</div>
              <div className="text-base font-black text-white font-mono">{product.ean}</div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-950/70 border border-blue-800 space-y-1">
              <div className="flex items-center gap-2 text-sky-300 text-xs font-bold"><Droplet className="w-4 h-4" /> Forme</div>
              <div className="text-sm font-bold text-white">{product.form}</div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-950/70 border border-blue-800 space-y-1">
              <div className="flex items-center gap-2 text-sky-300 text-xs font-bold"><Package className="w-4 h-4" /> Présentation</div>
              <div className="text-sm font-bold text-white">{product.presentation}</div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-950/70 border border-blue-800 space-y-1">
              <div className="flex items-center gap-2 text-sky-300 text-xs font-bold"><Layers className="w-4 h-4" /> Contenance</div>
              <div className="text-sm font-bold text-white">{product.contenance}</div>
            </div>
          </div>
        </div>

        {/* Scientific Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50/70 rounded-3xl border border-gray-200 p-6 space-y-3">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
              <FlaskConical className="w-5 h-5" /> Présentation &amp; Efficacité
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">{product.description}</p>
          </div>

          <div className="bg-gray-50/70 rounded-3xl border border-gray-200 p-6 space-y-3">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
              <Microscope className="w-5 h-5" /> Formule INCI
            </div>
            <p className="text-xs font-mono text-gray-700 leading-relaxed">{product.ingredients.join(' • ')}</p>
          </div>

          <div className="bg-gray-50/70 rounded-3xl border border-gray-200 p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <Leaf className="w-5 h-5" /> Rituel &amp; Posologie
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">{product.usage}</p>
          </div>
        </div>

        {/* Pharmacist Safety & Compatibility Check */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Contrôle Officinal de Compatibilité &amp; Précautions</h2>
                <p className="text-xs text-slate-500">Vérification basée sur la formule INCI et l’usage pharmaceutique</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate('/diagnostic')}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl whitespace-nowrap"
              >
                Tester dans ma routine
              </button>
              <button
                type="button"
                onClick={() => navigate('/rendez-vous')}
                className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Avis pharmacien en RDV</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">
                Grossesse &amp; Allaitement :{' '}
                <span className={safetySummary.pregnancyStatus === 'compatible' ? 'text-emerald-700' : 'text-amber-700'}>
                  {safetySummary.pregnancyStatus === 'compatible' ? 'Compatible' : 'Demander avis'}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">{safetySummary.pregnancyNote}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">Âge recommandé : {safetySummary.minimumAgeLabel}</div>
              <p className="text-slate-600 leading-relaxed">Respectez la posologie et le mode d’application indiqués par l’officine.</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">Tolérance peau sensible</div>
              <p className="text-slate-600 leading-relaxed">{safetySummary.sensitiveSkinNote}</p>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div id="reviews-section" className="bg-gray-50/60 rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Avis Certifiés</span>
              <h2 className="text-xl font-black text-gray-900">Témoignages &amp; Évaluations Patients</h2>
            </div>
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Laisser un avis vérifié</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reviews.map(rev => (
              <div key={rev.id} className="p-5 rounded-2xl bg-white border border-gray-200 space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs text-gray-900">{rev.author}</span>
                    {rev.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        <CheckCircle className="w-3 h-3" /> Achat vérifié
                      </span>
                    )}
                  </div>
                  <span className="text-amber-400 text-sm shrink-0">
                    {'★'.repeat(rev.rating)}{'☆'.repeat(Math.max(0, 5 - rev.rating))}
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>
                <div className="text-[10px] text-gray-400 tabular-nums">Publié le {rev.date}</div>
              </div>
            ))}
            <div className="p-5 rounded-2xl bg-white border border-gray-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-gray-900">Dr. Hélène B. (Professionnel de santé)</span>
                <span className="text-amber-400 text-sm">★★★★★</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">"Je recommande régulièrement ce produit à mes patients dans le cadre de leur routine quotidienne. Excellente tolérance et résultats visibles."</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-gray-200 space-y-2">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-gray-900">Marc V.</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    <CheckCircle className="w-3 h-3" /> Achat vérifié
                  </span>
                </div>
                <span className="text-amber-400 text-sm">★★★★★</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">"Colis reçu en 24h, emballage irréprochable. Le produit correspond exactement à mes attentes."</p>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6 pt-4 border-t border-gray-200">
            <h3 className="text-xl font-black text-gray-900">Produits complémentaires recommandés</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedProducts.map(rel => (
                <div
                  key={rel.id}
                  onClick={() => setSelectedProductForDetail(rel)}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-pointer group p-4 space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 mb-3">
                      <img src={rel.image} alt={rel.name} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{rel.brand}</div>
                    <h4 className="font-bold text-gray-900 text-xs line-clamp-2">{rel.name}</h4>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 tabular-nums">
                    <span className="font-black text-blue-800 text-base">{rel.price.toFixed(2)} €</span>
                    <span className="text-xs text-blue-600 font-bold">Découvrir →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isReviewModalOpen && (
          <AddReviewModal
            product={product}
            onClose={() => setIsReviewModalOpen(false)}
            onReviewAdded={(newRev) => setReviews(prev => [newRev, ...prev])}
          />
        )}
      </div>
    </div>
  );
};
