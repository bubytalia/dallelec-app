import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function generateFacturePDF(facture, chantier, chantierDevis, clients, metrageDoc, resocontoDoc, accontiValue = 0) {
  try {
    // Import logo
    let logo;
    try {
      const logoModule = await import('@/assets/logo.jpg');
      logo = logoModule.default;
    } catch (e) {
      console.warn('Logo non trovato');
    }

    // Funzione helper per header
    const drawHeader = (doc, title) => {
      if (logo) doc.addImage(logo, 'JPEG', 10, 10, 55, 10);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('DALLELEC Sarl - CHE-280.028.822', 200, 12, { align: 'right' });
      doc.text('Rue de Bourgogne 25', 200, 17, { align: 'right' });
      doc.text('1203 Genève', 200, 22, { align: 'right' });
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 10, 35);
      
      doc.setLineWidth(0.5);
      doc.line(10, 40, 200, 40);
      
      return 50; // Posizione Y per il contenuto
    };

    const formatDate = (date) => {
      if (!date) return 'N/A';
      return date.toDate ? date.toDate().toLocaleDateString('fr-FR') : new Date(date).toLocaleDateString('fr-FR');
    };

    // FATTURA MANUALE
    if (facture.type === 'manuelle') {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      
      let yPos = drawHeader(doc, `FACTURE N. ${facture.numero}`);
      
      doc.setFontSize(9);
      doc.text(`Date: ${formatDate(facture.date_facture)}`, 10, yPos);
      doc.text(`Client: ${facture.client_nom}`, 10, yPos + 10);
      
      const tableData = facture.lignes.map(ligne => [
        ligne.description,
        ligne.quantite.toString(),
        `${ligne.prixUnitaire.toFixed(2)} CHF`,
        `${(ligne.quantite * ligne.prixUnitaire).toFixed(2)} CHF`
      ]);
      
      autoTable(doc, {
        head: [['Description', 'Quantité', 'Prix unitaire', 'Total HT']],
        body: tableData,
        startY: yPos + 20,
        theme: 'grid'
      });
      
      const finalY = doc.lastAutoTable.finalY + 10;
      const totalHT = Number(facture.montant_ht || 0);
      const tva = totalHT * 0.081;
      const ttc = totalHT + tva;
      
      doc.text(`Total HT: ${totalHT.toFixed(2)} CHF`, 140, finalY);
      doc.text(`TVA (8.1%): ${tva.toFixed(2)} CHF`, 140, finalY + 7);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL TTC: ${ttc.toFixed(2)} CHF`, 140, finalY + 17);
      
      // Condizioni di pagamento
      const conditionsY = finalY + 35;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      // Estrai condizioni dalle notes
      const conditionsMatch = facture.notes?.match(/Conditions:\s*([^\n]+)/);
      const conditionsPaiement = conditionsMatch ? conditionsMatch[1].trim() : '30 jours net';
      
      // Calcola data scadenza
      const dateFacture = new Date(facture.date_facture);
      const dateEcheance = facture.date_echeance ? 
        new Date(facture.date_echeance).toLocaleDateString('fr-FR') :
        dateFacture.toLocaleDateString('fr-FR');
      
      doc.text(`Conditions de paiement: ${conditionsPaiement}`, 10, conditionsY);
      doc.text(`Date d'échéance: ${dateEcheance}`, 10, conditionsY + 7);
      
      return doc;
    }

    // FATTURA DA RESOCONTO PERCENTUALE
    if (resocontoDoc) {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      let yPos = drawHeader(doc, `FACTURE N. ${facture.numero}`);
      
      // Calcoli base
      const calculateZoneMontant = (zone, percentage) => {
        if (chantierDevis?.modalita_prezzi === 'aCorps') {
          const montantCorps = Number(chantierDevis.montant_corps || 0);
          const numeroZone = chantierDevis.zones?.length || 1;
          return (montantCorps / numeroZone) * percentage / 100;
        }
        
        if (!chantierDevis?.produits) return 0;
        const totaleZona = chantierDevis.produits
          .filter(p => p.zone === zone)
          .reduce((sum, p) => sum + Number(p.total || 0), 0);
        return totaleZona * percentage / 100;
      };

      // Travaux réalisés
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('TRAVAUX RÉALISÉS', 10, yPos);
      yPos += 10;
      
      const avancementData = Object.entries(resocontoDoc.avancementi || {}).map(([zona, percentuale]) => {
        const montantZona = calculateZoneMontant(zona, percentuale);
        return [zona, `${percentuale}%`, `${montantZona.toFixed(2)} CHF`];
      });
      
      if (avancementData.length > 0) {
        autoTable(doc, {
          head: [['Zone', 'Avancement', 'Montant HT']],
          body: avancementData,
          startY: yPos,
          theme: 'striped'
        });
        yPos = doc.lastAutoTable.finalY + 10;
      }

      // Calcoli finali
      const totalHT = Number(facture.montant_ht || 0);
      const acconti = Number(accontiValue || 0);
      const imponibileResiduo = totalHT - acconti;
      const tva = imponibileResiduo * 0.081;
      const totalTTC = imponibileResiduo + tva;

      // Box totali
      yPos += 20;
      doc.setFillColor(245, 245, 245);
      doc.rect(120, yPos - 5, 80, 35, 'F');
      
      doc.setFontSize(10);
      doc.text('Total HT:', 125, yPos + 5);
      doc.text(`${totalHT.toFixed(2)} CHF`, 190, yPos + 5, { align: 'right' });
      
      if (acconti > 0) {
        doc.setTextColor(200, 0, 0);
        doc.text('Acomptes HT:', 125, yPos + 12);
        doc.text(`-${acconti.toFixed(2)} CHF`, 190, yPos + 12, { align: 'right' });
        doc.setTextColor(0, 0, 0);
      }
      
      doc.text(`TVA (8.1%):`, 125, yPos + 19);
      doc.text(`${tva.toFixed(2)} CHF`, 190, yPos + 19, { align: 'right' });
      
      doc.setFont('helvetica', 'bold');
      doc.text(acconti > 0 ? 'SOLDE À PAYER:' : 'TOTAL TTC:', 125, yPos + 28);
      doc.text(`${totalTTC.toFixed(2)} CHF`, 190, yPos + 28, { align: 'right' });
      
      // Condizioni di pagamento
      const conditionsY = yPos + 50;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      // Estrai condizioni dalle notes
      const conditionsMatch = facture.notes?.match(/Conditions:\s*([^\n]+)/);
      const conditionsPaiement = conditionsMatch ? conditionsMatch[1].trim() : '30 jours net';
      
      // Calcola data scadenza
      const dateEcheance = facture.date_echeance ? 
        new Date(facture.date_echeance).toLocaleDateString('fr-FR') :
        new Date(facture.date_facture).toLocaleDateString('fr-FR');
      
      doc.text(`Conditions de paiement: ${conditionsPaiement}`, 10, conditionsY);
      doc.text(`Date d'échéance: ${dateEcheance}`, 10, conditionsY + 7);
      
      return doc;
    }

    // FATTURA DA MÉTRAGE (versione semplificata)
    if (metrageDoc) {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      let yPos = drawHeader(doc, `FACTURE N. ${facture.numero}`);
      
      // Tabella semplificata prodotti
      if (metrageDoc.items?.length > 0) {
        const tableData = metrageDoc.items.map(item => [
          item.article || '',
          item.nom || '',
          (Number(item.mlPosee || 0)).toFixed(2),
          `${(Number(item.prix || 50)).toFixed(2)} CHF`,
          `${(Number(item.mlPosee || 0) * Number(item.prix || 50)).toFixed(2)} CHF`
        ]);
        
        autoTable(doc, {
          head: [['Code', 'Produit', 'Quantité', 'Prix/U', 'Total']],
          body: tableData,
          startY: yPos,
          theme: 'striped'
        });
        yPos = doc.lastAutoTable.finalY + 10;
      }

      // Totali
      const totalHT = Number(facture.montant_ht || 0);
      const tva = totalHT * 0.081;
      const totalTTC = totalHT + tva;

      yPos += 20;
      doc.setFillColor(245, 245, 245);
      doc.rect(120, yPos - 5, 80, 25, 'F');
      
      doc.setFontSize(10);
      doc.text('Total HT:', 125, yPos + 5);
      doc.text(`${totalHT.toFixed(2)} CHF`, 190, yPos + 5, { align: 'right' });
      doc.text(`TVA (8.1%):`, 125, yPos + 12);
      doc.text(`${tva.toFixed(2)} CHF`, 190, yPos + 12, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL TTC:', 125, yPos + 20);
      doc.text(`${totalTTC.toFixed(2)} CHF`, 190, yPos + 20, { align: 'right' });
      
      // Condizioni di pagamento
      const conditionsY = yPos + 40;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      // Estrai condizioni dalle notes
      const conditionsMatch = facture.notes?.match(/Conditions:\s*([^\n]+)/);
      const conditionsPaiement = conditionsMatch ? conditionsMatch[1].trim() : '30 jours net';
      
      // Calcola data scadenza
      const dateEcheance = facture.date_echeance ? 
        new Date(facture.date_echeance).toLocaleDateString('fr-FR') :
        new Date(facture.date_facture).toLocaleDateString('fr-FR');
      
      doc.text(`Conditions de paiement: ${conditionsPaiement}`, 10, conditionsY);
      doc.text(`Date d'échéance: ${dateEcheance}`, 10, conditionsY + 7);
      
      return doc;
    }

    throw new Error('Tipo fattura non riconosciuto');
    
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    throw error;
  }
}