import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Product, CartItem, Order, ChatMessage, UserProfile, LoyaltyAccount, ShippingAddress, PaymentMethod, ShippingCarrier } from '../types';
import { MOCK_PRODUCTS } from '../data/mockProducts';

interface ShopContextType {
  products: Product[];
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  loyalty: LoyaltyAccount;
  chatMessages: ChatMessage[];
  userProfile: UserProfile;
  isAdminMode: boolean;
  searchQuery: string;
  selectedCategory: string;
  selectedTag: string;
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  isAiAdvisorOpen: boolean;
  isLoyaltyOpen: boolean;
  isChatOpen: boolean;
  isOrderTrackingOpen: boolean;
  isWishlistOpen: boolean;
  isFaqOpen: boolean;
  isLegalOpen: boolean;
  isAccountOpen: boolean;
  selectedProductForDetail: Product | null;
  toastMessage: string | null;
  
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (c: string) => void;
  setSelectedTag: (t: string) => void;
  setIsCartOpen: (open: boolean) => void;
  setIsCheckoutOpen: (open: boolean) => void;
  setIsAiAdvisorOpen: (open: boolean) => void;
  setIsLoyaltyOpen: (open: boolean) => void;
  setIsChatOpen: (open: boolean) => void;
  setIsOrderTrackingOpen: (open: boolean) => void;
  setIsWishlistOpen: (open: boolean) => void;
  setIsFaqOpen: (open: boolean) => void;
  setIsLegalOpen: (open: boolean) => void;
  setIsAccountOpen: (open: boolean) => void;
  setSelectedProductForDetail: (p: Product | null) => void;
  setIsAdminMode: (admin: boolean) => void;

  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  createOrder: (address: ShippingAddress, paymentMethod: PaymentMethod, carrier: ShippingCarrier, promoCode?: string) => Order;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updateProductStock: (productId: string, newStock: number) => void;
  addProduct: (product: Omit<Product, 'id' | 'rating' | 'reviewsCount'>) => void;
  sendChatMessage: (text: string, sender?: 'user' | 'bot' | 'pharmacist') => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  showToast: (msg: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from localStorage or defaults
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('myrlane_products');
    return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('myrlane_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('myrlane_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('myrlane_orders');
    return saved ? JSON.parse(saved) : [
      {
        id: 'ORD-9842',
        date: '2026-11-19 14:20',
        items: [{ product: MOCK_PRODUCTS[0], quantity: 1 }],
        totalAmount: 24.90,
        shippingAddress: {
          fullName: 'Sophie Martin',
          email: 'sophie.martin@example.com',
          phone: '06 12 34 56 78',
          address: '15 rue de la République',
          city: 'Lyon',
          postalCode: '69002',
          country: 'France'
        },
        paymentMethod: 'card',
        carrier: 'colissimo',
        status: 'Expédié',
        trackingNumber: '6A00984223190',
        loyaltyPointsEarned: 25
      }
    ];
  });

