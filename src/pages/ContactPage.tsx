import React, { useState } from 'react';
import {
  MapPin, Phone, Clock, Mail, Send, CheckCircle, MessageCircle,
  ArrowLeft, Building, ShieldCheck
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const ContactPage: React.FC = () => {
  const { currentUser, navigate, setIsChatOpen, showToast } = useShop();

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Conseil pharmaceutique / produit');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message })
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
        setMessage('');
        showToast('Votre message a bien été transmis à l’officine Myrlan !');
      } else {
        showToast(data.error || 'Erreur lors de l’envoi.');
      }
    } catch {
      showToast('Erreur de connexion au serveur.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à la boutique
      </button>

      <div className="bg-gradient-to-r from-blue-900 to-sky-900 text-white rounded-3xl p-8 shadow-lg">
        <span className="text-xs font-bold uppercase tracking-widest text-sky-300">Officine &amp; Service Patient</span>
        <h1 className="text-3xl font-black tracking-tight mt-1">Contacter la Pharmacie Myrlan</h1>
        <p className="text-sm text-blue-200 mt-2 max-w-2xl">
          Une question sur votre commande, un besoin de conseil dermo-cosmétique ou un retrait Click &amp; Collect ? Notre équipe officinale vous répond 6j/7.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Officine Details */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-5">
            <h2 className="font-black text-gray-900 text-lg flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" /> Officine Principale &amp; Retrait
            </h2>

            <div className="space-y-4 text-xs text-gray-700">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-gray-900">Pharmacie Myrlan Lyon Presqu’île</div>
                  <p>15 rue de la République, 69002 Lyon, France</p>
                  <p className="text-blue-700 font-semibold mt-0.5">Métro Cordeliers / Bellecour — Comptoir Click &amp; Collect dédié</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-gray-900">Horaires d’ouverture</div>
                  <p>Lundi – Vendredi : 08h30 – 19h30</p>
                  <p>Samedi : 09h00 – 19h00</p>
                  <p className="text-gray-500">Dimanche : Fermé (urgences 3237)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-gray-900">Téléphone Direct Officine</div>
                  <p className="font-mono text-sm font-bold text-blue-900">04 78 00 42 18</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-gray-900">Messagerie Patient</div>
                  <p>officine@myrlan.fr</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => setIsChatOpen(true)}
                className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-blue-200"
              >
                <MessageCircle className="w-4 h-4 text-blue-600" /> Discuter en direct avec un pharmacien
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5 flex items-start gap-3 text-xs text-blue-900">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Pharmacovigilance &amp; Signalement</div>
              <p className="text-blue-800/80 mt-1">
                Pour signaler tout effet indésirable lié à un produit de santé ou cosmétique, précisez le numéro de lot dans votre message.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs">
          {sent ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Message envoyé avec succès</h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Un membre de notre équipe officinale traitera votre demande dans les plus brefs délais (sous 4h ouvrées en moyenne).
              </p>
              <button
                onClick={() => setSent(false)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-black text-gray-900 text-lg mb-2">Formulaire de contact</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nom complet *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jean Martin"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Adresse email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Téléphone (optionnel)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Objet de la demande *</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
                  >
                    <option value="Conseil pharmaceutique / produit">Conseil pharmaceutique / produit</option>
                    <option value="Suivi ou modification de commande">Suivi ou modification de commande</option>
                    <option value="Click & Collect en officine">Click &amp; Collect en officine</option>
                    <option value="Retour / SAV">Retour / SAV</option>
                    <option value="Autre demande">Autre demande</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Votre message *</label>
                <textarea
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Précisez votre numéro de commande ou décrivez votre besoin..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? 'Envoi en cours...' : 'Envoyer mon message'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
