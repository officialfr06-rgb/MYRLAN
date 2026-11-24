import React, { useEffect, useState } from 'react';
import {
  Palette, CheckCircle, Eye, RotateCcw, Save, ArrowUpRight, LayoutTemplate
} from 'lucide-react';
import { DesignConfig, HeroPresetId } from '../types';
import { HERO_THEMES } from '../data/heroThemes';
import { HeroBanner } from './HeroBanner';
import { useShop } from '../context/ShopContext';
import { authFetch } from '../utils/authToken';

interface AdminDesignDashboardProps {
  showToast: (msg: string) => void;
  onNavigateStore: () => void;
}

export const AdminDesignDashboard: React.FC<AdminDesignDashboardProps> = ({
  showToast,
  onNavigateStore
}) => {
  const { designConfig, setDesignConfig } = useShop();

  const [publishedConfig, setPublishedConfig] = useState<DesignConfig>(designConfig);
  const [draftConfig, setDraftConfig] = useState<DesignConfig>(designConfig);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savingHeroId, setSavingHeroId] = useState<HeroPresetId | null>(null);

  useEffect(() => {
    let cancelled = false;
    authFetch('/api/admin/design')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        if (data?.config?.activeHeroId) {
          setPublishedConfig(data.config);
          setDraftConfig(data.config);
          setDesignConfig(data.config);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setDesignConfig]);

  const persistDesign = async (nextConfig: DesignConfig, heroIdTrigger?: HeroPresetId) => {
    setIsSaving(true);
    if (heroIdTrigger) setSavingHeroId(heroIdTrigger);
    try {
      const res = await authFetch('/api/admin/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextConfig)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Erreur lors de la mise à jour du design.');
        return;
      }
      setPublishedConfig(data.config);
      setDraftConfig(data.config);
      setDesignConfig(data.config);
      showToast('Design de la page d’accueil mis à jour en direct.');
    } catch {
      showToast('Impossible de joindre le serveur.');
    } finally {
      setIsSaving(false);
      setSavingHeroId(null);
    }
  };

  const handleActivateHero = async (heroId: HeroPresetId) => {
    const nextConfig: DesignConfig = {
      ...draftConfig,
      activeHeroId: heroId
    };
    setDraftConfig(nextConfig);
    await persistDesign(nextConfig, heroId);
  };

  const handleSaveOverrides = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistDesign(draftConfig);
  };

  const handleResetTexts = () => {
    setDraftConfig(prev => ({
      ...prev,
      customBadge: '',
      customTitle: '',
      customSubtitle: '',
      customPrimaryCtaLabel: ''
    }));
    showToast('Champs texte réinitialisés sur le modèle choisi (pensez à enregistrer).');
  };

  const hasUnpublishedChanges =
    draftConfig.activeHeroId !== publishedConfig.activeHeroId ||
    (draftConfig.customBadge || '') !== (publishedConfig.customBadge || '') ||
    (draftConfig.customTitle || '') !== (publishedConfig.customTitle || '') ||
    (draftConfig.customSubtitle || '') !== (publishedConfig.customSubtitle || '') ||
    (draftConfig.customPrimaryCtaLabel || '') !== (publishedConfig.customPrimaryCtaLabel || '') ||
    Boolean(draftConfig.showTrustBar) !== Boolean(publishedConfig.showTrustBar);

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-bold text-slate-900">
              Design &amp; Modèles Hero de la boutique
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Choisissez la mise en scène affichée en haut de la page d’accueil et personnalisez ses textes en temps réel.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs text-slate-500 tabular-nums hidden sm:inline">
            {publishedConfig.updatedAt ? `Mis à jour le ${publishedConfig.updatedAt}` : ''}
          </span>
          <button
            type="button"
            onClick={onNavigateStore}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            <span>Voir sur la boutique</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 Hero Presets Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Modèles Hero disponibles ({HERO_THEMES.length})
          </h3>
          {isLoading && <span className="text-xs text-slate-400">Synchronisation...</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {HERO_THEMES.map(theme => {
            const isPublished = publishedConfig.activeHeroId === theme.id;
            const isPreviewed = draftConfig.activeHeroId === theme.id;
            const isSavingThis = savingHeroId === theme.id;

            return (
              <div
                key={theme.id}
                className={`bg-white rounded-xl border overflow-hidden flex flex-col transition-all ${
                  isPublished
                    ? 'border-blue-600 ring-2 ring-blue-600/15'
                    : isPreviewed
                      ? 'border-slate-400'
                      : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Thumbnail */}
                <button
                  type="button"
                  onClick={() => setDraftConfig(prev => ({ ...prev, activeHeroId: theme.id }))}
                  className="relative aspect-[4/3] bg-slate-100 overflow-hidden text-left group"
                >
                  <img
                    src={theme.image}
                    alt={theme.imageAlt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end justify-between p-3">
                    <div className="flex items-center gap-1.5">
                      {theme.swatches.map((hex, i) => (
                        <span
                          key={i}
                          className="w-4 h-4 rounded-full border border-white/70 shadow-xs"
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                    {isPublished && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-bold inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Actif
                      </span>
                    )}
                  </div>
                </button>

                {/* Info & Actions */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-slate-500">{theme.styleLabel}</div>
                    <h4 className="font-bold text-sm text-slate-900">{theme.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{theme.tagline}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setDraftConfig(prev => ({ ...prev, activeHeroId: theme.id }))}
                      className={`px-2.5 py-2 rounded-lg text-xs font-semibold border inline-flex items-center justify-center gap-1 transition-colors whitespace-nowrap ${
                        isPreviewed
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Aperçu</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSaving || isPublished}
                      onClick={() => handleActivateHero(theme.id)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                        isPublished
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                          : 'bg-blue-700 hover:bg-blue-800 text-white disabled:opacity-60'
                      }`}
                    >
                      {isSavingThis ? (
                        <span>Activation...</span>
                      ) : isPublished ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Publié</span>
                        </>
                      ) : (
                        <span>Choisir ce Hero</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Preview Panel */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <LayoutTemplate className="w-4 h-4 text-blue-700" />
            <span>Aperçu en direct</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 font-medium">
              {HERO_THEMES.find(h => h.id === draftConfig.activeHeroId)?.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasUnpublishedChanges ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => persistDesign(draftConfig)}
                className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Publication...' : 'Publier cet aperçu'}</span>
              </button>
            ) : (
              <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Synchronisé avec la boutique
              </span>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-slate-100/70">
          <HeroBanner previewConfig={draftConfig} isPreview />
        </div>
      </div>

      {/* Editorial Overrides & Layout Options */}
      <form onSubmit={handleSaveOverrides} className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Personnalisation des textes &amp; options</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Laissez un champ vide pour conserver automatiquement le texte natif du modèle Hero sélectionné.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetTexts}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Textes par défaut</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <label className="space-y-1.5 block">
            <span className="font-semibold text-slate-700 block">Accroche supérieure (badge)</span>
            <input
              type="text"
              maxLength={90}
              value={draftConfig.customBadge || ''}
              onChange={(e) => setDraftConfig(prev => ({ ...prev, customBadge: e.target.value }))}
              placeholder={HERO_THEMES.find(h => h.id === draftConfig.activeHeroId)?.badge}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="font-semibold text-slate-700 block">Bouton d’action principal (CTA)</span>
            <input
              type="text"
              maxLength={60}
              value={draftConfig.customPrimaryCtaLabel || ''}
              onChange={(e) => setDraftConfig(prev => ({ ...prev, customPrimaryCtaLabel: e.target.value }))}
              placeholder={HERO_THEMES.find(h => h.id === draftConfig.activeHeroId)?.primaryCtaLabel}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </label>

          <label className="space-y-1.5 block md:col-span-2">
            <span className="font-semibold text-slate-700 block">Titre principal personnalisé (H1)</span>
            <input
              type="text"
              maxLength={140}
              value={draftConfig.customTitle || ''}
              onChange={(e) => setDraftConfig(prev => ({ ...prev, customTitle: e.target.value }))}
              placeholder={`${HERO_THEMES.find(h => h.id === draftConfig.activeHeroId)?.titlePrefix} ${HERO_THEMES.find(h => h.id === draftConfig.activeHeroId)?.titleHighlight}`}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </label>

          <label className="space-y-1.5 block md:col-span-2">
            <span className="font-semibold text-slate-700 block">Sous-titre / description</span>
            <textarea
              rows={2}
              maxLength={320}
              value={draftConfig.customSubtitle || ''}
              onChange={(e) => setDraftConfig(prev => ({ ...prev, customSubtitle: e.target.value }))}
              placeholder={HERO_THEMES.find(h => h.id === draftConfig.activeHeroId)?.subtitle}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <label className="inline-flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={draftConfig.showTrustBar !== false}
              onChange={(e) => setDraftConfig(prev => ({ ...prev, showTrustBar: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
            />
            <span>Afficher les 4 engagements de réassurance sous le Hero (Livraison, Paiement, Fidélité, Retours)</span>
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 disabled:opacity-60 whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Enregistrement...' : 'Enregistrer le design'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
