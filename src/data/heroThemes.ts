import { HeroPresetId } from '../types';
import heroNavyImg from '../assets/images/hero_officine_navy_1795474355015.jpg';
import heroBotaniqueImg from '../assets/images/hero_botanique_sauge_1795474354691.jpg';
import heroCliniqueImg from '../assets/images/hero_clinique_ivoire_1795474354231.jpg';
import heroSolaireImg from '../assets/images/hero_solaire_dore_1795474354887.jpg';

export interface HeroThemePreset {
  id: HeroPresetId;
  name: string;
  tagline: string;
  styleLabel: string;
  swatches: [string, string, string];
  image: string;
  imageAlt: string;
  badge: string;
  titlePrefix: string;
  titleHighlight: string;
  subtitle: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  cardKicker: string;
  cardTitle: string;
  cardMeta: string;
  isLightSurface: boolean;
  containerClass: string;
  badgeClass: string;
  highlightClass: string;
  subtitleClass: string;
  primaryBtnClass: string;
  secondaryBtnClass: string;
  tertiaryBtnClass: string;
  frameBorderClass: string;
  scrimClass: string;
  cardKickerClass: string;
  cardMetaClass: string;
  trustDividerClass: string;
  trustIconBoxClass: string;
  trustTitleClass: string;
  trustTextClass: string;
}

