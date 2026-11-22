import React, { useState } from 'react';
import {
  ArrowLeft, ShieldCheck, Truck, FileCheck, Cookie, Scale, CheckCircle
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

type LegalRoute = '/cgv' | '/livraison-retours' | '/confidentialite' | '/mentions-legales';

export const LegalPages: React.FC<{ route: LegalRoute }> = ({ route }) => {
  const { navigate, showToast } = useShop();

  const [cookieConsent, setCookieConsent] = useState<{ analytics: boolean; personalization: boolean }>(() => {
    const saved = localStorage.getItem('myrlan_cookies_prefs');
    return saved ? JSON.parse(saved) : { analytics: true, personalization: false };
  });

  const saveCookies = () => {
    localStorage.setItem('myrlan_cookies_prefs', JSON.stringify(cookieConsent));
    showToast('Vos préférences de confidentialité et cookies ont été enregistrées.');
  };

  const tabs: { path: LegalRoute; label: string }[] = [
    { path: '/cgv', label: 'Conditions Générales (CGV)' },
    { path: '/livraison-retours', label: 'Livraison & Retours' },
    { path: '/confidentialite', label: 'Confidentialité & Cookies' },
    { path: '/mentions-legales', label: 'Mentions Légales' }
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à la boutique
      </button>

      {/* Navigation between the 4 legal pages */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button
            key={t.path}
            onClick={() => navigate(t.path)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              route === t.path
                ? 'bg-blue-900 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {route === '/cgv' && (
        <article className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 space-y-6 text-sm text-gray-700 leading-relaxed">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Conditions Générales de Vente (CGV)</h1>
              <p className="text-xs text-gray-500">En vigueur au 1er novembre 2026 • Myrlan Pharma S.A.</p>
            </div>
          </div>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-gray-900">1. Objet et champ d’application</h2>
            <p>Les présentes Conditions Générales de Vente régissent l’ensemble des ventes de produits de parapharmacie, dermo-cosmétique, compléments alimentaires et dispositifs médicaux conclues sur le site Myrlan entre la société Myrlan Pharma S.A. et tout client consommateur ou professionnel.</p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-gray-900">2. Prix, TVA et disponibilité</h2>
            <p>Les prix affichés sont indiqués en euros (€) toutes taxes comprises (TTC), hors frais de livraison. Les taux de TVA appliqués respectent la législation française en vigueur (20%, 10% ou 5,5% selon la catégorie réglementaire). Les stocks sont mis à jour en temps réel depuis notre officine.</p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-gray-900">3. Commande &amp; Paiement sécurisé</h2>
            <p>Le client valide sa commande après vérification du panier, choix du mode de livraison ou Click &amp; Collect, et acceptation des présentes CGV. Le règlement par carte bancaire est entièrement chiffré. Le paiement au comptoir est possible exclusivement pour le mode Click &amp; Collect.</p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-gray-900">4. Droit de rétractation &amp; Garanties légales</h2>
            <p>Conformément à l’article L.221-18 du Code de la consommation, vous disposez d’un délai de 14 jours à compter de la réception de votre colis pour exercer votre droit de rétractation sur les produits non ouverts, non descellés et dans leur emballage d’origine (pour des raisons d’hygiène et de protection de la santé, les produits descellés ne peuvent être repris).</p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-gray-900">5. Médiation de la consommation</h2>
            <p>En cas de litige non résolu avec notre service client, le consommateur peut saisir gratuitement le médiateur de la consommation compétent conformément aux articles L.612-1 et suivants du Code de la consommation.</p>
          </section>
        </article>
      )}

      {route === '/livraison-retours' && (
        <article className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 space-y-6 text-sm text-gray-700 leading-relaxed">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Livraison, Délais &amp; Politique de Retours</h1>
              <p className="text-xs text-gray-500">Expédition depuis Lyon sous 24h ouvrées</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-gray-200 rounded-2xl overflow-hidden tabular-nums">
              <thead className="bg-gray-50 text-gray-600 uppercase font-bold">
                <tr>
                  <th className="p-3.5">Mode de remise</th>
                  <th className="p-3.5">Délai indicatif</th>
                  <th className="p-3.5">Tarif &lt; 49 €</th>
                  <th className="p-3.5">Tarif &ge; 49 €</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="p-3.5 font-bold text-gray-900">Click &amp; Collect Officine (Lyon)</td>
                  <td className="p-3.5">Prêt sous 2h ouvrées</td>
                  <td className="p-3.5 text-blue-700 font-bold">Gratuit</td>
                  <td className="p-3.5 text-blue-700 font-bold">Gratuit</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-gray-900">Mondial Relay Point Relais</td>
                  <td className="p-3.5">3 à 4 jours ouvrés</td>
                  <td className="p-3.5">3,90 €</td>
                  <td className="p-3.5 text-blue-700 font-bold">Gratuit</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-gray-900">Colissimo Domicile Suivi</td>
                  <td className="p-3.5">48h à 72h ouvrées</td>
                  <td className="p-3.5">4,90 €</td>
                  <td className="p-3.5 text-blue-700 font-bold">Gratuit</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-gray-900">Chronopost Express 24h</td>
                  <td className="p-3.5">Lendemain avant 13h</td>
                  <td className="p-3.5">9,90 €</td>
                  <td className="p-3.5">9,90 €</td>
                </tr>
              </tbody>
            </table>
          </div>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-gray-900">Comment effectuer un retour ou signaler un colis endommagé ?</h2>
            <p>Connectez-vous à votre espace <button onClick={() => navigate('/commandes')} className="text-blue-700 font-bold underline">Mes Commandes</button> et cliquez sur « Demander un retour / SAV » sur la commande concernée dans un délai de 14 jours. Après validation par notre équipe, vous recevez une étiquette de retour prépayée.</p>
          </section>
        </article>
      )}

      {route === '/confidentialite' && (
        <article className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 space-y-6 text-sm text-gray-700 leading-relaxed">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Cookie className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Politique de Confidentialité (RGPD) &amp; Cookies</h1>
              <p className="text-xs text-gray-500">Protection des données de santé et préférences personnelles</p>
            </div>
          </div>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-gray-900">1. Collecte et finalité des données</h2>
            <p>Les informations collectées lors de la création de compte, du passage de commande ou du dépôt d’ordonnance sont traitées exclusivement par Myrlan Pharma S.A. pour l’exécution de vos commandes, la délivrance pharmaceutique et la gestion de votre programme de fidélité.</p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-gray-900">2. Vos droits RGPD</h2>
            <p>Conformément au Règlement (UE) 2016/679 (RGPD), vous disposez d’un droit d’accès, de rectification, de portabilité et d’effacement de vos données en écrivant à <span className="font-mono text-blue-800">dpo@myrlan.fr</span>.</p>
          </section>

          <section className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" /> Centre de gestion des Cookies
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                <div>
                  <div className="font-bold text-gray-900">Cookies strictement nécessaires</div>
                  <div className="text-gray-500">Authentification sécurisée, panier et session</div>
                </div>
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold rounded-full">Toujours actif</span>
              </div>

              <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 cursor-pointer">
                <div>
                  <div className="font-bold text-gray-900">Mesure d’audience anonyme</div>
                  <div className="text-gray-500">Amélioration de la performance du catalogue</div>
                </div>
                <input
                  type="checkbox"
                  checked={cookieConsent.analytics}
                  onChange={(e) => setCookieConsent(prev => ({ ...prev, analytics: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 cursor-pointer">
                <div>
                  <div className="font-bold text-gray-900">Personnalisation dermo-cosmétique</div>
                  <div className="text-gray-500">Mémorisation de votre profil peau et routines</div>
                </div>
                <input
                  type="checkbox"
                  checked={cookieConsent.personalization}
                  onChange={(e) => setCookieConsent(prev => ({ ...prev, personalization: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
            </div>

            <button
              onClick={saveCookies}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Enregistrer mes choix
            </button>
          </section>
        </article>
      )}

      {route === '/mentions-legales' && (
        <article className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 space-y-6 text-sm text-gray-700 leading-relaxed">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Mentions Légales &amp; Agréments Officinaux</h1>
              <p className="text-xs text-gray-500">Informations réglementaires françaises et européennes</p>
            </div>
          </div>

          <section className="space-y-1.5">
            <h2 className="font-bold text-base text-gray-900">Éditeur &amp; Officine titulaire</h2>
            <p>Myrlan Pharma S.A. — Capital social : 50 000 € — RCS Lyon 984 231 092 — TVA intracommunautaire : FR32984231092.</p>
            <p>Siège social et officine : 15 rue de la République, 69002 Lyon, France. Téléphone : 04 78 00 42 18.</p>
          </section>

          <section className="space-y-1.5">
            <h2 className="font-bold text-base text-gray-900">Pharmacien titulaire &amp; Directeur de publication</h2>
            <p>Docteur Claire Moreau, Docteur en Pharmacie diplômée de la Faculté de Pharmacie de Lyon — Numéro RPPS : 10005234981.</p>
          </section>

          <section className="space-y-1.5">
            <h2 className="font-bold text-base text-gray-900">Autorités de tutelle</h2>
            <p>Officine inscrite au Tableau de la Section A de l’Ordre National des Pharmaciens (CNOP) et autorisée par l’Agence Régionale de Santé (ARS) Auvergne-Rhône-Alpes.</p>
          </section>

          <section className="space-y-1.5">
            <h2 className="font-bold text-base text-gray-900">Propriété intellectuelle</h2>
            <p>Tous les contenus, visuels, fiches techniques et marques affichés sur Myrlan demeurent la propriété exclusive de Myrlan Pharma S.A. ou de leurs laboratoires partenaires respectifs.</p>
          </section>
        </article>
      )}
    </div>
  );
};
