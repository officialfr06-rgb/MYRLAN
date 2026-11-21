import React, { useState } from 'react';
import { X, Sparkles, ShoppingBag, CheckCircle, ArrowRight, Bot } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useShop } from '../context/ShopContext';

export const AiAdvisorModal: React.FC = () => {
  const { isAiAdvisorOpen, setIsAiAdvisorOpen, products, addToCart } = useShop();
  
  const [skinType, setSkinType] = useState('Mixte à sensible');
  const [concern, setConcern] = useState('Hydratation & Éclat');
  const [ageGroup, setAgeGroup] = useState('25-35 ans');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  if (!isAiAdvisorOpen) return null;

  const handleGenerateRoutine = async () => {
    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (window as any).__ENV__?.GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback simulation if no API key
        setTimeout(() => {
          setAiResponse(`En tant que pharmacien expert Myrlan, voici votre routine personnalisée pour une peau ${skinType} (${ageGroup}) ciblant ${concern} :
1. Nettoyage doux : Gel Nettoyant Purifiant matin et soir.
2. Traitement intense : Sérum Hydratant Acide Hyaluronique Pur.
3. Protection quotidienne : Crème Solaire SPF 50+.
Cette routine va restaurer l'éclat de votre peau tout en respectant sa sensibilité.`);
          setLoading(false);
        }, 1000);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Agis en tant que pharmacien et expert en parapharmacie. Recommande une routine de soins adaptée pour un client ayant une peau de type "${skinType}", dans la tranche d'âge "${ageGroup}", et ayant pour préoccupation principale "${concern}". Donne des conseils d'application professionnels et suggère des types de produits parapharmaceutiques pertinents. Sois bienveillant, clair et réponds en français.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      setAiResponse(response.text || 'Voici votre routine personnalisée...');
    } catch (err) {
      console.error(err);
      setAiResponse(`Basé sur votre profil (${skinType}, ${concern}), nous vous recommandons notre Sérum Hydratant Acide Hyaluronique et notre Gel Nettoyant Doux pour un résultat optimal.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-800 to-sky-800 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <h2 className="font-bold text-lg">Conseiller Beauté &amp; Santé IA</h2>
          </div>
          <button 
            onClick={() => setIsAiAdvisorOpen(false)}
            className="p-2 text-blue-200 hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <p className="text-sm text-gray-600">
            Répondez à ces 3 questions rapides pour obtenir une routine parapharmaceutique sur-mesure générée par notre intelligence artificielle experte en pharmacie.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Type de peau</label>
              <select
                value={skinType}
                onChange={(e) => setSkinType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Sèche">Sèche</option>
                <option value="Mixte à sensible">Mixte à sensible</option>
                <option value="Grasse à imperfections">Grasse à imperfections</option>
                <option value="Normale">Normale</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Préoccupation</label>
              <select
                value={concern}
                onChange={(e) => setConcern(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Hydratation & Éclat">Hydratation &amp; Éclat</option>
                <option value="Anti-âge & Rides">Anti-âge &amp; Rides</option>
                <option value="Imperfections & Boutons">Imperfections &amp; Boutons</option>
                <option value="Protection solaire">Protection solaire</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tranche d'âge</label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="18-25 ans">18-25 ans</option>
                <option value="25-35 ans">25-35 ans</option>
                <option value="35-50 ans">35-50 ans</option>
                <option value="50 ans et plus">50 ans et plus</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateRoutine}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <span>Analyse de votre profil en cours...</span>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Générer ma routine personnalisée par IA</span>
              </>
            )}
          </button>

          {aiResponse && (
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200 space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
                <Bot className="w-5 h-5 text-blue-600" />
                <span>Routine Recommandée par notre Pharmacien IA</span>
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                {aiResponse}
              </div>

              {/* Recommended products quick add */}
              <div className="pt-4 border-t border-blue-200/60">
                <span className="text-xs font-bold text-blue-900 block mb-3">Produits associés suggérés :</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products.slice(0, 2).map(prod => (
                    <div key={prod.id} className="bg-white p-3 rounded-xl border border-blue-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={prod.image} alt={prod.name} className="w-10 h-10 object-cover rounded-lg" />
                        <div>
                          <div className="font-bold text-xs text-gray-900 line-clamp-1">{prod.name}</div>
                          <div className="text-xs font-black text-blue-700">{prod.price.toFixed(2)} €</div>
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart ? addToCart(prod, 1) : null}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
