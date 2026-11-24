import React, { useEffect, useMemo, useState } from 'react';
import {
  X, Mail, Send, Copy, ExternalLink, RefreshCw, Trash2, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { Product, RestockConfig, RestockEmailRecord, RestockOrderLine } from '../types';
import { authFetch } from '../utils/authToken';
import { useBodyScrollLock } from '../utils/scrollLock';

interface RestockEmailModalProps {
  isOpen: boolean;
  initialProducts: Product[];
  config: RestockConfig;
  onClose: () => void;
  onEmailSent: (record: RestockEmailRecord) => void;
  showToast: (msg: string) => void;
}

function buildRestockSubject(lines: RestockOrderLine[], supplierName: string): string {
  const today = new Date().toLocaleDateString('fr-FR');
  if (lines.length === 1) {
    return `[Réapprovisionnement Urgent] ${lines[0].name} (+${lines[0].orderQty} u.) — Myrlan Officine (${today})`;
  }
  const totalUnits = lines.reduce((sum, l) => sum + l.orderQty, 0);
  return `[Commande Réapprovisionnement] ${lines.length} références (${totalUnits} unités) — Myrlan Officine (${today})`;
}

function buildRestockBody(lines: RestockOrderLine[], supplierName: string): string {
  const today = new Date().toLocaleDateString('fr-FR');
  const totalUnits = lines.reduce((sum, l) => sum + l.orderQty, 0);
  const formattedList = lines
    .map(
      (line, idx) =>
        `${idx + 1}. ${line.name} (${line.brand})\n   EAN : ${line.ean} | Stock actuel : ${line.currentStock} u. | Quantité à commander : ${line.orderQty} u.`
    )
    .join('\n\n');

  return [
    `Bonjour l’équipe ${supplierName || 'Approvisionnement'},`,
    '',
    `Suite à notre contrôle automatique des seuils critiques du ${today}, nous souhaitons passer une commande de réapprovisionnement prioritaire pour les références suivantes :`,
    '',
    formattedList,
    '',
    `Total : ${lines.length} référence(s) pour ${totalUnits} unité(s).`,
    '',
    'Merci de bien vouloir nous confirmer la disponibilité et le délai de livraison vers notre officine (Myrlan Parapharmacie, 15 rue de la République, 69002 Lyon).',
    '',
    'Cordialement,',
    'L’équipe Pharmaceutique — Myrlan Officine'
  ].join('\n');
}

export const RestockEmailModal: React.FC<RestockEmailModalProps> = ({
  isOpen,
  initialProducts,
  config,
  onClose,
  onEmailSent,
  showToast
}) => {
  const [lines, setLines] = useState<RestockOrderLine[]>([]);
  const [recipientEmail, setRecipientEmail] = useState(config.supplierEmail);
  const [supplierName, setSupplierName] = useState(config.supplierName);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [hasManualTextEdit, setHasManualTextEdit] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentResult, setSentResult] = useState<RestockEmailRecord | null>(null);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const computedLines: RestockOrderLine[] = initialProducts.map(p => ({
      productId: p.id,
      name: p.name,
      brand: p.brand,
      ean: p.ean,
      currentStock: p.stock,
      orderQty: Math.max(5, config.targetStock - p.stock),
      unitPrice: p.price
    }));
    setLines(computedLines);
    setRecipientEmail(config.supplierEmail || 'approvisionnement@grossiste-pharma.fr');
    setSupplierName(config.supplierName || 'Grossiste Répartiteur Myrlan');
    setSubject(buildRestockSubject(computedLines, config.supplierName));
    setBody(buildRestockBody(computedLines, config.supplierName));
    setHasManualTextEdit(false);
    setSentResult(null);
  }, [isOpen, initialProducts, config]);

  const totalUnits = useMemo(
    () => lines.reduce((sum, l) => sum + l.orderQty, 0),
    [lines]
  );

  const handleQtyChange = (productId: string, nextVal: number) => {
    const safeQty = Math.max(1, Math.min(1000, Math.round(nextVal) || 1));
    const updated = lines.map(l => (l.productId === productId ? { ...l, orderQty: safeQty } : l));
    setLines(updated);
    if (!hasManualTextEdit) {
      setSubject(buildRestockSubject(updated, supplierName));
      setBody(buildRestockBody(updated, supplierName));
    }
  };

  const handleRemoveLine = (productId: string) => {
    const updated = lines.filter(l => l.productId !== productId);
    setLines(updated);
    if (!hasManualTextEdit && updated.length > 0) {
      setSubject(buildRestockSubject(updated, supplierName));
      setBody(buildRestockBody(updated, supplierName));
    }
  };

  const handleRegenerateText = () => {
    setSubject(buildRestockSubject(lines, supplierName));
    setBody(buildRestockBody(lines, supplierName));
    setHasManualTextEdit(false);
    showToast('Texte du mail de réapprovisionnement régénéré.');
  };

  const handleCopyEmail = async () => {
    const fullText = `À : ${recipientEmail}\nObjet : ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(fullText);
      showToast('Mail de réapprovisionnement copié dans le presse-papiers.');
    } catch {
      showToast('Impossible d’accéder au presse-papiers.');
    }
  };

  const mailtoHref = useMemo(() => {
    const params = new URLSearchParams({
      subject: subject || '',
      body: body || ''
    });
    return `mailto:${encodeURIComponent(recipientEmail || '')}?${params.toString().replace(/\+/g, '%20')}`;
  }, [recipientEmail, subject, body]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      showToast('Ajoutez au moins un produit à commander.');
      return;
    }
    setIsSending(true);
    try {
      const res = await authFetch('/api/admin/restock/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail.trim(),
          supplierName: supplierName.trim(),
          subject: subject.trim(),
          body: body.trim(),
          items: lines
        })
      });
      const data = await res.json();
      if (data.success && data.record) {
        setSentResult(data.record);
        onEmailSent(data.record);
        showToast(`Mail de réapprovisionnement envoyé (${data.record.status}).`);
      } else {
        showToast(data.error || 'Échec de l’envoi du mail.');
      }
    } catch {
      showToast('Erreur réseau lors de l’envoi.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="restock-modal-title"
        className="relative z-10 bg-white border border-slate-200 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="restock-modal-title" className="text-base font-bold text-slate-900 truncate">
                Générateur de mail de réapprovisionnement
              </h2>
              <p className="text-xs text-slate-500 tabular-nums">
                {lines.length} référence(s) critique(s) · {totalUnits} unité(s) à commander
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentResult ? (
          <div className="p-8 text-center space-y-4 overflow-y-auto overscroll-contain">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Mail de réapprovisionnement enregistré et envoyé</h3>
              <p className="text-xs text-slate-600 tabular-nums">
                Destinataire : <strong className="text-slate-900">{sentResult.to}</strong> · Statut : <strong className="text-emerald-700">{sentResult.status}</strong> · {sentResult.sentAt}
              </p>
            </div>
            <div className="max-w-lg mx-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-left text-xs tabular-nums">
              {sentResult.items.map(item => (
                <div key={item.productId} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-800 truncate">{item.name}</span>
                  <span className="font-mono font-bold text-blue-700 shrink-0">+{item.orderQty} u.</span>
                </div>
              ))}
            </div>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleCopyEmail}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copier le texte
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
              {/* Products to Reorder Table */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-slate-700">
                    Produits inclus dans la demande ({lines.length})
                  </h3>
                  <span className="text-xs text-slate-500 tabular-nums">
                    Cible de réapprovisionnement : {config.targetStock} u.
                  </span>
                </div>

                {lines.length === 0 ? (
                  <div className="p-6 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                    Aucun produit sélectionné. Fermez cette fenêtre pour sélectionner des références critiques.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs tabular-nums">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                          <tr>
                            <th className="py-2.5 px-3.5">Produit / EAN</th>
                            <th className="py-2.5 px-3.5 text-right">Stock actuel</th>
                            <th className="py-2.5 px-3.5 text-right">Qté à commander</th>
                            <th className="py-2.5 px-3.5 text-right">Retirer</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {lines.map(line => (
                            <tr key={line.productId} className="hover:bg-slate-50/70">
                              <td className="py-2.5 px-3.5">
                                <div className="font-semibold text-slate-900 truncate max-w-[280px]">{line.name}</div>
                                <div className="text-[11px] text-slate-500">
                                  {line.brand} · <span className="font-mono">{line.ean}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                                <span className={`font-mono font-bold ${line.currentStock === 0 ? 'text-rose-700' : 'text-amber-700'}`}>
                                  {line.currentStock} u.
                                </span>
                                <span className="text-[11px] text-slate-400 ml-1.5">
                                  {line.currentStock === 0 ? 'Rupture' : 'Critique'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5 text-right">
                                <input
                                  type="number"
                                  min={1}
                                  max={1000}
                                  value={line.orderQty}
                                  onChange={(e) => handleQtyChange(line.productId, Number(e.target.value))}
                                  className="w-20 px-2.5 py-1 border border-slate-300 rounded-md text-right font-mono font-semibold text-slate-900"
                                />
                              </td>
                              <td className="py-2.5 px-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLine(line.productId)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                  title="Retirer de la commande"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Recipient & Supplier fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email du fournisseur / grossiste</label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="approvisionnement@grossiste-pharma.fr"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nom du fournisseur</label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="Grossiste Répartiteur Myrlan"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Generated Email Subject & Body */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-semibold text-slate-700">Objet du mail</label>
                  <button
                    type="button"
                    onClick={handleRegenerateText}
                    className="inline-flex items-center gap-1 text-blue-700 hover:underline font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" /> Régénérer selon les quantités
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    setHasManualTextEdit(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-900"
                />

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Message généré (modifiable avant envoi)</label>
                  <textarea
                    rows={9}
                    required
                    value={body}
                    onChange={(e) => {
                      setBody(e.target.value);
                      setHasManualTextEdit(true);
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs leading-relaxed font-mono text-slate-800"
                  />
                </div>

                {lines.some(l => l.currentStock === 0) && (
                  <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Une ou plusieurs références sont en rupture totale (0 u.). L’envoi de ce mail sera tracé dans le journal officinal.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Copy className="w-3.5 h-3.5" /> Copier le mail
                </button>
                <a
                  href={mailtoHref}
                  className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Client mail externe
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-lg whitespace-nowrap"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSending || lines.length === 0}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Envoi en cours...' : 'Envoyer le mail de réapprovisionnement'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