  const [loyalty, setLoyalty] = useState<LoyaltyAccount>(() => {
    const saved = localStorage.getItem('myrlane_loyalty');
    return saved ? JSON.parse(saved) : {
      points: 120,
      tier: 'Silver',
      history: [
        { id: 'h1', date: '2026-11-19', description: 'Bonus de bienvenue', points: 50 },
        { id: 'h2', date: '2026-11-19', description: 'Achat commande #ORD-9842', points: 70 }
      ]
    };
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('myrlane_chat');
    return saved ? JSON.parse(saved) : [
      {
        id: 'msg-1',
        sender: 'pharmacist',
        text: 'Bonjour ! Je suis Claire, pharmacienne conseil chez Myrlane. Avez-vous une question sur nos produits ou besoin d\'une recommandation pour votre routine ?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('myrlane_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Marie Dupont',
      email: 'marie.dupont@example.com',
      skinType: 'Mixte à sensible',
      concerns: ['Hydratation', 'Éclat du teint']
    };
  });

  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [selectedTag, setSelectedTag] = useState<string>('Tous');

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState<boolean>(false);
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState<boolean>(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);
  const [isFaqOpen, setIsFaqOpen] = useState<boolean>(false);
  const [isLegalOpen, setIsLegalOpen] = useState<boolean>(false);
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch initial products and orders from server database
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch(err => console.log('Server products fetch error:', err));

    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOrders(data);
        }
      })
      .catch(err => console.log('Server orders fetch error:', err));
  }, []);

  // Real-time WebSocket live updates from server
  useEffect(() => {
    const socket = io();

    socket.on('products-updated', (updatedProducts: Product[]) => {
      setProducts(updatedProducts);
    });

    socket.on('orders-updated', (updatedOrders: Order[]) => {
      setOrders(updatedOrders);
    });

    socket.on('stock-updated', ({ productId, stock }: { productId: string; stock: number }) => {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock } : p));
    });

    socket.on('order-status-updated', ({ orderId, status }: { orderId: string; status: Order['status'] }) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Save to localStorage & sync across tabs
  useEffect(() => {
    localStorage.setItem('myrlane_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('myrlane_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('myrlane_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('myrlane_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('myrlane_loyalty', JSON.stringify(loyalty));
  }, [loyalty]);

  useEffect(() => {
    localStorage.setItem('myrlane_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('myrlane_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Storage listener for real-time multi-device / multi-tab sync simulation
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'myrlane_products' && e.newValue) {
        setProducts(JSON.parse(e.newValue));
      }
      if (e.key === 'myrlane_orders' && e.newValue) {
        setOrders(JSON.parse(e.newValue));
      }
      if (e.key === 'myrlane_cart' && e.newValue) {
        setCart(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      showToast(`Désolé, ${product.name} est actuellement en rupture de stock.`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
    });
    showToast(`${product.name} ajouté au panier avec succès !`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    showToast('Article retiré du panier.');
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const product = products.find(p => p.id === productId);
    const maxStock = product ? product.stock : 99;
    const finalQty = Math.min(maxStock, quantity);

    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity: finalQty } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast('Article retiré de vos favoris.');
        return prev.filter(id => id !== productId);
      } else {
        showToast('Article ajouté à vos favoris !');
        return [...prev, productId];
      }
    });
  };

  const updateProductStock = async (productId: string, newStock: number) => {
    const validatedStock = Math.max(0, newStock);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: validatedStock } : p));
    try {
      await fetch(`/api/products/${productId}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: validatedStock })
      });
      showToast('Stock synchronisé sur le serveur en temps réel.');
    } catch (err) {
      console.error('Stock sync error:', err);
    }
  };

  const addProduct = async (newProdData: Omit<Product, 'id' | 'rating' | 'reviewsCount'>) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProdData)
      });
      const data = await res.json();
      if (data.success && data.product) {
        setProducts(prev => [data.product, ...prev]);
        showToast('Nouveau produit enregistré sur le serveur avec succès !');
      }
    } catch (err) {
      console.error('Add product error:', err);
      const newProduct: Product = {
        ...newProdData,
        id: `p-${Date.now()}`,
        rating: 5.0,
        reviewsCount: 1
      };
      setProducts(prev => [newProduct, ...prev]);
      showToast('Produit ajouté (mode local).');
    }
  };

  const createOrder = (address: ShippingAddress, paymentMethod: PaymentMethod, carrier: ShippingCarrier, promoCode?: string) => {
    const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const discount = promoCode && promoCode.toUpperCase() === 'MYRLANE10' ? subtotal * 0.1 : 0;
    const shippingFee = subtotal > 49 ? 0 : 4.90;
    const totalAmount = Number((subtotal - discount + shippingFee).toFixed(2));
    const pointsEarned = Math.floor(totalAmount);

    const newOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      items: [...cart],
      totalAmount,
      shippingAddress: address,
      paymentMethod,
      carrier,
      status: 'En préparation',
      trackingNumber: `FR${Math.floor(100000000 + Math.random() * 900000000)}`,
      loyaltyPointsEarned: pointsEarned
    };

    // Update real-time inventory
    setProducts(prev => {
      const updated = [...prev];
      cart.forEach(cartItem => {
        const pIndex = updated.findIndex(p => p.id === cartItem.product.id);
        if (pIndex !== -1) {
          updated[pIndex] = {
            ...updated[pIndex],
            stock: Math.max(0, updated[pIndex].stock - cartItem.quantity)
          };
        }
      });
      return updated;
    });

    // Update orders
    setOrders(prev => [newOrder, ...prev]);

    // Save order to server database
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(err => console.log('Order sync error:', err));

    // Update loyalty points
    setLoyalty(prev => {
      const newPoints = prev.points + pointsEarned;
      let newTier: 'Bronze' | 'Silver' | 'Gold' = prev.tier;
      if (newPoints >= 500) newTier = 'Gold';
      else if (newPoints >= 200) newTier = 'Silver';

      return {
        points: newPoints,
        tier: newTier,
        history: [
          {
            id: `h-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            description: `Achat commande ${newOrder.id}`,
            points: pointsEarned
          },
          ...prev.history
        ]
      };
    });

    clearCart();
    setIsCheckoutOpen(false);

    // Send confirmation email via SMTP API
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: address.email,
        subject: `Confirmation de commande ${newOrder.id} - Myrlane`,
        message: `Bonjour ${address.fullName},\n\nVotre commande ${newOrder.id} d'un montant de ${totalAmount.toFixed(2)}€ a bien été validée et payée via ${paymentMethod}.\nTransporteur : ${carrier}.\nNuméro de suivi : ${newOrder.trackingNumber}.\n\nMerci de votre confiance !\nL'équipe Myrlane`,
        orderId: newOrder.id
      })
    }).catch(err => console.log('SMTP email dispatch error:', err));

    showToast(`Commande ${newOrder.id} validée avec succès ! +${pointsEarned} points fidélité.`);
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (err) {
      console.error('Order status sync error:', err);
    }

    // Send status update email via SMTP API
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'client@example.com',
        subject: `Mise à jour de votre commande ${orderId} - Myrlane`,
        message: `Le statut de votre commande ${orderId} a été mis à jour : ${status}.`,
        orderId
      })
    }).catch(err => console.log('SMTP status email error:', err));

    showToast(`Statut de la commande ${orderId} mis à jour : ${status}`);
  };

  const sendChatMessage = (text: string, sender: 'user' | 'bot' | 'pharmacist' = 'user') => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMsg]);

    if (sender === 'user') {
      // Simulate automated pharmacist response after 1 second if no pharmacist answers
      setTimeout(() => {
        let reply = "Merci pour votre message. Un de nos pharmaciens diplômés vous répond dans les plus brefs délais. En attendant, n'hésitez pas à consulter nos fiches conseils ou notre assistant IA beauté !";
        const lower = text.toLowerCase();
        if (lower.includes('livraison') || lower.includes('colis')) {
          reply = "Nos expéditions sont traitées en 24h ouvrées. La livraison standard Colissimo prend 48h à 72h. Vous pouvez suivre votre colis en temps réel depuis l'onglet 'Mes Commandes'.";
        } else if (lower.includes('code') || lower.includes('promo')) {
          reply = "Profitez de 10% de réduction sur votre panier avec le code promo : MYRLANE10 !";
        } else if (lower.includes('paiement') || lower.includes('carte')) {
          reply = "Tous nos paiements en ligne sont 100% sécurisés via cryptage SSL (CB, Visa, Mastercard, PayPal, Apple Pay, Google Pay).";
        }

        setChatMessages(curr => [
          ...curr,
          {
            id: `msg-${Date.now() + 1}`,
            sender: 'pharmacist',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 1200);
    }
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...profile }));
    showToast('Profil et préférences mis à jour avec succès.');
  };

  return (
    <ShopContext.Provider value={{
      products,
      cart,
      wishlist,
      orders,
      loyalty,
      chatMessages,
      userProfile,
      isAdminMode,
      searchQuery,
      selectedCategory,
      selectedTag,
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
      selectedProductForDetail,
      toastMessage,
      setSearchQuery,
      setSelectedCategory,
      setSelectedTag,
      setIsCartOpen,
      setIsCheckoutOpen,
      setIsAiAdvisorOpen,
      setIsLoyaltyOpen,
      setIsChatOpen,
      setIsOrderTrackingOpen,
      setIsWishlistOpen,
      setIsFaqOpen,
      setIsLegalOpen,
      setIsAccountOpen,
      setSelectedProductForDetail,
      setIsAdminMode,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      toggleWishlist,
      createOrder,
      updateOrderStatus,
      updateProductStock,
      addProduct,
      sendChatMessage,
      updateUserProfile,
      showToast
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within a ShopProvider');
  return context;
};
