import React, { useState } from 'react';
import { X, User, Lock, Mail, KeyRound, UserPlus, LogIn, LogOut, ShieldCheck, Package, MapPin } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { setAuthToken } from '../utils/authToken';

export const AccountModal: React.FC = () => {
  const {
    userProfile, updateUserProfile, isAccountOpen, setIsAccountOpen,
    showToast, setIsAdminMode, currentUser, setCurrentUser, logoutUser, navigate
  } = useShop();

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [skinType, setSkinType] = useState(userProfile.skinType || 'Mixte à sensible');
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [authError, setAuthError] = useState('');

  if (!isAccountOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success && data.user) {
        if (data.token) setAuthToken(data.token);
        setCurrentUser(data.user);
        if (data.user.role === 'admin') {
          setIsAdminMode(true);
          showToast(`Connexion Administrateur réussie ! Bienvenue ${data.user.name}.`);
        } else {
          setIsAdminMode(false);
          showToast(`Connexion réussie ! Bienvenue ${data.user.name}.`);
        }
        setIsAccountOpen(false);
      } else {
        const msg = data.error || 'Email ou mot de passe incorrect.';
        setAuthError(msg);
        showToast(msg);
      }
    } catch {
      const msg = 'Erreur de connexion au serveur.';
      setAuthError(msg);
      showToast(msg);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, skinType })
      });
      const data = await res.json();
      if (data.success && data.user) {
        if (data.token) setAuthToken(data.token);
        setCurrentUser(data.user);
        setIsAdminMode(false);
        showToast('Compte client créé avec succès !');
        setIsAccountOpen(false);
      } else {
        showToast(data.error || "Erreur lors de la création du compte.");
      }
    } catch {
      showToast('Erreur de connexion au serveur.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Veuillez entrer votre adresse email.');
      return;
    }
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      showToast(data.message || 'Un e-mail de réinitialisation a été envoyé.');
      setAuthMode('login');
    } catch {
      showToast('Erreur lors de la demande de réinitialisation.');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({ name: editName || currentUser?.name || '', skinType }, true);
    setIsAccountOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-900 to-sky-900 text-white">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-sky-300" />
            <h2 className="font-bold text-lg">
              {currentUser ? 'Mon Compte Myrlan' : authMode === 'login' && 'Connexion Myrlan'}
              {!currentUser && authMode === 'register' && 'Créer un Compte Client'}
              {!currentUser && authMode === 'forgot' && 'Mot de passe oublié'}
            </h2>
          </div>
          <button
            onClick={() => setIsAccountOpen(false)}
            className="p-2 text-blue-200 hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentUser ? (
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <div className={`w-12 h-12 rounded-2xl text-white font-black text-lg flex items-center justify-center ${currentUser.role === 'admin' ? 'bg-blue-900' : 'bg-blue-600'}`}>
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-gray-900 text-sm truncate">{currentUser.name}</h4>
                  {currentUser.role === 'admin' && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-extrabold text-[10px] rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-blue-700 font-medium truncate">{currentUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setIsAccountOpen(false); navigate('/compte'); }}
                className="p-2.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 flex items-center justify-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600" /> Adresses &amp; Profil
              </button>
              <button
                type="button"
                onClick={() => { setIsAccountOpen(false); navigate('/commandes'); }}
                className="p-2.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 flex items-center justify-center gap-1.5"
              >
                <Package className="w-3.5 h-3.5 text-blue-600" /> Mes Commandes
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  defaultValue={currentUser.name}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              {currentUser.role === 'customer' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Type de peau par défaut</label>
                  <select
                    value={skinType}
                    onChange={(e) => setSkinType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                  >
                    <option value="Sèche">Sèche</option>
                    <option value="Mixte à sensible">Mixte à sensible</option>
                    <option value="Grasse à imperfections">Grasse à imperfections</option>
                    <option value="Normale">Normale</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => { logoutUser(); setIsAccountOpen(false); }}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Se déconnecter
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAccountOpen(false)}
                    className="px-4 py-2.5 text-gray-600 text-xs font-bold hover:bg-gray-100 rounded-xl"
                  >
                    Fermer
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-6 sm:p-8 space-y-6">

            <div className="flex bg-gray-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${authMode === 'login' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${authMode === 'register' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Créer un compte client
              </button>
            </div>

            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Adresse email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-700">Mot de passe</label>
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[11px] text-blue-600 font-semibold hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Se connecter
                </button>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-900">Protection anti-phishing :</strong> vérifiez l’adresse officielle avant toute saisie. L’équipe Myrlan ne demande jamais votre mot de passe par email, SMS ou téléphone.
                  </span>
                </div>
              </form>
            )}

            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nom complet</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                    placeholder="ex: Julie Martin"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Adresse email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                    placeholder="julie.martin@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mot de passe (8+ caractères recommandés)</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                    placeholder="••••••••"
                  />
                  {password.length > 0 && (
                    <p className={`text-[11px] mt-1 font-medium ${password.length >= 10 ? 'text-emerald-700' : password.length >= 8 ? 'text-blue-700' : 'text-amber-700'}`}>
                      {password.length >= 10
                        ? 'Robustesse élevée'
                        : password.length >= 8
                          ? 'Robustesse correcte (10+ caractères conseillés)'
                          : 'Mot de passe trop court — évitez les suites simples (123456, azerty)'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Type de peau</label>
                  <select
                    value={skinType}
                    onChange={(e) => setSkinType(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
                  >
                    <option value="Sèche">Sèche</option>
                    <option value="Mixte à sensible">Mixte à sensible</option>
                    <option value="Grasse à imperfections">Grasse à imperfections</option>
                    <option value="Normale">Normale</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Créer mon compte client
                </button>
              </form>
            )}

            {authMode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-xs">
                  Entrez votre adresse email ci-dessous. Nous vous enverrons un lien sécurisé vers <span className="font-mono">/reset-password</span> pour définir un nouveau mot de passe.
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Adresse email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-4 h-4" /> Envoyer le lien
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
