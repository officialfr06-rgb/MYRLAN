import React, { useState } from 'react';
import { 
  TrendingUp, Package, Users, DollarSign, AlertTriangle, 
  Plus, Edit, CheckCircle, RefreshCw, ShoppingBag, ShieldCheck 
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { CATEGORIES } from '../data/mockProducts';

export const AdminDashboard: React.FC = () => {
  const { products, orders, updateProductStock, updateOrderStatus, addProduct, showToast } = useShop();

  const [activeTab, setActiveTab] = useState<'stats' | 'inventory' | 'orders' | 'add-product'>('stats');

  // New product form state
  const [newProd, setNewProd] = useState({
    name: '',
    brand: '',
    category: 'Soin Visage',
    price: 19.90,
    oldPrice: 24.90,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=800',
    stock: 30,
    description: '',
    ingredients: 'Aqua, Glycerin, Niacinamide',
    usage: 'Appliquer matin et soir.',
    tags: 'Bio, Sans Paraben',
    volume: '50 ml',
    ean: '3700123456790',
    form: 'Crème fluide',
    presentation: 'Tube de 50 ml',
    contenance: '50 ml'
  });

  const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const totalOrdersCount = orders.length;
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
  const lowStockProducts = products.filter(p => p.stock <= 5);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success && data.url) {
          setNewProd(prev => ({ ...prev, image: data.url }));
          showToast('Image enregistrée sur le serveur avec succès !');
        } else {
          showToast("Erreur lors de l'envoi de l'image sur le serveur.");
        }
      } catch (err) {
        console.error('Upload error:', err);
        showToast("Erreur de connexion au serveur pour l'image.");
      }
    }
  };

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.brand) {
      showToast('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    addProduct({
      name: newProd.name,
      brand: newProd.brand,
      category: newProd.category,
      price: Number(newProd.price),
      oldPrice: newProd.oldPrice ? Number(newProd.oldPrice) : undefined,
      image: newProd.image,
      stock: Number(newProd.stock),
      description: newProd.description,
      ingredients: newProd.ingredients.split(',').map(s => s.trim()),
      usage: newProd.usage,
      tags: newProd.tags.split(',').map(s => s.trim()) as any,
      volume: newProd.volume,
      ean: newProd.ean,
      form: newProd.form,
      presentation: newProd.presentation,
      contenance: newProd.contenance
    });
    setActiveTab('inventory');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in">
      
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-blue-900 to-sky-900 text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-800 text-amber-300 text-xs font-bold rounded-full mb-2">
            <ShieldCheck className="w-4 h-4" /> Espace Administrateur Pharmacien
          </div>
          <h1 className="text-3xl font-black tracking-tight">Tableau de Bord &amp; Pilotage</h1>
          <p className="text-blue-200 text-sm mt-1">Gestion des stocks en temps réel, suivi des ventes et expéditions.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'stats' ? 'bg-amber-400 text-blue-950 shadow-md' : 'bg-blue-800/80 hover:bg-blue-800 text-white'}`}
          >
            Statistiques
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'inventory' ? 'bg-amber-400 text-blue-950 shadow-md' : 'bg-blue-800/80 hover:bg-blue-800 text-white'}`}
          >
            Stocks ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'orders' ? 'bg-amber-400 text-blue-950 shadow-md' : 'bg-blue-800/80 hover:bg-blue-800 text-white'}`}
          >
            Commandes ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('add-product')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'add-product' ? 'bg-amber-400 text-blue-950 shadow-md' : 'bg-blue-800/80 hover:bg-blue-800 text-white'}`}
          >
            + Nouveau Produit
          </button>
        </div>
      </div>

      {/* Low stock alert banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-amber-900">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Alerte Stock Faible</h4>
              <p className="text-xs text-amber-700">{lowStockProducts.length} produit(s) ont un stock inférieur ou égal à 5 unités.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('inventory')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Gérer les stocks
          </button>
        </div>
      )}

      {/* TAB 1: STATS */}
      {activeTab === 'stats' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Chiffre d'Affaires</span>
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-gray-900">{totalRevenue.toFixed(2)} €</div>
              <div className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +14.2% ce mois
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Commandes Totales</span>
                <Package className="w-5 h-5 text-sky-600" />
              </div>
              <div className="text-3xl font-black text-gray-900">{totalOrdersCount}</div>
              <div className="text-xs text-gray-400">Expéditions 24h garanties</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Panier Moyen</span>
                <ShoppingBag className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-3xl font-black text-gray-900">{avgOrderValue.toFixed(2)} €</div>
              <div className="text-xs text-blue-600 font-semibold">+5.1% vs hier</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-gray-500">
                <span className="text-xs font-bold uppercase tracking-wider">Clients Actifs</span>
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-gray-900">1,420</div>
              <div className="text-xs text-indigo-600 font-semibold">Taux de rétention 78%</div>
            </div>
          </div>

          {/* Recent Orders table in Stats */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Dernières Transactions &amp; Commandes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold">
                  <tr>
                    <th className="p-3 rounded-l-xl">ID Commande</th>
                    <th className="p-3">Client</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Montant</th>
                    <th className="p-3">Statut</th>
                    <th className="p-3 rounded-r-xl">Transporteur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold text-gray-900">{o.id}</td>
                      <td className="p-3">{o.shippingAddress.fullName}</td>
                      <td className="p-3 text-gray-500">{o.date}</td>
                      <td className="p-3 font-black text-blue-800">{o.totalAmount.toFixed(2)} €</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold rounded-full">
                          {o.status}
                        </span>
                      </td>
                      <td className="p-3 uppercase font-semibold text-gray-600">{o.carrier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Gestion des Stocks en Temps Réel</h3>
              <p className="text-xs text-gray-500">Mettez à jour instantanément les quantités disponibles en rayon.</p>
            </div>
            <button
              onClick={() => setActiveTab('add-product')}
              className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Ajouter un produit
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">Produit</th>
                  <th className="p-3">Marque</th>
                  <th className="p-3">Catégorie</th>
                  <th className="p-3">Prix</th>
                  <th className="p-3">Stock Actuel</th>
                  <th className="p-3 text-right rounded-r-xl">Action / Ajustement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-3 flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-lg border" />
                      <div>
                        <div className="font-bold text-gray-900">{p.name}</div>
                        <div className="text-[10px] text-gray-400">{p.volume}</div>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-gray-600">{p.brand}</td>
                    <td className="p-3">{p.category}</td>
                    <td className="p-3 font-bold text-blue-700">{p.price.toFixed(2)} €</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full font-bold ${p.stock <= 5 ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-800'}`}>
                        {p.stock} unités
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => updateProductStock(p.id, p.stock - 1)}
                          className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 font-bold rounded-lg text-gray-700"
                        >
                          -
                        </button>
                        <button
                          onClick={() => updateProductStock(p.id, p.stock + 10)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                        >
                          +10 Restock
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Gestion des Commandes &amp; Expéditions</h3>
            <p className="text-xs text-gray-500">Mettez à jour le statut d'expédition de chaque commande client.</p>
          </div>

          <div className="space-y-4">
            {orders.map(o => (
              <div key={o.id} className="p-6 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-200 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-gray-900 text-base">{o.id}</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                        {o.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Client : <strong>{o.shippingAddress.fullName}</strong> ({o.shippingAddress.email}) • Tél : {o.shippingAddress.phone}</div>
                    <div className="text-xs text-gray-500">Adresse : {o.shippingAddress.address}, {o.shippingAddress.postalCode} {o.shippingAddress.city}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-blue-800">{o.totalAmount.toFixed(2)} €</div>
                    <div className="text-xs text-gray-500">Paiement : <strong className="uppercase">{o.paymentMethod}</strong></div>
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-gray-600">
                    Changer le statut d'expédition :
                  </div>
                  <div className="flex gap-2">
                    {(['En préparation', 'Expédié', 'En cours de livraison', 'Livré'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => updateOrderStatus(o.id, st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${o.status === st ? 'bg-blue-700 text-white shadow-md' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'}`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ADD PRODUCT */}
      {activeTab === 'add-product' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-8 max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="font-bold text-gray-900 text-xl">Ajouter un Nouveau Produit au Catalogue</h3>
            <p className="text-xs text-gray-500">Le produit sera instantanément visible sur la boutique en ligne.</p>
          </div>

          <form onSubmit={handleCreateProductSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nom du produit</label>
                <input
                  type="text"
                  required
                  value={newProd.name}
                  onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                  placeholder="ex: Crème Hydratante Bio"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Marque</label>
                <input
                  type="text"
                  required
                  value={newProd.brand}
                  onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                  placeholder="ex: La Roche-Glow"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Catégorie</label>
                <select
                  value={newProd.category}
                  onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                >
                  {CATEGORIES.filter(c => c !== 'Tous').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Prix (€)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newProd.price}
                  onChange={(e) => setNewProd({ ...newProd, price: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Stock initial</label>
                <input
                  type="number"
                  required
                  value={newProd.stock}
                  onChange={(e) => setNewProd({ ...newProd, stock: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Volume / Contenance</label>
                <input
                  type="text"
                  required
                  value={newProd.volume}
                  onChange={(e) => setNewProd({ ...newProd, volume: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                  placeholder="ex: 50 ml"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700">Image du produit (Depuis l'ordinateur uniquement)</label>
              <div className="flex items-center gap-4">
                {newProd.image && (
                  <img src={newProd.image} alt="Aperçu" className="w-16 h-16 object-cover rounded-xl border shadow-sm" />
                )}
                <label className="flex-1 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 transition-colors">
                  📁 Choisir une image sur l'ordinateur
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[11px] text-gray-400">Formats supportés : PNG, JPG, WEBP. Chargement local direct.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Description détaillée</label>
              <textarea
                rows={3}
                required
                value={newProd.description}
                onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className="px-4 py-2.5 text-gray-600 text-xs font-bold hover:bg-gray-100 rounded-xl"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Enregistrer et publier le produit
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
