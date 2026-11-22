import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag, FileText, Mail,
  Plus, Search, Edit, Trash2, ShieldCheck, AlertTriangle, TrendingUp,
  Store, LogOut, LogIn, X, CheckCircle, ExternalLink, ChevronRight,
  Menu, Eye, Printer, ArrowUpRight, Filter, Euro, BarChart3
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { CATEGORIES } from '../data/mockProducts';
import { Product, Order, AdminUserSummary, Prescription, ContactMessage } from '../types';
import { AdminAnalyticsCharts } from './AdminAnalyticsCharts';
import { AdminStockDashboard } from './AdminStockDashboard';

type AdminTab =
  | 'overview'
  | 'orders'
  | 'prescriptions'
  | 'stock_levels'
  | 'inventory'
  | 'promos'
  | 'users'
  | 'messages';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser, setIsAccountOpen, logoutUser, navigate,
    products, orders, promoCodes,
    updateProductStock, updateOrderStatus, addProduct, updateProduct, deleteProduct,
    showToast
  } = useShop();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Inventory filters & modals
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('Tous');
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Orders filters & inspector drawer
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('Toutes');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Prescriptions filters & inspector
  const [rxStatusFilter, setRxStatusFilter] = useState<string>('Toutes');
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [rxNoteInput, setRxNoteInput] = useState('');

  // Users filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'customer' | 'admin'>('all');

  // Messages inbox
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Server data collections
  const [adminUsers, setAdminUsers] = useState<AdminUserSummary[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

  // Promo form
  const [newPromo, setNewPromo] = useState({ code: '', discountPercent: 15, minOrder: 0, description: '' });

  // Add product form
  const emptyProductForm = {
    name: '',
    brand: '',
    category: 'Soin Visage',
    price: 19.90,
    oldPrice: '',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=800',
    stock: 30,
    description: '',
    ingredients: 'Aqua, Glycerin, Niacinamide',
    usage: 'Appliquer matin et soir sur une peau propre.',
    tags: 'Bio, Sans Paraben',
    volume: '50 ml',
    ean: '3700123456790',
    form: 'Crème fluide',
    presentation: 'Tube de 50 ml',
    contenance: '50 ml'
  };
  const [newProd, setNewProd] = useState(emptyProductForm);

  useEffect(() => {
    if (currentUser?.role !== 'admin') return;

    fetch('/api/admin/users', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAdminUsers(d); })
      .catch(() => {});

    fetch('/api/prescriptions', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setPrescriptions(d); })
      .catch(() => {});

    fetch('/api/contact', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setContactMessages(d);
          if (d.length > 0) setSelectedMessageId(prev => prev || d[0].id);
        }
      })
      .catch(() => {});
  }, [currentUser, orders.length]);

  // Keep selectedOrder synced when status updates
  useEffect(() => {
    if (selectedOrder) {
      const fresh = orders.find(o => o.id === selectedOrder.id);
      if (fresh) setSelectedOrder(fresh);
    }
  }, [orders, selectedOrder]);

  // Derived metrics
  const totalRevenue = useMemo(() => orders.reduce((acc, o) => acc + o.totalAmount, 0), [orders]);
  const avgOrderValue = useMemo(() => (orders.length > 0 ? totalRevenue / orders.length : 0), [orders, totalRevenue]);
  const pendingOrdersCount = useMemo(() => orders.filter(o => o.status === 'En préparation').length, [orders]);
  const lowStockProducts = useMemo(() => products.filter(p => p.stock <= 5), [products]);
  const restockWatchCount = useMemo(() => products.filter(p => p.stock <= 15).length, [products]);
  const pendingRxCount = useMemo(() => prescriptions.filter(p => p.status === 'En attente').length, [prescriptions]);
  const unreadMessagesCount = useMemo(() => contactMessages.filter(m => m.status === 'Nouveau').length, [contactMessages]);

  // Filtered lists
  const filteredInventory = useMemo(() => {
    return products.filter(p => {
      const matchSearch =
        !inventorySearch ||
        p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        p.brand.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        p.ean.includes(inventorySearch);
      const matchCat = inventoryCategory === 'Tous' || p.category === inventoryCategory;
      const matchStock =
        inventoryStockFilter === 'all'
          ? true
          : inventoryStockFilter === 'low'
            ? p.stock > 0 && p.stock <= 5
            : p.stock === 0;
      return matchSearch && matchCat && matchStock;
    });
  }, [products, inventorySearch, inventoryCategory, inventoryStockFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch =
        !orderSearch ||
        o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.shippingAddress.fullName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.shippingAddress.email.toLowerCase().includes(orderSearch.toLowerCase());
      const matchStatus =
        orderStatusFilter === 'Toutes'
          ? true
          : orderStatusFilter === 'SAV'
            ? Boolean(o.returnRequest)
            : o.status === orderStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const filteredRx = useMemo(() => {
    return prescriptions.filter(rx => rxStatusFilter === 'Toutes' || rx.status === rxStatusFilter);
  }, [prescriptions, rxStatusFilter]);

  const filteredUsers = useMemo(() => {
    return adminUsers.filter(u => {
      const matchSearch =
        !userSearch ||
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      return matchSearch && matchRole;
    });
  }, [adminUsers, userSearch, userRoleFilter]);

  const activeMessage = useMemo(
    () => contactMessages.find(m => m.id === selectedMessageId) || contactMessages[0] || null,
    [contactMessages, selectedMessageId]
  );

  // Unauthenticated / Non-admin Gate
  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-8 text-center space-y-5 shadow-xs">
          <div className="w-14 h-14 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-700">Myrlan Officine Pro</span>
            <h1 className="text-xl font-bold text-slate-900">Espace Administrateur Pharmacien</h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              L’accès au back-office officinal est réservé aux pharmaciens et gestionnaires authentifiés.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => setIsAccountOpen(true)}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-xl inline-flex items-center justify-center gap-2 transition-colors"
            >
              <LogIn className="w-4 h-4" /> Se connecter avec un compte Admin
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition-colors"
            >
              Retourner à la boutique
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Server Action Helpers
  const uploadImageToServer = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: formData });
      const data = await res.json();
      if (data.success && data.url) {
        showToast('Image enregistrée sur le serveur.');
        return data.url;
      }
      showToast(data.error || "Erreur lors de l'envoi.");
    } catch {
      showToast("Erreur de connexion au serveur.");
    }
    return null;
  };

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addProduct({
      name: newProd.name,
      brand: newProd.brand,
      category: newProd.category,
      price: Number(newProd.price),
      oldPrice: newProd.oldPrice ? Number(newProd.oldPrice) : undefined,
      image: newProd.image,
      stock: Number(newProd.stock),
      description: newProd.description,
      ingredients: newProd.ingredients.split(',').map(s => s.trim()).filter(Boolean),
      usage: newProd.usage,
      tags: newProd.tags.split(',').map(s => s.trim()).filter(Boolean) as any,
      volume: newProd.volume,
      ean: newProd.ean,
      form: newProd.form,
      presentation: newProd.presentation,
      contenance: newProd.contenance
    });
    setNewProd(emptyProductForm);
    setIsAddProductOpen(false);
    setActiveTab('inventory');
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const ok = await updateProduct(editingProduct.id, editingProduct);
    if (ok) setEditingProduct(null);
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newPromo)
      });
      const data = await res.json();
      if (data.success) {
        setNewPromo({ code: '', discountPercent: 15, minOrder: 0, description: '' });
        showToast(`Code promo ${data.promo.code} créé.`);
      } else {
        showToast(data.error || 'Erreur création code promo.');
      }
    } catch {
      showToast('Erreur réseau.');
    }
  };

  const handleTogglePromo = async (id: string, active: boolean) => {
    await fetch(`/api/promos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ active })
    });
  };

  const handleDeletePromo = async (id: string) => {
    await fetch(`/api/promos/${id}`, { method: 'DELETE', credentials: 'include' });
    showToast('Code promo supprimé.');
  };

  const handleUpdatePrescription = async (id: string, status: Prescription['status'], pharmacistNote?: string) => {
    try {
      const res = await fetch(`/api/prescriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, pharmacistNote })
      });
      const data = await res.json();
      if (data.success) {
        setPrescriptions(prev => prev.map(p => p.id === id ? data.prescription : p));
        if (selectedRx?.id === id) setSelectedRx(data.prescription);
        showToast(`Ordonnance ${id} mise à jour : ${status}`);
      }
    } catch {
      showToast('Erreur réseau.');
    }
  };

  const handleMarkMessageRead = async (id: string) => {
    try {
      const res = await fetch(`/api/contact/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'Traité' })
      });
      const data = await res.json();
      if (data.success) {
        setContactMessages(prev => prev.map(m => m.id === id ? data.contactMessage : m));
        showToast('Demande marquée comme traitée.');
      }
    } catch {
      showToast('Erreur réseau.');
    }
  };

  const navGroups: { title: string; items: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] }[] = [
    {
      title: 'Pilotage',
      items: [
        { id: 'overview', label: 'Vue d’ensemble', icon: <LayoutDashboard className="w-4 h-4" /> }
      ]
    },
    {
      title: 'Activité Officinale',
      items: [
        { id: 'orders', label: 'Commandes', icon: <Package className="w-4 h-4" />, badge: pendingOrdersCount, badgeColor: 'bg-blue-100 text-blue-800' },
        { id: 'prescriptions', label: 'Ordonnances', icon: <FileText className="w-4 h-4" />, badge: pendingRxCount, badgeColor: 'bg-amber-100 text-amber-800' },
        { id: 'messages', label: 'Messages Patients', icon: <Mail className="w-4 h-4" />, badge: unreadMessagesCount, badgeColor: 'bg-rose-100 text-rose-700' }
      ]
    },
    {
      title: 'Catalogue & Offres',
      items: [
        { id: 'stock_levels', label: 'Niveaux de stock', icon: <BarChart3 className="w-4 h-4" />, badge: restockWatchCount, badgeColor: 'bg-amber-100 text-amber-800' },
        { id: 'inventory', label: 'Catalogue & Stocks', icon: <ShoppingBag className="w-4 h-4" />, badge: lowStockProducts.length, badgeColor: 'bg-rose-100 text-rose-700' },
        { id: 'promos', label: 'Codes Promo', icon: <Tag className="w-4 h-4" /> }
      ]
    },
    {
      title: 'Annuaire',
      items: [
        { id: 'users', label: 'Clients & Comptes', icon: <Users className="w-4 h-4" /> }
      ]
    }
  ];

  const sectionTitleMap: Record<AdminTab, string> = {
    overview: 'Vue d’ensemble',
    orders: 'Commandes & Expéditions',
    prescriptions: 'Ordonnances Patients',
    stock_levels: 'Niveaux de stock & Réapprovisionnement',
    inventory: 'Catalogue & Stocks',
    promos: 'Codes Promo & Remises',
    users: 'Clients & Comptes',
    messages: 'Messages Patients'
  };

  const statusBadgeClass = (status: string) => {
    if (status === 'Livré' || status === 'Validée par le pharmacien' || status === 'Prête en officine' || status === 'Traité') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (status === 'En préparation' || status === 'En attente' || status === 'Nouveau') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (status === 'Refusée') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
            M
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">Myrlan Pro</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Back-Office Officinal</div>
          </div>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {navGroups.map(group => (
          <div key={group.title} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              {group.title}
            </div>
            {group.items.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums ${isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-700 text-slate-200'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer / Pharmacist Profile & Exit */}
      <div className="p-3 border-t border-slate-800 space-y-2 shrink-0">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/60">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
            <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => navigate('/')}
            className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Store className="w-3.5 h-3.5" /> Boutique
          </button>
          <button
            onClick={logoutUser}
            className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Quitter
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-800 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-950/60" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative w-64 max-w-full h-full z-10">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-8 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
              <span className="hidden sm:inline font-medium text-slate-400 shrink-0">Espace Pharmacien</span>
              <ChevronRight className="w-3.5 h-3.5 hidden sm:inline text-slate-300 shrink-0" />
              <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">{sectionTitleMap[activeTab]}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap"
            >
              <span>Voir le site</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau produit</span>
              <span className="sm:hidden">Produit</span>
            </button>
          </div>
        </header>

        {/* Workspace Viewport */}
        <main className="flex-1 min-w-0 p-3 sm:p-8 max-w-7xl w-full mx-auto space-y-6">

          {/* ========================================================== */}
          {/* VIEW 1: OVERVIEW                                           */}
          {/* ========================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 4 KPI Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 tabular-nums">
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Chiffre d’affaires</span>
                    <Euro className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{totalRevenue.toFixed(2)} €</div>
                  <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Panier moyen : {avgOrderValue.toFixed(2)} €
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Commandes</span>
                    <Package className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{orders.length}</div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    <span className={pendingOrdersCount > 0 ? 'text-amber-700 font-semibold' : ''}>
                      {pendingOrdersCount} en préparation
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Alertes Stock (≤ 5)</span>
                    <AlertTriangle className={`w-4 h-4 ${lowStockProducts.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{lowStockProducts.length}</div>
                  <div className="text-[11px] text-slate-500">Sur {products.length} références actives</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Ordonnances &amp; Messages</span>
                    <FileText className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{pendingRxCount + unreadMessagesCount}</div>
                  <div className="text-[11px] text-slate-500">
                    {pendingRxCount} ordonnance(s) • {unreadMessagesCount} message(s)
                  </div>
                </div>
              </div>

              {/* Recharts Analytics: Daily Sales & Loyalty Program Trends */}
              <AdminAnalyticsCharts orders={orders} adminUsers={adminUsers} />

              {/* Split Workspace: Recent Orders + Priority Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Recent Orders Table */}
                <div className="lg:col-span-8 min-w-0 bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="font-bold text-sm text-slate-900">Dernières commandes</h2>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-semibold text-blue-700 hover:underline"
                    >
                      Tout voir →
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs tabular-nums">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="py-2.5 px-4">Réf.</th>
                          <th className="py-2.5 px-4">Client</th>
                          <th className="py-2.5 px-4">Date</th>
                          <th className="py-2.5 px-4 text-right">Total</th>
                          <th className="py-2.5 px-4">Statut</th>
                          <th className="py-2.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.slice(0, 6).map(o => (
                          <tr key={o.id} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{o.id}</td>
                            <td className="py-2.5 px-4 text-slate-700 truncate max-w-[160px]">{o.shippingAddress.fullName}</td>
                            <td className="py-2.5 px-4 text-slate-500">{o.date}</td>
                            <td className="py-2.5 px-4 text-right font-bold text-slate-900">{o.totalAmount.toFixed(2)} €</td>
                            <td className="py-2.5 px-4">
                              <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${statusBadgeClass(o.status)}`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => { setSelectedOrder(o); setActiveTab('orders'); }}
                                className="text-blue-700 hover:underline font-semibold"
                              >
                                Gérer
                              </button>
                            </td>
                          </tr>
                        ))}
                        {orders.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">Aucune commande enregistrée.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Priority Alerts Column */}
                <div className="lg:col-span-4 min-w-0 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                  <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="font-bold text-sm text-slate-900">Actions prioritaires</h2>
                    <button
                      onClick={() => setActiveTab('stock_levels')}
                      className="text-xs font-semibold text-blue-700 hover:underline"
                    >
                      Niveaux de stock →
                    </button>
                  </div>
                  <div className="p-4 space-y-3 flex-1">
                    {lowStockProducts.length === 0 && pendingRxCount === 0 && unreadMessagesCount === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                        <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto" />
                        <p>Aucune alerte critique en attente.</p>
                      </div>
                    ) : (
                      <>
                        {lowStockProducts.slice(0, 4).map(p => (
                          <div key={p.id} className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 truncate">{p.name}</div>
                              <div className="text-[11px] text-amber-800 font-medium tabular-nums">Stock restant : {p.stock} u.</div>
                            </div>
                            <button
                              onClick={() => updateProductStock(p.id, p.stock + 10)}
                              className="px-2.5 py-1 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-[11px] font-bold rounded shrink-0"
                            >
                              +10
                            </button>
                          </div>
                        ))}

                        {pendingRxCount > 0 && (
                          <button
                            onClick={() => setActiveTab('prescriptions')}
                            className="w-full p-3 rounded-lg border border-blue-200 bg-blue-50/50 text-left flex items-center justify-between hover:bg-blue-50 transition-colors"
                          >
                            <div>
                              <div className="text-xs font-bold text-blue-950">{pendingRxCount} ordonnance(s) à valider</div>
                              <div className="text-[11px] text-blue-700">Cliquer pour examiner</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-blue-600" />
                          </button>
                        )}

                        {unreadMessagesCount > 0 && (
                          <button
                            onClick={() => setActiveTab('messages')}
                            className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-left flex items-center justify-between hover:bg-slate-100 transition-colors"
                          >
                            <div>
                              <div className="text-xs font-bold text-slate-900">{unreadMessagesCount} message(s) patient non lu(s)</div>
                              <div className="text-[11px] text-slate-600">Ouvrir la messagerie</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW 2: ORDERS & INSPECTOR DRAWER                          */}
          {/* ========================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Filter Toolbar */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {['Toutes', 'En préparation', 'Expédié', 'En cours de livraison', 'Livré', 'SAV'].map(st => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        orderStatusFilter === st
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Rechercher ID, client, email..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs tabular-nums">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Commande</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Mode</th>
                        <th className="py-3 px-4 text-right">Montant</th>
                        <th className="py-3 px-4">Statut</th>
                        <th className="py-3 px-4 text-right">Détails</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map(o => (
                        <tr
                          key={o.id}
                          onClick={() => setSelectedOrder(o)}
                          className={`hover:bg-slate-50 cursor-pointer ${selectedOrder?.id === o.id ? 'bg-blue-50/40' : ''}`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-slate-900">{o.id}</div>
                            {o.returnRequest && (
                              <span className="text-[10px] font-bold text-amber-700">SAV demandé</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{o.shippingAddress.fullName}</div>
                            <div className="text-[11px] text-slate-400">{o.shippingAddress.email}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{o.date}</td>
                          <td className="py-3 px-4 uppercase font-medium text-slate-600">{o.carrier}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">{o.totalAmount.toFixed(2)} €</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded border text-[11px] font-semibold ${statusBadgeClass(o.status)}`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold inline-flex items-center gap-1">
                              <Eye className="w-3 h-3" /> Inspecter
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-slate-400">Aucune commande ne correspond à ces critères.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW 2B: STOCK LEVELS & REPLENISHMENT DASHBOARD            */}
          {/* ========================================================== */}
          {activeTab === 'stock_levels' && (
            <AdminStockDashboard
              products={products}
              updateProductStock={updateProductStock}
              onOpenInventory={() => setActiveTab('inventory')}
              showToast={showToast}
            />
          )}

          {/* ========================================================== */}
          {/* VIEW 3: INVENTORY & CATALOG                                */}
          {/* ========================================================== */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Nom, marque ou EAN..."
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <select
                    value={inventoryCategory}
                    onChange={(e) => setInventoryCategory(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
                  {[
                    { id: 'all', label: 'Tous' },
                    { id: 'low', label: 'Stock faible (≤5)' },
                    { id: 'out', label: 'Rupture' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setInventoryStockFilter(f.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        inventoryStockFilter === f.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs tabular-nums">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Produit / EAN</th>
                        <th className="py-3 px-4">Marque</th>
                        <th className="py-3 px-4">Catégorie</th>
                        <th className="py-3 px-4 text-right">Prix TTC</th>
                        <th className="py-3 px-4">Stock</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInventory.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-3">
                              <img src={p.image} alt={p.name} referrerPolicy="no-referrer" className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" />
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 truncate max-w-[240px]">{p.name}</div>
                                <div className="text-[10px] font-mono text-slate-400">{p.ean} • {p.volume}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 font-medium">{p.brand}</td>
                          <td className="py-2.5 px-4 text-slate-600">{p.category}</td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="font-bold text-slate-900">{p.price.toFixed(2)} €</div>
                            {p.oldPrice && <div className="text-[10px] text-slate-400 line-through">{p.oldPrice.toFixed(2)} €</div>}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="inline-flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${p.stock === 0 ? 'bg-rose-600' : p.stock <= 5 ? 'bg-amber-500' : 'bg-emerald-600'}`} />
                              <span className="font-bold text-slate-800">{p.stock} u.</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => updateProductStock(p.id, p.stock - 1)}
                                className="px-2 py-1 border border-slate-200 bg-white hover:bg-slate-100 rounded text-slate-700 font-bold"
                                title="Retirer 1"
                              >
                                -1
                              </button>
                              <button
                                onClick={() => updateProductStock(p.id, p.stock + 10)}
                                className="px-2 py-1 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded text-blue-800 font-bold"
                                title="Restocker +10"
                              >
                                +10
                              </button>
                              <button
                                onClick={() => setEditingProduct(p)}
                                className="p-1.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded"
                                title="Modifier la fiche"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {confirmDeleteId === p.id ? (
                                <div className="inline-flex items-center gap-1 ml-1">
                                  <button
                                    onClick={() => { deleteProduct(p.id); setConfirmDeleteId(null); }}
                                    className="px-2 py-1 bg-rose-600 text-white rounded font-bold text-[10px]"
                                  >
                                    Supprimer
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2 py-1 bg-slate-200 text-slate-700 rounded font-bold text-[10px]"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(p.id)}
                                  className="p-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredInventory.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-400">Aucun produit trouvé.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW 4: PRESCRIPTIONS                                      */}
          {/* ========================================================== */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-1.5">
                {['Toutes', 'En attente', 'Validée par le pharmacien', 'Prête en officine', 'Refusée'].map(st => (
                  <button
                    key={st}
                    onClick={() => setRxStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      rxStatusFilter === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs tabular-nums">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Réf.</th>
                        <th className="py-3 px-4">Patient</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Remise</th>
                        <th className="py-3 px-4">Document</th>
                        <th className="py-3 px-4">Statut</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRx.map(rx => (
                        <tr key={rx.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{rx.id}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{rx.patientName}</div>
                            <div className="text-[11px] text-slate-400">{rx.phone} • {rx.email}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{rx.createdAt}</td>
                          <td className="py-3 px-4 text-slate-700">
                            {rx.deliveryMode === 'click_and_collect' ? 'Click & Collect' : 'Livraison'}
                          </td>
                          <td className="py-3 px-4">
                            <a
                              href={rx.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-700 hover:underline font-semibold inline-flex items-center gap-1"
                            >
                              <span>{rx.fileName}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded border text-[11px] font-semibold ${statusBadgeClass(rx.status)}`}>
                              {rx.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => { setSelectedRx(rx); setRxNoteInput(rx.pharmacistNote || ''); }}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg"
                            >
                              Examiner
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredRx.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-slate-400">Aucune ordonnance dans cette catégorie.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW 5: PROMO CODES                                        */}
          {/* ========================================================== */}
          {activeTab === 'promos' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 min-w-0 bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200">
                  <h2 className="font-bold text-sm text-slate-900">Codes Promotionnels ({promoCodes.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs tabular-nums">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Remise</th>
                        <th className="py-3 px-4">Min.</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">État</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {promoCodes.map(promo => (
                        <tr key={promo.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-blue-900">{promo.code}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">-{promo.discountPercent}%</td>
                          <td className="py-3 px-4 text-slate-600">{promo.minOrder > 0 ? `${promo.minOrder} €` : '—'}</td>
                          <td className="py-3 px-4 text-slate-600">{promo.description}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${promo.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                              {promo.active ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleTogglePromo(promo.id, !promo.active)}
                                className="px-2.5 py-1 border border-slate-200 bg-white hover:bg-slate-100 rounded text-[11px] font-semibold"
                              >
                                {promo.active ? 'Désactiver' : 'Activer'}
                              </button>
                              <button
                                onClick={() => handleDeletePromo(promo.id)}
                                className="p-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <form onSubmit={handleCreatePromo} className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Nouveau code promo</h3>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    required
                    value={newPromo.code}
                    onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                    placeholder="ex: HIVER15"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono uppercase font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Remise (%)</label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      required
                      value={newPromo.discountPercent}
                      onChange={(e) => setNewPromo({ ...newPromo, discountPercent: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Minimum (€)</label>
                    <input
                      type="number"
                      min={0}
                      value={newPromo.minOrder}
                      onChange={(e) => setNewPromo({ ...newPromo, minOrder: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Libellé client</label>
                  <input
                    type="text"
                    value={newPromo.description}
                    onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                    placeholder="ex: -15% sur votre commande"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg">
                  Créer le code promo
                </button>
              </form>
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW 6: USERS                                              */}
          {/* ========================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: `Tous (${adminUsers.length})` },
                    { id: 'customer', label: 'Clients' },
                    { id: 'admin', label: 'Administrateurs' }
                  ].map(r => (
                    <button
                      key={r.id}
                      onClick={() => setUserRoleFilter(r.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        userRoleFilter === r.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Rechercher un compte..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs tabular-nums">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Nom</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Rôle</th>
                        <th className="py-3 px-4">Inscription</th>
                        <th className="py-3 px-4 text-right">Commandes</th>
                        <th className="py-3 px-4 text-right">Total dépensé</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-semibold text-slate-900">{u.name}</td>
                          <td className="py-3 px-4 text-slate-600">{u.email}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${u.role === 'admin' ? 'bg-slate-900 text-white border-slate-900' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                              {u.role === 'admin' ? 'Pharmacien Admin' : 'Client'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{u.createdAt}</td>
                          <td className="py-3 px-4 text-right font-semibold">{u.ordersCount}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">{u.totalSpent.toFixed(2)} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW 7: MESSAGES INBOX                                     */}
          {/* ========================================================== */}
          {activeTab === 'messages' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
              {/* Left Message List */}
              <div className="lg:col-span-5 min-w-0 border-b lg:border-b-0 lg:border-r border-slate-200 divide-y divide-slate-100 max-h-[540px] overflow-y-auto">
                {contactMessages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">Aucun message reçu.</div>
                ) : (
                  contactMessages.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMessageId(m.id)}
                      className={`w-full text-left p-4 hover:bg-slate-50 transition-colors space-y-1 ${
                        activeMessage?.id === m.id ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate flex items-center gap-1.5">
                          {m.status === 'Nouveau' && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                          {m.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">{m.createdAt}</span>
                      </div>
                      <div className="text-xs font-semibold text-blue-800 truncate">{m.subject}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{m.message}</div>
                    </button>
                  ))
                )}
              </div>

              {/* Right Reading Pane */}
              <div className="lg:col-span-7 p-6 flex flex-col justify-between">
                {!activeMessage ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                    Sélectionnez un message pour le consulter.
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                      <div>
                        <span className={`px-2.5 py-0.5 rounded border text-[10px] font-bold ${statusBadgeClass(activeMessage.status)}`}>
                          {activeMessage.status}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-2">{activeMessage.subject}</h3>
                        <div className="text-xs text-slate-500 mt-0.5">
                          De <strong>{activeMessage.name}</strong> ({activeMessage.email}{activeMessage.phone ? ` • ${activeMessage.phone}` : ''})
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-400">{activeMessage.createdAt}</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {activeMessage.message}
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                      {activeMessage.status === 'Nouveau' && (
                        <button
                          onClick={() => handleMarkMessageRead(activeMessage.id)}
                          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Marquer comme traité
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ================================================================== */}
      {/* SLIDE-OVER: ORDER INSPECTOR                                        */}
      {/* ================================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-950/50" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Détail Commande</div>
                <h3 className="font-mono font-bold text-lg text-slate-900">{selectedOrder.id}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Status Stepper */}
              <div className="space-y-2">
                <div className="font-bold text-slate-700">Statut d’expédition</div>
                <div className="grid grid-cols-2 gap-2">
                  {(['En préparation', 'Expédié', 'En cours de livraison', 'Livré'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => updateOrderStatus(selectedOrder.id, st)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                        selectedOrder.status === st
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Client & Address */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 mb-1">Client &amp; Livraison</div>
                <div>{selectedOrder.shippingAddress.fullName}</div>
                <div className="text-slate-600">{selectedOrder.shippingAddress.email} • {selectedOrder.shippingAddress.phone}</div>
                <div className="text-slate-600">{selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.postalCode} {selectedOrder.shippingAddress.city}</div>
                <div className="pt-1 text-slate-500">Transporteur : <strong className="uppercase">{selectedOrder.carrier}</strong> • Suivi : <span className="font-mono">{selectedOrder.trackingNumber}</span></div>
              </div>

              {/* SAV Alert */}
              {selectedOrder.returnRequest && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1 text-amber-950">
                  <div className="font-bold">Demande SAV / Retour ({selectedOrder.returnRequest.status})</div>
                  <div><strong>Motif :</strong> {selectedOrder.returnRequest.reason}</div>
                  <div><strong>Détails :</strong> {selectedOrder.returnRequest.details}</div>
                </div>
              )}

              {/* Items */}
              <div className="space-y-2">
                <div className="font-bold text-slate-700">Articles ({selectedOrder.items.length})</div>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 tabular-nums">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{item.product.name}</div>
                        <div className="text-[11px] text-slate-400">Qté : {item.quantity} × {item.product.price.toFixed(2)} €</div>
                      </div>
                      <div className="font-bold text-slate-900 shrink-0">{(item.product.price * item.quantity).toFixed(2)} €</div>
                    </div>
                  ))}
                  <div className="p-3 bg-slate-50 flex justify-between font-bold text-sm text-blue-900">
                    <span>Total TTC</span>
                    <span>{selectedOrder.totalAmount.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
              <button
                onClick={() => navigate(`/commande-confirmee/${encodeURIComponent(selectedOrder.id)}`)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Facture PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL: EXAMINE PRESCRIPTION                                        */}
      {/* ================================================================== */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-[11px] font-bold uppercase text-slate-400">Contrôle Pharmaceutique</div>
                <h3 className="font-mono font-bold text-base text-slate-900">{selectedRx.id} — {selectedRx.patientName}</h3>
              </div>
              <button onClick={() => setSelectedRx(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div><strong>Téléphone :</strong> {selectedRx.phone}</div>
                <div><strong>Email :</strong> {selectedRx.email}</div>
                <div><strong>Remise :</strong> {selectedRx.deliveryMode === 'click_and_collect' ? 'Click & Collect' : 'Livraison'}</div>
                <div><strong>Date :</strong> {selectedRx.createdAt}</div>
              </div>

              {selectedRx.notes && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-950">
                  <strong>Précisions patient :</strong> {selectedRx.notes}
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-700 truncate">{selectedRx.fileName}</span>
                <a
                  href={selectedRx.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-900 text-white font-semibold rounded-lg inline-flex items-center gap-1.5 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Ouvrir le document
                </a>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Note du pharmacien (visible par le patient)</label>
                <textarea
                  rows={2}
                  value={rxNoteInput}
                  onChange={(e) => setRxNoteInput(e.target.value)}
                  placeholder="Ex: Préparation prête au comptoir 2, merci d’apporter votre Carte Vitale..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                {(['En attente', 'Validée par le pharmacien', 'Prête en officine', 'Refusée'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => handleUpdatePrescription(selectedRx.id, st, rxNoteInput)}
                    className={`py-2 px-3 rounded-lg border font-semibold ${
                      selectedRx.status === st
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* SLIDE-OVER: ADD NEW PRODUCT                                        */}
      {/* ================================================================== */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-950/50" onClick={() => setIsAddProductOpen(false)} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Ajouter une référence au catalogue</h3>
              <button onClick={() => setIsAddProductOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom du produit *</label>
                  <input type="text" required value={newProd.name} onChange={(e) => setNewProd({ ...newProd, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Marque / Laboratoire *</label>
                  <input type="text" required value={newProd.brand} onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie</label>
                  <select value={newProd.category} onChange={(e) => setNewProd({ ...newProd, category: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
                    {CATEGORIES.filter(c => c !== 'Tous').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Code EAN</label>
                  <input type="text" value={newProd.ean} onChange={(e) => setNewProd({ ...newProd, ean: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prix TTC (€) *</label>
                  <input type="number" step="0.01" required value={newProd.price} onChange={(e) => setNewProd({ ...newProd, price: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ancien prix barré (€)</label>
                  <input type="number" step="0.01" value={newProd.oldPrice} onChange={(e) => setNewProd({ ...newProd, oldPrice: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock initial *</label>
                  <input type="number" required value={newProd.stock} onChange={(e) => setNewProd({ ...newProd, stock: parseInt(e.target.value, 10) })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Volume / Contenance *</label>
                  <input type="text" required value={newProd.volume} onChange={(e) => setNewProd({ ...newProd, volume: e.target.value, contenance: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Image produit</label>
                <div className="flex items-center gap-3">
                  <img src={newProd.image} alt="" referrerPolicy="no-referrer" className="w-14 h-14 rounded-lg object-cover border border-slate-200" />
                  <label className="flex-1 py-2.5 px-4 border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-lg text-center font-semibold text-slate-700 cursor-pointer">
                    Importer un fichier image (PNG, JPG, WEBP)
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const url = await uploadImageToServer(f);
                        if (url) setNewProd(prev => ({ ...prev, image: url }));
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description clinique *</label>
                <textarea rows={3} required value={newProd.description} onChange={(e) => setNewProd({ ...newProd, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Formule INCI (séparée par virgules)</label>
                <input type="text" value={newProd.ingredients} onChange={(e) => setNewProd({ ...newProd, ingredients: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono" />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddProductOpen(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg">
                  Annuler
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg">
                  Publier le produit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL: EDIT EXISTING PRODUCT                                       */}
      {/* ================================================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">Modifier : {editingProduct.name}</h3>
              <button onClick={() => setEditingProduct(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom</label>
                  <input type="text" required value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Marque</label>
                  <input type="text" required value={editingProduct.brand} onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie</label>
                  <select value={editingProduct.category} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
                    {CATEGORIES.filter(c => c !== 'Tous').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock</label>
                  <input type="number" required value={editingProduct.stock} onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value, 10) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prix actuel (€)</label>
                  <input type="number" step="0.01" required value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ancien prix barré (€)</label>
                  <input type="number" step="0.01" value={editingProduct.oldPrice ?? ''} onChange={(e) => setEditingProduct({ ...editingProduct, oldPrice: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea rows={3} value={editingProduct.description} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>

              <div className="flex items-center gap-3">
                <img src={editingProduct.image} alt="" referrerPolicy="no-referrer" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg cursor-pointer">
                  Remplacer l’image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await uploadImageToServer(f);
                      if (url) setEditingProduct(prev => prev ? { ...prev, image: url } : null);
                    }}
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg">
                  Annuler
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
