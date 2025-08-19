<template>
  <div style="display: none;"></div>
</template>

<script setup>
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '@/assets/logo.jpg';

const props = defineProps({
  resocontoFinale: { type: Object, required: true },
  chantierInfo: { type: Object, required: true },
  clientInfo: { type: Object, required: true }
});

const generatePdf = () => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  
  // Header con logo
  const drawHeader = () => {
    const logoW = 55;
    const logoH = logoW / 5.32;
    doc.addImage(logo, 'JPEG', 10, 10, logoW, logoH);
    
    // Dati aziendali
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const companyInfo = [
      'DALLELEC Sarl',
      'Rue de Bourgogne 25', 
      '1203 Genève',
      'contact@dallelec.ch'
    ];
    let y = 12;
    companyInfo.forEach(line => {
      doc.text(line, 200, y, { align: 'right' });
      y += 4;
    });
  };
  
  drawHeader();
  
  // Titolo
  doc.setFontSize(18);
  doc.setFont('Helvetica', 'bold');
  doc.text('CONGUAGLIO FINALE ZONA', 105, 40, { align: 'center' });
  
  // Info cantiere
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'normal');
  let yPos = 55;
  doc.text(`Chantier: ${props.chantierInfo.nom}`, 10, yPos);
  yPos += 6;
  doc.text(`Client: ${props.clientInfo.nom}`, 10, yPos);
  yPos += 6;
  doc.text(`Zone: ${props.resocontoFinale.zona}`, 10, yPos);
  yPos += 6;
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 10, yPos);
  yPos += 15;
  
  // Sezione fatturato precedente
  doc.setFontSize(14);
  doc.setFont('Helvetica', 'bold');
  doc.text('Situation précédente', 10, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Pourcentage facturé: ${props.resocontoFinale.percentualeFatturata}%`, 10, yPos);
  yPos += 6;
  doc.text(`Montant facturé: ${props.resocontoFinale.importoFatturato.toFixed(2)} CHF`, 10, yPos);
  yPos += 15;
  
  // Tabella quantità reali
  doc.setFontSize(14);
  doc.setFont('Helvetica', 'bold');
  doc.text('Quantités réelles posées', 10, yPos);
  yPos += 8;
  
  const prodottiHead = [['Produit', 'Taille', 'ML Prévues', 'ML Réelles', 'Différence', 'Prix Unit.', 'Impact €']];
  const prodottiBody = props.resocontoFinale.prodottiReali.map(p => [
    p.nom,
    p.taille,
    (p.ml || 0).toFixed(1),
    (p.mlReali || 0).toFixed(1),
    ((p.mlReali || 0) - (p.ml || 0)).toFixed(1),
    (p.prix || 0).toFixed(2),
    (((p.mlReali || 0) - (p.ml || 0)) * (p.prix || 0)).toFixed(2)
  ]);
  
  autoTable(doc, {
    head: prodottiHead,
    body: prodottiBody,
    startY: yPos,
    theme: 'grid',
    headStyles: { fillColor: [230, 230, 230], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 25 }
    }
  });
  
  yPos = doc.lastAutoTable.finalY + 10;
  
  // Supplementi aggiuntivi se presenti
  if (props.resocontoFinale.supplementiAggiuntivi?.length > 0) {
    doc.setFontSize(14);
    doc.setFont('Helvetica', 'bold');
    doc.text('Suppléments non prévus', 10, yPos);
    yPos += 8;
    
    const suppHead = [['Description', 'Quantité', 'Prix Unit.', 'Total']];
    const suppBody = props.resocontoFinale.supplementiAggiuntivi.map(s => [
      s.descrizione,
      s.quantita.toString(),
      s.prezzo.toFixed(2),
      (s.quantita * s.prezzo).toFixed(2)
    ]);
    
    autoTable(doc, {
      head: suppHead,
      body: suppBody,
      startY: yPos,
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], fontSize: 9 },
      bodyStyles: { fontSize: 8 }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
  }
  
  // Riepilogo finale
  doc.setFontSize(14);
  doc.setFont('Helvetica', 'bold');
  doc.text('Riepilogo conguaglio', 10, yPos);
  yPos += 8;
  
  const riepHead = [['Descrizione', 'Importo']];
  const riepBody = [
    [`Già fatturato (${props.resocontoFinale.percentualeFatturata}%)`, `${props.resocontoFinale.importoFatturato.toFixed(2)} CHF`],
    ['Variazioni quantità', `${props.resocontoFinale.variazioniQuantita.toFixed(2)} CHF`],
    ['Supplementi aggiuntivi', `${props.resocontoFinale.totalSupplementi.toFixed(2)} CHF`],
    ['CONGUAGLIO FINALE', `${props.resocontoFinale.conguaglioFinale.toFixed(2)} CHF`]
  ];
  
  autoTable(doc, {
    head: riepHead,
    body: riepBody,
    startY: yPos,
    theme: 'grid',
    headStyles: { fillColor: [200, 200, 200], fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 40, halign: 'right' }
    },
    didParseCell: (data) => {
      if (data.row.index === 3) { // Riga finale
        data.cell.styles.fillColor = props.resocontoFinale.conguaglioFinale >= 0 ? [200, 255, 200] : [255, 200, 200];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });
  
  // Footer
  doc.setFontSize(8);
  doc.text('Pag. 1/1', 105, 292, { align: 'center' });
  
  // Salva
  const fileName = `conguaglio-${props.chantierInfo.numeroCantiere || 'cantiere'}-${props.resocontoFinale.zona}.pdf`;
  doc.save(fileName);
};

defineExpose({ generatePdf });
</script>