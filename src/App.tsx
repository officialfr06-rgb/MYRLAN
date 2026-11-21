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
import { SidebarMenu } from './components/SidebarMenu';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';

const StoreContent: React.FC = () => {
  const { isAdminMode, selectedProductForDetail, setSelectedProductForDetail, currentUser } = useShop();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/60 text-gray-900 font-sans antialiased selection:bg-blue-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {isAdminMode ? (
          <AdminDashboard />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <SidebarMenu />
            </div>
            <div className="lg:col-span-3">
              {selectedProductForDetail ? (
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
            </div>
          </div>
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
