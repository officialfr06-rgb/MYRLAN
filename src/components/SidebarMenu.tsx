import React from 'react';
import { 
  User, ShieldCheck, Package, ShoppingBag, Award, Heart, 
  Sparkles, LogOut, LogIn, LayoutDashboard, PlusCircle, Layers, CheckCircle 
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const SidebarMenu: React.FC = () => {
  const { 
    currentUser, logoutUser, setIsAccountOpen, setIsAdminMode, 
    isAdminMode, setIsLoyaltyOpen, setIsOrderTrackingOpen, setIsWishlistOpen, setIsAiAdvisorOpen 
  } = useShop();

  if (!currentUser) {
    return (
      <div className="bg-gradient-to-r from-blue-900 to-sky-900 text-white p-4 rounded-2xl shadow-md flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center text-sky-300 font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Espace Myrlan</h4>
            <p className="text-xs text-blue-200">Connectez-vous pour accéder à votre espace personnalisé.</p>
          </div>
        </div>
        <button
          onClick={() => setIsAccountOpen(true)}
          className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-blue-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
        >
          <LogIn className="w-4 h-4" /> Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5 space-y-5 mb-6">
      {/* User Info Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg ${currentUser.role === 'admin' ? 'bg-blue-900' : 'bg-blue-600'}`}>
          {currentUser.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-gray-900 text-sm truncate">{currentUser.name}</h4>
            {currentUser.role === 'admin' && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-extrabold text-[10px] rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Admin
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
        </div>
      </div>

      {/* Role-Specific Navigation Menu */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 mb-2">
          {currentUser.role === 'admin' ? 'Menu Administrateur' : 'Mon Espace Client'}
        </div>

        {currentUser.role === 'admin' ? (
          <>
            <button
              onClick={() => setIsAdminMode(true)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${isAdminMode ? 'bg-blue-900 text-white shadow-md' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-900'}`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600" /> Tableau de bord &amp; Stats
            </button>
            <button
              onClick={() => setIsAdminMode(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-all"
            >
              <Layers className="w-4 h-4 text-sky-600" /> Gestion des stocks en temps réel
            </button>
            <button
              onClick={() => setIsAdminMode(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-all"
            >
              <Package className="w-4 h-4 text-amber-600" /> Commandes &amp; Expéditions
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsAccountOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-all"
            >
              <User className="w-4 h-4 text-blue-600" /> Mon Profil &amp; Type de peau
            </button>
            <button
              onClick={() => setIsOrderTrackingOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-all"
            >
              <Package className="w-4 h-4 text-sky-600" /> Mes Commandes &amp; Suivi
            </button>
            <button
              onClick={() => setIsLoyaltyOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-all"
            >
              <Award className="w-4 h-4 text-amber-600" /> Programme Fidélité &amp; Points
            </button>
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-all"
            >
              <Heart className="w-4 h-4 text-rose-600" /> Mes Produits Favoris
            </button>
            <button
              onClick={() => setIsAiAdvisorOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-all"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" /> Mon Assistant Routine Beauté IA
            </button>
          </>
        )}

        {/* Logout Button */}
        <div className="pt-3 mt-3 border-t border-gray-100">
          <button
            onClick={logoutUser}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all"
          >
            <LogOut className="w-4 h-4" /> Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};
