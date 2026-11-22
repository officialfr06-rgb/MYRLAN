import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Tag, CheckCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    setIsCheckoutOpen,
    appliedPromo,
    setAppliedPromo,
    validatePromoCode
  } = useShop();

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  if (!isCartOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discount = appliedPromo && subtotal >= appliedPromo.minOrder
    ? (subtotal * appliedPromo.discountPercent) / 100
    : 0;
  const shippingFee = subtotal >= 49 || subtotal === 0 ? 0 : 4.90;
  const total = Math.max(0, subtotal - discount + shippingFee);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    if (!promoCodeInput.trim()) return;
    setIsValidating(true);
    const result = await validatePromoCode(promoCodeInput, subtotal);
    setIsValidating(false);
    if (!result.success) {
      setPromoError(result.error || 'Code promo invalide.');
    } else {
      setPromoCodeInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center text-amber-300">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Mon Panier</h2>
              <p className="text-xs text-blue-300">{cart.length} article(s)</p>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-blue-200 hover:text-white hover:bg-blue-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        <div className="bg-blue-50 px-6 py-3 border-b border-blue-100">
          <div className="flex justify-between text-xs font-semibold text-blue-900 mb-1 tabular-nums">
            <span>{subtotal >= 49 ? 'Livraison gratuite débloquée !' : `Ajoutez ${(49 - subtotal).toFixed(2)} € pour la livraison offerte`}</span>
            <span>{Math.min(100, Math.round((subtotal / 49) * 100))}%</span>
          </div>
          <div className="w-full h-2 bg-blue-200/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (subtotal / 49) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg">Votre panier est vide</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">Découvrez notre catalogue de parapharmacie et ajoutez vos produits favoris.</p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition-all"
              >
                Explorer le catalogue
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 relative group">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 object-cover rounded-xl border border-gray-200"
                />

                <div className="flex-1 space-y-1">
                  <div className="text-[10px] font-bold text-blue-700 uppercase">{item.product.brand}</div>
                  <h4 className="font-bold text-gray-900 text-xs line-clamp-2">{item.product.name}</h4>
                  <div className="text-sm font-black text-blue-800 tabular-nums">{item.product.price.toFixed(2)} €</div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 font-semibold text-xs text-gray-800 tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Checkout */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">

            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Tag className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Code promo (ex: MYRLANE10)"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs uppercase font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isValidating}
                  className="px-4 py-2 bg-gray-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  Appliquer
                </button>
              </div>
              {appliedPromo && (
                <div className="flex items-center justify-between text-xs text-blue-700 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Code {appliedPromo.code} (-{appliedPromo.discountPercent}%)
                  </span>
                  <button
                    type="button"
                    onClick={() => setAppliedPromo(null)}
                    className="text-[11px] underline text-gray-500 hover:text-rose-600"
                  >
                    Retirer
                  </button>
                </div>
              )}
              {promoError && <p className="text-xs text-rose-500 font-semibold">{promoError}</p>}
            </form>

            {/* Calculations */}
            <div className="space-y-2 text-sm text-gray-600 border-t border-gray-200 pt-3 tabular-nums">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span className="font-bold text-gray-900">{subtotal.toFixed(2)} €</span>
              </div>
              {discount > 0 && appliedPromo && (
                <div className="flex justify-between text-blue-600 font-medium">
                  <span>Réduction ({appliedPromo.code})</span>
                  <span>-{discount.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Frais de port</span>
                <span className="font-bold text-gray-900">{shippingFee === 0 ? 'Gratuit' : `${shippingFee.toFixed(2)} €`}</span>
              </div>
              <div className="flex justify-between text-base font-black text-blue-900 pt-2 border-t border-gray-200">
                <span>Total TTC</span>
                <span className="text-xl text-blue-700">{total.toFixed(2)} €</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCartOpen(false);
                setIsCheckoutOpen(true);
              }}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <span>Passer la commande sécurisée</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Paiement 100% sécurisé &amp; Données cryptées SSL</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
