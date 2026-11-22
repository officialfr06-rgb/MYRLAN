import React from 'react';
import { X, Package, Printer, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const OrderTrackingModal: React.FC = () => {
  const { myOrders, isOrderTrackingOpen, setIsOrderTrackingOpen, navigate } = useShop();

  if (!isOrderTrackingOpen) return null;

  const statuses = ['En préparation', 'Expédié', 'En cours de livraison', 'Livré'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-900 text-white">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-300" />
            <h2 className="font-bold text-lg">Mes Commandes &amp; Suivi Colis</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsOrderTrackingOpen(false);
                navigate('/commandes');
              }}
              className="px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1"
            >
              <span>Vue complète</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsOrderTrackingOpen(false)}
              className="p-2 text-blue-200 hover:text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {myOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              Aucune commande enregistrée sur votre compte pour le moment.
            </div>
          ) : (
            myOrders.map(order => {
              const currentStatusIndex = statuses.indexOf(order.status);
              return (
                <div key={order.id} className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-200 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-gray-900">{order.id}</span>
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Commandé le {order.date} • Suivi : <strong className="font-mono text-gray-800">{order.trackingNumber}</strong></div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-blue-800 tabular-nums">{order.totalAmount.toFixed(2)} €</div>
                      <div className="text-xs text-gray-500">{order.items.length} article(s)</div>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    {statuses.map((st, idx) => {
                      const isPassed = idx <= currentStatusIndex;
                      return (
                        <div key={st} className={`p-3 rounded-xl border text-center ${isPassed ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-white border-gray-200 text-gray-400'}`}>
                          <div className="text-xs font-bold">{st}</div>
                          <div className="text-[10px] mt-0.5">{isPassed ? '✓ Validé' : 'En attente'}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Items summary */}
                  <div className="text-xs text-gray-600 space-y-1 pt-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>• {item.product.name} (×{item.quantity})</span>
                        <span className="font-bold tabular-nums">{(item.product.price * item.quantity).toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        setIsOrderTrackingOpen(false);
                        navigate(`/commande-confirmee/${encodeURIComponent(order.id)}`);
                      }}
                      className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-xl inline-flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" /> Facture imprimable
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
