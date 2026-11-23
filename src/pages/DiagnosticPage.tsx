import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, CheckCircle, RotateCcw, ShoppingBag,
  ShieldCheck, UserCheck, MessageCircle, ExternalLink
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { SafetySensitivityProfile } from '../types';
import { buildPersonalizedRoutine, DiagnosticInput } from '../utils/pharmacySafety';

const GOAL_OPTIONS: { id: DiagnosticInput['goal']; label: string; detail: string }[] = [
  { id: 'hydration', label: 'Hydratation & Éclat', detail: 'Peau qui tiraille, teint terne, manque de souplesse' },
  { id: 'anti_age', label: 'Anti-âge & Fermeté', detail: 'Ridules de déshydratation, prévention photovieillissement' },
  { id: 'purity', label: 'Pureté & Imperfections', detail: 'Excès de sébum, pores dilatés, brillances' },
  { id: 'sun', label: 'Haute Protection & Taches', detail: 'Exposition UV, prévention des taches pigmentaires' },
  { id: 'vitality', label: 'Vitalité, Cheveux & Sommeil', detail: 'Fatigue passagère, ongles/cheveux fragilisés, stress' }
];

const SKIN_OPTIONS: { id: DiagnosticInput['skinType']; label: string; detail: string }[] = [
  { id: 'dry', label: 'Sèche à très sèche', detail: 'Tiraillements fréquents, zones de sécheresse' },
  { id: 'combination', label: 'Mixte à grasse', detail: 'Zone T brillante, imperfections occasionnelles' },
  { id: 'sensitive', label: 'Sensible ou réactive', detail: 'Rougeurs, picotements, tolérance délicate' },
  { id: 'normal', label: 'Normale / Équilibrée', detail: 'Confort stable toute la journée' }
];

const SAFETY_OPTIONS: { id: SafetySensitivityProfile; label: string; detail: string }[] = [
  { id: 'standard', label: 'Adulte standard', detail: 'Aucune contre-indication particulière' },
  { id: 'sensitive', label: 'Peau atopique / Allergies', detail: 'Priorité aux formules hypoallergéniques sans paraben' },
  { id: 'pregnancy', label: 'Grossesse ou Allaitement', detail: 'Exclut automatiquement huiles essentielles et actifs déconseillés' },
  { id: 'child', label: 'Bébé ou Enfant', detail: 'Formules pédiatriques ultra-douces uniquement' }
];

const PREF_OPTIONS: { id: DiagnosticInput['preference']; label: string; detail: string }[] = [
  { id: 'all', label: 'Équilibre officinal complet', detail: 'Les actifs les plus efficaces selon votre besoin' },
  { id: 'bio', label: 'Priorité Bio & Naturel', detail: 'Formules certifiées bio ou d’origine végétale' },
  { id: 'expert', label: 'Dermo-cosmétique ciblée', detail: 'Actifs dermatologiques de référence en laboratoire' }
];

