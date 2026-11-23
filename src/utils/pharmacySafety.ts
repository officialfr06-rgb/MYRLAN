import {
  CartItem,
  CartSafetyReport,
  Product,
  ProductSafetySummary,
  SafetyFinding,
  SafetySensitivityProfile
} from '../types';

function normalizedIngredientsText(product: Product): string {
  return [
    product.name,
    product.category,
    product.description,
    product.usage,
    ...(product.ingredients || [])
  ]
    .join(' ')
    .toLowerCase();
}

export function analyzeProductSafety(
  product: Product,
  profile: SafetySensitivityProfile = 'standard'
): ProductSafetySummary {
  const text = normalizedIngredientsText(product);
  const findings: SafetyFinding[] = [];

  const hasEssentialOil =
    text.includes('huile essentielle') ||
    text.includes('lavandula') ||
    text.includes('linalool') ||
    text.includes('limonene') ||
    text.includes('geraniol');

  const hasSalicylic =
    text.includes('salicylic') ||
    text.includes('salicylique');

  const hasChemicalUv =
    text.includes('homosalate') ||
    text.includes('avobenzone') ||
    text.includes('octisalate');

  const hasSulfate =
    text.includes('sodium laureth sulfate') ||
    text.includes('sodium lauryl sulfate');

  const isSupplement = product.category === 'Compléments Alimentaires';
  const isBabyProduct = product.category === 'Bébé & Maman';

  let pregnancyStatus: 'compatible' | 'caution' = 'compatible';
  let pregnancyNote = 'Formule adaptée selon l’usage cosmétique ou officinal courant.';

  if (hasEssentialOil) {
    pregnancyStatus = 'caution';
    pregnancyNote =
      'Contient des huiles essentielles ou terpènes aromatiques : déconseillé au 1er trimestre et pendant l’allaitement sans avis médical.';
  } else if (isSupplement) {
    pregnancyStatus = 'caution';
    pregnancyNote =
      'Complément alimentaire : demander conseil à votre pharmacien avant cure en cas de grossesse ou d’allaitement.';
  } else if (hasSalicylic) {
    pregnancyStatus = 'caution';
    pregnancyNote =
      'Contient de l’acide salicylique : usage ponctuel local uniquement, demandez l’avis du pharmacien si grossesse.';
  }

  const minimumAgeLabel = isBabyProduct
    ? 'Dès la naissance'
    : hasEssentialOil || isSupplement
      ? '12 ans et + (sauf avis médical)'
      : hasSalicylic
        ? '12 ans et +'
        : '3 ans et +';

  let sensitiveSkinNote = 'Bonne tolérance cutanée observée.';
  if (product.tags.includes('Hypoallergénique')) {
    sensitiveSkinNote = 'Formule hypoallergénique adaptée aux peaux réactives.';
  } else if (hasEssentialOil) {
    sensitiveSkinNote = 'Présence de composants aromatiques naturels : test au pli du coude conseillé sur peau réactive.';
  } else if (hasSulfate) {
    sensitiveSkinNote = 'Contient un tensioactif moussant classique : bien rincer sur peau très atopique.';
  } else if (hasSalicylic) {
    sensitiveSkinNote = 'Actif purifiant kératolytique : espacer les applications en cas de tiraillements.';
  }

  // Profile-specific warnings
  if (profile === 'pregnancy' && pregnancyStatus === 'caution') {
    findings.push({
      id: `preg-${product.id}`,
      severity: 'warning',
      title: 'Précaution Grossesse / Allaitement',
      detail: `${product.name} : ${pregnancyNote}`,
      productIds: [product.id]
    });
  }

  if (profile === 'child' && !isBabyProduct && (hasEssentialOil || isSupplement || hasSalicylic)) {
    findings.push({
      id: `child-${product.id}`,
      severity: 'warning',
      title: 'Âge minimum recommandé',
      detail: `${product.name} est réservé aux personnes de ${minimumAgeLabel}.`,
      productIds: [product.id]
    });
  }

  if (profile === 'sensitive' && (hasEssentialOil || hasSulfate || hasChemicalUv)) {
    findings.push({
      id: `sens-${product.id}`,
      severity: 'info',
      title: 'Vigilance peau très réactive',
      detail: `${product.name} : ${sensitiveSkinNote}`,
      productIds: [product.id]
    });
  }

  const keyActives = (product.ingredients || []).slice(0, 4);

  return {
    pregnancyStatus,
    pregnancyNote,
    minimumAgeLabel,
    sensitiveSkinNote,
    keyActives,
    findings
  };
}

