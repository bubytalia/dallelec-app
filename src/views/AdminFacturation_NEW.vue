const genererPDF = async (facture) => {
  try {
    // Import logo
    let logo;
    try {
      const logoModule = await import('@/assets/logo.jpg');
      logo = logoModule.default;
    } catch (e) {
      console.warn('Logo non trovato');
    }

    // Dati base
    const chantierId = facture.chantier_id || facture.chantierId;
    const metrageId = facture.metrage_id || facture.metrageId;
    const chantier = chantiers.value.find(c => c.id === chantierId);
    const chantierDevis = devis.value.find(d => d.id === chantier?.devis_id);
    const metrageDoc = metrages.value.find(m => m.id === metrageId);
    const nomeCliente = chantier?.client || facture.client_nom || 'Client';
    const numeroChantier = chantier?.numero_cantiere ? `N° ${chantier.numero_cantiere} - ` : '';
    const nomeChantier = chantier?.nom || 'N/A';

    // Funzioni helper
    const drawHeader = (doc, title) => {
      if (logo) doc.addImage(logo, 'JPEG', 10, 10, 55, 10);
      doc.setFontSize(8);
      doc.text('DALLELEC Sarl\nRue de Bourgogne 25\n1203 Genève', 200, 12, { align: 'right' });
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 10, 40);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${formatDate(facture.date_facture)}`, 10, 50);
      doc.text(`Client: ${nomeCliente}`, 10, 57);
      doc.text(`Chantier: ${numeroChantier}${nomeChantier}`, 10, 64);
    };

    // 1. PDF MÉTRÉES (sans prix)
    const docMetrees = new jsPDF({ unit: 'mm', format: 'a4' });
    drawHeader(docMetrees, `MÉTRÉES DÉTAILLÉES - ${facture.numero}`);
    
    let yPos = 80;
    
    if (metrageDoc?.items) {
      // Raggruppa per zone
      const itemsByZone = {};
      metrageDoc.items.forEach(item => {
        if (!itemsByZone[item.zone]) itemsByZone[item.zone] = [];
        itemsByZone[item.zone].push(item);
      });
      
      // Per ogni zona
      Object.entries(itemsByZone).forEach(([zoneName, items]) => {
        docMetrees.setFontSize(12);
        docMetrees.setFont('helvetica', 'bold');
        docMetrees.text(`Zone: ${zoneName}`, 10, yPos);
        
        // Tabella riepilogo (come devis senza prezzi)
        const tableData = items.map(item => [
          item.article || '',
          item.nom || '',
          item.taille || '',
          'm',
          (Number(item.mlPosee) || 0).toFixed(2),
          (Number(item.totalSuppML) || 0).toFixed(2),
          (Number(item.totalML) || 0).toFixed(2)
        ]);
        
        autoTable(docMetrees, {
          head: [['Code Article', 'Produit', 'Taille', 'Unité', 'Quantité', 'Total Suppl.', 'Total']],
          body: tableData,
          startY: yPos + 5,
          theme: 'grid',
          headStyles: { fillColor: [230, 230, 230], fontSize: 8 },
          bodyStyles: { fontSize: 8 }
        });
        
        yPos = docMetrees.lastAutoTable.finalY + 5;
        
        // Sous-total zone
        const zoneTotal = items.reduce((sum, item) => sum + (Number(item.totalML) || 0), 0);
        docMetrees.setFont('helvetica', 'bold');
        docMetrees.text(`Sous-total: ${zoneTotal.toFixed(2)} ML`, 150, yPos);
        yPos += 15;
      });
      
      // Détail suppléments par zone
      yPos += 10;
      docMetrees.setFontSize(14);
      docMetrees.setFont('helvetica', 'bold');
      docMetrees.text('Détail des Suppléments par Zone', 10, yPos);
      yPos += 10;
      
      Object.entries(itemsByZone).forEach(([zoneName, items]) => {
        docMetrees.setFontSize(12);
        docMetrees.setFont('helvetica', 'bold');
        docMetrees.text(`Zone: ${zoneName}`, 10, yPos);
        yPos += 5;
        
        // Raggruppa supplementi per prodotto
        const suppByProduct = {};
        items.forEach(item => {
          if (item.supplements?.length > 0) {
            const key = `${item.article}-${item.nom}-${item.taille}`;
            if (!suppByProduct[key]) {
              suppByProduct[key] = {
                article: item.article,
                nom: item.nom,
                taille: item.taille,
                supplements: []
              };
            }
            suppByProduct[key].supplements.push(...item.supplements);
          }
        });
        
        Object.values(suppByProduct).forEach(product => {
          const suppData = product.supplements.map(supp => [
            product.article,
            product.nom,
            product.taille,
            supp.supplement || supp.nom || '',
            (Number(supp.qte) || 0).toString(),
            (Number(supp.valeur) || 0).toFixed(1),
            ((Number(supp.qte) || 0) * (Number(supp.valeur) || 0)).toFixed(2) + ' ML'
          ]);
          
          const totalSupp = product.supplements.reduce((sum, s) => 
            sum + ((Number(s.qte) || 0) * (Number(s.valeur) || 0)), 0
          );
          
          suppData.push([
            '', '', '', 
            { content: `Total Suppléments (${product.nom}):`, colSpan: 3, styles: { fontStyle: 'bold' } },
            { content: `${totalSupp.toFixed(2)} ML`, styles: { fontStyle: 'bold' } }
          ]);
          
          autoTable(docMetrees, {
            head: [['Code Article', 'Produit', 'Taille', 'Supplément', 'Qté', 'Valeur', 'Total ML']],
            body: suppData,
            startY: yPos,
            theme: 'grid',
            headStyles: { fillColor: [230, 230, 230], fontSize: 8 },
            bodyStyles: { fontSize: 8 }
          });
          
          yPos = docMetrees.lastAutoTable.finalY + 5;
        });
        
        yPos += 10;
      });
    }
    
    // 2. PDF FACTURE (avec prix)
    const docFacture = new jsPDF({ unit: 'mm', format: 'a4' });
    drawHeader(docFacture, `FACTURE N. ${facture.numero}`);
    
    yPos = 80;
    let totalFactureHT = 0;
    
    if (metrageDoc?.items) {
      // Raggruppa per zone
      const itemsByZone = {};
      metrageDoc.items.forEach(item => {
        if (!itemsByZone[item.zone]) itemsByZone[item.zone] = [];
        itemsByZone[item.zone].push(item);
      });
      
      // Per ogni zona con prezzi
      Object.entries(itemsByZone).forEach(([zoneName, items]) => {
        docFacture.setFontSize(12);
        docFacture.setFont('helvetica', 'bold');
        docFacture.text(`Zone: ${zoneName}`, 10, yPos);
        
        let zoneTotal = 0;
        const tableData = items.map(item => {
          const prodottoDevis = chantierDevis?.produits?.find(p => p.article === item.article);
          const prezzoUnit = Number(prodottoDevis?.prix || 50);
          const totalML = Number(item.totalML) || 0;
          const totalItem = totalML * prezzoUnit;
          zoneTotal += totalItem;
          totalFactureHT += totalItem;
          
          return [
            item.article || '',
            item.nom || '',
            item.taille || '',
            'm',
            (Number(item.mlPosee) || 0).toFixed(2),
            (Number(item.totalSuppML) || 0).toFixed(2),
            totalML.toFixed(2),
            `${prezzoUnit.toFixed(2)}€`,
            `${totalItem.toFixed(2)}€`
          ];
        });
        
        autoTable(docFacture, {
          head: [['Code Article', 'Produit', 'Taille', 'Unité', 'Quantité', 'Total Suppl.', 'Total', 'Prix Unit.', 'Total']],
          body: tableData,
          startY: yPos + 5,
          theme: 'grid',
          headStyles: { fillColor: [230, 230, 230], fontSize: 8 },
          bodyStyles: { fontSize: 8 }
        });
        
        yPos = docFacture.lastAutoTable.finalY + 5;
        
        // Sous-total zone
        docFacture.setFont('helvetica', 'bold');
        docFacture.text(`Sous-total: ${zoneTotal.toFixed(2)}€`, 150, yPos);
        yPos += 15;
      });
    }
    
    // Régies se presenti
    if (metrageDoc?.regies?.length > 0) {
      docFacture.setFontSize(12);
      docFacture.setFont('helvetica', 'bold');
      docFacture.text('RÉGIES', 10, yPos);
      
      const regieData = metrageDoc.regies.map(regie => {
        const total = (Number(regie.heures) || 0) * (Number(regie.prixHeure) || 0);
        totalFactureHT += total;
        return [
          regie.zone || '',
          regie.description || '',
          `${regie.heures || 0}h`,
          `${(Number(regie.prixHeure) || 0).toFixed(2)}€`,
          `${total.toFixed(2)}€`
        ];
      });
      
      autoTable(docFacture, {
        head: [['Zone', 'Description', 'Heures', 'Prix/h', 'Total']],
        body: regieData,
        startY: yPos + 5,
        theme: 'grid',
        headStyles: { fillColor: [230, 230, 230], fontSize: 9 },
        bodyStyles: { fontSize: 8 }
      });
      
      yPos = docFacture.lastAutoTable.finalY + 10;
    }
    
    // Totali finali
    const realMontantHT = Number(facture.montant_ht) || totalFactureHT;
    const realTauxTVA = Number(facture.taux_tva) || 7.7;
    const realMontantTVA = realMontantHT * (realTauxTVA / 100);
    const realMontantTTC = realMontantHT + realMontantTVA;
    
    docFacture.setFontSize(10);
    docFacture.text(`Total HT: ${realMontantHT.toFixed(2)} CHF`, 140, yPos);
    docFacture.text(`TVA (${realTauxTVA}%): ${realMontantTVA.toFixed(2)} CHF`, 140, yPos + 7);
    docFacture.setFont('helvetica', 'bold');
    docFacture.text(`TOTAL TTC: ${realMontantTTC.toFixed(2)} CHF`, 140, yPos + 17);
    
    // Salva documenti
    docMetrees.save(`Metrees_Detaillees_${facture.numero}.pdf`);
    docFacture.save(`Facture_${facture.numero}.pdf`);
    
    alert('Deux documents générés:\n1. Métrées détaillées (pour technicien)\n2. Facture (pour comptabilité)');
    
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    alert('Erreur génération PDF: ' + error.message);
  }
};