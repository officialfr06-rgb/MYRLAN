import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import {
  Product,
  CartItem,
  Order,
  ChatMessage,
  UserProfile,
  LoyaltyAccount,
  ShippingAddress,
  PaymentMethod,
  ShippingCarrier,
  User,
  PromoCode,
  SavedAddress,
  ChatSession,
  DesignConfig,
  MaintenanceConfig
} from '../types';
import { MOCK_PRODUCTS } from '../data/mockProducts';
import { authFetch, clearAuthToken } from '../utils/authToken';

interface ShopContextType {
  products: Product[];
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  myOrders: Order[];
  promoCodes: PromoCode[];
  appliedPromo: PromoCode | null;
  loyalty: LoyaltyAccount;
  chatMessages: ChatMessage[];
  userProfile: UserProfile;
  isAdminMode: boolean;
  searchQuery: string;
  selectedCategory: string;
  selectedTag: string;
  selectedBrand: string;
  currentPath: string;
  currentSearch: string;
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
  isCompareOpen: boolean;
  compareList: string[];
  selectedProductForDetail: Product | null;
  toastMessage: string | null;
  designConfig: DesignConfig;
  maintenanceConfig: MaintenanceConfig;

  navigate: (path: string) => void;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (c: string) => void;
  setSelectedTag: (t: string) => void;
  setSelectedBrand: (b: string) => void;
  setAppliedPromo: (p: PromoCode | null) => void;
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
  setIsCompareOpen: (open: boolean) => void;
  setSelectedProductForDetail: (p: Product | null) => void;
  setIsAdminMode: (admin: boolean) => void;

  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  toggleCompare: (productId: string) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  validatePromoCode: (code: string, subtotal: number) => Promise<{ success: boolean; promo?: PromoCode; error?: string }>;
  createOrder: (
    address: ShippingAddress,
    paymentMethod: PaymentMethod,
    carrier: ShippingCarrier,
    promoCode?: string,
    honeypot?: string
  ) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  refreshOrders: () => Promise<void>;
  updateProductStock: (productId: string, newStock: number) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'rating' | 'reviewsCount'>) => Promise<void>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  sendChatMessage: (text: string, sender?: 'user' | 'bot' | 'pharmacist', meta?: { visitorName?: string; visitorEmail?: string }) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>, persistServer?: boolean) => Promise<void>;
  saveAddressesToAccount: (addresses: SavedAddress[]) => Promise<void>;
  updateMaintenanceConfig: (cfg: MaintenanceConfig) => Promise<boolean>;
  showToast: (msg: string) => void;
  currentUser: User | null;
  logoutUser: () => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  setDesignConfig: React.Dispatch<React.SetStateAction<DesignConfig>>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

function normalizePathname(raw: string): string {
  if (!raw) return '/';
  const [pathname] = raw.split('?');
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname || '/';
}

