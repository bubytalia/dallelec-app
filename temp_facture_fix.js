// Sezione PDF Fattura rifatta - da sostituire nel file AdminFacturation.vue

  // 2. GENERA FACTURE (rifatta da zero)
  const docFacture = new jsPDF({ unit: 'mm', format: 'a4' });
  
  // Header con logo
  drawHeader(docFacture, `FACTURE N. ${facture.numero}`);
  
  // Informazioni fattura
  docFacture.setFontSize(9);
  docFacture.setFont('Helvetica', 'normal');
  docFacture.text(`Date: ${formatDate(facture.date_facture || facture.dateFacture)}`, 10, 50);
  
  let yPos = 55;
  if (facture.date_echeance || facture.dateEcheance) {
    docFacture.text(`Échéance: ${formatDate(facture.date_echeance || facture.dateEcheance)}`, 10, yPos);
    yPos += 5;
  }
  
  // Periodo
  if (metrageDoc && (metrageDoc.periode_debut || metrageDoc.periode_fin)) {
    docFacture.text(`Période: ${metrageDoc.periode_debut || ''} - ${metrageDoc.periode_fin || ''}`, 10, yPos);
    yPos += 5;
  }
  
  // Cliente
  docFacture.setFontSize(10);
  docFacture.setFont('Helvetica', 'bold');
  docFacture.text('FACTURÉ À:', 10, yPos + 5);
  
  docFacture.setFontSize(9);
  docFacture.setFont('Helvetica', 'normal');
  const nomeCliente = facture.client_nom || facture.clientNom || chantier?.client || 'Client';
  docFacture.text(nomeCliente, 10, yPos + 12);
  
  // Cantiere
  const numeroCantiere = chantier?.numero_cantiere ? `N° ${chantier.numero_cantiere} - ` : '';
  docFacture.text(`Chantier: ${numeroCantiere}${chantier?.nom || 'N/A'}`, 10, yPos + 19);
  
  // Tabella prodotti (stessi dati del métrage + prezzi)
  let tableY = yPos + 30;
  const tableHead = [['Code', 'Description', 'Zone', 'ML Posé', 'Prix/ML', 'Total HT']];
  const tableBody = [];
  let totalHT = 0;
  
  if (metrageDoc?.items) {
    metrageDoc.items.forEach(item => {
      // Trova prezzo dal devis
      const prodottoDevis = chantierDevis?.produits?.find(p => 
        p.article === item.article
      );
      const prezzoML = Number(prodottoDevis?.prix || 50);
      const mlPosato = Number(item.totalML || 0);
      const totaleItem = mlPosato * prezzoML;
      
      totalHT += totaleItem;
      
      tableBody.push([
        item.article || '',
        item.nom || '',
        item.zone || '',
        mlPosato.toFixed(2),
        `${prezzoML.toFixed(2)} CHF`,
        `${totaleItem.toFixed(2)} CHF`
      ]);
    });
  }
  
  autoTable(docFacture, {
    head: tableHead,
    body: tableBody,
    startY: tableY,
    theme: 'grid',
    headStyles: { fillColor: [230, 230, 230], fontSize: 9 },
    bodyStyles: { fontSize: 8 }
  });
  
  let finalY = docFacture.lastAutoTable.finalY + 10;
  
  // Régies se presenti
  if (metrageDoc?.regies?.length > 0) {
    docFacture.setFontSize(10);
    docFacture.setFont('helvetica', 'bold');
    docFacture.text('RÉGIES', 10, finalY);
    
    const regieHead = [['Zone', 'Description', 'Heures', 'Prix/h', 'Total']];
    const regieBody = [];
    let totalRegies = 0;
    
    metrageDoc.regies.forEach(regie => {
      const totRegie = Number(regie.heures) * Number(regie.prixHeure);
      totalRegies += totRegie;
      
      regieBody.push([
        regie.zone,
        regie.description,
        `${regie.heures}h`,
        `${regie.prixHeure} CHF`,
        `${totRegie.toFixed(2)} CHF`
      ]);
    });
    
    autoTable(docFacture, {
      head: regieHead,
      body: regieBody,
      startY: finalY + 5,
      theme: 'grid',
      headStyles: { fillColor: [230, 230, 230], fontSize: 9 },
      bodyStyles: { fontSize: 8 }
    });
    
    totalHT += totalRegies;
    finalY = docFacture.lastAutoTable.finalY + 10;
  }
  
  // Totali
  const tva = totalHT * 0.081; // 8.1% Svizzera
  const totalTTC = totalHT + tva;
  
  docFacture.setFontSize(10);
  docFacture.text('Total HT:', 140, finalY);
  docFacture.text(`${totalHT.toFixed(2)} CHF`, 180, finalY, { align: 'right' });
  
  docFacture.text('TVA (8.1%):', 140, finalY + 7);
  docFacture.text(`${tva.toFixed(2)} CHF`, 180, finalY + 7, { align: 'right' });
  
  docFacture.setFont('helvetica', 'bold');
  docFacture.text('TOTAL TTC:', 140, finalY + 17);
  docFacture.text(`${totalTTC.toFixed(2)} CHF`, 180, finalY + 17, { align: 'right' });
  
  // Condizioni pagamento
  docFacture.setFontSize(8);
  docFacture.setFont('helvetica', 'normal');
  docFacture.text('Conditions de paiement: 30 jours net', 10, finalY + 35);