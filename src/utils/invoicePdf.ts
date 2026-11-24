import { jsPDF } from 'jspdf';
import { Order } from '../types';

export function downloadOrderInvoicePdf(order: Order): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 16;
  let y = 18;

  // Header band
  doc.setFillColor(30, 58, 138); // blue-900
  doc.rect(0, 0, pageWidth, 34, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('MYRLAN PARAPHARMACIE', marginX, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Myrlan Pharma S.A. - 15 rue de la Republique, 69002 Lyon', marginX, 21);
  doc.text('RCS Lyon 984 231 092 - TVA Intracommunautaire FR32984231092', marginX, 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`FACTURE FAC-${order.id}`, pageWidth - marginX, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Date : ${order.date}`, pageWidth - marginX, 21, { align: 'right' });
  doc.text(`Statut : ${order.status}`, pageWidth - marginX, 26, { align: 'right' });

  y = 44;
  doc.setTextColor(15, 23, 42);

  // Two-column billing & delivery info
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, y, 86, 36, 2, 2, 'FD');
  doc.roundedRect(marginX + 92, y, 86, 36, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CLIENT & FACTURATION', marginX + 4, y + 6);
  doc.text('REGLEMENT & EXPEDITION', marginX + 96, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const addr = order.shippingAddress;
  let cy = y + 12;
  if (addr.isCompany && addr.companyName) {
    doc.setFont('helvetica', 'bold');
    doc.text(addr.companyName.slice(0, 40), marginX + 4, cy);
    doc.setFont('helvetica', 'normal');
    cy += 4.5;
  }
  doc.text((addr.fullName || '').slice(0, 42), marginX + 4, cy);
  doc.text((addr.address || '').slice(0, 44), marginX + 4, cy + 4.5);
  doc.text(`${addr.postalCode || ''} ${addr.city || ''}, ${addr.country || 'France'}`.slice(0, 44), marginX + 4, cy + 9);
  doc.text(`${addr.email || ''} - ${addr.phone || ''}`.slice(0, 44), marginX + 4, cy + 13.5);

  doc.text(
    `Paiement : ${order.paymentMethod === 'card' ? 'Carte Bancaire (Regle)' : 'Comptoir / Livraison'}`,
    marginX + 96,
    y + 12
  );
  doc.text(`Transporteur : ${String(order.carrier || '').toUpperCase()}`, marginX + 96, y + 17);
  doc.text(`Numero de suivi : ${order.trackingNumber || '-'}`, marginX + 96, y + 22);
  doc.text(`Points fidelite gagnes : +${order.loyaltyPointsEarned || 0} pts`, marginX + 96, y + 27);

  y += 45;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, y, pageWidth - marginX * 2, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DESIGNATION / MARQUE', marginX + 3, y + 5.5);
  doc.text('P.U. TTC', pageWidth - marginX - 54, y + 5.5, { align: 'right' });
  doc.text('QTE', pageWidth - marginX - 32, y + 5.5, { align: 'right' });
  doc.text('TOTAL TTC', pageWidth - marginX - 3, y + 5.5, { align: 'right' });

  y += 11;
  doc.setFont('helvetica', 'normal');

  for (const item of order.items) {
    if (y > 245) {
      doc.addPage();
      y = 20;
    }
    const unitPrice = Number(item.product?.price ?? 0);
    const qty = Number(item.quantity ?? 1);
    const lineTotal = unitPrice * qty;
    const title = `${item.product?.name || 'Produit'} (${item.product?.brand || ''})`;

    doc.setFont('helvetica', 'bold');
    doc.text(title.slice(0, 58), marginX + 3, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`EAN : ${item.product?.ean || '-'}`, marginX + 3, y + 4);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.text(`${unitPrice.toFixed(2)} EUR`, pageWidth - marginX - 54, y + 1, { align: 'right' });
    doc.text(String(qty), pageWidth - marginX - 32, y + 1, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`${lineTotal.toFixed(2)} EUR`, pageWidth - marginX - 3, y + 1, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    doc.setDrawColor(241, 245, 249);
    doc.line(marginX, y + 6.5, pageWidth - marginX, y + 6.5);
    y += 10.5;
  }

  // Totals block
  y += 4;
  if (y > 235) {
    doc.addPage();
    y = 20;
  }

  const computedSubtotal =
    order.subtotal ??
    order.items.reduce((acc, i) => acc + Number(i.product?.price ?? 0) * Number(i.quantity ?? 1), 0);
  const shippingFee = Number(order.shippingFee ?? 0);
  const discount = Number(order.discountAmount ?? 0);
  const totalTTC = Number(order.totalAmount ?? computedSubtotal);
  const totalHT = totalTTC / 1.2;
  const totalTVA = totalTTC - totalHT;

  const summaryX = pageWidth - marginX - 78;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryX, y, 78, discount > 0 ? 40 : 34, 2, 2, 'FD');

  let sy = y + 6;
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Sous-total TTC :', summaryX + 4, sy);
  doc.text(`${computedSubtotal.toFixed(2)} EUR`, pageWidth - marginX - 4, sy, { align: 'right' });
  sy += 5.5;

  if (discount > 0) {
    doc.setTextColor(29, 78, 216);
    doc.text(`Remise (${order.promoCode || 'Promo'}) :`, summaryX + 4, sy);
    doc.text(`-${discount.toFixed(2)} EUR`, pageWidth - marginX - 4, sy, { align: 'right' });
    sy += 5.5;
  }

  doc.setTextColor(71, 85, 105);
  doc.text('Frais de port :', summaryX + 4, sy);
  doc.text(shippingFee === 0 ? 'Gratuit' : `${shippingFee.toFixed(2)} EUR`, pageWidth - marginX - 4, sy, { align: 'right' });
  sy += 5.5;

  doc.text('Total HT :', summaryX + 4, sy);
  doc.text(`${totalHT.toFixed(2)} EUR`, pageWidth - marginX - 4, sy, { align: 'right' });
  sy += 5.5;

  doc.text('Dont TVA (20%) :', summaryX + 4, sy);
  doc.text(`${totalTVA.toFixed(2)} EUR`, pageWidth - marginX - 4, sy, { align: 'right' });
  sy += 6.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text('TOTAL REGLE TTC :', summaryX + 4, sy);
  doc.text(`${totalTTC.toFixed(2)} EUR`, pageWidth - marginX - 4, sy, { align: 'right' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Document comptable officiel emis par Myrlan Pharma S.A. - Conserver pour garantie et mutuelle.',
    pageWidth / 2,
    284,
    { align: 'center' }
  );

  doc.save(`Facture-Myrlan-${order.id}.pdf`);
}
