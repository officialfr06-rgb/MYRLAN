import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const LegalModal: React.FC = () => {
  const { isLegalOpen, setIsLegalOpen } = useShop();

  if (!isLegalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-900 to-sky-900 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-300" />
            <h2 className="font-bold text-lg">Mentions Légales &amp; Confidentialité</h2>
          </div>
          <button 
            onClick={() => setIsLegalOpen(false)}
            className="p-2 text-blue-200 hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto text-xs text-gray-700 leading-relaxed">
          <section className="space-y-2">
            <h3 className="font-bold text-sm text-gray-900">1. Éditeur du site</h3>
            <p>Le site Myrlane est édité par la société Myrlane Pharma S.A. au capital de 50 000 €, immatriculée au RCS de Lyon sous le numéro 984 231 092. Siège social : 15 rue de la République, 69002 Lyon, France.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-gray-900">2. Directeur de la publication</h3>
            <p>Docteur Claire Moreau, Docteur en Pharmacie (RPPS : 10005234981).</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-gray-900">3. Protection des données personnelles (RGPD)</h3>
            <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification et de suppression des données vous concernant. Les informations recueillies sont strictement utilisées pour le traitement de vos commandes et le suivi de votre compte fidélité.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-gray-900">4. Propriété intellectuelle</h3>
            <p>L'ensemble des éléments graphiques, photographies, textes et bases de données présents sur le site Myrlane sont protégés par le code de la propriété intellectuelle.</p>
          </section>
        </div>

      </div>
    </div>
  );
};
