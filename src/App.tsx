/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

const StoreContent: React.FC = () => {
  const { isAdminMode, selectedProductForDetail, setSelectedProductForDetail } = useShop();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/60 text-gray-900 font-sans antialiased selection:bg-blue-500 selection:text-white">
      <Navbar />

      <main className="flex-1">
        {isAdminMode ? (
          <AdminDashboard />
        ) : selectedProductForDetail ? (
          <ProductPage 
            product={selectedProductForDetail} 
            onBack={() => setSelectedProductForDetail(null)} 
          />
        ) : (
          <>
            <HeroBanner />
            <ProductCatalog />
          </>
        )}
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
      <StoreContent />
    </ShopProvider>
  );
}
