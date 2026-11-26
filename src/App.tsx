import React, { Suspense, lazy } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductCatalog } from './components/ProductCatalog';
import { CartDrawer } from './components/CartDrawer';
import { CustomerSupportChat } from './components/CustomerSupportChat';
import { AccountModal } from './components/AccountModal';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { SeoHeadManager } from './components/SeoHeadManager';
import { CompareBar } from './components/CompareBar';
import { useBodyScrollLock } from './utils/scrollLock';
import { MaintenanceScreen } from './components/MaintenanceScreen';

// Lazy-loaded heavy modules (kept out of initial storefront bundle)
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard }))
);
const ProductPage = lazy(() =>
  import('./components/ProductPage').then(m => ({ default: m.ProductPage }))
);
const CheckoutModal = lazy(() =>
  import('./components/CheckoutModal').then(m => ({ default: m.CheckoutModal }))
);
const AiAdvisorModal = lazy(() =>
  import('./components/AiAdvisorModal').then(m => ({ default: m.AiAdvisorModal }))
);
const LoyaltyModal = lazy(() =>
  import('./components/LoyaltyModal').then(m => ({ default: m.LoyaltyModal }))
);
const OrderTrackingModal = lazy(() =>
  import('./components/OrderTrackingModal').then(m => ({ default: m.OrderTrackingModal }))
);
const WishlistModal = lazy(() =>
  import('./components/WishlistModal').then(m => ({ default: m.WishlistModal }))
);
const FaqAdviceModal = lazy(() =>
  import('./components/FaqAdviceModal').then(m => ({ default: m.FaqAdviceModal }))
);
const LegalModal = lazy(() =>
  import('./components/LegalModal').then(m => ({ default: m.LegalModal }))
);
const CompareModal = lazy(() =>
  import('./components/CompareModal').then(m => ({ default: m.CompareModal }))
);

const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage }))
);
const PrescriptionPage = lazy(() =>
  import('./pages/PrescriptionPage').then(m => ({ default: m.PrescriptionPage }))
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then(m => ({ default: m.ContactPage }))
);
const LegalPages = lazy(() =>
  import('./pages/LegalPages').then(m => ({ default: m.LegalPages }))
);
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then(m => ({ default: m.AboutPage }))
);
const AdviceBlogPage = lazy(() =>
  import('./pages/AdviceBlogPage').then(m => ({ default: m.AdviceBlogPage }))
);
const BrandsPage = lazy(() =>
  import('./pages/BrandsPromosPages').then(m => ({ default: m.BrandsPage }))
);
const PromotionsPage = lazy(() =>
  import('./pages/BrandsPromosPages').then(m => ({ default: m.PromotionsPage }))
);
const AccountPage = lazy(() =>
  import('./pages/AccountOrdersPage').then(m => ({ default: m.AccountPage }))
);
const OrdersPage = lazy(() =>
  import('./pages/AccountOrdersPage').then(m => ({ default: m.OrdersPage }))
);
const OrderConfirmationPage = lazy(() =>
  import('./pages/OrderConfirmationPage').then(m => ({ default: m.OrderConfirmationPage }))
);
const DiagnosticPage = lazy(() =>
  import('./pages/DiagnosticPage').then(m => ({ default: m.DiagnosticPage }))
);
const AppointmentsPage = lazy(() =>
  import('./pages/AppointmentsPage').then(m => ({ default: m.AppointmentsPage }))
);

const PageLoader: React.FC = () => (
  <div className="min-h-[45vh] flex items-center justify-center">
    <div className="w-7 h-7 rounded-full border-2 border-blue-200 border-t-blue-700 animate-spin" />
  </div>
);

