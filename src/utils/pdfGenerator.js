import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Main preloading wrapper to handle QR Code image asynchronously before PDF construction
export const generatePDF = (invoice) => {
  const currency = invoice.currency || 'MAD';
  const currencySymbol = currency === 'MAD' ? 'DH' : currency === 'EUR' ? '€' : '$';

  // Construct QR Code data string
  const qrData = encodeURIComponent(
    `Facture: ${invoice.numero}\n` +
    `Emetteur: ${invoice.company_name || 'FactureFlow'}\n` +
    `Client: ${invoice.client_nom}\n` +
    `Total: ${invoice.total_ttc.toLocaleString('fr-FR')} ${currencySymbol}\n` +
    `Date: ${invoice.date}`
  );
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;

  const qrImg = new Image();
  qrImg.crossOrigin = 'Anonymous';
  qrImg.onload = () => {
    buildPDF(invoice, qrImg);
  };
  qrImg.onerror = () => {
    console.warn("[PDF Generator] Failed to load QR Code. Building PDF without QR Code.");
    buildPDF(invoice, null);
  };
  qrImg.src = qrUrl;
};

// Internal synchronous PDF builder
const buildPDF = (invoice, qrImage) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [37, 99, 235]; // #2563eb
  const secondaryColor = [15, 23, 42]; // #0f172a
  const lightGray = [248, 250, 252]; // #f8fafc
  const borderGray = [226, 232, 240]; // #e2e8f0
  
  const currency = invoice.currency || 'MAD';
  const currencySymbol = currency === 'MAD' ? 'DH' : currency === 'EUR' ? '€' : '$';

  // --- HEADER SECTION ---
  // Background accent block
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(0, 0, 210, 45, 'F');

  // Company Brand (dynamic)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text((invoice.company_name || 'FACTUREFLOW').toUpperCase(), 15, 18);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Solutions de Facturation Digitales Professionnelles', 15, 24);
  doc.setTextColor(180, 180, 180);
  doc.text('support@factureflow.com | www.factureflow.com', 15, 29);
  doc.text('Tél : +212 522-000000 | Casablanca, Maroc', 15, 34);

  // Document Title (Top Right)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('FACTURE', 195, 20, { align: 'right' });
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${invoice.numero}`, 195, 27, { align: 'right' });
  doc.text(`Méthode: ${
    invoice.billing_method === 'simple' ? 'Simple' :
    invoice.billing_method === 'remise_ligne' ? 'Remise/Ligne' :
    invoice.billing_method === 'remise_globale' ? 'Remise Globale' : 'TVA/Catégorie'
  }`, 195, 33, { align: 'right' });

  // --- DETAILS SECTION ---
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  
  // Left Column: Invoice Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('DÉTAILS DE LA FACTURE :', 15, 57);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text([
    `Numéro : ${invoice.numero}`,
    `Date d'émission : ${invoice.date}`,
    `Date d'échéance : ${invoice.date_echeance || '-'}`,
    `Date de dépôt : ${invoice.date_depot || '-'}`
  ], 15, 63);

  // Right Column: Client Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('FACTURÉ À :', 115, 57);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text([
    `Nom / Client : ${invoice.client_nom}`,
    `Règlement : ${invoice.type_virement || 'Virement'}`,
    `Date encaissement : ${invoice.date_encaissement || 'En cours'}`
  ], 115, 63);

  // Status Indicator Badge
  const statusLabels = {
    payee: 'PAYÉE / VALIDÉE',
    en_attente: 'EN ATTENTE / ENCOURS',
    refusee: 'REJETÉE / ANNULÉE'
  };
  const statusColors = {
    payee: [16, 185, 129], // green
    en_attente: [245, 158, 11], // orange
    refusee: [239, 68, 68] // red
  };
  const statusText = statusLabels[invoice.status] || invoice.status.toUpperCase();
  const statusColor = statusColors[invoice.status] || [100, 116, 139];

  doc.setFont('helvetica', 'bold');
  doc.text('Statut : ', 15, 87);
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.rect(26, 83.5, 45, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.text(statusText, 48.5, 87.2, { align: 'center' });

  // Divider Line
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.4);
  doc.line(15, 93, 195, 93);

  // --- PRODUCTS / ITEMS TABLE ---
  const isLigneDiscount = invoice.billing_method === 'remise_ligne';
  const tableColumns = [
    { title: 'Désignation', dataKey: 'designation' },
    { title: 'Prix Unitaire', dataKey: 'prix_unitaire' },
    { title: 'Quantité', dataKey: 'quantite' }
  ];

  if (isLigneDiscount) {
    tableColumns.push({ title: 'Remise', dataKey: 'remise' });
  }
  tableColumns.push({ title: 'Total HT', dataKey: 'total' });

  const tableRows = invoice.items.map(item => {
    const row = {
      designation: item.designation,
      prix_unitaire: `${item.prix_unitaire.toLocaleString('fr-FR')} ${currencySymbol}`,
      quantite: item.quantite.toString(),
      total: `${item.total.toLocaleString('fr-FR')} ${currencySymbol}`
    };
    if (isLigneDiscount) {
      row.remise = `${item.remise || 0}%`;
    }
    return row;
  });

  doc.autoTable({
    columns: tableColumns,
    body: tableRows,
    startY: 97,
    margin: { left: 15, right: 15 },
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: secondaryColor
    },
    columnStyles: {
      designation: { cellWidth: isLigneDiscount ? 80 : 95 },
      prix_unitaire: { cellWidth: 30, halign: 'right' },
      quantite: { cellWidth: 20, halign: 'center' },
      remise: { cellWidth: 20, halign: 'center' },
      total: { cellWidth: 35, halign: 'right' }
    },
    didParseCell: function(data) {
      if (data.section === 'head') {
        if (data.column.dataKey === 'prix_unitaire') data.cell.styles.halign = 'right';
        if (data.column.dataKey === 'total') data.cell.styles.halign = 'right';
      }
    }
  });

  // Get position after table
  let currentY = doc.previousAutoTable.finalY + 10;

  // --- TOTALS SUMMARY ---
  const leftTotalX = 125;
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(8.5);

  // Raw HT Total
  const rawHt = invoice.items.reduce((sum, it) => sum + (it.prix_unitaire * it.quantite), 0);
  doc.setFont('helvetica', 'normal');
  doc.text('Total HT Brut :', leftTotalX, currentY);
  doc.text(`${rawHt.toLocaleString('fr-FR')} ${currencySymbol}`, 195, currentY, { align: 'right' });
  currentY += 5;

  // Global Discount (if applicable)
  if (invoice.billing_method === 'remise_globale') {
    const discAmount = rawHt * ((invoice.remise_globale || 0) / 100);
    doc.setTextColor(239, 68, 68); // Red for discount
    doc.text(`Remise globale (${invoice.remise_globale}%) :`, leftTotalX, currentY);
    doc.text(`-${discAmount.toLocaleString('fr-FR')} ${currencySymbol}`, 195, currentY, { align: 'right' });
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    currentY += 5;
  }

  // Net HT
  doc.setFont('helvetica', 'bold');
  doc.text('Total HT Net :', leftTotalX, currentY);
  doc.text(`${invoice.total_ht.toLocaleString('fr-FR')} ${currencySymbol}`, 195, currentY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  currentY += 5;

  // Calculated TVA
  const tvaLabel = invoice.billing_method === 'par_categorie' ? 'TVA cumulée :' : `TVA (20%) :`;
  doc.text(tvaLabel, leftTotalX, currentY);
  doc.text(`${invoice.tva.toLocaleString('fr-FR')} ${currencySymbol}`, 195, currentY, { align: 'right' });
  currentY += 5;

  // Total TTC Accent Box
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(leftTotalX - 2, currentY, 72, 9, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Total TTC :', leftTotalX, currentY + 6);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`${invoice.total_ttc.toLocaleString('fr-FR')} ${currencySymbol}`, 195, currentY + 6, { align: 'right' });
  
  currentY += 20;

  // --- SIGNATURES & VERIFICATION SECTION ---
  // Ensure we don't overflow the page, if we do, add a new page
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  // Border block for QR / Signature area
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.line(15, currentY, 195, currentY);
  currentY += 8;

  // Left Side: QR Code Verification
  if (qrImage) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('VÉRIFICATION NUMÉRIQUE', 15, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Scannez ce QR Code pour vérifier', 15, currentY + 5);
    doc.text("l'authenticité de cette facture.", 15, currentY + 8);
    
    // Add QR Code
    doc.addImage(qrImage, 'PNG', 15, currentY + 12, 28, 28);
  }

  // Right Side: Handdrawn Signature
  if (invoice.signature_data) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('SIGNATURE ÉLECTRONIQUE CERTIFIÉE', 120, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Signé électroniquement via FactureFlow.', 120, currentY + 5);

    // Add Signature image
    try {
      doc.addImage(invoice.signature_data, 'PNG', 120, currentY + 10, 45, 15);
    } catch (sigErr) {
      console.error("Failed to render signature image in PDF:", sigErr);
    }
  }

  // --- FOOTER SECTION ---
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Merci de votre confiance et de votre fidélité.', 105, 280, { align: 'center' });
  doc.text(`${invoice.company_name || 'FactureFlow'} - Capital de 100 000 DH - RC 12345 - IF 987654 - Patente 321098`, 105, 284, { align: 'center' });

  // Save PDF
  doc.save(`Facture_${invoice.numero}.pdf`);
};
