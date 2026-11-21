import React, { useState } from 'react';
import { X, Star, MessageSquare } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Product } from '../types';

interface AddReviewModalProps {
  product: Product;
  onClose: () => void;
}

export const AddReviewModal: React.FC<AddReviewModalProps> = ({ product, onClose }) => {
  const { showToast } = useShop();
  const [rating, setRating] = useState(5);
  const [author, setAuthor] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author || !comment) {
      showToast('Veuillez remplir tous les champs.');
      return;
    }
    showToast('Merci ! Votre avis a été publié avec succès.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-900 to-sky-900 text-white">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sky-300" />
            <h2 className="font-bold text-base">Laisser un avis client</h2>
          </div>
          <button onClick={onClose} className="p-2 text-blue-200 hover:text-white rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
            <div>
              <div className="font-bold text-xs text-gray-900 line-clamp-1">{product.name}</div>
              <div className="text-[10px] text-blue-700">{product.brand}</div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Votre note (sur 5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-2 rounded-lg text-lg ${star <= rating ? 'text-amber-400 fill-current' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Votre nom</label>
            <input
              type="text"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="ex: Julie Durand"
              className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Votre commentaire</label>
            <textarea
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Qu'avez-vous pensé de ce produit ?"
              className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 text-xs font-bold hover:bg-gray-100 rounded-xl">
              Annuler
            </button>
            <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md">
              Publier mon avis
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
