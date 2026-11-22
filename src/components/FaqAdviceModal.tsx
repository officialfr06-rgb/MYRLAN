import React, { useState } from 'react';
import { X, HelpCircle, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const FaqAdviceModal: React.FC = () => {
  const { isFaqOpen, setIsFaqOpen, navigate } = useShop();
  const [activeTab, setActiveTab] = useState<'faq' | 'advice'>('faq');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  if (!isFaqOpen) return null;

  const faqs = [
    {
      q: 'Quels sont les délais de livraison chez Myrlan ?',
      a: 'Les commandes sont préparées et expédiées en 24h ouvrées. La livraison standard Colissimo prend 48h à 72h. La livraison Chronopost express est livrée en 24h.'
    },
    {
      q: 'Comment fonctionne le programme de fidélité ?',
      a: 'Pour chaque euro dépensé sur le site, vous cumulez 1 point fidélité. Vos points vous permettent de débloquer des bons d\'achat, des cadeaux ou la livraison express offerte.'
    },
    {
      q: 'Les paiements en ligne sont-ils sécurisés ?',
      a: 'Absolument. Toutes les transactions sur Myrlan sont cryptées via le protocole SSL (Secure Sockets Layer) et gérées par des partenaires de paiement certifiés (CB, Visa, Mastercard, PayPal, Apple Pay).'
    },
    {
      q: 'Comment contacter un pharmacien conseil ?',
      a: 'Vous pouvez utiliser notre module de messagerie instantanée en bas de page pour échanger directement avec nos pharmaciens diplômés 6j/7.'
    }
  ];

  const articles = [
    {
      title: 'Comment bien choisir son sérum à l\'acide hyaluronique ?',
      date: '18 novembre 2026',
      read: '3 min de lecture',
      content: 'L\'acide hyaluronique est l\'actif incontournable pour maintenir l\'hydratation et repulper la peau. Il est recommandé de l\'appliquer sur une peau légèrement humide avant votre crème hydratante...'
    },
    {
      title: 'Protéger sa peau des UV en toute saison',
      date: '10 novembre 2026',
      read: '4 min de lecture',
      content: 'Les rayons UVA et UVB traversent les nuages et accélèrent le vieillissement cutané. L\'application quotidienne d\'une crème solaire SPF 50+ protège efficacement votre capital jeunesse...'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-900 to-sky-900 text-white">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-sky-300" />
            <h2 className="font-bold text-lg">Centre d'Aide &amp; Conseils d'Experts</h2>
          </div>
          <button 
            onClick={() => setIsFaqOpen(false)}
            className="p-2 text-blue-200 hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6">
          <button
            onClick={() => setActiveTab('faq')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-colors ${activeTab === 'faq' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500'}`}
          >
            Foire Aux Questions (FAQ)
          </button>
          <button
            onClick={() => setActiveTab('advice')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-colors ${activeTab === 'advice' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500'}`}
          >
            Fiches Conseils Pharmacien
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'faq' && (
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50/50">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full p-4 text-left font-bold text-xs text-gray-900 flex justify-between items-center gap-4 hover:bg-gray-100 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {openFaqIndex === idx ? <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                  </button>
                  {openFaqIndex === idx && (
                    <div className="p-4 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-200/60 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'advice' && (
            <div className="space-y-4">
              {articles.map((art, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-2">
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                    <span>{art.date}</span>
                    <span className="text-blue-600">{art.read}</span>
                  </div>
                  <h3 className="font-bold text-sm text-gray-900">{art.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{art.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => { setIsFaqOpen(false); navigate('/livraison-retours'); }}
            className="text-xs font-bold text-blue-700 hover:underline"
          >
            Voir les tarifs Livraison &amp; Retours →
          </button>
          <button
            onClick={() => { setIsFaqOpen(false); navigate('/conseils'); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
          >
            Lire tous les dossiers Conseils Santé
          </button>
        </div>

      </div>
    </div>
  );
};
