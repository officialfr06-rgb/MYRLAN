import React, { useEffect, useMemo, useState } from 'react';
import {
  Globe, FileCode, Search, Link2, ShieldCheck, Download, Copy,
  ExternalLink, CheckCircle, AlertTriangle, Plus, Trash2, RefreshCw,
  Edit, Save, Play, Wrench
} from 'lucide-react';
import { Product, WebmasterConfig, WebmasterRedirect, WebmasterUrlCheck } from '../types';
import { authFetch } from '../utils/authToken';
import { useShop } from '../context/ShopContext';

interface AdminWebmasterDashboardProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  showToast: (msg: string) => void;
}

type WebmasterSubTab = 'sitemap' | 'seo' | 'audit' | 'redirects' | 'maintenance';

export const AdminWebmasterDashboard: React.FC<AdminWebmasterDashboardProps> = ({
  products,
  onEditProduct,
  showToast
}) => {
  const [subTab, setSubTab] = useState<WebmasterSubTab>('sitemap');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState<WebmasterConfig | null>(null);
  const [resolvedBaseUrl, setResolvedBaseUrl] = useState('');
  const [sitemapXml, setSitemapXml] = useState('');
  const [robotsPreview, setRobotsPreview] = useState('');
  const [defaultRobotsTxt, setDefaultRobotsTxt] = useState('');

  // SEO Audit filter
  const [auditFilter, setAuditFilter] = useState<'all' | 'issues' | 'ok'>('all');

  // Redirect form
  const [newFromPath, setNewFromPath] = useState('');
  const [newToPath, setNewToPath] = useState('/');
  const [newStatusCode, setNewStatusCode] = useState<301 | 302>(301);
  const [addingRedirect, setAddingRedirect] = useState(false);

  // URL Health Checker
  const [urlChecks, setUrlChecks] = useState<WebmasterUrlCheck[]>([]);
  const [checkingUrls, setCheckingUrls] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);

  const { maintenanceConfig, updateMaintenanceConfig } = useShop();
  const [localMaintEnabled, setLocalMaintEnabled] = useState(maintenanceConfig.enabled);
  const [localMaintMessage, setLocalMaintMessage] = useState(maintenanceConfig.message);
  const [savingMaint, setSavingMaint] = useState(false);

  useEffect(() => {
    setLocalMaintEnabled(maintenanceConfig.enabled);
    setLocalMaintMessage(maintenanceConfig.message);
  }, [maintenanceConfig.enabled, maintenanceConfig.message]);

  const handleSaveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMaint(true);
    await updateMaintenanceConfig({
      enabled: localMaintEnabled,
      message: localMaintMessage
    });
    setSavingMaint(false);
  };

  const loadWebmasterData = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/webmaster');
      const data = await res.json();
      if (data && data.config) {
        setConfig(data.config);
        setResolvedBaseUrl(data.resolvedBaseUrl || window.location.origin);
        setSitemapXml(data.sitemapXml || '');
        setRobotsPreview(data.robotsPreview || '');
        setDefaultRobotsTxt(data.defaultRobotsTxt || '');
      }
    } catch {
      showToast('Impossible de charger la configuration Webmaster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWebmasterData();
  }, [products.length]);

  const productAudits = useMemo(() => {
    return products.map(p => {
      const issues: string[] = [];
      if (!p.description || p.description.trim().length < 60) {
        issues.push('Description courte (< 60 car.)');
      }
      if (!/^\d{8,14}$/.test(String(p.ean || '').trim())) {
        issues.push('EAN manquant ou invalide');
      }
      if (!p.image || !p.image.trim()) {
        issues.push('Image manquante');
      }
      if (p.stock <= 0) {
        issues.push('Rupture de stock');
      }
      return {
        product: p,
        issues,
        compliant: issues.length === 0
      };
    });
  }, [products]);

  const filteredAudits = useMemo(() => {
    if (auditFilter === 'issues') return productAudits.filter(a => !a.compliant);
    if (auditFilter === 'ok') return productAudits.filter(a => a.compliant);
    return productAudits;
  }, [productAudits, auditFilter]);

  const auditIssuesCount = useMemo(
    () => productAudits.filter(a => !a.compliant).length,
    [productAudits]
  );

  const sitemapUrlsCount = useMemo(
    () => (sitemapXml.match(/<url>/g) || []).length,
    [sitemapXml]
  );

  const activeRedirectsCount = useMemo(
    () => (config?.redirects || []).filter(r => r.active).length,
    [config]
  );

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/webmaster', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
        setResolvedBaseUrl(data.resolvedBaseUrl || resolvedBaseUrl);
        setSitemapXml(data.sitemapXml || sitemapXml);
        setRobotsPreview(data.robotsPreview || robotsPreview);
        showToast('Configuration Webmaster & SEO enregistrée et appliquée.');
      } else {
        showToast(data.error || 'Erreur lors de la sauvegarde.');
      }
    } catch {
      showToast('Erreur réseau lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast(`${label} copié dans le presse-papiers.`);
    } catch {
      showToast('Impossible de copier automatiquement.');
    }
  };

  const handleDownloadSitemap = () => {
    if (!sitemapXml) return;
    const blob = new Blob([sitemapXml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Fichier sitemap.xml téléchargé.');
  };

  const handleDownloadBackup = async () => {
    try {
      const res = await authFetch('/api/admin/webmaster/export');
      if (!res.ok) {
        showToast('Erreur lors de l’export de sauvegarde.');
        return;
      }
      const text = await res.text();
      const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `myrlan-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Sauvegarde JSON exportée avec succès.');
    } catch {
      showToast('Erreur réseau lors de l’export.');
    }
  };

  const handleAddRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFromPath.trim() || !newToPath.trim()) return;
    setAddingRedirect(true);
    try {
      const res = await authFetch('/api/admin/webmaster/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromPath: newFromPath.trim(),
          toPath: newToPath.trim(),
          statusCode: newStatusCode
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.redirects)) {
        setConfig(prev => prev ? { ...prev, redirects: data.redirects } : prev);
        setNewFromPath('');
        setNewToPath('/');
        showToast('Redirection enregistrée.');
      } else {
        showToast(data.error || 'Impossible d’ajouter la redirection.');
      }
    } catch {
      showToast('Erreur réseau.');
    } finally {
      setAddingRedirect(false);
    }
  };

  const handleToggleRedirect = async (rule: WebmasterRedirect) => {
    try {
      const res = await authFetch(`/api/admin/webmaster/redirects/${encodeURIComponent(rule.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !rule.active })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.redirects)) {
        setConfig(prev => prev ? { ...prev, redirects: data.redirects } : prev);
      }
    } catch {
      showToast('Erreur réseau.');
    }
  };

  const handleDeleteRedirect = async (id: string) => {
    try {
      const res = await authFetch(`/api/admin/webmaster/redirects/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.redirects)) {
        setConfig(prev => prev ? { ...prev, redirects: data.redirects } : prev);
        showToast('Redirection supprimée.');
      }
    } catch {
      showToast('Erreur réseau.');
    }
  };

  const handleRunUrlCheck = async () => {
    setCheckingUrls(true);
    try {
      const res = await authFetch('/api/admin/webmaster/check-urls', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.checks)) {
        setUrlChecks(data.checks);
        setLastCheckedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        showToast(`${data.checks.length} URL(s) analysées.`);
      } else {
        showToast(data.error || 'Erreur lors du diagnostic.');
      }
    } catch {
      showToast('Erreur réseau lors du diagnostic.');
    } finally {
      setCheckingUrls(false);
    }
  };

  if (loading && !config) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
        Chargement des outils Webmaster &amp; SEO...
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
        <p className="text-xs text-slate-600">Impossible de charger la configuration Webmaster.</p>
        <button
          onClick={loadWebmasterData}
          className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const effectiveBase = resolvedBaseUrl || window.location.origin;
  const sitemapEndpointUrl = `${effectiveBase}/sitemap.xml`;
  const robotsEndpointUrl = `${effectiveBase}/robots.txt`;

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 tabular-nums">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>URLs dans le Sitemap</span>
            <Globe className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{sitemapUrlsCount}</div>
          <div className="text-[11px] text-slate-500">
            {config.sitemapIncludeProducts ? 'Pages + fiches produits actives' : 'Pages publiques uniquement'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Données Structurées</span>
            <FileCode className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {config.enablePharmacyJsonLd && config.enableProductJsonLd
              ? 'Actif (2/2)'
              : config.enablePharmacyJsonLd || config.enableProductJsonLd
                ? 'Partiel (1/2)'
                : 'Désactivé'}
          </div>
          <div className="text-[11px] text-slate-500">Schema.org Officine &amp; Produits</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Alertes SEO Catalogue</span>
            <AlertTriangle className={`w-4 h-4 ${auditIssuesCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
          </div>
          <div className="text-2xl font-bold text-slate-900">{auditIssuesCount}</div>
          <div className="text-[11px] text-slate-500">Sur {products.length} référence(s) publiée(s)</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Redirections 301 / 302</span>
            <Link2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeRedirectsCount}</div>
          <div className="text-[11px] text-slate-500">
            {(config.redirects || []).length} règle(s) enregistrée(s)
          </div>
        </div>
      </div>

      {/* Sub-navigation Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'sitemap', label: 'Sitemap & Robots.txt', icon: <Globe className="w-3.5 h-3.5" /> },
            { id: 'seo', label: 'SEO, Balises & Search Console', icon: <Search className="w-3.5 h-3.5" /> },
            { id: 'audit', label: `Audit Catalogue (${auditIssuesCount})`, icon: <ShieldCheck className="w-3.5 h-3.5" /> },
            { id: 'redirects', label: 'Redirections & Diagnostic', icon: <Link2 className="w-3.5 h-3.5" /> },
            { id: 'maintenance', label: `Mode Maintenance ${maintenanceConfig.enabled ? '(ACTIF)' : ''}`, icon: <Wrench className="w-3.5 h-3.5" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as WebmasterSubTab)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                subTab === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleDownloadBackup}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Exporter sauvegarde JSON</span>
        </button>
      </div>

      {/* ================================================================== */}
      {/* TAB 1: SITEMAP XML & ROBOTS.TXT                                    */}
      {/* ================================================================== */}
      {subTab === 'sitemap' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Live Sitemap Controls & XML Preview */}
          <div className="lg:col-span-7 min-w-0 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-bold text-sm text-slate-900">Sitemap XML dynamique</h2>
                <p className="text-[11px] text-slate-500">
                  Mis à jour automatiquement à chaque ajout ou suppression de produit.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={loadWebmasterData}
                  className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Actualiser
                </button>
                <button
                  onClick={handleDownloadSitemap}
                  className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Télécharger XML
                </button>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-[11px] font-semibold inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Ouvrir /sitemap.xml
                </a>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Submit URL box */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-500">URL à soumettre dans Google Search Console &amp; Bing</div>
                  <div className="font-mono text-xs font-bold text-slate-900 truncate">{sitemapEndpointUrl}</div>
                </div>
                <button
                  onClick={() => handleCopyText(sitemapEndpointUrl, 'Lien Sitemap')}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" /> Copier
                </button>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={config.sitemapIncludeProducts}
                    onChange={(e) => setConfig({ ...config, sitemapIncludeProducts: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Inclure les fiches produits ({products.length})</span>
                </label>

                <div className="p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-700">Fréquence produits</span>
                  <select
                    value={config.sitemapChangeFreq}
                    onChange={(e) => setConfig({ ...config, sitemapChangeFreq: e.target.value as WebmasterConfig['sitemapChangeFreq'] })}
                    className="px-2.5 py-1 border border-slate-200 rounded-md bg-white text-xs font-semibold"
                  >
                    <option value="daily">Quotidienne (daily)</option>
                    <option value="weekly">Hebdomadaire (weekly)</option>
                    <option value="monthly">Mensuelle (monthly)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Aperçu XML ({sitemapUrlsCount} URLs)</span>
                  <button
                    onClick={() => handleCopyText(sitemapXml, 'Contenu XML')}
                    className="text-blue-700 hover:underline font-semibold"
                  >
                    Copier le XML
                  </button>
                </div>
                <pre className="p-3.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-80">
                  {sitemapXml}
                </pre>
              </div>
            </div>
          </div>

          {/* Right: Robots.txt Editor */}
          <form onSubmit={handleSaveConfig} className="lg:col-span-5 min-w-0 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-bold text-sm text-slate-900">Éditeur robots.txt</h2>
                <p className="text-[11px] text-slate-500">Règles d’exploration pour les moteurs de recherche.</p>
              </div>
              <a
                href="/robots.txt"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Ouvrir
              </a>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
                <span className="font-mono text-slate-700 truncate">{robotsEndpointUrl}</span>
                <button
                  type="button"
                  onClick={() => handleCopyText(robotsEndpointUrl, 'Lien robots.txt')}
                  className="text-blue-700 hover:underline font-semibold shrink-0"
                >
                  Copier
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Directives robots.txt</label>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, robotsTxt: defaultRobotsTxt || config.robotsTxt })}
                    className="text-[11px] font-semibold text-blue-700 hover:underline"
                  >
                    Modèle recommandé
                  </button>
                </div>
                <textarea
                  rows={10}
                  value={config.robotsTxt}
                  onChange={(e) => setConfig({ ...config, robotsTxt: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  La variable <span className="font-mono">{'{{SITEMAP_URL}}'}</span> est automatiquement remplacée par l’URL complète du sitemap.
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-600">Rendu servi sur /robots.txt</div>
                <pre className="p-3 rounded-lg bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-700 overflow-x-auto whitespace-pre-wrap">
                  {robotsPreview}
                </pre>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Enregistrement...' : 'Enregistrer Sitemap & Robots.txt'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 2: SEO METADATA, VERIFICATION TAGS & SCHEMA.ORG                */}
      {/* ================================================================== */}
      {subTab === 'seo' && (
        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form */}
          <div className="lg:col-span-7 min-w-0 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="font-bold text-sm text-slate-900">Métadonnées globales &amp; Vérification Webmaster</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Injectées automatiquement dans l’en-tête du site et adaptées dynamiquement sur chaque fiche produit.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Titre principal (balise &lt;title&gt;)</label>
                  <span className={`font-mono tabular-nums ${config.siteTitle.length >= 30 && config.siteTitle.length <= 60 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {config.siteTitle.length} / 60 car.
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={config.siteTitle}
                  onChange={(e) => setConfig({ ...config, siteTitle: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Meta description par défaut</label>
                  <span className={`font-mono tabular-nums ${config.siteDescription.length >= 120 && config.siteDescription.length <= 160 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {config.siteDescription.length} / 160 car.
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={config.siteDescription}
                  onChange={(e) => setConfig({ ...config, siteDescription: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Domaine canonique (optionnel)</label>
                  <input
                    type="text"
                    value={config.canonicalBaseUrl}
                    onChange={(e) => setConfig({ ...config, canonicalBaseUrl: e.target.value })}
                    placeholder="https://www.myrlan.fr"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Laissez vide pour détecter l’URL courante.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Image partage OpenGraph (URL)</label>
                  <input
                    type="text"
                    value={config.ogImageUrl}
                    onChange={(e) => setConfig({ ...config, ogImageUrl: e.target.value })}
                    placeholder="/uploads/... ou https://..."
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-3">
                <h3 className="font-bold text-xs text-slate-900">Codes de vérification &amp; Mesure d’audience</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Google Search Console (content)</label>
                    <input
                      type="text"
                      value={config.googleSiteVerification}
                      onChange={(e) => setConfig({ ...config, googleSiteVerification: e.target.value })}
                      placeholder="Ex: aBcDeFgHiJkLmNoPqRsTuVwXyZ"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bing Webmaster (msvalidate.01)</label>
                    <input
                      type="text"
                      value={config.bingSiteVerification}
                      onChange={(e) => setConfig({ ...config, bingSiteVerification: e.target.value })}
                      placeholder="Ex: 1234567890ABCDEF"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Google Analytics 4 (ID de mesure)</label>
                  <input
                    type="text"
                    value={config.gaMeasurementId}
                    onChange={(e) => setConfig({ ...config, gaMeasurementId: e.target.value.toUpperCase() })}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-2">
                <h3 className="font-bold text-xs text-slate-900">Données structurées Schema.org (JSON-LD)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={config.enablePharmacyJsonLd}
                      onChange={(e) => setConfig({ ...config, enablePharmacyJsonLd: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="font-semibold text-slate-800">Schéma Officine (Pharmacy)</span>
                  </label>
                  <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={config.enableProductJsonLd}
                      onChange={(e) => setConfig({ ...config, enableProductJsonLd: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="font-semibold text-slate-800">Schéma Produits (Prix, Stock, EAN)</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Enregistrement...' : 'Enregistrer les paramètres SEO'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Live Previews */}
          <div className="lg:col-span-5 min-w-0 space-y-5">
            {/* Google SERP Preview */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="text-xs font-bold text-slate-900">Aperçu résultat Google (SERP)</div>
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="text-[11px] text-slate-600 truncate font-mono">{effectiveBase}</div>
                <div className="text-base font-semibold text-blue-800 leading-snug line-clamp-2">
                  {config.siteTitle}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {config.siteDescription}
                </p>
              </div>
            </div>

            {/* Social OpenGraph Preview */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="text-xs font-bold text-slate-900">Aperçu partage social (OpenGraph)</div>
              <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                {config.ogImageUrl ? (
                  <img
                    src={config.ogImageUrl}
                    alt="Aperçu OpenGraph"
                    referrerPolicy="no-referrer"
                    className="w-full h-36 object-cover border-b border-slate-200"
                  />
                ) : (
                  <div className="w-full h-28 bg-slate-100 border-b border-slate-200 flex items-center justify-center text-[11px] text-slate-500">
                    Aucune image OpenGraph définie (les fiches produits utilisent leur photo)
                  </div>
                )}
                <div className="p-3.5 space-y-1">
                  <div className="text-[10px] font-mono text-slate-500 truncate">{effectiveBase}</div>
                  <div className="text-xs font-bold text-slate-900 truncate">{config.siteTitle}</div>
                  <div className="text-[11px] text-slate-600 line-clamp-2">{config.siteDescription}</div>
                </div>
              </div>
            </div>

            {/* Active Meta Tags Summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5 text-xs">
              <div className="font-bold text-slate-900">Balises actives injectées</div>
              <div className="space-y-1.5 text-[11px] font-mono text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 overflow-x-auto">
                <div>&lt;link rel=&quot;canonical&quot; href=&quot;{effectiveBase}/...&quot; /&gt;</div>
                {config.googleSiteVerification && (
                  <div>&lt;meta name=&quot;google-site-verification&quot; content=&quot;{config.googleSiteVerification}&quot; /&gt;</div>
                )}
                {config.bingSiteVerification && (
                  <div>&lt;meta name=&quot;msvalidate.01&quot; content=&quot;{config.bingSiteVerification}&quot; /&gt;</div>
                )}
                {config.gaMeasurementId && (
                  <div>Google Analytics : {config.gaMeasurementId}</div>
                )}
                <div>JSON-LD Officine : {config.enablePharmacyJsonLd ? 'Activé' : 'Désactivé'}</div>
                <div>JSON-LD Produits : {config.enableProductJsonLd ? 'Activé' : 'Désactivé'}</div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ================================================================== */}
      {/* TAB 3: CATALOG SEO AUDIT                                           */}
      {/* ================================================================== */}
      {subTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Audit SEO des fiches produits</h2>
              <p className="text-[11px] text-slate-500">
                Vérifie la longueur des descriptions, la validité du code EAN-13, les médias et la disponibilité.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: `Toutes (${productAudits.length})` },
                { id: 'issues', label: `À corriger (${auditIssuesCount})` },
                { id: 'ok', label: `Conformes (${productAudits.length - auditIssuesCount})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setAuditFilter(f.id as 'all' | 'issues' | 'ok')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    auditFilter === f.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                    <th className="py-3 px-4">Produit &amp; URL</th>
                    <th className="py-3 px-4">EAN</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">État SEO</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAudits.map(({ product, issues, compliant }) => (
                    <tr key={product.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 max-w-[260px] truncate">{product.name}</div>
                        <div className="text-[10px] font-mono text-slate-500">/produit/{product.id}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {product.ean || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {(product.description || '').trim().length} car.
                      </td>
                      <td className="py-3 px-4">
                        {compliant ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" /> Conforme
                          </span>
                        ) : (
                          <div className="text-amber-800 font-medium">
                            {issues.join(' · ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onEditProduct(product)}
                          className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" /> Corriger
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAudits.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        Aucune fiche produit dans cette catégorie.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 4: 301/302 REDIRECTS & TECHNICAL URL DIAGNOSTIC                */}
      {/* ================================================================== */}
      {subTab === 'redirects' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: 301 Redirect Manager */}
          <div className="lg:col-span-6 min-w-0 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="font-bold text-sm text-slate-900">Gestionnaire de redirections (301 / 302)</h2>
              <p className="text-[11px] text-slate-500">
                Redirige une ancienne URL supprimée ou modifiée vers une page valide sans perdre votre référencement.
              </p>
            </div>

            <div className="p-5 space-y-5">
              <form onSubmit={handleAddRedirect} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end text-xs">
                <div className="sm:col-span-5">
                  <label className="block font-bold text-slate-700 mb-1">Ancienne URL</label>
                  <input
                    type="text"
                    required
                    value={newFromPath}
                    onChange={(e) => setNewFromPath(e.target.value)}
                    placeholder="/ancien-produit"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block font-bold text-slate-700 mb-1">Destination</label>
                  <input
                    type="text"
                    required
                    value={newToPath}
                    onChange={(e) => setNewToPath(e.target.value)}
                    placeholder="/promotions"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
                <div className="sm:col-span-3 flex gap-1.5">
                  <select
                    value={newStatusCode}
                    onChange={(e) => setNewStatusCode(Number(e.target.value) === 302 ? 302 : 301)}
                    className="px-2 py-2 border border-slate-200 rounded-lg bg-white font-mono text-xs"
                  >
                    <option value={301}>301</option>
                    <option value={302}>302</option>
                  </select>
                  <button
                    type="submit"
                    disabled={addingRedirect}
                    className="flex-1 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg inline-flex items-center justify-center gap-1"
                    title="Ajouter"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs tabular-nums">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Source → Cible</th>
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3 text-right">Hits</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(config.redirects || []).map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          <div className="font-semibold text-slate-900">{r.fromPath}</div>
                          <div className="text-slate-500">→ {r.toPath}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{r.statusCode}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">{r.hits}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleRedirect(r)}
                              className={`px-2 py-1 rounded border text-[11px] font-semibold ${
                                r.active
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              {r.active ? 'Actif' : 'Inactif'}
                            </button>
                            <button
                              onClick={() => handleDeleteRedirect(r.id)}
                              className="p-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(config.redirects || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          Aucune redirection configurée.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Technical URL & Asset Diagnostic */}
          <div className="lg:col-span-6 min-w-0 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-bold text-sm text-slate-900">Diagnostic des routes &amp; médias</h2>
                <p className="text-[11px] text-slate-500">
                  {lastCheckedAt ? `Dernière vérification à ${lastCheckedAt}` : 'Contrôle Sitemap, robots.txt, pages et fiches produits.'}
                </p>
              </div>
              <button
                onClick={handleRunUrlCheck}
                disabled={checkingUrls}
                className="px-3.5 py-2 bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{checkingUrls ? 'Analyse...' : 'Lancer le diagnostic'}</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
              {urlChecks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                  <p>Cliquez sur « Lancer le diagnostic » pour contrôler toutes les URLs et fichiers SEO du site.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs tabular-nums">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">Route / Ressource</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Statut</th>
                      <th className="py-2.5 px-4">Détail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {urlChecks.map((c, idx) => (
                      <tr key={`${c.url}-${idx}`} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900 truncate max-w-[200px]">{c.label}</div>
                          <div className="font-mono text-[10px] text-slate-500 truncate max-w-[200px]">{c.url}</div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{c.category}</td>
                        <td className="py-2.5 px-4 font-mono font-bold">
                          <span className={c.ok ? 'text-emerald-700' : 'text-rose-700'}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{c.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 5: MAINTENANCE MODE CONFIGURATION                              */}
      {/* ================================================================== */}
      {subTab === 'maintenance' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-w-2xl mx-auto">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" /> Mode Maintenance de la Boutique
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Activez le mode maintenance pour suspendre temporairement l’accès aux clients. L’équipe admin conserve l’accès complet.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveMaintenance} className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-slate-900">Activer le mode maintenance</div>
                <div className="text-xs text-slate-500">
                  Les visiteurs verront l'écran de maintenance avec votre message personnalisé.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localMaintEnabled}
                  onChange={(e) => setLocalMaintEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Message affiché aux visiteurs
              </label>
              <textarea
                rows={4}
                value={localMaintMessage}
                onChange={(e) => setLocalMaintMessage(e.target.value)}
                maxLength={500}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 leading-relaxed"
                placeholder="Ex: Notre officine fait peau neuve..."
              />
              <div className="text-[11px] text-slate-400 text-right">Max 500 caractères</div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={savingMaint}
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                {savingMaint ? 'Enregistrement...' : 'Enregistrer le mode maintenance'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