function normalizeProduct(p: Product): Product {
  const fallback = MOCK_PRODUCTS.find(m => m.id === p.id);
  return {
    ...fallback,
    ...p,
    price: Number(p.price ?? fallback?.price ?? 0),
    stock: Number(p.stock ?? fallback?.stock ?? 0),
    rating: typeof p.rating === 'number' && !Number.isNaN(p.rating) ? p.rating : (fallback?.rating ?? 4.8),
    reviewsCount: typeof p.reviewsCount === 'number' && !Number.isNaN(p.reviewsCount) ? p.reviewsCount : (fallback?.reviewsCount ?? 0),
    ingredients: Array.isArray(p.ingredients) ? p.ingredients : (fallback?.ingredients ?? []),
    tags: Array.isArray(p.tags) ? p.tags : (fallback?.tags ?? [])
  };
}

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => normalizePathname(window.location.pathname));
  const [currentSearch, setCurrentSearch] = useState<string>(() => window.location.search || '');

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('myrlan_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map(normalizeProduct);
      }
    } catch {
      // fallback
    }
    return MOCK_PRODUCTS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('myrlan_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('myrlan_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [compareList, setCompareList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('myrlan_compare');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [guestOrders, setGuestOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('myrlan_guest_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([
    { id: 'promo-1', code: 'MYRLANE10', discountPercent: 10, minOrder: 0, description: '10% sur toute la boutique', active: true }
  ]);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

  const [loyalty, setLoyalty] = useState<LoyaltyAccount>(() => {
    const saved = localStorage.getItem('myrlan_loyalty');
    return saved ? JSON.parse(saved) : {
      points: 120,
      tier: 'Silver',
      history: [
        { id: 'h1', date: '2026-11-19', description: 'Bonus de bienvenue', points: 50 },
        { id: 'h2', date: '2026-11-19', description: 'Achat commande #ORD-9842', points: 70 }
      ]
    };
  });

  const [chatSessionId] = useState<string>(() => {
    const existing = localStorage.getItem('myrlan_chat_session_id');
    if (existing) return existing;
    const generated = `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem('myrlan_chat_session_id', generated);
    return generated;
  });

  const welcomeChatMessage: ChatMessage = useMemo(() => ({
    id: 'msg-welcome',
    sender: 'pharmacist',
    senderName: 'Claire (Pharmacienne)',
    text: 'Bonjour ! Je suis Claire, pharmacienne conseil chez Myrlan. Avez-vous une question sur nos produits ou besoin d\'une recommandation pour votre routine ?',
    timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }), []);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('myrlan_chat');
    return saved ? JSON.parse(saved) : [
      {
        id: 'msg-welcome',
        sender: 'pharmacist',
        senderName: 'Claire (Pharmacienne)',
        text: 'Bonjour ! Je suis Claire, pharmacienne conseil chez Myrlan. Avez-vous une question sur nos produits ou besoin d\'une recommandation pour votre routine ?',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('myrlan_profile');
    return saved ? JSON.parse(saved) : {
      name: '',
      email: '',
      skinType: 'Mixte à sensible',
      concerns: ['Hydratation', 'Éclat du teint'],
      savedAddresses: []
    };
  });

  const [currentUser, setCurrentUserState] = useState<User | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [selectedTag, setSelectedTag] = useState<string>('Tous');
  const [selectedBrand, setSelectedBrand] = useState<string>('Toutes');

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
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [designConfig, setDesignConfig] = useState<DesignConfig>({
    activeHeroId: 'officine_navy',
    customBadge: '',
    customTitle: '',
    customSubtitle: '',
    customPrimaryCtaLabel: '',
    showTrustBar: true
  });

  const [maintenanceConfig, setMaintenanceConfig] = useState<MaintenanceConfig>({
    enabled: false,
    message: 'Notre officine fait peau neuve pour mieux vous servir. Nous serons de retour très prochainement.'
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // History API navigation
  const navigate = useCallback((rawPath: string) => {
    const [rawPathname, rawSearch] = rawPath.split('?');
    const cleanPath = normalizePathname(rawPathname);
    const cleanSearch = rawSearch ? `?${rawSearch}` : '';
    const fullUrl = `${cleanPath}${cleanSearch}`;

    if (window.location.pathname + window.location.search !== fullUrl) {
      window.history.pushState({}, '', fullUrl);
    }
    setCurrentPath(cleanPath);
    setCurrentSearch(cleanSearch);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(normalizePathname(window.location.pathname));
      setCurrentSearch(window.location.search || '');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Derived states synchronized with URL
  const isAdminMode = currentPath === '/admin';
  const setIsAdminMode = useCallback((admin: boolean) => {
    navigate(admin ? '/admin' : '/');
  }, [navigate]);

  const selectedProductForDetail = useMemo(() => {
    if (!currentPath.startsWith('/produit/')) return null;
    const id = decodeURIComponent(currentPath.replace('/produit/', ''));
    return products.find(p => p.id === id) || null;
  }, [currentPath, products]);

  const setSelectedProductForDetail = useCallback((p: Product | null) => {
    if (p) {
      navigate(`/produit/${encodeURIComponent(p.id)}`);
    } else if (currentPath.startsWith('/produit/')) {
      navigate('/');
    }
  }, [navigate, currentPath]);

  const refreshOrders = useCallback(async () => {
    try {
      const res = await authFetch('/api/orders');
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.warn('Orders fetch error:', err);
    }
  }, []);

  const setCurrentUser = useCallback((user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      setUserProfile(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
        skinType: user.skinType || prev.skinType,
        concerns: user.concerns || prev.concerns,
        savedAddresses: user.savedAddresses || prev.savedAddresses || []
      }));
    }
    refreshOrders();
  }, [refreshOrders]);

  const logoutUser = useCallback(async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    clearAuthToken();
    setCurrentUserState(null);
    setOrders([]);
    if (currentPath === '/admin') {
      navigate('/');
    }
    showToast('Vous avez été déconnecté avec succès.');
  }, [currentPath, navigate, showToast]);

  // Initial data & authenticated session bootstrap
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setProducts(data.map(normalizeProduct));
      })
      .catch(() => {});

    fetch('/api/promos')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPromoCodes(data);
      })
      .catch(() => {});

    fetch('/api/design/public')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object' && data.activeHeroId) {
          setDesignConfig(data);
        }
      })
      .catch(() => {});

    fetch('/api/maintenance')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.maintenance) {
          setMaintenanceConfig(data.maintenance);
        }
      })
      .catch(() => {});

    fetch('/api/maintenance')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.maintenance) {
          setMaintenanceConfig(data.maintenance);
        }
      })
      .catch(() => {});

    authFetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setOrders([]);
        }
      })
      .catch(() => {});

    // Hydrate persisted live chat session & migrate any pre-existing unsynced local user messages
    authFetch(`/api/chat/session/${encodeURIComponent(chatSessionId)}`)
      .then(res => res.json())
      .then(async (data) => {
        if (data.success && data.session && Array.isArray(data.session.messages) && data.session.messages.length > 0) {
          setChatMessages([welcomeChatMessage, ...data.session.messages]);
        } else if (!localStorage.getItem('myrlan_chat_migrated')) {
          localStorage.setItem('myrlan_chat_migrated', '1');
          const savedRaw = localStorage.getItem('myrlan_chat');
          if (savedRaw) {
            try {
              const localMsgs = JSON.parse(savedRaw) as ChatMessage[];
              const unsentUserMsgs = localMsgs.filter(m => m.sender === 'user' && m.text?.trim());
              if (unsentUserMsgs.length > 0) {
                let latestSession: ChatSession | null = null;
                for (const m of unsentUserMsgs) {
                  const postRes = await authFetch(`/api/chat/session/${encodeURIComponent(chatSessionId)}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: m.text, timestamp: m.timestamp })
                  });
                  const postData = await postRes.json();
                  if (postData.success && postData.session) latestSession = postData.session;
                }
                if (latestSession) {
                  setChatMessages([welcomeChatMessage, ...latestSession.messages]);
                }
              }
            } catch {
              // ignore
            }
          }
        }
      })
      .catch(() => {});
  }, [setCurrentUser, chatSessionId, welcomeChatMessage]);

  // Real-time WebSocket live updates from server
  useEffect(() => {
    const socket = io();

    socket.on('products-updated', (updatedProducts: Product[]) => {
      if (Array.isArray(updatedProducts)) {
        setProducts(updatedProducts.map(normalizeProduct));
      }
    });

    socket.on('promos-updated', (updatedPromos: PromoCode[]) => {
      setPromoCodes(updatedPromos);
    });

    socket.on('orders-updated', () => {
      refreshOrders();
    });

    socket.on('stock-updated', ({ productId, stock }: { productId: string; stock: number }) => {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock } : p));
    });

    socket.on('order-status-updated', ({ orderId, status }: { orderId: string; status: Order['status'] }) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      setGuestOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    });

    socket.on('chat-session-updated', (session: ChatSession) => {
      if (session && session.id === chatSessionId && Array.isArray(session.messages)) {
        setChatMessages([welcomeChatMessage, ...session.messages]);
      }
    });

    socket.on('design-updated', (updatedDesign: DesignConfig) => {
      if (updatedDesign && updatedDesign.activeHeroId) {
        setDesignConfig(updatedDesign);
      }
    });

    socket.on('maintenance-updated', (updatedMaint: MaintenanceConfig) => {
      if (updatedMaint && typeof updatedMaint === 'object') {
        setMaintenanceConfig(updatedMaint);
      }
    });

    socket.on('maintenance-updated', (updatedMaint: MaintenanceConfig) => {
      if (updatedMaint && typeof updatedMaint === 'object') {
        setMaintenanceConfig(updatedMaint);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [refreshOrders, chatSessionId, welcomeChatMessage]);

  useEffect(() => {
    localStorage.setItem('myrlan_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('myrlan_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('myrlan_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('myrlan_compare', JSON.stringify(compareList));
  }, [compareList]);

  useEffect(() => {
    localStorage.setItem('myrlan_guest_orders', JSON.stringify(guestOrders));
  }, [guestOrders]);

  useEffect(() => {
    localStorage.setItem('myrlan_loyalty', JSON.stringify(loyalty));
  }, [loyalty]);

  useEffect(() => {
    localStorage.setItem('myrlan_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('myrlan_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  const myOrders = useMemo(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        const emailLower = currentUser.email.toLowerCase();
        return orders.filter(
          o => o.userId === currentUser.id || o.shippingAddress?.email?.toLowerCase() === emailLower
        );
      }
      return orders;
    }
    return guestOrders;
  }, [currentUser, orders, guestOrders]);

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
    setAppliedPromo(null);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast('Article retiré de vos favoris.');
        return prev.filter(id => id !== productId);
      }
      showToast('Article ajouté à vos favoris !');
      return [...prev, productId];
    });
  };

  const toggleCompare = (productId: string) => {
    if (compareList.includes(productId)) {
      setCompareList(prev => prev.filter(id => id !== productId));
      showToast('Produit retiré du comparateur.');
      return;
    }
    if (compareList.length >= 4) {
      showToast('Maximum 4 produits dans le comparateur. Retirez-en un pour en ajouter un autre.');
      return;
    }
    const target = products.find(p => p.id === productId);
    const nextCount = compareList.length + 1;
    setCompareList(prev => [...prev, productId]);
    showToast(`${target ? target.name : 'Produit'} ajouté au comparateur (${nextCount}/4).`);
  };

  const removeFromCompare = (productId: string) => {
    setCompareList(prev => {
      const next = prev.filter(id => id !== productId);
      if (next.length === 0) setIsCompareOpen(false);
      return next;
    });
  };

  const clearCompare = () => {
    setCompareList([]);
    setIsCompareOpen(false);
    showToast('Comparateur vidé.');
  };

  const validatePromoCode = async (code: string, subtotal: number) => {
    try {
      const res = await authFetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal })
      });
      const data = await res.json();
      if (data.success && data.promo) {
        setAppliedPromo(data.promo);
        return { success: true, promo: data.promo as PromoCode };
      }
      return { success: false, error: data.error || 'Code promo invalide.' };
    } catch {
      return { success: false, error: 'Impossible de vérifier le code promo.' };
    }
  };

  const updateProductStock = async (productId: string, newStock: number) => {
    const validatedStock = Math.max(0, newStock);
    try {
      const res = await authFetch(`/api/products/${productId}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: validatedStock })
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: validatedStock } : p));
        showToast('Stock synchronisé sur le serveur en temps réel.');
      } else {
        showToast(data.error || 'Action réservée à l’administrateur.');
      }
    } catch {
      showToast('Erreur réseau lors de la mise à jour du stock.');
    }
  };

  const addProduct = async (newProdData: Omit<Product, 'id' | 'rating' | 'reviewsCount'>) => {
    try {
      const res = await authFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProdData)
      });
      const data = await res.json();
      if (data.success && data.product) {
        setProducts(prev => {
          const exists = prev.some(p => p.id === data.product.id);
          return exists ? prev : [data.product, ...prev];
        });
        showToast('Nouveau produit enregistré sur le serveur avec succès !');
      } else {
        showToast(data.error || 'Action réservée à l’administrateur.');
      }
    } catch {
      showToast('Erreur de connexion au serveur.');
    }
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
      const res = await authFetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success && data.product) {
        setProducts(prev => prev.map(p => p.id === productId ? data.product : p));
        showToast('Produit mis à jour avec succès.');
        return true;
      }
      showToast(data.error || 'Erreur lors de la modification.');
      return false;
    } catch {
      showToast('Erreur réseau.');
      return false;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const res = await authFetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        showToast('Produit supprimé du catalogue.');
        return true;
      }
      showToast(data.error || 'Erreur lors de la suppression.');
      return false;
    } catch {
      showToast('Erreur réseau.');
      return false;
    }
  };

  const createOrder = async (
    address: ShippingAddress,
    paymentMethod: PaymentMethod,
    carrier: ShippingCarrier,
    promoCode?: string,
    honeypot?: string
  ): Promise<Order> => {
    const effectiveCode = promoCode || appliedPromo?.code;
    const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const matchingPromo = effectiveCode
      ? promoCodes.find(p => p.code.toUpperCase() === effectiveCode.toUpperCase() && p.active && subtotal >= p.minOrder)
      : undefined;
    const discountAmount = matchingPromo ? Number(((subtotal * matchingPromo.discountPercent) / 100).toFixed(2)) : 0;
    const shippingFee = carrier === 'click_and_collect' || subtotal >= 49
      ? 0
      : carrier === 'chronopost'
        ? 9.90
        : carrier === 'mondial_relay'
          ? 3.90
          : 4.90;
    const totalAmount = Number(Math.max(0, subtotal - discountAmount + shippingFee).toFixed(2));
    const pointsEarned = Math.floor(totalAmount);

    const payload: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      items: [...cart],
      subtotal: Number(subtotal.toFixed(2)),
      discountAmount,
      shippingFee,
      promoCode: matchingPromo?.code,
      totalAmount,
      shippingAddress: address,
      paymentMethod,
      carrier,
      status: 'En préparation',
      trackingNumber: `FR${Math.floor(100000000 + Math.random() * 900000000)}`,
      loyaltyPointsEarned: pointsEarned
    };

    const res = await authFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, website: honeypot || '' })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success || !data?.order) {
      throw new Error(data?.error || 'Impossible de valider votre commande. Vérifiez les quantités ou le mode de paiement.');
    }
    const finalOrder: Order = data.order;

    setProducts(prev => {
      const updated = [...prev];
      finalOrder.items.forEach(cartItem => {
        const idx = updated.findIndex(p => p.id === cartItem.product.id);
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], stock: Math.max(0, updated[idx].stock - cartItem.quantity) };
        }
      });
      return updated;
    });

    if (currentUser) {
      setOrders(prev => [finalOrder, ...prev.filter(o => o.id !== finalOrder.id)]);
    } else {
      setGuestOrders(prev => [finalOrder, ...prev.filter(o => o.id !== finalOrder.id)]);
    }

    setLoyalty(prev => {
      const newPoints = prev.points + finalOrder.loyaltyPointsEarned;
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
            description: `Achat commande ${finalOrder.id}`,
            points: finalOrder.loyaltyPointsEarned
          },
          ...prev.history
        ]
      };
    });

    clearCart();

    showToast(`Commande ${finalOrder.id} validée avec succès ! +${finalOrder.loyaltyPointsEarned} points fidélité.`);
    return finalOrder;
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const res = await authFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        showToast(`Statut de la commande ${orderId} mis à jour : ${status}`);
      } else {
        showToast(data.error || 'Action réservée à l’administrateur.');
      }
    } catch {
      showToast('Erreur réseau lors de la mise à jour.');
    }
  };

  const sendChatMessage = async (
    text: string,
    sender: 'user' | 'bot' | 'pharmacist' = 'user',
    meta?: { visitorName?: string; visitorEmail?: string }
  ) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    const timestamp = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const optimisticMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender,
      senderName: sender === 'user' ? (meta?.visitorName || currentUser?.name || 'Vous') : 'Claire (Pharmacienne)',
      text: cleanText,
      timestamp
    };
    setChatMessages(prev => [...prev, optimisticMsg]);

    if (sender === 'user') {
      try {
        const res = await authFetch(`/api/chat/session/${encodeURIComponent(chatSessionId)}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanText,
            timestamp,
            visitorName: meta?.visitorName || currentUser?.name || userProfile.name || undefined,
            visitorEmail: meta?.visitorEmail || currentUser?.email || userProfile.email || undefined
          })
        });
        const data = await res.json();
        if (data.success && data.session && Array.isArray(data.session.messages)) {
          setChatMessages([welcomeChatMessage, ...data.session.messages]);
          localStorage.setItem('myrlan_chat_migrated', '1');
        }
      } catch {
        showToast('Impossible de joindre le serveur de messagerie.');
      }
    }
  };

  const updateUserProfile = async (profile: Partial<UserProfile>, persistServer = true) => {
    setUserProfile(prev => ({ ...prev, ...profile }));
    if (persistServer && currentUser) {
      try {
        const res = await authFetch('/api/account/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile)
        });
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUserState(data.user);
        }
      } catch {
        // ignore
      }
    }
    showToast('Profil et préférences mis à jour avec succès.');
  };

  const saveAddressesToAccount = async (addresses: SavedAddress[]) => {
    await updateUserProfile({ savedAddresses: addresses }, true);
  };

  const updateMaintenanceConfig = useCallback(async (cfg: MaintenanceConfig) => {
    try {
      const res = await authFetch('/api/admin/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
      });
      const data = await res.json();
      if (data.success && data.maintenance) {
        setMaintenanceConfig(data.maintenance);
        showToast('Configuration du mode maintenance enregistrée.');
        return true;
      }
      showToast(data.error || 'Erreur lors de la mise à jour du mode maintenance.');
      return false;
    } catch {
      showToast('Erreur réseau lors de la mise à jour.');
      return false;
    }
  }, [showToast]);

  return (
    <ShopContext.Provider
      value={{
        products,
        cart,
        wishlist,
        orders,
        myOrders,
        promoCodes,
        appliedPromo,
        loyalty,
        chatMessages,
        userProfile,
        isAdminMode,
        searchQuery,
        selectedCategory,
        selectedTag,
        selectedBrand,
        currentPath,
        currentSearch,
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
        compareList,
        selectedProductForDetail,
        toastMessage,
        designConfig,
        maintenanceConfig,
        navigate,
        setSearchQuery,
        setSelectedCategory,
        setSelectedTag,
        setSelectedBrand,
        setAppliedPromo,
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
        setIsCompareOpen,
        setSelectedProductForDetail,
        setIsAdminMode,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        toggleCompare,
        removeFromCompare,
        clearCompare,
        validatePromoCode,
        createOrder,
        updateOrderStatus,
        refreshOrders,
        updateProductStock,
        addProduct,
        updateProduct,
        deleteProduct,
        sendChatMessage,
        updateUserProfile,
        saveAddressesToAccount,
        updateMaintenanceConfig,
        showToast,
        currentUser,
        logoutUser,
        setCurrentUser,
        setDesignConfig
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within a ShopProvider');
  return context;
};
