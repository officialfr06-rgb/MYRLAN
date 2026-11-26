import React from 'react';
import {
  ShieldCheck, Award, HeartHandshake, Microscope, ArrowLeft,
  CheckCircle, Stethoscope, FileText
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const AboutPage: React.FC = () => {
  const { navigate } = useShop();

  const team = [
    {
      name: 'Dr. Claire Moreau',
      role: 'Pharmacienne Titulaire',
      rpps: 'RPPS 10005234981',
      specialty: 'Dermo-cosmétique & formulation active'
    },
    {
      name: 'Dr. Thomas Girard',
      role: 'Pharmacien Adjoint',
      rpps: 'RPPS 10104829104',
      specialty: 'Micronutrition, phytothérapie & sport'
    },
    {
      name: 'Sophie Laurent',
      role: 'Préparatrice en Pharmacie',
      rpps: 'Brevet Professionnel Officinal',
      specialty: 'Soins bébé, maternité & conseil quotidien'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-10">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à la boutique
      </button>

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-900 via-sky-900 to-blue-950 text-white rounded-3xl p-8 sm:p-12 space-y-4 shadow-xl">
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-sky-200 text-xs font-bold rounded-full">
          <ShieldCheck className="w-4 h-4 text-amber-300" /> Officine Française Agréée ARS &amp; CNOP
        </span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          À propos de la Parapharmacie Myrlan
        </h1>
        <p className="text-blue-100 text-sm sm:text-base max-w-2xl leading-relaxed">
          Adossée à notre officine historique au cœur de Draguignan, Myrlan réunit l’exigence scientifique de pharmaciens diplômés et la praticité d’une parapharmacie en ligne transparente et sécurisée.
        </p>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="font-black text-gray-900 text-base">100% Laboratoires Officiels</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Tous nos soins, compléments et dispositifs sont approvisionnés directement auprès des laboratoires agréés, avec traçabilité complète des lots et codes EAN.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Microscope className="w-6 h-6" />
          </div>
          <h2 className="font-black text-gray-900 text-base">Conservation Contrôlée</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Nos réserves sont maintenues sous contrôle thermique permanent (15°C – 22°C) afin de préserver l’efficacité des actifs fragiles comme la vitamine C ou les probiotiques.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h2 className="font-black text-gray-900 text-base">Conseil Humain &amp; Personnalisé</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Chaque commande et chaque message bénéficie du regard de notre équipe officinale, joignable en ligne comme au comptoir Click &amp; Collect.
          </p>
        </div>
      </div>

      {/* Team */}
      <div className="bg-white rounded-3xl border border-gray-200 p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Équipe Officinale</span>
            <h2 className="text-2xl font-black text-gray-900 mt-1">Vos Pharmaciens &amp; Préparateurs</h2>
          </div>
          <button
            onClick={() => navigate('/contact')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
          >
            Contacter l’officine
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {team.map(member => (
            <div key={member.name} className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="w-11 h-11 rounded-xl bg-blue-900 text-white font-black flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-sky-300" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">{member.name}</h3>
              <div className="text-xs font-semibold text-blue-700">{member.role}</div>
              <div className="text-[11px] font-mono text-gray-500">{member.rpps}</div>
              <p className="text-xs text-gray-600 pt-1">{member.specialty}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick CTAs */}
      <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-blue-600 shrink-0" />
          <div className="text-xs text-blue-950">
            <strong>Besoin de déposer une ordonnance ?</strong> Utilisez notre service dédié pour un retrait express en pharmacie.
          </div>
        </div>
        <button
          onClick={() => navigate('/ordonnance')}
          className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shrink-0"
        >
          <FileText className="w-4 h-4" /> Envoyer une ordonnance
        </button>
      </div>
    </div>
  );
};
