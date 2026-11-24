import React from 'react';
import {
  ShoppingBag, Heart, Award, Sparkles, MessageCircle,
  Package, ShieldCheck, Search, User, Settings, Store, Menu, X
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useBodyScrollLock } from '../utils/scrollLock';

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
    setIsWishlistOpen,
    setIsAccountOpen,
    isAdminMode,
    setIsAdminMode,
    currentUser,
    currentPath,
    navigate
  } = useShop();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  useBodyScrollLock(mobileMenuOpen);

  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navLinks = [
    { path: '/', label: 'Catalogue' },
    { path: '/diagnostic', label: 'Diagnostic' },
    { path: '/rendez-vous', label: 'Rendez-vous' },
    { path: '/marques', label: 'Marques' },
    { path: '/promotions', label: 'Promotions' },
    { path: '/ordonnance', label: 'Ordonnance' },
    { path: '/conseils', label: 'Conseils Santé' },
    { path: '/a-propos', label: 'L’Officine' },
    { path: '/contact', label: 'Contact' }
  ];

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val && currentPath !== '/') {
      navigate('/');
    }
  };

  return (
    <>
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-xs print:hidden">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-blue-700 via-sky-700 to-blue-800 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-6">
        <span className="hidden sm:inline-flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-300" /> Parapharmacie en Ligne agréée &amp; Sécurisée
        </span>
        <span>Livraison offerte dès 49€ d'achats</span>
        <button
          onClick={() => navigate('/promotions')}
          className="hidden md:inline-flex items-center gap-1.5 hover:underline"
        >
          <Sparkles className="w-4 h-4 text-amber-300" /> Code promo : <strong className="bg-blue-900/50 px-1.5 py-0.5 rounded text-amber-200">MYRLANE10</strong> (-10%)
        </button>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-left group focus:outline-none min-w-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Store className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-blue-700 to-sky-700 bg-clip-text text-transparent block truncate">
                  Myr<span className="text-blue-500">lane</span>
                </span>
                <span className="hidden sm:block text-[10px] uppercase tracking-widest text-blue-800 font-semibold truncate">
                  Santé &amp; Beauté Expert
                </span>
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Rechercher un produit, une marque..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
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
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setIsAiAdvisorOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200/60 whitespace-nowrap"
              title="Conseiller Beauté & Santé IA"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Routine IA</span>
            </button>

            <button
              onClick={() => setIsLoyaltyOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200/80 whitespace-nowrap tabular-nums"
              title="Programme Fidélité"
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span>{loyalty.points} pts</span>
            </button>

            <button
              onClick={() => setIsWishlistOpen(true)}
              className="hidden md:inline-flex p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
              title="Mes Favoris"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white font-bold px-1.5 rounded-full text-[10px]">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              onClick={() => currentUser ? navigate('/compte') : setIsAccountOpen(true)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
              title={currentUser ? 'Mon Compte' : 'Se connecter'}
            >
              <User className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigate('/commandes')}
              className="hidden md:inline-flex p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
              title="Mes Commandes"
            >
              <Package className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsChatOpen(true)}
              className="hidden sm:inline-flex p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
              title="Support Pharmacien en direct"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white"></span>
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium text-xs sm:text-sm shadow-sm transition-all whitespace-nowrap"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Panier</span>
              {totalCartItems > 0 && (
                <span className="bg-amber-400 text-blue-950 font-bold px-1.5 py-0.5 rounded-full text-[11px] tabular-nums">
                  {totalCartItems}
                </span>
              )}
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setIsAdminMode(!isAdminMode)}
                className={`hidden md:inline-flex p-2 rounded-full border transition-all ${
                  isAdminMode
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                }`}
                title={isAdminMode ? 'Retourner à la boutique' : 'Accéder au tableau de bord Admin'}
              >
                {isAdminMode ? <Store className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop Sub-navigation bar for pages */}
        <nav className="hidden md:flex items-center gap-1 py-2 border-t border-gray-100 overflow-x-auto scrollbar-none">
          {navLinks.map(link => {
            const active = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-800'
                    : 'text-gray-600 hover:text-blue-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Mobile Search & Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 space-y-3 max-h-[calc(100dvh-7.5rem)] overflow-y-auto overscroll-contain animate-in slide-in-from-top-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-800"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map(link => (
                <button
                  key={link.path}
                  onClick={() => { navigate(link.path); setMobileMenuOpen(false); }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold text-left ${
                    currentPath === link.path ? 'bg-blue-50 text-blue-800' : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => { navigate('/commandes'); setMobileMenuOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-xl font-semibold text-xs"
              >
                <Package className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="truncate">Mes Commandes</span>
              </button>
              <button
                onClick={() => { setIsWishlistOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-xl font-semibold text-xs"
              >
                <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="truncate">Favoris ({wishlist.length})</span>
              </button>
              <button
                onClick={() => { setIsLoyaltyOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-800 rounded-xl font-semibold text-xs"
              >
                <Award className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">{loyalty.points} pts Fidélité</span>
              </button>
              <button
                onClick={() => { setIsChatOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-800 rounded-xl font-semibold text-xs"
              >
                <MessageCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">Chat Pharmacien</span>
              </button>
              <button
                onClick={() => { setIsAiAdvisorOpen(true); setMobileMenuOpen(false); }}
                className="col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-800 rounded-xl font-semibold text-xs"
              >
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Conseiller Routine IA</span>
              </button>
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => { setIsAdminMode(!isAdminMode); setMobileMenuOpen(false); }}
                  className="col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-xs"
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>{isAdminMode ? 'Retourner à la boutique' : 'Espace Pharmacien Admin'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
    {mobileMenuOpen && (
      <div
        className="fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-[1px] touch-none md:hidden"
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />
    )}
    </>
  );
};
