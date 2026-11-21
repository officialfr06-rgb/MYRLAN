import React from 'react';
import { X, Heart, ShoppingBag, Trash2, Star } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const WishlistModal: React.FC = () => {
  const { wishlist, toggleWishlist, products, addToCart, isWishlistOpen, setIsWishlistOpen, setSelectedProductForDetail } = useShop();

  if (!isWishlistOpen) return null;

  const wishlistedProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-900 to-sky-900 text-white">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400 fill-current" />
            <h2 className="font-bold text-lg">Mes Favoris ({wishlistedProducts.length})</h2>
          </div>
          <button 
            onClick={() => setIsWishlistOpen(false)}
            className="p-2 text-blue-200 hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-4 max-h-[70vh] overflow-y-auto">
          {wishlistedProducts.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-gray-800 text-base">Votre liste de favoris est vide</h3>
              <p className="text-xs text-gray-500">Cliquez sur le cœur de n'importe quel produit pour le sauvegarder ici.</p>
            </div>
          ) : (
            wishlistedProducts.map(product => (
              <div key={product.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-4">
                <div 
                  onClick={() => { setSelectedProductForDetail(product); setIsWishlistOpen(false); }}
                  className="flex items-center gap-4 cursor-pointer flex-1"
                >
                  <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-xl border" />
                  <div>
                    <div className="text-[10px] font-bold text-blue-700 uppercase">{product.brand}</div>
                    <h4 className="font-bold text-gray-900 text-sm hover:text-blue-600 transition-colors">{product.name}</h4>
                    <div className="text-sm font-black text-blue-800 mt-1">{product.price.toFixed(2)} €</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md ${
                      product.stock > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Ajouter</span>
                  </button>
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Retirer des favoris"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
