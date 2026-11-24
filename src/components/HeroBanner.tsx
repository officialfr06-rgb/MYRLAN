import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Truck, RefreshCw, Award, ArrowRight, Calendar } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { DesignConfig } from '../types';
import { getHeroThemePreset } from '../data/heroThemes';

interface HeroBannerProps {
  previewConfig?: DesignConfig;
  isPreview?: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ previewConfig, isPreview = false }) => {
  const { navigate, designConfig } = useShop();
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});

  const activeConfig = previewConfig || designConfig;
  const preset = getHeroThemePreset(activeConfig.activeHeroId);

  const badgeText = activeConfig.customBadge?.trim() || preset.badge;
  const customTitle = activeConfig.customTitle?.trim();
  const subtitleText = activeConfig.customSubtitle?.trim() || preset.subtitle;
  const primaryCtaText = activeConfig.customPrimaryCtaLabel?.trim() || preset.primaryCtaLabel;
  const showTrustBar = activeConfig.showTrustBar !== false;

  const isImgBroken = Boolean(imgFailed[preset.id]);

  return (
    <section
      aria-label="Présentation principale"
      className={`${preset.containerClass} relative overflow-hidden rounded-2xl sm:rounded-3xl transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-12 lg:py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Copy Column */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left min-w-0">
            <div className={`inline-flex items-center gap-2 text-xs font-semibold tracking-wide ${preset.badgeClass}`}>
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{badgeText}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight leading-[1.08] [text-wrap:balance]">
              {customTitle ? (
                <span>{customTitle}</span>
              ) : (
                <>
                  {preset.titlePrefix}{' '}
                  <span className={preset.highlightClass}>{preset.titleHighlight}</span>
                </>
              )}
            </h1>

            <p className={`text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed ${preset.subtitleClass}`}>
              {subtitleText}
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!isPreview) navigate('/diagnostic');
                }}
                className={`px-5 py-3 font-bold text-sm rounded-xl transition-transform duration-150 hover:-translate-y-0.5 inline-flex items-center gap-2 whitespace-nowrap shrink-0 ${preset.primaryBtnClass}`}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{primaryCtaText}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isPreview) navigate('/rendez-vous');
                }}
                className={`px-4 py-3 font-semibold text-sm rounded-xl transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 ${preset.secondaryBtnClass}`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span>{preset.secondaryCtaLabel}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isPreview) return;
                  const catalogElem = document.getElementById('catalog-section');
                  catalogElem?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-4 py-3 font-semibold text-sm rounded-xl transition-colors whitespace-nowrap shrink-0 ${preset.tertiaryBtnClass}`}
              >
                Explorer le catalogue
              </button>
            </div>
          </div>

          {/* Showcase Media Column */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md">
              <div className={`rounded-3xl overflow-hidden ${preset.frameBorderClass}`}>
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-800/30">
                  {isImgBroken ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                      <ShieldCheck className="w-10 h-10 mb-2 opacity-80" />
                      <span className="text-sm font-bold">{preset.cardTitle}</span>
                      <span className="text-xs opacity-75 mt-1">{preset.cardKicker}</span>
                    </div>
                  ) : (
                    <img
                      src={preset.image}
                      alt={preset.imageAlt}
                      referrerPolicy="no-referrer"
                      onError={() => setImgFailed(prev => ({ ...prev, [preset.id]: true }))}
                      className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                    />
                  )}
                  <div className={`absolute inset-0 ${preset.scrimClass} flex flex-col justify-end p-5 sm:p-6 space-y-1.5`}>
                    <div className={`text-xs font-bold tracking-wide ${preset.cardKickerClass}`}>
                      {preset.cardKicker}
                    </div>
                    <h2 className="text-xl font-black text-white tracking-tight">
                      {preset.cardTitle}
                    </h2>
                    <p className={`text-xs ${preset.cardMetaClass}`}>
                      {preset.cardMeta}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges Strip */}
        {showTrustBar && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mt-10 sm:mt-14 pt-8 sm:pt-10 ${preset.trustDividerClass}`}>
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${preset.trustIconBoxClass}`}>
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-bold text-sm ${preset.trustTitleClass}`}>Livraison Express</h3>
                <p className={`text-xs ${preset.trustTextClass}`}>Expédié en 24h ouvrées</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${preset.trustIconBoxClass}`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-bold text-sm ${preset.trustTitleClass}`}>Paiement Sécurisé</h3>
                <p className={`text-xs ${preset.trustTextClass}`}>CB, PayPal, Apple Pay, Mobile</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${preset.trustIconBoxClass}`}>
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-bold text-sm ${preset.trustTitleClass}`}>Club Fidélité</h3>
                <p className={`text-xs ${preset.trustTextClass}`}>Gagnez des points à chaque achat</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${preset.trustIconBoxClass}`}>
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-bold text-sm ${preset.trustTitleClass}`}>Retours Gratuits</h3>
                <p className={`text-xs ${preset.trustTextClass}`}>Sous 14 jours garantis</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
