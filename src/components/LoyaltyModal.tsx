import React from 'react';
import { X, Award, Sparkles, CheckCircle, Gift } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const LoyaltyModal: React.FC = () => {
  const { loyalty, isLoyaltyOpen, setIsLoyaltyOpen, showToast } = useShop();

  if (!isLoyaltyOpen) return null;

  const nextTierPoints = loyalty.tier === 'Bronze' ? 200 : loyalty.tier === 'Silver' ? 500 : 1000;
  const progress = Math.min(100, Math.round((loyalty.points / nextTierPoints) * 100));

  const handleRedeemVoucher = (cost: number, label: string) => {
    if (loyalty.points < cost) {
      showToast(`Points insuffisants. Il vous manque ${cost - loyalty.points} points.`);
      return;
    }
    showToast(`Félicitations ! Vous avez débloqué : ${label}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-200" />
            <h2 className="font-bold text-lg">Club Fidélité Myrlane</h2>
          </div>
          <button 
            onClick={() => setIsLoyaltyOpen(false)}
            className="p-2 text-amber-200 hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Status Card */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
              <Award className="w-48 h-48" />
            </div>

            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest bg-amber-700/40 px-3 py-1 rounded-full border border-amber-400/40">
                  Statut : {loyalty.tier}
                </span>
                <h3 className="text-3xl font-black mt-3">{loyalty.points} points</h3>
                <p className="text-xs text-amber-100 mt-1">1 € d'achat = 1 point fidélité</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-200 font-black text-xl">
                ★
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs text-amber-100 font-semibold">
                <span>Progression vers statut {loyalty.tier === 'Bronze' ? 'Silver' : 'Gold'}</span>
                <span>{loyalty.points} / {nextTierPoints} pts</span>
              </div>
              <div className="w-full h-2.5 bg-amber-700/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Available Rewards */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-600" />
              <span>Récompenses à débloquer</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { cost: 100, title: 'Bon d\'achat 5 €', desc: 'Valable sur tout le site' },
                { cost: 250, title: 'Bon d\'achat 15 €', desc: 'Valable dès 50 € d\'achat' },
                { cost: 400, title: 'Livraison express offerte', desc: 'Sur vos 3 prochaines commandes' },
                { cost: 600, title: 'Coffret Soin Visage Bio', desc: 'Offert en cadeau dans votre colis' },
              ].map((reward, i) => (
                <div key={i} className="p-4 rounded-xl border border-gray-200 flex flex-col justify-between space-y-3 bg-gray-50/50">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-gray-900">{reward.title}</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-black text-xs rounded-md">
                        {reward.cost} pts
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">{reward.desc}</p>
                  </div>

                  <button
                    onClick={() => handleRedeemVoucher(reward.cost, reward.title)}
                    disabled={loyalty.points < reward.cost}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                      loyalty.points >= reward.cost 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {loyalty.points >= reward.cost ? 'Échanger mes points' : 'Points insuffisants'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Historique des points</h4>
            <div className="max-h-36 overflow-y-auto space-y-2 text-xs">
              {loyalty.history.map(item => (
                <div key={item.id} className="flex justify-between items-center py-2 px-3 rounded-lg bg-gray-50">
                  <div>
                    <div className="font-semibold text-gray-800">{item.description}</div>
                    <div className="text-[10px] text-gray-400">{item.date}</div>
                  </div>
                  <span className="font-bold text-blue-600">+{item.points} pts</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
