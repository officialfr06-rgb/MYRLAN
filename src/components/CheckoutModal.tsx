import React, { useState } from 'react';
import { X, ShieldCheck, Truck, CreditCard, Lock, CheckCircle, Award, Building } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { PaymentMethod, ShippingCarrier, ShippingAddress } from '../types';

export const CheckoutModal: React.FC = () => {
  const { cart, isCheckoutOpen, setIsCheckoutOpen, createOrder, userProfile } = useShop();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: userProfile.name || 'Marie Dupont',
    email: userProfile.email || 'marie.dupont@example.com',
    phone: '06 12 34 56 78',
    address: '15 rue de la République',
    city: 'Lyon',
    postalCode: '69002',
    country: 'France',
    isCompany: false,
    companyName: '',
    vatNumber: ''
  });

  const [carrier, setCarrier] = useState<ShippingCarrier | 'click_and_collect'>('colissimo');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8921');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvc, setCardCvc] = useState('382');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  if (!isCheckoutOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shippingFee = carrier === 'click_and_collect' || subtotal >= 49 ? 0 : 4.90;
  const total = subtotal + shippingFee;

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          paymentMethodType: paymentMethod,
          currency: 'eur'
        })
      });
      await res.json();
    } catch (err) {
      console.warn('Payment API simulation:', err);
    } finally {
      setIsProcessing(false);
      const newOrd = createOrder(address, paymentMethod, carrier as ShippingCarrier);
      setCompletedOrder(newOrd);
      setStep(3);
    }
  };

  const isClickCollect = carrier === 'click_and_collect';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-900 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sky-300" />
            <h2 className="font-bold text-lg">Paiement Sécurisé Myrlane</h2>
          </div>
          <button 
            onClick={() => setIsCheckoutOpen(false)}
            className="p-2 text-blue-200 hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps indicator */}
        {step < 3 && (
          <div className="flex border-b border-gray-100 bg-gray-50 px-6 py-3 text-xs font-bold text-gray-500">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-700' : ''}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>1</span>
              <span>{isClickCollect ? '1. Coordonnées & Facturation' : '1. Coordonnées & Livraison'}</span>
            </div>
            <span className="mx-4 text-gray-300">›</span>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-700' : ''}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>2</span>
              <span>Mode de Paiement</span>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8">
          
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
              
              {/* Carrier Choice First so the user knows if it's delivery or click & collect */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 mb-2">Mode de retrait / livraison</label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'click_and_collect', name: 'Click & Collect', time: 'Retrait Pharmacie', price: 0, icon: '🏬' },
                    { id: 'colissimo', name: 'Colissimo Domicile', time: '48h-72h', price: subtotal >= 49 ? 0 : 4.90, icon: '📦' },
                    { id: 'chronopost', name: 'Chronopost Express', time: '24h', price: 9.90, icon: '⚡' },
                    { id: 'mondial_relay', name: 'Mondial Relay', time: '3-4 jours', price: subtotal >= 49 ? 0 : 3.90, icon: '📍' },
                  ].map(c => (
                    <div 
                      key={c.id}
                      onClick={() => setCarrier(c.id as any)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${carrier === c.id ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <div className="text-xl mb-1">{c.icon}</div>
                      <div className="font-bold text-xs text-gray-900">{c.name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{c.time}</div>
                      <div className="text-xs font-black text-blue-700 mt-1">{c.price === 0 ? 'Gratuit' : `${c.price.toFixed(2)} €`}</div>
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                {isClickCollect ? '1. Coordonnées & Adresse de facturation' : '1. Coordonnées & Adresse de Livraison & Facturation'}
              </h3>

              {/* Company Checkbox */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={address.isCompany}
                    onChange={(e) => setAddress({ ...address, isCompany: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-blue-600" /> C'est une commande pour une société / entreprise
                  </span>
                </label>

                {address.isCompany && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Raison sociale de la société</label>
                      <input
                        type="text"
                        required={address.isCompany}
                        value={address.companyName || ''}
                        onChange={(e) => setAddress({ ...address, companyName: e.target.value })}
                        placeholder="ex: Myrlane Pharma SARL"
                        className="w-full px-3 py-2 bg-white border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Numéro de TVA intracommunautaire</label>
                      <input
                        type="text"
                        value={address.vatNumber || ''}
                        onChange={(e) => setAddress({ ...address, vatNumber: e.target.value })}
                        placeholder="ex: FR32984231092"
                        className="w-full px-3 py-2 bg-white border rounded-xl text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nom et Prénom (ou Représentant)</label>
                  <input
                    type="text"
                    required
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email pour facture &amp; SMTP</label>
                  <input
                    type="email"
                    required
                    value={address.email}
                    onChange={(e) => setAddress({ ...address, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Téléphone mobile (SMS)</label>
                  <input
                    type="tel"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ville</label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Adresse postale (Facture &amp; {isClickCollect ? 'Contact' : 'Livraison'})</label>
                  <input
                    type="text"
                    required
                    value={address.address}
                    onChange={(e) => setAddress({ ...address, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Code postal</label>
                  <input
                    type="text"
                    required
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pays</label>
                  <select
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="France">France</option>
                    <option value="Belgique">Belgique</option>
                    <option value="Suisse">Suisse</option>
                    <option value="Luxembourg">Luxembourg</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition-all"
                >
                  Continuer vers le mode de paiement
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleCompleteOrder} className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-base">2. Mode de Paiement</h3>
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="text-xs text-blue-700 font-bold hover:underline"
                >
                  Modifier l'adresse
                </button>
              </div>

              {/* Payment Methods Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'card', name: 'Carte bancaire (Paiement sécurisé)', icon: '💳', desc: 'Paiement en ligne par carte' },
                  { id: 'cod', name: 'Paiement au magasin (Click & Collect)', icon: '🏬', desc: 'Réglez directement en officine lors du retrait' },
                ].map(p => (
                  <div
                    key={p.id}
                    onClick={() => setPaymentMethod(p.id as PaymentMethod)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${paymentMethod === p.id ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/30' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="text-2xl mb-1">{p.icon}</div>
                    <div className="font-bold text-sm text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{p.desc}</div>
                  </div>
                ))}
              </div>

              {/* Card Details if Card selected */}
              {paymentMethod === 'card' && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Numéro de carte</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Expiration</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary box */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex justify-between items-center text-sm">
                <div>
                  <div className="font-bold text-blue-900">Total à régler</div>
                  <div className="text-xs text-blue-700">Inclus TVA &amp; Mode : {isClickCollect ? 'Click & Collect' : carrier}</div>
                </div>
                <div className="text-2xl font-black text-blue-800">{total.toFixed(2)} €</div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-gray-600 text-xs font-bold hover:bg-gray-100 rounded-xl"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isProcessing ? 'Validation en cours...' : `Valider la commande • ${total.toFixed(2)} €`}</span>
                </button>
              </div>
            </form>
          )}

          {step === 3 && completedOrder && (
            <div className="text-center space-y-6 py-6">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900">Commande validée avec succès !</h3>
                <p className="text-sm text-gray-600">
                  Un email de confirmation SMTP a été envoyé à <strong className="text-blue-700">{completedOrder.shippingAddress.email}</strong>. 
                  Votre numéro de commande est le <strong className="text-blue-700">{completedOrder.id}</strong>.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 max-w-md mx-auto text-left space-y-2 text-xs text-blue-900">
                <div className="flex justify-between font-bold">
                  <span>Mode de retrait / livraison :</span>
                  <span className="uppercase">{completedOrder.carrier}</span>
                </div>
                {completedOrder.shippingAddress.isCompany && (
                  <div className="flex justify-between">
                    <span>Société :</span>
                    <span>{completedOrder.shippingAddress.companyName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Points fidélité gagnés :</span>
                  <span className="text-amber-600 font-bold">+{completedOrder.loyaltyPointsEarned} pts 🏆</span>
                </div>
              </div>

              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition-all"
              >
                Retourner à la boutique
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
