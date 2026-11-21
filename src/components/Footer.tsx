import React from 'react';
import { Store, ShieldCheck, Truck, Award, Heart, Mail } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const Footer: React.FC = () => {
  const { 
    showToast, 
    setIsOrderTrackingOpen, 
    setIsLoyaltyOpen, 
    setIsFaqOpen, 
    setIsChatOpen, 
    setIsLegalOpen 
  } = useShop();

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Merci pour votre inscription à notre newsletter santé & bien-être !');
  };

  return (
    <footer className="bg-blue-950 text-blue-100 border-t border-blue-900 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Newsletter box */}
        <div className="bg-gradient-to-r from-blue-900 to-sky-900 rounded-3xl p-8 border border-blue-800/80 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center lg:text-left">
            <h3 className="text-2xl font-black text-white">Rejoignez la communauté Myrlan</h3>
            <p className="text-blue-200 text-sm">Recevez nos conseils d'experts en parapharmacie, ventes privées et -10% sur votre première commande.</p>
          </div>
          <form onSubmit={handleNewsletter} className="flex w-full lg:w-auto gap-2">
            <div className="relative flex-1 lg:w-80">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="Votre adresse email..."
                className="w-full pl-10 pr-4 py-3 bg-blue-950/80 border border-blue-700 rounded-xl text-sm text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-blue-950 font-bold rounded-xl text-sm transition-all shadow-md shrink-0"
            >
              S'inscrire
            </button>
          </form>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white">
                <Store className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">Myrlan</span>
            </div>
            <p className="text-xs text-blue-300 leading-relaxed">
              Votre parapharmacie en ligne agréée. Large sélection de produits de santé, beauté, bio et compléments alimentaires au meilleur prix.
            </p>
            <div className="text-xs text-blue-400 font-medium">
              Pharmacie française diplômée • 24/7
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Rayons &amp; Catégories</h4>
            <ul className="space-y-2.5 text-xs text-blue-300">
              <li><a href="#catalog-section" className="hover:text-white transition-colors">Soin Visage &amp; Anti-âge</a></li>
              <li><a href="#catalog-section" className="hover:text-white transition-colors">Solaire &amp; Protection</a></li>
              <li><a href="#catalog-section" className="hover:text-white transition-colors">Compléments Alimentaires</a></li>
              <li><a href="#catalog-section" className="hover:text-white transition-colors">Bébé &amp; Maman</a></li>
              <li><a href="#catalog-section" className="hover:text-white transition-colors">Bio &amp; Naturel</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Service Client &amp; Aide</h4>
            <ul className="space-y-2.5 text-xs text-blue-300">
              <li>
                <button onClick={() => setIsOrderTrackingOpen(true)} className="hover:text-white transition-colors text-left">
                  Suivi de commande
                </button>
              </li>
              <li>
                <button onClick={() => setIsFaqOpen(true)} className="hover:text-white transition-colors text-left">
                  Livraison &amp; Retours
                </button>
              </li>
              <li>
                <button onClick={() => setIsLoyaltyOpen(true)} className="hover:text-white transition-colors text-left">
                  Programme Fidélité Club
                </button>
              </li>
              <li>
                <button onClick={() => setIsFaqOpen(true)} className="hover:text-white transition-colors text-left">
                  Questions fréquentes (FAQ)
                </button>
              </li>
              <li>
                <button onClick={() => setIsChatOpen(true)} className="hover:text-white transition-colors text-left">
                  Contactez un pharmacien
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Sécurité &amp; Engagements</h4>
            <ul className="space-y-3 text-xs text-blue-300">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Paiement 100% sécurisé SSL</span>
              </li>
              <li className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Livraison offerte dès 49 €</span>
              </li>
              <li className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-300 shrink-0" />
                <span>100% Produits officiels garantis</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-blue-900 flex flex-col sm:flex-row items-center justify-between text-xs text-blue-400 gap-4">
          <div>
            &copy; 2026 Myrlan. Tous droits réservés • Parapharmacie en ligne.
          </div>
          <div className="flex gap-6">
            <button onClick={() => setIsLegalOpen(true)} className="hover:text-white transition-colors">Mentions Légales</button>
            <button onClick={() => setIsLegalOpen(true)} className="hover:text-white transition-colors">Politique de Confidentialité</button>
            <button onClick={() => setIsLegalOpen(true)} className="hover:text-white transition-colors">Gestion des Cookies</button>
          </div>
        </div>

      </div>
    </footer>
  );
};
