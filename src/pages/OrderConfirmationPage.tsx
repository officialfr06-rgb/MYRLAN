import React from 'react';
import {
  CheckCircle, Printer, ArrowLeft, ShieldCheck, Package, Building, Award
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const OrderConfirmationPage: React.FC<{ orderId: string }> = ({ orderId }) => {
  const { myOrders, orders, navigate } = useShop();

  const order = myOrders.find(o => o.id === orderId) || orders.find(o => o.id === orderId);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
          <Package className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">Commande introuvable</h1>
        <p className="text-sm text-gray-600">
          Connectez-vous ou vérifiez le numéro de commande <span className="font-mono font-bold">{orderId}</span>.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
        >
          Retour à la boutique
        </button>
      </div>
    );
  }

  const computedSubtotal = order.subtotal ?? order.items.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
  const tvaRate = 0.20;
  const totalHT = order.totalAmount / (1 + tvaRate);
  const totalTVA = order.totalAmount - totalHT;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6 print:py-0">
      {/* Top action bar (hidden when printing) */}
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <button
          onClick={() => navigate('/commandes')}
          className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900"
        >
          <ArrowLeft className="w-4 h-4" /> Mes commandes
        </button>
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 shadow-sm"
        >
          <Printer className="w-4 h-4" /> Imprimer / Télécharger en PDF
        </button>
      </div>

      {/* Confirmation Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Commande {order.id} confirmée</h1>
            <p className="text-xs text-blue-900">
              Statut actuel : <strong>{order.status}</strong> • Suivi : <span className="font-mono font-bold">{order.trackingNumber}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full">
          <Award className="w-4 h-4" /> +{order.loyaltyPointsEarned} pts fidélité
        </div>
      </div>

      {/* Printable Invoice Sheet */}
      <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 space-y-8 shadow-xs print:border-0 print:shadow-none print:rounded-none">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 border-b border-gray-200 pb-6">
          <div className="space-y-1">
            <div className="text-2xl font-black text-blue-900">Myrlan Parapharmacie</div>
            <div className="text-xs text-gray-600">Myrlan Pharma S.A. — RCS Lyon 984 231 092</div>
            <div className="text-xs text-gray-600">15 rue de la République, 69002 Lyon, France</div>
            <div className="text-xs text-gray-600">TVA Intracommunautaire : FR32984231092</div>
          </div>

          <div className="sm:text-right space-y-1">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-600">Facture Client</div>
            <div className="text-lg font-mono font-black text-gray-900">FAC-{order.id}</div>
            <div className="text-xs text-gray-600">Date : {order.date}</div>
            <div className="text-xs text-gray-600">Mode : <span className="uppercase font-semibold">{order.carrier}</span></div>
          </div>
        </div>

        {/* Billing & Shipping Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-gray-700">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <div className="font-bold text-gray-900 uppercase tracking-wider text-[11px] mb-1">Client &amp; Facturation</div>
            {order.shippingAddress.isCompany && (
              <div className="font-bold text-blue-900 flex items-center gap-1">
                <Building className="w-3.5 h-3.5" /> {order.shippingAddress.companyName}
                {order.shippingAddress.vatNumber ? ` (TVA : ${order.shippingAddress.vatNumber})` : ''}
              </div>
            )}
            <div className="font-bold text-gray-900">{order.shippingAddress.fullName}</div>
            <div>{order.shippingAddress.address}</div>
            <div>{order.shippingAddress.postalCode} {order.shippingAddress.city}, {order.shippingAddress.country}</div>
            <div>{order.shippingAddress.email} • {order.shippingAddress.phone}</div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <div className="font-bold text-gray-900 uppercase tracking-wider text-[11px] mb-1">Règlement &amp; Livraison</div>
            <div><strong>Paiement :</strong> {order.paymentMethod === 'card' ? 'Carte Bancaire (Validé)' : 'Paiement au comptoir officine'}</div>
            <div><strong>Transporteur :</strong> <span className="uppercase">{order.carrier}</span></div>
            <div><strong>Numéro de suivi :</strong> <span className="font-mono">{order.trackingNumber}</span></div>
            <div><strong>Statut :</strong> {order.status}</div>
          </div>
        </div>

        {/* Line items table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-gray-50 text-gray-600 uppercase font-bold border-y border-gray-200">
              <tr>
                <th className="p-3">Désignation / EAN</th>
                <th className="p-3 text-right">Prix Unit. TTC</th>
                <th className="p-3 text-right">Qté</th>
                <th className="p-3 text-right">Total TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-3">
                    <div className="font-bold text-gray-900">{item.product.name}</div>
                    <div className="text-[11px] text-gray-500">{item.product.brand} • EAN {item.product.ean}</div>
                  </td>
                  <td className="p-3 text-right">{item.product.price.toFixed(2)} €</td>
                  <td className="p-3 text-right font-bold">{item.quantity}</td>
                  <td className="p-3 text-right font-bold text-gray-900">{(item.product.price * item.quantity).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full sm:w-72 space-y-2 text-xs tabular-nums border-t border-gray-200 pt-4">
            <div className="flex justify-between text-gray-600">
              <span>Sous-total articles TTC</span>
              <span className="font-bold text-gray-900">{computedSubtotal.toFixed(2)} €</span>
            </div>
            {order.discountAmount ? (
              <div className="flex justify-between text-blue-700 font-semibold">
                <span>Remise ({order.promoCode || 'Code promo'})</span>
                <span>-{order.discountAmount.toFixed(2)} €</span>
              </div>
            ) : null}
            <div className="flex justify-between text-gray-600">
              <span>Frais de port</span>
              <span className="font-bold text-gray-900">
                {(order.shippingFee ?? 0) === 0 ? 'Gratuit' : `${(order.shippingFee ?? 0).toFixed(2)} €`}
              </span>
            </div>
            <div className="flex justify-between text-gray-500 pt-1 border-t border-gray-100">
              <span>Dont Total HT</span>
              <span>{totalHT.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Dont TVA (20%)</span>
              <span>{totalTVA.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-base font-black text-blue-900 pt-2 border-t border-gray-200">
              <span>Total Réglé TTC</span>
              <span>{order.totalAmount.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center gap-2 text-[11px] text-gray-500">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Document comptable officiel émis par Myrlan Pharma S.A. — Merci pour votre confiance.</span>
        </div>
      </div>
    </div>
  );
};
