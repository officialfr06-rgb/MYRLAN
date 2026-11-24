import React, { useEffect, useMemo, useState } from 'react';
import {
  MailCheck, Eye, Edit3, History, Send, RotateCcw, Save,
  CheckCircle, PauseCircle, Monitor, Smartphone, Plus
} from 'lucide-react';
import { EmailLogEntry, EmailTemplate, EmailTemplateCategory } from '../types';
import { authFetch } from '../utils/authToken';

interface AdminEmailTemplatesDashboardProps {
  showToast: (msg: string) => void;
  adminEmail?: string;
}

type CategoryFilter = 'Tous' | EmailTemplateCategory;
type WorkspaceTab = 'editor' | 'preview' | 'logs';

const ACCENT_PALETTE = [
  { hex: '#1d4ed8', label: 'Bleu Officine' },
  { hex: '#0284c7', label: 'Bleu Expédition' },
  { hex: '#047857', label: 'Vert Validation' },
  { hex: '#b45309', label: 'Ambre Alerte' },
  { hex: '#be123c', label: 'Carmin Annulation' }
];

function interpolatePreview(str: string, vars: Record<string, string>): string {
  return String(str || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key) => {
    return vars[key] || '—';
  });
}

export const AdminEmailTemplatesDashboard: React.FC<AdminEmailTemplatesDashboardProps> = ({
  showToast,
  adminEmail = ''
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [sampleVars, setSampleVars] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('Tous');
  const [selectedId, setSelectedId] = useState<string>('appointment_confirmed');
  const [draft, setDraft] = useState<EmailTemplate | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('editor');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testEmail, setTestEmail] = useState(adminEmail);

  useEffect(() => {
    if (adminEmail && !testEmail) {
      setTestEmail(adminEmail);
    }
  }, [adminEmail, testEmail]);

  useEffect(() => {
    let cancelled = false;
    authFetch('/api/admin/email-templates')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        if (Array.isArray(data.templates)) {
          setTemplates(data.templates);
          const initial = data.templates.find((t: EmailTemplate) => t.id === selectedId) || data.templates[0];
          if (initial) {
            setSelectedId(initial.id);
            setDraft(initial);
          }
        }
        if (Array.isArray(data.logs)) setLogs(data.logs);
        if (data.sampleVariables && typeof data.sampleVariables === 'object') {
          setSampleVars(data.sampleVariables);
        }
      })
      .catch(() => showToast('Impossible de charger les templates emails.'))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const filteredTemplates = useMemo(() => {
    if (categoryFilter === 'Tous') return templates;
    return templates.filter(t => t.category === categoryFilter);
  }, [templates, categoryFilter]);

  const activeTemplate = useMemo(
    () => templates.find(t => t.id === selectedId) || null,
    [templates, selectedId]
  );

  const handleSelectTemplate = (tpl: EmailTemplate) => {
    setSelectedId(tpl.id);
    setDraft(tpl);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!draft) return;
    setIsSaving(true);
    try {
      const res = await authFetch(`/api/admin/email-templates/${encodeURIComponent(draft.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Erreur lors de la sauvegarde.');
        return;
      }
      setTemplates(prev => prev.map(t => (t.id === draft.id ? data.template : t)));
      setDraft(data.template);
      showToast(`Modèle « ${data.template.name} » enregistré.`);
    } catch {
      showToast('Erreur réseau lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetTemplate = async () => {
    if (!draft) return;
    setIsSaving(true);
    try {
      const res = await authFetch(`/api/admin/email-templates/${encodeURIComponent(draft.id)}/reset`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Impossible de réinitialiser.');
        return;
      }
      setTemplates(prev => prev.map(t => (t.id === draft.id ? data.template : t)));
      setDraft(data.template);
      showToast(`Modèle « ${data.template.name} » réinitialisé par défaut.`);
    } catch {
      showToast('Erreur réseau.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!draft) return;
    const recipient = testEmail.trim() || adminEmail;
    if (!recipient || !recipient.includes('@')) {
      showToast('Veuillez saisir une adresse email de destination valide.');
      return;
    }
    setIsTesting(true);
    try {
      const res = await authFetch(`/api/admin/email-templates/${encodeURIComponent(draft.id)}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipient, draft })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Échec de l’envoi de test.');
        return;
      }
      if (Array.isArray(data.logs)) setLogs(data.logs);
      showToast(`Email de test préparé pour ${recipient} (${data.logEntry?.status || 'OK'}).`);
    } catch {
      showToast('Erreur serveur pendant l’envoi de test.');
    } finally {
      setIsTesting(false);
    }
  };

  const insertVariableIntoBody = (variableName: string) => {
    if (!draft) return;
    const token = `{{${variableName}}}`;
    setDraft(prev => prev ? {
      ...prev,
      body: prev.body.endsWith(' ') || prev.body.endsWith('\n') || !prev.body
        ? `${prev.body}${token}`
        : `${prev.body} ${token}`
    } : prev);
  };

  const renderedPreview = useMemo(() => {
    if (!draft) return null;
    return {
      subject: interpolatePreview(draft.subject, sampleVars),
      heading: interpolatePreview(draft.heading, sampleVars),
      paragraphs: interpolatePreview(draft.body, sampleVars).split(/\n{2,}/),
      ctaLabel: interpolatePreview(draft.ctaLabel, sampleVars),
      footerNote: interpolatePreview(draft.footerNote, sampleVars)
    };
  }, [draft, sampleVars]);

  const activeCount = templates.filter(t => t.enabled).length;

  return (
    <div className="space-y-6">
      {/* Top Header Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MailCheck className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-bold text-slate-900">
              Templates Emails &amp; Notifications automatiques
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Configurez les emails envoyés automatiquement lors des changements de statut (commandes, rendez-vous et ordonnances).
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs tabular-nums">
          <div>
            <span className="text-slate-400">Actifs : </span>
            <strong className="text-slate-900">{activeCount}/{templates.length}</strong>
          </div>
          <span className="text-slate-300">·</span>
          <div>
            <span className="text-slate-400">Envois tracés : </span>
            <strong className="text-slate-900">{logs.length}</strong>
          </div>
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left List: Status Templates */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50/70">
            <div className="flex flex-wrap gap-1">
              {(['Tous', 'Commandes', 'Rendez-vous', 'Ordonnances', 'Catalogue & CRM'] as CategoryFilter[]).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="p-6 text-center text-xs text-slate-400">Chargement des modèles...</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTemplates.map(tpl => {
                const isSelected = tpl.id === selectedId;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`w-full text-left p-4 transition-colors flex items-start justify-between gap-3 ${
                      isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: tpl.accentColor }}
                        />
                        <span>{tpl.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{tpl.statusLabel}</span>
                      </div>
                      <div className={`text-sm font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                        {tpl.name}
                      </div>
                    </div>

                    <span className={`text-[11px] font-semibold inline-flex items-center gap-1 shrink-0 mt-0.5 ${
                      tpl.enabled ? 'text-emerald-700' : 'text-slate-400'
                    }`}>
                      {tpl.enabled ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" /> Actif
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-3.5 h-3.5" /> Pause
                        </>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Workspace: Editor / HTML Preview / Logs */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          {!draft ? (
            <div className="p-10 text-center text-xs text-slate-400">
              Sélectionnez un modèle email dans la liste à gauche pour l’éditer.
            </div>
          ) : (
            <>
              {/* Workspace Top Tabs */}
              <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setWorkspaceTab('editor')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                      workspaceTab === 'editor' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Éditeur</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkspaceTab('preview')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                      workspaceTab === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Aperçu HTML</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkspaceTab('logs')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                      workspaceTab === 'logs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Historique ({logs.length})</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 tabular-nums">
                  Modifié le {activeTemplate?.updatedAt || draft.updatedAt}
                </div>
              </div>

              {workspaceTab === 'editor' && (
                <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 text-xs">
                  {/* Trigger Info + Auto-Send Switch */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="space-y-0.5 max-w-xl">
                      <div className="font-bold text-sm text-slate-900">
                        {draft.name} <span className="text-slate-400 font-normal">· {draft.statusLabel}</span>
                      </div>
                      <p className="text-xs text-slate-500">{draft.triggerEvent}</p>
                    </div>

                    <label className="inline-flex items-center gap-2 font-semibold text-slate-800 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={draft.enabled}
                        onChange={(e) => setDraft(prev => prev ? { ...prev, enabled: e.target.checked } : prev)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                      />
                      <span>Envoi automatique activé</span>
                    </label>
                  </div>

                  {/* Accent Color */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-semibold text-slate-700">Couleur d’en-tête &amp; bouton</span>
                    <div className="flex items-center gap-2">
                      {ACCENT_PALETTE.map(c => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setDraft(prev => prev ? { ...prev, accentColor: c.hex } : prev)}
                          title={c.label}
                          aria-label={c.label}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${
                            draft.accentColor === c.hex ? 'border-slate-900 scale-110' : 'border-white shadow-xs'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Subject & Heading */}
                  <div className="grid grid-cols-1 gap-4">
                    <label className="space-y-1.5 block">
                      <span className="font-semibold text-slate-700 block">Objet de l’email</span>
                      <input
                        type="text"
                        required
                        maxLength={160}
                        value={draft.subject}
                        onChange={(e) => setDraft(prev => prev ? { ...prev, subject: e.target.value } : prev)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </label>

                    <label className="space-y-1.5 block">
                      <span className="font-semibold text-slate-700 block">Titre principal dans l’email</span>
                      <input
                        type="text"
                        required
                        maxLength={180}
                        value={draft.heading}
                        onChange={(e) => setDraft(prev => prev ? { ...prev, heading: e.target.value } : prev)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </label>

                    {/* Available Variables Inserter */}
                    <div className="space-y-1.5">
                      <span className="font-semibold text-slate-700 block">
                        Corps du message <span className="text-slate-400 font-normal">(cliquez une variable pour l’insérer)</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5 pb-1">
                        {draft.availableVariables.map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => insertVariableIntoBody(v)}
                            className="px-2 py-1 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 font-mono text-[11px] inline-flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{`{{${v}}}`}</span>
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={6}
                        required
                        maxLength={3000}
                        value={draft.body}
                        onChange={(e) => setDraft(prev => prev ? { ...prev, body: e.target.value } : prev)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="space-y-1.5 block">
                        <span className="font-semibold text-slate-700 block">Texte du bouton CTA</span>
                        <input
                          type="text"
                          required
                          maxLength={60}
                          value={draft.ctaLabel}
                          onChange={(e) => setDraft(prev => prev ? { ...prev, ctaLabel: e.target.value } : prev)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                      </label>

                      <label className="space-y-1.5 block">
                        <span className="font-semibold text-slate-700 block">Lien interne du bouton</span>
                        <input
                          type="text"
                          required
                          maxLength={120}
                          value={draft.ctaPath}
                          onChange={(e) => setDraft(prev => prev ? { ...prev, ctaPath: e.target.value } : prev)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                      </label>
                    </div>

                    <label className="space-y-1.5 block">
                      <span className="font-semibold text-slate-700 block">Note de pied de page</span>
                      <input
                        type="text"
                        maxLength={300}
                        value={draft.footerNote}
                        onChange={(e) => setDraft(prev => prev ? { ...prev, footerNote: e.target.value } : prev)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </label>
                  </div>

                  {/* Save & Test Dispatch Actions */}
                  <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="email-test@exemple.fr"
                        className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 w-52 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                      <button
                        type="button"
                        disabled={isTesting}
                        onClick={handleSendTest}
                        className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-60"
                      >
                        <Send className="w-3.5 h-3.5 text-blue-700" />
                        <span>{isTesting ? 'Envoi...' : 'Tester'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleResetTemplate}
                        className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Réinitialiser</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-60"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {workspaceTab === 'preview' && renderedPreview && (
                <div className="p-5 sm:p-6 space-y-4 bg-slate-100/80">
                  {/* Device Width Switcher & Rendered Subject */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs">
                    <div className="min-w-0">
                      <span className="text-slate-400">Objet : </span>
                      <strong className="text-slate-900">{renderedPreview.subject}</strong>
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold inline-flex items-center gap-1 ${
                          previewDevice === 'desktop' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        <Monitor className="w-3.5 h-3.5" /> Bureau
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold inline-flex items-center gap-1 ${
                          previewDevice === 'mobile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" /> Mobile
                      </button>
                    </div>
                  </div>

                  {/* Email Card Render */}
                  <div className="flex justify-center py-2">
                    <div
                      className={`w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all ${
                        previewDevice === 'mobile' ? 'max-w-[360px]' : 'max-w-[600px]'
                      }`}
                    >
                      <div
                        className="px-6 py-5 text-white"
                        style={{ backgroundColor: draft.accentColor }}
                      >
                        <div className="text-[11px] font-bold uppercase tracking-wider opacity-90">
                          Myrlan Officine · {draft.statusLabel}
                        </div>
                        <div className="text-lg sm:text-xl font-bold mt-1.5 leading-snug">
                          {renderedPreview.heading}
                        </div>
                      </div>

                      <div className="p-6 space-y-4 text-sm text-slate-700 leading-relaxed">
                        {renderedPreview.paragraphs.map((para, idx) => (
                          <p key={idx} className="whitespace-pre-line">
                            {para}
                          </p>
                        ))}

                        <div className="pt-2">
                          <span
                            className="inline-block px-5 py-2.5 rounded-lg text-white font-bold text-xs"
                            style={{ backgroundColor: draft.accentColor }}
                          >
                            {renderedPreview.ctaLabel}
                          </span>
                        </div>
                      </div>

                      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 leading-relaxed">
                        {renderedPreview.footerNote}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {workspaceTab === 'logs' && (
                <div className="overflow-x-auto">
                  {logs.length === 0 ? (
                    <div className="p-10 text-center text-xs text-slate-400">
                      Aucun email déclenché pour l’instant. Passez une commande, réservez un rendez-vous ou envoyez un test depuis l’éditeur.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Modèle</th>
                          <th className="py-3 px-4">Destinataire</th>
                          <th className="py-3 px-4">Objet</th>
                          <th className="py-3 px-4 text-right">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {logs.map(entry => (
                          <tr key={entry.id} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap tabular-nums">
                              {entry.sentAt}
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                              {entry.templateName}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">
                              {entry.to}
                            </td>
                            <td className="py-2.5 px-4 text-slate-700 max-w-xs truncate">
                              {entry.subject}
                            </td>
                            <td className="py-2.5 px-4 text-right whitespace-nowrap">
                              <span className={`font-semibold ${
                                entry.status === 'Envoyé (SMTP)'
                                  ? 'text-emerald-700'
                                  : entry.status === 'Mode Aperçu'
                                    ? 'text-blue-700'
                                    : entry.status === 'Erreur'
                                      ? 'text-rose-700'
                                      : 'text-slate-400'
                              }`}>
                                {entry.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
