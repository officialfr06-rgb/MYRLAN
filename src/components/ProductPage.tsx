import React, { useState } from 'react';
import { 
  ArrowLeft, Star, ShoppingBag, Heart, ShieldCheck, CheckCircle, 
  AlertTriangle, Share2, Truck, MessageSquare, Sparkles, 
  FlaskConical, Leaf, Microscope, Barcode, Package, Layers, Droplet 
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Product } from '../types';
import { AddReviewModal } from './AddReviewModal';

interface ProductPageProps {
  product: Product;
  onBack: () => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({ product, onBack }) => {
  const { addToCart, wishlist, toggleWishlist, products, setSelectedProductForDetail, showToast } = useShop();
  const [quantity, setQuantity] = useState(1);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const isWishlisted = wishlist.includes(product.id);
  const relatedProducts = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Lien unique du produit copié dans le presse-papier !');
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in fade-in duration-200">
      
      {/* Top Full-Screen Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-xs">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-2xl text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la boutique</span>
        </button>

        <div className="text-xs text-gray-500 font-medium hidden sm:block">
          Accueil / <span className="text-blue-700 font-semibold">{product.category}</span> / <span className="text-gray-900 font-bold">{product.name}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleWishlist(product.id)}
            className={`p-2.5 rounded-xl border transition-all ${isWishlisted ? 'bg-rose-500 text-white border-rose-500' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-gray-900 text-white hover:bg-blue-700 transition-colors text-xs font-bold"
          >
            ✕ Fermer
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* Main Product Master Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Borderless Frameless Image */}
          <div className="lg:col-span-6 space-y-6 lg:sticky lg:top-28">
            <div className="relative aspect-square overflow-hidden group flex items-center justify-center">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 drop-shadow-2xl"
              />
              
              {/* Tags Overlay */}
              <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                {product.tags.map(tag => (
                  <span key={tag} className="px-3 py-1.5 bg-white/95 backdrop-blur-md text-blue-900 text-xs font-black rounded-xl shadow-md border border-blue-100 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    {tag}
                  </span>
                ))}
              </div>

              {/* Share button */}
              <div className="absolute top-6 right-6">
                <button
                  onClick={handleShare}
                  className="p-3 rounded-2xl bg-white/90 backdrop-blur-md text-gray-700 hover:bg-white shadow-lg transition-all"
                  title="Partager"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Deep Professional Details & Purchase */}
          <div className="lg:col-span-6 space-y-8">
            
