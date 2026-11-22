import React, { useState } from 'react';
import {
  BookOpen, ArrowLeft, Clock, UserCheck, ShoppingBag, Eye, Sparkles
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

interface Article {
  id: string;
  category: string;
  title: string;
  date: string;
  readTime: string;
  author: string;
  summary: string;
  sections: { heading: string; body: string }[];
  relatedKeywords: string[];
}

const HEALTH_ARTICLES: Article[] = [
  {
    id: 'hyaluronic-acid',
    category: 'Dermo-Cosmétique',
    title: 'Comment bien choisir et appliquer son sérum à l’acide hyaluronique ?',
    date: '18 novembre 2026',
    readTime: '4 min de lecture',
    author: 'Dr. Claire Moreau, Pharmacienne',
    summary: 'Poids moléculaire, concentration idéale et gestes d’application pour une peau visiblement repulpée sans tiraillement.',
    sections: [
      {
        heading: 'Haut poids vs bas poids moléculaire : quelle différence ?',
        body: 'L’acide hyaluronique de haut poids moléculaire reste en surface pour former un voile hydratant protecteur immédiat. Celui de bas poids moléculaire pénètre plus profondément dans l’épiderme pour stimuler la souplesse cutanée et lisser les ridules de déshydratation.'
      },
      {
        heading: 'La règle d’or : l’appliquer sur peau humide',
        body: 'Molécule hygroscopique capable de retenir jusqu’à 1 000 fois son poids en eau, l’acide hyaluronique donne de meilleurs résultats lorsqu’il est appliqué sur une peau légèrement brumisée, suivi immédiatement d’une crème hydratante pour sceller l’hydratation.'
      },
      {
        heading: 'Compatibilité avec les autres actifs',
        body: 'Il s’associe sans risque avec la vitamine C le matin, le rétinol le soir et la niacinamide pour apaiser les rougeurs des peaux sensibles.'
      }
    ],
    relatedKeywords: ['Hyaluronique', 'Sérum', 'Visage']
  },
  {
    id: 'uv-protection',
    category: 'Protection Solaire',
    title: 'Protéger sa peau des UVA et UVB toute l’année : le guide officinal',
    date: '10 novembre 2026',
    readTime: '5 min de lecture',
    author: 'Dr. Claire Moreau, Pharmacienne',
    summary: 'Pourquoi les UVA traversent les nuages et les vitres, et comment choisir un SPF 50+ agréable au quotidien.',
    sections: [
      {
        heading: 'UVA, UVB et lumière bleue',
        body: 'Si les UVB sont responsables des coups de soleil en été, les UVA représentent 95% des UV qui atteignent la surface terrestre toute l’année. Ils pénètrent jusqu’au derme et accélèrent le photovieillissement et les taches pigmentaires.'
      },
      {
        heading: 'Quelle quantité appliquer réellement ?',
        body: 'Pour obtenir la protection affichée sur le flacon (SPF 50+), la règle des deux doigts sur le visage et le cou reste la référence dermatologique. Renouvelez toutes les 2 heures en cas d’exposition directe.'
      }
    ],
    relatedKeywords: ['Solaire', 'SPF']
  },
  {
    id: 'magnesium-fatigue',
    category: 'Micronutrition',
    title: 'Fatigue passagère, stress et sommeil : bien réussir sa cure de magnésium',
    date: '4 novembre 2026',
    readTime: '4 min de lecture',
    author: 'Dr. Thomas Girard, Pharmacien',
    summary: 'Comment distinguer les sels de magnésium (marin, bisglycinate) et l’importance des cofacteurs B6 et taurine.',
    sections: [
      {
        heading: 'Pourquoi la vitamine B6 est-elle indispensable ?',
        body: 'La vitamine B6 facilite l’absorption cellulaire du magnésium et participe à la synthèse des neurotransmetteurs impliqués dans la détente nerveuse. Une cure efficace s’étend généralement sur 1 à 3 mois.'
      },
      {
        heading: 'Tolérance digestive et moment de prise',
        body: 'Privilégiez la prise au cours du repas du matin ou du midi avec un grand verre d’eau pour optimiser l’assimilation et éviter tout inconfort digestif.'
      }
    ],
    relatedKeywords: ['Magnésium', 'Kératine', 'Complément']
  },
  {
    id: 'baby-skin',
    category: 'Bébé & Maman',
    title: 'Prendre soin de la peau fragile du nourrisson dès la naissance',
    date: '29 octobre 2026',
    readTime: '3 min de lecture',
    author: 'Sophie Laurent, Préparatrice',
    summary: 'Les réflexes simples pour préserver le film hydrolipidique immature des tout-petits lors du bain et de l’hydratation.',
    sections: [
      {
        heading: 'Des formules minimalistes sans parfum agressif',
        body: 'La peau du bébé est plus fine et plus perméable que celle de l’adulte. Choisissez des soins lavants sans savon à pH physiologique et des laits corporels enrichis en calendula ou amande douce.'
      },
      {
        heading: 'Température du bain et séchage',
        body: 'Maintenez l’eau autour de 37°C, limitez le bain à 5–10 minutes et séchez en tamponnant délicatement avant d’appliquer un lait hydratant.'
      }
    ],
    relatedKeywords: ['Bébé', 'Douche', 'Micellaire']
  }
];

export const AdviceBlogPage: React.FC = () => {
  const { products, addToCart, navigate, setSelectedProductForDetail } = useShop();
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [selectedArticleId, setSelectedArticleId] = useState<string>(HEALTH_ARTICLES[0].id);

  const categories = ['Tous', ...Array.from(new Set(HEALTH_ARTICLES.map(a => a.category)))];
  const visibleArticles = selectedCategory === 'Tous'
    ? HEALTH_ARTICLES
    : HEALTH_ARTICLES.filter(a => a.category === selectedCategory);

  const activeArticle = visibleArticles.find(a => a.id === selectedArticleId) || visibleArticles[0];

  const relatedProducts = activeArticle
    ? products.filter(p =>
        activeArticle.relatedKeywords.some(kw =>
          `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(kw.toLowerCase())
        )
      ).slice(0, 3)
    : [];

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à la boutique
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-sky-900 text-white rounded-3xl p-8 shadow-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-sky-200 text-xs font-bold rounded-full mb-3">
          <BookOpen className="w-3.5 h-3.5" /> Dossiers Rédigés par nos Pharmaciens
        </div>
        <h1 className="text-3xl font-black tracking-tight">Conseils Santé, Beauté &amp; Prévention</h1>
        <p className="text-sm text-blue-200 mt-2 max-w-2xl">
          Des guides pratiques et fiables pour comprendre vos actifs, ajuster votre routine dermo-cosmétique et optimiser votre bien-être au quotidien.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              const first = (cat === 'Tous' ? HEALTH_ARTICLES : HEALTH_ARTICLES.filter(a => a.category === cat))[0];
              if (first) setSelectedArticleId(first.id);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Split Layout: Article Selector + Full Article */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-3">
          {visibleArticles.map(art => (
            <button
              key={art.id}
              onClick={() => setSelectedArticleId(art.id)}
              className={`w-full text-left p-5 rounded-2xl border transition-all space-y-2 ${
                activeArticle?.id === art.id
                  ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-blue-700 uppercase tracking-wider">{art.category}</span>
                <span className="text-gray-400">{art.readTime}</span>
              </div>
              <h2 className="font-bold text-gray-900 text-sm leading-snug">{art.title}</h2>
              <p className="text-xs text-gray-500 line-clamp-2">{art.summary}</p>
            </button>
          ))}
        </div>

        {activeArticle && (
          <div className="lg:col-span-8 space-y-6">
            <article className="bg-white rounded-3xl border border-gray-200 p-8 space-y-6 shadow-xs">
              <div className="space-y-3 border-b border-gray-100 pb-6">
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-800 font-bold rounded-lg">{activeArticle.category}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {activeArticle.readTime}</span>
                  <span>• {activeArticle.date}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">{activeArticle.title}</h2>
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                  <UserCheck className="w-4 h-4" /> Relu et validé par {activeArticle.author}
                </div>
              </div>

              <p className="text-sm text-gray-700 font-medium bg-gray-50 p-4 rounded-2xl border border-gray-100">
                {activeArticle.summary}
              </p>

              <div className="space-y-6">
                {activeArticle.sections.map((sec, idx) => (
                  <section key={idx} className="space-y-2">
                    <h3 className="text-base font-black text-gray-900">{sec.heading}</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{sec.body}</p>
                  </section>
                ))}
              </div>
            </article>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4">
                <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" /> Sélection recommandée pour cette fiche
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedProducts.map(prod => (
                    <div key={prod.id} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between gap-3">
                      <div
                        onClick={() => setSelectedProductForDetail(prod)}
                        className="cursor-pointer space-y-2"
                      >
                        <img src={prod.image} alt={prod.name} className="w-full aspect-square object-cover rounded-xl bg-white" />
                        <div className="text-[10px] font-bold text-blue-700 uppercase">{prod.brand}</div>
                        <h4 className="font-bold text-gray-900 text-xs line-clamp-2">{prod.name}</h4>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200/70">
                        <span className="font-black text-blue-800 text-sm tabular-nums">{prod.price.toFixed(2)} €</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setSelectedProductForDetail(prod)}
                            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                            title="Voir la fiche"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => addToCart(prod)}
                            disabled={prod.stock <= 0}
                            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
                            title="Ajouter au panier"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
