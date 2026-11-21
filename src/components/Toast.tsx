import React from 'react';
import { Sparkles, CheckCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const Toast: React.FC = () => {
  const { toastMessage } = useShop();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-blue-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-6 duration-300 border border-blue-700">
      <CheckCircle className="w-5 h-5 text-blue-400 shrink-0" />
      <span className="text-sm font-medium">{toastMessage}</span>
    </div>
  );
};