            <div className="space-y-4 border-b border-gray-200/80 pb-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-widest uppercase text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-200">
                  {product.brand}
                </span>
                <span className="text-xs font-semibold text-gray-400">Code EAN : {product.ean}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-4">
                <div className="flex items-center text-amber-500 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200 font-bold text-xs">
                  <Star className="w-4 h-4 fill-current mr-1" />
                  <span className="text-gray-900">{product.rating} / 5</span>
                </div>
                <span className="text-xs text-blue-700 font-bold underline cursor-pointer" onClick={() => {
                  document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  {product.reviewsCount} avis clients vérifiés
                </span>
              </div>

              <div className="flex items-baseline gap-4 pt-2">
                <span className="text-4xl font-black text-blue-800">{product.price.toFixed(2)} €</span>
                {product.oldPrice && (
                  <span className="text-lg text-gray-400 line-through">{product.oldPrice.toFixed(2)} €</span>
                )}
                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-xl">
                  Contenance : {product.contenance}
                </span>
              </div>

              {/* Stock status indicator */}
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

            {/* Purchase Action Box */}
            <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-gray-200 shadow-xl space-y-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Vendu et expédié par <strong className="text-gray-900">Myrlan Pharmacie</strong></span>
                <span className="text-amber-600 font-black">+{Math.floor(product.price)} points fidélité 🏆</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-2xl overflow-hidden bg-gray-50 shadow-inner">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-4 py-3.5 text-gray-700 hover:bg-gray-200 transition-colors font-bold"
                  >
                    -
                  </button>
                  <span className="px-6 py-3.5 font-black text-base text-gray-900">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    className="px-4 py-3.5 text-gray-700 hover:bg-gray-200 transition-colors font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => addToCart(product, quantity)}
                  disabled={product.stock <= 0}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black text-white shadow-xl transition-all transform hover:-translate-y-0.5 ${
                    product.stock > 0 
                      ? 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 shadow-blue-600/30' 
                      : 'bg-gray-300 cursor-not-allowed shadow-none'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span className="text-base">{product.stock > 0 ? 'Ajouter au panier sécurisé' : 'Rupture de stock'}</span>
                </button>
              </div>

              {/* Reassurance pills */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Expédition en 24h</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Paiement sécurisé SSL</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* FICHE TECHNIQUE OFFICIELLE (EAN, FORMES, PRESENTATION, CONTENANCE) */}
        <div className="bg-gradient-to-br from-blue-900 via-sky-900 to-blue-950 text-white rounded-[36px] shadow-2xl p-8 sm:p-12 space-y-6">
          <div className="flex items-center gap-3 border-b border-blue-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-amber-300 flex items-center justify-center font-bold">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-sky-300">Caractéristiques Officielles</span>
              <h2 className="text-2xl font-black text-white">Fiche Technique du Médicament / Produit</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            <div className="p-5 rounded-2xl bg-blue-950/80 border border-blue-800 space-y-1">
              <div className="flex items-center gap-2 text-sky-300 text-xs font-bold">
                <Barcode className="w-4 h-4" /> Code EAN
              </div>
              <div className="text-lg font-black text-white font-mono">{product.ean}</div>
            </div>

            <div className="p-5 rounded-2xl bg-blue-950/80 border border-blue-800 space-y-1">
              <div className="flex items-center gap-2 text-sky-300 text-xs font-bold">
                <Droplet className="w-4 h-4" /> Forme
              </div>
              <div className="text-base font-bold text-white">{product.form}</div>
            </div>

            <div className="p-5 rounded-2xl bg-blue-950/80 border border-blue-800 space-y-1">
              <div className="flex items-center gap-2 text-sky-300 text-xs font-bold">
                <Package className="w-4 h-4" /> Présentation
              </div>
              <div className="text-base font-bold text-white">{product.presentation}</div>
            </div>

            <div className="p-5 rounded-2xl bg-blue-950/80 border border-blue-800 space-y-1">
              <div className="flex items-center gap-2 text-sky-300 text-xs font-bold">
                <Layers className="w-4 h-4" /> Contenance
              </div>
              <div className="text-base font-bold text-white">{product.contenance}</div>
            </div>
          </div>
        </div>

        {/* RICH SCIENTIFIC & PHARMACEUTICAL DETAILS SECTION */}
        <div className="space-y-12">
          
          {/* Section 1: Presentation & Efficacy */}
          <div className="bg-white rounded-[36px] border border-gray-200 shadow-xl p-8 sm:p-12 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Expertise Laboratoire</span>
                <h2 className="text-2xl font-black text-gray-900">Présentation &amp; Efficacité Clinique</h2>
              </div>
            </div>

            <p className="text-base text-gray-700 leading-relaxed font-light">
              {product.description}
            </p>
          </div>

          {/* Section 2: Key Actives & INCI Formula */}
          <div className="bg-white rounded-[36px] border border-gray-200 shadow-xl p-8 sm:p-12 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Microscope className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Composition &amp; Actifs Majeurs</span>
                <h2 className="text-2xl font-black text-gray-900">Formule INCI Rigoureusement Sélectionnée</h2>
              </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-200 font-mono text-xs text-gray-700 leading-loose shadow-inner">
              {product.ingredients.join(' • ')}
            </div>
          </div>

          {/* Section 3: Pharmacist Application Ritual */}
          <div className="bg-white rounded-[36px] border border-gray-200 shadow-xl p-8 sm:p-12 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Conseils d'Officine</span>
                <h2 className="text-2xl font-black text-gray-900">Rituel d'Application &amp; Posologie</h2>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-gray-50 border border-gray-200 text-base text-gray-800 leading-relaxed font-medium">
              {product.usage}
            </div>
          </div>

          {/* Section 4: Verified Patient Reviews */}
          <div id="reviews-section" className="bg-white rounded-[36px] border border-gray-200 shadow-xl p-8 sm:p-12 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-gray-200 pb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Avis Certifiés</span>
                <h2 className="text-2xl font-black text-gray-900">Témoignages &amp; Évaluations Patients</h2>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Laisser un avis vérifié</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-gray-900">Dr. Hélène B. (Professionnel de santé)</span>
                  <span className="text-amber-400 text-sm">★★★★★</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">"Je recommande régulièrement ce produit à mes patients dans le cadre de leur routine quotidienne. Excellente tolérance et résultats visibles."</p>
                <div className="text-[10px] text-gray-400">Avis vérifié Myrlan Pharma</div>
              </div>

              <div className="p-6 rounded-3xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-gray-900">Marc V. (Achat vérifié)</span>
                  <span className="text-amber-400 text-sm">★★★★★</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">"Colis reçu en 24h chronopost, emballage irréprochable. Le produit correspond exactement à mes attentes."</p>
                <div className="text-[10px] text-gray-400">Avis vérifié Myrlan Pharma</div>
              </div>
            </div>
          </div>

        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="space-y-8 pt-8 border-t border-gray-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Routine Associée</span>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mt-1">Produits complémentaires recommandés</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedProducts.map(rel => (
                <div 
                  key={rel.id}
                  onClick={() => setSelectedProductForDetail(rel)}
                  className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-2xl transition-all cursor-pointer group p-5 space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-3">
                      <img src={rel.image} alt={rel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{rel.brand}</div>
                    <h4 className="font-bold text-gray-900 text-xs line-clamp-2 hover:text-blue-600">{rel.name}</h4>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="font-black text-blue-800 text-lg">{rel.price.toFixed(2)} €</span>
                    <span className="text-xs text-blue-600 font-bold group-hover:underline">Découvrir →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Modal */}
        {isReviewModalOpen && (
          <AddReviewModal product={product} onClose={() => setIsReviewModalOpen(false)} />
        )}

      </div>
    </div>
  );
};