export function analyzeCartCompatibility(
  items: CartItem[],
  profile: SafetySensitivityProfile
): CartSafetyReport {
  const findings: SafetyFinding[] = [];
  const timingTips: string[] = [];

  if (items.length === 0) {
    return { profile, findings, timingTips, checkedCount: 0 };
  }

  // 1. Per-product sensitivity / pregnancy / child checks
  for (const item of items) {
    const summary = analyzeProductSafety(item.product, profile);
    for (const f of summary.findings) {
      findings.push(f);
    }
  }

  // 2. Active ingredient overlap detection across items in cart
  const zincItems = items.filter(i => normalizedIngredientsText(i.product).includes('zinc'));
  if (zincItems.length > 1) {
    findings.push({
      id: 'overlap-zinc',
      severity: 'warning',
      title: 'Doublon d’actif détecté : Zinc',
      detail: `${zincItems.map(i => i.product.name).join(' + ')} contiennent tous du Zinc. Vérifiez l’apport journalier cumulé avec un pharmacien.`,
      productIds: zincItems.map(i => i.product.id)
    });
  }

  const vitB6Items = items.filter(i => {
    const t = normalizedIngredientsText(i.product);
    return t.includes('vitamine b6') || t.includes('biotine');
  });
  if (vitB6Items.length > 1) {
    findings.push({
      id: 'overlap-vitb',
      severity: 'info',
      title: 'Cumul vitamines du groupe B',
      detail: `Plusieurs compléments du panier apportent des vitamines B (${vitB6Items.map(i => i.product.name).join(', ')}).`,
      productIds: vitB6Items.map(i => i.product.id)
    });
  }

  const hyaluronicItems = items.filter(i => {
    const t = normalizedIngredientsText(i.product);
    return t.includes('hyaluronique') || t.includes('hyaluronate');
  });
  if (hyaluronicItems.length > 1) {
    findings.push({
      id: 'overlap-ha',
      severity: 'info',
      title: 'Redondance Acide Hyaluronique',
      detail: `${hyaluronicItems.length} produits de votre panier contiennent de l’acide hyaluronique : un seul sérum suffit généralement par routine.`,
      productIds: hyaluronicItems.map(i => i.product.id)
    });
  }

  const salicylicItems = items.filter(i => normalizedIngredientsText(i.product).includes('salicylic'));
  const hasSpf = items.some(i => normalizedIngredientsText(i.product).includes('spf') || i.product.category === 'Solaire');
  if (salicylicItems.length > 0 && !hasSpf) {
    timingTips.push(
      'Vous utilisez un soin purifiant à l’acide salicylique : appliquez une protection SPF 50+ le matin en cas d’exposition.'
    );
  }

  const hasSupplements = items.some(i => i.product.category === 'Compléments Alimentaires');
  if (hasSupplements) {
    timingTips.push(
      'Compléments alimentaires : privilégiez la prise le matin au cours d’un repas et espacez de 2h avec le thé ou le café.'
    );
  }

  if (items.some(i => i.product.category === 'Soin Visage') && hasSpf) {
    timingTips.push(
      'Ordre d’application conseillé le matin : Nettoyant doux → Sérum hydratant → Protection Solaire SPF 50+ en dernière étape.'
    );
  }

  return {
    profile,
    findings,
    timingTips,
    checkedCount: items.reduce((sum, i) => sum + i.quantity, 0)
  };
}

export interface DiagnosticInput {
  goal: 'hydration' | 'anti_age' | 'purity' | 'sun' | 'vitality';
  skinType: 'dry' | 'combination' | 'sensitive' | 'normal';
  safetyProfile: SafetySensitivityProfile;
  preference: 'all' | 'bio' | 'expert';
}

export interface RoutineStepResult {
  stepNumber: number;
  moment: 'Matin & Soir' | 'Matin' | 'Soir' | 'Cure Quotidienne';
  roleLabel: string;
  product: Product;
  rationale: string;
}

