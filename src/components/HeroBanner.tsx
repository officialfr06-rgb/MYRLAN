import React from 'react';
import { Sparkles, ShieldCheck, Truck, RefreshCw, Award, ArrowRight, Calendar } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const HeroBanner: React.FC = () => {
  const { navigate } = useShop();

  return (
    <div className="bg-gradient-to-br from-blue-900 via-sky-900 to-blue-950 text-white relative overflow-hidden rounded-2xl sm:rounded-3xl">
      {/* Background decorative glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-800/80 border border-blue-600/50 text-blue-200 text-[11px] sm:text-xs font-semibold backdrop-blur-sm max-w-full">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate">Nouveau : Diagnostic beauté &amp; santé par IA</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Votre santé et votre beauté <span className="bg-gradient-to-r from-blue-200 via-sky-200 to-amber-200 bg-clip-text text-transparent">expertes au quotidien</span>
            </h1>

            <p className="text-lg text-blue-100/90 max-w-2xl mx-auto lg:mx-0 font-light">
              Commandez vos produits de parapharmacie de grandes marques au meilleur prix. Stock en temps réel, conseils de pharmaciens diplômés et livraison express sécurisée.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={() => navigate('/diagnostic')}
                className="px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-blue-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>Créer ma routine sur-mesure</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/rendez-vous')}
                className="px-5 py-3.5 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-xl border border-white/25 backdrop-blur-sm transition-all flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-amber-300" />
                <span>Prendre RDV en officine</span>
              </button>
              
              <button
                onClick={() => {
                  const catalogElem = document.getElementById('catalog-section');
                  catalogElem?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 backdrop-blur-sm transition-all"
              >
                Explorer le catalogue
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-sky-400 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
              <div className="relative bg-blue-900/40 border border-blue-700/50 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800" 
                    alt="Produits de parapharmacie et soins" 
                    className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/95 via-blue-950/30 to-transparent flex flex-col justify-end p-6 space-y-2">
                    <span className="px-3 py-1 bg-sky-500/30 backdrop-blur-md text-sky-200 text-xs font-bold rounded-full w-fit border border-sky-400/30">
                      Garantie Officielle Pharmacie
                    </span>
                    <h3 className="text-xl font-black text-white tracking-tight">Soins d'Excellence &amp; Bien-être</h3>
                    <p className="text-xs text-blue-200">Livraison offerte dès 49€ • Expédié en 24h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Trust Badges Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6 mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-blue-800/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-800/80 flex items-center justify-center text-blue-300 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Livraison Express</h3>
              <p className="text-xs text-blue-300">Expédié en 24h ouvrées</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-800/80 flex items-center justify-center text-blue-300 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Paiement Sécurisé</h3>
              <p className="text-xs text-blue-300">CB, PayPal, Apple Pay, Mobile</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-800/80 flex items-center justify-center text-blue-300 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Club Fidélité</h3>
              <p className="text-xs text-blue-300">Gagnez des points à chaque achat</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-800/80 flex items-center justify-center text-blue-300 shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Retours Gratuits</h3>
              <p className="text-xs text-blue-300">Sous 14 jours garantis</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
