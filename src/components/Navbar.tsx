import React from 'react';
import { 
  ShoppingBag, Heart, Award, Sparkles, MessageCircle, 
  Package, ShieldCheck, Search, User, Settings, Store, Menu, X 
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const Navbar: React.FC = () => {
  const { 
    cart, 
    wishlist, 
    loyalty, 
    searchQuery, 
    setSearchQuery, 
    setIsCartOpen, 
    setIsAiAdvisorOpen, 
    setIsLoyaltyOpen, 
    setIsChatOpen, 
    setIsOrderTrackingOpen,
    setIsWishlistOpen,
    setIsAccountOpen,
    isAdminMode,
    setIsAdminMode,
    userProfile
  } = useShop();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-xs">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-blue-700 via-sky-700 to-blue-800 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-6">
        <span className="hidden sm:inline-flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-300" /> Parapharmacie en Ligne agréée &amp; Sécurisée
        </span>
        <span>🌿 Livraison offerte dès 49€ d'achats</span>
        <span className="hidden md:inline-flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-300" /> Code promo : <strong className="bg-blue-900/50 px-1.5 py-0.5 rounded text-amber-200">MYRLANE10</strong> (-10%)
        </span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsAdminMode(false)}
              className="flex items-center gap-2 text-left group focus:outline-none"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-700 to-sky-700 bg-clip-text text-transparent">
                  Myr<span className="text-blue-500">lane</span>
                </span>
                <span className="block text-[10px] uppercase tracking-widest text-blue-800 font-semibold">
                  Santé &amp; Beauté Expert
                </span>
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Rechercher un produit, une marque, un symptôme (ex: sérum, solaire, magnésium)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-gray-400 hover:text-gray-600"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* AI Advisor Button */}
            <button
              onClick={() => setIsAiAdvisorOpen(true)}
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-50 to-sky-50 hover:from-blue-100 hover:to-sky-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200/60 shadow-xs transition-all"
              title="Conseiller Beauté & Santé IA"
            >
              <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
              <span>Routine IA</span>
            </button>

            {/* Loyalty Program */}
            <button
              onClick={() => setIsLoyaltyOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200/80 transition-all"
              title="Programme Fidélité"
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">{loyalty.points} pts</span>
            </button>

            {/* Wishlist Button */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
              title="Mes Favoris"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Account Button */}
            <button
              onClick={() => setIsAccountOpen(true)}
              className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
              title="Mon Compte"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Order Tracking */}
            <button
              onClick={() => setIsOrderTrackingOpen(true)}
              className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
              title="Suivi de commandes"
            >
              <Package className="w-5 h-5" />
            </button>

            {/* Live Chat Support */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
              title="Support Pharmacien en direct"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium text-sm shadow-md shadow-blue-600/20 transition-all hover:scale-105"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Panier</span>
              {totalCartItems > 0 && (
                <span className="bg-amber-400 text-blue-950 font-bold px-1.5 py-0.5 rounded-full text-xs">
                  {totalCartItems}
                </span>
              )}
            </button>

            {/* Admin Toggle */}
            <button
              onClick={() => setIsAdminMode(!isAdminMode)}
              className={`p-2.5 rounded-full border transition-all ${
                isAdminMode 
                  ? 'bg-blue-900 text-white border-blue-900' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
              }`}
              title={isAdminMode ? "Retourner à la boutique" : "Accéder au tableau de bord Admin"}
            >
              {isAdminMode ? <Store className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>

        </div>

        {/* Mobile Search & Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 space-y-4 animate-in slide-in-from-top-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-800"
              />
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => { setIsAiAdvisorOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-800 rounded-lg font-medium text-sm"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Conseiller Routine IA</span>
              </button>
              <button
                onClick={() => { setIsLoyaltyOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-800 rounded-lg font-medium text-sm"
              >
                <Award className="w-4 h-4 text-amber-600" />
                <span>Programme Fidélité ({loyalty.points} pts)</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
