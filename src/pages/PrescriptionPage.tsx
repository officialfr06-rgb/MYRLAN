import React, { useState, useEffect } from 'react';
import {
  FileText, Upload, ShieldCheck, CheckCircle, Clock, ArrowLeft,
  Building, Truck, AlertCircle, Lock
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Prescription } from '../types';

export const PrescriptionPage: React.FC = () => {
  const { currentUser, userProfile, navigate, showToast } = useShop();

  const [patientName, setPatientName] = useState(currentUser?.name || userProfile.name || '');
  const [email, setEmail] = useState(currentUser?.email || userProfile.email || '');
  const [phone, setPhone] = useState(userProfile.phone || '');
  const [deliveryMode, setDeliveryMode] = useState<'click_and_collect' | 'delivery'>('click_and_collect');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRx, setSubmittedRx] = useState<Prescription | null>(null);
  const [myPrescriptions, setMyPrescriptions] = useState<Prescription[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setPatientName(prev => prev || currentUser.name);
      setEmail(prev => prev || currentUser.email);
      fetch('/api/prescriptions', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setMyPrescriptions(data);
        })
        .catch(() => {});
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedFile) {
      setError('Veuillez sélectionner une photo ou un PDF de votre ordonnance.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('patientName', patientName);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('deliveryMode', deliveryMode);
    formData.append('notes', notes);

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.prescription) {
        setSubmittedRx(data.prescription);
        setMyPrescriptions(prev => [data.prescription, ...prev]);
        setSelectedFile(null);
        setNotes('');
        showToast('Votre ordonnance a été transmise à nos pharmaciens !');
      } else {
        setError(data.error || 'Erreur lors de la transmission.');
      }
    } catch {
      setError('Erreur de connexion au serveur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à la boutique
      </button>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-sky-900 text-white rounded-3xl p-8 shadow-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-sky-200 text-xs font-bold rounded-full mb-3">
          <Lock className="w-3.5 h-3.5" /> Transmission sécurisée HDS &amp; Secret Médical
        </div>
        <h1 className="text-3xl font-black tracking-tight">Envoyer mon ordonnance en ligne</h1>
        <p className="text-sm text-blue-200 mt-2 max-w-2xl">
          Gagnez du temps en officine : transmettez votre prescription médicale avant votre passage. Nos pharmaciens préparent votre traitement pour un retrait prioritaire ou une livraison.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs">
          {submittedRx ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Ordonnance transmise !</h2>
              <p className="text-sm text-gray-600">
                Référence dossier : <strong className="font-mono text-blue-700">{submittedRx.id}</strong>
              </p>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 text-left space-y-1 max-w-md mx-auto">
                <div><strong>Patient :</strong> {submittedRx.patientName}</div>
                <div><strong>Fichier :</strong> {submittedRx.fileName}</div>
                <div><strong>Mode :</strong> {submittedRx.deliveryMode === 'click_and_collect' ? 'Retrait prioritaire en pharmacie (Lyon)' : 'Livraison à domicile'}</div>
                <div><strong>Statut :</strong> {submittedRx.status}</div>
              </div>
              <button
                onClick={() => setSubmittedRx(null)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
              >
                Envoyer une autre ordonnance
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> Formulaire de transmission
              </h2>

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nom &amp; Prénom du patient *</label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="ex: Marie Dupont"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Téléphone mobile *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email de suivi *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Mode de remise souhaité</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('click_and_collect')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      deliveryMode === 'click_and_collect'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Building className="w-4 h-4 text-blue-600" /> Click &amp; Collect Pharmacie
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Prête sous 2h au 15 rue de la République, Lyon</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('delivery')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      deliveryMode === 'delivery'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Truck className="w-4 h-4 text-blue-600" /> Livraison sécurisée
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Selon éligibilité réglementaire des produits</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Fichier ordonnance (Photo ou PDF, max 8 Mo) *</label>
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-300 rounded-2xl bg-blue-50/40 hover:bg-blue-50 cursor-pointer transition-colors text-center">
                  <Upload className="w-7 h-7 text-blue-600 mb-2" />
                  <span className="text-xs font-bold text-blue-900">
                    {selectedFile ? selectedFile.name : 'Cliquez pour importer votre ordonnance'}
                  </span>
                  <span className="text-[11px] text-gray-500 mt-1">Formats acceptés : JPG, PNG, WEBP, PDF</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Allergies, mutuelle ou précisions pour le pharmacien</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Numéro de sécurité sociale / mutuelle à présenter au comptoir, allergies connues, substitution générique souhaitée..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md disabled:opacity-60"
              >
                {isSubmitting ? 'Chiffrement et envoi...' : 'Transmettre mon ordonnance au pharmacien'}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Instructions + User Prescription History */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" /> Comment ça fonctionne ?
            </h3>
            <ol className="space-y-3 text-xs text-gray-600">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0">1</span>
                <span>Photographiez ou scannez votre ordonnance médicale de façon lisible (date, cachet du médecin et nom visibles).</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0">2</span>
                <span>Un docteur en pharmacie analyse les posologies et interactions médicamenteuses.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0">3</span>
                <span>Présentez l’original papier et votre Carte Vitale lors du retrait au comptoir dédié.</span>
              </li>
            </ol>
          </div>

          {currentUser && (
            <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" /> Mes ordonnances transmises ({myPrescriptions.length})
              </h3>
              {myPrescriptions.length === 0 ? (
                <p className="text-xs text-gray-500">Aucune ordonnance envoyée sur ce compte.</p>
              ) : (
                <div className="space-y-3">
                  {myPrescriptions.map(rx => (
                    <div key={rx.id} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-xs text-gray-900">{rx.id}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          {rx.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500">{rx.createdAt} • {rx.fileName}</div>
                      {rx.pharmacistNote && (
                        <div className="text-xs text-blue-900 bg-blue-50 p-2 rounded-lg mt-1">
                          Note pharmacien : {rx.pharmacistNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
