import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generatePDF = (invoice) => {
  // Create instance of jsPDF (A4 size, portrait orientation, units in mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [37, 99, 235]; // #2563eb
  const secondaryColor = [15, 23, 42]; // #0f172a
  const lightGray = [241, 245, 249]; // #f1f5f9
  const darkGray = [100, 116, 139]; // #64748b

  // --- HEADER SECTION ---
  // Background accent block
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');

  // Company Brand
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('FACTUREFLOW', 15, 18);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Solutions de Facturation Digitales', 15, 24);
  doc.setTextColor(200, 200, 200);
  doc.text('support@factureflow.com | +212 522-000000', 15, 30);

  // Document Title (Top Right)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('FACTURE', 195, 20, { align: 'right' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${invoice.numero}`, 195, 27, { align: 'right' });

  // --- DETAILS SECTION ---
  // Left Side: Invoice Details
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DÉTAILS DE LA FACTURE :', 15, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text([
    `Numéro : ${invoice.numero}`,
    `Date d'émission : ${invoice.date}`,
    `Date d'échéance : ${invoice.date_echeance || '-'}`,
  ], 15, 62);

  // Statut chip
  const statusLabels = {
    payee: 'PAYÉE',
    en_attente: 'EN ATTENTE',
    refusee: 'REJETÉE'
  };
  const statusColors = {
    payee: [16, 185, 129], // green
    en_attente: [245, 158, 11], // orange
    refusee: [239, 68, 68] // red
  };
  
  const statusText = statusLabels[invoice.status] || invoice.status.toUpperCase();
  const statusColor = statusColors[invoice.status] || [100, 116, 139];

  doc.setFont('helvetica', 'bold');
  doc.text('Statut : ', 15, 82);
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  // draw a rounded status indicator background
  doc.rect(28, 78, 30, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(statusText, 43, 82.2, { align: 'center' });

  // Right Side: Client Info
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('FACTURÉ À :', 120, 55);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text([
    `Nom/Client : ${invoice.client_nom}`,
    `ID Client : CLI-00${invoice.client_id}`
  ], 120, 62);

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 90, 195, 90);

  // --- PRODUCTS / ITEMS TABLE ---
  const tableColumns = [
    { title: 'Désignation', dataKey: 'designation' },
    { title: 'Prix Unitaire', dataKey: 'prix_unitaire' },
    { title: 'Quantité', dataKey: 'quantite' },
    { title: 'Total HT', dataKey: 'total' }
  ];

  const tableRows = invoice.items.map(item => ({
    designation: item.designation,
    prix_unitaire: `${item.prix_unitaire.toLocaleString('fr-FR')} DH`,
    quantite: item.quantite.toString(),
    total: `${item.total.toLocaleString('fr-FR')} DH`
  }));

  doc.autoTable({
    columns: tableColumns,
    body: tableRows,
    startY: 95,
    margin: { left: 15, right: 15 },
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: secondaryColor
    },
    columnStyles: {
      designation: { cellWidth: 90 },
      prix_unitaire: { cellWidth: 35, halign: 'right' },
      quantite: { cellWidth: 20, halign: 'center' },
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
  const finalY = doc.previousAutoTable.finalY + 10;

  // --- TOTALS SUMMARY ---
  const leftTotalX = 130;
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(9);
  
  // Total HT
  doc.setFont('helvetica', 'normal');
  doc.text('Total Hors Taxe (HT) :', leftTotalX, finalY);
  doc.text(`${invoice.total_ht.toLocaleString('fr-FR')} DH`, 195, finalY, { align: 'right' });

  // TVA
  const tvaValue = invoice.total_ht * (invoice.tva / 100);
  doc.text(`TVA (${invoice.tva}%) :`, leftTotalX, finalY + 6);
  doc.text(`${tvaValue.toLocaleString('fr-FR')} DH`, 195, finalY + 6, { align: 'right' });

  // Total TTC Accent Box
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(leftTotalX - 2, finalY + 11, 70, 10, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Total Tout Taxe C. (TTC) :', leftTotalX, finalY + 17);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`${invoice.total_ttc.toLocaleString('fr-FR')} DH`, 195, finalY + 17, { align: 'right' });

  // --- FOOTER SECTION ---
  // Footer text
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Merci de votre confiance et de votre fidélité.', 105, 280, { align: 'center' });
  doc.text('FactureFlow S.A.R.L - Capital de 100 000 DH - RC 12345 - IF 987654', 105, 285, { align: 'center' });

  // Save PDF
  doc.save(`Facture_${invoice.numero}.pdf`);
};