const StoreContent: React.FC = () => {
  const {
    currentPath,
    selectedProductForDetail,
    navigate,
    isCartOpen,
    isCheckoutOpen,
    isAiAdvisorOpen,
    isLoyaltyOpen,
    isChatOpen,
    isOrderTrackingOpen,
    isWishlistOpen,
    isFaqOpen,
    isLegalOpen,
    isAccountOpen,
    isCompareOpen,
    currentUser,
    maintenanceConfig
  } = useShop();

  const isAdmin = currentUser?.role === 'admin';
  if (maintenanceConfig.enabled && currentPath !== '/admin' && !isAdmin) {
    return <MaintenanceScreen message={maintenanceConfig.message} />;
  }

  const hasOpenOverlay =
    isCartOpen ||
    isCheckoutOpen ||
    isAiAdvisorOpen ||
    isLoyaltyOpen ||
    isChatOpen ||
    isOrderTrackingOpen ||
    isWishlistOpen ||
    isFaqOpen ||
    isLegalOpen ||
    isAccountOpen ||
    isCompareOpen;

  useBodyScrollLock(hasOpenOverlay);

  if (currentPath === '/admin') {
    return (
      <div className="min-h-screen w-full overflow-x-clip bg-slate-50 text-slate-900 font-sans antialiased">
        <Suspense fallback={<PageLoader />}>
          <AdminDashboard />
        </Suspense>
        <AccountModal />
        <Toast />
      </div>
    );
  }

  const renderPage = () => {
    if (currentPath.startsWith('/produit/') && selectedProductForDetail) {
      return (
        <ProductPage
          product={selectedProductForDetail}
          onBack={() => navigate('/')}
        />
      );
    }
    if (currentPath === '/reset-password') {
      return <ResetPasswordPage />;
    }
    if (currentPath === '/diagnostic') {
      return <DiagnosticPage />;
    }
    if (currentPath === '/rendez-vous') {
      return <AppointmentsPage />;
    }
    if (currentPath === '/ordonnance') {
      return <PrescriptionPage />;
    }
    if (currentPath === '/contact') {
      return <ContactPage />;
    }
    if (
      currentPath === '/cgv' ||
      currentPath === '/livraison-retours' ||
      currentPath === '/confidentialite' ||
      currentPath === '/mentions-legales'
    ) {
      return <LegalPages route={currentPath} />;
    }
    if (currentPath === '/a-propos') {
      return <AboutPage />;
    }
    if (currentPath === '/conseils') {
      return <AdviceBlogPage />;
    }
    if (currentPath === '/marques') {
      return <BrandsPage />;
    }
    if (currentPath === '/promotions') {
      return <PromotionsPage />;
    }
    if (currentPath === '/compte') {
      return <AccountPage />;
    }
    if (currentPath === '/commandes') {
      return <OrdersPage />;
    }
    if (currentPath.startsWith('/commande-confirmee/')) {
      const orderId = decodeURIComponent(currentPath.replace('/commande-confirmee/', ''));
      return <OrderConfirmationPage orderId={orderId} />;
    }

    return (
      <>
        <HeroBanner />
        <ProductCatalog />
      </>
    );
  };

  return (
    <div className="min-h-screen w-full overflow-x-clip flex flex-col bg-gray-50/60 text-gray-900 font-sans antialiased selection:bg-blue-500 selection:text-white">
      <Navbar />

      <main className="flex-1 min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
        <Suspense fallback={<PageLoader />}>
          {renderPage()}
        </Suspense>
      </main>

      <Footer />

      {/* Overlays & Modals */}
      <CartDrawer />
      <CustomerSupportChat />
      <AccountModal />
      <CompareBar />
      <Suspense fallback={null}>
        {isCheckoutOpen && <CheckoutModal />}
        {isAiAdvisorOpen && <AiAdvisorModal />}
        {isLoyaltyOpen && <LoyaltyModal />}
        {isOrderTrackingOpen && <OrderTrackingModal />}
        {isWishlistOpen && <WishlistModal />}
        {isFaqOpen && <FaqAdviceModal />}
        {isLegalOpen && <LegalModal />}
        {isCompareOpen && <CompareModal />}
      </Suspense>
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <ShopProvider>
      <SeoHeadManager />
      <StoreContent />
    </ShopProvider>
  );
}