export const HERO_THEMES: HeroThemePreset[] = [
  {
    id: 'officine_navy',
    name: 'L’Officine Bleu Royal',
    tagline: 'Bleu nuit profond, accents ambre doré et ambiance apothicaire haut de gamme.',
    styleLabel: 'Éditorial Classique',
    swatches: ['#0f2557', '#0284c7', '#fbbf24'],
    image: heroNavyImg,
    imageAlt: 'Flacons en verre ambré et soins dermo-cosmétiques sur pierre sombre',
    badge: 'Diagnostic beauté & santé par IA',
    titlePrefix: 'Votre santé et votre beauté',
    titleHighlight: 'expertes au quotidien',
    subtitle:
      'Commandez vos produits de parapharmacie de grandes marques au meilleur prix. Stock en temps réel, conseils de pharmaciens diplômés et livraison express sécurisée.',
    primaryCtaLabel: 'Créer ma routine sur-mesure',
    secondaryCtaLabel: 'Prendre RDV en officine',
    cardKicker: 'Garantie Officielle Pharmacie',
    cardTitle: 'Soins d’Excellence & Bien-être',
    cardMeta: 'Livraison offerte dès 49€ · Expédié en 24h',
    isLightSurface: false,
    containerClass: 'bg-gradient-to-br from-blue-950 via-blue-900 to-sky-950 text-white',
    badgeClass: 'text-sky-200',
    highlightClass: 'bg-gradient-to-r from-sky-200 via-blue-100 to-amber-200 bg-clip-text text-transparent',
    subtitleClass: 'text-blue-100/90',
    primaryBtnClass: 'bg-amber-400 hover:bg-amber-300 text-blue-950 shadow-lg shadow-amber-500/20',
    secondaryBtnClass: 'bg-white/15 hover:bg-white/25 text-white border border-white/25',
    tertiaryBtnClass: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
    frameBorderClass: 'bg-blue-900/40 border border-blue-700/60 shadow-2xl',
    scrimClass: 'bg-gradient-to-t from-blue-950/90 via-blue-950/35 to-transparent',
    cardKickerClass: 'text-amber-300',
    cardMetaClass: 'text-blue-200',
    trustDividerClass: 'border-t border-blue-800/80',
    trustIconBoxClass: 'bg-blue-800/80 text-sky-200',
    trustTitleClass: 'text-white',
    trustTextClass: 'text-blue-200/85'
  },
  {
    id: 'botanique_sauge',
    name: 'Apothicaire Botanique',
    tagline: 'Vert sauge profond, travertin minéral et mise en avant des soins naturels et bio.',
    styleLabel: 'Naturel & Phytothérapie',
    swatches: ['#064e3b', '#0f766e', '#d9f99d'],
    image: heroBotaniqueImg,
    imageAlt: 'Sérums botaniques en verre dépoli vert, camomille et eucalyptus sur travertin',
    badge: 'Formules naturelles & phytothérapie',
    titlePrefix: 'La pureté botanique au service',
    titleHighlight: 'de votre équilibre',
    subtitle:
      'Sélection rigoureuse d’actifs végétaux, huiles essentielles chémotypées et soins bio certifiés, contrôlés et conseillés par nos docteurs en pharmacie.',
    primaryCtaLabel: 'Découvrir ma routine naturelle',
    secondaryCtaLabel: 'Prendre RDV en officine',
    cardKicker: 'Herboristerie & Bio Officinal',
    cardTitle: 'Actifs Végétaux & Soins Doux',
    cardMeta: 'Traçabilité complète · Sans ingrédients controversés',
    isLightSurface: false,
    containerClass: 'bg-gradient-to-br from-emerald-950 via-teal-950 to-stone-900 text-stone-50',
    badgeClass: 'text-emerald-200',
    highlightClass: 'bg-gradient-to-r from-emerald-200 via-teal-100 to-lime-200 bg-clip-text text-transparent',
    subtitleClass: 'text-emerald-100/90',
    primaryBtnClass: 'bg-emerald-300 hover:bg-emerald-200 text-emerald-950 shadow-lg shadow-emerald-950/30',
    secondaryBtnClass: 'bg-white/12 hover:bg-white/22 text-white border border-white/25',
    tertiaryBtnClass: 'bg-white/8 hover:bg-white/18 text-emerald-100 border border-emerald-400/25',
    frameBorderClass: 'bg-emerald-900/35 border border-emerald-700/50 shadow-2xl',
    scrimClass: 'bg-gradient-to-t from-emerald-950/90 via-emerald-950/35 to-transparent',
    cardKickerClass: 'text-lime-200',
    cardMetaClass: 'text-emerald-100/90',
    trustDividerClass: 'border-t border-emerald-800/70',
    trustIconBoxClass: 'bg-emerald-900/80 text-emerald-200',
    trustTitleClass: 'text-stone-50',
    trustTextClass: 'text-emerald-200/85'
  },
  {
    id: 'clinique_ivoire',
    name: 'Dermo-Clinique Lumière',
    tagline: 'Fond clair architectural pierre & marbre, typographie contrastée et rigueur dermatologique.',
    styleLabel: 'Minimaliste Clair',
    swatches: ['#f5f5f4', '#0f172a', '#1d4ed8'],
    image: heroCliniqueImg,
    imageAlt: 'Soins dermatologiques haute tolérance sur socle en marbre blanc lumineux',
    badge: 'Haute tolérance & dermo-cosmétique',
    titlePrefix: 'Protocoles cliniques formulés',
    titleHighlight: 'pour les peaux exigeantes',
    subtitle:
      'Acide hyaluronique pur, niacinamide et réparation de la barrière cutanée : identifiez les soins adaptés à votre sensibilité avec nos pharmaciens.',
    primaryCtaLabel: 'Lancer mon bilan cutané',
    secondaryCtaLabel: 'Prendre RDV en officine',
    cardKicker: 'Laboratoires Dermo-Partenaires',
    cardTitle: 'Pureté Clinique & Tolérance',
    cardMeta: 'Testé sous contrôle dermatologique · Stock réel',
    isLightSurface: true,
    containerClass: 'bg-stone-100 text-slate-900 border border-slate-200/90',
    badgeClass: 'text-blue-700',
    highlightClass: 'text-blue-700',
    subtitleClass: 'text-slate-600',
    primaryBtnClass: 'bg-blue-700 hover:bg-blue-800 text-white shadow-sm',
    secondaryBtnClass: 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-300',
    tertiaryBtnClass: 'bg-stone-200/70 hover:bg-stone-200 text-slate-800 border border-slate-300/70',
    frameBorderClass: 'bg-white border border-slate-200 shadow-lg',
    scrimClass: 'bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent',
    cardKickerClass: 'text-sky-200',
    cardMetaClass: 'text-slate-200',
    trustDividerClass: 'border-t border-slate-200',
    trustIconBoxClass: 'bg-white border border-slate-200 text-blue-700',
    trustTitleClass: 'text-slate-900',
    trustTextClass: 'text-slate-600'
  },
  {
    id: 'solaire_dore',
    name: 'Saisons & Éclat Solaire',
    tagline: 'Palette chaleureuse terracotta & or solaire pour les campagnes UV, vitamines et vitalité.',
    styleLabel: 'Campagne Saisonnière',
    swatches: ['#451a03', '#b45309', '#fcd34d'],
    image: heroSolaireImg,
    imageAlt: 'Huiles solaires et élixirs vitamine C sur pierre chaude en bord de mer',
    badge: 'Édition Solaire & Éclat Vitamine C',
    titlePrefix: 'Préservez l’éclat et le capital',
    titleHighlight: 'solaire de votre peau',
    subtitle:
      'Filtres UV haute protection respectueux des océans, soins après-soleil apaisants et complexes antioxydants recommandés par notre équipe officinale.',
    primaryCtaLabel: 'Préparer ma routine éclat',
    secondaryCtaLabel: 'Prendre RDV en officine',
    cardKicker: 'Sélection Côte d’Azur & Éclat',
    cardTitle: 'Protection SPF & Vitamine C',
    cardMeta: 'Formules photostables · Expédition sous 24h',
    isLightSurface: false,
    containerClass: 'bg-gradient-to-br from-stone-900 via-amber-950 to-orange-950 text-amber-50',
    badgeClass: 'text-amber-300',
    highlightClass: 'bg-gradient-to-r from-amber-200 via-yellow-200 to-orange-200 bg-clip-text text-transparent',
    subtitleClass: 'text-amber-100/90',
    primaryBtnClass: 'bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-lg shadow-amber-950/30',
    secondaryBtnClass: 'bg-white/14 hover:bg-white/24 text-white border border-amber-200/25',
    tertiaryBtnClass: 'bg-white/10 hover:bg-white/20 text-amber-100 border border-amber-300/25',
    frameBorderClass: 'bg-amber-950/40 border border-amber-700/50 shadow-2xl',
    scrimClass: 'bg-gradient-to-t from-stone-950/90 via-stone-950/35 to-transparent',
    cardKickerClass: 'text-amber-300',
    cardMetaClass: 'text-amber-100/90',
    trustDividerClass: 'border-t border-amber-800/60',
    trustIconBoxClass: 'bg-amber-900/70 text-amber-200',
    trustTitleClass: 'text-amber-50',
    trustTextClass: 'text-amber-200/85'
  }
];

export function getHeroThemePreset(id?: string): HeroThemePreset {
  return HERO_THEMES.find(h => h.id === id) || HERO_THEMES[0];
}