export function buildPersonalizedRoutine(
  catalog: Product[],
  input: DiagnosticInput
): RoutineStepResult[] {
  const inStock = catalog.filter(p => p.stock > 0);
  if (inStock.length === 0) return [];

  // Filter out products with warnings for pregnancy or child profiles when alternatives exist
  const safePool = inStock.filter(p => {
    const safety = analyzeProductSafety(p, input.safetyProfile);
    return !safety.findings.some(f => f.severity === 'warning');
  });
  const pool = safePool.length >= 2 ? safePool : inStock;

  const scoreProduct = (p: Product, targetKeywords: string[], preferredCategories: string[]) => {
    const text = normalizedIngredientsText(p);
    let score = 0;
    if (preferredCategories.includes(p.category)) score += 6;
    for (const kw of targetKeywords) {
      if (text.includes(kw)) score += 4;
    }
    if (input.preference === 'bio' && p.tags.includes('Bio')) score += 5;
    if (input.safetyProfile === 'sensitive' && p.tags.includes('Hypoallergénique')) score += 5;
    if (input.skinType === 'sensitive' && p.tags.includes('Sans Paraben')) score += 2;
    score += p.rating;
    return score;
  };

  const pickBest = (
    keywords: string[],
    categories: string[],
    usedIds: Set<string>
  ): Product | undefined => {
    const candidates = pool.filter(p => !usedIds.has(p.id));
    if (candidates.length === 0) return undefined;
    return [...candidates].sort(
      (a, b) => scoreProduct(b, keywords, categories) - scoreProduct(a, keywords, categories)
    )[0];
  };

  const used = new Set<string>();
  const steps: RoutineStepResult[] = [];

  if (input.goal === 'vitality') {
    const p1 = pickBest(['kératine', 'magnésium', 'vitamine', 'zinc'], ['Compléments Alimentaires'], used);
    if (p1) {
      used.add(p1.id);
      steps.push({
        stepNumber: 1,
        moment: 'Cure Quotidienne',
        roleLabel: 'Cure ciblée vitalité & phanères',
        product: p1,
        rationale: 'Apport quotidien dosé en officine pour soutenir votre énergie ou fortifier cheveux et ongles.'
      });
    }
    const p2 = pickBest(['lavande', 'argan', 'eau de mer', 'doux'], ['Bio & Naturel', 'Hygiène & Santé', 'Corps & Cheveux'], used);
    if (p2) {
      used.add(p2.id);
      steps.push({
        stepNumber: 2,
        moment: 'Soir',
        roleLabel: 'Soin complémentaire bien-être',
        product: p2,
        rationale: 'Complète votre cure interne par un rituel apaisant ou protecteur au quotidien.'
      });
    }
    const p3 = pickBest(['hyaluronique', 'calendula', 'surgras', 'apaisant'], ['Soin Visage', 'Corps & Cheveux', 'Bébé & Maman'], used);
    if (p3) {
      used.add(p3.id);
      steps.push({
        stepNumber: 3,
        moment: 'Matin & Soir',
        roleLabel: 'Confort cutané global',
        product: p3,
        rationale: 'Maintient la souplesse et l’hydratation de la barrière cutanée pendant la cure.'
      });
    }
    return steps;
  }

  // Skincare & Sun routines
  // Step 1: Gentle Cleanse
  const cleanserKeywords =
    input.goal === 'purity' && input.skinType === 'combination'
      ? ['purifiant', 'salicylic', 'gel nettoyant']
      : ['micellaire', 'surgras', 'doux', 'apaisant'];
  const step1 = pickBest(cleanserKeywords, ['Hygiène & Santé', 'Soin Visage', 'Corps & Cheveux'], used);
  if (step1) {
    used.add(step1.id);
    steps.push({
      stepNumber: 1,
      moment: 'Matin & Soir',
      roleLabel: 'Nettoyer sans décaper',
      product: step1,
      rationale:
        input.skinType === 'sensitive'
          ? 'Respecte le pH physiologique et calme les rougeurs dès le nettoyage.'
          : 'Élimine les impuretés tout en préservant le film hydrolipidique.'
    });
  }

  // Step 2: Targeted Treatment
  const treatKeywords =
    input.goal === 'anti_age' || input.goal === 'hydration'
      ? ['hyaluronique', 'sérum', 'booster', 'niacinamide']
      : input.goal === 'purity'
        ? ['salicylic', 'zinc', 'hyaluronique']
        : ['argan', 'nourrissante', 'calendula', 'hyaluronique'];
  const step2 = pickBest(treatKeywords, ['Soin Visage', 'Bio & Naturel', 'Bébé & Maman'], used);
  if (step2) {
    used.add(step2.id);
    steps.push({
      stepNumber: 2,
      moment: 'Matin & Soir',
      roleLabel: 'Actif ciblé & réparation',
      product: step2,
      rationale:
        input.goal === 'anti_age'
          ? 'Repulpe les ridules de déshydratation et renforce l’élasticité cutanée.'
          : 'Concentré d’actifs dermatologiques adapté à votre profil de peau.'
    });
  }

  // Step 3: Protection / Nourish
  const protectKeywords =
    input.goal === 'sun' || input.goal === 'anti_age' || input.goal === 'purity'
      ? ['spf', 'solaire', 'taches', 'invisible']
      : ['huile sèche', 'lait', 'spf', 'nourrissante'];
  const step3 = pickBest(protectKeywords, ['Solaire', 'Bio & Naturel', 'Bébé & Maman'], used);
  if (step3) {
    used.add(step3.id);
    steps.push({
      stepNumber: 3,
      moment: 'Matin',
      roleLabel: step3.category === 'Solaire' ? 'Haute protection UV quotidienne' : 'Sceller l’hydratation',
      product: step3,
      rationale:
        step3.category === 'Solaire'
          ? 'Bouclier SPF 50+ indispensable contre le photovieillissement et les marques pigmentaires.'
          : 'Nourrit durablement l’épiderme et protège des agressions extérieures.'
    });
  }

  return steps;
}
