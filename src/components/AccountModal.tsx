import React, { useState } from 'react';
import { X, User, ShieldCheck, Award } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const AccountModal: React.FC = () => {
  const { userProfile, updateUserProfile, isAccountOpen, setIsAccountOpen, loyalty } = useShop();

  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [skinType, setSkinType] = useState(userProfile.skinType || 'Mixte à sensible');

  if (!isAccountOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ name, email, skinType });
    setIsAccountOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-900 to-sky-900 text-white">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-sky-300" />
            <h2 className="font-bold text-lg">Mon Compte Myrlan</h2>
          </div>
          <button 
            onClick={() => setIsAccountOpen(false)}
            className="p-2 text-blue-200 hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-lg flex items-center justify-center">
              {name.charAt(0)}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">{name}</h4>
              <p className="text-xs text-blue-700 font-medium">Statut : {loyalty.tier} ({loyalty.points} pts)</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nom complet</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Adresse email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Type de peau par défaut</label>
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

          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAccountOpen(false)}
              className="px-4 py-2.5 text-gray-600 text-xs font-bold hover:bg-gray-100 rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Enregistrer les modifications
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
