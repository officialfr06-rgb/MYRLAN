import React from 'react';
import {
  User, ShieldCheck, Package, Award, Heart,
  Sparkles, LogOut, LogIn, LayoutDashboard, X, Menu,
  FileText, Tag, BookOpen, Phone, Building, Store
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const SidebarMenu: React.FC = () => {
  const {
    currentUser, logoutUser, setIsAccountOpen, setIsAdminMode,
    isAdminMode, setIsLoyaltyOpen, setIsWishlistOpen, setIsAiAdvisorOpen,
    isSidebarDrawerOpen, setIsSidebarDrawerOpen, navigate
  } = useShop();

  const goTo = (path: string) => {
    navigate(path);
    setIsSidebarDrawerOpen(false);
  };

  return (
    <>
      {/* Floating Toggle Button on the Left */}
      <button
        onClick={() => setIsSidebarDrawerOpen(!isSidebarDrawerOpen)}
        className="fixed left-0 sm:left-3 top-1/2 -translate-y-1/2 z-40 bg-blue-900 hover:bg-blue-800 text-white p-2 sm:p-3 rounded-r-xl sm:rounded-r-2xl shadow-xl flex items-center gap-2 font-bold text-xs transition-all hover:pl-4 group print:hidden"
        title="Ouvrir le menu Espace Client / Navigation"
      >
        <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-sky-300" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out">
          {currentUser ? (currentUser.role === 'admin' ? 'Menu Admin' : 'Mon Espace') : 'Navigation / Menu'}
        </span>
      </button>

      {/* Slide-out Overlay Drawer (Never changes site width or dimensions) */}
      {isSidebarDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden print:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsSidebarDrawerOpen(false)}
          />

          <div className="absolute inset-y-0 left-0 max-w-full flex">
            <div className="w-80 max-w-[85vw] bg-white shadow-2xl p-5 sm:p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-300">
              <div>
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black">
                      M
                    </div>
                    <div>
                      <h3 className="font-extrabold text-blue-950 text-sm">Myrlan Espace</h3>
                      <p className="text-[10px] text-gray-500">Navigation rapide &amp; sécurisée</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSidebarDrawerOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {!currentUser ? (
                  <div className="bg-gradient-to-r from-blue-900 to-sky-900 text-white p-5 rounded-2xl shadow-md space-y-4 mb-6">
                    <h4 className="font-bold text-sm">Bienvenue chez Myrlan</h4>
                    <p className="text-xs text-blue-200">Connectez-vous pour accéder à votre profil, vos adresses et vos commandes.</p>
                    <button
                      onClick={() => { setIsAccountOpen(true); setIsSidebarDrawerOpen(false); }}
                      className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-blue-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                    >
                      <LogIn className="w-4 h-4" /> Se connecter / S'inscrire
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-base ${currentUser.role === 'admin' ? 'bg-blue-900' : 'bg-blue-600'}`}>
                        {currentUser.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-gray-900 text-xs truncate">{currentUser.name}</h4>
                          {currentUser.role === 'admin' && (
                            <span className="px-1.5 py-0.2 bg-blue-200 text-blue-900 font-extrabold text-[9px] rounded-full flex items-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5" /> Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">{currentUser.email}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 mb-1">
                        {currentUser.role === 'admin' ? 'Espace Administrateur' : 'Mon Espace Client'}
                      </div>

                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => { setIsAdminMode(true); setIsSidebarDrawerOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${isAdminMode ? 'bg-blue-900 text-white shadow-md' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-900'}`}
                        >
                          <LayoutDashboard className="w-4 h-4 text-blue-600" /> Tableau de bord Admin
                        </button>
                      )}

                      <button
                        onClick={() => goTo('/compte')}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-all"
                      >
                        <User className="w-4 h-4 text-blue-600" /> Mon Profil &amp; Adresses
                      </button>
                      <button
                        onClick={() => goTo('/commandes')}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-all"
                      >
                        <Package className="w-4 h-4 text-sky-600" /> Mes Commandes &amp; Factures
                      </button>
                      <button
                        onClick={() => { setIsLoyaltyOpen(true); setIsSidebarDrawerOpen(false); }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-all"
                      >
                        <Award className="w-4 h-4 text-amber-600" /> Programme Fidélité
                      </button>
                      <button
                        onClick={() => { setIsWishlistOpen(true); setIsSidebarDrawerOpen(false); }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-all"
                      >
                        <Heart className="w-4 h-4 text-rose-600" /> Mes Produits Favoris
                      </button>
                    </div>
                  </div>
                )}

                {/* Storefront Pages */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 mb-1">
                    Pages &amp; Services
                  </div>
                  <button
                    onClick={() => goTo('/')}
                    className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-900"
                  >
                    <Store className="w-4 h-4 text-blue-600" /> Boutique &amp; Catalogue
                  </button>
                  <button
                    onClick={() => goTo('/ordonnance')}
                    className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-900"
                  >
                    <FileText className="w-4 h-4 text-blue-600" /> Envoyer une Ordonnance
                  </button>
                  <button
                    onClick={() => goTo('/promotions')}
                    className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-900"
                  >
                    <Tag className="w-4 h-4 text-amber-600" /> Promotions &amp; Codes Promo
                  </button>
                  <button
                    onClick={() => goTo('/marques')}
                    className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-900"
                  >
                    <Award className="w-4 h-4 text-sky-600" /> Nos Marques
                  </button>
                  <button
                    onClick={() => goTo('/conseils')}
                    className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-900"
                  >
                    <BookOpen className="w-4 h-4 text-blue-600" /> Conseils Santé
                  </button>
                  <button
                    onClick={() => goTo('/a-propos')}
                    className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-900"
                  >
                    <Building className="w-4 h-4 text-blue-600" /> L’Officine &amp; Agréments
                  </button>
                  <button
                    onClick={() => goTo('/contact')}
                    className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-900"
                  >
                    <Phone className="w-4 h-4 text-blue-600" /> Contact &amp; Click &amp; Collect
                  </button>
                  <button
                    onClick={() => { setIsAiAdvisorOpen(true); setIsSidebarDrawerOpen(false); }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-900"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Routine Beauté IA
                  </button>
                </div>
              </div>

              {currentUser && (
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <button
                    onClick={() => { logoutUser(); setIsSidebarDrawerOpen(false); }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <LogOut className="w-4 h-4" /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
