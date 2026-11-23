import React from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductCatalog } from './components/ProductCatalog';
import { ProductPage } from './components/ProductPage';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AiAdvisorModal } from './components/AiAdvisorModal';
import { LoyaltyModal } from './components/LoyaltyModal';
import { CustomerSupportChat } from './components/CustomerSupportChat';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { WishlistModal } from './components/WishlistModal';
import { FaqAdviceModal } from './components/FaqAdviceModal';
import { LegalModal } from './components/LegalModal';
import { AccountModal } from './components/AccountModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { SeoHeadManager } from './components/SeoHeadManager';

import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { PrescriptionPage } from './pages/PrescriptionPage';
import { ContactPage } from './pages/ContactPage';
import { LegalPages } from './pages/LegalPages';
import { AboutPage } from './pages/AboutPage';
import { AdviceBlogPage } from './pages/AdviceBlogPage';
import { BrandsPage, PromotionsPage } from './pages/BrandsPromosPages';
import { AccountPage, OrdersPage } from './pages/AccountOrdersPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { DiagnosticPage } from './pages/DiagnosticPage';
import { AppointmentsPage } from './pages/AppointmentsPage';

const StoreContent: React.FC = () => {
  const { currentPath, selectedProductForDetail, navigate } = useShop();

  if (currentPath === '/admin') {
    return (
      <div className="min-h-screen w-full overflow-x-clip bg-slate-50 text-slate-900 font-sans antialiased">
        <AdminDashboard />
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
        {renderPage()}
      </main>

      <Footer />

      {/* Overlays & Modals */}
      <CartDrawer />
      <CheckoutModal />
      <AiAdvisorModal />
      <LoyaltyModal />
      <CustomerSupportChat />
      <OrderTrackingModal />
      <WishlistModal />
      <FaqAdviceModal />
      <LegalModal />
      <AccountModal />
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
