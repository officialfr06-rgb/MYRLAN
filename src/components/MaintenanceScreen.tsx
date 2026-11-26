import React from 'react';
import { Wrench, ShieldCheck, Lock } from 'lucide-react';
import { useShop } from '../context/ShopContext';

interface MaintenanceScreenProps {
  message?: string;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ message }) => {
  const { navigate } = useShop();

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-lg w-full p-8 sm:p-10 text-center space-y-6 shadow-2xl border border-blue-100">
        <div className="w-16 h-16 rounded-2xl bg-blue-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30 animate-pulse">
          <Wrench className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold uppercase tracking-wider border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Myrlan Parapharmacie
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Maintenance en cours
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed pt-1">
            {message || 'Notre officine fait peau neuve pour mieux vous servir. Nous serons de retour très prochainement.'}
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-1">
          <div className="font-semibold text-slate-700">15 rue de la République, 69002 Lyon</div>
          <div>Service client &amp; Commandes temporairement suspendus pour mise à jour.</div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              navigate('/admin');
            }}
            className="w-full sm:w-auto px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl inline-flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <Lock className="w-4 h-4" /> Accès Administrateur
          </button>
        </div>
      </div>
    </div>
  );
};
