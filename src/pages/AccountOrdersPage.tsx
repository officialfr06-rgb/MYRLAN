import React, { useState, useEffect } from 'react';
import {
  User, MapPin, Package, Plus, Trash2, CheckCircle, Lock,
  ArrowLeft, Printer, RotateCcw, Award, ShieldCheck, LogIn, Gift, Copy, Download
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { SavedAddress, Order, ReferralSummary } from '../types';
import { authFetch } from '../utils/authToken';
import { downloadOrderInvoicePdf } from '../utils/invoicePdf';

export const AccountPage: React.FC = () => {
  const {
    currentUser, userProfile, updateUserProfile, saveAddressesToAccount,
    loyalty, setIsAccountOpen, navigate, showToast, logoutUser
  } = useShop();

  const [name, setName] = useState(currentUser?.name || userProfile.name || '');
  const [skinType, setSkinType] = useState(userProfile.skinType || 'Mixte à sensible');
  const [addresses, setAddresses] = useState<SavedAddress[]>(userProfile.savedAddresses || []);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddr, setNewAddr] = useState<Omit<SavedAddress, 'id'>>({
    label: 'Domicile',
    fullName: currentUser?.name || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    isDefault: false
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [referralSummary, setReferralSummary] = useState<ReferralSummary | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setSkinType(currentUser.skinType || userProfile.skinType || 'Mixte à sensible');
      setAddresses(currentUser.savedAddresses || userProfile.savedAddresses || []);
      authFetch('/api/account/referral')
        .then(r => r.json())
        .then(data => {
          if (data && data.referralCode) setReferralSummary(data);
        })
        .catch(() => {});
    }
  }, [currentUser, userProfile]);

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">Connectez-vous à votre espace Myrlan</h1>
        <p className="text-sm text-gray-600">
          Accédez à vos informations personnelles, vos adresses de livraison enregistrées et votre programme fidélité.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setIsAccountOpen(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 shadow-md"
          >
            <LogIn className="w-4 h-4" /> Se connecter / Créer un compte
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50"
          >
            Retour à la boutique
          </button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({ name, skinType }, true);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const created: SavedAddress = {
      ...newAddr,
      id: `addr-${Date.now()}`,
      isDefault: addresses.length === 0 || newAddr.isDefault
    };
    const updated = created.isDefault
      ? [created, ...addresses.map(a => ({ ...a, isDefault: false }))]
      : [...addresses, created];
    setAddresses(updated);
    await saveAddressesToAccount(updated);
    setShowAddressForm(false);
    setNewAddr({
      label: 'Domicile',
      fullName: currentUser.name,
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'France',
      isDefault: false
    });
  };

  const handleSetDefaultAddress = async (id: string) => {
    const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    setAddresses(updated);
    await saveAddressesToAccount(updated);
  };

  const handleDeleteAddress = async (id: string) => {
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    await saveAddressesToAccount(updated);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentPassword('');
        setNewPassword('');
        showToast('Mot de passe modifié avec succès.');
      } else {
        showToast(data.error || 'Erreur lors du changement de mot de passe.');
      }
    } catch {
      showToast('Erreur réseau.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la boutique
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/commandes')}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-xl flex items-center gap-1.5"
          >
            <Package className="w-4 h-4" /> Mes Commandes
          </button>
          <button
            onClick={logoutUser}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-sky-900 text-white rounded-3xl p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-2xl font-black">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black">{currentUser.name}</h1>
              {currentUser.role === 'admin' && (
                <span className="px-2.5 py-0.5 bg-amber-400 text-blue-950 text-[10px] font-black rounded-full inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Administrateur
                </span>
              )}
            </div>
            <p className="text-xs text-blue-200">{currentUser.email}</p>
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl px-5 py-3 border border-white/15 flex items-center gap-3">
          <Award className="w-6 h-6 text-amber-300" />
          <div>
            <div className="text-[11px] text-blue-200">Programme Fidélité ({loyalty.tier})</div>
            <div className="text-lg font-black tabular-nums">{loyalty.points} points</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Profile & Password */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-black text-gray-900 text-base flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" /> Informations personnelles
            </h2>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nom complet</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Profil Dermo-Cosmétique</label>
              <select
                value={skinType}
                onChange={(e) => setSkinType(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
              >
                <option value="Sèche">Peau sèche</option>
                <option value="Mixte à sensible">Mixte à sensible</option>
                <option value="Grasse à imperfections">Grasse à imperfections</option>
                <option value="Normale">Normale</option>
                <option value="Atopique / Réactive">Atopique / Réactive</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
            >
              Enregistrer mon profil
            </button>
          </form>

          <form onSubmit={handlePasswordChange} className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-black text-gray-900 text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" /> Sécurité &amp; Mot de passe
            </h2>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mot de passe actuel</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-gray-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl"
            >
              Modifier le mot de passe
            </button>
          </form>

          {/* Referral Card */}
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-3xl border border-blue-200 p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-black text-blue-950 text-base flex items-center gap-2">
                <Gift className="w-4 h-4 text-blue-700" /> Programme Parrainage
              </h2>
              <span className="text-xs font-bold text-blue-800 bg-white px-2.5 py-1 rounded-full border border-blue-200 tabular-nums">
                {referralSummary?.referralsCount ?? currentUser.referralsCount ?? 0} filleul(s)
              </span>
            </div>
            <p className="text-xs text-blue-900/80 leading-relaxed">
              Partagez votre code personnel : vos proches reçoivent <strong>-10%</strong> dès leur première commande et vous gagnez <strong>+150 pts fidélité</strong> à chaque commande validée.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border border-blue-200 rounded-xl px-3.5 py-2.5 font-mono font-black text-sm text-blue-900 tracking-wider">
                {referralSummary?.referralCode || currentUser.referralCode || 'MYR-CLIENT'}
              </div>
              <button
                type="button"
                onClick={() => {
                  const code = referralSummary?.referralCode || currentUser.referralCode || '';
                  if (!code) return;
                  navigator.clipboard?.writeText(code);
                  showToast(`Code parrain ${code} copié !`);
                }}
                className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shrink-0"
              >
                <Copy className="w-3.5 h-3.5" /> Copier
              </button>
            </div>
            {referralSummary && referralSummary.referrals.length > 0 && (
              <div className="pt-2 border-t border-blue-200/70 space-y-1.5 text-xs">
                <div className="font-bold text-blue-950">Derniers filleuls</div>
                {referralSummary.referrals.slice(0, 3).map(ref => (
                  <div key={ref.id} className="flex justify-between text-blue-900 tabular-nums">
                    <span className="truncate">{ref.referredEmail}</span>
                    <span className="font-bold text-emerald-700 shrink-0">+{ref.rewardPoints} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Saved Addresses */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-gray-900 text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" /> Carnet d’adresses de livraison ({addresses.length})
            </h2>
            <button
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Nouvelle adresse
            </button>
          </div>

          {showAddressForm && (
            <form onSubmit={handleAddAddress} className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Libellé (ex: Domicile, Bureau)"
                  value={newAddr.label}
                  onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="Nom complet"
                  value={newAddr.fullName}
                  onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                />
                <input
                  type="tel"
                  required
                  placeholder="Téléphone"
                  value={newAddr.phone}
                  onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="Code postal"
                  value={newAddr.postalCode}
                  onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="Adresse postale"
                  value={newAddr.address}
                  onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })}
                  className="sm:col-span-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="Ville"
                  value={newAddr.city}
                  onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                />
                <select
                  value={newAddr.country}
                  onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value })}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                >
                  <option value="France">France</option>
                  <option value="Belgique">Belgique</option>
                  <option value="Suisse">Suisse</option>
                  <option value="Luxembourg">Luxembourg</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                >
                  Ajouter cette adresse
                </button>
              </div>
            </form>
          )}

          {addresses.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-500">
              Aucune adresse enregistrée. Ajoutez une adresse pour accélérer vos prochains achats.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map(addr => (
                <div
                  key={addr.id}
                  className={`p-4 rounded-2xl border space-y-2 ${
                    addr.isDefault ? 'border-blue-500 bg-blue-50/40' : 'border-gray-200 bg-gray-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Par défaut
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-700 space-y-0.5">
                    <div className="font-semibold">{addr.fullName}</div>
                    <div>{addr.address}</div>
                    <div>{addr.postalCode} {addr.city}, {addr.country}</div>
                    <div className="text-gray-500">{addr.phone}</div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/70">
                    {!addr.isDefault ? (
                      <button
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="text-[11px] font-bold text-blue-700 hover:underline"
                      >
                        Définir par défaut
                      </button>
                    ) : <span />}
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      title="Supprimer l'adresse"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const OrdersPage: React.FC = () => {
  const { myOrders, currentUser, navigate, setIsAccountOpen, refreshOrders, showToast } = useShop();
  const [returnTargetOrder, setReturnTargetOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('Produit endommagé à la réception');
  const [returnDetails, setReturnDetails] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const statuses = ['En préparation', 'Expédié', 'En cours de livraison', 'Livré'];

  const handleRequestReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnTargetOrder) return;
    setIsSubmittingReturn(true);
    try {
      const res = await authFetch(`/api/orders/${returnTargetOrder.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: returnReason, details: returnDetails })
      });
      const data = await res.json();
      if (data.success) {
        await refreshOrders();
        showToast(`Demande de retour enregistrée pour la commande ${returnTargetOrder.id}.`);
        setReturnTargetOrder(null);
        setReturnDetails('');
      } else {
        showToast(data.error || 'Connectez-vous pour enregistrer une demande SAV.');
      }
    } catch {
      showToast('Erreur de connexion au serveur.');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la boutique
        </button>
        {currentUser ? (
          <button
            onClick={() => navigate('/compte')}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50"
          >
            Mon Compte &amp; Adresses
          </button>
        ) : (
          <button
            onClick={() => setIsAccountOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700"
          >
            Se connecter pour voir tout l’historique
          </button>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-900 to-sky-900 text-white rounded-3xl p-8 shadow-lg">
        <h1 className="text-3xl font-black tracking-tight">Mes Commandes &amp; Suivi Colis</h1>
        <p className="text-sm text-blue-200 mt-1">
          {currentUser
            ? `Historique personnel de ${currentUser.name} (${currentUser.email})`
            : 'Commandes récentes passées depuis cette session navigateur'}
        </p>
      </div>

      {myOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-gray-900">Aucune commande trouvée</h2>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {currentUser
              ? 'Vous n’avez pas encore passé de commande avec ce compte.'
              : 'Connectez-vous pour retrouver l’historique complet de vos commandes ou explorez notre catalogue.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
          >
            Découvrir le catalogue
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {myOrders.map(order => {
            const currentIdx = statuses.indexOf(order.status);
            return (
              <div key={order.id} className="bg-white rounded-3xl border border-gray-200 p-6 space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-gray-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-base text-gray-900">{order.id}</span>
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                        {order.status}
                      </span>
                      {order.returnRequest && (
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                          SAV : {order.returnRequest.status}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Commandé le {order.date} • Suivi : <strong className="font-mono text-gray-800">{order.trackingNumber}</strong>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xl font-black text-blue-800 tabular-nums">{order.totalAmount.toFixed(2)} €</div>
                    <div className="text-xs text-gray-500">{order.items.length} référence(s)</div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {statuses.map((st, idx) => {
                    const isPassed = idx <= currentIdx;
                    return (
                      <div
                        key={st}
                        className={`p-3 rounded-xl border text-center ${
                          isPassed ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`}
                      >
                        <div className="text-xs font-bold">{st}</div>
                        <div className="text-[10px] mt-0.5">{isPassed ? '✓ Validé' : 'En attente'}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Items */}
                <div className="bg-gray-50 rounded-2xl p-4 space-y-1.5 text-xs text-gray-700">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.product.name} × {item.quantity}</span>
                      <span className="font-bold tabular-nums">{(item.product.price * item.quantity).toFixed(2)} €</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                  {currentUser && !order.returnRequest && (
                    <button
                      onClick={() => setReturnTargetOrder(order)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Demander un retour / SAV
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => downloadOrderInvoicePdf(order)}
                    className="px-4 py-2 bg-white border border-blue-200 hover:bg-blue-50 text-blue-800 font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Télécharger PDF
                  </button>
                  <button
                    onClick={() => navigate(`/commande-confirmee/${encodeURIComponent(order.id)}`)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Récapitulatif
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return / SAV Modal */}
      {returnTargetOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-black text-lg text-gray-900">Demande de retour / SAV ({returnTargetOrder.id})</h3>
            <form onSubmit={handleRequestReturn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Motif du retour</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
                >
                  <option value="Produit endommagé à la réception">Produit endommagé à la réception</option>
                  <option value="Droit de rétractation (14 jours, produit scellé)">Droit de rétractation (14 jours, produit scellé)</option>
                  <option value="Erreur de préparation">Erreur de préparation</option>
                  <option value="Colis non reçu">Colis non reçu</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Précisions</label>
                <textarea
                  rows={3}
                  required
                  value={returnDetails}
                  onChange={(e) => setReturnDetails(e.target.value)}
                  placeholder="Décrivez votre demande..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturnTargetOrder(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                >
                  {isSubmittingReturn ? 'Envoi...' : 'Envoyer la demande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