export const DiagnosticPage: React.FC = () => {
  const {
    products,
    addToCart,
    setIsCartOpen,
    setSelectedProductForDetail,
    navigate,
    updateUserProfile,
    currentUser,
    setIsChatOpen,
    showToast
  } = useShop();

  const [step, setStep] = useState<number>(1);
  const [input, setInput] = useState<DiagnosticInput>({
    goal: 'hydration',
    skinType: 'sensitive',
    safetyProfile: 'standard',
    preference: 'all'
  });

  const routine = useMemo(() => buildPersonalizedRoutine(products, input), [products, input]);

  const routineTotal = useMemo(
    () => routine.reduce((sum, item) => sum + item.product.price, 0),
    [routine]
  );

  const handleAddEntireRoutine = () => {
    if (routine.length === 0) return;
    routine.forEach(r => addToCart(r.product, 1));
    setIsCartOpen(true);
    showToast(`${routine.length} soin(s) de votre routine ajoutés au panier.`);
  };

  const handleSaveProfile = async () => {
    const skinLabel = SKIN_OPTIONS.find(s => s.id === input.skinType)?.label || 'Sensible';
    const goalLabel = GOAL_OPTIONS.find(g => g.id === input.goal)?.label || 'Hydratation';
    const safetyLabel = SAFETY_OPTIONS.find(s => s.id === input.safetyProfile)?.label || '';
    await updateUserProfile(
      {
        skinType: skinLabel,
        concerns: [goalLabel, ...(input.safetyProfile !== 'standard' ? [safetyLabel] : [])]
      },
      Boolean(currentUser)
    );
    showToast('Profil dermo-officinal enregistré.');
  };

  const selectedGoalLabel = GOAL_OPTIONS.find(g => g.id === input.goal)?.label;
  const selectedSafetyLabel = SAFETY_OPTIONS.find(s => s.id === input.safetyProfile)?.label;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Protocole Officinal Myrlan</span>
            <span aria-hidden="true">·</span>
            <span>Stock en temps réel</span>
            <span aria-hidden="true">·</span>
            <span>Contrôle tolérance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
            Diagnostic Routine Peau &amp; Santé Sur-Mesure
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Répondez à 4 questions cliniques simples pour obtenir une ordonnance dermo-cosmétique adaptée à votre profil et vérifiée selon vos précautions particulières.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/rendez-vous')}
            className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 transition-colors"
          >
            Ou réserver un bilan en officine
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Catalogue</span>
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      {step <= 4 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="text-xs font-semibold text-slate-700 tabular-nums">
              Étape {step} sur 4
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map(n => (
                <button
                  key={n}
                  onClick={() => setStep(n)}
                  className={`h-2 rounded-full transition-all ${
                    n === step ? 'w-10 bg-blue-700' : n < step ? 'w-6 bg-blue-300' : 'w-6 bg-slate-200'
                  }`}
                  aria-label={`Aller à l'étape ${n}`}
                />
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">01. Quel est votre objectif prioritaire ?</h2>
                <p className="text-xs text-slate-500 mt-1">Sélectionnez le besoin principal que vous souhaitez traiter dès maintenant.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {GOAL_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setInput({ ...input, goal: opt.id })}
                    className={`text-left p-4 rounded-xl border transition-colors ${
                      input.goal === opt.id
                        ? 'border-blue-700 bg-blue-50/70'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-sm font-bold text-slate-900">{opt.label}</div>
                    <div className="text-xs text-slate-600 mt-1 leading-relaxed">{opt.detail}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">02. Comment décririez-vous votre peau ?</h2>
                <p className="text-xs text-slate-500 mt-1">Ce critère ajuste le choix des nettoyants et des textures galéniques.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SKIN_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setInput({ ...input, skinType: opt.id })}
                    className={`text-left p-4 rounded-xl border transition-colors ${
                      input.skinType === opt.id
                        ? 'border-blue-700 bg-blue-50/70'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-sm font-bold text-slate-900">{opt.label}</div>
                    <div className="text-xs text-slate-600 mt-1 leading-relaxed">{opt.detail}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">03. Précautions ou profil particulier</h2>
                <p className="text-xs text-slate-500 mt-1">Notre moteur officinal écarte automatiquement les actifs inadaptés à votre situation.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAFETY_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setInput({ ...input, safetyProfile: opt.id })}
                    className={`text-left p-4 rounded-xl border transition-colors ${
                      input.safetyProfile === opt.id
                        ? 'border-blue-700 bg-blue-50/70'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-sm font-bold text-slate-900">{opt.label}</div>
                    <div className="text-xs text-slate-600 mt-1 leading-relaxed">{opt.detail}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">04. Votre préférence de formulation</h2>
                <p className="text-xs text-slate-500 mt-1">Dernière étape avant le calcul de votre routine en stock.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PREF_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setInput({ ...input, preference: opt.id })}
                    className={`text-left p-4 rounded-xl border transition-colors ${
                      input.preference === opt.id
                        ? 'border-blue-700 bg-blue-50/70'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-sm font-bold text-slate-900">{opt.label}</div>
                    <div className="text-xs text-slate-600 mt-1 leading-relaxed">{opt.detail}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep(s => Math.max(1, s - 1))}
              className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Précédent</span>
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(s => Math.min(4, s + 1))}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
              >
                <span>Continuer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Voir ma routine officinale</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results View */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-4 h-4" /> Tolérance vérifiée ({selectedSafetyLabel})
                </span>
                <span aria-hidden="true">·</span>
                <span>Objectif : {selectedGoalLabel}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Votre routine recommandée ({routine.length} étape{routine.length > 1 ? 's' : ''})
              </h2>
              <p className="text-xs text-slate-600">
                Sélection issue de notre stock officinal en temps réel. Total de la routine complète : <strong className="text-slate-900 tabular-nums">{routineTotal.toFixed(2)} €</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Modifier mes réponses</span>
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Enregistrer mon profil</span>
              </button>
              <button
                type="button"
                onClick={handleAddEntireRoutine}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Tout ajouter au panier ({routineTotal.toFixed(2)} €)</span>
              </button>
            </div>
          </div>

          {routine.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500">
              Aucun produit en stock ne correspond actuellement à ces critères. Contactez nos pharmaciens via le tchat pour un conseil personnalisé.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {routine.map(item => (
                <div
                  key={item.product.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[4/3] bg-slate-50 border-b border-slate-100 overflow-hidden">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-blue-800">0{item.stepNumber}. {item.moment}</span>
                        <span className="tabular-nums font-bold text-slate-900">{item.product.price.toFixed(2)} €</span>
                      </div>
                      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                        {item.product.brand} · {item.roleLabel}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{item.product.name}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.rationale}</p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProductForDetail(item.product)}
                      className="px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1"
                    >
                      <span>Fiche INCI</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(item.product, 1);
                        showToast(`${item.product.name} ajouté au panier.`);
                      }}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Ajouter</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pharmacist Follow-up Strip */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-700">
              <strong className="text-slate-900">Un traitement médical en cours ou une allergie spécifique ?</strong> Demandez une validation directe avant de commander.
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <MessageCircle className="w-3.5 h-3.5 text-blue-700" />
                <span>Valider avec un pharmacien</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/rendez-vous')}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
              >
                Prendre RDV dermo-conseil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
