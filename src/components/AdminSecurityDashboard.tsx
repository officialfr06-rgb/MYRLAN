import React, { useEffect, useMemo, useState } from 'react';
import {
  ShieldAlert, ShieldCheck, Lock, Unlock, LogOut, RefreshCw,
  AlertTriangle, Copy, CheckCircle, Save, FileLock2, Globe, Activity
} from 'lucide-react';
import { AdminSecurityOverview, SecurityLogEntry } from '../types';
import { authFetch, setAuthToken } from '../utils/authToken';

interface AdminSecurityDashboardProps {
  showToast: (msg: string) => void;
}

type SecuritySubTab = 'firewall' | 'policies' | 'logs' | 'antiphishing';

export const AdminSecurityDashboard: React.FC<AdminSecurityDashboardProps> = ({ showToast }) => {
  const [subTab, setSubTab] = useState<SecuritySubTab>('firewall');
  const [overview, setOverview] = useState<AdminSecurityOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const [maxCodGuestAmount, setMaxCodGuestAmount] = useState<number>(250);
  const [maxOrderQtyPerItem, setMaxOrderQtyPerItem] = useState<number>(10);
  const [maxOrderTotalItems, setMaxOrderTotalItems] = useState<number>(30);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [revokingSessions, setRevokingSessions] = useState(false);

  const [logCategoryFilter, setLogCategoryFilter] = useState<string>('all');
  const [logSeverityFilter, setLogSeverityFilter] = useState<string>('all');

  const loadSecurityOverview = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/security');
      const data = await res.json();
      if (data && data.config) {
        setOverview(data);
        setMaxCodGuestAmount(Number(data.config.maxCodGuestAmount || 250));
        setMaxOrderQtyPerItem(Number(data.config.maxOrderQtyPerItem || 10));
        setMaxOrderTotalItems(Number(data.config.maxOrderTotalItems || 30));
      }
    } catch {
      showToast('Impossible de charger le centre de sécurité.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityOverview();
  }, []);

  const handleUnblockKey = async (key: string) => {
    try {
      const res = await authFetch('/api/admin/security/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Blocage IP levé avec succès.');
        await loadSecurityOverview();
      } else {
        showToast(data.error || 'Erreur lors du déblocage.');
      }
    } catch {
      showToast('Erreur réseau.');
    }
  };

  const handleRevokeSessions = async () => {
    setRevokingSessions(true);
    try {
      const res = await authFetch('/api/admin/security/revoke-sessions', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        if (data.token) {
          setAuthToken(data.token);
        }
        showToast(`Toutes les sessions antérieures ont été révoquées (epoch ${data.tokenEpoch}).`);
        await loadSecurityOverview();
      } else {
        showToast(data.error || 'Impossible de révoquer les sessions.');
      }
    } catch {
      showToast('Erreur réseau.');
    } finally {
      setRevokingSessions(false);
    }
  };

  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPolicy(true);
    try {
      const res = await authFetch('/api/admin/security/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxCodGuestAmount,
          maxOrderQtyPerItem,
          maxOrderTotalItems
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Seuils anti-sabotage enregistrés.');
        await loadSecurityOverview();
      } else {
        showToast(data.error || 'Erreur lors de la sauvegarde.');
      }
    } catch {
      showToast('Erreur réseau.');
    } finally {
      setSavingPolicy(false);
    }
  };

  const copySnippet = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copié dans le presse-papiers.`);
    } catch {
      showToast('Copie manuelle requise.');
    }
  };

  const filteredLogs = useMemo(() => {
    const logs = overview?.logs || [];
    return logs.filter(entry => {
      const catOk = logCategoryFilter === 'all' || entry.category === logCategoryFilter;
      const sevOk = logSeverityFilter === 'all' || entry.severity === logSeverityFilter;
      return catOk && sevOk;
    });
  }, [overview, logCategoryFilter, logSeverityFilter]);

  const severityBadgeClass = (sev: SecurityLogEntry['severity']) => {
    if (sev === 'critical') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (sev === 'warning') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const spfRecord = 'v=spf1 include:_spf.google.com ~all';
  const dmarcRecord = 'v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s; rua=mailto:securite@myrlan.fr';
  const dkimNote = 'Activer une clé DKIM RSA 2048 bits chez votre hébergeur (sélecteur myrlan._domainkey) avant de passer DMARC en p=reject.';

  if (loading && !overview) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
        Chargement du centre de sécurité et du pare-feu applicatif...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weak Admin Passwords Warning Banner */}
      {overview && overview.weakAdminEmails.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950 space-y-1">
              <div className="font-bold">Action recommandée : mot de passe administrateur faible détecté</div>
              <p className="text-amber-900">
                Les comptes suivants utilisent encore un mot de passe de démonstration prévisible :{' '}
                <span className="font-mono font-bold">{overview.weakAdminEmails.join(', ')}</span>.
                Mettez-les à jour via « Mot de passe oublié / réinitialisation » avant la mise en production.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-amber-800 tabular-nums shrink-0">
            {overview.weakAdminEmails.length} compte(s) à renforcer
          </span>
        </div>
      )}

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 tabular-nums">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Blocages Pare-feu Actifs</span>
            <ShieldAlert className={`w-4 h-4 ${(overview?.stats.activeBlocksCount || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview?.stats.activeBlocksCount ?? 0}</div>
          <div className="text-[11px] text-slate-500">Verrous anti-brute-force / anti-flood en cours</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Tentatives Auth Échouées</span>
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview?.stats.failedLogins24h ?? 0}</div>
          <div className="text-[11px] text-slate-500">Blocage automatique 15 min après 5 échecs</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Requêtes Sabotage Bloquées</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview?.stats.blockedBotsOrFlood24h ?? 0}</div>
          <div className="text-[11px] text-slate-500">Honeypots, rafales et abus de stock neutralisés</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Ordonnances en Coffre Privé</span>
            <FileLock2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview?.stats.protectedPrescriptionsCount ?? 0}</div>
          <div className="text-[11px] text-slate-500">Hors répertoire public • accès authentifié</div>
        </div>
      </div>

      {/* Sub-navigation + Emergency Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'firewall', label: 'Pare-feu & Sessions' },
            { id: 'policies', label: 'Anti-Sabotage Commandes' },
            { id: 'logs', label: `Journal d’Audit (${overview?.logs.length ?? 0})` },
            { id: 'antiphishing', label: 'Anti-Phishing & DNS' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as SecuritySubTab)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                subTab === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={loadSecurityOverview}
          className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      {/* SUBTAB 1: FIREWALL & SESSIONS */}
      {subTab === 'firewall' && overview && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Active IP / Account Rate Blocks */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-slate-900">Blocages actifs (IP / comptes verrouillés)</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Les sources dépassant les seuils anti-brute-force ou anti-spam sont isolées temporairement.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-700 tabular-nums">
                {overview.activeBlocks.length} actif(s)
              </span>
            </div>

            {overview.activeBlocks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto" />
                <p>Aucune IP ni aucun compte bloqué en ce moment.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs tabular-nums">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">IP / Clé</th>
                      <th className="py-2.5 px-4 text-right">Tentatives</th>
                      <th className="py-2.5 px-4">Expiration</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overview.activeBlocks.map(block => (
                      <tr key={block.key} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-800">{block.scope}</td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-slate-900">{block.ip}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">{block.key}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-rose-700">{block.attempts}</td>
                        <td className="py-3 px-4 text-slate-600">{block.remainingMinutes} min</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleUnblockKey(block.key)}
                            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <Unlock className="w-3 h-3" /> Débloquer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Panel: Session Epoch Kill-Switch & Protections Summary */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Révocation globale des sessions</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Invalide immédiatement tous les jetons et cookies de session existants sur tous les appareils (epoch actuel :{' '}
                    <span className="font-mono font-bold text-slate-900 tabular-nums">#{overview.config.tokenEpoch}</span>). Votre session actuelle reste connectée.
                  </p>
                </div>
              </div>
              <button
                onClick={handleRevokeSessions}
                disabled={revokingSessions}
                className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 disabled:opacity-60 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{revokingSessions ? 'Révocation en cours...' : 'Révoquer toutes les autres sessions'}</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Protections actives en serveur
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {overview.headersEnabled.map(item => (
                  <div key={item.name} className="py-2">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="text-[11px] text-slate-500">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: ANTI-SABOTAGE POLICIES */}
      {subTab === 'policies' && (
        <form onSubmit={handleSavePolicies} className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl space-y-5">
          <div>
            <h2 className="font-bold text-base text-slate-900">Politique Anti-Sabotage &amp; Anti-Rupture Artificielle</h2>
            <p className="text-xs text-slate-500 mt-1">
              Empêche les scripts malveillants de vider votre stock virtuel via des commandes abusives ou de saturer les paiements en officine sans compte vérifié.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 tabular-nums">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Plafond paiement officine invité (€)</label>
              <input
                type="number"
                min={50}
                max={2000}
                required
                value={maxCodGuestAmount}
                onChange={(e) => setMaxCodGuestAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Au-delà, carte bancaire ou compte requis.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Max unités par produit / commande</label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={maxOrderQtyPerItem}
                onChange={(e) => setMaxOrderQtyPerItem(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Évite le gel d’un SKU par un bot.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Max articles total / commande</label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={maxOrderTotalItems}
                onChange={(e) => setMaxOrderTotalItems(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Limite globale par panier validé.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-900">Contrôles automatiques permanents :</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Recalcul intégral des prix, promotions et frais de port côté serveur (les montants modifiés côté navigateur sont rejetés).</li>
              <li>Champs pièges invisibles (honeypot) sur commande, formulaire de contact, tchat patient et prise de rendez-vous.</li>
              <li>Limitation de débit sur connexions (5 essais), inscriptions, mots de passe oubliés, ordonnances et rendez-vous.</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPolicy}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{savingPolicy ? 'Enregistrement...' : 'Enregistrer les seuils'}</span>
            </button>
          </div>
        </form>
      )}

      {/* SUBTAB 3: SECURITY AUDIT LOG */}
      {subTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'Toutes catégories' },
                { id: 'auth', label: 'Authentification' },
                { id: 'anti_sabotage', label: 'Anti-Sabotage' },
                { id: 'medical_privacy', label: 'Secret Médical' },
                { id: 'admin', label: 'Administration' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setLogCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    logCategoryFilter === cat.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <select
              value={logSeverityFilter}
              onChange={(e) => setLogSeverityFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-semibold text-slate-700"
            >
              <option value="all">Toutes sévérités</option>
              <option value="critical">Critique uniquement</option>
              <option value="warning">Avertissements</option>
              <option value="info">Informations</option>
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs tabular-nums">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Horodatage</th>
                    <th className="py-3 px-4">Sévérité</th>
                    <th className="py-3 px-4">Événement</th>
                    <th className="py-3 px-4">Acteur / IP</th>
                    <th className="py-3 px-4">Détail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${severityBadgeClass(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{log.event}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{log.actor}</div>
                        <div className="text-[11px] font-mono text-slate-400">{log.ip}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{log.detail}</td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        Aucun événement enregistré pour ces filtres.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: ANTI-PHISHING & DNS */}
      {subTab === 'antiphishing' && overview && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-base text-slate-900">Protection Anti-Usurpation Email &amp; Domaine (SPF / DKIM / DMARC)</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Ajoutez ces enregistrements DNS sur votre domaine officiel afin que les boîtes mail rejettent automatiquement les faux emails envoyés au nom de votre pharmacie.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Enregistrement TXT SPF (@)</span>
                  <button
                    type="button"
                    onClick={() => copySnippet(spfRecord, 'Enregistrement SPF')}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[11px] font-semibold inline-flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copier
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">{spfRecord}</pre>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Enregistrement TXT DMARC (_dmarc) — Rejet strict</span>
                  <button
                    type="button"
                    onClick={() => copySnippet(dmarcRecord, 'Enregistrement DMARC')}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[11px] font-semibold inline-flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copier
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">{dmarcRecord}</pre>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 leading-relaxed">
                <strong>Signature DKIM :</strong> {dkimNote}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Fichier standard /.well-known/security.txt</h3>
              <a
                href="/.well-known/security.txt"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Ouvrir →
              </a>
            </div>
            <p className="text-xs text-slate-500">
              Permet aux chercheurs en sécurité et aux autorités de signaler immédiatement une tentative de phishing ou un domaine clone.
            </p>
            <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
              {overview.securityTxtPreview}
            </pre>
            <button
              type="button"
              onClick={() => copySnippet(overview.securityTxtPreview, 'security.txt')}
              className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" /> Copier le contenu security.txt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
