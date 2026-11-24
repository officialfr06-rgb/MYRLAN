import React, { useState } from 'react';
import { X, MessageSquare, ShieldCheck } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Product, Review } from '../types';
import { authFetch } from '../utils/authToken';

interface AddReviewModalProps {
  product: Product;
  onClose: () => void;
  onReviewAdded?: (review: Review, updatedProduct?: Product) => void;
}

export const AddReviewModal: React.FC<AddReviewModalProps> = ({ product, onClose, onReviewAdded }) => {
  const { showToast, currentUser } = useShop();
  const [rating, setRating] = useState(5);
  const [author, setAuthor] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim()) {
      showToast('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await authFetch(`/api/reviews/${encodeURIComponent(product.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          author: author.trim(),
          email: email.trim(),
          comment: comment.trim()
        })
      });
      const data = await res.json();
      if (data.success && data.review) {
        if (onReviewAdded) onReviewAdded(data.review, data.product);
        showToast(
          data.review.verifiedPurchase
            ? 'Merci ! Votre avis « Achat vérifié » a été publié.'
            : 'Merci ! Votre avis a été publié avec succès.'
        );
        onClose();
      } else {
        showToast(data.error || 'Impossible de publier votre avis.');
      }
    } catch {
      showToast('Erreur réseau lors de la publication.');
    } finally {
      setIsSubmitting(false);
    }
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
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Email de commande <span className="font-normal text-gray-400">(optionnel — active le badge Achat vérifié)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@exemple.fr"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Contrôle automatique avec l’historique de commandes officinal</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Votre commentaire</label>
            <textarea
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Qu'avez-vous pensé de ce produit ?"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 text-xs font-bold hover:bg-gray-100 rounded-xl">
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-md"
            >
              {isSubmitting ? 'Publication...' : 'Publier mon avis'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
