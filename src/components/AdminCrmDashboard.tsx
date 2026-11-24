import React, { useEffect, useState, useCallback } from 'react';
import {
  Mail, BellRing, Send, Download, Trash2, Users, Gift, RefreshCw, CheckCircle
} from 'lucide-react';
import {
  NewsletterSubscriber, StockAlert, EmailCampaign, ReferralRecord
} from '../types';
import { authFetch } from '../utils/authToken';

interface AdminCrmDashboardProps {
  showToast: (msg: string) => void;
}

export const AdminCrmDashboard: React.FC<AdminCrmDashboardProps> = ({ showToast }) => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'newsletter' | 'campaigns' | 'alerts' | 'referrals'>('newsletter');

  // Campaign composer state
  const [subject, setSubject] = useState('Offres d’automne à l’officine Myrlan (-15% dès 59 €)');
  const [heading, setHeading] = useState('Prenez soin de votre immunité et de votre peau');
  const [body, setBody] = useState(
    'Bonjour {{patientName}},\n\nNos pharmaciens ont sélectionné nos meilleurs soins dermo-cosmétiques et compléments de saison.\nProfitez dès maintenant du code BIENVENUE10 ou découvrez nos nouveautés au comptoir et en ligne.'
  );
  const [ctaLabel, setCtaLabel] = useState('Découvrir les promotions');
  const [ctaPath, setCtaPath] = useState('/promotions');
  const [accentColor, setAccentColor] = useState('#1d4ed8');
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);

  const loadCrmData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/admin/crm');
      const data = await res.json();
      if (res.ok) {
        setSubscribers(Array.isArray(data.subscribers) ? data.subscribers : []);
        setStockAlerts(Array.isArray(data.stockAlerts) ? data.stockAlerts : []);
        setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : []);
        setReferrals(Array.isArray(data.referrals) ? data.referrals : []);
      }
    } catch {
      showToast('Impossible de charger les données CRM.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCrmData();
  }, [loadCrmData]);

  const activeSubscribers = subscribers.filter(s => s.status === 'Actif');
  const pendingAlerts = stockAlerts.filter(a => a.status === 'En attente');

  const handleDeleteSubscriber = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/crm/subscribers/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setSubscribers(prev => prev.filter(s => s.id !== id));
        showToast('Abonné retiré de la base newsletter.');
      }
    } catch {
      showToast('Erreur réseau.');
    }
  };

  const handleExportCsv = () => {
    if (subscribers.length === 0) {
      showToast('Aucun abonné à exporter.');
      return;
    }
    const header = 'ID;Email;Nom;Source;Statut;Date inscription\n';
    const rows = subscribers
      .map(s => `${s.id};${s.email};${s.name || ''};${s.source};${s.status};${s.subscribedAt}`)
      .join('\n');
    const blob = new Blob([`\uFEFF${header}${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `myrlan-newsletter-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`${subscribers.length} abonné(s) exporté(s) en CSV.`);
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      showToast('Objet et message requis.');
      return;
    }
    setIsSendingCampaign(true);
    try {
      const res = await authFetch('/api/admin/crm/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, heading, body, ctaLabel, ctaPath, accentColor })
      });
      const data = await res.json();
      if (data.success && data.campaign) {
        setCampaigns(prev => [data.campaign, ...prev]);
        showToast(`Campagne expédiée à ${data.recipientCount} abonné(s) actif(s).`);
      } else {
        showToast(data.error || 'Impossible d’envoyer la campagne.');
      }
    } catch {
      showToast('Erreur réseau.');
    } finally {
      setIsSendingCampaign(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 tabular-nums">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Abonnés Newsletter Actifs</span>
            <Mail className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeSubscribers.length}</div>
          <div className="text-[11px] text-slate-500">{subscribers.length} inscription(s) au total</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Alertes Stock en Attente</span>
            <BellRing className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{pendingAlerts.length}</div>
          <div className="text-[11px] text-slate-500">{stockAlerts.length - pendingAlerts.length} déjà notifiée(s)</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Campagnes Envoyées</span>
            <Send className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{campaigns.length}</div>
          <div className="text-[11px] text-slate-500">Journalisées dans Templates Emails</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Parrainages Validés</span>
            <Gift className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{referrals.length}</div>
          <div className="text-[11px] text-slate-500">+150 pts crédités par filleul</div>
        </div>
      </div>

      {/* Sub-navigation bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap bg-white border border-slate-200 rounded-xl p-1 gap-1">
          {([
            { id: 'newsletter', label: `Abonnés (${subscribers.length})` },
            { id: 'campaigns', label: 'Campagne Email' },
            { id: 'alerts', label: `Alertes Stock (${stockAlerts.length})` },
            { id: 'referrals', label: `Parrainages (${referrals.length})` }
          ] as const).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                activeSection === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadCrmData}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Actualiser
          </button>
          {activeSection === 'newsletter' && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: NEWSLETTER SUBSCRIBERS */}
      {activeSection === 'newsletter' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-sm text-slate-900">Base d’abonnés Newsletter</h2>
            </div>
            <span className="text-xs text-slate-500 tabular-nums">{activeSubscribers.length} actif(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Source</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Statut</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscribers.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{sub.email}</td>
                    <td className="py-2.5 px-4 text-slate-600">{sub.source}</td>
                    <td className="py-2.5 px-4 text-slate-500">{sub.subscribedAt}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${
                        sub.status === 'Actif'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteSubscriber(sub.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Supprimer l'abonné"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {subscribers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      Aucun abonné newsletter enregistré pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: CAMPAIGN COMPOSER + HISTORY */}
      {activeSection === 'campaigns' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSendCampaign} className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-bold text-sm text-slate-900">Nouvelle Campagne Newsletter</h2>
                <p className="text-xs text-slate-500">Sera envoyée à {activeSubscribers.length} abonné(s) actif(s).</p>
              </div>
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                title="Couleur d'en-tête"
                className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer"
              />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Objet de l’email</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Titre principal</label>
                <input
                  type="text"
                  required
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contenu (variable disponible : {'{{patientName}}'})</label>
                <textarea
                  rows={5}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs leading-relaxed"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Libellé du bouton CTA</label>
                  <input
                    type="text"
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chemin cible du bouton</label>
                  <input
                    type="text"
                    value={ctaPath}
                    onChange={(e) => setCtaPath(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSendingCampaign || activeSubscribers.length === 0}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg inline-flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingCampaign ? 'Envoi en cours...' : `Expédier (${activeSubscribers.length} destinataires)`}</span>
              </button>
            </div>
          </form>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="font-bold text-sm text-slate-900">Historique des campagnes</h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto text-xs">
              {campaigns.map(cmp => (
                <div key={cmp.id} className="p-4 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 truncate">{cmp.subject}</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-semibold shrink-0">
                      {cmp.status}
                    </span>
                  </div>
                  <div className="text-slate-500 flex justify-between tabular-nums">
                    <span>{cmp.recipientCount} destinataire(s)</span>
                    <span>{cmp.sentAt}</span>
                  </div>
                </div>
              ))}
              {campaigns.length === 0 && (
                <div className="p-8 text-center text-slate-400">Aucune campagne envoyée pour le moment.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: BACK-IN-STOCK ALERTS QUEUE */}
      {activeSection === 'alerts' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-900">File d’alertes Retour en Stock</h2>
              <p className="text-xs text-slate-500">
                Les clients « En attente » sont prévenus automatiquement par email dès qu’un produit repasse en stock (&gt; 0).
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Produit</th>
                  <th className="py-2.5 px-4">Email client</th>
                  <th className="py-2.5 px-4">Demandé le</th>
                  <th className="py-2.5 px-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockAlerts.map(alert => (
                  <tr key={alert.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{alert.productName}</td>
                    <td className="py-2.5 px-4 text-slate-700">{alert.email}</td>
                    <td className="py-2.5 px-4 text-slate-500">{alert.createdAt}</td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold ${
                        alert.status === 'Notifié'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {alert.status === 'Notifié' && <CheckCircle className="w-3 h-3" />}
                        {alert.status}
                        {alert.notifiedAt ? ` (${alert.notifiedAt})` : ''}
                      </span>
                    </td>
                  </tr>
                ))}
                {stockAlerts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400">
                      Aucune alerte de réapprovisionnement enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: REFERRALS LEDGER */}
      {activeSection === 'referrals' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-bold text-sm text-slate-900">Suivi du Programme de Parrainage</h2>
            <p className="text-xs text-slate-500">Chaque code parrain MYR-XXXXX offre -10% au filleul et crédite +150 points au parrain.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Code Parrain</th>
                  <th className="py-2.5 px-4">Filleul</th>
                  <th className="py-2.5 px-4">Commande</th>
                  <th className="py-2.5 px-4 text-right">Remise Filleul</th>
                  <th className="py-2.5 px-4 text-right">Bonus Parrain</th>
                  <th className="py-2.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.map(ref => (
                  <tr key={ref.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-700">{ref.referrerCode}</td>
                    <td className="py-2.5 px-4 text-slate-700">{ref.referredEmail}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-900">{ref.orderId}</td>
                    <td className="py-2.5 px-4 text-right text-slate-700">-{ref.discountGranted.toFixed(2)} €</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-700">+{ref.rewardPoints} pts</td>
                    <td className="py-2.5 px-4 text-slate-500">{ref.createdAt}</td>
                  </tr>
                ))}
                {referrals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Aucun parrainage validé pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
